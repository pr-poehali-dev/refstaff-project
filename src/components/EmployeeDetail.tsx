import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { Employee, Recommendation } from '@/types';

interface EmployeeDetailProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendations: Recommendation[];
}

export function EmployeeDetail({ employee, open, onOpenChange, recommendations }: EmployeeDetailProps) {
  if (!employee) return null;

  const employeeRecommendations = recommendations.filter(r => r.employeeId === employee.id);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
      pending:   { label: 'На рассмотрении', variant: 'secondary',   className: 'bg-yellow-500 text-white text-[10px] px-1.5 py-0.5' },
      interview: { label: 'На интервью',     variant: 'default',     className: 'bg-blue-600 text-white text-[10px] px-1.5 py-0.5' },
      hired:     { label: 'Принят',          variant: 'default',     className: 'bg-green-600 text-white text-[10px] px-1.5 py-0.5' },
      accepted:  { label: 'Принят',          variant: 'default',     className: 'bg-green-600 text-white text-[10px] px-1.5 py-0.5' },
      rejected:  { label: 'Отклонён',        variant: 'destructive', className: 'text-white text-[10px] px-1.5 py-0.5' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl rounded-none sm:rounded-lg flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">{employee.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Должность</p>
              <p className="text-sm font-medium">{employee.position}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Отдел</p>
              <p className="text-sm font-medium">{employee.department}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</p>
              <p className="text-sm font-medium break-all">{employee.email}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Телефон</p>
              <p className="text-sm font-medium">{employee.phone || '—'}</p>
            </div>
            {employee.telegram && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Telegram</p>
                <p className="text-sm font-medium">{employee.telegram}</p>
              </div>
            )}
            {employee.vk && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">VK</p>
                <p className="text-sm font-medium">{employee.vk}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Рекомендации сотрудника</p>
            {employeeRecommendations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="UserX" size={36} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Нет рекомендаций</p>
              </div>
            ) : (
              <div className="space-y-2">
                {employeeRecommendations.map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight">{rec.candidateName}</p>
                      {getStatusBadge(rec.status)}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {rec.candidateEmail && (
                        <span className="flex items-center gap-1 break-all"><Icon name="Mail" size={11} />{rec.candidateEmail}</span>
                      )}
                      {rec.candidatePhone && (
                        <span className="flex items-center gap-1"><Icon name="Phone" size={11} />{rec.candidatePhone}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div>
                        <span className="text-muted-foreground">Вакансия: </span>
                        <span className="font-medium">{rec.vacancyTitle}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Дата: </span>
                        <span className="font-medium">{new Date(rec.date).toLocaleDateString('ru-RU')}</span>
                      </div>
                      {rec.reward && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Вознаграждение: </span>
                          <span className="font-semibold text-green-600">{rec.reward.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      )}
                      {rec.comment && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Комментарий: </span>
                          <span>{rec.comment}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
