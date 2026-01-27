import json
import os
import psycopg2
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API для приёма сообщений с формы обратной связи.
    Сохраняет сообщения в базу данных для дальнейшей обработки.
    """
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }

    try:
        body_data = json.loads(event.get('body', '{}'))
        user_name = body_data.get('name', '').strip()
        user_email = body_data.get('email', '').strip()
        user_message = body_data.get('message', '').strip()

        if not user_name or not user_email or not user_message:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Missing required fields: name, email, message'}),
                'isBase64Encoded': False
            }

        if '@' not in user_email or '.' not in user_email:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid email format'}),
                'isBase64Encoded': False
            }

        database_url = os.environ.get('DATABASE_URL')
        schema_name = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        if not database_url:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Database not configured'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        insert_query = f"""
            INSERT INTO {schema_name}.contact_messages (name, email, message)
            VALUES (%s, %s, %s)
            RETURNING id, created_at
        """
        
        cursor.execute(insert_query, (user_name, user_email, user_message))
        result = cursor.fetchone()
        message_id = result[0]
        created_at = result[1]
        
        conn.commit()
        cursor.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Сообщение успешно отправлено',
                'id': message_id,
                'created_at': str(created_at)
            }),
            'isBase64Encoded': False
        }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON format'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        print(f"Error processing contact form: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to process message'}),
            'isBase64Encoded': False
        }