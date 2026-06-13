import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { type Company } from '@/lib/api';

export interface SubscriptionTabProps {
  subscriptionDaysLeft: number | null;
  company: Company | null;
  onRenew: () => void;
}

export function SubscriptionTab({ subscriptionDaysLeft, company, onRenew }: SubscriptionTabProps) {
  return (
    <>
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <span>💳</span> Подписка
      </h2>
      <Card className={subscriptionDaysLeft !== null && subscriptionDaysLeft <= 0 ? 'border-destructive' : subscriptionDaysLeft !== null && subscriptionDaysLeft < 7 ? 'border-orange-400' : 'border-primary'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{company?.subscription_tier === 'trial' ? 'Пробный период' : 'Продвинутый'}</CardTitle>
            <Badge variant={subscriptionDaysLeft !== null && subscriptionDaysLeft <= 0 ? 'destructive' : subscriptionDaysLeft !== null && subscriptionDaysLeft < 7 ? 'destructive' : 'secondary'}>
              {subscriptionDaysLeft !== null && subscriptionDaysLeft <= 0 ? 'Истекла' : subscriptionDaysLeft !== null ? `${subscriptionDaysLeft} дн. осталось` : '—'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={Math.max(0, Math.min(100, ((subscriptionDaysLeft ?? 0) / 30) * 100))} className="h-2" />
          {company?.subscription_expires_at && (
            <p className="text-xs text-muted-foreground">
              Действует до: {new Date(company.subscription_expires_at).toLocaleDateString('ru-RU')}
            </p>
          )}
        </CardContent>
      </Card>

      {subscriptionDaysLeft !== null && subscriptionDaysLeft <= 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon name="AlertTriangle" className="text-destructive mt-0.5" size={20} />
            <div className="flex-1 text-sm">
              <p className="font-medium text-destructive mb-1">Подписка истекла</p>
              <p className="text-muted-foreground">Доступ ограничен. Продлите подписку для восстановления.</p>
            </div>
          </div>
        </div>
      )}
      {subscriptionDaysLeft !== null && subscriptionDaysLeft > 0 && subscriptionDaysLeft < 7 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon name="AlertTriangle" className="text-destructive mt-0.5" size={20} />
            <div className="flex-1 text-sm">
              <p className="font-medium text-destructive mb-1">Подписка заканчивается!</p>
              <p className="text-muted-foreground">Продлите, чтобы не потерять доступ к функциям</p>
            </div>
          </div>
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={onRenew}
      >
        <Icon name="CreditCard" className="mr-2" size={18} />
        {subscriptionDaysLeft !== null && subscriptionDaysLeft <= 0 ? 'Восстановить подписку' : 'Продлить подписку'}
      </Button>
    </>
  );
}

export default SubscriptionTab;
