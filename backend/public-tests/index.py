"""
Публичные тесты без авторизации: генерация по описанию вакансии, прохождение кандидатом,
PDF-отчёт работодателю на email. Лимит: 3 генерации в день по IP.
"""

import json
import os
import smtplib
import base64
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p65890965_refstaff_project'
POLZA_BASE_URL = 'https://api.polza.ai/api/v1'
DEFAULT_MODEL = 'openai/gpt-4o-mini'
DAILY_LIMIT = 3

CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)
    conn.autocommit = True
    return conn


def resp(status, body):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(body, ensure_ascii=False, default=str)}


def gpt_generate_questions(job_title, job_description, difficulty, count):
    difficulty_map = {
        'easy': 'лёгкого уровня (базовые знания, простые понятия)',
        'medium': 'среднего уровня (практические знания, реальные кейсы)',
        'hard': 'сложного уровня (экспертные знания, нестандартные задачи)',
    }
    difficulty_text = difficulty_map.get(difficulty, difficulty_map['medium'])

    prompt = f"""Ты — эксперт по подбору персонала. Создай тест {difficulty_text} для кандидата на вакансию.

Вакансия: {job_title}
Описание: {job_description or 'не указано'}

Создай ровно {count} вопросов с 4 вариантами ответа каждый. Ровно 1 вариант должен быть правильным.

Верни ТОЛЬКО валидный JSON без пояснений, без markdown, без ```json, строго такой структуры:
{{
  "questions": [
    {{
      "id": 1,
      "text": "Текст вопроса?",
      "options": ["Вариант A", "Вариант B", "Вариант C", "Вариант D"],
      "correct_index": 0
    }}
  ]
}}

correct_index — индекс правильного ответа (0-3). Вопросы должны быть релевантны вакансии."""

    api_key = os.environ.get('POLZA_AI_API_KEY', '')
    if not api_key:
        raise ValueError('POLZA_AI_API_KEY not configured')

    payload = {
        'model': DEFAULT_MODEL,
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.7,
        'max_tokens': 4000,
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        f'{POLZA_BASE_URL}/chat/completions',
        data=data,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        result = json.loads(r.read())

    content = result['choices'][0]['message']['content'].strip()
    if '```' in content:
        parts = content.split('```')
        for part in parts:
            if part.startswith('json'):
                content = part[4:].strip()
                break
            elif '{' in part:
                content = part.strip()
                break
    parsed = json.loads(content)
    return parsed.get('questions', [])


def generate_pdf(job_title, candidate_name, candidate_phone, candidate_email,
                 score, total, percentage, answers_detail, completed_at):
    """Генерирует PDF-отчёт через fpdf2, возвращает bytes."""
    from fpdf import FPDF

    SCORE_COLOR = (34, 197, 94) if percentage >= 70 else (245, 158, 11) if percentage >= 40 else (239, 68, 68)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Заголовок
    pdf.set_fill_color(102, 126, 234)
    pdf.rect(0, 0, 210, 32, 'F')
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Helvetica', 'B', 18)
    pdf.set_xy(10, 8)
    pdf.cell(0, 10, 'iHUNT - Результат теста', ln=True)
    pdf.set_font('Helvetica', '', 11)
    pdf.set_xy(10, 20)
    pdf.cell(0, 8, f'Вакансия: {job_title}', ln=True)

    pdf.set_text_color(0, 0, 0)
    pdf.ln(8)

    # Блок кандидата
    pdf.set_font('Helvetica', 'B', 13)
    pdf.cell(0, 8, 'Кандидат', ln=True)
    pdf.set_font('Helvetica', '', 11)
    pdf.set_fill_color(248, 250, 252)
    pdf.set_draw_color(226, 232, 240)

    rows = [
        ('Имя', candidate_name),
        ('Телефон', candidate_phone or '—'),
        ('Email', candidate_email or '—'),
        ('Дата прохождения', str(completed_at)[:16].replace('T', ' ')),
    ]
    for label, value in rows:
        pdf.set_font('Helvetica', '', 10)
        pdf.set_fill_color(248, 250, 252)
        pdf.cell(50, 8, label, border=1, fill=True)
        pdf.set_font('Helvetica', 'B', 10)
        pdf.cell(0, 8, value, border=1, ln=True)

    pdf.ln(6)

    # Результат
    pdf.set_font('Helvetica', 'B', 13)
    pdf.cell(0, 8, 'Результат', ln=True)
    pdf.set_font('Helvetica', 'B', 28)
    pdf.set_text_color(*SCORE_COLOR)
    pdf.cell(0, 14, f'{percentage}%  ({score}/{total})', ln=True, align='C')
    pdf.set_text_color(0, 0, 0)
    pdf.ln(4)

    # Разбор ответов
    pdf.set_font('Helvetica', 'B', 13)
    pdf.cell(0, 8, 'Разбор ответов', ln=True)
    pdf.ln(2)

    for i, a in enumerate(answers_detail):
        is_correct = a.get('is_correct', False)
        mark = '[OK]' if is_correct else '[X]'
        mark_color = (34, 197, 94) if is_correct else (239, 68, 68)

        # Вопрос
        pdf.set_font('Helvetica', 'B', 10)
        pdf.set_text_color(*mark_color)
        pdf.cell(10, 6, mark)
        pdf.set_text_color(0, 0, 0)
        q_text = f"{i + 1}. {a.get('question', '')}"
        pdf.multi_cell(0, 6, q_text)

        # Варианты
        options = a.get('options', [])
        correct_idx = a.get('correct_index', -1)
        selected_idx = a.get('selected_index', -1)

        for oi, opt in enumerate(options):
            is_opt_correct = oi == correct_idx
            is_opt_selected = oi == selected_idx
            prefix = '  '
            if is_opt_correct and is_opt_selected:
                pdf.set_text_color(34, 197, 94)
                prefix = '  ✓ '
            elif is_opt_correct:
                pdf.set_text_color(34, 197, 94)
                prefix = '  ✓ '
            elif is_opt_selected:
                pdf.set_text_color(239, 68, 68)
                prefix = '  ✗ '
            else:
                pdf.set_text_color(113, 128, 150)
            pdf.set_font('Helvetica', '', 9)
            pdf.set_x(15)
            pdf.multi_cell(0, 5, f'{prefix}{opt}')

        pdf.set_text_color(0, 0, 0)
        pdf.ln(2)

    return bytes(pdf.output())


def send_pdf_email(to_email, job_title, candidate_name, score, total, percentage, pdf_bytes):
    smtp_host = os.environ.get('EMAIL_SMTP_HOST', '')
    smtp_port = int(os.environ.get('EMAIL_SMTP_PORT', 587))
    from_email = os.environ.get('EMAIL_FROM', '')
    password = os.environ.get('EMAIL_PASSWORD', '')

    score_color = '#22c55e' if percentage >= 70 else '#f59e0b' if percentage >= 40 else '#ef4444'

    html = f"""<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:28px 30px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:24px;">🎯 iHUNT</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Платформа поиска талантов</p>
      </td></tr>
      <tr><td style="padding:32px 30px;">
        <h2 style="margin:0 0 12px;color:#1a1a1a;font-size:20px;">Кандидат прошёл тест 📋</h2>
        <p style="margin:0 0 20px;color:#4a5568;font-size:15px;">
          <strong>{candidate_name}</strong> завершил тест по вакансии <strong>«{job_title}»</strong>
        </p>
        <div style="background:#f8fafc;border-radius:8px;padding:20px;text-align:center;margin-bottom:20px;">
          <p style="margin:0 0 4px;color:#718096;font-size:13px;">Результат</p>
          <p style="margin:0;font-size:36px;font-weight:700;color:{score_color};">{percentage}%</p>
          <p style="margin:4px 0 0;color:#718096;font-size:13px;">{score} правильных из {total}</p>
        </div>
        <p style="margin:0;color:#718096;font-size:13px;">
          Подробный разбор ответов — в приложенном PDF-файле.
        </p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:16px 30px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#a0aec0;font-size:12px;">© iHUNT — Платформа рекомендательного найма</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = f'Результат теста: {candidate_name} — {job_title}'
    msg.attach(MIMEText(html, 'html', 'utf-8'))

    pdf_part = MIMEApplication(pdf_bytes, _subtype='pdf')
    safe_name = candidate_name.replace(' ', '_')[:30]
    pdf_part.add_header('Content-Disposition', 'attachment', filename=f'result_{safe_name}.pdf')
    msg.attach(pdf_part)

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(from_email, password)
        server.send_message(msg)


def handler(event: dict, context) -> dict:
    """Публичные тесты: генерация, редактирование, прохождение кандидатом, PDF на почту."""

    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action', '')

    body = {}
    raw = event.get('body') or '{}'
    if isinstance(raw, str):
        try:
            body = json.loads(raw)
        except Exception:
            body = {}

    conn = get_db()
    cur = conn.cursor()

    # POST ?action=generate — создать тест по описанию вакансии
    if method == 'POST' and action == 'generate':
        ip = (event.get('requestContext') or {}).get('identity', {}).get('sourceIp', 'unknown')
        employer_email = body.get('employer_email', '').strip()
        job_title = body.get('job_title', '').strip()
        job_description = body.get('job_description', '').strip()
        difficulty = body.get('difficulty', 'medium')
        questions_count = int(body.get('questions_count', 10))

        if not employer_email or not job_title:
            return resp(400, {'error': 'employer_email и job_title обязательны'})

        # Проверка лимита по IP
        cur.execute(
            f"""INSERT INTO {SCHEMA}.public_test_ip_limits (ip_address, generation_date, count)
                VALUES (%s, CURRENT_DATE, 1)
                ON CONFLICT (ip_address, generation_date)
                DO UPDATE SET count = public_test_ip_limits.count + 1
                RETURNING count""",
            (ip,)
        )
        row = cur.fetchone()
        if row and row['count'] > DAILY_LIMIT:
            return resp(429, {'error': f'Лимит {DAILY_LIMIT} генерации в день исчерпан. Попробуйте завтра.'})

        questions = gpt_generate_questions(job_title, job_description, difficulty, questions_count)

        cur.execute(
            f"""INSERT INTO {SCHEMA}.public_tests
                (employer_email, job_title, job_description, difficulty, questions_count, questions, created_by_ip)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, token, job_title, difficulty, questions_count, questions, is_active, created_at""",
            (employer_email, job_title, job_description or None, difficulty,
             questions_count, json.dumps(questions), ip)
        )
        test = dict(cur.fetchone())
        return resp(201, test)

    # GET ?action=get&token=XXX — получить тест для редактирования или прохождения
    if method == 'GET' and action == 'get':
        token = query_params.get('token')
        if not token:
            return resp(400, {'error': 'token required'})
        cur.execute(
            f"SELECT * FROM {SCHEMA}.public_tests WHERE token = %s",
            (token,)
        )
        test = cur.fetchone()
        if not test:
            return resp(404, {'error': 'Тест не найден'})
        return resp(200, dict(test))

    # GET ?action=public&token=XXX — публичный просмотр (без правильных ответов)
    if method == 'GET' and action == 'public':
        token = query_params.get('token')
        if not token:
            return resp(400, {'error': 'token required'})
        cur.execute(
            f"""SELECT id, token, job_title, difficulty, questions_count, questions, is_active
                FROM {SCHEMA}.public_tests WHERE token = %s AND is_active = true""",
            (token,)
        )
        test = cur.fetchone()
        if not test:
            return resp(404, {'error': 'Тест не найден или неактивен'})
        result = dict(test)
        # Скрываем правильные ответы
        clean_questions = []
        for q in (result.get('questions') or []):
            clean_questions.append({
                'id': q['id'],
                'text': q['text'],
                'options': q['options'],
            })
        result['questions'] = clean_questions
        result['company_name'] = 'iHUNT'
        result['vacancy_title'] = result['job_title']
        return resp(200, result)

    # PUT ?action=update — обновить вопросы теста
    if method == 'PUT' and action == 'update':
        token = body.get('token')
        questions = body.get('questions')
        is_active = body.get('is_active')

        if not token:
            return resp(400, {'error': 'token required'})

        updates = ['updated_at = now()']
        params = []
        if questions is not None:
            updates.append('questions = %s')
            params.append(json.dumps(questions))
        if is_active is not None:
            updates.append('is_active = %s')
            params.append(is_active)

        params.append(token)
        cur.execute(
            f"""UPDATE {SCHEMA}.public_tests SET {', '.join(updates)}
                WHERE token = %s
                RETURNING id, token, job_title, difficulty, questions_count, questions, is_active""",
            params
        )
        test = cur.fetchone()
        if not test:
            return resp(404, {'error': 'Тест не найден'})
        return resp(200, dict(test))

    # POST ?action=submit — кандидат отправляет ответы
    if method == 'POST' and action == 'submit':
        token = body.get('token')
        candidate_name = body.get('candidate_name', '').strip()
        candidate_email = body.get('candidate_email', '').strip()
        candidate_phone = body.get('candidate_phone', '').strip()
        answers = body.get('answers', [])

        if not token or not candidate_name:
            return resp(400, {'error': 'token и candidate_name обязательны'})

        cur.execute(
            f"SELECT * FROM {SCHEMA}.public_tests WHERE token = %s AND is_active = true",
            (token,)
        )
        test = cur.fetchone()
        if not test:
            return resp(404, {'error': 'Тест не найден или неактивен'})

        questions = test['questions'] or []
        answers_map = {a['question_id']: a['selected_index'] for a in answers}
        score = 0
        for q in questions:
            if answers_map.get(q['id']) == q.get('correct_index'):
                score += 1

        cur.execute(
            f"""INSERT INTO {SCHEMA}.public_test_results
                (test_id, candidate_name, candidate_email, candidate_phone, answers, score, total_questions)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, score, total_questions, completed_at""",
            (test['id'], candidate_name, candidate_email or None, candidate_phone or None,
             json.dumps(answers), score, len(questions))
        )
        result = dict(cur.fetchone())
        percentage = round(score / len(questions) * 100) if questions else 0
        result['percentage'] = percentage

        # Формируем детали ответов для PDF
        answers_detail = []
        for q in questions:
            sel = answers_map.get(q['id'], -1)
            answers_detail.append({
                'question': q['text'],
                'options': q['options'],
                'correct_index': q.get('correct_index', -1),
                'selected_index': sel,
                'is_correct': sel == q.get('correct_index', -1),
            })

        # Генерируем и отправляем PDF
        try:
            pdf_bytes = generate_pdf(
                job_title=test['job_title'],
                candidate_name=candidate_name,
                candidate_phone=candidate_phone,
                candidate_email=candidate_email,
                score=score,
                total=len(questions),
                percentage=percentage,
                answers_detail=answers_detail,
                completed_at=result['completed_at'],
            )
            send_pdf_email(
                to_email=test['employer_email'],
                job_title=test['job_title'],
                candidate_name=candidate_name,
                score=score,
                total=len(questions),
                percentage=percentage,
                pdf_bytes=pdf_bytes,
            )
        except Exception as e:
            print(f'PDF/email error: {e}')

        return resp(201, result)

    return resp(404, {'error': 'Unknown action'})
