'''
MAX мессенджер авторизация сотрудников: deep link регистрация, webhook бота, вход по коду. v2
Флоу регистрации: create_session → deep link в бота → bot_started → бот шлёт код → verify_code → JWT.
Флоу входа: send_login_code → пользователь пишет боту → получает код → verify_login_code → JWT.
MAX Bot API: https://platform-api.max.ru
'''

import json
import os
import random
import string
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import urllib.request
import urllib.parse
import hashlib
import hmac
import base64

DB_SCHEMA = 't_p65890965_refstaff_project'
MAX_API = 'https://platform-api.max.ru'


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)


def max_send(token: str, user_id: int, text: str):
    """Отправляет сообщение пользователю в MAX."""
    url = f'{MAX_API}/messages?user_id={user_id}'
    payload = {'text': text}
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        url, data=data,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def generate_code() -> str:
    return ''.join(random.choices(string.digits, k=6))


def generate_token(n=16) -> str:
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
    return f"{message}.{base64.urlsafe_b64encode(sig).decode().rstrip('=')}"


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }


def resp(status: int, body: dict):
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **cors()},
        'body': json.dumps(body, ensure_ascii=False),
        'isBase64Encoded': False
    }


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    bot_token = os.environ.get('MAX_BOT_TOKEN', '')
    bot_username = os.environ.get('MAX_BOT_USERNAME', '')
    body = json.loads(event.get('body') or '{}')

    # ── Webhook от MAX бота ──────────────────────────────────────────────────
    # MAX шлёт update_type в теле запроса
    update_type = body.get('update_type', '')

    if update_type == 'bot_started':
        user = body.get('user', {})
        max_user_id = user.get('user_id')
        user_name = user.get('name', '')
        payload = body.get('payload', '')  # session_token (регистрация или вход)

        if not max_user_id:
            return {'statusCode': 200, 'body': 'ok'}

        if not payload:
            max_send(bot_token, max_user_id,
                '👋 Привет! Я бот iHUNT.\n\nДля входа или регистрации перейди по ссылке на сайте.')
            return {'statusCode': 200, 'body': 'ok'}

        conn = get_db()
        cursor = conn.cursor()
        try:
            code = generate_code()
            expires_at = datetime.utcnow() + timedelta(minutes=10)

            # Сначала проверяем — это сессия входа?
            cursor.execute(
                f"SELECT * FROM {DB_SCHEMA}.max_login_sessions WHERE session_token = %s AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP",
                (payload,)
            )
            login_session = cursor.fetchone()

            if login_session:
                # Проверяем что пользователь зарегистрирован
                cursor.execute(
                    f"SELECT id, first_name FROM {DB_SCHEMA}.users WHERE max_user_id = %s AND is_fired = FALSE",
                    (max_user_id,)
                )
                user_row = cursor.fetchone()
                if not user_row:
                    max_send(bot_token, max_user_id,
                        '❌ Аккаунт с этим MAX не найден.\n\nСначала зарегистрируйтесь по ссылке приглашения от компании.')
                    return {'statusCode': 200, 'body': 'ok'}

                cursor.execute(
                    f"""UPDATE {DB_SCHEMA}.max_login_sessions
                        SET status = 'code_sent', max_user_id = %s, code = %s, expires_at = %s
                        WHERE session_token = %s""",
                    (max_user_id, code, expires_at, payload)
                )
                conn.commit()
                max_send(bot_token, max_user_id,
                    f"🔐 Код входа iHUNT\n\nВаш код: {code}\n\nКод действует 10 минут. Не передавайте его никому."
                )
                return {'statusCode': 200, 'body': 'ok'}

            # Иначе — сессия регистрации
            cursor.execute(
                f"SELECT * FROM {DB_SCHEMA}.max_sessions WHERE session_token = %s AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP",
                (payload,)
            )
            session = cursor.fetchone()

            if not session:
                max_send(bot_token, max_user_id,
                    '❌ Ссылка недействительна или истекла.\n\nВернись на страницу и попробуй снова.')
                return {'statusCode': 200, 'body': 'ok'}

            cursor.execute(f"SELECT id FROM {DB_SCHEMA}.users WHERE max_user_id = %s", (max_user_id,))
            if cursor.fetchone():
                max_send(bot_token, max_user_id,
                    '⚠️ Этот аккаунт MAX уже привязан к другому сотруднику iHUNT.')
                return {'statusCode': 200, 'body': 'ok'}

            cursor.execute(
                f"""UPDATE {DB_SCHEMA}.max_sessions
                    SET status = 'code_sent', max_user_id = %s, code = %s, expires_at = %s
                    WHERE session_token = %s""",
                (max_user_id, code, expires_at, payload)
            )
            conn.commit()

            cursor.execute(f"SELECT name FROM {DB_SCHEMA}.companies WHERE invite_token = %s", (session['invite_token'],))
            company = cursor.fetchone()
            company_name = company['name'] if company else 'вашей компании'

            max_send(bot_token, max_user_id,
                f"✅ Отлично, {user_name}!\n\n"
                f"Вы регистрируетесь как сотрудник компании {company_name}.\n\n"
                f"🔐 Ваш код подтверждения:\n\n{code}\n\n"
                f"Введите этот код на странице регистрации. Код действует 10 минут."
            )
        finally:
            cursor.close()
            conn.close()

        return {'statusCode': 200, 'body': 'ok'}

    if update_type == 'message_created':
        # Пользователь написал боту сообщение — для входа по коду
        message = body.get('message', {})
        user = message.get('sender', {})
        max_user_id = user.get('user_id')
        text = message.get('body', {}).get('text', '').strip()

        if not max_user_id or not text:
            return {'statusCode': 200, 'body': 'ok'}

        # Если написал /start без payload — приветствие
        if text.startswith('/start'):
            max_send(bot_token, max_user_id,
                '👋 Привет! Я бот iHUNT.\n\nДля входа в аккаунт нажми кнопку "Войти через MAX" на сайте.')
        return {'statusCode': 200, 'body': 'ok'}

    # ── REST API действия от frontend ────────────────────────────────────────
    action = body.get('action', '')

    # Быстрые проверки без БД
    if action == 'create_session':
        if not body.get('first_name', '').strip() or not body.get('last_name', '').strip() or not body.get('invite_token', '').strip():
            return resp(400, {'error': 'Заполните имя, фамилию и убедитесь что ссылка действительна'})
    elif action == 'check_session':
        if not body.get('session_token', '').strip():
            return resp(400, {'error': 'session_token обязателен'})
    elif action == 'verify_code':
        if not body.get('session_token', '').strip() or not body.get('code', '').strip():
            return resp(400, {'error': 'Укажите код'})
    elif action == 'create_login_session':
        pass  # без параметров — создаём сессию входа
    elif action == 'check_login_session':
        if not body.get('session_token', '').strip():
            return resp(400, {'error': 'session_token обязателен'})
    elif action == 'verify_login_code':
        if not body.get('session_token', '').strip() or not body.get('code', '').strip():
            return resp(400, {'error': 'Укажите код'})
    elif action not in ('send_login_code',):
        return resp(400, {'error': 'Неизвестный action'})

    conn = get_db()
    cursor = conn.cursor()

    try:
        # ── 1. Создать сессию регистрации ─────────────────────────────────────
        if action == 'create_session':
            first_name = body.get('first_name', '').strip()
            last_name = body.get('last_name', '').strip()
            invite_token = body.get('invite_token', '').strip()

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
                f"""INSERT INTO {DB_SCHEMA}.max_sessions
                    (session_token, invite_token, first_name, last_name, status, expires_at)
                    VALUES (%s, %s, %s, %s, 'pending', %s)""",
                (session_token, invite_token, first_name, last_name, expires_at)
            )
            conn.commit()

            # Deep link MAX: https://max.ru/USERNAME?start=PAYLOAD
            deep_link = f"https://max.ru/{bot_username}?start={session_token}"

            return resp(200, {
                'session_token': session_token,
                'deep_link': deep_link,
                'company_name': company['name']
            })

        # ── 2. Проверить статус сессии (поллинг) ─────────────────────────────
        elif action == 'check_session':
            session_token = body.get('session_token', '').strip()
            cursor.execute(
                f"SELECT status, expires_at FROM {DB_SCHEMA}.max_sessions WHERE session_token = %s",
                (session_token,)
            )
            session = cursor.fetchone()
            if not session:
                return resp(404, {'error': 'Сессия не найдена'})
            if session['expires_at'] < datetime.utcnow():
                return resp(410, {'error': 'Сессия истекла', 'status': 'expired'})
            return resp(200, {'status': session['status']})

        # ── 3. Подтвердить код и зарегистрировать сотрудника ─────────────────
        elif action == 'verify_code':
            session_token = body.get('session_token', '').strip()
            code = body.get('code', '').strip()

            cursor.execute(
                f"""SELECT * FROM {DB_SCHEMA}.max_sessions
                    WHERE session_token = %s AND status = 'code_sent'
                      AND code = %s AND code_used = FALSE AND expires_at > CURRENT_TIMESTAMP""",
                (session_token, code)
            )
            session = cursor.fetchone()
            if not session:
                return resp(400, {'error': 'Неверный или истёкший код'})

            cursor.execute(
                f"SELECT id FROM {DB_SCHEMA}.companies WHERE invite_token = %s",
                (session['invite_token'],)
            )
            company = cursor.fetchone()
            if not company:
                return resp(404, {'error': 'Компания не найдена'})

            company_id = company['id']
            max_uid = session['max_user_id']

            cursor.execute(
                f"SELECT id FROM {DB_SCHEMA}.users WHERE max_user_id = %s", (max_uid,)
            )
            if cursor.fetchone():
                return resp(409, {'error': 'Этот MAX аккаунт уже зарегистрирован'})

            max_email = f"max_{max_uid}@max.local"
            cursor.execute(
                f"""INSERT INTO {DB_SCHEMA}.users
                    (company_id, email, first_name, last_name, role, level, experience_points,
                     total_recommendations, successful_hires, total_earnings, wallet_balance,
                     wallet_pending, is_admin, is_hr_manager, max_user_id, email_verified,
                     created_at, updated_at)
                    VALUES (%s, %s, %s, %s, 'employee', 1, 0, 0, 0, 0, 0, 0, FALSE, FALSE, %s, TRUE,
                            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id, first_name, last_name, company_id, role""",
                (company_id, max_email, session['first_name'], session['last_name'], max_uid)
            )
            user = cursor.fetchone()

            cursor.execute(
                f"UPDATE {DB_SCHEMA}.max_sessions SET code_used = TRUE, status = 'completed', user_id = %s WHERE session_token = %s",
                (user['id'], session_token)
            )
            conn.commit()

            jwt = create_jwt(user['id'], '', user['company_id'], user['role'])

            try:
                max_send(bot_token, int(max_uid),
                    f"🎉 Добро пожаловать в iHUNT, {user['first_name']}!\n\nВаш аккаунт успешно создан. Рекомендуйте вакансии и получайте вознаграждения!")
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

        # ── 4. Создать сессию входа → deep link в бота ───────────────────────
        elif action == 'create_login_session':
            session_token = generate_token(16)
            expires_at = datetime.utcnow() + timedelta(minutes=15)
            cursor.execute(
                f"""INSERT INTO {DB_SCHEMA}.max_login_sessions
                    (session_token, status, expires_at) VALUES (%s, 'pending', %s)""",
                (session_token, expires_at)
            )
            conn.commit()
            deep_link = f"https://max.ru/{bot_username}?start={session_token}"
            return resp(200, {'session_token': session_token, 'deep_link': deep_link})

        # ── 5. Проверить статус login-сессии (поллинг) ───────────────────────
        elif action == 'check_login_session':
            session_token = body.get('session_token', '').strip()
            cursor.execute(
                f"SELECT status, expires_at FROM {DB_SCHEMA}.max_login_sessions WHERE session_token = %s",
                (session_token,)
            )
            session = cursor.fetchone()
            if not session:
                return resp(404, {'error': 'Сессия не найдена'})
            if session['expires_at'] < datetime.utcnow():
                return resp(410, {'error': 'Сессия истекла', 'status': 'expired'})
            return resp(200, {'status': session['status']})

        # ── 6. Подтвердить код входа через сессию ────────────────────────────
        elif action == 'verify_login_code':
            session_token = body.get('session_token', '').strip()
            code = body.get('code', '').strip()

            cursor.execute(
                f"""SELECT mls.*, u.id as uid, u.email, u.first_name, u.last_name,
                           u.company_id, u.role, u.position, u.department, u.avatar_url,
                           u.level, u.is_admin, u.is_hr_manager
                    FROM {DB_SCHEMA}.max_login_sessions mls
                    JOIN {DB_SCHEMA}.users u ON u.max_user_id = mls.max_user_id
                    WHERE mls.session_token = %s AND mls.status = 'code_sent'
                      AND mls.code = %s AND mls.code_used = FALSE
                      AND mls.expires_at > CURRENT_TIMESTAMP""",
                (session_token, code)
            )
            record = cursor.fetchone()
            if not record:
                return resp(400, {'error': 'Неверный или истёкший код'})

            cursor.execute(
                f"UPDATE {DB_SCHEMA}.max_login_sessions SET code_used = TRUE, status = 'completed' WHERE session_token = %s",
                (session_token,)
            )
            conn.commit()

            jwt = create_jwt(record['uid'], record['email'] or '', record['company_id'], record['role'])

            return resp(200, {
                'message': 'Вход выполнен',
                'token': jwt,
                'user': {
                    'id': record['uid'],
                    'email': record['email'],
                    'first_name': record['first_name'],
                    'last_name': record['last_name'],
                    'company_id': record['company_id'],
                    'role': record['role'],
                    'position': record['position'],
                    'department': record['department'],
                    'avatar_url': record['avatar_url'],
                    'level': record['level'],
                    'is_admin': record['is_admin'],
                    'is_hr_manager': record['is_hr_manager'],
                }
            })

        return resp(400, {'error': 'Неизвестный action'})

    finally:
        cursor.close()
        conn.close()