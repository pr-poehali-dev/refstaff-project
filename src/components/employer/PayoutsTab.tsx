import React, { lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { api, type Company } from '@/lib/api';
import type { PayoutRequest, Vacancy } from '@/types';

const SubscriptionExpiredBlock = lazy(() => import('@/components/SubscriptionExpiredBlock').then(m => ({ default: m.SubscriptionExpiredBlock })));
const PayoutRequests = lazy(() => import('@/components/PayoutRequests').then(m => ({ default: m.PayoutRequests })));

const LazyFallback = () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

export interface PayoutsTabProps {
  isSubscriptionExpired: boolean;
  onRenew: () => void;
  payoutMethodsCollapsed: boolean;
  onPayoutMethodsCollapsedChange: (v: boolean) => void;
  company: Company | null;
  onCompanyChange: (updater: (prev: Company | null) => Company | null) => void;
  payoutRequests: PayoutRequest[];
  currentCompanyId: number;
  vacancies: Vacancy[];
  onViewVacancy: (vacancy: Vacancy) => void;
  onUpdatePayoutStatus: (id: number, status: string) => void;
  currentUserId: number;
  onReloadData: () => void;
}

export function PayoutsTab({
  isSubscriptionExpired,
  onRenew,
  payoutMethodsCollapsed,
  onPayoutMethodsCollapsedChange,
  company,
  onCompanyChange,
  payoutRequests,
  currentCompanyId,
  vacancies,
  onViewVacancy,
  currentUserId,
  onReloadData,
}: PayoutsTabProps) {
  return (
    <>
      {isSubscriptionExpired ? (
        <Suspense fallback={<LazyFallback />}>
          <SubscriptionExpiredBlock onRenew={onRenew} />
        </Suspense>
      ) : (
        <>
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 mb-2">
              <span>💰</span>
              <span className="hidden sm:inline">Запросы на выплаты</span>
              <span className="sm:hidden">Выплаты</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Управление запросами сотрудников
            </p>
          </div>
          <Card className="mb-4 sm:mb-6">
            <CardHeader
              className="pb-3 cursor-pointer select-none"
              onClick={() => onPayoutMethodsCollapsedChange(!payoutMethodsCollapsed)}
            >
              <CardTitle className="text-sm sm:text-base flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span>⚙️</span> Доступные методы выплат
                </div>
                <Icon name={payoutMethodsCollapsed ? 'ChevronDown' : 'ChevronUp'} size={16} className="text-muted-foreground" />
              </CardTitle>
              {!payoutMethodsCollapsed && (
                <CardDescription className="text-xs">Выберите способы, которые сотрудники смогут использовать для получения вознаграждений</CardDescription>
              )}
            </CardHeader>
            {!payoutMethodsCollapsed && (
              <CardContent className="space-y-2">
                {[
                  { key: 'cash', label: 'Наличными', emoji: '💵' },
                  { key: 'card', label: 'На карту', emoji: '💳' },
                  { key: 'sbp', label: 'По СБП', emoji: '📱' },
                  { key: 'bank', label: 'По реквизитам на счёт', emoji: '🏦' },
                ].map(({ key, label, emoji }) => {
                  const methods: string[] = company?.payout_methods ?? ['card', 'sbp', 'cash', 'bank'];
                  const enabled = methods.includes(key);
                  return (
                    <div key={key} className="flex items-center justify-between py-1" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 text-sm">
                        <span>{emoji}</span>
                        <span>{label}</span>
                      </div>
                      <Checkbox
                        checked={enabled}
                        onCheckedChange={async (checked) => {
                          const current: string[] = company?.payout_methods ?? ['card', 'sbp', 'cash', 'bank'];
                          const updated = checked
                            ? [...current, key]
                            : current.filter(m => m !== key);
                          await api.updateCompany(currentCompanyId, { payout_methods: updated });
                          onCompanyChange(prev => prev ? { ...prev, payout_methods: updated } : null);
                        }}
                      />
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>

          <Suspense fallback={<LazyFallback />}>
            <PayoutRequests
              requests={payoutRequests}
              companyId={currentCompanyId}
              onUpdateStatus={async (requestId, status, comment) => {
                try {
                  const response = await fetch('https://functions.poehali.dev/f88ab2cf-1304-40dd-82e4-a7a1f7358901', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      request_id: requestId,
                      status: status,
                      admin_comment: comment,
                      reviewed_by: currentUserId || 1,
                    }),
                  });

                  if (response.ok) {
                    await onReloadData();
                  } else {
                    const error = await response.json();
                    alert(`Ошибка: ${error.error || 'Не удалось обновить статус'}`);
                  }
                } catch (error) {
                  console.error('Ошибка обновления статуса выплаты:', error);
                  alert('Не удалось обновить статус выплаты');
                }
              }}
              onVacancyClick={(vacancyId) => {
                const vacancy = vacancies.find(v => v.id === vacancyId);
                if (vacancy) {
                  onViewVacancy(vacancy);
                }
              }}
            />
          </Suspense>
        </>
      )}
    </>
  );
}

export default PayoutsTab;
