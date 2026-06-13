import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">О iHUNT</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">Наша миссия</h3>
            <p className="text-muted-foreground">
              iHUNT создан для того, чтобы сделать процесс найма персонала максимально эффективным и прозрачным. 
              Мы верим, что лучшие кандидаты приходят по рекомендациям доверенных сотрудников, и наша платформа 
              помогает компаниям использовать этот потенциал на 100%.
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3">Почему мы?</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="Target" className="text-primary" size={20} />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Фокус на результат</h4>
                  <p className="text-sm text-muted-foreground">
                    Наши клиенты сокращают время найма в 2 раза и экономят до 70% бюджета на рекрутинг.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="Users" className="text-primary" size={20} />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Вовлечение сотрудников</h4>
                  <p className="text-sm text-muted-foreground">
                    Геймификация и прозрачная система вознаграждений мотивируют команду активно участвовать в найме.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="Zap" className="text-primary" size={20} />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Простота внедрения</h4>
                  <p className="text-sm text-muted-foreground">
                    Настройка занимает 5 минут. Интуитивный интерфейс не требует обучения.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3">Наши достижения</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">500+</div>
                <div className="text-sm text-muted-foreground">Компаний используют</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">15,000+</div>
                <div className="text-sm text-muted-foreground">Успешных найма</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">4.8/5</div>
                <div className="text-sm text-muted-foreground">Средняя оценка</div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3">Свяжитесь с нами</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Icon name="Mail" size={16} className="text-muted-foreground" />
                <a href="mailto:info@ihunt.ru" className="text-primary hover:underline">info@i-hunt.ru</a>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
