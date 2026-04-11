'''
Telegram-авторизация сотрудников: deep link регистрация, webhook бота, Telegram Login Widget вход.
Флоу регистрации: create_session → deep link в бота → /start → бот шлёт код → verify_code → JWT.
Флоу входа: Telegram Login Widget → verify_tg_login → JWT.
'''

import json
import os
import random
import string
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import urllib.request
import hashlib
import hmac
import base64

DB_SCHEMA = 't_p65890965_refstaff_project'


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)


def tg_send(token: str, chat_id: int, text: str, reply_markup: dict = None):
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}
    if reply_markup:
        payload['reply_markup'] = reply_markup
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def generate_code() -> str:
    return ''.join(random.choices(string.digits, k=6))


def generate_token(n=32) -> str:
    return os.urandom(n).hex()


def create_jwt(user_id: int, email: str, company_id: int, role: str) -> str:
    secret = os.environ.get('JWT_SECRET', 'default-secret')
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip('=')
    payload_data = {
        "user_id": user_id, "email": email, "company_id": company_id, "role": role,
        "exp": int((datetime.utcnow() + timedelta(days=7)).timestamp())
    }
    payload = base64.urlsafe_b64encode(json.dumps(payload_data).encode()).decode().rstrip('=')
    message = f"{header}.{payload}"
    sig = hmac.new(secret.encode(), message.encode(), hashlib.sha256).digest()
    sig_enc = base64.urlsafe_b64encode(sig).decode().rstrip('=')
    return f"{message}.{sig_enc}"


def verify_tg_data(data: dict, bot_token: str) -> bool:
    """Проверяет подпись данных от Telegram Login Widget."""
    check_hash = data.pop('hash', '')
    data_check_arr = [f"{k}={v}" for k, v in sorted(data.items())]
    data_check_string = '\n'.join(data_check_arr)
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    computed = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed, check_hash)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    }


def resp(status: int, body: dict):
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **cors_headers()},
        'body': json.dumps(body, ensure_ascii=False),
        'isBase64Encoded': False
    }


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    body = json.loads(event.get('body') or '{}')
    action = body.get('action', '')

    # ── Webhook от Telegram (когда пользователь пишет боту /start TOKEN) ────────
    if 'update_id' in body:
        message = body.get('message', {})
        text = message.get('text', '')
        chat_id = message.get('chat', {}).get('id')
        from_user = message.get('from', {})

        if not chat_id:
            return {'statusCode': 200, 'body': 'ok'}

        # Обработка /start с session_token
        if text.startswith('/start'):
            parts = text.strip().split(' ', 1)
            session_token = parts[1].strip() if len(parts) > 1 else ''

            if not session_token:
                tg_send(bot_token, chat_id,
                    '👋 Привет! Я бот iHUNT.\n\nДля регистрации перейдите по ссылке приглашения от вашей компании.')
                return {'statusCode': 200, 'body': 'ok'}

            conn = get_db()
            cursor = conn.cursor()
            try:
                cursor.execute(
                    f"SELECT * FROM {DB_SCHEMA}.tg_sessions WHERE session_token = %s AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP",
                    (session_token,)
                )
                session = cursor.fetchone()

                if not session:
                    tg_send(bot_token, chat_id,
                        '❌ Ссылка недействительна или истекла.\n\nПожалуйста, вернитесь на страницу регистрации и попробуйте снова.')
                    return {'statusCode': 200, 'body': 'ok'}

                # Проверяем, не занят ли этот Telegram другим аккаунтом
                cursor.execute(
                    f"SELECT id FROM {DB_SCHEMA}.users WHERE telegram_chat_id = %s",
                    (chat_id,)
                )
                if cursor.fetchone():
                    tg_send(bot_token, chat_id,
                        '⚠️ Этот Telegram аккаунт уже привязан к другому сотруднику iHUNT.\n\nЕсли это ошибка — обратитесь к администратору компании.')
                    return {'statusCode': 200, 'body': 'ok'}

                code = generate_code()
                expires_at = datetime.utcnow() + timedelta(minutes=10)

                cursor.execute(
                    f"""UPDATE {DB_SCHEMA}.tg_sessions
                        SET status = 'code_sent', telegram_chat_id = %s, code = %s, expires_at = %s
                        WHERE session_token = %s""",
                    (chat_id, code, expires_at, session_token)
                )
                conn.commit()

                # Получаем название компании
                cursor.execute(
                    f"SELECT name FROM {DB_SCHEMA}.companies WHERE invite_token = %s",
                    (session['invite_token'],)
                )
                company = cursor.fetchone()
                company_name = company['name'] if company else 'вашей компании'

                tg_send(bot_token, chat_id,
                    f"✅ Отлично, {from_user.get('first_name', '')}!\n\n"
                    f"Вы регистрируетесь как сотрудник компании <b>{company_name}</b>.\n\n"
                    f"🔐 Ваш код подтверждения:\n\n<b>{code}</b>\n\n"
                    f"Введите этот код на странице регистрации. Код действует <b>10 минут</b>."
                )
            finally:
                cursor.close()
                conn.close()

        return {'statusCode': 200, 'body': 'ok'}

    conn = get_db()
    cursor = conn.cursor()

    try:
        # ── 1. Создать сессию регистрации (frontend → генерируем deep link) ───────
        if action == 'create_session':
            first_name = body.get('first_name', '').strip()
            last_name = body.get('last_name', '').strip()
            invite_token = body.get('invite_token', '').strip()

            if not first_name or not last_name or not invite_token:
                return resp(400, {'error': 'Заполните имя, фамилию и убедитесь что ссылка приглашения действительна'})

            # Проверяем invite_token
            cursor.execute(
                f"SELECT id, name FROM {DB_SCHEMA}.companies WHERE invite_token = %s",
                (invite_token,)
            )
            company = cursor.fetchone()
            if not company:
                return resp(404, {'error': 'Неверная ссылка приглашения'})

            session_token = generate_token(16)
            expires_at = datetime.utcnow() + timedelta(minutes=15)

            cursor.execute(
                f"""INSERT INTO {DB_SCHEMA}.tg_sessions
                    (session_token, invite_token, first_name, last_name, status, expires_at)
                    VALUES (%s, %s, %s, %s, 'pending', %s)""",
                (session_token, invite_token, first_name, last_name, expires_at)
            )
            conn.commit()

            bot_username = os.environ.get('TELEGRAM_BOT_USERNAME', '')
            deep_link = f"https://t.me/{bot_username}?start={session_token}"

            return resp(200, {
                'session_token': session_token,
                'deep_link': deep_link,
                'company_name': company['name']
            })

        # ── 2. Проверить статус сессии (поллинг с frontend) ─────────────────────
        elif action == 'check_session':
            session_token = body.get('session_token', '').strip()
            if not session_token:
                return resp(400, {'error': 'session_token обязателен'})

            cursor.execute(
                f"SELECT * FROM {DB_SCHEMA}.tg_sessions WHERE session_token = %s",
                (session_token,)
            )
            session = cursor.fetchone()
            if not session:
                return resp(404, {'error': 'Сессия не найдена'})

            if session['expires_at'] < datetime.utcnow():
                return resp(410, {'error': 'Сессия истекла', 'status': 'expired'})

            return resp(200, {'status': session['status']})

        # ── 3. Подтвердить код и зарегистрировать сотрудника ────────────────────
        elif action == 'verify_code':
            session_token = body.get('session_token', '').strip()
            code = body.get('code', '').strip()

            if not session_token or not code:
                return resp(400, {'error': 'Укажите код'})

            cursor.execute(
                f"""SELECT * FROM {DB_SCHEMA}.tg_sessions
                    WHERE session_token = %s AND status = 'code_sent'
                      AND code = %s AND code_used = FALSE AND expires_at > CURRENT_TIMESTAMP""",
                (session_token, code)
            )
            session = cursor.fetchone()
            if not session:
                return resp(400, {'error': 'Неверный или истёкший код'})

            # Проверяем invite_token и получаем company_id
            cursor.execute(
                f"SELECT id FROM {DB_SCHEMA}.companies WHERE invite_token = %s",
                (session['invite_token'],)
            )
            company = cursor.fetchone()
            if not company:
                return resp(404, {'error': 'Компания не найдена'})

            company_id = company['id']
            chat_id = session['telegram_chat_id']

            # Проверяем, нет ли уже такого chat_id
            cursor.execute(
                f"SELECT id FROM {DB_SCHEMA}.users WHERE telegram_chat_id = %s",
                (chat_id,)
            )
            if cursor.fetchone():
                return resp(409, {'error': 'Этот Telegram уже зарегистрирован'})

            # Создаём пользователя (email пустой — вход только через Telegram)
            tg_email = f"tg_{chat_id}@telegram.local"
            cursor.execute(
                f"""INSERT INTO {DB_SCHEMA}.users
                    (company_id, email, first_name, last_name, role, level, experience_points,
                     total_recommendations, successful_hires, total_earnings, wallet_balance,
                     wallet_pending, is_admin, is_hr_manager, telegram_chat_id, email_verified,
                     created_at, updated_at)
                    VALUES (%s, %s, %s, %s, 'employee', 1, 0, 0, 0, 0, 0, 0, FALSE, FALSE, %s, TRUE,
                            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id, first_name, last_name, company_id, role""",
                (company_id, tg_email, session['first_name'], session['last_name'], chat_id)
            )
            user = cursor.fetchone()

            # Закрываем сессию
            cursor.execute(
                f"UPDATE {DB_SCHEMA}.tg_sessions SET code_used = TRUE, status = 'completed', user_id = %s WHERE session_token = %s",
                (user['id'], session_token)
            )
            conn.commit()

            jwt = create_jwt(user['id'], '', user['company_id'], user['role'])

            try:
                tg_send(bot_token, int(chat_id),
                    f"🎉 <b>Добро пожаловать в iHUNT, {user['first_name']}!</b>\n\nВаш аккаунт успешно создан. Теперь вы можете рекомендовать вакансии и получать вознаграждения!")
            except Exception:
                pass

            return resp(201, {
                'message': 'Регистрация успешна',
                'token': jwt,
                'user': {
                    'id': user['id'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'company_id': user['company_id'],
                    'role': user['role'],
                }
            })

        # ── 4. Вход через Telegram Login Widget ─────────────────────────────────
        elif action == 'verify_tg_login':
            tg_data = body.get('tg_data', {})
            if not tg_data:
                return resp(400, {'error': 'Нет данных от Telegram'})

            tg_data_copy = dict(tg_data)
            if not verify_tg_data(tg_data_copy, bot_token):
                return resp(401, {'error': 'Неверная подпись Telegram'})

            # Проверяем свежесть (не старше 5 минут)
            auth_date = int(tg_data.get('auth_date', 0))
            if datetime.utcnow().timestamp() - auth_date > 300:
                return resp(401, {'error': 'Данные авторизации устарели. Попробуйте ещё раз.'})

            tg_id = int(tg_data.get('id', 0))
            if not tg_id:
                return resp(400, {'error': 'Нет Telegram ID'})

            cursor.execute(
                f"""SELECT id, email, first_name, last_name, company_id, role,
                           position, department, avatar_url, level, is_admin, is_hr_manager
                    FROM {DB_SCHEMA}.users
                    WHERE telegram_chat_id = %s AND is_fired = FALSE""",
                (tg_id,)
            )
            user = cursor.fetchone()
            if not user:
                return resp(404, {'error': 'Аккаунт с этим Telegram не найден. Сначала зарегистрируйтесь.'})

            jwt = create_jwt(user['id'], user['email'] or '', user['company_id'], user['role'])

            return resp(200, {
                'message': 'Вход выполнен',
                'token': jwt,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'company_id': user['company_id'],
                    'role': user['role'],
                    'position': user['position'],
                    'department': user['department'],
                    'avatar_url': user['avatar_url'],
                    'level': user['level'],
                    'is_admin': user['is_admin'],
                    'is_hr_manager': user['is_hr_manager'],
                }
            })

        return resp(400, {'error': 'Неизвестный action'})

    finally:
        cursor.close()
        conn.close()