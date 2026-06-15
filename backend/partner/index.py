"""
Партнёрская программа для HR-партнёров.
Регистрация, просмотр статистики, управление рефералами и запросы на выплату.
action=register|profile|referrals|add_referral|payouts|request_payout
"""
import json
import os
import string
import random
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Partner-Token',
    'Content-Type': 'application/json',
}

SCHEMA = 't_p65890965_refstaff_project'


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def generate_partner_code(name: str) -> str:
    prefix = ''.join(c for c in name.upper()[:4] if c.isalpha()) or 'HR'
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"{prefix}{suffix}"


def get_partner_by_token(conn, token: str):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, name, email, phone, partner_code, balance, total_earned, clients_invited, clients_registered, status, created_at FROM {SCHEMA}.hr_partners WHERE partner_code = %s",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return None
        cols = ['id', 'name', 'email', 'phone', 'partner_code', 'balance', 'total_earned', 'clients_invited', 'clients_registered', 'status', 'created_at']
        d = dict(zip(cols, row))
        d['balance'] = float(d['balance'] or 0)
        d['total_earned'] = float(d['total_earned'] or 0)
        d['created_at'] = str(d['created_at'])
        return d


def handler(event: dict, context) -> dict:
    """Партнёрская программа: регистрация, статистика, рефералы, выплаты."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    qs = event.get('queryStringParameters') or {}
    action = qs.get('action', 'profile')
    body = json.loads(event.get('body') or '{}')
    partner_token = (event.get('headers') or {}).get('X-Partner-Token', '').strip()

    conn = get_conn()
    try:
        # Регистрация — публичный эндпоинт
        if action == 'register' and method == 'POST':
            name = body.get('name', '').strip()
            email = body.get('email', '').strip().lower()
            phone = body.get('phone', '').strip()

            if not name or not email:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Имя и email обязательны'})}

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
                    pid, code = cur.fetchone()
                    conn.commit()
                    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'id': pid, 'partner_code': code})}
                except psycopg2.errors.UniqueViolation:
                    conn.rollback()
                    return {'statusCode': 409, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Партнёр с таким email уже зарегистрирован'})}

        # Вход по коду партнёра
        if action == 'login' and method == 'POST':
            code = body.get('partner_code', '').strip().upper()
            if not code:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите код партнёра'})}
            partner = get_partner_by_token(conn, code)
            if not partner:
                return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Партнёр не найден'})}
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(partner)}

        # Все остальные действия требуют токена
        if not partner_token:
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Требуется токен партнёра'})}

        partner = get_partner_by_token(conn, partner_token)
        if not partner:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Партнёр не найден'})}

        partner_id = partner['id']

        # Профиль
        if action == 'profile':
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(partner)}

        # Список рефералов
        if action == 'referrals' and method == 'GET':
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, company_name, contact_name, contact_email, contact_phone, status, source, promo_code, created_at FROM {SCHEMA}.partner_referrals WHERE partner_id = %s ORDER BY created_at DESC",
                    (partner_id,)
                )
                rows = cur.fetchall()
                cols = ['id', 'company_name', 'contact_name', 'contact_email', 'contact_phone', 'status', 'source', 'promo_code', 'created_at']
                referrals = [dict(zip(cols, r)) for r in rows]
                for r in referrals:
                    r['created_at'] = str(r['created_at'])
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(referrals)}

        # Добавить реферала
        if action == 'add_referral' and method == 'POST':
            company_name = body.get('company_name', '').strip()
            contact_name = body.get('contact_name', '').strip()
            contact_email = body.get('contact_email', '').strip().lower()
            contact_phone = body.get('contact_phone', '').strip()
            source = body.get('source', 'link')

            if not company_name:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Название компании обязательно'})}

            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.partner_referrals (partner_id, company_name, contact_name, contact_email, contact_phone, source, promo_code) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
                    (partner_id, company_name, contact_name or None, contact_email or None, contact_phone or None, source, partner_token)
                )
                ref_id = cur.fetchone()[0]
                cur.execute(f"UPDATE {SCHEMA}.hr_partners SET clients_invited = clients_invited + 1, updated_at = NOW() WHERE id = %s", (partner_id,))
                conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'id': ref_id, 'success': True})}

        # История выплат
        if action == 'payouts' and method == 'GET':
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, amount, payment_method, payment_details, status, admin_comment, created_at FROM {SCHEMA}.partner_payout_requests WHERE partner_id = %s ORDER BY created_at DESC",
                    (partner_id,)
                )
                rows = cur.fetchall()
                cols = ['id', 'amount', 'payment_method', 'payment_details', 'status', 'admin_comment', 'created_at']
                payouts = [dict(zip(cols, r)) for r in rows]
                for p in payouts:
                    p['amount'] = float(p['amount'] or 0)
                    p['created_at'] = str(p['created_at'])
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(payouts)}

        # Запрос на выплату
        if action == 'request_payout' and method == 'POST':
            amount = float(body.get('amount', 0))
            payment_method = body.get('payment_method', '').strip()
            payment_details = body.get('payment_details', '').strip()

            if amount <= 0:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите корректную сумму'})}
            if partner['balance'] < amount:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Недостаточно средств на балансе'})}
            if not payment_method or not payment_details:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите способ и реквизиты выплаты'})}

            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.partner_payout_requests (partner_id, amount, payment_method, payment_details) VALUES (%s, %s, %s, %s) RETURNING id",
                    (partner_id, amount, payment_method, payment_details)
                )
                payout_id = cur.fetchone()[0]
                conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'id': payout_id, 'success': True})}

        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неизвестное действие'})}

    finally:
        conn.close()
