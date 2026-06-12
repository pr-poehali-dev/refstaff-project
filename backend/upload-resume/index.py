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

    # Дополнительно отправляем резюме на email работодателя
    try:
        smtp_host = os.environ.get('EMAIL_SMTP_HOST', 'smtp.reg.ru')
        smtp_port = int(os.environ.get('EMAIL_SMTP_PORT', 587))
        email_from = os.environ.get('EMAIL_FROM', '')
        email_password = os.environ.get('EMAIL_PASSWORD', '')

        if email_from and email_password:
            file_bytes = base64.b64decode(file_data)

            msg = MIMEMultipart()
            msg['From'] = email_from
            msg['To'] = email_from
            msg['Subject'] = f'Резюме кандидата: {candidate_name or file_name}'

            msg.attach(MIMEText(f'Резюме от кандидата {candidate_name}\nФайл: {file_name}', 'plain', 'utf-8'))

            part = MIMEBase('application', 'octet-stream')
            part.set_payload(file_bytes)
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="{file_name}"')
            msg.attach(part)

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(email_from, email_password)
                server.sendmail(email_from, email_from, msg.as_string())
    except Exception:
        pass  # Email — некритично, продолжаем

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'resume_url': resume_url})
    }
