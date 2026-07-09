import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { usePartner } from './partner/usePartner';
import PartnerLanding from './partner/PartnerLanding';
import PartnerClientsTab from './partner/PartnerClientsTab';
import PartnerPayoutsTab from './partner/PartnerPayoutsTab';
import PartnerProfileTab from './partner/PartnerProfileTab';
import PartnerHelpTab from './partner/PartnerHelpTab';
import PartnerRulesTab from './partner/PartnerRulesTab';

const PARTNER_TITLE = 'Партнёрская программа iHUNT — зарабатывайте до 101 490 ₽ с клиента';
const PARTNER_DESC = 'Партнёрская программа для HR-специалистов, рекрутёров и кадровых агентств. Рекомендуйте iHUNT — получайте 50% с каждой оплаты подписки ваших клиентов.';
const PARTNER_IMAGE = 'https://i-hunt.ru/partner-og-image.jpg';
const PARTNER_URL = 'https://i-hunt.ru/partner';

function PartnerSeo() {
  return (
    <Helmet>
      <title>{PARTNER_TITLE}</title>
      <meta name="description" content={PARTNER_DESC} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={PARTNER_URL} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={PARTNER_TITLE} />
      <meta property="og:description" content={PARTNER_DESC} />
      <meta property="og:url" content={PARTNER_URL} />
      <meta property="og:image" content={PARTNER_IMAGE} />
      <meta property="og:image:width" content="1149" />
      <meta property="og:image:height" content="617" />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:site_name" content="iHUNT" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={PARTNER_TITLE} />
      <meta name="twitter:description" content={PARTNER_DESC} />
      <meta name="twitter:image" content={PARTNER_IMAGE} />
    </Helmet>
  );
}

export default function Partner() {
  const {
    partner, referrals, payouts, loading, referralLink,
    authStep, setAuthStep, messenger,
    deepLink, otp, setOtp, submitting,
    profileForm, setProfileForm,
    editProfile, setEditProfile, savingProfile,
    showAddReferral, setShowAddReferral,
    referralForm, setReferralForm,
    handleSendToMessenger, handleVerifyOtp, handleCompleteRegistration,
    handleAddReferral, handleSaveProfile,
    copyToClipboard, logout,
  } = usePartner();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!partner) {
    return (
      <>
        <PartnerSeo />
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
      </>
    );
  }

  const pendingCommission = referrals.filter(r => r.commission_amount > 0 && !r.commission_available).reduce((s, r) => s + r.commission_amount, 0);
  const availableCommission = referrals.filter(r => r.commission_amount > 0 && r.commission_available).reduce((s, r) => s + r.commission_amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <PartnerSeo />
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
          {[
            { label: 'Баланс', value: `${partner.balance.toLocaleString('ru')} ₽`, cls: 'text-primary' },
            { label: 'Всего заработано', value: `${partner.total_earned.toLocaleString('ru')} ₽`, cls: '' },
            { label: 'На удержании', value: `${pendingCommission.toLocaleString('ru')} ₽`, cls: 'text-orange-500' },
            { label: 'Клиентов', value: partner.clients_registered, cls: '' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
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
            <TabsTrigger value="rules" className="flex-1">
              <Icon name="FileText" size={14} className="mr-1" />Правила
            </TabsTrigger>
          </TabsList>

          <PartnerClientsTab referrals={referrals} />

          <PartnerPayoutsTab
            partner={partner}
            payouts={payouts}
            pendingCommission={pendingCommission}
            availableCommission={availableCommission}
            onRequestPayout={() => window.open('https://t.me/ihunt_support', '_blank')}
          />

          <PartnerProfileTab
            editProfile={editProfile}
            setEditProfile={setEditProfile}
            savingProfile={savingProfile}
            onSave={handleSaveProfile}
          />

          <PartnerHelpTab />

          <PartnerRulesTab />
        </Tabs>
      </div>

      {/* Диалог добавления клиента */}
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

    </div>
  );
}