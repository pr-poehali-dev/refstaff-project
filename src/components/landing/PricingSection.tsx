import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface PricingSectionProps {
  period: 'monthly' | 'yearly';
  onPeriodChange: (period: 'monthly' | 'yearly') => void;
  onRegister: () => void;
  onDemo: () => void;
}

export function PricingSection({ period, onPeriodChange, onRegister, onDemo }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden" aria-labelledby="pricing-title">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <Badge className="mb-4 bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs sm:text-sm"><Icon name="Gem" size={14} className="inline-block mr-1" />Прозрачное ценообразование</Badge>
          <h2 id="pricing-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Тарифы</h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">14 дней бесплатно для всех новых клиентов</p>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 md:mb-12">
          <Button
            variant={period === 'monthly' ? 'default' : 'outline'}
            onClick={() => onPeriodChange('monthly')}
            className="min-w-[120px]"
          >
            Месяц
          </Button>
          <Button
            variant={period === 'yearly' ? 'default' : 'outline'}
            onClick={() => onPeriodChange('yearly')}
            className="min-w-[120px]"
          >
            Год
            <Badge className="ml-2 bg-green-500 text-white">-15%</Badge>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 max-w-3xl mx-auto">
          <div className="group">
            <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-200 overflow-hidden h-full">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gray-400 to-gray-500"></div>
              <div className="p-5 sm:p-8">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Пробный период</h3>
                  <p className="text-sm text-muted-foreground">Протестируйте платформу</p>
                </div>
                <div className="mb-4 sm:mb-6">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">0 ₽</div>
                  <p className="text-sm text-muted-foreground">14 дней бесплатно</p>
                </div>
                <ul className="space-y-3 mb-5 sm:mb-8">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Icon name="Check" className="text-green-600" size={14} />
                    </div>
                    <span className="text-sm">Все функции платформы</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Icon name="Check" className="text-green-600" size={14} />
                    </div>
                    <span className="text-sm">Поддержка 24/7</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline" onClick={onRegister}>Попробовать самостоятельно</Button>
                <Button className="w-full mt-2" variant="secondary" onClick={onDemo}>Запросить демонстрацию</Button>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-200 overflow-hidden h-full">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-500"></div>
              <div className="p-5 sm:p-8">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Продвинутый</h3>
                  <p className="text-sm text-muted-foreground">Корпоративный тариф</p>
                </div>
                <div className="mb-4 sm:mb-6">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                    {period === 'monthly' ? '19 900 ₽' : '16 915 ₽'}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">в месяц</p>
                  {period === 'yearly' && (
                    <p className="text-sm text-green-600 font-medium">202 980 ₽/год (экономия 35 820 ₽)</p>
                  )}
                </div>
                <ul className="space-y-3 mb-5 sm:mb-8">
                  {[
                    'Нет ограничений на кол-во сотрудников',
                    'Подробная аналитика',
                    'Геймификация',
                    'Нет ограничений на размещение вакансий',
                    'AI тесты для кандидатов',
                    'Работа с рекомендациями',
                    'Внутренний чат с сотрудниками',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500" onClick={onDemo}>Подключить</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}