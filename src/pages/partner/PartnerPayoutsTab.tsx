import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Partner, Payout, PAYOUT_STATUS } from './partnerTypes';

interface Props {
  partner: Partner;
  payouts: Payout[];
  pendingCommission: number;
  availableCommission: number;
  onRequestPayout: () => void;
}

export default function PartnerPayoutsTab({ partner, payouts, pendingCommission, availableCommission, onRequestPayout }: Props) {
  return (
    <TabsContent value="payouts" className="mt-3">
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Баланс: <span className="font-bold text-foreground">{partner.balance.toLocaleString('ru')} ₽</span>
              </p>
              {pendingCommission > 0 && (
                <p className="text-xs text-orange-600 mt-0.5">
                  На удержании (hold): {pendingCommission.toLocaleString('ru')} ₽
                </p>
              )}
              {availableCommission > 0 && (
                <p className="text-xs text-green-600 mt-0.5">
                  Доступно к выплате: {availableCommission.toLocaleString('ru')} ₽
                </p>
              )}
            </div>
            <Button size="sm" onClick={onRequestPayout} disabled={partner.balance <= 0}>
              <Icon name="Send" size={14} className="mr-1" />Запросить вывод
            </Button>
          </div>

          {payouts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Icon name="Wallet" size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Выплат пока не было</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payouts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                  <div>
                    <p className="font-semibold text-sm">{p.amount.toLocaleString('ru')} ₽</p>
                    <p className="text-xs text-muted-foreground">{p.payment_method} · {new Date(p.created_at).toLocaleDateString('ru')}</p>
                    {p.admin_comment && <p className="text-xs text-muted-foreground mt-0.5">{p.admin_comment}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYOUT_STATUS[p.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                    {PAYOUT_STATUS[p.status]?.label || p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}