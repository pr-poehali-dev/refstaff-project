import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { PayoutRequestCard } from './payout/PayoutRequestCard';
import { PayoutReviewDialog } from './payout/PayoutReviewDialog';
import { EmployeeRecommendationsDialog } from './payout/EmployeeRecommendationsDialog';
import { EmployeeProfileDialog } from './payout/EmployeeProfileDialog';

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
  const [showRecommendationsDialog, setShowRecommendationsDialog] = useState(false);
  const [employeeRecommendations, setEmployeeRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showEmployeeProfile, setShowEmployeeProfile] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(false);

  const handleReview = (request: PayoutRequest) => {
    setSelectedRequest(request);
    setShowReviewDialog(true);
  };

  const handleSubmitReview = (status: 'approved' | 'rejected' | 'paid', comment: string) => {
    if (selectedRequest) {
      onUpdateStatus(selectedRequest.id, status, comment);
      setShowReviewDialog(false);
      setSelectedRequest(null);
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
                  {pendingRequests.map(request => (
                    <PayoutRequestCard
                      key={request.id}
                      request={request}
                      onShowRecommendations={handleShowRecommendations}
                      onReview={handleReview}
                      onShowEmployeeProfile={handleShowEmployeeProfile}
                      onUpdateStatus={onUpdateStatus}
                    />
                  ))}
                </div>
              </div>
            )}
            {approvedRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Одобренные ({approvedRequests.length})</h3>
                <div className="space-y-3">
                  {approvedRequests.map(request => (
                    <PayoutRequestCard
                      key={request.id}
                      request={request}
                      onShowRecommendations={handleShowRecommendations}
                      onReview={handleReview}
                      onShowEmployeeProfile={handleShowEmployeeProfile}
                      onUpdateStatus={onUpdateStatus}
                    />
                  ))}
                </div>
              </div>
            )}
            {paidRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Выплаченные ({paidRequests.length})</h3>
                <div className="space-y-3">
                  {paidRequests.map(request => (
                    <PayoutRequestCard
                      key={request.id}
                      request={request}
                      onShowRecommendations={handleShowRecommendations}
                      onReview={handleReview}
                      onShowEmployeeProfile={handleShowEmployeeProfile}
                      onUpdateStatus={onUpdateStatus}
                    />
                  ))}
                </div>
              </div>
            )}
            {rejectedRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Отклонённые ({rejectedRequests.length})</h3>
                <div className="space-y-3">
                  {rejectedRequests.map(request => (
                    <PayoutRequestCard
                      key={request.id}
                      request={request}
                      onShowRecommendations={handleShowRecommendations}
                      onReview={handleReview}
                      onShowEmployeeProfile={handleShowEmployeeProfile}
                      onUpdateStatus={onUpdateStatus}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PayoutReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        request={selectedRequest}
        onSubmit={handleSubmitReview}
      />

      <EmployeeRecommendationsDialog
        open={showRecommendationsDialog}
        onOpenChange={setShowRecommendationsDialog}
        request={selectedRequest}
        recommendations={employeeRecommendations}
        loading={loadingRecommendations}
      />

      <EmployeeProfileDialog
        open={showEmployeeProfile}
        onOpenChange={setShowEmployeeProfile}
        request={selectedRequest}
        employeeData={employeeData}
        loading={loadingEmployee}
      />
    </>
  );
}
