"""
Блог: генерация SEO-статей через GPT и публикация на сайте.
GET  /?action=list            — список опубликованных статей
GET  /?action=get&slug=...    — получить статью по slug
POST /?action=generate        — сгенерировать новую статью (admin)
POST /?action=delete          — удалить статью (admin)
"""
import json
import os
import re
import urllib.request
import psycopg2
from datetime import datetime

POLZA_BASE_URL = 'https://api.polza.ai/api/v1'
MODEL = 'openai/gpt-4o-mini'
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p65890965_refstaff_project')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret',
}

SITE_URL = 'https://i-hunt.ru'
BRAND = 'iHUNT'

# Тематические пулы для разнообразия
TOPIC_POOLS = [
    'реферальный рекрутинг и его преимущества',
    'снижение стоимости найма персонала',
    'геймификация в HR и рекрутинге',
    'мотивация сотрудников рекомендовать коллег',
    'скорость закрытия вакансий в IT компаниях',
    'реферальные программы для ритейла',
    'найм без агентств: экономия бюджета HR',
    'удержание сотрудников через вовлечённость в найм',
    'KPI для HR отдела: метрики реферального найма',
    'автоматизация выплат бонусов за рекрутинг',
    'как повысить вовлечённость команды в найм',
    'реферальный найм в производственных компаниях',
    'внутренние рекомендации vs агентства: сравнение',
    'испытательный срок: почему рефералы проходят лучше',
    'реферальный рекрутинг для стартапов',
    'HR-аналитика: как измерить эффективность найма',
    'корпоративная культура и реферальные программы',
    'топ ошибок HR при запуске реферальной программы',
    'реферальный найм в банковском секторе',
    'цифровая трансформация HR-процессов',
]

KEY_PHRASES = [
    ('реферальный рекрутинг', SITE_URL),
    ('реферальная программа', SITE_URL),
    ('найм через сотрудников', SITE_URL),
    ('платформа для найма', SITE_URL),
    ('реферальный найм', SITE_URL),
]


def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn


def slugify(text: str) -> str:
    text = text.lower().strip()
    translit = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh',
        'з':'z','и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o',
        'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts',
        'ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
    }
    text = ''.join(translit.get(c, c) for c in text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text[:80].strip('-')


def get_existing_articles(conn) -> tuple:
    """Возвращает (topics, titles) — для передачи GPT и проверки дублей."""
    with conn.cursor() as cur:
        cur.execute(f'SELECT topic, title FROM {SCHEMA}.blog_posts ORDER BY created_at DESC LIMIT 50')
        rows = cur.fetchall()
    topics = [r[0] for r in rows]
    titles = [r[1] for r in rows]
    return topics, titles


def titles_are_similar(title_a: str, title_b: str, threshold: float = 0.6) -> bool:
    """Простая проверка на схожесть через общие слова (без внешних библиотек)."""
    def words(t):
        return set(re.sub(r'[^а-яёa-z0-9\s]', '', t.lower()).split())
    wa, wb = words(title_a), words(title_b)
    if not wa or not wb:
        return False
    intersection = wa & wb
    shorter = min(len(wa), len(wb))
    return len(intersection) / shorter >= threshold


def call_gpt(prompt: str) -> str:
    api_key = os.environ['POLZA_AI_API_KEY']
    payload = {
        'model': MODEL,
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.8,
        'max_tokens': 4096,
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        f'{POLZA_BASE_URL}/chat/completions',
        data=data,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=90) as r:
        result = json.loads(r.read())
    return result['choices'][0]['message']['content']


def fix_encoding(text: str) -> str:
    """Убирает символы-заменители (U+FFFD и похожие) которые появляются
    при обрезке UTF-8 на границе многобайтового символа."""
    # Убираем Unicode replacement character
    text = text.replace('\ufffd', '')
    # Убираем последовательности вида ??, которые бывают при двойной
    # ошибке кодировки — только если они окружены буквами (внутри слова)
    text = re.sub(r'(?<=[а-яёa-z])\?{1,2}(?=[а-яёa-z])', '', text, flags=re.IGNORECASE)
    return text


def inject_links(content: str) -> str:
    """Вшивает ссылки в первые вхождения ключевых фраз. Сначала чистит артефакты кодировки."""
    content = fix_encoding(content)
    used = set()
    for phrase, url in KEY_PHRASES:
        if phrase in used:
            continue
        pattern = re.compile(re.escape(phrase), re.IGNORECASE)
        def replacer(m, p=phrase, u=url, _used=used):
            if p in _used:
                return m.group(0)
            _used.add(p)
            return f'<a href="{u}" class="text-primary hover:underline font-medium">{m.group(0)}</a>'
        content = pattern.sub(replacer, content, count=1)
    return content


def generate_article(existing_topics: list, existing_titles: list) -> dict:
    import random
    available = [t for t in TOPIC_POOLS if t not in existing_topics]
    if not available:
        available = TOPIC_POOLS
    topic_hint = random.choice(available)
    existing_topics_str = '\n'.join(f'- {t}' for t in existing_topics[:20]) if existing_topics else 'нет'
    existing_titles_str = '\n'.join(f'- {t}' for t in existing_titles[:20]) if existing_titles else 'нет'

    prompt = f"""Ты SEO-копирайтер для HR-платформы {BRAND} ({SITE_URL}) — сервиса реферального рекрутинга с геймификацией.

УЖЕ НАПИСАННЫЕ СТАТЬИ — ТЕМЫ (не повторяй):
{existing_topics_str}

УЖЕ НАПИСАННЫЕ СТАТЬИ — ЗАГОЛОВКИ (твой заголовок должен быть ПОЛНОСТЬЮ другим):
{existing_titles_str}

ПОДСКАЗКА ДЛЯ НОВОЙ ТЕМЫ: {topic_hint}
Выбери эту тему или любую другую — главное, чтобы заголовок и содержание были уникальными и не повторяли ни одну из статей выше.

ЗАДАЧА: напиши одну полную SEO-статью для блога компании.

ТРЕБОВАНИЯ К СТРУКТУРЕ:
- Заголовок H1: 50-65 символов, включает ключевое слово
- Мета-описание: 140-160 символов
- Вступление: 2-3 предложения с болью читателя и обещанием решения
- 4-5 разделов H2, каждый 120-180 слов
- В конце: краткий итог + призыв попробовать {BRAND} бесплатно
- Общий объём: 800-1100 слов

ТРЕБОВАНИЯ К SEO:
- Используй LSI-ключевые слова: рекрутинг, HR, найм, сотрудники, вакансии, рекомендации, бонусы, кандидаты
- Ключевые слова вставляй естественно, не переспамивай
- Текст должен быть полезным и экспертным

ФОРМАТ ОТВЕТА — строго валидный JSON без markdown-обёртки:
{{
  "topic": "короткое название темы (до 80 символов)",
  "title": "SEO заголовок статьи",
  "metaDescription": "мета-описание 140-160 символов",
  "content": "HTML текст статьи. Используй теги: <h2>, <p>, <ul>, <li>, <strong>. НЕ включай H1 в content."
}}"""

    raw = call_gpt(prompt)
    raw = raw.strip()
    if raw.startswith('```'):
        raw = re.sub(r'^```[a-z]*\n?', '', raw)
        raw = re.sub(r'\n?```$', '', raw)
    return json.loads(raw)


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'list')
    headers = event.get('headers') or {}

    # Секрет читаем из заголовка (разные регистры) ИЛИ из тела запроса
    # (X-Admin-Secret фильтруется прокси, поэтому фронтенд шлёт в body)
    raw_body = event.get('body') or '{}'
    try:
        body_data = json.loads(raw_body)
    except Exception:
        body_data = {}

    admin_secret = (
        headers.get('x-admin-secret')
        or headers.get('X-Admin-Secret')
        or params.get('admin_secret')
        or body_data.get('admin_secret', '')
    )

    conn = get_db()

    # GET: список статей
    if method == 'GET' and action == 'list':
        page = int(params.get('page', 1))
        per_page = int(params.get('per_page', 12))
        offset = (page - 1) * per_page
        with conn.cursor() as cur:
            cur.execute(
                f'SELECT id, slug, title, meta_description, topic, published_at '
                f'FROM {SCHEMA}.blog_posts WHERE is_published=TRUE '
                f'ORDER BY published_at DESC LIMIT %s OFFSET %s',
                (per_page, offset)
            )
            rows = cur.fetchall()
            cur.execute(f'SELECT COUNT(*) FROM {SCHEMA}.blog_posts WHERE is_published=TRUE')
            total = cur.fetchone()[0]
        posts = [
            {'id': r[0], 'slug': r[1], 'title': r[2], 'metaDescription': r[3],
             'topic': r[4], 'publishedAt': r[5].isoformat() if r[5] else None}
            for r in rows
        ]
        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
            'body': json.dumps({'posts': posts, 'total': total, 'page': page, 'perPage': per_page})
        }

    # GET: одна статья по slug
    if method == 'GET' and action == 'get':
        slug = params.get('slug', '')
        with conn.cursor() as cur:
            cur.execute(
                f'SELECT id, slug, title, meta_description, content, topic, published_at '
                f'FROM {SCHEMA}.blog_posts WHERE slug=%s AND is_published=TRUE',
                (slug,)
            )
            row = cur.fetchone()
        if not row:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'not found'})}
        post = {
            'id': row[0], 'slug': row[1], 'title': row[2], 'metaDescription': row[3],
            'content': row[4], 'topic': row[5], 'publishedAt': row[6].isoformat() if row[6] else None
        }
        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
            'body': json.dumps({'post': post})
        }

    # POST или GET: генерация новой статьи
    # GET удобен для cron-job.org: ?action=generate&admin_secret=...
    if action == 'generate' and method in ('POST', 'GET'):
        if admin_secret != os.environ.get('ADMIN_SECRET', ''):
            return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'forbidden'})}

        existing_topics, existing_titles = get_existing_articles(conn)
        article = generate_article(existing_topics, existing_titles)

        # Проверяем схожесть заголовка с уже существующими
        for existing_title in existing_titles:
            if titles_are_similar(article['title'], existing_title):
                return {
                    'statusCode': 409,
                    'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'error': 'duplicate_title',
                        'message': f'Сгенерированный заголовок слишком похож на существующий: "{existing_title}"',
                        'generated_title': article['title']
                    })
                }

        content_with_links = inject_links(article['content'])
        slug_base = slugify(article['topic'])
        slug = slug_base
        # проверяем уникальность slug
        with conn.cursor() as cur:
            i = 1
            while True:
                cur.execute(f'SELECT 1 FROM {SCHEMA}.blog_posts WHERE slug=%s', (slug,))
                if not cur.fetchone():
                    break
                slug = f'{slug_base}-{i}'
                i += 1

            # Также проверяем уникальность заголовка в БД
            cur.execute(f'SELECT 1 FROM {SCHEMA}.blog_posts WHERE title=%s', (article['title'],))
            if cur.fetchone():
                return {
                    'statusCode': 409,
                    'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'duplicate_title', 'message': 'Статья с таким заголовком уже существует'})
                }

            cur.execute(
                f'INSERT INTO {SCHEMA}.blog_posts (slug, title, meta_description, content, topic) '
                f'VALUES (%s, %s, %s, %s, %s) RETURNING id',
                (slug, article['title'], article['metaDescription'], content_with_links, article['topic'])
            )
            post_id = cur.fetchone()[0]

        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True, 'id': post_id, 'slug': slug, 'title': article['title']})
        }

    # POST: cron — генерирует N статей за один вызов (для cron-job.org)
    # Вызывать: POST ?action=cron с заголовком X-Admin-Secret
    # Рекомендуемый cron: каждые 4 часа → 0 */4 * * *
    if method == 'POST' and action == 'cron':
        if admin_secret != os.environ.get('ADMIN_SECRET', ''):
            return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'forbidden'})}

        count = min(int(body_data.get('count', 1)), 5)  # максимум 5 за раз

        results = []
        existing_topics = get_existing_topics(conn)

        for _ in range(count):
            try:
                article = generate_article(existing_topics)
                content_with_links = inject_links(article['content'])
                slug_base = slugify(article['topic'])
                slug = slug_base
                with conn.cursor() as cur:
                    i = 1
                    while True:
                        cur.execute(f'SELECT 1 FROM {SCHEMA}.blog_posts WHERE slug=%s', (slug,))
                        if not cur.fetchone():
                            break
                        slug = f'{slug_base}-{i}'
                        i += 1
                    cur.execute(
                        f'INSERT INTO {SCHEMA}.blog_posts (slug, title, meta_description, content, topic) '
                        f'VALUES (%s, %s, %s, %s, %s) RETURNING id',
                        (slug, article['title'], article['metaDescription'], content_with_links, article['topic'])
                    )
                    post_id = cur.fetchone()[0]
                existing_topics.append(article['topic'])
                results.append({'id': post_id, 'slug': slug, 'title': article['title'], 'ok': True})
            except Exception as e:
                results.append({'ok': False, 'error': str(e)})

        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True, 'generated': len([r for r in results if r.get('ok')]), 'results': results})
        }

    # POST: удаление статьи
    if method == 'POST' and action == 'delete':
        if admin_secret != os.environ.get('ADMIN_SECRET', ''):
            return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'forbidden'})}
        post_id = body_data.get('id')
        with conn.cursor() as cur:
            cur.execute(f'DELETE FROM {SCHEMA}.blog_posts WHERE id=%s', (post_id,))
        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True})
        }

    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'unknown action'})}