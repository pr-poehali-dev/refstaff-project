import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

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

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const paidRequests = requests.filter(r => r.status === 'paid');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  const renderRequestCard = (request: PayoutRequest) => (
    <Card key={request.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{request.userName}</CardTitle>
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
            <div>
              <p className="text-sm font-medium text-muted-foreground">Детали выплаты</p>
              <p className="text-sm">{request.paymentDetails}</p>
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
          {request.status === 'pending' && (
            <Button onClick={() => handleReview(request)} className="w-full mt-2">
              <Icon name="CheckCircle" size={16} className="mr-2" />
              Рассмотреть запрос
            </Button>
          )}
          {request.status === 'approved' && (
            <Button onClick={() => onUpdateStatus(request.id, 'paid')} className="w-full mt-2" variant="outline">
              <Icon name="DollarSign" size={16} className="mr-2" />
              Отметить как выплачено
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">На рассмотрении</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 mx-0 px-0 my-0">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground mx-0 my-[37px]">
                {pendingRequests.reduce((sum, r) => sum + r.amount, 0).toLocaleString('ru-RU')} ₽
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Одобрено</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 my-[33px]">{approvedRequests.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {approvedRequests.reduce((sum, r) => sum + r.amount, 0).toLocaleString('ru-RU')} ₽
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Выплачено</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 my-[30px]">{paidRequests.length}</div>
              <p className="text-xs text-muted-foreground my-[34px]">
                {paidRequests.reduce((sum, r) => sum + r.amount, 0).toLocaleString('ru-RU')} ₽
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Отклонено</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 my-[25px]">{rejectedRequests.length}</div>
              <p className="text-xs text-muted-foreground my-0">
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
    </>
  );
}