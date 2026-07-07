"""
Прокси для Open Graph мета-тегов вакансий iHUNT.
Боты соцсетей (VK, Telegram, Facebook) получают статичный HTML с мета-тегами,
браузеры — редирект на React SPA.
"""

import json
import os
import urllib.request

API_URL = 'https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a'
BLOG_API_URL = 'https://functions.poehali.dev/24adc9a7-714f-4df9-a6b0-3874d99d1577'
APP_URL = 'https://i-hunt.ru'

VACANCY_IMAGE = 'https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/bucket/0e9e50fa-3793-4c04-9957-ca24ea4d1579.jpg'
REFERRAL_IMAGE = 'https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/bucket/0e9e50fa-3793-4c04-9957-ca24ea4d1579.jpg'
EMPLOYEE_IMAGE = 'https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/bucket/1a4f08a4-f047-444f-aab6-82e0357b0c94.jpg'

BOT_AGENTS = [
    'vkshare', 'facebookexternalhit', 'twitterbot', 'telegrambot',
    'whatsapp', 'linkedinbot', 'slackbot', 'discordbot', 'bot',
    'crawler', 'spider', 'scraper', 'preview'
]

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def is_bot(user_agent: str) -> bool:
    ua = user_agent.lower()
    return any(b in ua for b in BOT_AGENTS)


def fetch_blog_post(slug: str) -> dict:
    url = f'{BLOG_API_URL}?action=get&slug={slug}'
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    return data.get('post', {}) if isinstance(data, dict) else {}


def fetch_vacancy_by_id(vacancy_id: str) -> dict:
    url = f'{API_URL}?resource=vacancies&vacancy_id={vacancy_id}'
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    return data if isinstance(data, dict) and data.get('id') else {}


def fetch_vacancy_by_token(token: str) -> dict:
    url = f'{API_URL}?resource=vacancies&referral_token={token}'
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    return data if isinstance(data, dict) and data.get('id') else {}


def build_html(title: str, description: str, image: str, url: str, redirect_url: str) -> str:
    return f'''<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0; url={redirect_url}">
<title>{title}</title>
<meta name="description" content="{description}">
<meta property="og:type" content="website">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{image}">
<meta property="og:image:width" content="1514">
<meta property="og:image:height" content="945">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="iHUNT">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{description}">
<meta name="twitter:image" content="{image}">
</head>
<body>
<script>window.location.href = "{redirect_url}";</script>
</body>
</html>'''


def handler(event: dict, context) -> dict:
    """Прокси OG-мета-тегов для ботов соцсетей — вакансии и рефералы"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS_HEADERS}, 'body': ''}

    headers = event.get('headers', {}) or {}
    user_agent = headers.get('user-agent', '') or headers.get('User-Agent', '')
    query = event.get('queryStringParameters', {}) or {}

    page_type = query.get('type', '')
    page_id = query.get('id', '')

    if not page_type:
        return {
            'statusCode': 400,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'type is required'})
        }

    try:
        if page_type == 'blog':
            slug = query.get('id', '')
            redirect_url = f'{APP_URL}/blog/{slug}'
            post = fetch_blog_post(slug) if slug else {}
            if post:
                title = f'{post.get("title", "Статья")} | Блог iHUNT'
                description = post.get('metaDescription', 'Экспертные статьи о реферальном рекрутинге и HR от iHUNT')
            else:
                title = 'Блог iHUNT — статьи о реферальном рекрутинге и HR'
                description = 'Экспертные статьи о реферальном найме, HR-автоматизации и снижении стоимости подбора персонала.'
            image = 'https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/files/d707b1fc-06f6-4d41-9c38-4fbcfe1e3dbd.jpg'
            html = build_html(title, description, image, redirect_url, redirect_url)
            return {
                'statusCode': 200,
                'headers': {**CORS_HEADERS, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600'},
                'body': html
            }

        if page_type == 'employee':
            token = query.get('id', '')
            redirect_url = f'{APP_URL}/employee-register' + (f'?token={token}' if token else '')
            title = 'Получай вознаграждение за рекомендацию наших вакансий | iHUNT'
            description = 'Зарегистрируйся и рекомендуй вакансии своим знакомым — получай денежное вознаграждение за каждого успешного кандидата.'
            image = EMPLOYEE_IMAGE
            html = build_html(title, description, image, redirect_url, redirect_url)
            return {
                'statusCode': 200,
                'headers': {**CORS_HEADERS, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300'},
                'body': html
            }

        if not page_id:
            return {
                'statusCode': 400,
                'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'id is required'})
            }

        if page_type == 'vacancy':
            vacancy = fetch_vacancy_by_id(page_id)
            redirect_url = f'{APP_URL}/vacancy/{page_id}'
            image = VACANCY_IMAGE
        elif page_type == 'referral':
            ref_param = query.get('ref', '')
            vacancy = fetch_vacancy_by_token(page_id)
            redirect_url = f'{APP_URL}/r/{page_id}' + (f'?ref={ref_param}' if ref_param else '')
            image = REFERRAL_IMAGE
        else:
            return {
                'statusCode': 400,
                'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'unknown type'})
            }

        if vacancy:
            title = f'{vacancy.get("title", "Вакансия")} — {vacancy.get("department", "")} | iHUNT'
            salary = vacancy.get('salary_display', '')
            requirements = vacancy.get('requirements', '') or ''
            description = requirements[:160] if requirements else f'Вакансия {vacancy.get("title", "")}. Заработная плата: {salary}'
        else:
            title = 'Вакансия | iHUNT'
            description = 'Реферальный рекрутинг — нанимайте лучших через рекомендации сотрудников'

        canonical_url = redirect_url
        html = build_html(title, description, image, canonical_url, redirect_url)

        return {
            'statusCode': 200,
            'headers': {
                **CORS_HEADERS,
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=300'
            },
            'body': html
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }