import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface HeroSectionProps {
  onRegister: () => void;
  onLogin: () => void;
}

export function HeroSection({ onRegister, onLogin }: HeroSectionProps) {
  const navigate = useNavigate();
  return (
    <section className="pt-16 sm:pt-20 md:pt-24 lg:pt-32 pb-8 sm:pb-12 md:pb-16 lg:pb-20 px-3 sm:px-4 lg:px-6" aria-labelledby="hero-title">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <Badge className="mb-4 sm:mb-6 animate-fade-in text-xs sm:text-sm">🚀 Реферальный рекрутинг</Badge>
            <h1 id="hero-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 animate-slide-up bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
              Нанимайте лучших кандидатов через своих сотрудников
            </h1>
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-4 sm:mb-6 md:mb-8 animate-slide-up font-normal" style={{ animationDelay: '0.1s' }}>
              Платформа для реферального найма с геймификацией
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center lg:justify-start">
              <Button
                size="default"
                className="animate-scale-in shadow-lg shadow-primary/25 text-sm sm:text-base"
                style={{ animationDelay: '0.2s' }}
                onClick={() => {
                  onRegister();
                  if (typeof (window as Window & { ym?: (id: number, goal: string, target: string) => void }).ym === 'function') {
                    (window as Window & { ym?: (id: number, goal: string, target: string) => void }).ym!(106919720, 'reachGoal', 'click_cta_hero');
                  }
                }}
                aria-label="Начать бесплатный пробный период на 14 дней"
              >
                <Icon name="Rocket" className="mr-2" size={18} aria-hidden="true" />
                <span className="hidden sm:inline">Начать бесплатно — 14 дней</span>
                <span className="sm:hidden">Начать бесплатно</span>
              </Button>
              <Button size="default" variant="outline" className="animate-scale-in text-sm sm:text-base" style={{ animationDelay: '0.3s' }} onClick={onLogin}>
                <Icon name="LogIn" className="mr-2" size={18} />
                Войти
              </Button>

            </div>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-6 justify-center lg:justify-start text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icon name="Check" className="text-green-600" size={16} />
                <span>Прост в использовании</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Check" className="text-green-600" size={16} />
                <span>Настройка за 5 минут</span>
              </div>
            </div>
          </div>
          <div className="relative animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="hero-image-wrap relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/files/e96124dc-c09c-454b-a967-49eff0e74945.jpg"
                alt="Команда сотрудников работает вместе"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                width={640}
                height={480}
                className="w-full h-full object-cover absolute inset-0"
              />
            </div>
            <div className="hidden sm:block absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-4" style={{ animation: 'float 3s ease-in-out 1s infinite' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Icon name="TrendingUp" className="text-green-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">+127%</div>
                  <div className="text-xs text-muted-foreground">эффективность найма</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}