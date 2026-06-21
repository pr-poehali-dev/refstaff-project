import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Referral, STATUS_LABELS, TIER_LABELS } from './partnerTypes';

interface Props {
  referrals: Referral[];
}

export default function PartnerClientsTab({ referrals }: Props) {
  return (
    <TabsContent value="clients" className="mt-3">
      <Card>
        <CardContent className="pt-4">
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Users" size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Клиентов пока нет</p>
              <p className="text-xs mt-1">Поделитесь реферальной ссылкой</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map(r => (
                <div key={r.id} className="p-3 rounded-lg border bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{r.company_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.contact_name || r.contact_email || '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString('ru')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[r.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[r.status]?.label || r.status}
                      </span>
                    </div>
                  </div>

                  {r.subscription_tier && (
                    <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Подписка: <span className="font-medium text-foreground">{TIER_LABELS[r.subscription_tier] || r.subscription_tier}</span>
                        {r.subscription_expires_at && (
                          <> до {new Date(r.subscription_expires_at).toLocaleDateString('ru')}</>
                        )}
                      </span>
                    </div>
                  )}

                  {r.commission_amount > 0 && (
                    <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Комиссия 50%:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-700">{r.commission_amount.toLocaleString('ru')} ₽</span>
                        {r.commission_available ? (
                          <Badge className="bg-green-100 text-green-800 text-xs py-0">Доступна</Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800 text-xs py-0">
                            Hold {r.hold_days_left} дн.
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Платежей с комиссией:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map(n => (
                        <div key={n} className={`w-4 h-4 rounded-full text-center leading-4 font-bold ${(r.paid_months_count ?? 0) >= n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>{n}</div>
                      ))}
                      {(r.paid_months_count ?? 0) >= 3 && (
                        <span className="text-gray-400 ml-1">лимит исчерпан</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
