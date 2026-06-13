import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Recommendation } from '@/types';

interface HrRecommendationsTabProps {
  recommendations: Recommendation[];
}

export function HrRecommendationsTab({ recommendations }: HrRecommendationsTabProps) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">
          <span>👔</span> Все рекомендации
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Доступ HR Manager</p>
      </div>
      <div className="grid gap-4">
        {recommendations.map((rec) => (
          <Card key={rec.id}>
            <CardHeader className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{rec.candidateName}</CardTitle>
                  <CardDescription>{rec.vacancyTitle}</CardDescription>
                </div>
                <Badge variant={
                  rec.status === 'hired' ? 'default' :
                  rec.status === 'rejected' ? 'destructive' : 'secondary'
                }>
                  {rec.status === 'pending' ? 'Новая' :
                   rec.status === 'accepted' ? 'Принята' :
                   rec.status === 'interview' ? 'Интервью' :
                   rec.status === 'hired' ? 'Нанят' : 'Отклонена'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {rec.candidatePhone && <span>📞 {rec.candidatePhone}</span>}
                {rec.candidateEmail && <span className="ml-3">✉️ {rec.candidateEmail}</span>}
              </div>
            </CardHeader>
          </Card>
        ))}
        {recommendations.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Рекомендаций нет</CardContent></Card>
        )}
      </div>
    </div>
  );
}

export default HrRecommendationsTab;
