"""
Business: API для управления данными RefStaff (вакансии, рекомендации, сотрудники)
Args: event - dict с httpMethod, body, queryStringParameters, pathParams
      context - объект с request_id, function_name и другими атрибутами
Returns: HTTP response dict с statusCode, headers, body
"""

import json
import os
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

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
            status = query_params.get('status', 'active')
            
            query = """
                SELECT v.*, 
                       COUNT(r.id) as recommendations_count,
                       u.first_name || ' ' || u.last_name as created_by_name
                FROM t_p65890965_refstaff_project.vacancies v
                LEFT JOIN t_p65890965_refstaff_project.recommendations r ON v.id = r.vacancy_id
                LEFT JOIN t_p65890965_refstaff_project.users u ON v.created_by = u.id
                WHERE v.company_id = %s AND v.status = %s
                GROUP BY v.id, u.first_name, u.last_name
                ORDER BY v.created_at DESC
            """
            cur.execute(query, (company_id, status))
            vacancies = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps([dict(row) for row in vacancies], default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and resource == 'vacancies':
            body_data = json.loads(event.get('body', '{}'))
            
            query = """
                INSERT INTO t_p65890965_refstaff_project.vacancies 
                (company_id, title, department, salary_display, requirements, description, reward_amount, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, title, department, salary_display, status, reward_amount, created_at
            """
            
            cur.execute(query, (
                body_data.get('company_id', 1),
                body_data.get('title'),
                body_data.get('department'),
                body_data.get('salary_display'),
                body_data.get('requirements', ''),
                body_data.get('description', ''),
                body_data.get('reward_amount', 30000),
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
                        total_earnings = total_earnings + %s,
                        experience_points = experience_points + 100
                    WHERE id = %s
                """
                cur.execute(update_user, (rec_data['reward_amount'], rec_data['recommended_by']))
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(updated_recommendation), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and resource == 'employees':
            company_id = query_params.get('company_id', '1')
            
            query = """
                SELECT id, first_name, last_name, position, department, 
                       level, experience_points, total_recommendations, 
                       successful_hires, total_earnings, avatar_url
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