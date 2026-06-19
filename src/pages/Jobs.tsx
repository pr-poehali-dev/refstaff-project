import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

const SEO_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'HR вакансии — iHUNT',
  description: 'Актуальные вакансии для HR-специалистов: рекрутеры, HR менеджеры, HRD, HRBP, кадровики. Поиск по всей России.',
  url: 'https://i-hunt.ru/jobs',
  numberOfItems: 'более 1000',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Вакансии HR менеджер' },
    { '@type': 'ListItem', position: 2, name: 'Вакансии Рекрутер' },
    { '@type': 'ListItem', position: 3, name: 'Вакансии HRD' },
    { '@type': 'ListItem', position: 4, name: 'Вакансии HRBP' },
    { '@type': 'ListItem', position: 5, name: 'Вакансии Кадровик' },
  ],
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://i-hunt.ru/' },
    { '@type': 'ListItem', position: 2, name: 'HR Вакансии', item: 'https://i-hunt.ru/jobs' },
  ],
};

const API_URL = 'https://functions.poehali.dev/5ab7f550-e0f2-4f0e-8ce3-079e6069c1ac';

const POSITIONS: Record<string, string> = {
  all: 'Все должности',
  hr_manager: 'HR менеджер',
  recruiter: 'Рекрутер',
  hr_selection: 'Менеджер по подбору персонала',
  hrd: 'HRD',
  hrbp: 'HRBP',
  hr_admin: 'Кадровик',
  hrg: 'HRG',
};

const EXPERIENCE_OPTIONS = [
  { value: 'any', label: 'Любой опыт' },
  { value: 'no', label: 'Без опыта' },
  { value: '1-3', label: 'От 1 до 3 лет' },
  { value: '3-6', label: 'От 3 до 6 лет' },
  { value: '6+', label: 'Более 6 лет' },
];

const SALARY_OPTIONS = [
  { value: 'any', label: 'Любая зарплата' },
  { value: '30000', label: 'от 30 000 ₽' },
  { value: '50000', label: 'от 50 000 ₽' },
  { value: '80000', label: 'от 80 000 ₽' },
  { value: '100000', label: 'от 100 000 ₽' },
  { value: '150000', label: 'от 150 000 ₽' },
  { value: '200000', label: 'от 200 000 ₽' },
];

const POPULAR_CITIES = [
  'Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Казань',
  'Нижний Новгород', 'Челябинск', 'Самара', 'Ростов-на-Дону', 'Краснодар',
];

interface Vacancy {
  id: string;
  source: 'trudvsem';
  title: string;
  company: string;
  city: string;
  salary: string;
  salary_from: number | null;
  salary_to: number | null;
  experience: string;
  schedule: string;
  is_remote: boolean;
  url: string;
  published_at: string;
  snippet: string;
}

interface SourceResult {
  vacancies: Vacancy[];
  total: number;
  pages: number;
  error?: string | null;
}

interface ApiResponse {
  trudvsem: SourceResult;
}

function VacancyCard({ v }: { v: Vacancy }) {
  const publishedDate = v.published_at
    ? new Date(v.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : '';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <button
              onClick={() => v.url && window.open(v.url, '_blank', 'noopener,noreferrer')}
              className="font-semibold text-sm sm:text-base hover:text-primary transition-colors line-clamp-2 text-left"
            >
              {v.title}
            </button>
            <p className="text-sm text-muted-foreground mt-1 truncate">{v.company}</p>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0 bg-blue-50 text-blue-700 border-blue-200">
            Trudvsem
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
          {v.city && (
            <span className="flex items-center gap-1">
              <Icon name={v.is_remote ? 'Home' : 'MapPin'} size={13} />
              {v.is_remote ? 'Удалённо' : v.city}
            </span>
          )}
          {v.salary && (
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Icon name="Wallet" size={13} />
              {v.salary}
            </span>
          )}
          {v.experience && (
            <span className="flex items-center gap-1">
              <Icon name="Briefcase" size={13} />
              {v.experience}
            </span>
          )}
          {publishedDate && (
            <span className="flex items-center gap-1">
              <Icon name="Calendar" size={13} />
              {publishedDate}
            </span>
          )}
        </div>
        {v.snippet && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1"
            dangerouslySetInnerHTML={{ __html: v.snippet.replace(/<[^>]*>/g, '') }}
          />
        )}
        <button
          onClick={() => v.url && window.open(v.url, '_blank', 'noopener,noreferrer')}
          disabled={!v.url}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Открыть вакансию <Icon name="ExternalLink" size={12} />
        </button>
      </CardContent>
    </Card>
  );
}

export default function Jobs() {
  const navigate = useNavigate();

  const [position, setPosition] = useState('all');
  const [city, setCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [salaryFrom, setSalaryFrom] = useState('any');
  const [experience, setExperience] = useState('any');
  const [pageTv, setPageTv] = useState(0);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchJobs = useCallback(async (ptv: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ position, page_tv: String(ptv) });
      if (city) params.set('city', city);
      if (salaryFrom && salaryFrom !== 'any') params.set('salary_from', salaryFrom);
      if (experience && experience !== 'any') params.set('experience', experience);

      const res = await fetch(`${API_URL}?${params}`);
      const json: ApiResponse = await res.json();
      setData(json);
      setSearched(true);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [position, city, salaryFrom, experience]);

  useEffect(() => {
    fetchJobs(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setPageTv(0);
    fetchJobs(0);
  };

  const handleCitySelect = (c: string) => { setCity(c); setCityInput(c); };
  const handleRemote = () => { setCity('remote'); setCityInput('Удалённо'); };

  const vacancies = data?.trudvsem?.vacancies ?? [];
  const tvTotal = data?.trudvsem?.total ?? 0;
  const tvPages = data?.trudvsem?.pages ?? 1;
  const tvError = data?.trudvsem?.error;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>HR Вакансии — рекрутер, HR менеджер, HRD, HRBP | iHUNT</title>
        <meta name="description" content="Актуальные HR вакансии по всей России: рекрутер, HR менеджер, HRD, HRBP, кадровик, HRG. Поиск по городу, зарплате и опыту. Обновляется ежедневно." />
        <meta name="keywords" content="HR вакансии, рекрутер вакансии, HR менеджер работа, HRD вакансии, HRBP работа, кадровик вакансии, менеджер по персоналу, подбор персонала работа, HR специалист вакансии, работа в HR" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://i-hunt.ru/jobs" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://i-hunt.ru/jobs" />
        <meta property="og:title" content="HR Вакансии — рекрутер, HR менеджер, HRD, HRBP | iHUNT" />
        <meta property="og:description" content="Актуальные HR вакансии по всей России: рекрутер, HR менеджер, HRD, HRBP, кадровик. Поиск по городу, зарплате и опыту работы." />
        <meta property="og:image" content="https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/files/og-image-1779707875070.jpg" />
        <meta property="og:locale" content="ru_RU" />
        <meta property="og:site_name" content="iHUNT" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="HR Вакансии — рекрутер, HR менеджер, HRD, HRBP | iHUNT" />
        <meta name="twitter:description" content="Актуальные HR вакансии по всей России. Поиск по городу, зарплате и опыту работы." />
        <meta name="twitter:image" content="https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/files/og-image-1779707875070.jpg" />
        <script type="application/ld+json">{JSON.stringify(SEO_JSON_LD)}</script>
        <script type="application/ld+json">{JSON.stringify(BREADCRUMB_JSON_LD)}</script>
      </Helmet>
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <Icon name="ArrowLeft" size={18} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-lg">
              <Icon name="Rocket" className="text-white" size={18} />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">iHUNT</span>
          </div>
          <span className="text-muted-foreground text-sm hidden sm:inline">/ HR Вакансии</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">HR Вакансии</h1>
          <p className="text-muted-foreground text-sm">Агрегатор вакансий для HR-специалистов</p>
        </div>

        {/* Партнёрская программа — баннер */}
        <button onClick={() => navigate('/partner')} className="group w-full text-left flex items-center gap-3 sm:gap-4 mb-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 px-4 py-3 sm:px-5 sm:py-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shrink-0">
            <Icon name="Handshake" size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-primary mb-0.5">Партнёрская программа iHUNT</div>
            <div className="text-xs text-gray-500 leading-snug">Вы HR-специалист или рекрутёр? Рекомендуйте iHUNT и зарабатывайте <strong className="text-gray-700">до 101 490 ₽</strong> с одного клиента</div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
        </button>

        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Должность</label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(POSITIONS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Опыт работы</label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Любой опыт" /></SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Зарплата от</label>
                <Select value={salaryFrom} onValueChange={setSalaryFrom}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Любая зарплата" /></SelectTrigger>
                  <SelectContent>
                    {SALARY_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Город</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Введите город..."
                  value={cityInput}
                  onChange={(e) => { setCityInput(e.target.value); setCity(e.target.value); }}
                  className="text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="outline" size="sm" onClick={handleRemote} className="shrink-0 text-xs">
                  <Icon name="Home" size={14} className="mr-1" />Удалённо
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {POPULAR_CITIES.map(c => (
                  <button
                    key={c}
                    onClick={() => handleCitySelect(c)}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      city === c
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border text-muted-foreground'
                    }`}
                  >
                    {c}
                  </button>
                ))}
                {city && (
                  <button
                    onClick={() => { setCity(''); setCityInput(''); }}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </div>

            <Button onClick={handleSearch} disabled={loading} className="w-full sm:w-auto">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Поиск...</>
                : <><Icon name="Search" size={16} className="mr-2" />Найти вакансии</>
              }
            </Button>
          </CardContent>
        </Card>

        {searched && data && !tvError && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="text-xs">
              <Icon name="CheckCircle" size={12} className="mr-1" />
              Найдено: {tvTotal.toLocaleString()} вакансий
            </Badge>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && searched && vacancies.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <Icon name="SearchX" size={48} className="mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Вакансии не найдены. Попробуйте изменить фильтры.</p>
            </CardContent>
          </Card>
        )}

        {!loading && vacancies.length > 0 && (
          <div className="space-y-3">
            {vacancies.map(v => <VacancyCard key={v.id} v={v} />)}
          </div>
        )}

        {!loading && searched && tvPages > 1 && !tvError && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-lg border">
            <span className="text-sm text-muted-foreground">Страница {pageTv + 1} из {tvPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                disabled={pageTv === 0}
                onClick={() => { const p = pageTv - 1; setPageTv(p); fetchJobs(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <Icon name="ChevronLeft" size={16} />
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={pageTv >= tvPages - 1}
                onClick={() => { const p = pageTv + 1; setPageTv(p); fetchJobs(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <Icon name="ChevronRight" size={16} />
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Вакансии загружаются с Trudvsem.ru. Для отклика вы будете перенаправлены на сайт источника.
        </p>
      </div>
    </div>
  );
}