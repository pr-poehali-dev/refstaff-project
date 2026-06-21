import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { adminFetch } from './adminTypes';

interface Partner {
  id: number;
  name: string;
  email: string;
  phone?: string;
  partner_code: string;
  status: string;
  balance: number;
  total_earned: number;
  clients_invited: number;
  clients_registered: number;
  referrals_count: number;
  paying_clients: number;
  commission_total: number;
  payment_method?: string;
  inn?: string;
  company_name?: string;
  notes?: string;
  telegram_chat_id?: number;
  max_user_id?: number;
  created_at: string;
}

interface Referral {
  id: number;
  company_name?: string;
  contact_name?: string;
  contact_email?: string;
  status: string;
  source: string;
  total_commission_earned: number;
  commission_available_at?: string;
  subscription_tier?: string;
  paid_months_count: number;
  created_at: string;
  company_registered_name?: string;
  current_sub_tier?: string;
}

interface Payout {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  payment_method?: string;
}

interface PartnerDetail {
  partner: Partner;
  referrals: Referral[];
  payouts: Payout[];
}

interface Props {
  secret: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  blocked: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const REF_STATUS_COLORS: Record<string, string> = {
  invited: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  registered: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  subscribed: 'bg-green-500/20 text-green-400 border-green-500/30',
  churned: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function fmt(n: number) {
  return new Intl.NumberFormat('ru-RU').format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function AdminPartnersTab({ secret }: Props) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<PartnerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await adminFetch(secret, '?resource=partners');
    if (Array.isArray(data)) setPartners(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [secret]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setDetail(null);
    const data = await adminFetch(secret, `?resource=partner&partner_id=${id}`);
    setDetail(data);
    setDetailLoading(false);
  };

  const totalBalance = partners.reduce((s, p) => s + Number(p.balance), 0);
  const totalEarned = partners.reduce((s, p) => s + Number(p.total_earned), 0);
  const totalPaying = partners.reduce((s, p) => s + Number(p.paying_clients), 0);

  return (
    <TabsContent value="partners">
      <div className="space-y-6">
        {/* Сводка */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Партнёров', value: partners.length, icon: 'Users' },
            { label: 'Платящих клиентов', value: totalPaying, icon: 'Building2' },
            { label: 'Выплачено всего', value: `${fmt(totalEarned)} ₽`, icon: 'TrendingUp' },
            { label: 'На балансах', value: `${fmt(totalBalance)} ₽`, icon: 'Wallet' },
          ].map(s => (
            <Card key={s.label} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Icon name={s.icon} size={18} className="text-primary" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Партнёры ({partners.length})</h2>
          <Button size="sm" variant="outline" className="border-gray-700 text-gray-300" onClick={load} disabled={loading}>
            <Icon name={loading ? 'Loader2' : 'RefreshCw'} size={14} className={loading ? 'animate-spin mr-1' : 'mr-1'} />
            Обновить
          </Button>
        </div>

        {/* Список */}
        <div className="space-y-3">
          {partners.map(p => (
            <Card key={p.id} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{p.name}</span>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[p.status] || STATUS_COLORS.inactive}`}>
                        {p.status === 'active' ? 'Активен' : p.status === 'blocked' ? 'Заблокирован' : 'Неактивен'}
                      </Badge>
                      {p.telegram_chat_id && <Icon name="MessageCircle" size={14} className="text-blue-400" />}
                      {p.max_user_id && <Icon name="Smartphone" size={14} className="text-purple-400" />}
                    </div>
                    <div className="text-sm text-gray-400 mt-0.5">{p.email}{p.phone ? ` · ${p.phone}` : ''}</div>
                    {p.company_name && <div className="text-xs text-gray-500">{p.company_name}{p.inn ? ` · ИНН ${p.inn}` : ''}</div>}
                    <div className="text-xs text-gray-600 mt-0.5">Код: <span className="text-gray-400 font-mono">{p.partner_code}</span> · Зарег. {fmtDate(p.created_at)}</div>
                  </div>

                  <div className="flex gap-4 md:gap-6 text-center">
                    <div>
                      <div className="text-lg font-bold text-white">{p.referrals_count}</div>
                      <div className="text-xs text-gray-500">рефералов</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-400">{p.paying_clients}</div>
                      <div className="text-xs text-gray-500">платят</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-400">{fmt(Number(p.total_earned))} ₽</div>
                      <div className="text-xs text-gray-500">заработано</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{fmt(Number(p.balance))} ₽</div>
                      <div className="text-xs text-gray-500">баланс</div>
                    </div>
                  </div>

                  <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 shrink-0" onClick={() => openDetail(p.id)}>
                    <Icon name="ChevronRight" size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && partners.length === 0 && (
            <div className="text-center py-12 text-gray-500">Партнёры пока не зарегистрированы</div>
          )}
        </div>

        {/* Детали партнёра */}
        {(detailLoading || detail) && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-white text-base">
                {detailLoading ? 'Загрузка...' : detail?.partner.name}
              </CardTitle>
              <Button size="sm" variant="ghost" className="text-gray-400" onClick={() => setDetail(null)}>
                <Icon name="X" size={16} />
              </Button>
            </CardHeader>
            <CardContent>
              {detailLoading && <div className="text-center py-8"><Icon name="Loader2" size={24} className="animate-spin text-primary mx-auto" /></div>}
              {detail && (
                <div className="space-y-5">
                  {/* Реквизиты */}
                  {(detail.partner.payment_method || detail.partner.notes) && (
                    <div className="bg-gray-800 rounded-lg p-3 space-y-1">
                      {detail.partner.payment_method && (
                        <div className="text-sm text-gray-300"><span className="text-gray-500">Способ выплаты:</span> {detail.partner.payment_method}</div>
                      )}
                      {detail.partner.notes && (
                        <div className="text-sm text-gray-300"><span className="text-gray-500">Заметки:</span> {detail.partner.notes}</div>
                      )}
                    </div>
                  )}

                  {/* Рефералы */}
                  <div>
                    <div className="text-sm font-medium text-gray-300 mb-2">Рефералы ({detail.referrals.length})</div>
                    {detail.referrals.length === 0 && <div className="text-sm text-gray-600">Нет рефералов</div>}
                    <div className="space-y-2">
                      {detail.referrals.map(r => (
                        <div key={r.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium truncate">
                              {r.company_registered_name || r.company_name || r.contact_name || '—'}
                            </div>
                            {r.contact_email && <div className="text-xs text-gray-500">{r.contact_email}</div>}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className={`text-xs ${REF_STATUS_COLORS[r.status] || ''}`}>
                                {r.status === 'subscribed' ? 'Подписчик' : r.status === 'registered' ? 'Зарегистрирован' : r.status === 'invited' ? 'Приглашён' : r.status}
                              </Badge>
                              {r.current_sub_tier && r.current_sub_tier !== 'none' && (
                                <span className="text-xs text-gray-500">тариф: {r.current_sub_tier}</span>
                              )}
                              <span className="text-xs text-gray-600">{fmtDate(r.created_at)}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold text-yellow-400">{fmt(Number(r.total_commission_earned))} ₽</div>
                            <div className="text-xs text-gray-600">{r.paid_months_count}/3 мес.</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Запросы на выплату */}
                  {detail.payouts.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-300 mb-2">Запросы на выплату</div>
                      <div className="space-y-2">
                        {detail.payouts.map(py => (
                          <div key={py.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                            <div>
                              <div className="text-sm text-white">{fmt(py.amount)} ₽</div>
                              <div className="text-xs text-gray-500">{fmtDate(py.created_at)}{py.payment_method ? ` · ${py.payment_method}` : ''}</div>
                            </div>
                            <Badge variant="outline" className={`text-xs ${py.status === 'paid' ? 'text-green-400 border-green-500/30' : py.status === 'pending' ? 'text-yellow-400 border-yellow-500/30' : 'text-gray-400 border-gray-600'}`}>
                              {py.status === 'paid' ? 'Выплачено' : py.status === 'pending' ? 'Ожидает' : py.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </TabsContent>
  );
}