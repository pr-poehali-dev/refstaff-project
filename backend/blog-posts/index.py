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
import urllib.error
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
    # Реферальный рекрутинг
    'реферальный рекрутинг и его преимущества',
    'снижение стоимости найма через реферальные программы',
    'геймификация в реферальном рекрутинге',
    'мотивация сотрудников рекомендовать коллег',
    'реферальные программы для ритейла',
    'найм без агентств: экономия бюджета HR',
    'удержание сотрудников через вовлечённость в найм',
    'KPI для HR отдела: метрики реферального найма',
    'внутренние рекомендации vs агентства: сравнение',
    'испытательный срок: почему рефералы проходят лучше',
    'реферальный рекрутинг для стартапов',
    'реферальный найм в производственных компаниях',
    'топ ошибок HR при запуске реферальной программы',
    'реферальный найм в банковском секторе',
    'автоматизация выплат бонусов за рекрутинг',

    # Подбор персонала
    'как написать продающее описание вакансии',
    'воронка подбора персонала: этапы и метрики',
    'как сократить время закрытия вакансии',
    'массовый подбор персонала: инструменты и лайфхаки',
    'подбор персонала в IT: особенности и сложности',
    'как оценить hard skills кандидата на собеседовании',
    'soft skills в найме: как проверить на интервью',
    'структурированное интервью vs свободное: что эффективнее',
    'кейс-интервью: когда и как использовать',
    'техническое интервью: лучшие практики для HR',
    'как проводить групповые собеседования',
    'пробный день: плюсы и минусы для работодателя',
    'как отказывать кандидатам правильно',
    'ATS-системы: как выбрать и внедрить',
    'скрининг резюме: на что обращать внимание',
    'нетворкинг как инструмент рекрутера',
    'холодный поиск кандидатов в LinkedIn и соцсетях',
    'Boolean search: как находить редких специалистов',
    'рекрутинг через Telegram: каналы и группы',
    'job boards в России: сравнение HeadHunter, Авито, SuperJob',

    # Онбординг и адаптация
    'онбординг новых сотрудников: чек-лист HR',
    'испытательный срок: как сделать его эффективным',
    'почему сотрудники уходят в первые три месяца',
    'наставничество как инструмент адаптации',
    'welcome-book для новичков: что включить',
    'удалённый онбординг: особенности и инструменты',

    # Удержание и вовлечённость
    'почему сотрудники уходят: топ причин текучки',
    'как удержать ключевых сотрудников',
    'нематериальная мотивация: что работает в {year} году',
    'системы грейдов и карьерных треков',
    'корпоративная культура как конкурентное преимущество',
    'wellbeing-программы: влияние на удержание',
    'employee experience: как улучшить опыт сотрудника',
    'регулярные one-on-one встречи: польза для HR',
    'как работать с выгоранием команды',

    # HR-аналитика и метрики
    'HR-аналитика: ключевые метрики для бизнеса',
    'стоимость найма: как считать и снижать',
    'time-to-hire: как ускорить закрытие вакансий',
    'quality of hire: как измерить качество найма',
    'eNPS: как измерить лояльность сотрудников',
    'предиктивная аналитика в HR',
    'HR dashboard: какие показатели отслеживать',
    'текучесть персонала: формулы и нормы по отраслям',

    # HR-бренд и EVP
    'employer branding: как стать привлекательным работодателем',
    'EVP (ценностное предложение работодателя): как сформулировать',
    'отзывы сотрудников на работодателей: управление репутацией',
    'карьерный сайт компании: что должно быть обязательно',
    'HR-бренд в соцсетях: стратегия продвижения',
    'участие в ярмарках вакансий и карьерных мероприятиях',

    # Тренды и технологии в HR
    'цифровая трансформация HR-процессов',
    'искусственный интеллект в рекрутинге',
    'HR-автоматизация: что можно и что нельзя делегировать ИИ',
    'чат-боты для HR: применение и ограничения',
    'видеоинтервью: инструменты и советы',
    'гибридная работа: как адаптировать HR-процессы',
    'работа с поколением Z: особенности найма и удержания',
    'навыки рекрутера будущего',
    'people analytics: от данных к решениям',
    'agile в HR: гибкие методологии в управлении персоналом',
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
        cur.execute(f'SELECT topic, title FROM {SCHEMA}.blog_posts ORDER BY created_at DESC LIMIT 200')
        rows = cur.fetchall()
    topics = [r[0] for r in rows]
    titles = [r[1] for r in rows]
    return topics, titles


def titles_are_similar(title_a: str, title_b: str, threshold: float = 0.55) -> bool:
    """Простая проверка на схожесть через общие слова (без внешних библиотек)."""
    STOP_WORDS = {'в', 'и', 'на', 'с', 'по', 'для', 'как', 'что', 'от', 'к', 'о', 'из', 'не', 'или', 'а', 'но'}
    def words(t):
        return set(re.sub(r'[^а-яёa-z0-9\s]', '', t.lower()).split()) - STOP_WORDS
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
        'max_tokens': 2500,
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
    # Убираем все Unicode replacement characters (одиночные и в группах)
    text = re.sub(r'\ufffd+', '', text)
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
    current_year = datetime.utcnow().year
    available = [t.format(year=current_year) for t in TOPIC_POOLS if t.format(year=current_year) not in existing_topics]
    if not available:
        available = [t.format(year=current_year) for t in TOPIC_POOLS]
    topic_hint = random.choice(available)
    existing_topics_str = '\n'.join(f'- {t}' for t in existing_topics) if existing_topics else 'нет'
    existing_titles_str = '\n'.join(f'- {t}' for t in existing_titles) if existing_titles else 'нет'

    prompt = f"""Ты SEO-копирайтер для блога реферальной HR-платформы. Блог охватывает широкую HR-тематику: подбор персонала, адаптация, удержание, HR-аналитика, тренды рынка труда.

УЖЕ НАПИСАННЫЕ СТАТЬИ — ТЕМЫ (не повторяй эти темы даже в другой формулировке или синонимами):
{existing_topics_str}

УЖЕ НАПИСАННЫЕ СТАТЬИ — ЗАГОЛОВКИ (твой заголовок должен быть ПОЛНОСТЬЮ другим, не перефразируй эти заголовки):
{existing_titles_str}

КРИТИЧЕСКИ ВАЖНО: Если подсказка ниже похожа по смыслу на одну из уже написанных тем — игнорируй её и выбери совершенно другую тему. "Agile в HR" и "гибкие методологии в HR" — это одна и та же тема. Нельзя писать про одно и то же разными словами.

ПОДСКАЗКА ДЛЯ НОВОЙ ТЕМЫ: {topic_hint}
Выбери эту тему ТОЛЬКО если она не пересекается по смыслу ни с одной из уже написанных. Иначе выбери совершенно другую HR-тему.

ТЕКУЩИЙ ГОД: {current_year}. Используй его везде где упоминается год (в заголовке, тексте, метаописании).

ЗАДАЧА: напиши одну полную SEO-статью для HR-блога.

ТРЕБОВАНИЯ К СТРУКТУРЕ:
- Заголовок H1: 50-70 символов, включает ключевое слово
- Мета-описание: 140-160 символов
- Вступление: 2-3 предложения с болью HR-специалиста или руководителя и обещанием решения
- 4-5 разделов H2, каждый 120-180 слов с конкретными советами и примерами
- В конце: краткий итог (2-3 предложения). Если тема близка к реферальному найму — добавь нативное упоминание нашего сервиса через местоимения: "наша платформа", "мы", "наш сервис", "мы как реферальная платформа" — без упоминания каких-либо конкретных названий или брендов
- Общий объём: 800-1100 слов

ВАЖНО — ЗАПРЕЩЕНО:
- Упоминать любые названия брендов, продуктов, платформ или сервисов (в том числе наш)
- Вместо названия платформы всегда используй: "наш сервис", "наша платформа", "мы", "наша реферальная система", "наш инструмент"
- Текст должен звучать естественно от первого лица множественного числа, как будто автор — сотрудник платформы

ТРЕБОВАНИЯ К SEO:
- Ключевые слова подбирай под тему статьи естественно
- Базовые LSI для любой HR-статьи: HR, найм, сотрудники, персонал, кандидаты, работодатель
- Текст должен быть практичным, с конкретными рекомендациями

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


def notify_indexnow(urls: list[str]) -> None:
    """Отправляет список URL в IndexNow (Яндекс + Bing) для мгновенной индексации."""
    key = os.environ.get('INDEXNOW_KEY', '')
    if not key:
        return
    payload = json.dumps({
        'host': 'i-hunt.ru',
        'key': key,
        'keyLocation': f'https://i-hunt.ru/{key}.txt',
        'urlList': urls,
    }).encode()
    for endpoint in [
        'https://yandex.com/indexnow',
        'https://www.bing.com/indexnow',
    ]:
        try:
            req = urllib.request.Request(
                endpoint,
                data=payload,
                headers={'Content-Type': 'application/json; charset=utf-8'},
                method='POST',
            )
            urllib.request.urlopen(req, timeout=5)
        except Exception:
            pass


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
            'id': row[0], 'slug': row[1], 'title': fix_encoding(row[2] or ''), 'metaDescription': fix_encoding(row[3] or ''),
            'content': fix_encoding(row[4] or ''), 'topic': row[5], 'publishedAt': row[6].isoformat() if row[6] else None
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

        # До 3 попыток генерации, если GPT вернул похожий заголовок
        article = None
        last_duplicate = None
        for _attempt in range(3):
            candidate = generate_article(existing_topics, existing_titles)
            duplicate_of = next((t for t in existing_titles if titles_are_similar(candidate['title'], t)), None)
            if not duplicate_of:
                article = candidate
                break
            last_duplicate = duplicate_of

        if article is None:
            return {
                'statusCode': 409,
                'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': 'duplicate_title',
                    'message': f'После 3 попыток не удалось сгенерировать уникальный заголовок. Последний дубль: "{last_duplicate}"',
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

        notify_indexnow([f'https://i-hunt.ru/blog/{slug}'])

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
        existing_topics, existing_titles = get_existing_articles(conn)

        for _ in range(count):
            try:
                # До 3 попыток генерации при дубле
                article = None
                last_dup = None
                for _attempt in range(3):
                    candidate = generate_article(existing_topics, existing_titles)
                    dup = next((t for t in existing_titles if titles_are_similar(candidate['title'], t)), None)
                    if not dup:
                        article = candidate
                        break
                    last_dup = dup

                if article is None:
                    results.append({'ok': False, 'error': f'duplicate_title после 3 попыток: "{last_dup}"'})
                    continue

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
                    cur.execute(f'SELECT 1 FROM {SCHEMA}.blog_posts WHERE title=%s', (article['title'],))
                    if cur.fetchone():
                        results.append({'ok': False, 'error': 'duplicate_title: точное совпадение'})
                        continue
                    cur.execute(
                        f'INSERT INTO {SCHEMA}.blog_posts (slug, title, meta_description, content, topic) '
                        f'VALUES (%s, %s, %s, %s, %s) RETURNING id',
                        (slug, article['title'], article['metaDescription'], content_with_links, article['topic'])
                    )
                    post_id = cur.fetchone()[0]
                existing_topics.append(article['topic'])
                existing_titles.append(article['title'])
                results.append({'id': post_id, 'slug': slug, 'title': article['title'], 'ok': True})
            except Exception as e:
                results.append({'ok': False, 'error': str(e)})

        new_urls = [f"https://i-hunt.ru/blog/{r['slug']}" for r in results if r.get('ok')]
        if new_urls:
            notify_indexnow(new_urls)

        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True, 'generated': len([r for r in results if r.get('ok')]), 'results': results})
        }

    # GET: верификационный файл IndexNow — поисковики проверяют владение доменом
    # URL: /{INDEXNOW_KEY}.txt — настраивается через Яндекс.Вебмастер → IndexNow
    if method == 'GET' and action == 'indexnow-verify':
        key = os.environ.get('INDEXNOW_KEY', '')
        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8'},
            'body': key,
        }

    # GET: RSS-лента для Яндекс.Дзен и других агрегаторов
    if method == 'GET' and action == 'rss':
        with conn.cursor() as cur:
            cur.execute(
                f'SELECT slug, title, meta_description, content, published_at FROM {SCHEMA}.blog_posts '
                f'WHERE is_published=TRUE ORDER BY published_at DESC LIMIT 50'
            )
            rows = cur.fetchall()

        def xml_escape(s):
            return (s or '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

        now_rfc = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S +0000')
        lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">',
            '  <channel>',
            f'    <title>{BRAND} — блог об HR и рекрутинге</title>',
            f'    <link>{SITE_URL}/blog</link>',
            f'    <description>Статьи о реферальном рекрутинге, HR-аналитике и подборе персонала</description>',
            '    <language>ru</language>',
            f'    <lastBuildDate>{now_rfc}</lastBuildDate>',
            f'    <atom:link href="{SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml"/>',
        ]
        for slug, title, meta_description, content, published_at in rows:
            pub_date = published_at.strftime('%a, %d %b %Y %H:%M:%S +0000') if published_at else now_rfc
            lines += [
                '    <item>',
                f'      <title>{xml_escape(title)}</title>',
                f'      <link>{SITE_URL}/blog/{slug}</link>',
                f'      <guid isPermaLink="true">{SITE_URL}/blog/{slug}</guid>',
                f'      <pubDate>{pub_date}</pubDate>',
                f'      <description>{xml_escape(meta_description or "")}</description>',
                f'      <content:encoded><![CDATA[{content or ""}]]></content:encoded>',
                '    </item>',
            ]
        lines += ['  </channel>', '</rss>']
        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/rss+xml; charset=utf-8'},
            'body': '\n'.join(lines)
        }

    # GET: динамический sitemap всех опубликованных статей (XML)
    if method == 'GET' and action == 'sitemap':
        with conn.cursor() as cur:
            cur.execute(
                f'SELECT slug, published_at FROM {SCHEMA}.blog_posts '
                f'WHERE is_published=TRUE ORDER BY published_at DESC'
            )
            rows = cur.fetchall()
        lines = ['<?xml version="1.0" encoding="UTF-8"?>',
                 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
        for slug, published_at in rows:
            lastmod = published_at.strftime('%Y-%m-%d') if published_at else '2026-01-01'
            lines.append(
                f'  <url>'
                f'<loc>https://i-hunt.ru/blog/{slug}</loc>'
                f'<lastmod>{lastmod}</lastmod>'
                f'<changefreq>monthly</changefreq>'
                f'<priority>0.7</priority>'
                f'</url>'
            )
        lines.append('</urlset>')
        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/xml; charset=utf-8'},
            'body': '\n'.join(lines)
        }

    # POST: зафиксировать просмотр статьи
    if method == 'POST' and action == 'view':
        post_id = body_data.get('post_id')
        session_id = body_data.get('session_id', '')[:64]
        if not post_id or not session_id:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'missing params'})}
        with conn.cursor() as cur:
            cur.execute(
                f'INSERT INTO {SCHEMA}.blog_post_views (post_id, session_id) VALUES (%s, %s) ON CONFLICT DO NOTHING',
                (post_id, session_id)
            )
            cur.execute(f'SELECT COUNT(*) FROM {SCHEMA}.blog_post_views WHERE post_id=%s', (post_id,))
            count = cur.fetchone()[0]
        return {'statusCode': 200, 'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'}, 'body': json.dumps({'views': count})}

    # GET: статистика статьи (просмотры + реакции)
    if method == 'GET' and action == 'stats':
        post_id = params.get('post_id')
        session_id = params.get('session_id', '')[:64]
        if not post_id:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'missing post_id'})}
        with conn.cursor() as cur:
            cur.execute(f'SELECT COUNT(*) FROM {SCHEMA}.blog_post_views WHERE post_id=%s', (post_id,))
            views = cur.fetchone()[0]
            cur.execute(
                f'SELECT emoji, COUNT(*) as cnt FROM {SCHEMA}.blog_post_reactions WHERE post_id=%s GROUP BY emoji',
                (post_id,)
            )
            reactions = {row[0]: row[1] for row in cur.fetchall()}
            my_reaction = None
            if session_id:
                cur.execute(
                    f'SELECT emoji FROM {SCHEMA}.blog_post_reactions WHERE post_id=%s AND session_id=%s',
                    (post_id, session_id)
                )
                row = cur.fetchone()
                my_reaction = row[0] if row else None
        return {'statusCode': 200, 'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
                'body': json.dumps({'views': views, 'reactions': reactions, 'my_reaction': my_reaction})}

    # POST: поставить/убрать реакцию
    if method == 'POST' and action == 'react':
        post_id = body_data.get('post_id')
        session_id = body_data.get('session_id', '')[:64]
        emoji = body_data.get('emoji', '')[:8]
        allowed = ['👍', '🔥', '💡', '❤️', '😮']
        if not post_id or not session_id or emoji not in allowed:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'invalid params'})}
        with conn.cursor() as cur:
            cur.execute(
                f'SELECT emoji FROM {SCHEMA}.blog_post_reactions WHERE post_id=%s AND session_id=%s',
                (post_id, session_id)
            )
            existing = cur.fetchone()
            if existing and existing[0] == emoji:
                cur.execute(
                    f'DELETE FROM {SCHEMA}.blog_post_reactions WHERE post_id=%s AND session_id=%s',
                    (post_id, session_id)
                )
                my_reaction = None
            else:
                cur.execute(
                    f'INSERT INTO {SCHEMA}.blog_post_reactions (post_id, session_id, emoji) VALUES (%s, %s, %s) '
                    f'ON CONFLICT (post_id, session_id) DO UPDATE SET emoji=%s, created_at=NOW()',
                    (post_id, session_id, emoji, emoji)
                )
                my_reaction = emoji
            cur.execute(
                f'SELECT emoji, COUNT(*) FROM {SCHEMA}.blog_post_reactions WHERE post_id=%s GROUP BY emoji',
                (post_id,)
            )
            reactions = {row[0]: row[1] for row in cur.fetchall()}
        return {'statusCode': 200, 'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
                'body': json.dumps({'reactions': reactions, 'my_reaction': my_reaction})}

    # GET: список статей с количеством просмотров (для админки)
    if method == 'GET' and action == 'list_with_views':
        if admin_secret != os.environ.get('ADMIN_SECRET', ''):
            return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'forbidden'})}
        sort = params.get('sort', 'views')  # 'views' или 'date'
        order = params.get('order', 'desc').upper()
        if order not in ('ASC', 'DESC'):
            order = 'DESC'
        with conn.cursor() as cur:
            cur.execute(
                f'''SELECT bp.id, bp.slug, bp.title, bp.topic, bp.published_at,
                           COUNT(bpv.id) AS views
                    FROM {SCHEMA}.blog_posts bp
                    LEFT JOIN {SCHEMA}.blog_post_views bpv ON bpv.post_id = bp.id
                    WHERE bp.is_published = TRUE
                    GROUP BY bp.id, bp.slug, bp.title, bp.topic, bp.published_at
                    ORDER BY {"views" if sort == "views" else "bp.published_at"} {order}
                    LIMIT 200'''
            )
            rows = cur.fetchall()
        posts = [
            {'id': r[0], 'slug': r[1], 'title': r[2], 'topic': r[3],
             'publishedAt': r[4].isoformat() if r[4] else None, 'views': r[5]}
            for r in rows
        ]
        return {'statusCode': 200, 'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
                'body': json.dumps({'posts': posts, 'total': len(posts)})}

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