import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      pending: { label: 'На рассмотрении', variant: 'secondary' },
      interview: { label: 'На интервью', variant: 'default' },
      hired: { label: 'Принят', variant: 'default' },
      rejected: { label: 'Отклонён', variant: 'destructive' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const stats = {
    total: employeeRecommendations.length,
    pending: employeeRecommendations.filter(r => r.status === 'pending').length,
    interview: employeeRecommendations.filter(r => r.status === 'interview').length,
    hired: employeeRecommendations.filter(r => r.status === 'hired').length,
    rejected: employeeRecommendations.filter(r => r.status === 'rejected').length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {employee.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Должность</p>
              <p className="font-medium">{employee.position}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Отдел</p>
              <p className="font-medium">{employee.department}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{employee.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Телефон</p>
              <p className="font-medium">{employee.phone || '—'}</p>
            </div>
            {employee.telegram && (
              <div>
                <p className="text-sm text-muted-foreground">Telegram</p>
                <p className="font-medium">{employee.telegram}</p>
              </div>
            )}
            {employee.vk && (
              <div>
                <p className="text-sm text-muted-foreground">VK</p>
                <p className="font-medium">{employee.vk}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Всего</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground whitespace-nowrap">На рассмотрении</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground whitespace-nowrap">На интервью</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.interview}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Приняты</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.hired}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Отклонены</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Рекомендации сотрудника</h3>
            {employeeRecommendations.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-8">
                    <Icon name="UserX" size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Нет рекомендаций</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {employeeRecommendations.map((rec) => (
                  <Card key={rec.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{rec.candidateName}</CardTitle>
                          <CardDescription>
                            <div className="flex items-center gap-2 mt-1">
                              <Icon name="Mail" size={14} />
                              {rec.candidateEmail}
                            </div>
                            {rec.candidatePhone && (
                              <div className="flex items-center gap-2 mt-1">
                                <Icon name="Phone" size={14} />
                                {rec.candidatePhone}
                              </div>
                            )}
                          </CardDescription>
                        </div>
                        {getStatusBadge(rec.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Вакансия</p>
                          <p className="text-sm">{rec.vacancyTitle}</p>
                        </div>
                        {rec.comment && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Комментарий</p>
                            <p className="text-sm">{rec.comment}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Дата рекомендации</p>
                          <p className="text-sm">{new Date(rec.date).toLocaleDateString('ru-RU')}</p>
                        </div>
                        {rec.reward && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Вознаграждение</p>
                            <p className="text-sm font-semibold text-green-600">{rec.reward.toLocaleString('ru-RU')} ₽</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}