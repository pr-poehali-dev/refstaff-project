"""
Генерация и управление тестами по вакансиям с помощью GPT.
Поддерживает: создание теста (GPT), редактирование вопросов, получение теста по токену, сохранение результатов.
"""

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request

SCHEMA = 't_p65890965_refstaff_project'
POLZA_BASE_URL = 'https://api.polza.ai/api/v1'
DEFAULT_MODEL = 'openai/gpt-4o-mini'
SEND_EMAIL_URL = 'https://functions.poehali.dev/268341d7-c5b3-4c4f-a5fb-50277c318250'

CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
}


def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)
    conn.autocommit = True
    return conn


def send_test_result_email(to_email, company_name, candidate_name, vacancy_title, score, total, percentage):
    subject = f'Кандидат прошёл тест: {candidate_name}'
    score_color = '#22c55e' if percentage >= 70 else '#f59e0b' if percentage >= 40 else '#ef4444'
    html = f"""<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 30px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:26px;font-weight:600;">🎯 iHUNT</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">Платформа поиска талантов</p>
      </td></tr>
      <tr><td style="padding:36px 30px;">
        <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;">Новый результат теста 📋</h2>
        <p style="margin:0 0 24px;color:#4a5568;font-size:16px;line-height:1.6;">
          Кандидат <strong>{candidate_name}</strong> прошёл тест по вакансии <strong>«{vacancy_title}»</strong>.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0;color:#718096;font-size:14px;">Кандидат</td>
            <td style="padding:8px 0;color:#2d3748;font-size:14px;font-weight:600;text-align:right;">{candidate_name}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#718096;font-size:14px;border-top:1px solid #e2e8f0;">Вакансия</td>
            <td style="padding:8px 0;color:#2d3748;font-size:14px;font-weight:600;text-align:right;border-top:1px solid #e2e8f0;">{vacancy_title}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#718096;font-size:14px;border-top:1px solid #e2e8f0;">Результат</td>
            <td style="padding:8px 0;font-size:14px;font-weight:700;text-align:right;border-top:1px solid #e2e8f0;color:{score_color};">{score} / {total} ({percentage}%)</td>
          </tr>
        </table>
        <p style="margin:0;color:#718096;font-size:13px;line-height:1.5;">
          Посмотрите детальные результаты в личном кабинете iHUNT в разделе «Вакансии» → «Тесты».
        </p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:20px 30px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#a0aec0;font-size:12px;">© iHUNT — Платформа рекомендательного найма</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""

    payload = {
        'to_email': to_email,
        'subject': subject,
        'html_content': html,
        'action': 'custom',
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        SEND_EMAIL_URL,
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f'Email send error: {e}')


def resp(status, body):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(body, ensure_ascii=False, default=str)}


def gpt_generate_questions(vacancy_title, description, requirements, difficulty, count):
    difficulty_map = {
        'easy': 'лёгкого уровня (базовые знания, простые понятия)',
        'medium': 'среднего уровня (практические знания, реальные кейсы)',
        'hard': 'сложного уровня (экспертные знания, нестандартные задачи)',
    }
    difficulty_text = difficulty_map.get(difficulty, difficulty_map['medium'])

    prompt = f"""Ты — эксперт по подбору персонала. Создай тест {difficulty_text} для кандидата на вакансию.

Вакансия: {vacancy_title}
Описание: {description or 'не указано'}
Требования: {requirements or 'не указано'}

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
    if not content:
        raise ValueError('Empty response from GPT')
    # Убираем возможные markdown-блоки
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


def handler(event: dict, context) -> dict:
    """CRUD для тестов вакансий: генерация GPT, редактирование, публичное прохождение."""

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

    # POST /vacancy-tests?action=generate — генерация теста через GPT
    if method == 'POST' and action == 'generate':
        vacancy_id = body.get('vacancy_id')
        company_id = body.get('company_id')
        difficulty = body.get('difficulty', 'medium')
        questions_count = int(body.get('questions_count', 10))

        if not vacancy_id or not company_id:
            return resp(400, {'error': 'vacancy_id and company_id required'})

        cur.execute(
            f"SELECT title, description, requirements FROM {SCHEMA}.vacancies WHERE id = %s AND company_id = %s",
            (vacancy_id, company_id)
        )
        vacancy = cur.fetchone()
        if not vacancy:
            return resp(404, {'error': 'Vacancy not found'})

        questions = gpt_generate_questions(
            vacancy['title'],
            vacancy['description'],
            vacancy['requirements'],
            difficulty,
            questions_count
        )

        cur.execute(
            f"""INSERT INTO {SCHEMA}.vacancy_tests
                (vacancy_id, company_id, title, difficulty, questions_count, questions)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, token, title, difficulty, questions_count, questions, is_active, created_at""",
            (vacancy_id, company_id, f"Тест: {vacancy['title']}", difficulty, questions_count, json.dumps(questions))
        )
        test = dict(cur.fetchone())
        return resp(201, test)

    # GET /vacancy-tests?action=list&vacancy_id=X&company_id=Y — список тестов по вакансии
    if method == 'GET' and action == 'list':
        vacancy_id = query_params.get('vacancy_id')
        company_id = query_params.get('company_id')
        if not vacancy_id or not company_id:
            return resp(400, {'error': 'vacancy_id and company_id required'})

        cur.execute(
            f"""SELECT vt.id, vt.token, vt.title, vt.difficulty, vt.questions_count,
                       vt.is_active, vt.created_at,
                       COUNT(tr.id) as results_count
                FROM {SCHEMA}.vacancy_tests vt
                LEFT JOIN {SCHEMA}.test_results tr ON tr.test_id = vt.id
                WHERE vt.vacancy_id = %s AND vt.company_id = %s
                GROUP BY vt.id
                ORDER BY vt.created_at DESC""",
            (vacancy_id, company_id)
        )
        tests = [dict(r) for r in cur.fetchall()]
        return resp(200, tests)

    # GET /vacancy-tests?action=get&id=X&company_id=Y — получить тест с вопросами (для редактора)
    if method == 'GET' and action == 'get':
        test_id = query_params.get('id')
        company_id = query_params.get('company_id')
        cur.execute(
            f"SELECT * FROM {SCHEMA}.vacancy_tests WHERE id = %s AND company_id = %s",
            (test_id, company_id)
        )
        test = cur.fetchone()
        if not test:
            return resp(404, {'error': 'Test not found'})
        return resp(200, dict(test))

    # GET /vacancy-tests?action=public&token=XXX — публичный просмотр теста (без правильных ответов)
    if method == 'GET' and action == 'public':
        token = query_params.get('token')
        if not token:
            return resp(400, {'error': 'token required'})

        cur.execute(
            f"""SELECT vt.id, vt.title, vt.difficulty, vt.questions_count, vt.questions, vt.is_active,
                       v.title as vacancy_title, v.department, v.salary_display, c.name as company_name, c.logo_url as company_logo
                FROM {SCHEMA}.vacancy_tests vt
                JOIN {SCHEMA}.vacancies v ON v.id = vt.vacancy_id
                JOIN {SCHEMA}.companies c ON c.id = vt.company_id
                WHERE vt.token = %s""",
            (token,)
        )
        test = cur.fetchone()
        if not test:
            return resp(404, {'error': 'Test not found'})
        if not test['is_active']:
            return resp(403, {'error': 'Test is not active'})

        test_data = dict(test)
        # Скрываем правильные ответы от кандидата
        questions = test_data.get('questions') or []
        for q in questions:
            q.pop('correct_index', None)
        test_data['questions'] = questions
        return resp(200, test_data)

    # PUT /vacancy-tests?action=update — обновление вопросов работодателем
    if method == 'PUT' and action == 'update':
        test_id = body.get('id')
        company_id = body.get('company_id')
        if not test_id or not company_id:
            return resp(400, {'error': 'id and company_id required'})

        fields = []
        params = []
        if 'questions' in body:
            fields.append('questions = %s')
            params.append(json.dumps(body['questions']))
        if 'title' in body:
            fields.append('title = %s')
            params.append(body['title'])
        if 'is_active' in body:
            fields.append('is_active = %s')
            params.append(body['is_active'])
        if not fields:
            return resp(400, {'error': 'Nothing to update'})

        fields.append('updated_at = now()')
        params += [test_id, company_id]
        cur.execute(
            f"UPDATE {SCHEMA}.vacancy_tests SET {', '.join(fields)} WHERE id = %s AND company_id = %s RETURNING *",
            params
        )
        updated = cur.fetchone()
        if not updated:
            return resp(404, {'error': 'Test not found'})
        return resp(200, dict(updated))

    # POST /vacancy-tests?action=submit — кандидат сдаёт тест
    if method == 'POST' and action == 'submit':
        token = body.get('token')
        candidate_name = body.get('candidate_name', '').strip()
        candidate_email = body.get('candidate_email', '').strip()
        candidate_phone = body.get('candidate_phone', '').strip()
        answers = body.get('answers', [])  # [{question_id, selected_index}]

        if not token or not candidate_name:
            return resp(400, {'error': 'token and candidate_name required'})

        cur.execute(
            f"""SELECT vt.id, vt.questions, vt.company_id, vt.vacancy_id,
                       v.title as vacancy_title, c.name as company_name,
                       u.email as company_email
                FROM {SCHEMA}.vacancy_tests vt
                JOIN {SCHEMA}.vacancies v ON v.id = vt.vacancy_id
                JOIN {SCHEMA}.companies c ON c.id = vt.company_id
                LEFT JOIN {SCHEMA}.users u ON u.company_id = c.id AND u.is_hr_manager = true
                WHERE vt.token = %s AND vt.is_active = true
                LIMIT 1""",
            (token,)
        )
        test = cur.fetchone()
        if not test:
            return resp(404, {'error': 'Test not found or inactive'})

        questions = test['questions'] or []
        answers_map = {a['question_id']: a['selected_index'] for a in answers}
        score = 0
        for q in questions:
            if answers_map.get(q['id']) == q.get('correct_index'):
                score += 1

        cur.execute(
            f"""INSERT INTO {SCHEMA}.test_results
                (test_id, candidate_name, candidate_email, candidate_phone, answers, score, total_questions)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, score, total_questions, completed_at""",
            (test['id'], candidate_name, candidate_email or None, candidate_phone or None,
             json.dumps(answers), score, len(questions))
        )
        result = dict(cur.fetchone())
        percentage = round(score / len(questions) * 100) if questions else 0
        result['percentage'] = percentage

        if test.get('company_email'):
            send_test_result_email(
                to_email=test['company_email'],
                company_name=test['company_name'],
                candidate_name=candidate_name,
                vacancy_title=test['vacancy_title'],
                score=score,
                total=len(questions),
                percentage=percentage,
            )

        return resp(201, result)

    # GET /vacancy-tests?action=results&test_id=X&company_id=Y — результаты теста
    if method == 'GET' and action == 'results':
        test_id = query_params.get('test_id')
        company_id = query_params.get('company_id')
        cur.execute(
            f"SELECT id FROM {SCHEMA}.vacancy_tests WHERE id = %s AND company_id = %s",
            (test_id, company_id)
        )
        if not cur.fetchone():
            return resp(403, {'error': 'Access denied'})

        cur.execute(
            f"""SELECT id, candidate_name, candidate_email, candidate_phone,
                       score, total_questions, completed_at
                FROM {SCHEMA}.test_results WHERE test_id = %s ORDER BY completed_at DESC""",
            (test_id,)
        )
        results = [dict(r) for r in cur.fetchall()]
        for r in results:
            r['percentage'] = round(r['score'] / r['total_questions'] * 100) if r['total_questions'] else 0
        return resp(200, results)

    return resp(404, {'error': 'Unknown action'})