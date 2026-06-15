import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const PARTNER_URL = 'https://functions.poehali.dev/4c894112-f90d-46f8-8aeb-d2f35aeee15e';
const APP_URL = 'https://refstaff.ru';

interface Partner {
  id: number;
  name: string;
  email: string;
  phone: string;
  partner_code: string;
  balance: number;
  total_earned: number;
  clients_invited: number;
  clients_registered: number;
  status: string;
  created_at: string;
}

interface Referral {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  source: string;
  promo_code: string;
  created_at: string;
}

interface Payout {
  id: number;
  amount: number;
  payment_method: string;
  payment_details: string;
  status: string;
  admin_comment: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  invited: 'Приглашён',
  registered: 'Зарегистрировался',
  subscribed: 'Оплатил',
  churned: 'Ушёл',
};

const PAYOUT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'На рассмотрении', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Одобрено', color: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Выплачено', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Отклонено', color: 'bg-red-100 text-red-800' },
};

type AuthStep = 'choose' | 'enter_code' | 'messenger_wait' | 'enter_otp';
type Messenger = 'telegram' | 'max';

export default function Partner() {
  const { toast } = useToast();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth flow
  const [authStep, setAuthStep] = useState<AuthStep>('choose');
  const [messenger, setMessenger] = useState<Messenger>('telegram');
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Регистрация
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '' });

  // Кабинет
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [referralForm, setReferralForm] = useState({ company_name: '', contact_name: '', contact_email: '', contact_phone: '' });
  const [payoutForm, setPayoutForm] = useState({ amount: '', payment_method: '', payment_details: '' });

  const savedCode = localStorage.getItem('partner_code');

  const apiCall = async (action: string, method = 'GET', body?: object, token?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['X-Partner-Token'] = token;
    const res = await fetch(`${PARTNER_URL}?action=${action}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  };

  const loadPartnerData = async (code: string) => {
    setLoading(true);
    try {
      const [profileData, referralsData, payoutsData] = await Promise.all([
        apiCall('profile', 'GET', undefined, code),
        apiCall('referrals', 'GET', undefined, code),
        apiCall('payouts', 'GET', undefined, code),
      ]);
      if (profileData.error) {
        localStorage.removeItem('partner_code');
        setPartner(null);
      } else {
        setPartner(profileData);
        setReferrals(referralsData);
        setPayouts(payoutsData);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (savedCode) {
      loadPartnerData(savedCode);
    } else {
      setLoading(false);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Шаг 1 — ввод кода партнёра и выбор мессенджера
  const handleSendToMessenger = async () => {
    const code = partnerCodeInput.trim().toUpperCase();
    if (!code) { toast({ title: 'Введите ваш партнёрский код', variant: 'destructive' }); return; }
    setSubmitting(true);
    try {
      const data = await apiCall('create_login_session', 'POST', { partner_code: code, messenger });
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        setSessionToken(data.session_token);
        setDeepLink(data.deep_link);
        setAuthStep('messenger_wait');

        // Открываем мессенджер
        window.open(data.deep_link, '_blank');

        // Поллинг — ждём code_sent
        pollRef.current = setInterval(async () => {
          const s = await apiCall('check_login_session', 'POST', { session_token: data.session_token });
          if (s.status === 'code_sent') {
            clearInterval(pollRef.current!);
            setAuthStep('enter_otp');
          }
        }, 2000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Шаг 2 — ввод кода из мессенджера
  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setSubmitting(true);
    try {
      const data = await apiCall('verify_login_code', 'POST', { session_token: sessionToken, code: otp.trim() });
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        localStorage.setItem('partner_code', data.partner_code);
        setPartner(data);
        setAuthStep('choose');
        loadPartnerData(data.partner_code);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Регистрация
  const handleRegister = async () => {
    if (!registerForm.name || !registerForm.email) {
      toast({ title: 'Заполните имя и email', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiCall('register', 'POST', registerForm);
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Регистрация успешна!', description: `Ваш партнёрский код: ${data.partner_code}` });
        setShowRegister(false);
        setPartnerCodeInput(data.partner_code);
        setAuthStep('enter_code');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReferral = async (source: 'link' | 'promo') => {
    if (!referralForm.company_name) {
      toast({ title: 'Укажите название компании', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiCall('add_referral', 'POST', { ...referralForm, source }, savedCode!);
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Клиент добавлен!' });
        setShowAddReferral(false);
        setReferralForm({ company_name: '', contact_name: '', contact_email: '', contact_phone: '' });
        loadPartnerData(savedCode!);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPayout = async () => {
    setSubmitting(true);
    try {
      const data = await apiCall('request_payout', 'POST', {
        amount: parseFloat(payoutForm.amount),
        payment_method: payoutForm.payment_method,
        payment_details: payoutForm.payment_details,
      }, savedCode!);
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Запрос на выплату отправлен!' });
        setShowPayout(false);
        setPayoutForm({ amount: '', payment_method: '', payment_details: '' });
        loadPartnerData(savedCode!);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} скопирован!` });
  };

  const referralLink = partner ? `${APP_URL}/?ref=${partner.partner_code}` : '';
  const promoCode = partner?.partner_code || '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── СТРАНИЦА ВХОДА ──────────────────────────────────────────────────────────
  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Лого */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 rounded-full p-4">
                <Icon name="Handshake" size={40} className="text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1">Партнёрская программа</h1>
            <p className="text-sm text-muted-foreground">Приглашайте компании в iHUNT и зарабатывайте вместе с нами</p>
          </div>

          {/* Шаг: выбор способа */}
          {authStep === 'choose' && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm font-medium text-center">Войдите через мессенджер</p>

                {/* Выбор мессенджера */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setMessenger('telegram'); setAuthStep('enter_code'); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#229ED9] flex items-center justify-center">
                      <Icon name="Send" size={24} className="text-white" />
                    </div>
                    <span className="text-sm font-medium">Telegram</span>
                  </button>
                  <button
                    onClick={() => { setMessenger('max'); setAuthStep('enter_code'); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#0066CC] flex items-center justify-center">
                      <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <span className="text-sm font-medium">MAX</span>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs text-muted-foreground bg-white px-2 w-fit mx-auto">ещё не партнёр?</div>
                </div>

                <Button variant="outline" className="w-full" onClick={() => setShowRegister(true)}>
                  <Icon name="UserPlus" size={16} className="mr-2" />
                  Зарегистрироваться
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Шаг: ввод кода партнёра */}
          {authStep === 'enter_code' && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <button onClick={() => setAuthStep('choose')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <Icon name="ArrowLeft" size={14} />
                  Назад
                </button>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${messenger === 'telegram' ? 'bg-[#229ED9]' : 'bg-[#0066CC]'}`}>
                    {messenger === 'telegram'
                      ? <Icon name="Send" size={18} className="text-white" />
                      : <span className="text-white font-bold">M</span>}
                  </div>
                  <div>
                    <p className="font-medium text-sm">Вход через {messenger === 'telegram' ? 'Telegram' : 'MAX'}</p>
                    <p className="text-xs text-muted-foreground">Введите ваш партнёрский код</p>
                  </div>
                </div>
                <div>
                  <Label>Партнёрский код</Label>
                  <Input
                    placeholder="Например: ANNA1234"
                    value={partnerCodeInput}
                    onChange={e => setPartnerCodeInput(e.target.value.toUpperCase())}
                    className="font-mono text-center text-lg tracking-widest mt-1"
                    onKeyDown={e => e.key === 'Enter' && handleSendToMessenger()}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Код был выдан при регистрации</p>
                </div>
                <Button className="w-full" onClick={handleSendToMessenger} disabled={submitting}>
                  {submitting ? 'Отправка...' : `Открыть ${messenger === 'telegram' ? 'Telegram' : 'MAX'}`}
                  <Icon name="ExternalLink" size={14} className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Шаг: ожидание мессенджера */}
          {authStep === 'messenger_wait' && (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${messenger === 'telegram' ? 'bg-[#229ED9]' : 'bg-[#0066CC]'}`}>
                  {messenger === 'telegram'
                    ? <Icon name="Send" size={28} className="text-white" />
                    : <span className="text-white font-bold text-2xl">M</span>}
                </div>
                <div>
                  <p className="font-semibold">Откройте {messenger === 'telegram' ? 'Telegram' : 'MAX'}</p>
                  <p className="text-sm text-muted-foreground mt-1">Нажмите кнопку «Старт» в боте — вам придёт код подтверждения</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Ожидаю код...
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(deepLink, '_blank')}>
                    <Icon name="ExternalLink" size={14} className="mr-1" />
                    Открыть снова
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => setAuthStep('enter_otp')}>
                    Ввести код
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Шаг: ввод OTP */}
          {authStep === 'enter_otp' && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <p className="font-semibold">Введите код из {messenger === 'telegram' ? 'Telegram' : 'MAX'}</p>
                  <p className="text-sm text-muted-foreground mt-1">6-значный код был отправлен вам в мессенджер</p>
                </div>
                <Input
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl font-mono tracking-[0.5em]"
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                />
                <Button className="w-full" onClick={handleVerifyOtp} disabled={submitting || otp.length < 6}>
                  {submitting ? 'Проверка...' : 'Войти'}
                </Button>
                <button className="text-xs text-muted-foreground w-full text-center hover:text-foreground" onClick={() => setAuthStep('enter_code')}>
                  Отправить код повторно
                </button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Диалог регистрации */}
        <Dialog open={showRegister} onOpenChange={setShowRegister}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Стать партнёром iHUNT</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">После регистрации вы получите уникальный партнёрский код для входа</p>
              <div>
                <Label>Имя и фамилия *</Label>
                <Input placeholder="Иванова Анна" value={registerForm.name} onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" placeholder="anna@example.com" value={registerForm.email} onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label>Телефон</Label>
                <Input placeholder="+7 900 000 00 00" value={registerForm.phone} onChange={e => setRegisterForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleRegister} disabled={submitting}>
                {submitting ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

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
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">Код: <span className="font-mono font-semibold text-foreground">{partner.partner_code}</span></span>
            <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem('partner_code'); setPartner(null); }}>
              <Icon name="LogOut" size={16} className="mr-1" />
              Выйти
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Привет, {partner.name.split(' ')[0]}!</h1>
          <p className="text-sm text-muted-foreground">Ваш партнёрский код: <span className="font-mono font-semibold text-foreground">{partner.partner_code}</span></p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Баланс</p><p className="text-xl font-bold text-primary">{partner.balance.toLocaleString('ru')} ₽</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Заработано всего</p><p className="text-xl font-bold">{partner.total_earned.toLocaleString('ru')} ₽</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Приглашено</p><p className="text-xl font-bold">{partner.clients_invited}</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Зарегистрировались</p><p className="text-xl font-bold">{partner.clients_registered}</p></CardContent></Card>
        </div>

        {/* Инструменты */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Инструменты привлечения</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Link" size={16} className="text-blue-600" />
                <span className="font-medium text-sm">Реферальная ссылка</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Клиент переходит по ссылке и автоматически привязывается к вам</p>
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="text-xs font-mono bg-white" />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(referralLink, 'Ссылка')}><Icon name="Copy" size={14} /></Button>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Tag" size={16} className="text-purple-600" />
                <span className="font-medium text-sm">Промокод</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Клиент вводит код при регистрации или вы добавляете его вручную</p>
              <div className="flex gap-2 items-center">
                <div className="flex-1 bg-white border rounded-md px-3 py-2 font-mono font-bold text-lg tracking-widest text-center">{promoCode}</div>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(promoCode, 'Промокод')}><Icon name="Copy" size={14} /></Button>
              </div>
            </div>

            <Button className="w-full" variant="outline" onClick={() => setShowAddReferral(true)}>
              <Icon name="UserPlus" size={16} className="mr-2" />
              Добавить клиента вручную
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="referrals">
          <TabsList className="w-full">
            <TabsTrigger value="referrals" className="flex-1"><Icon name="Users" size={14} className="mr-1" />Клиенты ({referrals.length})</TabsTrigger>
            <TabsTrigger value="payouts" className="flex-1"><Icon name="Wallet" size={14} className="mr-1" />Выплаты ({payouts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="referrals" className="mt-3">
            <Card>
              <CardContent className="pt-4">
                {referrals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="Users" size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Клиентов пока нет</p>
                    <p className="text-xs">Поделитесь ссылкой или промокодом</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {referrals.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                        <div>
                          <p className="font-medium text-sm">{r.company_name}</p>
                          <p className="text-xs text-muted-foreground">{r.contact_name || r.contact_email || '—'}</p>
                          <Badge variant="outline" className="text-xs py-0 mt-1">{r.source === 'link' ? 'Ссылка' : 'Промокод'}</Badge>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${r.status === 'subscribed' ? 'bg-green-100 text-green-800' : r.status === 'registered' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                            {STATUS_LABELS[r.status] || r.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString('ru')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="mt-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-muted-foreground">Баланс: <span className="font-bold text-foreground">{partner.balance.toLocaleString('ru')} ₽</span></p>
                  <Button size="sm" onClick={() => setShowPayout(true)} disabled={partner.balance <= 0}>
                    <Icon name="ArrowUpRight" size={14} className="mr-1" />Запросить выплату
                  </Button>
                </div>
                {payouts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="Wallet" size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Выплат пока не было</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {payouts.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                        <div>
                          <p className="font-medium text-sm">{p.amount.toLocaleString('ru')} ₽</p>
                          <p className="text-xs text-muted-foreground">{p.payment_method} · {p.payment_details}</p>
                          {p.admin_comment && <p className="text-xs text-muted-foreground mt-1">{p.admin_comment}</p>}
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${PAYOUT_STATUS[p.status]?.color || ''}`}>
                            {PAYOUT_STATUS[p.status]?.label || p.status}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(p.created_at).toLocaleDateString('ru')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
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
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => handleAddReferral('promo')} disabled={submitting}><Icon name="Tag" size={14} className="mr-1" />По промокоду</Button>
              <Button className="flex-1" variant="outline" onClick={() => handleAddReferral('link')} disabled={submitting}><Icon name="Link" size={14} className="mr-1" />По ссылке</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог выплаты */}
      <Dialog open={showPayout} onOpenChange={setShowPayout}>
        <DialogContent>
          <DialogHeader><DialogTitle>Запрос на выплату</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Доступно: <span className="font-bold text-foreground">{partner.balance.toLocaleString('ru')} ₽</span></p>
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
