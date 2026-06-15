"""
Партнёрская программа для HR-партнёров.
Регистрация и вход через Telegram/MAX, статистика, рефералы, выплаты.
action=register|create_login_session|check_login_session|verify_login_code|profile|referrals|add_referral|payouts|request_payout
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


def get_partner_by_token(conn, token: str):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, name, email, phone, partner_code, balance, total_earned, clients_invited, clients_registered, status, created_at, telegram_chat_id, max_user_id FROM {SCHEMA}.hr_partners WHERE partner_code = %s",
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


def resp(status: int, body: dict):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(body, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Партнёрская программа: регистрация/вход через Telegram или MAX, статистика, рефералы, выплаты."""
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
                cur.execute(
                    f"SELECT * FROM {SCHEMA}.partner_login_sessions WHERE session_token = %s AND status = 'pending' AND expires_at > NOW()",
                    (session_token,)
                )
                session = cur.fetchone()
                if not session:
                    tg_send(tg_bot_token, chat_id, '❌ Ссылка недействительна или истекла. Вернитесь на сайт и попробуйте снова.')
                    return {'statusCode': 200, 'body': 'ok'}

                # Ищем партнёра по telegram_chat_id
                cur.execute(f"SELECT * FROM {SCHEMA}.hr_partners WHERE telegram_chat_id = %s AND status = 'active'", (chat_id,))
                partner = cur.fetchone()

                if not partner:
                    # Первый вход — партнёр ещё не привязан к TG
                    tg_send(tg_bot_token, chat_id,
                        '⚠️ Ваш Telegram не привязан к партнёрскому аккаунту.\n\n'
                        'Обратитесь к администратору iHUNT для привязки вашего Telegram к партнёрскому аккаунту.'
                    )
                    return {'statusCode': 200, 'body': 'ok'}

                code = generate_code()
                expires_at = datetime.utcnow() + timedelta(minutes=10)
                cur.execute(
                    f"UPDATE {SCHEMA}.partner_login_sessions SET status='code_sent', chat_id=%s, code=%s, partner_id=%s, expires_at=%s WHERE session_token=%s",
                    (chat_id, code, partner['id'], expires_at, session_token)
                )
                conn.commit()

            tg_send(tg_bot_token, chat_id,
                f"👋 Привет, {partner['name']}!\n\n"
                f"🔐 Ваш код для входа в партнёрский кабинет iHUNT:\n\n<b>{code}</b>\n\n"
                f"Введите этот код на сайте. Код действует <b>10 минут</b>."
            )
            return {'statusCode': 200, 'body': 'ok'}

        # ── WEBHOOK от MAX ───────────────────────────────────────────────────────
        if body.get('update_type') in ('bot_started', 'message_created'):
            update_type = body.get('update_type')
            if update_type == 'bot_started':
                payload_data = body.get('payload', {})
                user_id = payload_data.get('user', {}).get('user_id')
                start_payload = payload_data.get('payload', '')
            else:
                payload_data = body.get('message', body.get('payload', {}).get('message', {}))
                user_id = payload_data.get('sender', {}).get('user_id')
                start_payload = payload_data.get('body', {}).get('text', '')

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

                # Ищем партнёра по max_user_id
                cur.execute(f"SELECT * FROM {SCHEMA}.hr_partners WHERE max_user_id = %s AND status = 'active'", (user_id,))
                partner = cur.fetchone()

                if not partner:
                    max_send(max_bot_token, user_id,
                        '⚠️ Ваш MAX не привязан к партнёрскому аккаунту.\n\n'
                        'Обратитесь к администратору iHUNT для привязки.'
                    )
                    return {'statusCode': 200, 'body': 'ok'}

                code = generate_code()
                expires_at = datetime.utcnow() + timedelta(minutes=10)
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

        # ── Регистрация — публичный эндпоинт ────────────────────────────────────
        if action == 'register' and method == 'POST':
            name = body.get('name', '').strip()
            email = body.get('email', '').strip().lower()
            phone = body.get('phone', '').strip()

            if not name or not email:
                return resp(400, {'error': 'Имя и email обязательны'})

            partner_code = generate_partner_code(name)
            with conn.cursor() as cur:
                for _ in range(5):
                    cur.execute(f"SELECT id FROM {SCHEMA}.hr_partners WHERE partner_code = %s", (partner_code,))
                    if not cur.fetchone():
                        break
                    partner_code = generate_partner_code(name)
                try:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.hr_partners (name, email, phone, partner_code) VALUES (%s, %s, %s, %s) RETURNING id, partner_code",
                        (name, email, phone or None, partner_code)
                    )
                    row = cur.fetchone()
                    conn.commit()
                    return resp(200, {'id': row['id'], 'partner_code': row['partner_code']})
                except Exception as e:
                    conn.rollback()
                    if 'unique' in str(e).lower():
                        return resp(409, {'error': 'Партнёр с таким email уже зарегистрирован'})
                    raise

        # ── Создать сессию входа через Telegram или MAX (без кода партнёра) ───────
        if action == 'create_login_session' and method == 'POST':
            messenger = body.get('messenger', 'telegram')

            session_token = generate_token()
            expires_at = datetime.utcnow() + timedelta(minutes=15)
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
                    f"SELECT * FROM {SCHEMA}.partner_login_sessions WHERE session_token = %s AND status = 'code_sent' AND code = %s AND expires_at > NOW()",
                    (session_token, code)
                )
                session = cur.fetchone()
                if not session:
                    return resp(400, {'error': 'Неверный или истёкший код'})

                # Если partner_id не задан — это новый партнёр, нужна регистрация
                if not session['partner_id']:
                    cur.execute(f"UPDATE {SCHEMA}.partner_login_sessions SET status='verified' WHERE session_token=%s", (session_token,))
                    conn.commit()
                    return resp(200, {
                        'need_registration': True,
                        'session_token': session_token,
                        'messenger': session['messenger'],
                        'chat_id': str(session['chat_id']),
                    })

                cur.execute(f"SELECT * FROM {SCHEMA}.hr_partners WHERE id = %s", (session['partner_id'],))
                partner = cur.fetchone()
                if not partner:
                    return resp(404, {'error': 'Партнёр не найден'})

                cur.execute(f"UPDATE {SCHEMA}.partner_login_sessions SET status='verified' WHERE session_token=%s", (session_token,))
                conn.commit()

            d = dict(partner)
            d['balance'] = float(d['balance'] or 0)
            d['total_earned'] = float(d['total_earned'] or 0)
            d['created_at'] = str(d['created_at'])
            d.pop('telegram_chat_id', None)
            d.pop('max_user_id', None)
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
            if not session_token or not chat_id_val:
                return resp(400, {'error': 'Неверные данные сессии'})

            partner_code = generate_partner_code(name)
            with conn.cursor() as cur:
                for _ in range(5):
                    cur.execute(f"SELECT id FROM {SCHEMA}.hr_partners WHERE partner_code = %s", (partner_code,))
                    if not cur.fetchone():
                        break
                    partner_code = generate_partner_code(name)

                tg_id = int(chat_id_val) if messenger_type == 'telegram' else None
                max_id = int(chat_id_val) if messenger_type == 'max' else None

                try:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.hr_partners (name, email, phone, partner_code, telegram_chat_id, max_user_id) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, partner_code",
                        (name, email or None, phone or None, partner_code, tg_id, max_id)
                    )
                    row = cur.fetchone()
                    new_id = row['id']
                    cur.execute(
                        f"UPDATE {SCHEMA}.partner_login_sessions SET partner_id=%s WHERE session_token=%s",
                        (new_id, session_token)
                    )
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    if 'unique' in str(e).lower():
                        return resp(409, {'error': 'Партнёр с таким email уже зарегистрирован'})
                    raise

                cur.execute(f"SELECT * FROM {SCHEMA}.hr_partners WHERE id = %s", (new_id,))
                partner = cur.fetchone()

            d = dict(partner)
            d['balance'] = float(d['balance'] or 0)
            d['total_earned'] = float(d['total_earned'] or 0)
            d['created_at'] = str(d['created_at'])
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

        if action == 'profile':
            return resp(200, partner)

        if action == 'referrals' and method == 'GET':
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, company_name, contact_name, contact_email, contact_phone, status, source, promo_code, created_at FROM {SCHEMA}.partner_referrals WHERE partner_id = %s ORDER BY created_at DESC",
                    (partner_id,)
                )
                referrals = [dict(r) for r in cur.fetchall()]
                for r in referrals:
                    r['created_at'] = str(r['created_at'])
            return resp(200, referrals)

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
                    f"INSERT INTO {SCHEMA}.partner_referrals (partner_id, company_name, contact_name, contact_email, contact_phone, source, promo_code) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
                    (partner_id, company_name, contact_name or None, contact_email or None, contact_phone or None, source, partner_token)
                )
                ref_id = cur.fetchone()['id']
                cur.execute(f"UPDATE {SCHEMA}.hr_partners SET clients_invited = clients_invited + 1, updated_at = NOW() WHERE id = %s", (partner_id,))
                conn.commit()

            msg = (f"✅ Новый клиент добавлен!\n\n"
                   f"🏢 Компания: {company_name}\n"
                   f"👤 Контакт: {contact_name or '—'}\n"
                   f"📧 Email: {contact_email or '—'}")
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

            return resp(200, {'id': ref_id, 'success': True})

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

            msg = (f"💰 Запрос на выплату отправлен!\n\n"
                   f"Сумма: {amount:,.0f} ₽\n"
                   f"Способ: {payment_method}\n"
                   f"Реквизиты: {payment_details}\n\n"
                   f"Мы обработаем запрос в течение 2 рабочих дней.")
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

            return resp(200, {'id': payout_id, 'success': True})

        return resp(400, {'error': 'Неизвестное действие'})

    finally:
        conn.close()