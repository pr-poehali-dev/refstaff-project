import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const AGENCY_FEE_RATE = 0.18;
const IHUNT_MONTHLY = 19900;
const AVG_REFERRAL_BONUS = 35000;
const TIME_WITH_AGENCY_DAYS = 45;
const TIME_WITH_IHUNT_DAYS = 22;
const QUALITY_RATE_AGENCY = 0.68;
const QUALITY_RATE_IHUNT = 0.92;

export default function Calculator() {
  const [vacanciesPerYear, setVacanciesPerYear] = useState(12);
  const [avgSalary, setAvgSalary] = useState(80000);
  const [turnoverRate, setTurnoverRate] = useState(20);

  const results = useMemo(() => {
    const totalHires = vacanciesPerYear;

    // Стоимость традиционного найма (агентства + джоб-борды)
    const agencyCost = totalHires * avgSalary * AGENCY_FEE_RATE;
    const jobBoardCost = totalHires * 8000;
    const hrTimeCost = totalHires * 15000;
    const traditionalTotal = agencyCost + jobBoardCost + hrTimeCost;

    // Стоимость с iHUNT
    const ihuntSubscription = IHUNT_MONTHLY * 12;
    const referralBonuses = totalHires * AVG_REFERRAL_BONUS;
    const ihuntTotal = ihuntSubscription + referralBonuses;

    const savings = traditionalTotal - ihuntTotal;
    const savingsPercent = Math.round((savings / traditionalTotal) * 100);

    // Текучесть
    const turnoverHires = Math.round((vacanciesPerYear * turnoverRate) / 100);
    const turnoverCostTraditional = turnoverHires * avgSalary * AGENCY_FEE_RATE;
    const turnoverCostIhunt = turnoverHires * AVG_REFERRAL_BONUS * 0.7;

    // Скорость найма
    const timeSaved = TIME_WITH_AGENCY_DAYS - TIME_WITH_IHUNT_DAYS;

    // Качество кандидатов
    const badHiresTraditional = Math.round(totalHires * (1 - QUALITY_RATE_AGENCY));
    const badHiresIhunt = Math.round(totalHires * (1 - QUALITY_RATE_IHUNT));
    const rehireCostSaved = (badHiresTraditional - badHiresIhunt) * avgSalary * 0.5;

    return {
      traditionalTotal,
      ihuntTotal,
      savings: Math.max(savings, 0),
      savingsPercent: Math.max(savingsPercent, 0),
      timeSaved,
      turnoverCostTraditional,
      turnoverCostIhunt,
      rehireCostSaved: Math.max(rehireCostSaved, 0),
      totalBenefit: Math.max(savings + rehireCostSaved, 0),
    };
  }, [vacanciesPerYear, avgSalary, turnoverRate]);

  const fmt = (n: number) =>
    n >= 1000000
      ? `${(n / 1000000).toFixed(1)} млн ₽`
      : `${Math.round(n / 1000)} тыс. ₽`;

  return (
    <>
      <Helmet>
        <title>Калькулятор стоимости найма — iHUNT</title>
        <meta name="description" content="Бесплатный калькулятор стоимости найма сотрудников. Узнайте, сколько вы тратите на рекрутинг и сколько сэкономите с реферальной программой iHUNT." />
        <meta property="og:title" content="Калькулятор стоимости найма — iHUNT" />
        <meta property="og:description" content="Рассчитайте реальные затраты на подбор персонала и потенциальную экономию с реферальным рекрутингом." />
        <link rel="canonical" href="https://i-hunt.ru/calculator" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Шапка */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
              <Icon name="Target" size={24} />
              iHUNT
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm">
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                На главную
              </Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto max-w-6xl px-4 py-10 sm:py-16">
          {/* Заголовок */}
          <div className="text-center mb-10 sm:mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 gap-1">
              <Icon name="BarChart3" size={14} />
              Бесплатный инструмент
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Калькулятор стоимости найма
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Узнайте, сколько реально стоит подбор персонала в вашей компании и сколько можно сэкономить с реферальным рекрутингом
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Слайдеры */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 sm:p-8 space-y-8">
                <h2 className="text-lg font-semibold">Параметры вашей компании</h2>

                {/* Вакансии в год */}
                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-medium">Количество найма в год</label>
                    <span className="text-sm font-bold text-primary">{vacanciesPerYear} чел.</span>
                  </div>
                  <Slider
                    min={2}
                    max={200}
                    step={1}
                    value={[vacanciesPerYear]}
                    onValueChange={([v]) => setVacanciesPerYear(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>2</span><span>200</span>
                  </div>
                </div>

                {/* Средняя зарплата */}
                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-medium">Средняя зарплата нанимаемых</label>
                    <span className="text-sm font-bold text-primary">{(avgSalary / 1000).toFixed(0)} тыс. ₽</span>
                  </div>
                  <Slider
                    min={30000}
                    max={500000}
                    step={5000}
                    value={[avgSalary]}
                    onValueChange={([v]) => setAvgSalary(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>30 тыс.</span><span>500 тыс.</span>
                  </div>
                </div>

                {/* Текучесть */}
                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-medium">Годовая текучесть кадров</label>
                    <span className="text-sm font-bold text-primary">{turnoverRate}%</span>
                  </div>
                  <Slider
                    min={5}
                    max={60}
                    step={1}
                    value={[turnoverRate]}
                    onValueChange={([v]) => setTurnoverRate(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5%</span><span>60%</span>
                  </div>
                </div>

                {/* Что учитывает калькулятор */}
                <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground mb-2">Что учитывает расчёт:</p>
                  <p>• Гонорар агентств (18% от зарплаты)</p>
                  <p>• Размещение на джоб-бордах (~8 тыс. за вакансию)</p>
                  <p>• Время HR-специалиста (~15 тыс. за найм)</p>
                  <p>• Стоимость повторного найма при неудачах</p>
                </div>
              </CardContent>
            </Card>

            {/* Результаты */}
            <div className="space-y-4">
              {/* Главная карточка экономии */}
              <Card className="shadow-xl border-0 bg-gradient-to-br from-primary to-secondary text-white overflow-hidden relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_60%)]" />
                <CardContent className="p-6 sm:p-8 relative">
                  <p className="text-white/80 text-sm mb-1">Ваша экономия с iHUNT</p>
                  <div className="text-4xl sm:text-5xl font-bold mb-1">{fmt(results.totalBenefit)}</div>
                  <p className="text-white/80 text-sm">в год · {results.savingsPercent}% от текущих затрат</p>
                </CardContent>
              </Card>

              {/* Сравнение затрат */}
              <Card className="shadow-lg border-0">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="font-semibold mb-4">Сравнение затрат в год</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <span className="text-sm">Традиционный найм</span>
                      </div>
                      <span className="font-bold text-red-600">{fmt(results.traditionalTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm">С iHUNT</span>
                      </div>
                      <span className="font-bold text-green-600">{fmt(results.ihuntTotal)}</span>
                    </div>
                  </div>

                  {/* Прогресс-бар сравнения */}
                  <div className="mt-4">
                    <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${100 - results.savingsPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      iHUNT стоит {100 - results.savingsPercent}% от текущих расходов
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Доп. метрики */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="shadow-md border-0">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Clock" size={16} className="text-blue-500" />
                      <span className="text-xs text-muted-foreground">Скорость найма</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">в 2× быстрее</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {TIME_WITH_IHUNT_DAYS} дней вместо {TIME_WITH_AGENCY_DAYS}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-0">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="UserCheck" size={16} className="text-purple-500" />
                      <span className="text-xs text-muted-foreground">Качество найма</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">92%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      проходят испыт. срок
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* CTA */}
              <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
                <CardContent className="p-6 text-center">
                  <p className="font-semibold mb-1">Сэкономьте {fmt(results.totalBenefit)} уже в этом году</p>
                  <p className="text-sm text-muted-foreground mb-4">14 дней бесплатно, без привязки карты</p>
                  <Link to="/">
                    <Button className="w-full shadow-lg shadow-primary/25">
                      <Icon name="Rocket" size={16} className="mr-2" />
                      Начать бесплатно
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-3">
                    * Расчёт основан на среднерыночных данных. Реальная экономия зависит от специфики компании.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}