import Icon from '@/components/ui/icon';

interface LandingFooterProps {
  onAbout: () => void;
  onPrivacy: () => void;
  onTerms: () => void;
  onPersonalData: () => void;
}

export function LandingFooter({ onAbout, onPrivacy, onTerms, onPersonalData }: LandingFooterProps) {
  return (
    <footer className="border-t bg-gray-50 py-4 px-3 sm:px-4 lg:px-6" role="contentinfo">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Rocket" className="text-primary" size={20} />
          <span className="text-base font-bold">iHUNT</span>
          <span className="text-xs text-muted-foreground ml-1">— реферальный рекрутинг с геймификацией</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          <nav aria-label="Продукт">
            <h4 className="font-semibold mb-2 text-xs">Продукт</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li><a href="#benefits" className="hover:text-primary">Возможности</a></li>
              <li><a href="#pricing" className="hover:text-primary">Тарифы</a></li>
            </ul>
          </nav>
          <nav aria-label="Компания">
            <h4 className="font-semibold mb-2 text-xs">Компания</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li><a href="/jobs" className="hover:text-primary">Агрегатор вакансий</a></li>
              <li><a href="/blog" className="hover:text-primary">Блог</a></li>
              <li><a href="#contact" className="hover:text-primary">Контакты</a></li>
              <li><span onClick={onAbout} className="hover:text-primary cursor-pointer">О нас</span></li>
              <li><a href="/partner" className="hover:text-primary">Партнёрская программа</a></li>
            </ul>
          </nav>
          <nav aria-label="Правовая информация" className="col-span-2 sm:col-span-1">
            <h4 className="font-semibold mb-2 text-xs">Правовая информация</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li><span onClick={onPrivacy} className="hover:text-primary cursor-pointer">Политика конфиденциальности</span></li>
              <li><span onClick={onTerms} className="hover:text-primary cursor-pointer">Пользовательское соглашение</span></li>
              <li><span onClick={onPersonalData} className="hover:text-primary cursor-pointer">Обработка персональных данных</span></li>
            </ul>
          </nav>
        </div>
        <div className="mt-5 pt-4 border-t text-center text-xs text-muted-foreground">© 2026 iHUNT. Все права защищены.</div>
      </div>
    </footer>
  );
}