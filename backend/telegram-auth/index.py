'''
Telegram бот для отправки и проверки кодов авторизации сотрудников.
Поддерживает: получение кода по chat_id, верификацию кода при регистрации и входе.
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
TELEGRAM_API = 'https://api.telegram.org/bot{token}'


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)


def tg_send(token: str, chat_id: int, text: str):
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    data = json.dumps({'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}).encode()
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def generate_code() -> str:
    return ''.join(random.choices(string.digits, k=6))


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
    body = json.loads(event.get('body', '{}'))
    action = body.get('action', '')

    # Быстрые проверки полей до подключения к БД
    if action == 'send_register_code':
        _chat_id = body.get('telegram_chat_id')
        _first = body.get('first_name', '').strip()
        _last = body.get('last_name', '').strip()
        _token = body.get('invite_token', '').strip()
        if not _chat_id or not _first or not _last or not _token:
            return resp(400, {'error': 'Заполните все поля'})
    elif action == 'send_login_code':
        if not body.get('telegram_chat_id'):
            return resp(400, {'error': 'Укажите Telegram Chat ID'})
    elif action == 'verify_register_code':
        if not body.get('telegram_chat_id') or not body.get('code', '').strip():
            return resp(400, {'error': 'Укажите код'})
    elif action == 'verify_login_code':
        if not body.get('telegram_chat_id') or not body.get('code', '').strip():
            return resp(400, {'error': 'Укажите код'})

    conn = get_db()
    cursor = conn.cursor()

    try:
        # ─── 1. Отправить код сотруднику при регистрации ────────────────────────
        if action == 'send_register_code':
            chat_id = body.get('telegram_chat_id')
            first_name = body.get('first_name', '').strip()
            last_name = body.get('last_name', '').strip()
            invite_token = body.get('invite_token', '').strip()

            # Проверяем invite_token
            cursor.execute(
                f"SELECT id, name FROM {DB_SCHEMA}.companies WHERE invite_token = %s",
                (invite_token,)
            )
            company = cursor.fetchone()
            if not company:
                return resp(404, {'error': 'Неверная ссылка приглашения'})

            # Проверяем, не занят ли chat_id другим аккаунтом
            cursor.execute(
                f"SELECT id FROM {DB_SCHEMA}.users WHERE telegram_chat_id = %s",
                (chat_id,)
            )
            if cursor.fetchone():
                return resp(409, {'error': 'Этот Telegram уже привязан к другому аккаунту'})

            code = generate_code()
            expires_at = datetime.utcnow() + timedelta(minutes=10)

            # Удаляем старые коды для этого chat_id
            cursor.execute(
                f"UPDATE {DB_SCHEMA}.telegram_auth_codes SET used = TRUE WHERE telegram_chat_id = %s AND used = FALSE AND purpose = 'register'",
                (chat_id,)
            )

            cursor.execute(
                f"""INSERT INTO {DB_SCHEMA}.telegram_auth_codes
                    (code, purpose, invite_token, first_name, last_name, telegram_chat_id, expires_at)
                    VALUES (%s, 'register', %s, %s, %s, %s, %s)""",
                (code, invite_token, first_name, last_name, chat_id, expires_at)
            )
            conn.commit()

            company_name = company['name']
            text = (
                f"🔐 <b>Код подтверждения iHUNT</b>\n\n"
                f"Вы регистрируетесь как сотрудник компании <b>{company_name}</b>.\n\n"
                f"Ваш код: <b>{code}</b>\n\n"
                f"Код действует 10 минут. Не передавайте его никому."
            )

            try:
                tg_send(bot_token, int(chat_id), text)
            except Exception as e:
                return resp(400, {'error': f'Не удалось отправить сообщение. Убедитесь, что вы написали боту первым. Ошибка: {str(e)}'})

            return resp(200, {'message': 'Код отправлен в Telegram', 'company_name': company_name})

        # ─── 2. Подтвердить код и зарегистрировать сотрудника ───────────────────
        elif action == 'verify_register_code':
            chat_id = body.get('telegram_chat_id')
            code = body.get('code', '').strip()

            if not chat_id or not code:
                return resp(400, {'error': 'Укажите код'})

            cursor.execute(
                f"""SELECT * FROM {DB_SCHEMA}.telegram_auth_codes
                    WHERE code = %s AND telegram_chat_id = %s AND purpose = 'register'
                      AND used = FALSE AND expires_at > CURRENT_TIMESTAMP
                    ORDER BY created_at DESC LIMIT 1""",
                (code, chat_id)
            )
            record = cursor.fetchone()
            if not record:
                return resp(400, {'error': 'Неверный или истёкший код'})

            # Проверяем invite_token ещё раз
            cursor.execute(
                f"SELECT id FROM {DB_SCHEMA}.companies WHERE invite_token = %s",
                (record['invite_token'],)
            )
            company = cursor.fetchone()
            if not company:
                return resp(404, {'error': 'Компания не найдена'})

            company_id = company['id']

            # Проверяем, нет ли уже такого chat_id
            cursor.execute(
                f"SELECT id FROM {DB_SCHEMA}.users WHERE telegram_chat_id = %s",
                (chat_id,)
            )
            if cursor.fetchone():
                return resp(409, {'error': 'Этот Telegram уже зарегистрирован'})

            # Создаём пользователя
            cursor.execute(
                f"""INSERT INTO {DB_SCHEMA}.users
                    (company_id, first_name, last_name, role, level, experience_points,
                     total_recommendations, successful_hires, total_earnings, wallet_balance,
                     wallet_pending, is_admin, is_hr_manager, telegram_chat_id, email_verified,
                     created_at, updated_at)
                    VALUES (%s, %s, %s, 'employee', 1, 0, 0, 0, 0, 0, 0, FALSE, FALSE, %s, TRUE,
                            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id, email, first_name, last_name, company_id, role""",
                (company_id, record['first_name'], record['last_name'], chat_id)
            )
            user = cursor.fetchone()

            # Помечаем код использованным
            cursor.execute(
                f"UPDATE {DB_SCHEMA}.telegram_auth_codes SET used = TRUE WHERE id = %s",
                (record['id'],)
            )
            conn.commit()

            token = create_jwt(user['id'], user['email'] or '', user['company_id'], user['role'])

            try:
                tg_send(bot_token, int(chat_id),
                        f"✅ <b>Регистрация завершена!</b>\n\nДобро пожаловать в iHUNT, {user['first_name']}!")
            except Exception:
                pass

            return resp(201, {
                'message': 'Регистрация успешна',
                'token': token,
                'user': {
                    'id': user['id'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'company_id': user['company_id'],
                    'role': user['role'],
                    'telegram_chat_id': chat_id,
                }
            })

        # ─── 3. Отправить код для входа ─────────────────────────────────────────
        elif action == 'send_login_code':
            chat_id = body.get('telegram_chat_id')
            if not chat_id:
                return resp(400, {'error': 'Укажите Telegram Chat ID'})

            cursor.execute(
                f"SELECT id, first_name FROM {DB_SCHEMA}.users WHERE telegram_chat_id = %s AND is_fired = FALSE",
                (chat_id,)
            )
            user = cursor.fetchone()
            if not user:
                return resp(404, {'error': 'Аккаунт с этим Telegram не найден'})

            code = generate_code()
            expires_at = datetime.utcnow() + timedelta(minutes=10)

            cursor.execute(
                f"UPDATE {DB_SCHEMA}.telegram_auth_codes SET used = TRUE WHERE user_id = %s AND used = FALSE AND purpose = 'login'",
                (user['id'],)
            )
            cursor.execute(
                f"""INSERT INTO {DB_SCHEMA}.telegram_auth_codes
                    (code, purpose, user_id, telegram_chat_id, expires_at)
                    VALUES (%s, 'login', %s, %s, %s)""",
                (code, user['id'], chat_id, expires_at)
            )
            conn.commit()

            text = (
                f"🔐 <b>Код входа iHUNT</b>\n\n"
                f"Ваш код для входа: <b>{code}</b>\n\n"
                f"Код действует 10 минут. Не передавайте его никому."
            )

            try:
                tg_send(bot_token, int(chat_id), text)
            except Exception as e:
                return resp(400, {'error': f'Не удалось отправить сообщение. Убедитесь, что вы написали боту первым. Ошибка: {str(e)}'})

            return resp(200, {'message': 'Код отправлен в Telegram'})

        # ─── 4. Подтвердить код входа ───────────────────────────────────────────
        elif action == 'verify_login_code':
            chat_id = body.get('telegram_chat_id')
            code = body.get('code', '').strip()

            if not chat_id or not code:
                return resp(400, {'error': 'Укажите код'})

            cursor.execute(
                f"""SELECT tac.*, u.id as uid, u.email, u.first_name, u.last_name,
                           u.company_id, u.role, u.position, u.department, u.avatar_url,
                           u.level, u.is_admin, u.is_hr_manager
                    FROM {DB_SCHEMA}.telegram_auth_codes tac
                    JOIN {DB_SCHEMA}.users u ON u.id = tac.user_id
                    WHERE tac.code = %s AND tac.telegram_chat_id = %s AND tac.purpose = 'login'
                      AND tac.used = FALSE AND tac.expires_at > CURRENT_TIMESTAMP
                    ORDER BY tac.created_at DESC LIMIT 1""",
                (code, chat_id)
            )
            record = cursor.fetchone()
            if not record:
                return resp(400, {'error': 'Неверный или истёкший код'})

            cursor.execute(
                f"UPDATE {DB_SCHEMA}.telegram_auth_codes SET used = TRUE WHERE id = %s",
                (record['id'],)
            )
            conn.commit()

            token = create_jwt(record['uid'], record['email'] or '', record['company_id'], record['role'])

            return resp(200, {
                'message': 'Вход выполнен',
                'token': token,
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