import json
import os
import base64
import uuid
import boto3
import psycopg2
import psycopg2.extras


def handler(event: dict, context) -> dict:
    """Загрузка аватара пользователя в S3 и обновление avatar_url в БД"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    user_id = body.get('user_id')
    image_data = body.get('image_data')  # base64 строка (data:image/jpeg;base64,...)

    if not user_id or not image_data:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'user_id and image_data required'})}

    # Разбираем base64
    if ',' in image_data:
        header, b64 = image_data.split(',', 1)
        content_type = header.split(':')[1].split(';')[0] if ':' in header else 'image/jpeg'
    else:
        b64 = image_data
        content_type = 'image/jpeg'

    ext = content_type.split('/')[-1].replace('jpeg', 'jpg')
    image_bytes = base64.b64decode(b64)

    # Ограничение 2MB
    if len(image_bytes) > 2 * 1024 * 1024:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Image too large, max 2MB'})}

    # Сохраняем как data URL прямо в БД (S3 недоступен)
    cdn_url = f"data:{content_type};base64,{b64}"

    # Сохраняем URL в БД
    schema = os.environ.get('MAIN_DB_SCHEMA', 't_p65890965_refstaff_project')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"UPDATE {schema}.users SET avatar_url = %s WHERE id = %s", (cdn_url, user_id))
    cur.close()
    conn.close()

    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'avatar_url': cdn_url})}