import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface LandingHeaderProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function LandingHeader({ onLogin, onRegister }: LandingHeaderProps) {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-50" role="banner">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-lg">
            <Icon name="Rocket" className="text-white" size={20} aria-hidden="true" />
          </div>
          <span className="text-lg sm:text-xl md:text-2xl px-0 py-0 my-0 font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">iHUNT</span>
        </div>
        <nav className="hidden md:flex items-center gap-4 lg:gap-8" role="navigation" aria-label="Основная навигация">
          <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs lg:text-sm hover:text-primary transition-colors">Как работает</button>
          <button onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs lg:text-sm hover:text-primary transition-colors">Преимущества</button>
          <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs lg:text-sm hover:text-primary transition-colors">Тарифы</button>
          <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs lg:text-sm hover:text-primary transition-colors">Контакты</button>
          <a href="/create-test" target="_blank" className="text-xs lg:text-sm hover:text-primary transition-colors font-medium inline-flex items-center gap-1"><Icon name="Sparkles" size={14} className="text-amber-400" />AI тесты</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/create-test" target="_blank" className="md:hidden inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-primary/40 text-primary bg-primary/5 active:bg-primary/10 transition-colors whitespace-nowrap leading-none"><Icon name="Sparkles" size={12} className="text-amber-400" />AI</a>
          <Button variant="ghost" onClick={onLogin} aria-label="Войти в систему" size="sm" className="text-xs sm:text-sm">Вход</Button>
          <Button onClick={onRegister} aria-label="Зарегистрировать компанию" size="sm" className="text-xs">
            <span className="hidden sm:inline">Зарегистрировать</span>
            <span className="sm:hidden">Регистрация</span>
          </Button>
        </div>
      </div>
    </header>
  );
}