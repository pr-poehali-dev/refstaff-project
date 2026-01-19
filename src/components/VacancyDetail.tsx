import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import type { Vacancy } from '@/types';

interface VacancyDetailProps {
  vacancy: Vacancy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecommend?: () => void;
  showRecommendButton?: boolean;
}

export function VacancyDetail({ vacancy, open, onOpenChange, onRecommend, showRecommendButton = true }: VacancyDetailProps) {
  if (!vacancy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 mx-[17px]">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <DialogTitle className="text-2xl">{vacancy.title}</DialogTitle>
                <Badge variant={vacancy.status === 'active' ? 'default' : 'secondary'}>
                  {vacancy.status === 'active' ? 'Активна' : vacancy.status === 'archived' ? 'В архиве' : 'Закрыта'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="Building2" size={16} />
                <span>{vacancy.department}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Icon name="DollarSign" size={18} />
                <span className="font-medium">Зарплата</span>
              </div>
              <p className="text-xl font-bold">{vacancy.salary}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Icon name="Award" size={18} />
                <span className="font-medium">Вознаграждение за рекомендацию</span>
              </div>
              <p className="text-xl font-bold text-green-600">{vacancy.reward.toLocaleString()} ₽</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Icon name="Clock" size={18} />
                <span className="font-medium">Срок выплаты</span>
              </div>
              <p className="text-base">
                Через {vacancy.payoutDelayDays} {vacancy.payoutDelayDays === 1 ? 'день' : vacancy.payoutDelayDays < 5 ? 'дня' : 'дней'} после найма
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Icon name="Users" size={18} />
                <span className="font-medium">Статус вакансии</span>
              </div>
              <p className="text-base">
                {vacancy.status === 'active' ? 'Открыт набор кандидатов' : 'Вакансия закрыта'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Icon name="FileText" size={20} />
              Описание вакансии
            </h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground">
                {vacancy.department} ищет профессионала на должность {vacancy.title}.
              </p>
              <p className="text-muted-foreground mt-2">
                Это отличная возможность присоединиться к команде и получить конкурентную зарплату {vacancy.salary}.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Icon name="Star" size={20} />
              Преимущества
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Icon name="Check" className="text-green-600 mt-1" size={18} />
                <span>Высокая зарплата и премии по результатам работы</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" className="text-green-600 mt-1" size={18} />
                <span>Профессиональное развитие и обучение</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" className="text-green-600 mt-1" size={18} />
                <span>Дружный коллектив и комфортные условия работы</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" className="text-green-600 mt-1" size={18} />
                <span>Социальный пакет и медицинская страховка</span>
              </li>
            </ul>
          </div>

          <Separator />
          
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <Icon name="ExternalLink" size={18} />
              Ссылка на вакансию
            </h3>
            <p className="text-sm text-muted-foreground">
              Поделитесь этой ссылкой для просмотра вакансии в свободном доступе
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${window.location.origin}/vacancy/${vacancy.id}`}
                readOnly
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/vacancy/${vacancy.id}`);
                }}
              >
                <Icon name="Copy" size={16} className="mr-2" />
                Копировать
              </Button>
            </div>
          </div>

          {vacancy.referralLink && (
            <>
              <Separator />
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <Icon name="Link" size={18} />
                  Реферальная ссылка
                </h3>
                <p className="text-sm text-muted-foreground">
                  Поделитесь этой ссылкой с потенциальным кандидатом для получения вознаграждения
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={vacancy.referralLink}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(vacancy.referralLink || '');
                    }}
                  >
                    <Icon name="Copy" size={16} className="mr-2" />
                    Копировать
                  </Button>
                </div>
              </div>
            </>
          )}

          {showRecommendButton && vacancy.status === 'active' && onRecommend && (
            <Button className="w-full" size="lg" onClick={onRecommend}>
              <Icon name="UserPlus" size={18} className="mr-2" />
              Рекомендовать кандидата
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}