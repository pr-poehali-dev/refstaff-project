import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API для отправки email писем с подтверждением регистрации.
    Отправляет красиво оформленное письмо с токеном подтверждения.
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

    smtp_host = os.environ.get('EMAIL_SMTP_HOST')
    smtp_port = int(os.environ.get('EMAIL_SMTP_PORT', '587'))
    smtp_user = os.environ.get('EMAIL_FROM')
    smtp_password = os.environ.get('EMAIL_PASSWORD')

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
    to_email = body_data.get('to_email')
    action = body_data.get('action', 'verify')

    if not to_email:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing to_email'}),
            'isBase64Encoded': False
        }

    if action == 'custom':
        subject = body_data.get('subject', 'Уведомление iHUNT')
        html_content = body_data.get('html_content', '')
        if not html_content:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing html_content'}),
                'isBase64Encoded': False
            }
    else:
        user_name = body_data.get('user_name', '')
        verification_token = body_data.get('verification_token')
        base_url = body_data.get('base_url', 'https://i-hunt.ru')
        user_type = body_data.get('user_type', 'employee')

        if not verification_token:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }

        verification_url = f"{base_url}/verify-email?token={verification_token}"
        html_content = create_verification_email_html(user_name, verification_url, user_type)
        subject = 'Подтвердите вашу электронную почту'

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = smtp_user
    msg['To'] = to_email

    html_part = MIMEText(html_content, 'html', 'utf-8')
    msg.attach(html_part)

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Email sent successfully'}),
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


def create_verification_email_html(user_name: str, verification_url: str, user_type: str = 'employee') -> str:
    """Создает красиво оформленное HTML письмо для подтверждения email"""
    
    # Разные тексты для компаний и сотрудников
    if user_type == 'company':
        welcome_text = 'Спасибо за регистрацию компании на платформе <strong>iHUNT</strong>! Осталось всего один шаг — подтвердить вашу электронную почту.'
        action_text = 'Нажмите на кнопку ниже, чтобы активировать ваш аккаунт и начать привлекать таланты через рекомендации сотрудников:'
        benefits = [
            ('💼', 'Управление вакансиями', 'Создавайте вакансии и получайте качественных кандидатов от ваших сотрудников'),
            ('🎯', 'Умная система рекомендаций', 'Отслеживайте статус кандидатов и автоматизируйте выплату вознаграждений'),
            ('📊', 'Аналитика и отчеты', 'Следите за эффективностью программы и ROI рекомендательной системы'),
            ('⚡', 'Быстрый найм', 'Сократите время подбора персонала в 2-3 раза благодаря рекомендациям')
        ]
    else:
        welcome_text = 'Спасибо за регистрацию на платформе <strong>iHUNT</strong>! Осталось всего один шаг — подтвердить вашу электронную почту.'
        action_text = 'Нажмите на кнопку ниже, чтобы активировать ваш аккаунт и начать зарабатывать на рекомендациях:'
        benefits = [
            ('💰', 'Зарабатывайте на рекомендациях', 'Получайте вознаграждения за успешные рекомендации кандидатов'),
            ('🚀', 'Быстрые выплаты', 'Деньги поступают на счет сразу после найма рекомендованного кандидата'),
            ('🎯', 'Простой процесс', 'Рекомендуйте знакомых в пару кликов — мы позаботимся об остальном'),
            ('📈', 'Отслеживание статуса', 'Следите за всеми вашими рекомендациями в реальном времени')
        ]
    
    benefits_html = ''.join([
        f"""
                            <tr>
                                <td style="padding: 15px 0; border-bottom: 1px solid #e2e8f0;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td width="40" style="font-size: 24px;">{icon}</td>
                                            <td>
                                                <p style="margin: 0 0 5px; color: #2d3748; font-size: 16px; font-weight: 600;">{title}</p>
                                                <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">{desc}</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
        """
        for icon, title, desc in benefits
    ])
    return f"""
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Подтверждение электронной почты</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                                🎯 iHUNT
                            </h1>
                            <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                                Платформа поиска талантов
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                                Добро пожаловать{', ' + user_name if user_name else ''}! 👋
                            </h2>
                            
                            <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                {welcome_text}
                            </p>
                            
                            <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                {action_text}
                            </p>
                            
                            <!-- Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 30px;">
                                        <a href="{verification_url}" 
                                           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                                  color: #ffffff; text-decoration: none; padding: 16px 40px; 
                                                  border-radius: 8px; font-size: 16px; font-weight: 600; 
                                                  box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                                            ✅ Подтвердить электронную почту
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0 0 10px; color: #2d3748; font-size: 14px; font-weight: 600;">
                                    📌 Или скопируйте ссылку:
                                </p>
                                <p style="margin: 0; color: #667eea; font-size: 13px; word-break: break-all; font-family: monospace;">
                                    {verification_url}
                                </p>
                            </div>
                            
                            <p style="margin: 20px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                                <strong>Внимание:</strong> Ссылка действительна в течение 24 часов. 
                                Если вы не регистрировались на платформе, просто проигнорируйте это письмо.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Benefits -->
                    <tr>
                        <td style="padding: 0 30px 40px;">
                            <div style="background: linear-gradient(135deg, #f0f4ff 0%, #f7f0ff 100%); 
                                        padding: 25px; border-radius: 8px;">
                                <h3 style="margin: 0 0 20px; color: #2d3748; font-size: 18px; font-weight: 600; text-align: center;">
                                    🎁 Что вас ждет после активации:
                                </h3>
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    {benefits_html}
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                                С уважением,<br>
                                <strong style="color: #667eea;">Команда iHUNT</strong>
                            </p>
                            
                            <p style="margin: 15px 0 0; color: #a0aec0; font-size: 12px;">
                                Это автоматическое письмо, пожалуйста, не отвечайте на него.
                            </p>
                            
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                                    © 2026 iHUNT. Все права защищены.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""