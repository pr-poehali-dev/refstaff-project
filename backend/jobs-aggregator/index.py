"""
Агрегатор HR-вакансий с trudvsem.ru.
Поддерживает фильтрацию по позиции, городу, зарплате, опыту.
"""
import json
import urllib.request
import urllib.parse
import urllib.error

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}

HR_POSITIONS = {
    'recruiter': 'рекрутер',
    'hr_manager': 'HR менеджер',
    'hr_selection': 'менеджер по подбору персонала',
    'hrd': 'HRD директор по персоналу',
    'hrbp': 'HRBP HR бизнес партнер',
    'hr_admin': 'кадровик делопроизводитель',
    'hrg': 'HRG generalist',
}

POSITION_KEYWORDS = {
    'recruiter': ['рекрутер', 'рекрутинг', 'recruiter'],
    'hr_manager': ['hr менеджер', 'hr-менеджер', 'менеджер по персонал', 'hr manager', 'управлени персонал'],
    'hr_selection': ['подбор персонал', 'подбору персонал', 'менеджер по подбор', 'специалист по подбор'],
    'hrd': ['директор по персонал', 'hrd', 'hr директор', 'hr-директор'],
    'hrbp': ['hrbp', 'hr бизнес партнер', 'hr-бизнес-партнер', 'бизнес партнер'],
    'hr_admin': ['кадровик', 'кадровое делопроизводств', 'специалист по кадр', 'инспектор по кадр', 'кадровый специалист'],
    'hrg': ['hrg', 'hr generalist', 'hr-generalist', 'hr генералист'],
}

PER_PAGE = 20


def is_relevant(title: str, position_key: str) -> bool:
    """Проверяет, что название вакансии соответствует HR-должности."""
    title_lower = title.lower()
    keywords = POSITION_KEYWORDS.get(position_key, [])
    return any(kw in title_lower for kw in keywords)


def fetch_trudvsem(position_key: str, city: str, salary_from: int | None,
                   experience: str | None, page: int) -> dict:
    """Загружает вакансии с trudvsem.ru через открытый API."""
    text = HR_POSITIONS.get(position_key, 'HR менеджер')
    offset = page * PER_PAGE

    params: dict = {
        'text': text,
        'limit': PER_PAGE,
        'offset': offset,
    }

    if city and city.lower() not in ('', 'remote', 'удалённо', 'удаленно'):
        params['regionName'] = city
    elif city.lower() in ('remote', 'удалённо', 'удаленно'):
        params['employment'] = 'Удалённая'

    if salary_from:
        params['salary_min'] = salary_from

    url = 'https://opendata.trudvsem.ru/api/v1/vacancies?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': 'iHUNT/1.0'})

    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode())
            results = data.get('results', {})
            items = results.get('vacancies', [])
            total = data.get('meta', {}).get('total', 0)

            vacancies = []
            for item in items:
                v = item.get('vacancy', {})
                job_name = v.get('job-name', '')

                if position_key != 'all' and not is_relevant(job_name, position_key):
                    continue

                salary_min = v.get('salary_min')
                salary_max = v.get('salary_max')
                salary_raw = v.get('salary', '')

                salary_str = ''
                if salary_min or salary_max:
                    parts = []
                    if salary_min:
                        parts.append(f"от {int(salary_min):,}".replace(',', ' '))
                    if salary_max:
                        parts.append(f"до {int(salary_max):,}".replace(',', ' '))
                    salary_str = ' — '.join(parts) + ' ₽'
                elif salary_raw:
                    salary_str = salary_raw

                employment = v.get('employment', '')
                region_name = v.get('region', {}).get('name', '')

                exp_str = ''
                if experience == 'no':
                    exp_str = 'Без опыта'
                elif experience:
                    exp_str = f"Опыт {experience} лет"

                vacancies.append({
                    'id': f"tv_{v.get('id', '')}",
                    'source': 'trudvsem',
                    'title': job_name,
                    'company': v.get('company', {}).get('name', ''),
                    'city': region_name,
                    'salary': salary_str,
                    'salary_from': salary_min,
                    'salary_to': salary_max,
                    'experience': exp_str,
                    'schedule': v.get('schedule', ''),
                    'is_remote': 'удал' in employment.lower(),
                    'url': v.get('vac_url', ''),
                    'published_at': v.get('creation-date', ''),
                    'snippet': (v.get('duty', '') or '')[:300],
                })

            return {
                'vacancies': vacancies,
                'total': total,
                'pages': max(1, -(-total // PER_PAGE)),
            }
    except Exception as e:
        return {'vacancies': [], 'total': 0, 'pages': 0, 'error': str(e)}


def handler(event: dict, context) -> dict:
    """Агрегирует HR-вакансии с trudvsem.ru с фильтрацией."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    position = params.get('position', 'all')
    city = params.get('city', '').strip()
    salary_from_raw = params.get('salary_from', '')
    experience = params.get('experience', '')
    page_tv = int(params.get('page_tv', 0))

    salary_from = int(salary_from_raw) if salary_from_raw.isdigit() else None

    if position == 'all':
        seen_ids = set()
        merged = []
        for pos in HR_POSITIONS.keys():
            r = fetch_trudvsem(pos, city, salary_from, experience or None, 0)
            for v in r.get('vacancies', []):
                if v['id'] not in seen_ids:
                    seen_ids.add(v['id'])
                    merged.append(v)
        merged.sort(key=lambda v: v.get('published_at', ''), reverse=True)
        tv_result = {'vacancies': merged[:PER_PAGE], 'total': len(merged), 'pages': 1}
    else:
        tv_result = fetch_trudvsem(position, city, salary_from, experience or None, page_tv)

    body = {
        'trudvsem': {
            'vacancies': tv_result['vacancies'],
            'total': tv_result['total'],
            'pages': tv_result['pages'],
            'error': tv_result.get('error'),
        },
        'positions': HR_POSITIONS,
    }

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps(body, ensure_ascii=False),
    }
