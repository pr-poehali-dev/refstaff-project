import { useState, useEffect } from 'react';
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

export default function Partner() {
  const { toast } = useToast();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  // Формы
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '' });
  const [loginCode, setLoginCode] = useState('');
  const [referralForm, setReferralForm] = useState({ company_name: '', contact_name: '', contact_email: '', contact_phone: '' });
  const [payoutForm, setPayoutForm] = useState({ amount: '', payment_method: '', payment_details: '' });
  const [submitting, setSubmitting] = useState(false);

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
  }, []);

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
        localStorage.setItem('partner_code', data.partner_code);
        toast({ title: 'Регистрация успешна!', description: `Ваш код: ${data.partner_code}` });
        setShowRegister(false);
        loadPartnerData(data.partner_code);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async () => {
    const code = loginCode.trim().toUpperCase();
    if (!code) return;
    setSubmitting(true);
    try {
      const data = await apiCall('login', 'POST', { partner_code: code });
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        localStorage.setItem('partner_code', code);
        setShowLogin(false);
        loadPartnerData(code);
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

  const referralLink = partner ? `${APP_URL}/?ref=${partner.partner_code}` : '';
  const promoCode = partner?.partner_code || '';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} скопирован!` });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Гость — не авторизован
  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 rounded-full p-4">
              <Icon name="Handshake" size={40} className="text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Партнёрская программа</h1>
          <p className="text-muted-foreground mb-8">
            Приглашайте HR-директоров и компании в iHUNT — зарабатывайте вместе с нами
          </p>

          <div className="grid gap-3 mb-6">
            <div className="flex items-start gap-3 text-left p-3 rounded-lg bg-white border">
              <Icon name="Link" size={20} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Реферальная ссылка</p>
                <p className="text-xs text-muted-foreground">Поделитесь ссылкой — клиент регистрируется автоматически</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left p-3 rounded-lg bg-white border">
              <Icon name="Tag" size={20} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Промокод</p>
                <p className="text-xs text-muted-foreground">Клиент вводит ваш код при регистрации или добавьте его вручную</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left p-3 rounded-lg bg-white border">
              <Icon name="BarChart3" size={20} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Личный кабинет</p>
                <p className="text-xs text-muted-foreground">Следите за статусом клиентов и запрашивайте выплаты</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => setShowRegister(true)}>
              <Icon name="UserPlus" size={16} className="mr-2" />
              Стать партнёром
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowLogin(true)}>
              <Icon name="LogIn" size={16} className="mr-2" />
              Войти
            </Button>
          </div>
        </div>

        {/* Диалог регистрации */}
        <Dialog open={showRegister} onOpenChange={setShowRegister}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Регистрация партнёра</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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

        {/* Диалог входа */}
        <Dialog open={showLogin} onOpenChange={setShowLogin}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Вход в кабинет партнёра</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Код партнёра</Label>
                <Input placeholder="ANNA1234" value={loginCode} onChange={e => setLoginCode(e.target.value)} className="uppercase" />
                <p className="text-xs text-muted-foreground mt-1">Код был выдан при регистрации</p>
              </div>
              <Button className="w-full" onClick={handleLogin} disabled={submitting}>
                {submitting ? 'Вход...' : 'Войти'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ЛК партнёра
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
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
        {/* Приветствие и статистика */}
        <div>
          <h1 className="text-xl font-bold mb-1">Привет, {partner.name.split(' ')[0]}!</h1>
          <p className="text-sm text-muted-foreground">Ваш партнёрский код: <span className="font-mono font-semibold text-foreground">{partner.partner_code}</span></p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Баланс</p>
              <p className="text-xl font-bold text-primary">{partner.balance.toLocaleString('ru')} ₽</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Заработано всего</p>
              <p className="text-xl font-bold">{partner.total_earned.toLocaleString('ru')} ₽</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Приглашено</p>
              <p className="text-xl font-bold">{partner.clients_invited}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Зарегистрировались</p>
              <p className="text-xl font-bold">{partner.clients_registered}</p>
            </CardContent>
          </Card>
        </div>

        {/* Инструменты привлечения */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Инструменты привлечения клиентов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Реферальная ссылка */}
            <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Link" size={16} className="text-blue-600" />
                <span className="font-medium text-sm">Реферальная ссылка</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Отправьте эту ссылку клиенту — при регистрации он автоматически привяжется к вам</p>
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="text-xs font-mono bg-white" />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(referralLink, 'Ссылка')}>
                  <Icon name="Copy" size={14} />
                </Button>
              </div>
            </div>

            {/* Промокод */}
            <div className="p-3 rounded-lg border bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Tag" size={16} className="text-purple-600" />
                <span className="font-medium text-sm">Промокод</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Клиент вводит этот код при регистрации, или вы добавляете его вручную в список клиентов</p>
              <div className="flex gap-2 items-center">
                <div className="flex-1 bg-white border rounded-md px-3 py-2 font-mono font-bold text-lg tracking-widest text-center">
                  {promoCode}
                </div>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(promoCode, 'Промокод')}>
                  <Icon name="Copy" size={14} />
                </Button>
              </div>
            </div>

            <Button className="w-full" variant="outline" onClick={() => setShowAddReferral(true)}>
              <Icon name="UserPlus" size={16} className="mr-2" />
              Добавить клиента вручную
            </Button>
          </CardContent>
        </Card>

        {/* Табы: клиенты и выплаты */}
        <Tabs defaultValue="referrals">
          <TabsList className="w-full">
            <TabsTrigger value="referrals" className="flex-1">
              <Icon name="Users" size={14} className="mr-1" />
              Клиенты ({referrals.length})
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex-1">
              <Icon name="Wallet" size={14} className="mr-1" />
              Выплаты ({payouts.length})
            </TabsTrigger>
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
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs py-0">
                              {r.source === 'link' ? 'Ссылка' : 'Промокод'}
                            </Badge>
                          </div>
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
                    <Icon name="ArrowUpRight" size={14} className="mr-1" />
                    Запросить выплату
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
          <DialogHeader>
            <DialogTitle>Добавить клиента вручную</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Название компании *</Label>
              <Input placeholder="ООО Ромашка" value={referralForm.company_name} onChange={e => setReferralForm(p => ({ ...p, company_name: e.target.value }))} />
            </div>
            <div>
              <Label>Контактное лицо</Label>
              <Input placeholder="Иван Петров" value={referralForm.contact_name} onChange={e => setReferralForm(p => ({ ...p, contact_name: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="ivan@romashka.ru" value={referralForm.contact_email} onChange={e => setReferralForm(p => ({ ...p, contact_email: e.target.value }))} />
            </div>
            <div>
              <Label>Телефон</Label>
              <Input placeholder="+7 900 000 00 00" value={referralForm.contact_phone} onChange={e => setReferralForm(p => ({ ...p, contact_phone: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => handleAddReferral('promo')} disabled={submitting}>
                <Icon name="Tag" size={14} className="mr-1" />
                По промокоду
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => handleAddReferral('link')} disabled={submitting}>
                <Icon name="Link" size={14} className="mr-1" />
                По ссылке
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог запроса выплаты */}
      <Dialog open={showPayout} onOpenChange={setShowPayout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Запрос на выплату</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Доступно к выводу: <span className="font-bold text-foreground">{partner.balance.toLocaleString('ru')} ₽</span></p>
            <div>
              <Label>Сумма *</Label>
              <Input type="number" placeholder="1000" value={payoutForm.amount} onChange={e => setPayoutForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div>
              <Label>Способ выплаты *</Label>
              <Input placeholder="СБП / Карта / Расчётный счёт" value={payoutForm.payment_method} onChange={e => setPayoutForm(p => ({ ...p, payment_method: e.target.value }))} />
            </div>
            <div>
              <Label>Реквизиты *</Label>
              <Input placeholder="Номер карты, телефон СБП или р/с" value={payoutForm.payment_details} onChange={e => setPayoutForm(p => ({ ...p, payment_details: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleRequestPayout} disabled={submitting}>
              {submitting ? 'Отправка...' : 'Отправить запрос'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
