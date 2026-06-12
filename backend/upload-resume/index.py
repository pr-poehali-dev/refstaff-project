"""
Загрузка резюме кандидата.
Принимает файл в base64, сохраняет в БД и возвращает data URL для хранения.
Args: event - dict с httpMethod, body (base64 файл + имя)
Returns: JSON с resume_url
"""

import json
import os
import base64
import uuid
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    file_data = body.get('file_data')
    file_name = body.get('file_name', 'resume.pdf')
    candidate_name = body.get('candidate_name', '')

    if not file_data:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'file_data is required'})
        }

    ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else 'pdf'
    content_types = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    content_type = content_types.get(ext, 'application/octet-stream')

    # Формируем data URL для хранения в БД
    resume_url = f"data:{content_type};base64,{file_data}"

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'resume_url': resume_url})
    }