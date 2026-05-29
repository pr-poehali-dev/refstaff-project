import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { getCityBySlug, CITIES } from '@/data/cities';
import NotFound from './NotFound';

const BENEFITS = [
  { icon: 'Users', title: 'Реферальный найм', desc: 'Сотрудники рекомендуют знакомых и получают бонус за успешный наём' },
  { icon: 'Zap', title: 'Быстрее в 2 раза', desc: 'Средний срок закрытия вакансии — 18 дней вместо 42 через обычный рекрутинг' },
  { icon: 'BadgePercent', title: 'Экономия до 70%', desc: 'Платите только за результат — без агентств и платных job-досок' },
  { icon: 'ShieldCheck', title: 'Проверенные кандидаты', desc: 'Рекомендованные соискатели уже знают о компании и мотивированы' },
];

const STEPS = [
  { num: '1', title: 'Создайте компанию', desc: 'Зарегистрируйтесь и добавьте вакансии за 5 минут' },
  { num: '2', title: 'Пригласите команду', desc: 'Сотрудники получат ссылки для рекомендаций' },
  { num: '3', title: 'Получайте кандидатов', desc: 'Отклики поступают напрямую — вы выбираете лучших' },
];

export default function CityLanding() {
  const { city } = useParams<{ city: string }>();
  const navigate = useNavigate();
  const cityConfig = getCityBySlug(city || '');

  if (!cityConfig) return <NotFound />;

  const { name, nameIn, region } = cityConfig;
  const title = `Поиск и найм сотрудников ${nameIn} — iHUNT`;
  const description = `Реферальная платформа для найма сотрудников ${nameIn}. Закрывайте вакансии в 2 раза быстрее и экономьте до 70% бюджета на рекрутинг. ${region}.`;
  const canonical = `https://i-hunt.ru/${city}`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-primary">iHUNT</Link>
            <Button onClick={() => navigate('/')} size="sm">Войти</Button>
          </div>
        </header>

        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Icon name="MapPin" size={14} />
              {name} · {region}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Найм сотрудников {nameIn}<br />
              <span className="text-primary">через рекомендации</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Запустите реферальную программу {nameIn} и закрывайте вакансии в 2 раза быстрее — ваши сотрудники приведут лучших кандидатов
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="text-base px-8" onClick={() => navigate('/')}>
                Начать бесплатно
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8" onClick={() => navigate('/')}>
                Смотреть демо
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Без привязки карты · Первые 14 дней бесплатно</p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              Почему компании {nameIn} выбирают iHUNT
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {BENEFITS.map((b) => (
                <Card key={b.title} className="border-0 shadow-sm">
                  <CardContent className="pt-6 flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon name={b.icon} size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{b.title}</h3>
                      <p className="text-sm text-muted-foreground">{b.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-14 px-4 bg-muted/40">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              Как начать нанимать {nameIn}
            </h2>
            <div className="space-y-6">
              {STEPS.map((s) => (
                <div key={s.num} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
                    {s.num}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-semibold text-lg">{s.title}</h3>
                    <p className="text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Button size="lg" className="px-10 text-base" onClick={() => navigate('/')}>
                Зарегистрировать компанию {nameIn}
              </Button>
            </div>
          </div>
        </section>

        {/* Other cities */}
        <section className="py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-sm text-muted-foreground mb-4">iHUNT работает по всей России</p>
            <div className="flex flex-wrap justify-center gap-2">
              {CITIES.filter((c) => c.slug !== city).slice(0, 10).map((c) => (
                <Link
                  key={c.slug}
                  to={`/${c.slug}`}
                  className="text-sm text-primary hover:underline"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-6 px-4 text-center text-sm text-muted-foreground">
          © 2024 iHUNT · Реферальный найм {nameIn}
        </footer>
      </div>
    </>
  );
}