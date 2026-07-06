import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Recommendation } from '@/types';

interface MyRecommendationsTabProps {
  recommendations: Recommendation[];
  currentEmployeeId: number;
  onViewCandidate: (rec: Recommendation) => void;
  onNavigateToVacancies: () => void;
}

export function MyRecommendationsTab({
  recommendations,
  currentEmployeeId,
  onViewCandidate,
  onNavigateToVacancies,
}: MyRecommendationsTabProps) {
  const myRecs = recommendations.filter(r => r.employeeId === currentEmployeeId);

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
        <Icon name="Star" size={20} />
        <span>Мои рекомендации</span>
      </h2>
      <div className="grid gap-4">
        {myRecs.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <Icon name="Users" size={48} className="text-muted-foreground" />
              <div>
                <p className="font-semibold text-lg mb-1">Рекомендаций пока нет</p>
                <p className="text-sm text-muted-foreground">Порекомендуйте знакомых на открытые вакансии и получайте вознаграждение</p>
              </div>
              <Button onClick={onNavigateToVacancies}>
                Начать рекомендовать
              </Button>
            </CardContent>
          </Card>
        )}
        {myRecs.map((rec) => (
          <Card
            key={rec.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onViewCandidate(rec)}
          >
            <CardHeader>
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-lg break-words">{rec.candidateName}</CardTitle>
                  <CardDescription className="break-words">{rec.vacancyTitle || rec.vacancy}</CardDescription>
                </div>
                <Badge variant={
                  rec.status === 'hired' || rec.status === 'accepted' ? 'default' :
                  rec.status === 'rejected' ? 'destructive' :
                  rec.status === 'interview' ? 'outline' :
                  'secondary'
                } className={`shrink-0 whitespace-nowrap ${rec.status === 'accepted' ? 'bg-green-600 hover:bg-green-600' : ''}`}>
                  {rec.status === 'hired' || rec.status === 'accepted' ? 'Принят' :
                   rec.status === 'rejected' ? 'Отклонён' :
                   rec.status === 'interview' ? 'На интервью' :
                   'На рассмотрении'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Icon name="Calendar" size={16} />
                  <span>{new Date(rec.date).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon name="Award" size={16} />
                  <span>{rec.reward.toLocaleString()} ₽</span>
                </div>
                {(rec.status === 'accepted' || rec.status === 'hired') && rec.acceptedDate && (() => {
                  const acceptedDate = new Date(rec.acceptedDate);
                  const unlockDate = new Date(acceptedDate.getTime() + (rec.payoutDelayDays ?? 30) * 24 * 60 * 60 * 1000);
                  const today = new Date();
                  const msRemaining = unlockDate.getTime() - today.getTime();
                  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

                  return (
                    <div className={`flex items-center gap-1 ${daysRemaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      <Icon name="Clock" size={16} />
                      <span>
                        {daysRemaining > 0
                          ? `Выплата через ${daysRemaining} ${daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'}`
                          : <span className="inline-flex items-center gap-1"><Icon name="CheckCircle2" size={14} />Выплата доступна</span>
                        }
                      </span>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default MyRecommendationsTab;