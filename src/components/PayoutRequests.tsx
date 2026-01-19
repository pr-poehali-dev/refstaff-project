import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

export interface PayoutRequest {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  paymentMethod?: string;
  paymentDetails?: string;
  adminComment?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  candidateName?: string;
  candidateEmail?: string;
  vacancyTitle?: string;
  recommendationId?: number;
}

interface PayoutRequestsProps {
  requests: PayoutRequest[];
  onUpdateStatus: (requestId: number, status: string, comment?: string) => void;
}

export function PayoutRequests({ requests, onUpdateStatus }: PayoutRequestsProps) {
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'paid'>('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [showRecommendationsDialog, setShowRecommendationsDialog] = useState(false);
  const [employeeRecommendations, setEmployeeRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showEmployeeProfile, setShowEmployeeProfile] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(false);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      pending: { label: 'На рассмотрении', variant: 'secondary' },
      approved: { label: 'Одобрено', variant: 'default' },
      rejected: { label: 'Отклонено', variant: 'destructive' },
      paid: { label: 'Выплачено', variant: 'outline' },
    };
    const cfg = config[status] || config.pending;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const handleReview = (request: PayoutRequest) => {
    setSelectedRequest(request);
    setReviewStatus('approved');
    setReviewComment('');
    setShowReviewDialog(true);
  };

  const handleSubmitReview = () => {
    if (selectedRequest) {
      onUpdateStatus(selectedRequest.id, reviewStatus, reviewComment);
      setShowReviewDialog(false);
      setSelectedRequest(null);
      setReviewComment('');
    }
  };

  const handleShowRecommendations = async (request: PayoutRequest) => {
    setSelectedRequest(request);
    setShowRecommendationsDialog(true);
    setLoadingRecommendations(true);
    
    try {
      const recommendations = await api.getRecommendations(1, undefined, request.userId);
      setEmployeeRecommendations(recommendations);
    } catch (error) {
      console.error('Ошибка загрузки рекомендаций:', error);
      setEmployeeRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const getRecommendationStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      pending: { label: 'На рассмотрении', variant: 'secondary' },
      accepted: { label: 'Принято', variant: 'default' },
      rejected: { label: 'Отклонено', variant: 'destructive' },
      interview: { label: 'Интервью', variant: 'outline' },
      hired: { label: 'Нанят', variant: 'default' },
    };
    const cfg = config[status] || config.pending;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const handleShowEmployeeProfile = async (request: PayoutRequest) => {
    setSelectedRequest(request);
    setShowEmployeeProfile(true);
    setLoadingEmployee(true);
    
    try {
      const employees = await api.getEmployees(1);
      const employee = employees.find(emp => emp.id === request.userId);
      if (employee) {
        const recommendations = await api.getRecommendations(1, undefined, request.userId);
        setEmployeeData({ ...employee, recommendations });
      }
    } catch (error) {
      console.error('Ошибка загрузки данных сотрудника:', error);
      setEmployeeData(null);
    } finally {
      setLoadingEmployee(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const paidRequests = requests.filter(r => r.status === 'paid');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  const renderRequestCard = (request: PayoutRequest) => (
    <Card key={request.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle 
              className="text-base cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleShowEmployeeProfile(request)}
            >
              {request.userName}
            </CardTitle>
            <CardDescription>{request.userEmail}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(request.status)}
            <div className="text-lg font-bold text-green-600">
              {request.amount.toLocaleString('ru-RU')} ₽
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {request.candidateName && (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-1">Кандидат</p>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-800">{request.candidateName}</p>
                {request.candidateEmail && (
                  <p className="text-xs text-blue-600">{request.candidateEmail}</p>
                )}
                {request.vacancyTitle && (
                  <p className="text-xs text-blue-600">Вакансия: {request.vacancyTitle}</p>
                )}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Дата запроса</p>
            <p className="text-sm">{new Date(request.createdAt).toLocaleString('ru-RU')}</p>
          </div>
          {request.paymentMethod && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Способ выплаты</p>
              <p className="text-sm">{request.paymentMethod}</p>
            </div>
          )}
          {request.paymentDetails && (
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">Детали выплаты</p>
              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-md text-sm">
                {request.paymentDetails.split('\n').map((line, idx) => {
                  const [label, value] = line.split(':').map(s => s.trim());
                  return value ? (
                    <div key={idx}>
                      <span className="text-muted-foreground text-xs">{label}:</span>
                      <p className="font-medium">{value}</p>
                    </div>
                  ) : (
                    <p key={idx} className="col-span-2 font-medium">{line}</p>
                  );
                })}
              </div>
            </div>
          )}
          {request.adminComment && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Комментарий администратора</p>
              <p className="text-sm">{request.adminComment}</p>
            </div>
          )}
          {request.reviewedAt && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Дата рассмотрения</p>
              <p className="text-sm">{new Date(request.reviewedAt).toLocaleString('ru-RU')}</p>
            </div>
          )}
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => handleShowRecommendations(request)} variant="outline" className="w-full">
              <Icon name="Users" size={16} className="mr-2" />
              Показать рекомендации
            </Button>
            {request.status === 'pending' && (
              <Button onClick={() => handleReview(request)} className="w-full">
                <Icon name="CheckCircle" size={16} className="mr-2" />
                Рассмотреть запрос
              </Button>
            )}
            {request.status === 'approved' && (
              <Button onClick={() => onUpdateStatus(request.id, 'paid')} className="w-full" variant="outline">
                <Icon name="DollarSign" size={16} className="mr-2" />
                Отметить как выплачено
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">На рассмотрении</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {pendingRequests.reduce((sum, r) => sum + r.amount, 0).toLocaleString('ru-RU')} ₽
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Одобрено</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{approvedRequests.length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {approvedRequests.reduce((sum, r) => sum + r.amount, 0).toLocaleString('ru-RU')} ₽
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Выплачено</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{paidRequests.length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {paidRequests.reduce((sum, r) => sum + r.amount, 0).toLocaleString('ru-RU')} ₽
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Отклонено</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{rejectedRequests.length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {rejectedRequests.reduce((sum, r) => sum + r.amount, 0).toLocaleString('ru-RU')} ₽
              </p>
            </CardContent>
          </Card>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-12">
                <Icon name="Wallet" size={48} className="mx-auto mb-2 opacity-50" />
                <p>Нет запросов на выплаты</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">На рассмотрении ({pendingRequests.length})</h3>
                <div className="space-y-3">
                  {pendingRequests.map(renderRequestCard)}
                </div>
              </div>
            )}
            {approvedRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Одобренные ({approvedRequests.length})</h3>
                <div className="space-y-3">
                  {approvedRequests.map(renderRequestCard)}
                </div>
              </div>
            )}
            {paidRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Выплаченные ({paidRequests.length})</h3>
                <div className="space-y-3">
                  {paidRequests.map(renderRequestCard)}
                </div>
              </div>
            )}
            {rejectedRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Отклонённые ({rejectedRequests.length})</h3>
                <div className="space-y-3">
                  {rejectedRequests.map(renderRequestCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Рассмотрение запроса на выплату</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  Запрос от {selectedRequest.userName} на сумму{' '}
                  <span className="font-semibold">{selectedRequest.amount.toLocaleString('ru-RU')} ₽</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Решение</Label>
              <Select value={reviewStatus} onValueChange={(v) => setReviewStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Одобрить</SelectItem>
                  <SelectItem value="rejected">Отклонить</SelectItem>
                  <SelectItem value="paid">Выплачено</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Комментарий (опционально)</Label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Добавьте комментарий к решению..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitReview} className="flex-1">
                <Icon name="Check" size={16} className="mr-2" />
                Подтвердить
              </Button>
              <Button onClick={() => setShowReviewDialog(false)} variant="outline">
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRecommendationsDialog} onOpenChange={setShowRecommendationsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Рекомендации сотрудника</DialogTitle>
            <DialogDescription>
              {selectedRequest && `${selectedRequest.userName} — все рекомендации кандидатов`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {loadingRecommendations ? (
              <div className="flex items-center justify-center py-8">
                <Icon name="Loader2" className="animate-spin text-primary" size={32} />
              </div>
            ) : employeeRecommendations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Users" size={48} className="mx-auto mb-3 opacity-50" />
                <p>У этого сотрудника пока нет рекомендаций</p>
              </div>
            ) : (
              <div className="space-y-3">
                {employeeRecommendations.map((rec) => (
                  <Card key={rec.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{rec.candidate_name}</CardTitle>
                          <CardDescription className="text-xs">{rec.candidate_email}</CardDescription>
                        </div>
                        {getRecommendationStatusBadge(rec.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {rec.vacancy_title && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Вакансия</p>
                            <p className="font-medium">{rec.vacancy_title}</p>
                          </div>
                        )}
                        {rec.candidate_phone && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Телефон</p>
                            <p>{rec.candidate_phone}</p>
                          </div>
                        )}
                        {rec.comment && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Комментарий</p>
                            <p className="text-xs">{rec.comment}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Дата рекомендации</p>
                          <p className="text-xs">{new Date(rec.created_at).toLocaleString('ru-RU')}</p>
                        </div>
                        {rec.status === 'hired' && (
                          <div className="bg-green-50 p-2 rounded-md border border-green-200">
                            <p className="text-xs font-medium text-green-800">
                              <Icon name="CheckCircle" size={14} className="inline mr-1" />
                              Вознаграждение: {rec.reward_amount.toLocaleString('ru-RU')} ₽
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmployeeProfile} onOpenChange={setShowEmployeeProfile}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Профиль сотрудника</DialogTitle>
            <DialogDescription>
              {selectedRequest && `Полная информация о ${selectedRequest.userName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {loadingEmployee ? (
              <div className="flex items-center justify-center py-8">
                <Icon name="Loader2" className="animate-spin text-primary" size={32} />
              </div>
            ) : employeeData ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      {employeeData.avatar_url ? (
                        <img src={employeeData.avatar_url} alt={employeeData.first_name} className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon name="User" size={32} className="text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle>{employeeData.first_name} {employeeData.last_name}</CardTitle>
                        <CardDescription>{employeeData.position} • {employeeData.department}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Уровень</p>
                        <p className="text-2xl font-bold text-primary">{employeeData.level}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Опыт</p>
                        <p className="text-2xl font-bold">{employeeData.experience_points} XP</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Рекомендаций</p>
                        <p className="text-2xl font-bold text-blue-600">{employeeData.total_recommendations}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Успешных наймов</p>
                        <p className="text-2xl font-bold text-green-600">{employeeData.successful_hires}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Всего заработано</p>
                        <p className="text-3xl font-bold text-green-600">{employeeData.total_earnings.toLocaleString('ru-RU')} ₽</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedRequest && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon name="Wallet" size={18} className="text-primary" />
                        Детали выплаты
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Способ выплаты</p>
                          <p className="text-sm font-semibold">{selectedRequest.paymentMethod}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Реквизиты</p>
                          <div className="text-sm whitespace-pre-line bg-background p-3 rounded-md border">
                            {selectedRequest.paymentDetails}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {employeeData.email && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Контакты</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {employeeData.email && (
                          <div className="flex items-center gap-2">
                            <Icon name="Mail" size={16} className="text-muted-foreground" />
                            <span className="text-sm">{employeeData.email}</span>
                          </div>
                        )}
                        {employeeData.phone && (
                          <div className="flex items-center gap-2">
                            <Icon name="Phone" size={16} className="text-muted-foreground" />
                            <span className="text-sm">{employeeData.phone}</span>
                          </div>
                        )}
                        {employeeData.telegram && (
                          <div className="flex items-center gap-2">
                            <Icon name="Send" size={16} className="text-muted-foreground" />
                            <span className="text-sm">{employeeData.telegram}</span>
                          </div>
                        )}
                        {employeeData.vk && (
                          <div className="flex items-center gap-2">
                            <Icon name="MessageCircle" size={16} className="text-muted-foreground" />
                            <span className="text-sm">{employeeData.vk}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {employeeData.recommendations && employeeData.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">История рекомендаций</CardTitle>
                      <CardDescription>{employeeData.recommendations.length} {employeeData.recommendations.length === 1 ? 'рекомендация' : 'рекомендаций'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {employeeData.recommendations.map((rec: any) => (
                          <div key={rec.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{rec.candidate_name}</p>
                                <p className="text-xs text-muted-foreground">{rec.vacancy_title}</p>
                              </div>
                              {getRecommendationStatusBadge(rec.status)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(rec.created_at).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="AlertCircle" size={48} className="mx-auto mb-3 opacity-50" />
                <p>Не удалось загрузить данные сотрудника</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}