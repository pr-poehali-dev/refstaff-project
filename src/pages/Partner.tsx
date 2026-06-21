import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { STATUS_LABELS, TIER_LABELS, PAYOUT_STATUS } from './partner/partnerTypes';
import { usePartner } from './partner/usePartner';
import PartnerLanding from './partner/PartnerLanding';

export default function Partner() {
  const {
    partner, referrals, payouts, loading, referralLink,
    authStep, setAuthStep, messenger, setMessenger,
    deepLink, otp, setOtp, submitting,
    profileForm, setProfileForm,
    editProfile, setEditProfile, savingProfile,
    showAddReferral, setShowAddReferral,
    showPayout, setShowPayout,
    referralForm, setReferralForm,
    payoutForm, setPayoutForm,
    handleSendToMessenger, handleVerifyOtp, handleCompleteRegistration,
    handleAddReferral, handleRequestPayout, handleSaveProfile,
    copyToClipboard, logout,
  } = usePartner();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── ЛЕНДИНГ + ФОРМА ВХОДА ───────────────────────────────────────────────────
  if (!partner) {
    return (
      <PartnerLanding
        authStep={authStep}
        setAuthStep={setAuthStep}
        messenger={messenger}
        deepLink={deepLink}
        otp={otp}
        setOtp={setOtp}
        submitting={submitting}
        profileForm={profileForm}
        setProfileForm={setProfileForm}
        handleSendToMessenger={handleSendToMessenger}
        handleVerifyOtp={handleVerifyOtp}
        handleCompleteRegistration={handleCompleteRegistration}
      />
    );
  }

  // Статистика комиссий
  const pendingCommission = referrals.filter(r => r.commission_amount > 0 && !r.commission_available).reduce((s, r) => s + r.commission_amount, 0);
  const availableCommission = referrals.filter(r => r.commission_amount > 0 && r.commission_available).reduce((s, r) => s + r.commission_amount, 0);

  // ── ЛИЧНЫЙ КАБИНЕТ ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Rocket" size={20} className="text-primary" />
            <span className="font-bold">iHUNT</span>
            <span className="text-muted-foreground text-sm">/ Партнёрский кабинет</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <Icon name="LogOut" size={16} className="mr-1" />Выйти
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Привет, {partner.name.split(' ')[0]}!</h1>
          <p className="text-sm text-muted-foreground">Партнёрский код: <span className="font-mono font-semibold text-foreground">{partner.partner_code}</span></p>
        </div>

        {/* Карточки статистики */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Баланс</p>
              <p className="text-xl font-bold text-primary">{partner.balance.toLocaleString('ru')} ₽</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Всего заработано</p>
              <p className="text-xl font-bold">{partner.total_earned.toLocaleString('ru')} ₽</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">На удержании</p>
              <p className="text-xl font-bold text-orange-500">{pendingCommission.toLocaleString('ru')} ₽</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Клиентов</p>
              <p className="text-xl font-bold">{partner.clients_registered}</p>
            </CardContent>
          </Card>
        </div>

        {/* Реферальная ссылка */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Ваша реферальная ссылка</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Когда компания регистрируется по этой ссылке — она привязывается к вам. Вы получаете 50% за первые 3 ежемесячных платежа или 50% от стоимости годовой подписки — разово.</p>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="text-xs font-mono bg-white" />
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(referralLink, 'Ссылка')}>
                <Icon name="Copy" size={14} />
              </Button>
            </div>
            <Button className="w-full" variant="outline" onClick={() => setShowAddReferral(true)}>
              <Icon name="UserPlus" size={16} className="mr-2" />
              Добавить клиента вручную
            </Button>
          </CardContent>
        </Card>

        {/* Вкладки */}
        <Tabs defaultValue="clients">
          <TabsList className="w-full">
            <TabsTrigger value="clients" className="flex-1">
              <Icon name="Users" size={14} className="mr-1" />Клиенты ({referrals.length})
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex-1">
              <Icon name="Wallet" size={14} className="mr-1" />Выплаты ({payouts.length})
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-1">
              <Icon name="User" size={14} className="mr-1" />Профиль
            </TabsTrigger>
            <TabsTrigger value="help" className="flex-1">
              <Icon name="CircleHelp" size={14} className="mr-1" />Помощь
            </TabsTrigger>
          </TabsList>

          {/* ── Клиенты ── */}
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
                            {[1,2,3].map(n => (
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

          {/* ── Выплаты ── */}
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
                  <Button size="sm" onClick={() => setShowPayout(true)} disabled={partner.balance <= 0}>
                    <Icon name="ArrowUpRight" size={14} className="mr-1" />Вывести
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

          {/* ── Профиль ── */}
          <TabsContent value="profile" className="mt-3">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Личные данные и реквизиты</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Имя *</Label>
                    <Input value={editProfile.name} onChange={e => setEditProfile(p => ({ ...p, name: e.target.value }))} placeholder="Иванова Анна" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={editProfile.email} onChange={e => setEditProfile(p => ({ ...p, email: e.target.value }))} placeholder="anna@example.com" />
                  </div>
                  <div>
                    <Label>Телефон</Label>
                    <Input value={editProfile.phone} onChange={e => setEditProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+7 900 000 00 00" />
                  </div>
                  <div>
                    <Label>ИНН (если ИП или ООО)</Label>
                    <Input value={editProfile.inn} onChange={e => setEditProfile(p => ({ ...p, inn: e.target.value }))} placeholder="123456789012" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Название компании / ИП</Label>
                    <Input value={editProfile.company_name} onChange={e => setEditProfile(p => ({ ...p, company_name: e.target.value }))} placeholder="ИП Иванова А.С." />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Реквизиты для выплат</p>
                  <div className="space-y-3">
                    <div>
                      <Label>Способ получения</Label>
                      <Input value={editProfile.payment_method} onChange={e => setEditProfile(p => ({ ...p, payment_method: e.target.value }))} placeholder="СБП / Карта / Расчётный счёт" />
                    </div>
                    <div>
                      <Label>Реквизиты</Label>
                      <Textarea
                        value={editProfile.payment_details}
                        onChange={e => setEditProfile(p => ({ ...p, payment_details: e.target.value }))}
                        placeholder="Номер карты, телефон СБП или полные банковские реквизиты"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Дополнительно</Label>
                      <Textarea
                        value={editProfile.notes}
                        onChange={e => setEditProfile(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Любые уточнения по выплатам"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={handleSaveProfile} disabled={savingProfile || !editProfile.name}>
                  {savingProfile ? 'Сохраняем...' : 'Сохранить профиль'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Помощь ── */}
          <TabsContent value="help" className="mt-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon name="Rocket" size={18} className="text-primary" />
                  Как работает партнёрская программа
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { step: '1', title: 'Поделитесь реферальной ссылкой', desc: 'Отправьте свою уникальную ссылку потенциальному клиенту — компании, которая ищет сотрудников.' },
                  { step: '2', title: 'Клиент регистрируется', desc: 'Компания регистрируется на iHUNT по вашей ссылке и автоматически привязывается к вам.' },
                  { step: '3', title: 'Клиент оплачивает подписку', desc: 'Вы получаете 50% за первые 3 ежемесячных платежа или 50% от полной стоимости годовой подписки — разово.' },
                  { step: '4', title: 'Получаете выплату', desc: 'После 30-дневного hold-периода деньги становятся доступны к выводу на карту или расчётный счёт.' },
                ].map(s => (
                  <div key={s.step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{s.step}</div>
                    <div>
                      <p className="font-medium text-sm">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon name="Lightbulb" size={18} className="text-yellow-500" />
                  Советы по привлечению клиентов
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: 'Target', text: 'Ориентируйтесь на компании от 20 сотрудников — у них есть бюджет на HR-инструменты.' },
                  { icon: 'MessageCircle', text: 'Расскажите клиенту о конкретной выгоде: сотрудники сами рекомендуют кандидатов, нет затрат на рекрутёра.' },
                  { icon: 'Share2', text: 'Делитесь ссылкой в деловых чатах, на LinkedIn, в отраслевых сообществах.' },
                  { icon: 'UserPlus', text: 'Добавляйте «тёплых» клиентов вручную — если договорились лично, не забудьте зафиксировать контакт.' },
                  { icon: 'RefreshCw', text: 'Напоминайте существующим клиентам о продлении подписки — вы снова получите комиссию.' },
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                    <Icon name={tip.icon} size={16} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-xs">{tip.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon name="HelpCircle" size={18} className="text-blue-500" />
                  Частые вопросы
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { q: 'Когда деньги становятся доступны?', a: 'После 30-дневного hold-периода с момента оплаты подписки клиентом. Это защита от возвратов.' },
                  { q: 'Что такое «На удержании»?', a: 'Комиссия, которая уже начислена, но ещё не прошла hold-период. Скоро появится на балансе.' },
                  { q: 'За сколько платежей я получаю комиссию?', a: 'За первые 3 ежемесячных платежа (по 9 950 ₽ каждый). Если клиент оплатил сразу год — вы получаете 50% от годовой стоимости (101 490 ₽) единоразово, после чего лимит исчерпан.' },
                  { q: 'Как долго клиент «привязан» ко мне?', a: 'Навсегда. Один раз зарегистрировавшись по вашей ссылке, компания остаётся вашим клиентом.' },
                  { q: 'Есть ли минимальная сумма для вывода?', a: 'Вывод доступен при любом положительном балансе. Минимальной суммы нет.' },
                ].map((faq, i) => (
                  <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                    <p className="font-medium text-sm">{faq.q}</p>
                    <p className="text-xs text-muted-foreground mt-1">{faq.a}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <Icon name="HeadphonesIcon" size={24} className="text-primary shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Нужна помощь?</p>
                  <p className="text-xs text-muted-foreground">Напишите нам — ответим в течение рабочего дня.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => window.open('https://t.me/ihunt_support', '_blank')}>
                  <Icon name="Send" size={14} className="mr-1" />Telegram
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Диалог добавления клиента вручную */}
      <Dialog open={showAddReferral} onOpenChange={setShowAddReferral}>
        <DialogContent>
          <DialogHeader><DialogTitle>Добавить клиента вручную</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Название компании *</Label><Input placeholder="ООО Ромашка" value={referralForm.company_name} onChange={e => setReferralForm(p => ({ ...p, company_name: e.target.value }))} /></div>
            <div><Label>Контактное лицо</Label><Input placeholder="Иван Петров" value={referralForm.contact_name} onChange={e => setReferralForm(p => ({ ...p, contact_name: e.target.value }))} /></div>
            <div><Label>Email</Label><Input type="email" placeholder="ivan@company.ru" value={referralForm.contact_email} onChange={e => setReferralForm(p => ({ ...p, contact_email: e.target.value }))} /></div>
            <div><Label>Телефон</Label><Input placeholder="+7 900 000 00 00" value={referralForm.contact_phone} onChange={e => setReferralForm(p => ({ ...p, contact_phone: e.target.value }))} /></div>
            <Button className="w-full" onClick={handleAddReferral} disabled={submitting}>
              {submitting ? 'Добавляем...' : 'Добавить клиента'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог выплаты */}
      <Dialog open={showPayout} onOpenChange={setShowPayout}>
        <DialogContent>
          <DialogHeader><DialogTitle>Запрос на выплату</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Доступно: <span className="font-bold text-foreground">{partner.balance.toLocaleString('ru')} ₽</span></p>
            {partner.payment_method && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs">
                <p className="font-medium text-blue-800 mb-1">Сохранённые реквизиты:</p>
                <p className="text-blue-700">{partner.payment_method}: {partner.payment_details}</p>
                <button
                  className="text-blue-600 underline mt-1"
                  onClick={() => setPayoutForm(p => ({
                    ...p,
                    payment_method: partner.payment_method || '',
                    payment_details: partner.payment_details || '',
                  }))}
                >
                  Использовать
                </button>
              </div>
            )}
            <div><Label>Сумма *</Label><Input type="number" placeholder="1000" value={payoutForm.amount} onChange={e => setPayoutForm(p => ({ ...p, amount: e.target.value }))} /></div>
            <div><Label>Способ выплаты *</Label><Input placeholder="СБП / Карта / Расчётный счёт" value={payoutForm.payment_method} onChange={e => setPayoutForm(p => ({ ...p, payment_method: e.target.value }))} /></div>
            <div><Label>Реквизиты *</Label><Input placeholder="Номер карты, телефон СБП или р/с" value={payoutForm.payment_details} onChange={e => setPayoutForm(p => ({ ...p, payment_details: e.target.value }))} /></div>
            <Button className="w-full" onClick={handleRequestPayout} disabled={submitting}>{submitting ? 'Отправка...' : 'Отправить запрос'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
