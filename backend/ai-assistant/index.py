"""
ИИ-помощник для работодателя в iHUNT.
Отвечает на вопросы о данных компании (вакансии, сотрудники, рекомендации, статистика)
и о работе платформы iHUNT.
"""

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request

POLZA_BASE_URL = "https://api.polza.ai/api/v1"
MODEL = "openai/gpt-4o-mini"

PLATFORM_KNOWLEDGE = """
Ты — виртуальный помощник платформы iHUNT (реферальный рекрутинг с геймификацией).
Отвечай на русском языке, кратко и по делу. Используй данные компании которые тебе передали.

=== КАК РАБОТАЕТ ПЛАТФОРМА iHUNT ===

ВАКАНСИИ:
- Создать вакансию: вкладка «Вакансии» → кнопка «Создать вакансию»
- Указать: должность, отдел, зарплату, описание, требования, вознаграждение и срок выплаты
- Архивировать: кнопка архива на карточке вакансии (сотрудники перестают её видеть)
- AI-тесты: на карточке вакансии → кнопка «Тесты» — ИИ генерирует тесты для кандидатов

СОТРУДНИКИ:
- Пригласить: вкладка «Сотрудники» → «Добавить сотрудника» → ввести данные
- QR-код / ссылка: в диалоге приглашения есть ссылка и QR-код для регистрации
- Роли: можно назначить администратором через кнопку «Роли» на карточке
- Уволенные: кнопка «Уволить» скрывает сотрудника от системы, данные сохраняются

РЕКОМЕНДАЦИИ:
- Сотрудник рекомендует кандидата на вакансию — появляется в разделе «Рекомендации»
- Статусы: На рассмотрении → Принят → Нанят → Вознаграждение выплачено
- Смена статуса: кнопки «Принять» / «Отклонить» на карточке кандидата

ВЫПЛАТЫ:
- Запросы на выплату сотрудников — вкладка «Выплаты»
- Настроить методы выплат (карта, СБП, наличные, реквизиты) — в той же вкладке
- Срок выплаты задаётся при создании вакансии (по умолчанию 30 дней после найма)

НОВОСТИ:
- Создать новость: вкладка «Новости» → «Создать»
- Категории: Новость, Достижение, Объявление, Блог
- Архивировать: кнопка архива на карточке (сотрудники не видят архивные)

ЧАТЫ:
- Вкладка «Чаты» — переписка с каждым сотрудником
- Можно отправлять текст и файлы (до 4 МБ)

СТАТИСТИКА:
- Вкладка «Статистика» — графики по рекомендациям, найму, топ сотрудников

ПОДПИСКА:
- Пробный период: 14 дней бесплатно
- Продлить: «Настройки» → «Подписка» или иконка карточки в шапке
- Тарифы: 19 900 ₽/мес или 202 980 ₽/год (скидка 15%)

НАСТРОЙКИ КОМПАНИИ:
- Кнопка «Настройки» в шапке: описание, сайт, отрасль, Telegram, VK, логотип
"""


def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)


def get_company_context(company_id: int) -> str:
    """Собирает актуальные данные компании для контекста."""
    conn = get_db_connection()
    cur = conn.cursor()

    # Вакансии
    cur.execute("""
        SELECT title, department, salary_display, status, reward_amount,
               (SELECT COUNT(*) FROM t_p65890965_refstaff_project.recommendations r WHERE r.vacancy_id = v.id) as rec_count
        FROM t_p65890965_refstaff_project.vacancies v
        WHERE v.company_id = %s
        ORDER BY v.created_at DESC LIMIT 20
    """, (company_id,))
    vacancies = cur.fetchall()

    # Сотрудники
    cur.execute("""
        SELECT first_name || ' ' || last_name as name, position, department,
               total_recommendations, successful_hires, is_admin, is_fired
        FROM t_p65890965_refstaff_project.users
        WHERE company_id = %s AND role != 'company_admin' OR (company_id = %s AND is_admin = true)
        ORDER BY total_recommendations DESC LIMIT 30
    """, (company_id, company_id))
    employees = cur.fetchall()

    # Рекомендации
    cur.execute("""
        SELECT r.candidate_name, r.status, r.reward_amount, r.created_at,
               v.title as vacancy_title,
               u.first_name || ' ' || u.last_name as recommended_by
        FROM t_p65890965_refstaff_project.recommendations r
        JOIN t_p65890965_refstaff_project.vacancies v ON r.vacancy_id = v.id
        LEFT JOIN t_p65890965_refstaff_project.users u ON r.recommended_by = u.id
        WHERE v.company_id = %s
        ORDER BY r.created_at DESC LIMIT 30
    """, (company_id,))
    recommendations = cur.fetchall()

    # Общая статистика
    cur.execute("""
        SELECT
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_vacancies,
            COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_vacancies
        FROM t_p65890965_refstaff_project.vacancies WHERE company_id = %s
    """, (company_id,))
    vac_stats = cur.fetchone()

    cur.execute("""
        SELECT
            COUNT(CASE WHEN is_fired = false THEN 1 END) as active_employees,
            COUNT(CASE WHEN is_fired = true THEN 1 END) as fired_employees
        FROM t_p65890965_refstaff_project.users WHERE company_id = %s
    """, (company_id,))
    emp_stats = cur.fetchone()

    cur.execute("""
        SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN r.status IN ('accepted', 'hired') THEN 1 END) as accepted,
            COUNT(CASE WHEN r.status = 'rejected' THEN 1 END) as rejected,
            COALESCE(SUM(CASE WHEN r.status IN ('accepted', 'hired') THEN r.reward_amount ELSE 0 END), 0) as total_rewards
        FROM t_p65890965_refstaff_project.recommendations r
        JOIN t_p65890965_refstaff_project.vacancies v ON r.vacancy_id = v.id
        WHERE v.company_id = %s
    """, (company_id,))
    rec_stats = cur.fetchone()

    cur.close()
    conn.close()

    # Формируем текстовый контекст
    lines = [f"\n=== ДАННЫЕ КОМПАНИИ (ID: {company_id}) ===\n"]

    lines.append(f"ОБЩАЯ СТАТИСТИКА:")
    lines.append(f"- Активных вакансий: {vac_stats['active_vacancies']}, в архиве: {vac_stats['archived_vacancies']}")
    lines.append(f"- Активных сотрудников: {emp_stats['active_employees']}, уволенных: {emp_stats['fired_employees']}")
    lines.append(f"- Всего рекомендаций: {rec_stats['total']} (на рассмотрении: {rec_stats['pending']}, принято: {rec_stats['accepted']}, отклонено: {rec_stats['rejected']})")
    lines.append(f"- Сумма вознаграждений к выплате: {int(rec_stats['total_rewards'])} ₽\n")

    if vacancies:
        lines.append("ВАКАНСИИ:")
        for v in vacancies:
            status_label = "активна" if v['status'] == 'active' else "в архиве"
            lines.append(f"- {v['title']} ({v['department'] or 'без отдела'}), {v['salary_display'] or 'зарплата не указана'}, вознаграждение: {v['reward_amount']} ₽, статус: {status_label}, рекомендаций: {v['rec_count']}")

    if employees:
        lines.append("\nСОТРУДНИКИ:")
        for e in employees:
            role = "Администратор" if e['is_admin'] else "Сотрудник"
            status = " [уволен]" if e['is_fired'] else ""
            lines.append(f"- {e['name']}{status}, {e['position'] or 'должность не указана'}, {e['department'] or ''}, роль: {role}, рекомендаций: {e['total_recommendations']}, нанятых: {e['successful_hires']}")

    if recommendations:
        lines.append("\nПОСЛЕДНИЕ РЕКОМЕНДАЦИИ:")
        for r in recommendations:
            lines.append(f"- {r['candidate_name']} на «{r['vacancy_title']}», рекомендовал: {r['recommended_by'] or 'неизвестно'}, статус: {r['status']}, вознаграждение: {r['reward_amount']} ₽")

    return "\n".join(lines)


def ask_gpt(messages: list) -> str:
    api_key = os.environ['POLZA_AI_API_KEY']
    data = json.dumps({
        "model": MODEL,
        "messages": messages,
        "max_tokens": 1000,
        "temperature": 0.5,
    }).encode('utf-8')
    req = urllib.request.Request(
        f"{POLZA_BASE_URL}/chat/completions",
        data=data,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
    return result['choices'][0]['message']['content']


def handler(event: dict, context) -> dict:
    """ИИ-помощник для работодателя — отвечает на вопросы по данным компании и платформе."""
    cors = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**cors, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    question = body.get('question', '').strip()
    company_id = body.get('company_id')
    history = body.get('history', [])  # список предыдущих сообщений [{role, content}]

    if not question:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'question обязателен'})}
    if not company_id:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'company_id обязателен'})}

    company_context = get_company_context(int(company_id))
    system_prompt = PLATFORM_KNOWLEDGE + company_context

    messages = [{"role": "system", "content": system_prompt}]
    # Добавляем историю (последние 6 сообщений)
    for msg in history[-6:]:
        if msg.get('role') in ('user', 'assistant') and msg.get('content'):
            messages.append({"role": msg['role'], "content": msg['content']})
    messages.append({"role": "user", "content": question})

    answer = ask_gpt(messages)

    return {
        'statusCode': 200,
        'headers': cors,
        'body': json.dumps({'answer': answer}, ensure_ascii=False)
    }