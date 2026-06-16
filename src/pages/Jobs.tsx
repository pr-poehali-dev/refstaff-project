import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/5ab7f550-e0f2-4f0e-8ce3-079e6069c1ac';

const POSITIONS: Record<string, string> = {
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
  source: 'hh' | 'trudvsem';
  title: string;
  company: string;
  city: string;
  salary: string;
  salary_from: number | null;
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
  hh: SourceResult;
  trudvsem: SourceResult;
}

function VacancyCard({ v }: { v: Vacancy }) {
  const sourceLabel = v.source === 'hh' ? 'hh.ru' : 'Trudvsem';
  const sourceBadgeClass = v.source === 'hh'
    ? 'bg-red-100 text-red-700 border-red-200'
    : 'bg-blue-100 text-blue-700 border-blue-200';

  const publishedDate = v.published_at
    ? new Date(v.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : '';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 p-4">
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
          <Badge variant="outline" className={`text-[10px] shrink-0 ${sourceBadgeClass}`}>
            {sourceLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
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

  const [position, setPosition] = useState('hr_manager');
  const [city, setCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [salaryFrom, setSalaryFrom] = useState('any');
  const [experience, setExperience] = useState('any');
  const [source, setSource] = useState('all');

  const [pageHh, setPageHh] = useState(0);
  const [pageTv, setPageTv] = useState(0);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchJobs = useCallback(async (phh: number, ptv: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        position,
        source,
        page_hh: String(phh),
        page_tv: String(ptv),
      });
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
  }, [position, city, salaryFrom, experience, source]);

  useEffect(() => {
    fetchJobs(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setPageHh(0);
    setPageTv(0);
    fetchJobs(0, 0);
  };

  const handleCitySelect = (c: string) => {
    setCity(c);
    setCityInput(c);
  };

  const handleRemote = () => {
    setCity('remote');
    setCityInput('Удалённо');
  };

  const hhVacancies = data?.hh?.vacancies ?? [];
  const tvVacancies = data?.trudvsem?.vacancies ?? [];

  const allVacancies: Vacancy[] = source === 'hh'
    ? hhVacancies
    : source === 'trudvsem'
    ? tvVacancies
    : [...hhVacancies, ...tvVacancies].sort((a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );

  const hhTotal = data?.hh?.total ?? 0;
  const tvTotal = data?.trudvsem?.total ?? 0;
  const hhPages = data?.hh?.pages ?? 1;
  const tvPages = data?.trudvsem?.pages ?? 1;

  const hhError = data?.hh?.error;
  const tvError = data?.trudvsem?.error;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">HR Вакансии</h1>
          <p className="text-muted-foreground text-sm">Агрегатор вакансий для HR-специалистов с hh.ru и Trudvsem.ru</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Position */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Должность</label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(POSITIONS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Experience */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Опыт работы</label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Любой опыт" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Salary */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Зарплата от</label>
                <Select value={salaryFrom} onValueChange={setSalaryFrom}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Любая зарплата" />
                  </SelectTrigger>
                  <SelectContent>
                    {SALARY_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Source */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Источник</label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все источники</SelectItem>
                    <SelectItem value="hh">hh.ru</SelectItem>
                    <SelectItem value="trudvsem">Trudvsem.ru</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* City */}
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
                  <Icon name="Home" size={14} className="mr-1" />
                  Удалённо
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
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Поиск...</>
              ) : (
                <><Icon name="Search" size={16} className="mr-2" />Найти вакансии</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Source status */}
        {searched && data && (
          <div className="flex flex-wrap gap-2 mb-4">
            {source !== 'trudvsem' && !hhError && (
              <Badge variant="secondary" className="text-xs">
                <Icon name="CheckCircle" size={12} className="mr-1" />
                hh.ru: {hhTotal.toLocaleString()} вакансий
              </Badge>
            )}
            {source !== 'hh' && !tvError && (
              <Badge variant="secondary" className="text-xs">
                <Icon name="CheckCircle" size={12} className="mr-1" />
                Trudvsem: {tvTotal.toLocaleString()} вакансий
              </Badge>
            )}
          </div>
        )}

        {/* Results */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && searched && allVacancies.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <Icon name="SearchX" size={48} className="mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Вакансии не найдены. Попробуйте изменить фильтры.</p>
            </CardContent>
          </Card>
        )}

        {!loading && allVacancies.length > 0 && (
          <div className="space-y-3">
            {allVacancies.map(v => <VacancyCard key={v.id} v={v} />)}
          </div>
        )}

        {/* Pagination */}
        {!loading && searched && (source === 'all' || source === 'hh') && hhPages > 1 && !hhError && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-lg border">
            <span className="text-sm text-muted-foreground">hh.ru — страница {pageHh + 1} из {hhPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                disabled={pageHh === 0}
                onClick={() => { const p = pageHh - 1; setPageHh(p); fetchJobs(p, pageTv); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <Icon name="ChevronLeft" size={16} />
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={pageHh >= hhPages - 1}
                onClick={() => { const p = pageHh + 1; setPageHh(p); fetchJobs(p, pageTv); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <Icon name="ChevronRight" size={16} />
              </Button>
            </div>
          </div>
        )}

        {!loading && searched && (source === 'all' || source === 'trudvsem') && tvPages > 1 && !tvError && (
          <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-lg border">
            <span className="text-sm text-muted-foreground">Trudvsem — страница {pageTv + 1} из {tvPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                disabled={pageTv === 0}
                onClick={() => { const p = pageTv - 1; setPageTv(p); fetchJobs(pageHh, p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <Icon name="ChevronLeft" size={16} />
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={pageTv >= tvPages - 1}
                onClick={() => { const p = pageTv + 1; setPageTv(p); fetchJobs(pageHh, p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <Icon name="ChevronRight" size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Вакансии загружаются с hh.ru и Trudvsem.ru. Для отклика вы будете перенаправлены на сайт источника.
        </p>
      </div>
    </div>
  );
}