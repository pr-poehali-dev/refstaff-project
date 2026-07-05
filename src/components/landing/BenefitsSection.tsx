import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BENEFITS_DATA } from '@/data/benefitsData';
import Icon from '@/components/ui/icon';

interface BenefitsSectionProps {
  activeBenefit: number | null;
  onBenefitClick: (index: number) => void;
  onBenefitClose: () => void;
}

export function BenefitsSection({ activeBenefit, onBenefitClick, onBenefitClose }: BenefitsSectionProps) {
  return (
    <section id="benefits" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-purple-50 via-white to-blue-50 relative overflow-hidden" aria-labelledby="benefits-title">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-10 sm:mb-14 md:mb-20">
          <Badge className="mb-4 bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs sm:text-sm gap-1"><Icon name="Sparkles" size={14} /> Почему iHUNT</Badge>
          <h2 id="benefits-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Преимущества платформы
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Все инструменты для эффективного реферального найма в одной системе
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-6xl mx-auto">
          {BENEFITS_DATA.map((benefit, i) => (
            <div key={i} className="group cursor-pointer" onClick={() => onBenefitClick(i)}>
              <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 overflow-hidden h-full">
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${benefit.gradient}`}></div>
                <div className="p-4 sm:p-6 pt-5 sm:pt-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className={`flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      <Icon name={benefit.icon} size={24} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">{benefit.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                  <p className="text-xs text-primary mt-3 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Подробнее →</p>
                </div>
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${benefit.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={activeBenefit !== null} onOpenChange={(open) => !open && onBenefitClose()}>
          <DialogContent className="max-w-lg">
            {activeBenefit !== null && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-xl">
                    <Icon name={BENEFITS_DATA[activeBenefit].icon} size={32} className="text-primary" />
                    {BENEFITS_DATA[activeBenefit].title}
                  </DialogTitle>
                  <DialogDescription className="text-base text-gray-700 mt-2 leading-relaxed">
                    {BENEFITS_DATA[activeBenefit].details}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Примеры из практики:</p>
                  <ul className="space-y-3">
                    {BENEFITS_DATA[activeBenefit].examples.map((ex, j) => (
                      <li key={j} className="flex gap-2 text-sm text-muted-foreground">
                        <Icon name="CheckCircle2" size={16} className="mt-0.5 shrink-0 text-primary" />
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <div className="mt-8 sm:mt-12 md:mt-16">
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2"><Icon name="Target" size={24} /> Результаты наших клиентов</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <Icon name="TrendingUp" size={24} className="text-green-600" />
                      </div>
                      <div>
                        <div className="font-bold text-xl">+127%</div>
                        <div className="text-sm text-muted-foreground">рост числа рекомендаций</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Icon name="Timer" size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="font-bold text-xl">-40%</div>
                        <div className="text-sm text-muted-foreground">сокращение времени найма</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Icon name="Gem" size={24} className="text-purple-600" />
                      </div>
                      <div>
                        <div className="font-bold text-xl">92%</div>
                        <div className="text-sm text-muted-foreground">прошли испытательный срок</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <img
                    src="https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/files/ff1c4a57-63e0-4e5e-ab1b-8c592b9d9ac2.jpg"
                    alt="Статистика и результаты"
                    loading="lazy"
                    decoding="async"
                    width={600}
                    height={400}
                    className="rounded-xl shadow-xl w-full h-auto"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}