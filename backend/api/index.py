"""
Business: API для управления данными iHUNT (вакансии, рекомендации, сотрудники)
Поддерживает фильтрацию вакансий, архивирование, удаление, регистрацию сотрудников
Args: event - dict с httpMethod, body, queryStringParameters, pathParams
      context - объект с request_id, function_name и другими атрибутами
Returns: HTTP response dict с statusCode, headers, body
"""

import json
import os
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request

NOTIFY_URL = 'https://functions.poehali.dev/271cd5d9-0140-4c60-9689-1fd5d74409be'

def send_notification(payload):
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(NOTIFY_URL, data=data, headers={'Content-Type': 'application/json'}, method='POST')
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
    conn.autocommit = True
    return conn

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    path_params = event.get('pathParams', {})
    query_params = event.get('queryStringParameters', {})
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Company-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        resource = query_params.get('resource', '')
        action = query_params.get('action', '')
        
        if method == 'GET' and resource == 'vacancies':
            company_id = query_params.get('company_id', '1')
            status = query_params.get('status', 'all')
            user_id = query_params.get('user_id')
            
            where_clause = 'WHERE v.company_id = %s'
            params = [company_id]
            
            if status and status != 'all':
                where_clause += ' AND v.status = %s'
                params.append(status)
            
            query = f"""
                SELECT v.id, v.title, v.department, v.salary_display, v.status, 
                       v.reward_amount, v.payout_delay_days, v.requirements, v.description,
                       v.referral_token, v.created_at,
                       COUNT(r.id) as recommendations_count,
                       u.first_name || ' ' || u.last_name as created_by_name
                FROM t_p65890965_refstaff_project.vacancies v
                LEFT JOIN t_p65890965_refstaff_project.recommendations r ON v.id = r.vacancy_id
                LEFT JOIN t_p65890965_refstaff_project.users u ON v.created_by = u.id
                {where_clause}
                GROUP BY v.id, u.first_name, u.last_name
                ORDER BY v.created_at DESC
            """
            cur.execute(query, params)
            vacancies = cur.fetchall()
            
            result = []
            for vac in vacancies:
                vac_dict = dict(vac)
                if user_id and vac_dict.get('referral_token'):
                    vac_dict['referral_link'] = f"https://refstaff.app/r/{vac_dict['referral_token']}?ref={user_id}"
                result.append(vac_dict)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and resource == 'vacancies':
            body_data = json.loads(event.get('body', '{}'))
            
            query = """
                INSERT INTO t_p65890965_refstaff_project.vacancies 
                (company_id, title, department, salary_display, requirements, description, reward_amount, payout_delay_days, created_by, referral_token)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, substring(md5(random()::text), 1, 12))
                RETURNING id, title, department, salary_display, status, reward_amount, payout_delay_days, referral_token, created_at
            """
            
            cur.execute(query, (
                body_data.get('company_id', 1),
                body_data.get('title'),
                body_data.get('department'),
                body_data.get('salary_display'),
                body_data.get('requirements', ''),
                body_data.get('description', ''),
                body_data.get('reward_amount', 30000),
                body_data.get('payout_delay_days', 30),
                body_data.get('created_by', 1)
            ))
            
            new_vacancy = cur.fetchone()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(new_vacancy), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and resource == 'recommendations':
            company_id = query_params.get('company_id', '1')
            status = query_params.get('status')
            user_id = query_params.get('user_id')
            
            where_clauses = ['v.company_id = %s']
            params = [company_id]
            
            if status:
                where_clauses.append('r.status = %s')
                params.append(status)
            
            if user_id:
                where_clauses.append('r.recommended_by = %s')
                params.append(user_id)
            
            query = f"""
                SELECT r.*, 
                       v.title as vacancy_title,
                       u.first_name || ' ' || u.last_name as recommended_by_name
                FROM t_p65890965_refstaff_project.recommendations r
                JOIN t_p65890965_refstaff_project.vacancies v ON r.vacancy_id = v.id
                JOIN t_p65890965_refstaff_project.users u ON r.recommended_by = u.id
                WHERE {' AND '.join(where_clauses)}
                ORDER BY r.created_at DESC
            """
            
            cur.execute(query, params)
            recommendations = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps([dict(row) for row in recommendations], default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and resource == 'recommendations':
            body_data = json.loads(event.get('body', '{}'))
            
            query = """
                INSERT INTO t_p65890965_refstaff_project.recommendations 
                (vacancy_id, recommended_by, candidate_name, candidate_email, candidate_phone, comment, reward_amount)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, vacancy_id, candidate_name, candidate_email, status, reward_amount, created_at
            """
            
            cur.execute(query, (
                body_data.get('vacancy_id'),
                body_data.get('recommended_by'),
                body_data.get('candidate_name'),
                body_data.get('candidate_email'),
                body_data.get('candidate_phone', ''),
                body_data.get('comment', ''),
                body_data.get('reward_amount', 30000)
            ))
            
            new_recommendation = cur.fetchone()
            
            update_user_stats = """
                UPDATE t_p65890965_refstaff_project.users 
                SET total_recommendations = total_recommendations + 1
                WHERE id = %s
            """
            cur.execute(update_user_stats, (body_data.get('recommended_by'),))

            cur.execute("SELECT first_name, last_name, company_id FROM t_p65890965_refstaff_project.users WHERE id = %s", (body_data.get('recommended_by'),))
            rec_user = cur.fetchone()
            vacancy_title = ''
            if body_data.get('vacancy_id'):
                cur.execute("SELECT title FROM t_p65890965_refstaff_project.vacancies WHERE id = %s", (body_data.get('vacancy_id'),))
                vac = cur.fetchone()
                if vac:
                    vacancy_title = vac['title']
            if rec_user and rec_user.get('company_id'):
                send_notification({
                    'company_id': rec_user['company_id'],
                    'event_type': 'new_recommendation',
                    'candidate_name': body_data.get('candidate_name', ''),
                    'candidate_email': body_data.get('candidate_email', ''),
                    'vacancy_title': vacancy_title,
                    'recommended_by_name': f"{rec_user.get('first_name', '')} {rec_user.get('last_name', '')}",
                    'reward_amount': body_data.get('reward_amount', 30000)
                })

            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(new_recommendation), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT' and resource == 'recommendations' and action == 'status':
            body_data = json.loads(event.get('body', '{}'))
            recommendation_id = body_data.get('id')
            new_status = body_data.get('status')
            
            query = """
                UPDATE t_p65890965_refstaff_project.recommendations 
                SET status = %s, reviewed_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, status, reviewed_at
            """
            
            cur.execute(query, (new_status, recommendation_id))
            updated_recommendation = cur.fetchone()
            
            if new_status == 'accepted':
                get_recommendation = """
                    SELECT recommended_by, reward_amount 
                    FROM t_p65890965_refstaff_project.recommendations 
                    WHERE id = %s
                """
                cur.execute(get_recommendation, (recommendation_id,))
                rec_data = cur.fetchone()
                
                update_user = """
                    UPDATE t_p65890965_refstaff_project.users 
                    SET successful_hires = successful_hires + 1,
                        wallet_pending = wallet_pending + %s,
                        experience_points = experience_points + 100
                    WHERE id = %s
                """
                cur.execute(update_user, (rec_data['reward_amount'], rec_data['recommended_by']))
                
                get_vacancy_delay = """
                    SELECT payout_delay_days FROM t_p65890965_refstaff_project.vacancies
                    WHERE id = (SELECT vacancy_id FROM t_p65890965_refstaff_project.recommendations WHERE id = %s)
                """
                cur.execute(get_vacancy_delay, (recommendation_id,))
                vacancy_info = cur.fetchone()
                delay_days = vacancy_info['payout_delay_days'] if vacancy_info else 30
                
                create_pending_payout = f"""
                    INSERT INTO t_p65890965_refstaff_project.pending_payouts 
                    (user_id, recommendation_id, amount, unlock_date, status)
                    VALUES (%s, %s, %s, CURRENT_TIMESTAMP + INTERVAL '{delay_days} days', 'pending')
                """
                cur.execute(create_pending_payout, (
                    rec_data['recommended_by'], 
                    recommendation_id, 
                    rec_data['reward_amount']
                ))
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(updated_recommendation), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT' and resource == 'vacancies':
            body_data = json.loads(event.get('body', '{}'))
            vacancy_id = body_data.get('id')
            
            if not vacancy_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'vacancy id is required'}),
                    'isBase64Encoded': False
                }
            
            update_fields = []
            params = []
            
            if 'title' in body_data:
                update_fields.append('title = %s')
                params.append(body_data['title'])
            if 'department' in body_data:
                update_fields.append('department = %s')
                params.append(body_data['department'])
            if 'salary_display' in body_data:
                update_fields.append('salary_display = %s')
                params.append(body_data['salary_display'])
            if 'requirements' in body_data:
                update_fields.append('requirements = %s')
                params.append(body_data['requirements'])
            if 'description' in body_data:
                update_fields.append('description = %s')
                params.append(body_data['description'])
            if 'reward_amount' in body_data:
                update_fields.append('reward_amount = %s')
                params.append(body_data['reward_amount'])
            if 'payout_delay_days' in body_data:
                update_fields.append('payout_delay_days = %s')
                params.append(body_data['payout_delay_days'])
            if 'status' in body_data:
                update_fields.append('status = %s')
                params.append(body_data['status'])
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'No fields to update'}),
                    'isBase64Encoded': False
                }
            
            params.append(vacancy_id)
            query = f"""
                UPDATE t_p65890965_refstaff_project.vacancies 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, title, department, salary_display, status, reward_amount, payout_delay_days
            """
            
            cur.execute(query, params)
            updated_vacancy = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(updated_vacancy), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE' and resource == 'vacancies':
            vacancy_id = query_params.get('id')
            
            if not vacancy_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'vacancy id is required'}),
                    'isBase64Encoded': False
                }
            
            delete_query = """
                DELETE FROM t_p65890965_refstaff_project.vacancies
                WHERE id = %s AND status = 'archived'
                RETURNING id, title
            """
            
            cur.execute(delete_query, (vacancy_id,))
            deleted_vacancy = cur.fetchone()
            
            if not deleted_vacancy:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Vacancy not found or not archived'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and resource == 'employees':
            company_id = query_params.get('company_id', '1')
            
            query = """
                SELECT id, first_name, last_name, position, department, 
                       level, experience_points, total_recommendations, 
                       successful_hires, total_earnings, avatar_url,
                       email, phone, telegram, vk
                FROM t_p65890965_refstaff_project.users
                WHERE company_id = %s AND role = 'employee'
                ORDER BY successful_hires DESC, total_recommendations DESC
            """
            
            cur.execute(query, (company_id,))
            employees = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps([dict(row) for row in employees], default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and resource == 'company':
            company_id = query_params.get('company_id', '1')
            
            query = """
                SELECT id, name, employee_count, invite_token, logo_url, 
                       description, website, industry, inn, created_at
                FROM t_p65890965_refstaff_project.companies
                WHERE id = %s
            """
            
            cur.execute(query, (company_id,))
            company = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(company) if company else {}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT' and resource == 'company':
            body_data = json.loads(event.get('body', '{}'))
            company_id = body_data.get('company_id', '1')
            
            update_fields = []
            params = []
            
            if 'name' in body_data:
                update_fields.append('name = %s')
                params.append(body_data['name'])
            if 'logo_url' in body_data:
                update_fields.append('logo_url = %s')
                params.append(body_data['logo_url'])
            if 'description' in body_data:
                update_fields.append('description = %s')
                params.append(body_data['description'])
            if 'website' in body_data:
                update_fields.append('website = %s')
                params.append(body_data['website'])
            if 'industry' in body_data:
                update_fields.append('industry = %s')
                params.append(body_data['industry'])
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'No fields to update'}),
                    'isBase64Encoded': False
                }
            
            params.append(company_id)
            query = f"""
                UPDATE t_p65890965_refstaff_project.companies 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, name, logo_url, description, website, industry
            """
            
            cur.execute(query, params)
            updated_company = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(updated_company), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and resource == 'employees' and action == 'register':
            body_data = json.loads(event.get('body', '{}'))
            invite_token = body_data.get('invite_token')
            
            get_company = """
                SELECT id FROM t_p65890965_refstaff_project.companies
                WHERE invite_token = %s
            """
            cur.execute(get_company, (invite_token,))
            company = cur.fetchone()
            
            if not company:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Invalid invite token'}),
                    'isBase64Encoded': False
                }
            
            insert_user = """
                INSERT INTO t_p65890965_refstaff_project.users 
                (company_id, email, first_name, last_name, position, department, role)
                VALUES (%s, %s, %s, %s, %s, %s, 'employee')
                RETURNING id, email, first_name, last_name, position, department, role
            """
            
            cur.execute(insert_user, (
                company['id'],
                body_data.get('email'),
                body_data.get('first_name'),
                body_data.get('last_name'),
                body_data.get('position', ''),
                body_data.get('department', '')
            ))
            
            new_user = cur.fetchone()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(new_user), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT' and resource == 'employees' and action == 'role':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('user_id')
            
            update_fields = []
            params = []
            
            if 'is_hr_manager' in body_data:
                update_fields.append('is_hr_manager = %s')
                params.append(body_data['is_hr_manager'])
            if 'is_admin' in body_data:
                update_fields.append('is_admin = %s')
                params.append(body_data['is_admin'])
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'No role fields provided'}),
                    'isBase64Encoded': False
                }
            
            params.append(user_id)
            query = f"""
                UPDATE t_p65890965_refstaff_project.users 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, first_name, last_name, is_hr_manager, is_admin
            """
            
            cur.execute(query, params)
            updated_user = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(updated_user), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT' and resource == 'employees' and not action:
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'user_id is required'}),
                    'isBase64Encoded': False
                }
            
            update_fields = []
            params = []
            
            if 'first_name' in body_data:
                update_fields.append('first_name = %s')
                params.append(body_data['first_name'])
            if 'last_name' in body_data:
                update_fields.append('last_name = %s')
                params.append(body_data['last_name'])
            if 'position' in body_data:
                update_fields.append('position = %s')
                params.append(body_data['position'])
            if 'department' in body_data:
                update_fields.append('department = %s')
                params.append(body_data['department'])
            if 'phone' in body_data:
                update_fields.append('phone = %s')
                params.append(body_data['phone'])
            if 'telegram' in body_data:
                update_fields.append('telegram = %s')
                params.append(body_data['telegram'])
            if 'vk' in body_data:
                update_fields.append('vk = %s')
                params.append(body_data['vk'])
            if 'avatar_url' in body_data:
                update_fields.append('avatar_url = %s')
                params.append(body_data['avatar_url'])
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'No fields to update'}),
                    'isBase64Encoded': False
                }
            
            params.append(user_id)
            query = f"""
                UPDATE t_p65890965_refstaff_project.users 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, first_name, last_name, position, department, phone, telegram, vk, avatar_url
            """
            
            cur.execute(query, params)
            updated_user = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(updated_user), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE' and resource == 'employees':
            user_id = query_params.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'user_id is required'}),
                    'isBase64Encoded': False
                }
            
            delete_query = """
                DELETE FROM t_p65890965_refstaff_project.users
                WHERE id = %s
                RETURNING id, first_name, last_name
            """
            
            cur.execute(delete_query, (user_id,))
            deleted_user = cur.fetchone()
            
            if not deleted_user:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Employee not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'deleted': dict(deleted_user)}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and resource == 'wallet':
            user_id = query_params.get('user_id')
            
            wallet_query = """
                SELECT wallet_balance, wallet_pending
                FROM t_p65890965_refstaff_project.users
                WHERE id = %s
            """
            cur.execute(wallet_query, (user_id,))
            wallet = cur.fetchone()
            
            transactions_query = """
                SELECT id, amount, type, description, created_at
                FROM t_p65890965_refstaff_project.wallet_transactions
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 50
            """
            cur.execute(transactions_query, (user_id,))
            transactions = cur.fetchall()
            
            pending_query = """
                SELECT id, amount, unlock_date, status
                FROM t_p65890965_refstaff_project.pending_payouts
                WHERE user_id = %s AND status = 'pending'
                ORDER BY unlock_date ASC
            """
            cur.execute(pending_query, (user_id,))
            pending = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'wallet': dict(wallet) if wallet else {},
                    'transactions': [dict(t) for t in transactions],
                    'pending_payouts': [dict(p) for p in pending]
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and resource == 'chats':
            body_data = json.loads(event.get('body', '{}'))
            company_id = body_data.get('company_id')
            employee_id = body_data.get('employee_id')
            
            check_chat = """
                SELECT id FROM t_p65890965_refstaff_project.chats
                WHERE company_id = %s AND employee_id = %s
            """
            cur.execute(check_chat, (company_id, employee_id))
            existing_chat = cur.fetchone()
            
            if existing_chat:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'chat_id': existing_chat['id']}),
                    'isBase64Encoded': False
                }
            
            create_chat = """
                INSERT INTO t_p65890965_refstaff_project.chats 
                (company_id, employee_id)
                VALUES (%s, %s)
                RETURNING id, company_id, employee_id, created_at
            """
            cur.execute(create_chat, (company_id, employee_id))
            new_chat = cur.fetchone()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(new_chat), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and resource == 'chats':
            user_id = query_params.get('user_id')
            company_id = query_params.get('company_id')
            
            if company_id:
                query = """
                    SELECT c.*, 
                           u.first_name || ' ' || u.last_name as employee_name,
                           u.position, u.avatar_url,
                           (SELECT COUNT(*) FROM t_p65890965_refstaff_project.chat_messages 
                            WHERE chat_id = c.id AND is_read = false AND sender_id != %s) as unread_count
                    FROM t_p65890965_refstaff_project.chats c
                    JOIN t_p65890965_refstaff_project.users u ON c.employee_id = u.id
                    WHERE c.company_id = %s
                    ORDER BY c.last_message_at DESC NULLS LAST
                """
                cur.execute(query, (user_id, company_id))
            else:
                query = """
                    SELECT c.*,
                           comp.name as company_name,
                           (SELECT COUNT(*) FROM t_p65890965_refstaff_project.chat_messages 
                            WHERE chat_id = c.id AND is_read = false AND sender_id != %s) as unread_count
                    FROM t_p65890965_refstaff_project.chats c
                    JOIN t_p65890965_refstaff_project.companies comp ON c.company_id = comp.id
                    WHERE c.employee_id = %s
                    ORDER BY c.last_message_at DESC NULLS LAST
                """
                cur.execute(query, (user_id, user_id))
            
            chats = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps([dict(c) for c in chats], default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and resource == 'messages':
            body_data = json.loads(event.get('body', '{}'))
            
            insert_message = """
                INSERT INTO t_p65890965_refstaff_project.chat_messages 
                (chat_id, sender_id, message)
                VALUES (%s, %s, %s)
                RETURNING id, chat_id, sender_id, message, is_read, created_at
            """
            cur.execute(insert_message, (
                body_data.get('chat_id'),
                body_data.get('sender_id'),
                body_data.get('message')
            ))
            new_message = cur.fetchone()
            
            update_chat = """
                UPDATE t_p65890965_refstaff_project.chats
                SET last_message_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """
            cur.execute(update_chat, (body_data.get('chat_id'),))
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(new_message), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and resource == 'messages':
            chat_id = query_params.get('chat_id')
            
            query = """
                SELECT m.*,
                       u.first_name || ' ' || u.last_name as sender_name,
                       u.avatar_url as sender_avatar
                FROM t_p65890965_refstaff_project.chat_messages m
                JOIN t_p65890965_refstaff_project.users u ON m.sender_id = u.id
                WHERE m.chat_id = %s
                ORDER BY m.created_at ASC
            """
            cur.execute(query, (chat_id,))
            messages = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps([dict(m) for m in messages], default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and resource == 'employee_chats':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('user_id')
            peer_id = body_data.get('peer_id')
            company_id = body_data.get('company_id')
            
            p1 = min(int(user_id), int(peer_id))
            p2 = max(int(user_id), int(peer_id))
            
            cur.execute("""
                SELECT id FROM t_p65890965_refstaff_project.employee_chats
                WHERE participant1_id = %s AND participant2_id = %s
            """, (p1, p2))
            existing = cur.fetchone()
            
            if existing:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'chat_id': existing['id']}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                INSERT INTO t_p65890965_refstaff_project.employee_chats 
                (company_id, participant1_id, participant2_id)
                VALUES (%s, %s, %s)
                RETURNING id, company_id, participant1_id, participant2_id, created_at
            """, (company_id, p1, p2))
            new_chat = cur.fetchone()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(new_chat), default=str),
                'isBase64Encoded': False
            }

        elif method == 'GET' and resource == 'employee_chats':
            user_id = query_params.get('user_id')
            company_id = query_params.get('company_id')
            
            cur.execute("""
                SELECT c.*,
                       CASE WHEN c.participant1_id = %s THEN u2.id ELSE u1.id END as peer_id,
                       CASE WHEN c.participant1_id = %s 
                            THEN u2.first_name || ' ' || u2.last_name 
                            ELSE u1.first_name || ' ' || u1.last_name END as peer_name,
                       CASE WHEN c.participant1_id = %s THEN u2.position ELSE u1.position END as peer_position,
                       CASE WHEN c.participant1_id = %s THEN u2.department ELSE u1.department END as peer_department,
                       CASE WHEN c.participant1_id = %s THEN u2.avatar_url ELSE u1.avatar_url END as peer_avatar,
                       (SELECT COUNT(*) FROM t_p65890965_refstaff_project.employee_messages 
                        WHERE chat_id = c.id AND is_read = false AND sender_id != %s) as unread_count,
                       (SELECT message FROM t_p65890965_refstaff_project.employee_messages 
                        WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
                FROM t_p65890965_refstaff_project.employee_chats c
                JOIN t_p65890965_refstaff_project.users u1 ON c.participant1_id = u1.id
                JOIN t_p65890965_refstaff_project.users u2 ON c.participant2_id = u2.id
                WHERE c.company_id = %s AND (c.participant1_id = %s OR c.participant2_id = %s)
                ORDER BY c.last_message_at DESC NULLS LAST
            """, (user_id, user_id, user_id, user_id, user_id, user_id, company_id, user_id, user_id))
            chats = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(c) for c in chats], default=str),
                'isBase64Encoded': False
            }

        elif method == 'POST' and resource == 'employee_messages':
            body_data = json.loads(event.get('body', '{}'))
            chat_id = body_data.get('chat_id')
            sender_id = body_data.get('sender_id')
            message = body_data.get('message')
            
            cur.execute("""
                INSERT INTO t_p65890965_refstaff_project.employee_messages 
                (chat_id, sender_id, message)
                VALUES (%s, %s, %s)
                RETURNING id, chat_id, sender_id, message, is_read, created_at
            """, (chat_id, sender_id, message))
            new_msg = cur.fetchone()
            
            cur.execute("""
                UPDATE t_p65890965_refstaff_project.employee_chats
                SET last_message_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (chat_id,))
            
            result = dict(new_msg)
            cur.execute("""
                SELECT first_name || ' ' || last_name as sender_name, avatar_url as sender_avatar
                FROM t_p65890965_refstaff_project.users WHERE id = %s
            """, (sender_id,))
            sender = cur.fetchone()
            if sender:
                result['sender_name'] = sender['sender_name']
                result['sender_avatar'] = sender['sender_avatar']
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result, default=str),
                'isBase64Encoded': False
            }

        elif method == 'GET' and resource == 'employee_messages':
            chat_id = query_params.get('chat_id')
            
            cur.execute("""
                SELECT m.*,
                       u.first_name || ' ' || u.last_name as sender_name,
                       u.avatar_url as sender_avatar
                FROM t_p65890965_refstaff_project.employee_messages m
                JOIN t_p65890965_refstaff_project.users u ON m.sender_id = u.id
                WHERE m.chat_id = %s
                ORDER BY m.created_at ASC
            """, (chat_id,))
            messages = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(m) for m in messages], default=str),
                'isBase64Encoded': False
            }

        elif method == 'PUT' and resource == 'employee_messages' and query_params.get('action') == 'read':
            body_data = json.loads(event.get('body', '{}'))
            chat_id = body_data.get('chat_id')
            reader_id = body_data.get('reader_id')
            
            cur.execute("""
                UPDATE t_p65890965_refstaff_project.employee_messages
                SET is_read = true
                WHERE chat_id = %s AND sender_id != %s AND is_read = false
            """, (chat_id, reader_id))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }

        elif method == 'GET' and resource == 'company_employees':
            company_id = query_params.get('company_id')
            exclude_id = query_params.get('exclude_id')
            
            cur.execute("""
                SELECT id, first_name, last_name, position, department, avatar_url
                FROM t_p65890965_refstaff_project.users
                WHERE company_id = %s AND id != %s
                ORDER BY first_name, last_name
            """, (company_id, exclude_id))
            employees = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(e) for e in employees], default=str),
                'isBase64Encoded': False
            }

        elif method == 'GET' and resource == 'stats':
            company_id = query_params.get('company_id', '1')
            
            stats_query = """
                SELECT 
                    COUNT(DISTINCT r.id) as total_recommendations,
                    COUNT(DISTINCT CASE WHEN r.status = 'accepted' THEN r.id END) as accepted_candidates,
                    COALESCE(SUM(CASE WHEN r.status = 'accepted' THEN r.reward_amount ELSE 0 END), 0) as total_bonuses,
                    COUNT(DISTINCT v.id) as active_vacancies,
                    COUNT(DISTINCT u.id) as total_employees
                FROM t_p65890965_refstaff_project.recommendations r
                JOIN t_p65890965_refstaff_project.vacancies v ON r.vacancy_id = v.id
                JOIN t_p65890965_refstaff_project.users u ON r.recommended_by = u.id
                WHERE v.company_id = %s
            """
            
            cur.execute(stats_query, (company_id,))
            stats = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(stats), default=str),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Endpoint not found'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }