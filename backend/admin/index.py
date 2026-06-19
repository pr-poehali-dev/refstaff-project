"""
Административная панель iHUNT — управление компаниями, сотрудниками и аналитика.
Доступ только по ADMIN_SECRET из переменных окружения.
"""

import json
import os
import hashlib
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p65890965_refstaff_project'

def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)
    conn.autocommit = True
    return conn

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret',
    }

def ok(data):
    return {'statusCode': 200, 'headers': {**cors_headers(), 'Content-Type': 'application/json'}, 'body': json.dumps(data, default=str), 'isBase64Encoded': False}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**cors_headers(), 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}), 'isBase64Encoded': False}

def check_auth(event):
    secret = os.environ.get('ADMIN_SECRET', '')
    provided = event.get('headers', {}).get('X-Admin-Secret', '')
    return secret and provided == secret

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': '', 'isBase64Encoded': False}

    if not check_auth(event):
        return err('Unauthorized', 401)

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters', {}) or {}
    resource = params.get('resource', '')
    body = json.loads(event.get('body') or '{}')

    conn = get_db()
    cur = conn.cursor()

    # --- COMPANIES LIST ---
    if method == 'GET' and resource == 'companies':
        cur.execute(f"""
            SELECT c.id, c.name, c.inn, c.subscription_tier, c.subscription_expires_at,
                   c.employee_count, c.created_at, c.referred_by_partner_id,
                   p.name as partner_name, p.partner_code,
                   COUNT(DISTINCT u.id) FILTER (WHERE u.role != 'superadmin') as users_count,
                   COUNT(DISTINCT v.id) as vacancies_count,
                   COUNT(DISTINCT r.id) as recommendations_count
            FROM {SCHEMA}.companies c
            LEFT JOIN {SCHEMA}.users u ON u.company_id = c.id
            LEFT JOIN {SCHEMA}.vacancies v ON v.company_id = c.id
            LEFT JOIN {SCHEMA}.recommendations r ON r.vacancy_id = v.id
            LEFT JOIN {SCHEMA}.hr_partners p ON p.id = c.referred_by_partner_id
            GROUP BY c.id, p.name, p.partner_code
            ORDER BY c.created_at DESC
        """)
        return ok(list(cur.fetchall()))

    # --- COMPANY DETAIL + ANALYTICS ---
    if method == 'GET' and resource == 'company':
        company_id = params.get('company_id')
        if not company_id:
            return err('company_id required')
        cur.execute(f"""
            SELECT c.*,
                   COUNT(DISTINCT u.id) FILTER (WHERE u.role != 'superadmin') as users_count,
                   COUNT(DISTINCT v.id) as vacancies_count,
                   COUNT(DISTINCT r.id) as recommendations_count,
                   COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'hired') as hired_count,
                   COALESCE(SUM(u.total_earnings), 0) as total_payouts
            FROM {SCHEMA}.companies c
            LEFT JOIN {SCHEMA}.users u ON u.company_id = c.id
            LEFT JOIN {SCHEMA}.vacancies v ON v.company_id = c.id
            LEFT JOIN {SCHEMA}.recommendations r ON r.vacancy_id = v.id
            WHERE c.id = %s
            GROUP BY c.id
        """, (company_id,))
        company = cur.fetchone()
        if not company:
            return err('Company not found', 404)

        cur.execute(f"""
            SELECT id, first_name, last_name, email, role, position, department,
                   is_admin, is_fired, total_recommendations, successful_hires,
                   total_earnings, wallet_balance, wallet_pending, created_at
            FROM {SCHEMA}.users WHERE company_id = %s ORDER BY created_at DESC
        """, (company_id,))
        users = list(cur.fetchall())

        cur.execute(f"""
            SELECT id, title, department, status, reward_amount, created_at,
                   (SELECT COUNT(*) FROM {SCHEMA}.recommendations r WHERE r.vacancy_id = v.id) as recs_count
            FROM {SCHEMA}.vacancies v WHERE company_id = %s ORDER BY created_at DESC
        """, (company_id,))
        vacancies = list(cur.fetchall())

        return ok({'company': dict(company), 'users': users, 'vacancies': vacancies})

    # --- UPDATE COMPANY SUBSCRIPTION ---
    if method == 'PUT' and resource == 'company_subscription':
        company_id = body.get('company_id')
        tier = body.get('tier', 'advanced')
        days = int(body.get('days', 30))
        if not company_id:
            return err('company_id required')
        from datetime import datetime, timedelta

        # Цены подписки для расчёта комиссии партнёру
        SUBSCRIPTION_PRICES = {30: 9900, 365: 89900}
        COMMISSION_RATE = 0.5
        HOLD_DAYS = 30

        if tier == 'none' or days == 0:
            cur.execute(f"""
                UPDATE {SCHEMA}.companies
                SET subscription_tier = 'none', subscription_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (company_id,))
            return ok({'success': True, 'expires_at': None})

        expires = datetime.utcnow() + timedelta(days=days)
        cur.execute(f"""
            UPDATE {SCHEMA}.companies
            SET subscription_tier = %s, subscription_expires_at = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (tier, expires, company_id))

        # Начисляем комиссию партнёру, если компания пришла по реф-ссылке
        # Правило: комиссия начисляется только за первые 3 ежемесячных платежа
        # ИЛИ за разовую оплату года (365 дней) — но только 1 раз
        cur.execute(
            f"""SELECT c.referred_by_partner_id, c.name,
                       pr.paid_months_count, pr.id as referral_id
                FROM {SCHEMA}.companies c
                LEFT JOIN {SCHEMA}.partner_referrals pr
                    ON pr.company_id = c.id AND pr.partner_id = c.referred_by_partner_id
                WHERE c.id = %s""",
            (company_id,)
        )
        company_row = cur.fetchone()
        partner_commission_info = None
        if company_row and company_row['referred_by_partner_id']:
            partner_id = company_row['referred_by_partner_id']
            paid_months = int(company_row['paid_months_count'] or 0)

            # Определяем: годовая оплата (365 дней) или месячная
            is_annual = (days >= 365)
            # Лимит: месячные — не более 3 платежей; годовая — 1 раз (засчитывается как 3)
            commission_limit_reached = paid_months >= 3

            if not commission_limit_reached:
                price = SUBSCRIPTION_PRICES.get(days, days * 330)
                # Годовая: 50% от полной стоимости года (89900 * 0.5 = 44950)
                # Месячная: 50% от стоимости месяца (9900 * 0.5 = 4950)
                price_for_commission = price
                commission = round(price_for_commission * COMMISSION_RATE, 2)
                commission_available_at = datetime.utcnow() + timedelta(days=HOLD_DAYS)
                # При годовой оплате засчитываем сразу 3 месяца (лимит исчерпан)
                new_paid_months = 3 if is_annual else paid_months + 1

                # Обновляем запись в partner_referrals
                cur.execute(f"""
                    UPDATE {SCHEMA}.partner_referrals
                    SET commission_amount = commission_amount + %s,
                        total_commission_earned = total_commission_earned + %s,
                        commission_available_at = %s,
                        subscription_tier = %s,
                        subscription_expires_at = %s,
                        subscription_set_at = NOW(),
                        status = 'subscribed',
                        paid_months_count = %s,
                        updated_at = NOW()
                    WHERE partner_id = %s AND company_id = %s
                """, (commission, commission, commission_available_at, tier, expires,
                      new_paid_months, partner_id, company_id))

                # Начисляем на баланс партнёра
                cur.execute(f"""
                    UPDATE {SCHEMA}.hr_partners
                    SET balance = balance + %s,
                        total_earned = total_earned + %s,
                        updated_at = NOW()
                    WHERE id = %s
                """, (commission, commission, partner_id))

                partner_commission_info = {
                    'partner_id': partner_id,
                    'commission': commission,
                    'available_at': commission_available_at.isoformat(),
                    'paid_months_count': new_paid_months,
                    'limit_reached': new_paid_months >= 3,
                }
                print(f"Partner commission: partner_id={partner_id} commission={commission} paid_months={new_paid_months} is_annual={is_annual}")
            else:
                # Лимит исчерпан — только обновляем данные подписки, без комиссии
                cur.execute(f"""
                    UPDATE {SCHEMA}.partner_referrals
                    SET subscription_tier = %s,
                        subscription_expires_at = %s,
                        subscription_set_at = NOW(),
                        status = 'subscribed',
                        updated_at = NOW()
                    WHERE partner_id = %s AND company_id = %s
                """, (tier, expires, partner_id, company_id))
                print(f"Partner commission: LIMIT REACHED for partner_id={partner_id}, paid_months={paid_months}")
                partner_commission_info = {
                    'partner_id': partner_id,
                    'commission': 0,
                    'limit_reached': True,
                    'paid_months_count': paid_months,
                }

        return ok({'success': True, 'expires_at': expires.isoformat(), 'partner_commission': partner_commission_info})

    # --- UPDATE USER ---
    if method == 'PUT' and resource == 'user':
        user_id = body.get('user_id')
        if not user_id:
            return err('user_id required')
        fields = []
        values = []
        allowed = ['first_name', 'last_name', 'position', 'department', 'is_admin', 'is_fired', 'email']
        for f in allowed:
            if f in body:
                fields.append(f'{f} = %s')
                values.append(body[f])
        if not fields:
            return err('No fields to update')
        values.append(user_id)
        cur.execute(f"UPDATE {SCHEMA}.users SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE id = %s", values)
        return ok({'success': True})

    # --- GLOBAL ANALYTICS ---
    if method == 'GET' and resource == 'analytics':
        cur.execute(f"SELECT COUNT(*) as total FROM {SCHEMA}.companies")
        companies_total = cur.fetchone()['total']
        cur.execute(f"SELECT COUNT(*) as total FROM {SCHEMA}.users WHERE role != 'superadmin'")
        users_total = cur.fetchone()['total']
        cur.execute(f"SELECT COUNT(*) as total FROM {SCHEMA}.vacancies")
        vacancies_total = cur.fetchone()['total']
        cur.execute(f"SELECT COUNT(*) as total FROM {SCHEMA}.recommendations")
        recs_total = cur.fetchone()['total']
        cur.execute(f"SELECT COUNT(*) as total FROM {SCHEMA}.recommendations WHERE status = 'hired'")
        hired_total = cur.fetchone()['total']
        cur.execute(f"""
            SELECT COUNT(*) as total FROM {SCHEMA}.companies
            WHERE subscription_expires_at > CURRENT_TIMESTAMP
        """)
        active_subs = cur.fetchone()['total']
        cur.execute(f"""
            SELECT COUNT(*) as total FROM {SCHEMA}.companies
            WHERE subscription_expires_at <= CURRENT_TIMESTAMP OR subscription_expires_at IS NULL
        """)
        expired_subs = cur.fetchone()['total']
        cur.execute(f"""
            SELECT DATE_TRUNC('day', created_at)::date as date, COUNT(*) as count
            FROM {SCHEMA}.companies
            WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
            GROUP BY 1 ORDER BY 1
        """)
        registrations = list(cur.fetchall())
        return ok({
            'companies_total': companies_total,
            'users_total': users_total,
            'vacancies_total': vacancies_total,
            'recommendations_total': recs_total,
            'hired_total': hired_total,
            'active_subscriptions': active_subs,
            'expired_subscriptions': expired_subs,
            'registrations_by_day': registrations,
        })

    # --- USERS LIST ---
    if method == 'GET' and resource == 'users':
        company_id = params.get('company_id')
        search = params.get('search', '')
        query = f"""
            SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.position,
                   u.is_admin, u.is_fired, u.total_recommendations, u.successful_hires,
                   u.total_earnings, u.wallet_balance, u.wallet_pending, u.created_at,
                   c.name as company_name
            FROM {SCHEMA}.users u
            LEFT JOIN {SCHEMA}.companies c ON c.id = u.company_id
            WHERE 1=1
        """
        args = []
        if company_id:
            query += ' AND u.company_id = %s'
            args.append(company_id)
        if search:
            query += ' AND (u.email ILIKE %s OR u.first_name ILIKE %s OR u.last_name ILIKE %s)'
            args += [f'%{search}%', f'%{search}%', f'%{search}%']
        query += ' ORDER BY u.created_at DESC LIMIT 100'
        cur.execute(query, args)
        return ok(list(cur.fetchall()))

    return err('Unknown resource', 404)