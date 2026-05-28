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
CHATGPT_URL = 'https://functions.poehali.dev/13c7d269-1c74-4047-8fe9-92d9dc5c8cb4'

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

    payload = {
        'messages': [{'role': 'user', 'content': prompt}],
        'model': 'openai/gpt-4o-mini',
        'temperature': 0.7,
        'max_tokens': 4000,
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        f'{CHATGPT_URL}?action=generate',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        result = json.loads(r.read())

    content = result.get('content', '').strip()
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
            f"SELECT id, questions FROM {SCHEMA}.vacancy_tests WHERE token = %s AND is_active = true",
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
        result['percentage'] = round(score / len(questions) * 100) if questions else 0
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