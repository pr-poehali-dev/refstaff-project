import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Vacancy } from '@/types';

interface HrVacanciesTabProps {
  vacancies: Vacancy[];
}

export function HrVacanciesTab({ vacancies }: HrVacanciesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">
            <span>👔</span> Управление вакансиями
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Доступ HR Manager</p>
        </div>
      </div>
      <div className="grid gap-4">
        {vacancies.sort((a, b) => {
          if (a.status === 'archived' && b.status !== 'archived') return 1;
          if (a.status !== 'archived' && b.status === 'archived') return -1;
          return 0;
        }).map((vacancy) => (
          <Card key={vacancy.id}>
            <CardHeader className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-base">{vacancy.title}</CardTitle>
                  <CardDescription>{vacancy.department}</CardDescription>
                </div>
                <Badge variant={vacancy.status === 'active' ? 'default' : 'secondary'}>
                  {vacancy.status === 'active' ? 'Активна' : 'Архив'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                <span>💰 {vacancy.salary}</span>
                <span>🎁 {vacancy.reward.toLocaleString()} ₽</span>
                <span>👥 {vacancy.recommendations} кандидатов</span>
              </div>
            </CardHeader>
          </Card>
        ))}
        {vacancies.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Вакансий нет</CardContent></Card>
        )}
      </div>
    </div>
  );
}

export default HrVacanciesTab;
