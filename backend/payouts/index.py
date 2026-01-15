"""
Обработка запросов на выплаты от сотрудников и управление ими работодателем
Поддерживает создание запросов, изменение статусов, просмотр истории
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с request_id, function_name
Returns: HTTP response dict с statusCode, headers, body
"""

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
    conn.autocommit = True
    return conn

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'GET':
            query_params = event.get('queryStringParameters', {})
            user_id = query_params.get('user_id')
            company_id = query_params.get('company_id')
            status = query_params.get('status')
            
            if company_id:
                where_clause = "WHERE u.company_id = %s"
                params = [company_id]
                
                if status:
                    where_clause += " AND pr.status = %s"
                    params.append(status)
                
                query = f"""
                    SELECT 
                        pr.id, pr.user_id, pr.amount, pr.status,
                        pr.payment_method, pr.payment_details, pr.admin_comment,
                        pr.created_at, pr.reviewed_at, pr.reviewed_by,
                        u.first_name || ' ' || u.last_name as user_name,
                        u.email as user_email
                    FROM t_p65890965_refstaff_project.payout_requests pr
                    JOIN t_p65890965_refstaff_project.users u ON pr.user_id = u.id
                    {where_clause}
                    ORDER BY pr.created_at DESC
                """
                cur.execute(query, params)
            elif user_id:
                query = """
                    SELECT 
                        pr.id, pr.user_id, pr.amount, pr.status,
                        pr.payment_method, pr.payment_details, pr.admin_comment,
                        pr.created_at, pr.reviewed_at, pr.reviewed_by
                    FROM t_p65890965_refstaff_project.payout_requests pr
                    WHERE pr.user_id = %s
                    ORDER BY pr.created_at DESC
                """
                cur.execute(query, (user_id,))
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing user_id or company_id'}),
                    'isBase64Encoded': False
                }
            
            requests = cur.fetchall()
            result = [dict(req) for req in requests]
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('user_id')
            amount = body_data.get('amount')
            payment_method = body_data.get('payment_method', '')
            payment_details = body_data.get('payment_details', '')
            
            if not user_id or not amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing user_id or amount'}),
                    'isBase64Encoded': False
                }
            
            query = """
                INSERT INTO t_p65890965_refstaff_project.payout_requests
                (user_id, amount, payment_method, payment_details)
                VALUES (%s, %s, %s, %s)
                RETURNING id, user_id, amount, status, payment_method, payment_details, created_at
            """
            cur.execute(query, (user_id, amount, payment_method, payment_details))
            new_request = cur.fetchone()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(new_request), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            request_id = body_data.get('request_id')
            status = body_data.get('status')
            admin_comment = body_data.get('admin_comment', '')
            reviewed_by = body_data.get('reviewed_by')
            
            if not request_id or not status:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing request_id or status'}),
                    'isBase64Encoded': False
                }
            
            query = """
                UPDATE t_p65890965_refstaff_project.payout_requests
                SET status = %s, admin_comment = %s, reviewed_at = NOW(), reviewed_by = %s
                WHERE id = %s
                RETURNING id, user_id, amount, status, admin_comment, reviewed_at
            """
            cur.execute(query, (status, admin_comment, reviewed_by, request_id))
            updated_request = cur.fetchone()
            
            if not updated_request:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Payout request not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(updated_request), default=str),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
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
    finally:
        if 'conn' in locals():
            conn.close()
