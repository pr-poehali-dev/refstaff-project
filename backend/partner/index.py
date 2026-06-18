"""
Партнёрская программа для HR-партнёров.
Регистрация и вход через Telegram/MAX, статистика, рефералы, выплаты, профиль с реквизитами.
action=register|create_login_session|check_login_session|verify_login_code|complete_registration|profile|update_profile|referrals|payouts|request_payout
"""
import json
import os
import string
import random
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import urllib.request
import requests as http_requests

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Partner-Token',
    'Content-Type': 'application/json',
}

SCHEMA = 't_p65890965_refstaff_project'
MAX_API = 'https://platform-api.max.ru'

# Стоимость подписки для расчёта комиссии (50%)
SUBSCRIPTION_PRICES = {
    30: 9900,    # 1 месяц — 9 900 ₽
    365: 89900,  # 1 год — 89 900 ₽
}
COMMISSION_RATE = 0.5  # 50%
HOLD_DAYS = 30


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)


def generate_partner_code(name: str) -> str:
    prefix = ''.join(c for c in name.upper()[:4] if c.isalpha()) or 'HR'
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"{prefix}{suffix}"


def generate_code() -> str:
    return ''.join(random.choices(string.digits, k=6))


def generate_token(n=16) -> str:
    return os.urandom(n).hex()


def tg_send(token: str, chat_id: int, text: str):
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def max_send(token: str, user_id: int, text: str):
    url = f'{MAX_API}/messages?user_id={user_id}'
    headers = {'Authorization': token, 'Content-Type': 'application/json'}
    r = http_requests.post(url, json={'text': text}, headers=headers, timeout=10)
    return r.json()


def notify_partner(partner: dict, tg_bot_token: str, max_bot_token: str, msg: str):
    if partner.get('telegram_chat_id') and tg_bot_token:
        try:
            tg_send(tg_bot_token, partner['telegram_chat_id'], msg)
        except Exception:
            pass
    if partner.get('max_user_id') and max_bot_token:
        try:
            max_send(max_bot_token, partner['max_user_id'], msg)
        except Exception:
            pass


def get_partner_by_token(conn, token: str):
    with conn.cursor() as cur:
        cur.execute(
            f"""SELECT id, name, email, phone, partner_code, balance, total_earned,
                clients_invited, clients_registered, status, created_at,
                telegram_chat_id, max_user_id,
                payment_method, payment_details, inn, company_name, notes
                FROM {SCHEMA}.hr_partners WHERE partner_code = %s""",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return None
        d = dict(row)
        d['balance'] = float(d['balance'] or 0)
        d['total_earned'] = float(d['total_earned'] or 0)
        d['created_at'] = str(d['created_at'])
        return d


def mask_email(email: str) -> str:
    if not email or '@' not in email:
        return email or ''
    local, domain = email.split('@', 1)
    if len(local) <= 2:
        return f"{'*' * len(local)}@{domain}"
    return f"{local[0]}{'*' * (len(local) - 2)}{local[-1]}@{domain}"


def mask_phone(phone: str) -> str:
    if not phone:
        return ''
    digits = ''.join(c for c in phone if c.isdigit())
    if len(digits) >= 4:
        return phone[:3] + '*' * (len(phone) - 6) + phone[-3:]
    return '*' * len(phone)


def resp(status: int, body: dict):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(body, ensure_ascii=False, default=str)}


def handler(event: dict, context) -> dict:
    """Партнёрская программа: вход через Telegram/MAX, рефералы с комиссией, профиль с реквизитами."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    qs = event.get('queryStringParameters') or {}
    action = qs.get('action', 'profile')
    body = json.loads(event.get('body') or '{}')
    partner_token = (event.get('headers') or {}).get('X-Partner-Token', '').strip()

    tg_bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    tg_bot_username = os.environ.get('TELEGRAM_BOT_USERNAME', '')
    max_bot_token = os.environ.get('MAX_BOT_TOKEN', '')
    max_bot_username = os.environ.get('MAX_BOT_USERNAME', '')

    conn = get_conn()
    try:
        # ── WEBHOOK от Telegram ──────────────────────────────────────────────────
        if 'update_id' in body:
            message = body.get('message', {})
            text = message.get('text', '')
            chat_id = message.get('chat', {}).get('id')
            if not chat_id or not text.startswith('/start'):
                return {'statusCode': 200, 'body': 'ok'}

            parts = text.strip().split(' ', 1)
            session_token = parts[1].strip() if len(parts) > 1 else ''
            if not session_token:
                return {'statusCode': 200, 'body': 'ok'}

            with conn.cursor() as cur:
                # Принимаем pending и code_sent — на случай повторного нажатия /start
                cur.execute(
                    f"SELECT * FROM {SCHEMA}.partner_login_sessions WHERE session_token = %s AND status IN ('pending','code_sent') AND expires_at > NOW() - INTERVAL '60 minutes'",
                    (session_token,)
                )
                session = cur.fetchone()
                if not session:
                    print(f"TG: session not found for token={session_token[:8]}...")
                    tg_send(tg_bot_token, chat_id, '❌ Ссылка недействительна или истекла. Вернитесь на сайт и попробуйте снова.')
                    return {'statusCode': 200, 'body': 'ok'}

                cur.execute(f"SELECT * FROM {SCHEMA}.hr_partners WHERE telegram_chat_id = %s AND status = 'active'", (chat_id,))
                partner = cur.fetchone()

                code = generate_code()
                expires_at = datetime.utcnow() + timedelta(minutes=30)

                if not partner:
                    # Новый пользователь — сохраняем chat_id, ждём заполнения профиля
                    cur.execute(
                        f"UPDATE {SCHEMA}.partner_login_sessions SET status='code_sent', chat_id=%s, code=%s, expires_at=%s WHERE session_token=%s",
                        (chat_id, code, expires_at, session_token)
                    )
                    conn.commit()
                    tg_send(tg_bot_token, chat_id,
                        f"👋 Добро пожаловать в партнёрскую программу iHUNT!\n\n"
                        f"🔐 Ваш код для входа:\n\n<b>{code}</b>\n\n"
                        f"Введите этот код на сайте. Код действует <b>30 минут</b>."
                    )
                    return {'statusCode': 200, 'body': 'ok'}

                cur.execute(
                    f"UPDATE {SCHEMA}.partner_login_sessions SET status='code_sent', chat_id=%s, code=%s, partner_id=%s, expires_at=%s WHERE session_token=%s",
                    (chat_id, code, partner['id'], expires_at, session_token)
                )
                conn.commit()

            tg_send(tg_bot_token, chat_id,
                f"👋 Привет, {partner['name']}!\n\n"
                f"🔐 Ваш код для входа в партнёрский кабинет iHUNT:\n\n<b>{code}</b>\n\n"
                f"Введите этот код на сайте. Код действует <b>30 минут</b>."
            )
            return {'statusCode': 200, 'body': 'ok'}

        # ── WEBHOOK от MAX ───────────────────────────────────────────────────────
        if body.get('update_type') in ('bot_started', 'message_created'):
            update_type = body.get('update_type')
            print(f"MAX webhook update_type={update_type} body={json.dumps(body)[:500]}")
            if update_type == 'bot_started':
                payload_data = body.get('payload', {})
                user_info = payload_data.get('user', {})
                user_id = user_info.get('user_id') or user_info.get('id')
                start_payload = payload_data.get('payload', '') or payload_data.get('start_payload', '')
            else:
                # message_created — текст "/start TOKEN" или просто TOKEN
                payload_data = body.get('message', body.get('payload', {}).get('message', {}))
                user_id = (payload_data.get('sender') or {}).get('user_id') or (payload_data.get('sender') or {}).get('id')
                raw_text = (payload_data.get('body') or {}).get('text', '')
                # Парсим как "/start TOKEN" или просто токен
                parts = raw_text.strip().split()
                if len(parts) >= 2 and parts[0].lower() in ('/start', 'start'):
                    start_payload = parts[1]
                else:
                    start_payload = raw_text.strip()
            print(f"MAX parsed: user_id={user_id} start_payload={start_payload}")

            if not user_id or not start_payload:
                return {'statusCode': 200, 'body': 'ok'}

            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT * FROM {SCHEMA}.partner_login_sessions WHERE session_token = %s AND status = 'pending' AND expires_at > NOW()",
                    (start_payload,)
                )
                session = cur.fetchone()
                if not session:
                    return {'statusCode': 200, 'body': 'ok'}

                cur.execute(f"SELECT * FROM {SCHEMA}.hr_partners WHERE max_user_id = %s AND status = 'active'", (user_id,))
                partner = cur.fetchone()

                code = generate_code()
                expires_at = datetime.utcnow() + timedelta(minutes=30)

                if not partner:
                    # Новый пользователь — сохраняем chat_id, partner_id оставляем NULL
                    cur.execute(
                        f"UPDATE {SCHEMA}.partner_login_sessions SET status='code_sent', chat_id=%s, code=%s, expires_at=%s WHERE session_token=%s",
                        (user_id, code, expires_at, start_payload)
                    )
                    conn.commit()
                    max_send(max_bot_token, user_id,
                        f"👋 Добро пожаловать в партнёрскую программу iHUNT!\n\n"
                        f"🔐 Ваш код для входа:\n\n{code}\n\n"
                        f"Введите этот код на сайте. Код действует 10 минут."
                    )
                    return {'statusCode': 200, 'body': 'ok'}

                cur.execute(
                    f"UPDATE {SCHEMA}.partner_login_sessions SET status='code_sent', chat_id=%s, code=%s, partner_id=%s, expires_at=%s WHERE session_token=%s",
                    (user_id, code, partner['id'], expires_at, start_payload)
                )
                conn.commit()

            max_send(max_bot_token, user_id,
                f"👋 Привет, {partner['name']}!\n\n"
                f"🔐 Ваш код для входа в партнёрский кабинет iHUNT:\n\n{code}\n\n"
                f"Введите этот код на сайте. Код действует 10 минут."
            )
            return {'statusCode': 200, 'body': 'ok'}

        # ── Создать сессию входа через Telegram или MAX ───────────────────────────
        if action == 'create_login_session' and method == 'POST':
            messenger = body.get('messenger', 'telegram')
            session_token = generate_token()
            expires_at = datetime.utcnow() + timedelta(minutes=60)
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.partner_login_sessions (session_token, messenger, expires_at) VALUES (%s, %s, %s)",
                    (session_token, messenger, expires_at)
                )
                conn.commit()

            if messenger == 'telegram':
                deep_link = f"https://t.me/{tg_bot_username}?start={session_token}"
            else:
                deep_link = f"https://max.ru/{max_bot_username}?start={session_token}"

            return resp(200, {'session_token': session_token, 'deep_link': deep_link})

        # ── Проверить статус сессии (поллинг) ────────────────────────────────────
        if action == 'check_login_session' and method == 'POST':
            session_token = body.get('session_token', '').strip()
            with conn.cursor() as cur:
                cur.execute(f"SELECT status FROM {SCHEMA}.partner_login_sessions WHERE session_token = %s", (session_token,))
                row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Сессия не найдена'})
            return resp(200, {'status': row['status']})

        # ── Подтвердить код из мессенджера ────────────────────────────────────────
        if action == 'verify_login_code' and method == 'POST':
            session_token = body.get('session_token', '').strip()
            code = body.get('code', '').strip()

            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, partner_id, messenger, chat_id, status, code, expires_at FROM {SCHEMA}.partner_login_sessions WHERE session_token = %s AND code = %s AND (status IN ('code_sent', 'verified')) AND expires_at > NOW() - INTERVAL '60 minutes'",
                    (session_token, code)
                )
                session = cur.fetchone()
                if not session:
                    # Дополнительная диагностика — ищем без фильтра по коду
                    cur.execute(
                        f"SELECT status, code, expires_at FROM {SCHEMA}.partner_login_sessions WHERE session_token = %s",
                        (session_token,)
                    )
                    debug = cur.fetchone()
                    print(f"verify_login_code FAIL: session_token={session_token[:8]}... input_code={code} db={dict(debug) if debug else 'NOT FOUND'}")
                    return resp(400, {'error': 'Неверный или истёкший код'})

                session = dict(session)
                partner_id = session.get('partner_id')

                if not partner_id:
                    cur.execute(f"UPDATE {SCHEMA}.partner_login_sessions SET status='verified' WHERE session_token=%s", (session_token,))
                    conn.commit()
                    return resp(200, {
                        'need_registration': True,
                        'session_token': session_token,
                        'messenger': session.get('messenger', ''),
                        'chat_id': str(session.get('chat_id', '')),
                    })
                else:
                    cur.execute(
                        f"""SELECT id, name, email, phone, partner_code, balance, total_earned,
                            clients_invited, clients_registered, status, created_at,
                            payment_method, payment_details, inn, company_name, notes
                            FROM {SCHEMA}.hr_partners WHERE id = %s""",
                        (partner_id,)
                    )
                    row = cur.fetchone()
                    if not row:
                        return resp(404, {'error': 'Партнёр не найден'})
                    cur.execute(f"UPDATE {SCHEMA}.partner_login_sessions SET status='verified' WHERE session_token=%s", (session_token,))
                    conn.commit()
                    d = dict(row)
                    d['balance'] = float(d['balance'] or 0)
                    d['total_earned'] = float(d['total_earned'] or 0)
                    d['created_at'] = str(d['created_at'])
                    return resp(200, d)

        # ── Завершить регистрацию (после подтверждения мессенджера) ──────────────
        if action == 'complete_registration' and method == 'POST':
            session_token = body.get('session_token', '').strip()
            name = body.get('name', '').strip()
            email = body.get('email', '').strip().lower()
            phone = body.get('phone', '').strip()
            messenger_type = body.get('messenger', 'telegram')
            chat_id_val = body.get('chat_id', '').strip()

            if not name:
                return resp(400, {'error': 'Укажите имя'})
            if not session_token:
                return resp(400, {'error': 'Неверные данные сессии'})

            # Читаем chat_id из БД — надёжнее чем из тела запроса
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT chat_id, messenger FROM {SCHEMA}.partner_login_sessions WHERE session_token = %s AND status IN ('verified', 'code_sent')",
                    (session_token,)
                )
                sess_row = cur.fetchone()
            if not sess_row:
                return resp(400, {'error': 'Сессия не найдена или истекла'})

            db_chat_id = sess_row['chat_id'] or (int(chat_id_val) if chat_id_val else None)
            db_messenger = sess_row['messenger'] or messenger_type

            tg_id = int(db_chat_id) if db_chat_id and db_messenger == 'telegram' else None
            max_id = int(db_chat_id) if db_chat_id and db_messenger == 'max' else None

            partner_code = generate_partner_code(name)
            partner = None

            with conn.cursor() as cur:
                if tg_id:
                    cur.execute(f"SELECT * FROM {SCHEMA}.hr_partners WHERE telegram_chat_id = %s", (tg_id,))
                else:
                    cur.execute(f"SELECT * FROM {SCHEMA}.hr_partners WHERE max_user_id = %s", (max_id,))
                existing = cur.fetchone()
                if existing:
                    partner = dict(existing)
                else:
                    for _ in range(5):
                        cur.execute(f"SELECT id FROM {SCHEMA}.hr_partners WHERE partner_code = %s", (partner_code,))
                        if not cur.fetchone():
                            break
                        partner_code = generate_partner_code(name)

                    try:
                        cur.execute(
                            f"INSERT INTO {SCHEMA}.hr_partners (name, email, phone, partner_code, telegram_chat_id, max_user_id) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                            (name, email or None, phone or None, partner_code, tg_id, max_id)
                        )
                        new_id = cur.fetchone()['id']
                        cur.execute(
                            f"UPDATE {SCHEMA}.partner_login_sessions SET partner_id=%s WHERE session_token=%s",
                            (new_id, session_token)
                        )
                        conn.commit()
                        cur.execute(f"SELECT * FROM {SCHEMA}.hr_partners WHERE id = %s", (new_id,))
                        partner = dict(cur.fetchone())
                    except Exception as e:
                        conn.rollback()
                        if 'unique' in str(e).lower():
                            return resp(409, {'error': 'Партнёр с таким email уже зарегистрирован'})
                        raise

            d = dict(partner)
            d['balance'] = float(d.get('balance') or 0)
            d['total_earned'] = float(d.get('total_earned') or 0)
            d['created_at'] = str(d.get('created_at', ''))
            d.pop('telegram_chat_id', None)
            d.pop('max_user_id', None)
            return resp(200, d)

        # ── Все остальные действия требуют токена ─────────────────────────────────
        if not partner_token:
            return resp(401, {'error': 'Требуется токен партнёра'})

        partner = get_partner_by_token(conn, partner_token)
        if not partner:
            return resp(404, {'error': 'Партнёр не найден'})

        partner_id = partner['id']

        # ── Профиль партнёра ──────────────────────────────────────────────────────
        if action == 'profile':
            return resp(200, partner)

        # ── Обновить профиль / реквизиты ─────────────────────────────────────────
        if action == 'update_profile' and method == 'POST':
            name = body.get('name', '').strip() or partner['name']
            email = body.get('email', '').strip().lower() or partner['email']
            phone = body.get('phone', '').strip()
            payment_method = body.get('payment_method', '').strip()
            payment_details = body.get('payment_details', '').strip()
            inn = body.get('inn', '').strip()
            company_name = body.get('company_name', '').strip()
            notes = body.get('notes', '').strip()

            with conn.cursor() as cur:
                cur.execute(
                    f"""UPDATE {SCHEMA}.hr_partners
                        SET name=%s, email=%s, phone=%s, payment_method=%s,
                            payment_details=%s, inn=%s, company_name=%s, notes=%s,
                            updated_at=NOW()
                        WHERE id=%s""",
                    (name, email, phone or None, payment_method or None,
                     payment_details or None, inn or None, company_name or None,
                     notes or None, partner_id)
                )
                conn.commit()
            return resp(200, {'success': True})

        # ── Список клиентов (рефералов) с комиссией и hold ───────────────────────
        if action == 'referrals' and method == 'GET':
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id, company_name, contact_name, contact_email, contact_phone,
                               status, source, created_at,
                               commission_amount, commission_available_at,
                               subscription_tier, subscription_expires_at, subscription_set_at
                        FROM {SCHEMA}.partner_referrals
                        WHERE partner_id = %s
                        ORDER BY created_at DESC""",
                    (partner_id,)
                )
                referrals = []
                now = datetime.utcnow()
                for r in cur.fetchall():
                    d = dict(r)
                    # Маскируем контакты
                    d['contact_email'] = mask_email(d.get('contact_email') or '')
                    d['contact_phone'] = mask_phone(d.get('contact_phone') or '')
                    # Первые 2 буквы имени + ***
                    cn = d.get('contact_name') or ''
                    d['contact_name'] = (cn[:2] + '***') if len(cn) > 2 else cn
                    # Числа
                    d['commission_amount'] = float(d['commission_amount'] or 0)
                    # Hold статус
                    avail = d.get('commission_available_at')
                    if avail:
                        d['hold_days_left'] = max(0, (avail - now).days)
                        d['commission_available'] = avail <= now
                    else:
                        d['hold_days_left'] = None
                        d['commission_available'] = False
                    # Даты в строки
                    for k in ('created_at', 'commission_available_at', 'subscription_expires_at', 'subscription_set_at'):
                        if d.get(k):
                            d[k] = str(d[k])
                    referrals.append(d)
            return resp(200, referrals)

        # ── Добавить клиента вручную ──────────────────────────────────────────────
        if action == 'add_referral' and method == 'POST':
            company_name = body.get('company_name', '').strip()
            contact_name = body.get('contact_name', '').strip()
            contact_email = body.get('contact_email', '').strip().lower()
            contact_phone = body.get('contact_phone', '').strip()
            source = body.get('source', 'link')

            if not company_name:
                return resp(400, {'error': 'Название компании обязательно'})

            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.partner_referrals (partner_id, company_name, contact_name, contact_email, contact_phone, source) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                    (partner_id, company_name, contact_name or None, contact_email or None, contact_phone or None, source)
                )
                ref_id = cur.fetchone()['id']
                cur.execute(f"UPDATE {SCHEMA}.hr_partners SET clients_invited = clients_invited + 1, updated_at = NOW() WHERE id = %s", (partner_id,))
                conn.commit()

            notify_partner(partner, tg_bot_token, max_bot_token,
                f"✅ Новый клиент добавлен!\n\n"
                f"🏢 Компания: {company_name}\n"
                f"👤 Контакт: {contact_name or '—'}\n"
                f"📧 Email: {contact_email or '—'}"
            )
            return resp(200, {'id': ref_id, 'success': True})

        # ── История выплат ────────────────────────────────────────────────────────
        if action == 'payouts' and method == 'GET':
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, amount, payment_method, payment_details, status, admin_comment, created_at FROM {SCHEMA}.partner_payout_requests WHERE partner_id = %s ORDER BY created_at DESC",
                    (partner_id,)
                )
                payouts = [dict(p) for p in cur.fetchall()]
                for p in payouts:
                    p['amount'] = float(p['amount'] or 0)
                    p['created_at'] = str(p['created_at'])
            return resp(200, payouts)

        # ── Запрос на выплату ─────────────────────────────────────────────────────
        if action == 'request_payout' and method == 'POST':
            amount = float(body.get('amount', 0))
            payment_method = body.get('payment_method', '').strip()
            payment_details = body.get('payment_details', '').strip()

            if amount <= 0:
                return resp(400, {'error': 'Укажите корректную сумму'})
            if partner['balance'] < amount:
                return resp(400, {'error': 'Недостаточно средств на балансе'})
            if not payment_method or not payment_details:
                return resp(400, {'error': 'Укажите способ и реквизиты выплаты'})

            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.partner_payout_requests (partner_id, amount, payment_method, payment_details) VALUES (%s, %s, %s, %s) RETURNING id",
                    (partner_id, amount, payment_method, payment_details)
                )
                payout_id = cur.fetchone()['id']
                conn.commit()

            notify_partner(partner, tg_bot_token, max_bot_token,
                f"💰 Запрос на выплату отправлен!\n\n"
                f"Сумма: {amount:,.0f} ₽\n"
                f"Способ: {payment_method}\n"
                f"Реквизиты: {payment_details}\n\n"
                f"Мы обработаем запрос в течение 2 рабочих дней."
            )
            return resp(200, {'id': payout_id, 'success': True})

        return resp(400, {'error': 'Неизвестное действие'})

    finally:
        conn.close()