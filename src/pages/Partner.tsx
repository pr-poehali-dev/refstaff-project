import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const PARTNER_URL = 'https://functions.poehali.dev/4c894112-f90d-46f8-8aeb-d2f35aeee15e';
const APP_URL = 'https://i-hunt.ru';

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
  payment_method?: string;
  payment_details?: string;
  inn?: string;
  company_name?: string;
  notes?: string;
}

interface Referral {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  source: string;
  created_at: string;
  commission_amount: number;
  commission_available_at: string | null;
  commission_available: boolean;
  hold_days_left: number | null;
  subscription_tier: string | null;
  subscription_expires_at: string | null;
  paid_months_count: number;
  total_commission_earned: number;
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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  invited:    { label: 'Приглашён',        color: 'bg-gray-100 text-gray-700' },
  registered: { label: 'Зарегистрирован',  color: 'bg-blue-100 text-blue-800' },
  subscribed: { label: 'Оплатил',          color: 'bg-green-100 text-green-800' },
  churned:    { label: 'Ушёл',             color: 'bg-red-100 text-red-800' },
};

const TIER_LABELS: Record<string, string> = {
  trial:    'Пробный',
  advanced: '1 месяц',
  pro:      '1 год',
  basic:    'Базовый',
};

const PAYOUT_STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'На рассмотрении', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Одобрено',        color: 'bg-blue-100 text-blue-800' },
  paid:     { label: 'Выплачено',       color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Отклонено',       color: 'bg-red-100 text-red-800' },
};

type AuthStep = 'choose' | 'messenger_wait' | 'enter_otp' | 'fill_profile';
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
  const [sessionToken, setSessionToken] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingChatId, setPendingChatId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Форма регистрации (новый партнёр)
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });

  // Форма редактирования профиля
  const [editProfile, setEditProfile] = useState({
    name: '', email: '', phone: '',
    payment_method: '', payment_details: '',
    inn: '', company_name: '', notes: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Кабинет
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [referralForm, setReferralForm] = useState({ company_name: '', contact_name: '', contact_email: '', contact_phone: '' });
  const [payoutForm, setPayoutForm] = useState({ amount: '', payment_method: '', payment_details: '' });

  const savedCode = localStorage.getItem('partner_code');

  const apiCall = async (action: string, method = 'GET', body?: object, token?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // Токен передаём в теле или query, не в заголовке — кириллица в заголовках ломает fetch
    const url = token
      ? `${PARTNER_URL}?action=${action}&pt=${encodeURIComponent(token)}`
      : `${PARTNER_URL}?action=${action}`;
    const res = await fetch(url, {
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
        setEditProfile({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          payment_method: profileData.payment_method || '',
          payment_details: profileData.payment_details || '',
          inn: profileData.inn || '',
          company_name: profileData.company_name || '',
          notes: profileData.notes || '',
        });
        setReferrals(Array.isArray(referralsData) ? referralsData : []);
        setPayouts(Array.isArray(payoutsData) ? payoutsData : []);
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
      // Восстанавливаем сессию входа если вернулись из бота
      const savedSession = localStorage.getItem('partner_session_token');
      const savedMessenger = localStorage.getItem('partner_session_messenger') as Messenger | null;
      if (savedSession) {
        setSessionToken(savedSession);
        if (savedMessenger) setMessenger(savedMessenger);
        // Проверяем статус сессии
        apiCall('check_login_session', 'POST', { session_token: savedSession }).then(s => {
          if (s.status === 'code_sent' || s.status === 'verified') {
            setAuthStep('enter_otp');
          }
        });
      }
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleSendToMessenger = async (selectedMessenger: Messenger) => {
    setMessenger(selectedMessenger);
    setSubmitting(true);
    try {
      const data = await apiCall('create_login_session', 'POST', { messenger: selectedMessenger });
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        // Сохраняем в localStorage — не потеряется при возврате из бота
        localStorage.setItem('partner_session_token', data.session_token);
        localStorage.setItem('partner_session_messenger', selectedMessenger);
        setSessionToken(data.session_token);
        setOtp('');
        setDeepLink(data.deep_link);
        setAuthStep('messenger_wait');
        window.open(data.deep_link, '_blank');
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

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    // Берём токен из state, fallback — из localStorage
    const token = sessionToken || localStorage.getItem('partner_session_token') || '';
    if (!token) {
      toast({ title: 'Сессия не найдена, начните вход заново', variant: 'destructive' });
      setAuthStep('choose');
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiCall('verify_login_code', 'POST', { session_token: token, code: otp.trim() });
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else if (data.need_registration) {
        setPendingChatId(data.chat_id);
        setAuthStep('fill_profile');
      } else if (data.partner_code) {
        localStorage.setItem('partner_code', data.partner_code);
        localStorage.removeItem('partner_session_token');
        localStorage.removeItem('partner_session_messenger');
        await loadPartnerData(data.partner_code);
        setAuthStep('choose');
      } else {
        toast({ title: 'Ошибка входа, попробуйте снова', variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!profileForm.name) {
      toast({ title: 'Укажите ваше имя', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiCall('complete_registration', 'POST', {
        session_token: sessionToken,
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        messenger,
        chat_id: pendingChatId,
      });
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else if (data.partner_code) {
        localStorage.setItem('partner_code', data.partner_code);
        await loadPartnerData(data.partner_code);
        setAuthStep('choose');
        toast({ title: 'Добро пожаловать в партнёрскую программу!' });
      } else {
        toast({ title: 'Что-то пошло не так, попробуйте снова', variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReferral = async () => {
    if (!referralForm.company_name) {
      toast({ title: 'Укажите название компании', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiCall('add_referral', 'POST', { ...referralForm, source: 'link' }, savedCode!);
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
    const amount = parseFloat(payoutForm.amount);
    if (!amount || amount <= 0) {
      toast({ title: 'Укажите корректную сумму', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiCall('request_payout', 'POST', {
        amount,
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

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const data = await apiCall('update_profile', 'POST', editProfile, savedCode!);
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Профиль сохранён!' });
        loadPartnerData(savedCode!);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} скопирован!` });
  };

  const referralLink = partner ? `${APP_URL}/?ref=${partner.partner_code}` : '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── ЛЕНДИНГ + ФОРМА ВХОДА ───────────────────────────────────────────────────
  if (!partner) {
    const scrollToLogin = () => document.getElementById('partner-login')?.scrollIntoView({ behavior: 'smooth' });
    return (
      <div className="min-h-screen bg-white">
        <Helmet>
          <title>Партнёрская программа iHUNT — зарабатывайте на HR-технологиях</title>
          <meta name="description" content="Партнёрская программа для HR-менеджеров, рекрутёров и кадровых агентств. Рекомендуйте iHUNT компаниям и получайте 50% с каждой оплаты подписки. До 101 490 ₽ с одного клиента." />
          <meta name="keywords" content="партнёрская программа HR, реферальная программа для рекрутёров, заработок для HR-менеджеров, партнёрство iHUNT, кадровое агентство партнёр" />
          <meta property="og:title" content="Партнёрская программа iHUNT — 50% с каждой подписки клиента" />
          <meta property="og:description" content="Зарабатывайте до 101 490 ₽ с одного клиента. Программа для HR-специалистов, рекрутёров и кадровых агентств." />
          <meta property="og:type" content="website" />
          <link rel="canonical" href="https://i-hunt.ru/partner" />
        </Helmet>

        {/* ── HERO ── */}
        <section className="relative bg-gradient-to-br from-primary/5 via-white to-secondary/5 pt-16 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
          </div>
          <div className="max-w-5xl mx-auto relative">
            <div className="flex items-center gap-2 mb-6 justify-center">
              <Icon name="Rocket" size={18} className="text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">iHUNT Partner Program</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-6 leading-tight text-gray-900">
              Зарабатывайте до <span className="text-primary">101 490 ₽</span><br className="hidden sm:block" /> с одного клиента
            </h1>
            <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-10">
              Партнёрская программа для HR-специалистов, рекрутёров и кадровых агентств. Рекомендуйте <a href="https://i-hunt.ru/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">iHUNT</a> — получайте <strong>50% с каждой оплаты</strong> подписки ваших клиентов.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-base px-8" onClick={scrollToLogin}>
                <Icon name="Handshake" size={18} className="mr-2" />
                Стать партнёром — бесплатно
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                Узнать подробнее
              </Button>
            </div>
            {/* Статистика */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
              {[
                { value: '50%', label: 'комиссия с каждой оплаты' },
                { value: '3', label: 'платежа с одного клиента' },
                { value: '30 дн', label: 'hold-период, затем — вывод' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-extrabold text-primary">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ДЛЯ КОГО ── */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 text-gray-900">Кто становится партнёром iHUNT</h2>
            <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">Программа создана для профессионалов рынка труда, которые работают с компаниями-работодателями</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: 'Users', title: 'HR-менеджеры', desc: 'Специалисты по подбору персонала внутри компаний' },
                { icon: 'Search', title: 'Рекрутёры', desc: 'Независимые и агентские рекрутёры' },
                { icon: 'Building2', title: 'Кадровые агентства', desc: 'Агентства по подбору и аутстаффингу' },
                { icon: 'GraduationCap', title: 'HR-консультанты', desc: 'Консультанты по управлению персоналом' },
                { icon: 'Briefcase', title: 'Карьерные коучи', desc: 'Специалисты по развитию карьеры' },
                { icon: 'Network', title: 'Бизнес-партнёры', desc: 'Все, кто работает с B2B-аудиторией' },
              ].map(c => (
                <div key={c.title} className="bg-white rounded-xl p-5 border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Icon name={c.icon} size={20} className="text-primary" />
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">{c.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── КАК ЭТО РАБОТАЕТ ── */}
        <section id="how-it-works" className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 text-gray-900">Как работает программа</h2>
            <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">Четыре шага от регистрации до первых денег на счёте</p>
            <div className="relative">
              <div className="hidden sm:block absolute left-[39px] top-8 bottom-8 w-0.5 bg-gray-100" />
              <div className="space-y-8">
                {[
                  { n: '1', icon: 'Link', title: 'Получите реферальную ссылку', desc: 'После регистрации в личном кабинете вы получаете уникальную ссылку. Делитесь ею с компаниями, которым нужен эффективный инструмент для найма через рекомендации сотрудников.' },
                  { n: '2', icon: 'UserCheck', title: 'Клиент регистрируется в iHUNT', desc: 'Компания регистрируется по вашей ссылке и автоматически привязывается к вашему аккаунту навсегда. Клиент получает 14 дней бесплатного доступа.' },
                  { n: '3', icon: 'CreditCard', title: 'Клиент оплачивает подписку', desc: 'Как только компания оплачивает подписку — вам начисляется 50% от суммы. Месячная подписка: 9 950 ₽, годовая: 101 490 ₽. Начисление происходит автоматически.' },
                  { n: '4', icon: 'Wallet', title: 'Выводите деньги', desc: 'После 30-дневного hold-периода средства доступны для вывода на карту, СБП или расчётный счёт ИП/ООО. Минимальной суммы нет.' },
                ].map(s => (
                  <div key={s.n} className="flex gap-5">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-primary text-white flex flex-col items-center justify-center shadow-md">
                        <Icon name={s.icon} size={24} />
                        <span className="text-xs font-bold mt-1">Шаг {s.n}</span>
                      </div>
                    </div>
                    <div className="pt-3">
                      <div className="font-bold text-gray-900 mb-1">{s.title}</div>
                      <div className="text-sm text-gray-500 leading-relaxed">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── СКОЛЬКО МОЖНО ЗАРАБОТАТЬ ── */}
        <section className="py-16 px-4 bg-primary text-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Сколько можно заработать</h2>
            <p className="text-center text-primary-foreground/80 mb-12 max-w-xl mx-auto">Ваш доход зависит от количества привлечённых клиентов и типа их подписки</p>
            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              <div className="bg-white/10 rounded-2xl p-6">
                <div className="text-sm font-semibold text-primary-foreground/70 mb-1 uppercase tracking-wide">Месячная подписка</div>
                <div className="text-4xl font-extrabold mb-2">9 950 ₽</div>
                <div className="text-sm text-primary-foreground/80">за каждый из первых 3 платежей клиента</div>
                <div className="mt-4 pt-4 border-t border-white/20 text-sm">
                  Итого с 1 клиента: <strong className="text-white">29 850 ₽</strong>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-6 ring-2 ring-white/40">
                <div className="text-sm font-semibold text-primary-foreground/70 mb-1 uppercase tracking-wide">Годовая подписка</div>
                <div className="text-4xl font-extrabold mb-2">101 490 ₽</div>
                <div className="text-sm text-primary-foreground/80">разово при оплате клиентом года</div>
                <div className="mt-4 pt-4 border-t border-white/20 text-sm">
                  Лимит исчерпан после <strong className="text-white">1 платежа</strong>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-5">
              <div className="font-semibold mb-3 text-center">Пример дохода за месяц</div>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                {[
                  { clients: '5 клиентов', type: 'месячные', earn: '49 750 ₽' },
                  { clients: '10 клиентов', type: 'месячные', earn: '99 500 ₽' },
                  { clients: '5 клиентов', type: 'годовые', earn: '507 450 ₽' },
                ].map(e => (
                  <div key={e.clients} className="bg-white/10 rounded-xl p-3">
                    <div className="font-bold text-lg">{e.earn}</div>
                    <div className="text-primary-foreground/70 text-xs mt-1">{e.clients}<br />{e.type}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── ПРЕИМУЩЕСТВА ── */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-gray-900">Почему выбирают iHUNT Partner</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { icon: 'Zap', title: 'Быстрый старт', desc: 'Регистрация за 2 минуты через Telegram. Никаких договоров и бумажной волокиты.' },
                { icon: 'TrendingUp', title: 'Пассивный доход', desc: 'Привлекли клиента один раз — получаете комиссию с трёх платежей автоматически.' },
                { icon: 'ShieldCheck', title: 'Прозрачная система', desc: 'Личный кабинет в реальном времени: каждый клиент, каждая выплата, каждый рубль.' },
                { icon: 'Award', title: 'Востребованный продукт', desc: 'iHUNT — платформа реферального найма, которая реально экономит компаниям деньги на рекрутинге.' },
                { icon: 'HeadphonesIcon', title: 'Поддержка партнёров', desc: 'Персональный менеджер, обучающие материалы и шаблоны для продвижения продукта.' },
                { icon: 'Globe', title: 'Без территориальных ограничений', desc: 'Работайте с компаниями по всей России. Нет ограничений по географии или отрасли.' },
              ].map(b => (
                <div key={b.title} className="flex gap-4 bg-white p-5 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon name={b.icon} size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">{b.title}</div>
                    <div className="text-sm text-gray-500">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── О ПРОДУКТЕ iHUNT ── */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
                <Icon name="Rocket" size={16} className="text-primary" />
                <span className="text-sm font-semibold text-primary">Что такое iHUNT</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Платформа реферального найма <a href="https://i-hunt.ru/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">iHUNT</a>
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                iHUNT помогает компаниям нанимать сотрудников через рекомендации — это быстрее, дешевле и эффективнее традиционного рекрутинга
              </p>
            </div>

            {/* Как работает продукт */}
            <div className="grid sm:grid-cols-3 gap-5 mb-12">
              {[
                { icon: 'Users', title: 'Сотрудники рекомендуют', desc: 'Компания подключает своих сотрудников как агентов по найму. Те рекомендуют знакомых на открытые вакансии.' },
                { icon: 'UserCheck', title: 'Кандидаты приходят сами', desc: 'Рекомендованные кандидаты уже «тёплые» — их привели люди, которые знают и компанию, и соискателя.' },
                { icon: 'Coins', title: 'Сотрудники получают бонусы', desc: 'За успешный наём рекомендатель получает денежное вознаграждение прямо в приложении.' },
              ].map(f => (
                <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon name={f.icon} size={24} className="text-primary" />
                  </div>
                  <div className="font-bold text-gray-900 mb-2">{f.title}</div>
                  <div className="text-sm text-gray-500">{f.desc}</div>
                </div>
              ))}
            </div>

            {/* Ключевые возможности — карточки */}
            <div className="grid sm:grid-cols-2 gap-5 mb-8">
              {[
                {
                  icon: 'Share2',
                  title: 'Реферальный найм',
                  desc: 'Сотрудники получают персональные реферальные ссылки на каждую вакансию и делятся ими с кандидатами. Рекомендованные люди уже знают о компании — конверсия в найм выше на 35%.',
                  badge: 'Главная фича',
                },
                {
                  icon: 'Trophy',
                  title: 'Геймификация команды',
                  desc: 'Рейтинги, бейджи и достижения превращают рекрутинг в соревнование. Ежемесячный рейтинг «Лучший рекрутёр» повышает активность сотрудников на 60%.',
                  badge: null,
                },
                {
                  icon: 'Wallet',
                  title: 'Автоматические выплаты',
                  desc: 'Встроенный кошелёк для бонусов: HR настраивает размер вознаграждения, а система автоматически начисляет его сотруднику после выхода кандидата на работу.',
                  badge: null,
                },
                {
                  icon: 'BrainCircuit',
                  title: 'AI-тесты для кандидатов',
                  desc: 'ИИ генерирует профессиональный тест по описанию вакансии за 15 секунд. Кандидат проходит тест без регистрации, HR получает результаты на почту сразу после прохождения.',
                  badge: null,
                },
                {
                  icon: 'BarChart3',
                  title: 'Аналитика в реальном времени',
                  desc: 'Полная воронка найма: кто рекомендовал → на каком этапе кандидат → когда выплатить бонус. Отчёт за квартал — в один клик.',
                  badge: null,
                },
                {
                  icon: 'MessageSquare',
                  title: 'Встроенный чат',
                  desc: 'HR общается с сотрудниками напрямую внутри платформы. Уведомления о статусе кандидатов приходят в Telegram — ничего не теряется.',
                  badge: null,
                },
              ].map(f => (
                <div key={f.title} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icon name={f.icon} size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">{f.title}</span>
                        {f.badge && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">{f.badge}</span>}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Результаты клиентов */}
            <div className="bg-primary/5 rounded-2xl p-6 mb-8">
              <div className="font-bold text-gray-900 text-center mb-5">Результаты компаний на iHUNT</div>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { value: '+127%', label: 'рост числа рекомендаций' },
                  { value: '-40%', label: 'сокращение времени найма' },
                  { value: '92%', label: 'кандидатов проходят испытательный срок' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-2xl font-extrabold text-primary">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Тарифы */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Пробный период</div>
                <div className="text-3xl font-extrabold text-gray-900 mb-1">0 ₽</div>
                <div className="text-sm text-gray-500 mb-4">14 дней — все функции бесплатно</div>
                <div className="space-y-1.5 text-xs text-gray-500">
                  {['Все функции платформы', 'Без ограничений по сотрудникам', 'Поддержка 24/7'].map(t => (
                    <div key={t} className="flex items-center gap-2"><Icon name="Check" size={14} className="text-green-500 shrink-0" />{t}</div>
                  ))}
                </div>
              </div>
              <div className="bg-primary rounded-xl p-5 text-white">
                <div className="text-xs font-semibold text-primary-foreground/70 uppercase tracking-wide mb-2">Продвинутый</div>
                <div className="text-3xl font-extrabold mb-1">19 900 ₽<span className="text-base font-normal">/мес</span></div>
                <div className="text-sm text-primary-foreground/80 mb-4">или 16 915 ₽/мес при оплате года</div>
                <div className="space-y-1.5 text-xs text-primary-foreground/90">
                  {['Вакансии без ограничений', 'AI-тесты для кандидатов', 'Геймификация и рейтинги', 'Аналитика и отчёты', 'Встроенный чат'].map(t => (
                    <div key={t} className="flex items-center gap-2"><Icon name="Check" size={14} className="text-white shrink-0" />{t}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <a href="https://i-hunt.ru/" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg">
                  <Icon name="ExternalLink" size={16} className="mr-2" />
                  Узнать больше об iHUNT
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-gray-900">Частые вопросы</h2>
            <div className="space-y-4">
              {[
                { q: 'Сколько стоит участие в программе?', a: 'Участие абсолютно бесплатное. Вы регистрируетесь, получаете ссылку и начинаете зарабатывать без каких-либо взносов.' },
                { q: 'Как подтвердить, что клиент мой?', a: 'Клиент должен зарегистрироваться в iHUNT по вашей реферальной ссылке. После этого он автоматически и навсегда привязывается к вашему аккаунту.' },
                { q: 'Когда деньги поступят на счёт?', a: 'После каждого платежа клиента начисляется комиссия. Через 30 дней (hold-период) средства становятся доступны для вывода.' },
                { q: 'Есть ли лимит на количество клиентов?', a: 'Нет. Вы можете привлекать неограниченное количество клиентов. Лимит только на количество платежей с одного клиента — первые 3 ежемесячных или 1 годовой.' },
                { q: 'Как выводить деньги?', a: 'Через личный кабинет. Доступные способы: СБП, банковская карта, расчётный счёт ИП или ООО. Перевод в течение 2 рабочих дней.' },
                { q: 'Нужно ли оформлять ИП или самозанятость?', a: 'Для получения выплат вам понадобится статус самозанятого или ИП. Это стандартное требование при работе с юридическими лицами.' },
              ].map((f, i) => (
                <details key={i} className="group bg-gray-50 rounded-xl border border-gray-100">
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-gray-900 list-none">
                    {f.q}
                    <Icon name="ChevronDown" size={18} className="text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-2" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── ФОРМА ВХОДА / РЕГИСТРАЦИИ ── */}
        <section id="partner-login" className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Handshake" size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Войти в партнёрский кабинет</h2>
              <p className="text-sm text-gray-500">Вход и регистрация — через мессенджер, без паролей</p>
            </div>

            {authStep === 'choose' && (
              <Card className="shadow-lg">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm font-medium text-center text-gray-700">Выберите мессенджер для входа</p>
                  <p className="text-xs text-center text-gray-400">Нажмите — бот пришлёт код подтверждения</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleSendToMessenger('telegram')}
                      disabled={submitting}
                      className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-transparent hover:border-[#229ED9] hover:bg-blue-50 transition-all disabled:opacity-50"
                    >
                      <div className="w-14 h-14 rounded-full bg-[#229ED9] flex items-center justify-center">
                        <Icon name="Send" size={26} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold">Telegram</span>
                    </button>
                    <button
                      onClick={() => handleSendToMessenger('max')}
                      disabled={submitting}
                      className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-transparent hover:border-[#0066CC] hover:bg-blue-50 transition-all disabled:opacity-50"
                    >
                      <div className="w-14 h-14 rounded-full bg-[#0066CC] flex items-center justify-center">
                        <span className="text-white font-bold text-xl">M</span>
                      </div>
                      <span className="text-sm font-semibold">MAX</span>
                    </button>
                  </div>
                  <p className="text-xs text-center text-gray-400">Впервые? Бот создаст аккаунт автоматически</p>
                </CardContent>
              </Card>
            )}

            {authStep === 'messenger_wait' && (
              <Card className="shadow-lg">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${messenger === 'telegram' ? 'bg-[#229ED9]' : 'bg-[#0066CC]'}`}>
                    {messenger === 'telegram'
                      ? <Icon name="Send" size={28} className="text-white" />
                      : <span className="text-white font-bold text-2xl">M</span>}
                  </div>
                  <div>
                    <p className="font-semibold">Откройте {messenger === 'telegram' ? 'Telegram' : 'MAX'}</p>
                    <p className="text-sm text-gray-500 mt-1">Нажмите «Старт» в боте — вам придёт код подтверждения</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Ожидаю код...
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(deepLink, '_blank')}>
                      <Icon name="ExternalLink" size={14} className="mr-1" />Открыть снова
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => setAuthStep('enter_otp')}>
                      Ввести код
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {authStep === 'enter_otp' && (
              <Card className="shadow-lg">
                <CardContent className="pt-6 space-y-4">
                  <div className="text-center">
                    <p className="font-semibold">Введите код из {messenger === 'telegram' ? 'Telegram' : 'MAX'}</p>
                    <p className="text-sm text-gray-500 mt-1">6-значный код был отправлен в мессенджер</p>
                  </div>
                  <Input
                    placeholder="000000"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl font-mono tracking-[0.5em]"
                    maxLength={6}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                  />
                  <Button className="w-full" onClick={handleVerifyOtp} disabled={submitting || otp.length < 6}>
                    {submitting ? 'Проверка...' : 'Продолжить'}
                  </Button>
                  <button className="text-xs text-gray-400 w-full text-center hover:text-gray-700" onClick={() => { setOtp(''); setAuthStep('choose'); }}>
                    ← Попробовать снова
                  </button>
                </CardContent>
              </Card>
            )}

            {authStep === 'fill_profile' && (
              <Card className="shadow-lg">
                <CardContent className="pt-6 space-y-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon name="CheckCircle" size={24} className="text-green-600" />
                    </div>
                    <p className="font-semibold">Почти готово!</p>
                    <p className="text-sm text-gray-500 mt-1">Заполните данные для партнёрского аккаунта</p>
                  </div>
                  <div>
                    <Label>Имя и фамилия *</Label>
                    <Input placeholder="Иванова Анна" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} autoFocus />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="anna@example.com" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Телефон</Label>
                    <Input placeholder="+7 900 000 00 00" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <Button className="w-full" onClick={handleCompleteRegistration} disabled={submitting || !profileForm.name}>
                    {submitting ? 'Создаём аккаунт...' : 'Начать работу'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* ── ФУТЕР ── */}
        <footer className="py-8 px-4 border-t bg-white text-center text-sm text-gray-400">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="Rocket" size={16} className="text-primary" />
            <span className="font-bold text-gray-700">iHUNT</span>
          </div>
          <p>Платформа реферального найма для бизнеса · Партнёрская программа</p>
          <p className="mt-1">© {new Date().getFullYear()} iHUNT. Все права защищены.</p>
        </footer>
      </div>
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
          <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem('partner_code'); setPartner(null); }}>
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

                        {/* Подписка */}
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

                        {/* Комиссия */}
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

                        {/* Прогресс лимита выплат */}
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

            {/* Как работает программа */}
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
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">{s.step}</div>
                    <div>
                      <p className="font-medium text-sm">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Советы по привлечению */}
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

            {/* FAQ */}
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

            {/* Контакт */}
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