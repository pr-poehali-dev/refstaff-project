import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API для отправки сообщений с формы обратной связи на info@i-hunt.ru.
    Принимает имя, email и текст сообщения от пользователя.
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

    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')

    if not all([smtp_host, smtp_user, smtp_password]):
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'SMTP not configured'}),
            'isBase64Encoded': False
        }

    body_data = json.loads(event.get('body', '{}'))
    user_name = body_data.get('name', '')
    user_email = body_data.get('email', '')
    user_message = body_data.get('message', '')

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

    recipient_email = 'info@i-hunt.ru'
    
    html_content = create_contact_form_email_html(user_name, user_email, user_message)

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Новое сообщение с сайта iHUNT от {user_name}'
    msg['From'] = smtp_user
    msg['To'] = recipient_email
    msg['Reply-To'] = user_email

    html_part = MIMEText(html_content, 'html', 'utf-8')
    msg.attach(html_part)

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Сообщение успешно отправлено'}),
            'isBase64Encoded': False
        }

    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to send email'}),
            'isBase64Encoded': False
        }


def create_contact_form_email_html(name: str, email: str, message: str) -> str:
    """Создает HTML письмо для формы обратной связи"""
    return f"""
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Новое сообщение с сайта</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #16a34a 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                                🚀 iHUNT
                            </h1>
                            <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                                Новое сообщение с сайта
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                                📩 Новое обращение
                            </h2>
                            
                            <!-- Sender Info -->
                            <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
                                <p style="margin: 0 0 10px; color: #1a1a1a; font-size: 16px;">
                                    <strong>От кого:</strong> {name}
                                </p>
                                <p style="margin: 0; color: #1a1a1a; font-size: 16px;">
                                    <strong>Email:</strong> <a href="mailto:{email}" style="color: #2563eb; text-decoration: none;">{email}</a>
                                </p>
                            </div>
                            
                            <!-- Message -->
                            <div style="margin: 0 0 20px;">
                                <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                                    Сообщение:
                                </h3>
                                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                                    <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
{message}
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Action Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0 0;">
                                        <a href="mailto:{email}" 
                                           style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #2563eb 100%); 
                                                  color: #ffffff; text-decoration: none; padding: 14px 32px; 
                                                  border-radius: 8px; font-size: 16px; font-weight: 600;">
                                            ↩️ Ответить на письмо
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                Это автоматическое уведомление с формы обратной связи сайта <strong>iHUNT</strong>
                            </p>
                            <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                                © 2025 iHUNT. Платформа реферального рекрутинга.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
