import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const STEPS = [
  { icon: 'Building2', title: 'Регистрация', desc: 'Создайте аккаунт компании и разместите открытые вакансии', color: 'from-blue-500 to-blue-600' },
  { icon: 'Users', title: 'Приглашение', desc: 'Добавьте своих сотрудников в систему одним кликом', color: 'from-green-500 to-green-600' },
  { icon: 'Target', title: 'Рекомендации', desc: 'Получайте качественные кандидатуры от вашей команды', color: 'from-purple-500 to-purple-600' },
  { icon: 'Wallet', title: 'Вознаграждение', desc: 'Выплачивайте бонусы за найм', color: 'from-orange-500 to-orange-600' },
];

export function HowItWorksSection() {
  return (
    <section id="how" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-primary/5 via-white to-purple-50 relative overflow-hidden" aria-labelledby="how-title">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-8 sm:mb-12 md:mb-20">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20"><Icon name="Zap" size={14} className="inline-block mr-1" />Простой процесс</Badge>
          <h2 id="how-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Как это работает
          </h2>
          <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Запустите реферальную программу за 4 простых шага и начните получать рекомендации
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 via-purple-500 to-orange-500 transform -translate-y-1/2 opacity-20"></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-4">
            {STEPS.map((step, i) => (
              <div key={i} className="relative group">
                <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 overflow-hidden h-full">
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${step.color}`}></div>
                  <div className="p-4 sm:p-6 pt-6 sm:pt-8">
                    <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className={`flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                        <Icon name={step.icon} size={24} className="text-white" />
                      </div>
                      <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${step.color} text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md`}>
                        {i + 1}
                      </div>
                    </div>
                    <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">{step.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${step.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                </div>
                {i < 3 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-20 w-8 h-8 items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-primary/20">
                      <Icon name="ChevronRight" className="text-primary" size={18} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}