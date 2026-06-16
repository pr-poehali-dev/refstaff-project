"""
Агрегатор HR-вакансий с hh.ru и trudvsem.ru.
Поддерживает фильтрацию по позиции, городу, зарплате, опыту.
"""
import json
import os
import urllib.request
import urllib.parse
import urllib.error


def get_hh_token() -> str:
    """Возвращает access token приложения hh.ru из секретов (если задан)."""
    return os.environ.get('HH_ACCESS_TOKEN', '')

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

# Ключевые слова для фильтрации по названию должности (job-name)
POSITION_KEYWORDS = {
    'recruiter': ['рекрутер', 'рекрутинг', 'recruiter'],
    'hr_manager': ['hr менеджер', 'hr-менеджер', 'менеджер по персонал', 'hr manager', 'управлени персонал'],
    'hr_selection': ['подбор персонал', 'подбору персонал', 'менеджер по подбор', 'специалист по подбор'],
    'hrd': ['директор по персонал', 'hrd', 'hr директор', 'hr-директор'],
    'hrbp': ['hrbp', 'hr бизнес партнер', 'hr-бизнес-партнер', 'бизнес партнер'],
    'hr_admin': ['кадровик', 'кадровое делопроизводств', 'специалист по кадр', 'инспектор по кадр', 'кадровый специалист'],
    'hrg': ['hrg', 'hr generalist', 'hr-generalist', 'hr генералист'],
}

# Опыт hh.ru: noExperience, between1And3, between3And6, moreThan6
HH_EXPERIENCE_MAP = {
    'no': 'noExperience',
    '1-3': 'between1And3',
    '3-6': 'between3And6',
    '6+': 'moreThan6',
}

PER_PAGE = 20


def is_relevant(title: str, position_key: str) -> bool:
    """Проверяет, что название вакансии соответствует HR-должности."""
    title_lower = title.lower()
    keywords = POSITION_KEYWORDS.get(position_key, [])
    return any(kw in title_lower for kw in keywords)


def fetch_hh(position_key: str, city: str, salary_from: int | None,
             experience: str | None, page: int) -> dict:
    """Загружает вакансии с hh.ru через OAuth2 токен приложения."""
    text = HR_POSITIONS.get(position_key, 'HR менеджер')

    params: dict = {
        'text': text,
        'search_field': 'name',  # искать только в названии вакансии
        'per_page': PER_PAGE,
        'page': page,
        'order_by': 'publication_time',
    }

    if city and city.lower() not in ('', 'remote', 'удалённо', 'удаленно'):
        params['area'] = _resolve_hh_area(city)
    elif city.lower() in ('remote', 'удалённо', 'удаленно'):
        params['schedule'] = 'remote'

    if salary_from:
        params['salary'] = salary_from
        params['only_with_salary'] = 'true'

    if experience and experience in HH_EXPERIENCE_MAP:
        params['experience'] = HH_EXPERIENCE_MAP[experience]

    url = 'https://api.hh.ru/vacancies?' + urllib.parse.urlencode(params)
    hh_headers = {'User-Agent': 'iHUNT/1.0 (refstaff.ru)'}
    token = get_hh_token()
    if token:
        hh_headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, headers=hh_headers)

    try:
        try:
            raw_resp = urllib.request.urlopen(req, timeout=8)
        except urllib.error.HTTPError as http_err:
            body = http_err.read().decode('utf-8', errors='replace')
            print(f"HH API HTTP {http_err.code}: {body[:500]}")
            return {'vacancies': [], 'total': 0, 'pages': 0, 'error': f"HTTP {http_err.code}: {body[:200]}"}
        with raw_resp as resp:
            data = json.loads(resp.read().decode())
            vacancies = []
            for v in data.get('items', []):
                salary = v.get('salary')
                salary_str = ''
                if salary:
                    parts = []
                    if salary.get('from'):
                        parts.append(f"от {int(salary['from']):,}".replace(',', ' '))
                    if salary.get('to'):
                        parts.append(f"до {int(salary['to']):,}".replace(',', ' '))
                    if parts:
                        currency = salary.get('currency', 'RUR')
                        curr_sym = '₽' if currency == 'RUR' else currency
                        salary_str = ' — '.join(parts) + ' ' + curr_sym

                exp = v.get('experience', {}).get('name', '')
                area = v.get('area', {}).get('name', '')
                schedule = v.get('schedule', {}).get('name', '')

                vacancies.append({
                    'id': f"hh_{v['id']}",
                    'source': 'hh',
                    'title': v.get('name', ''),
                    'company': v.get('employer', {}).get('name', ''),
                    'city': area,
                    'salary': salary_str,
                    'salary_from': salary.get('from') if salary else None,
                    'salary_to': salary.get('to') if salary else None,
                    'experience': exp,
                    'schedule': schedule,
                    'is_remote': 'удал' in schedule.lower() or 'дистанц' in schedule.lower(),
                    'url': v.get('alternate_url', ''),
                    'published_at': v.get('published_at', ''),
                    'snippet': v.get('snippet', {}).get('requirement', '') or '',
                })

            return {
                'vacancies': vacancies,
                'total': data.get('found', 0),
                'pages': data.get('pages', 1),
            }
    except Exception as e:
        return {'vacancies': [], 'total': 0, 'pages': 0, 'error': str(e)}


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

                # Фильтруем нерелевантные вакансии по названию должности
                if not is_relevant(job_name, position_key):
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

                # Опыт в trudvsem не всегда есть, берём из duty если нет
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


def _resolve_hh_area(city: str) -> int:
    """Возвращает ID региона hh.ru по названию города (основные города)."""
    city_map = {
        'москва': 1, 'санкт-петербург': 2, 'спб': 2, 'питер': 2,
        'екатеринбург': 3, 'новосибирск': 4, 'казань': 88, 'нижний новгород': 66,
        'челябинск': 104, 'самара': 78, 'омск': 68, 'ростов-на-дону': 76,
        'уфа': 99, 'красноярск': 54, 'пермь': 72, 'воронеж': 26,
        'волгоград': 24, 'краснодар': 53, 'тюмень': 97, 'барнаул': 6,
        'иркутск': 38, 'хабаровск': 1948, 'владивосток': 22, 'ярославль': 112,
        'махачкала': 60, 'томск': 93, 'оренбург': 69, 'кемерово': 49,
        'новокузнецк': 67, 'рязань': 77, 'астрахань': 5, 'набережные челны': 65,
        'пенза': 71, 'липецк': 57, 'тула': 95, 'киров': 50,
        'чебоксары': 103, 'калининград': 44, 'улан-удэ': 98, 'тверь': 92,
        'ставрополь': 89, 'белгород': 10, 'иваново': 37, 'сочи': 237,
    }
    return city_map.get(city.lower().strip(), 113)  # 113 = Россия


def handler(event: dict, context) -> dict:
    """Агрегирует HR-вакансии с hh.ru и trudvsem.ru с фильтрацией."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    position = params.get('position', 'hr_manager')
    city = params.get('city', '').strip()
    salary_from_raw = params.get('salary_from', '')
    experience = params.get('experience', '')  # no / 1-3 / 3-6 / 6+
    source = params.get('source', 'all')  # hh / trudvsem / all
    page_hh = int(params.get('page_hh', 0))
    page_tv = int(params.get('page_tv', 0))

    salary_from = int(salary_from_raw) if salary_from_raw.isdigit() else None

    hh_result = {'vacancies': [], 'total': 0, 'pages': 0}
    tv_result = {'vacancies': [], 'total': 0, 'pages': 0}

    # Если выбраны все должности — собираем по каждой и объединяем
    if position == 'all':
        all_positions = list(HR_POSITIONS.keys())
        if source in ('hh', 'all'):
            seen_ids = set()
            merged_hh = []
            for pos in all_positions:
                r = fetch_hh(pos, city, salary_from, experience or None, 0)
                for v in r.get('vacancies', []):
                    if v['id'] not in seen_ids:
                        seen_ids.add(v['id'])
                        merged_hh.append(v)
            merged_hh.sort(key=lambda v: v.get('published_at', ''), reverse=True)
            hh_result = {'vacancies': merged_hh[:20], 'total': len(merged_hh), 'pages': 1}
        if source in ('trudvsem', 'all'):
            seen_ids = set()
            merged_tv = []
            for pos in all_positions:
                r = fetch_trudvsem(pos, city, salary_from, experience or None, 0)
                for v in r.get('vacancies', []):
                    if v['id'] not in seen_ids:
                        seen_ids.add(v['id'])
                        merged_tv.append(v)
            merged_tv.sort(key=lambda v: v.get('published_at', ''), reverse=True)
            tv_result = {'vacancies': merged_tv[:20], 'total': len(merged_tv), 'pages': 1}
    else:
        if source in ('hh', 'all'):
            hh_result = fetch_hh(position, city, salary_from, experience or None, page_hh)
        if source in ('trudvsem', 'all'):
            tv_result = fetch_trudvsem(position, city, salary_from, experience or None, page_tv)

    body = {
        'hh': {
            'vacancies': hh_result['vacancies'],
            'total': hh_result['total'],
            'pages': hh_result['pages'],
            'error': hh_result.get('error'),
        },
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