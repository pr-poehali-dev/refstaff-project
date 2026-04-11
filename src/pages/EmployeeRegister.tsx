import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Turnstile } from '@marsidev/react-turnstile';

const AUTH_URL = 'https://functions.poehali.dev/acbe95f3-fa47-4ba2-bd00-aba68c67fafa';
const TG_AUTH_URL = 'https://functions.poehali.dev/5c021f8a-5408-4339-bc3e-1fc4dd0b72f5';
const COMPANY_URL = 'https://functions.poehali.dev/f1f66940-161e-4221-a729-4e0e555af034';

type Step = 'method' | 'email-form' | 'email-sent' | 'tg-form' | 'tg-wait' | 'tg-code';
type Method = 'email' | 'telegram';

function EmployeeRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteToken = searchParams.get('token') || '';

  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<Method>('email');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  // Email-флоу
  const [emailForm, setEmailForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: ''
  });

  // Telegram-флоу
  const [tgForm, setTgForm] = useState({ firstName: '', lastName: '' });
  const [sessionToken, setSessionToken] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [tgCode, setTgCode] = useState('');
  const [tgStatus, setTgStatus] = useState<'pending' | 'code_sent' | 'completed'>('pending');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!inviteToken) { alert('Неверная ссылка для регистрации'); navigate('/'); return; }
    fetch(`${COMPANY_URL}?invite_token=${inviteToken}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setCompanyName(d.company.name))
      .catch(() => { alert('Компания не найдена или ссылка недействительна'); navigate('/'); })
      .finally(() => setIsLoading(false));
  }, [inviteToken, navigate]);

  // Мета-теги
  useEffect(() => {
    document.title = 'Получай вознаграждение за рекомендацию наших вакансий | iHUNT';
    const img = 'https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/bucket/1a4f08a4-f047-444f-aab6-82e0357b0c94.jpg';
    const setMeta = (attr: string, key: string, val: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', val);
    };
    setMeta('property', 'og:image', img);
    setMeta('property', 'og:url', window.location.href);
  }, [inviteToken]);

  // Поллинг статуса сессии
  useEffect(() => {
    if (step !== 'tg-wait' || !sessionToken) return;
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(TG_AUTH_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check_session', session_token: sessionToken })
        });
        const d = await r.json();
        if (r.status === 410) { clearInterval(pollRef.current!); setError('Сессия истекла. Попробуйте ещё раз.'); setStep('tg-form'); return; }
        if (d.status === 'code_sent') { clearInterval(pollRef.current!); setTgStatus('code_sent'); setStep('tg-code'); }
      } catch { /* тихо игнорируем */ }
    }, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, sessionToken]);

  // ── Email: отправка формы ──────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailForm.firstName || !emailForm.lastName || !emailForm.email || !emailForm.password)
      return setError('Заполните все обязательные поля');
    if (!turnstileToken) return setError('Пожалуйста, подтвердите, что вы не робот');
    if (emailForm.password.length < 8) return setError('Пароль должен быть минимум 8 символов');
    if (emailForm.password !== emailForm.confirmPassword) return setError('Пароли не совпадают');
    setIsSubmitting(true);
    try {
      const r = await fetch(AUTH_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_employee_by_token',
          email: emailForm.email, password: emailForm.password,
          first_name: emailForm.firstName, last_name: emailForm.lastName,
          invite_token: inviteToken, turnstile_token: turnstileToken
        })
      });
      const d = await r.json();
      if (r.ok) setStep('email-sent');
      else setError(d.error || 'Ошибка регистрации');
    } catch { setError('Не удалось зарегистрироваться'); }
    finally { setIsSubmitting(false); }
  };

  // ── Telegram: создать сессию и открыть бота ────────────────────────────────
  const handleTgStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!tgForm.firstName || !tgForm.lastName) return setError('Введите имя и фамилию');
    setIsSubmitting(true);
    try {
      const r = await fetch(TG_AUTH_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_session',
          first_name: tgForm.firstName, last_name: tgForm.lastName,
          invite_token: inviteToken
        })
      });
      const d = await r.json();
      if (r.ok) {
        setSessionToken(d.session_token);
        setDeepLink(d.deep_link);
        setStep('tg-wait');
        window.open(d.deep_link, '_blank');
      } else {
        setError(d.error || 'Ошибка создания сессии');
      }
    } catch { setError('Не удалось подключиться'); }
    finally { setIsSubmitting(false); }
  };

  // ── Telegram: подтвердить код ──────────────────────────────────────────────
  const handleTgVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (tgCode.length !== 6) return setError('Введите 6-значный код из Telegram');
    setIsSubmitting(true);
    try {
      const r = await fetch(TG_AUTH_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_code', session_token: sessionToken, code: tgCode })
      });
      const d = await r.json();
      if (r.ok) {
        localStorage.setItem('authToken', d.token);
        localStorage.setItem('userRole', 'employee');
        navigate('/employee');
      } else {
        setError(d.error || 'Неверный код');
      }
    } catch { setError('Ошибка подтверждения'); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
      <div className="text-center">
        <Icon name="Loader2" className="animate-spin mx-auto mb-4" size={48} />
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Icon name="Rocket" className="text-primary" size={32} />
            <span className="text-2xl font-bold">iHUNT</span>
          </div>
          <CardTitle className="text-2xl">Регистрация сотрудника</CardTitle>
          <CardDescription>
            Вы регистрируетесь как сотрудник компании <strong>{companyName}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
              <Icon name="AlertCircle" size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Шаг 1: выбор способа ── */}
          {step === 'method' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center mb-4">Выберите способ регистрации</p>
              <button
                className="w-full h-16 flex items-center gap-4 px-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                onClick={() => { setMethod('telegram'); setStep('tg-form'); setError(''); }}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Icon name="Send" size={20} className="text-blue-500" />
                </div>
                <div>
                  <div className="font-semibold">Через Telegram</div>
                  <div className="text-xs text-muted-foreground">Нажмите кнопку — бот пришлёт код</div>
                </div>
                <Icon name="ChevronRight" size={18} className="ml-auto text-muted-foreground" />
              </button>
              <button
                className="w-full h-16 flex items-center gap-4 px-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                onClick={() => { setMethod('email'); setStep('email-form'); setError(''); }}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Icon name="Mail" size={20} className="text-gray-500" />
                </div>
                <div>
                  <div className="font-semibold">Через Email</div>
                  <div className="text-xs text-muted-foreground">Ссылка подтверждения на почту</div>
                </div>
                <Icon name="ChevronRight" size={18} className="ml-auto text-muted-foreground" />
              </button>
            </div>
          )}

          {/* ── Шаг 2: форма Telegram ── */}
          {step === 'tg-form' && (
            <form onSubmit={handleTgStart} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Имя *</Label>
                  <Input value={tgForm.firstName}
                    onChange={e => setTgForm({ ...tgForm, firstName: e.target.value })}
                    placeholder="Иван" required />
                </div>
                <div className="space-y-2">
                  <Label>Фамилия *</Label>
                  <Input value={tgForm.lastName}
                    onChange={e => setTgForm({ ...tgForm, lastName: e.target.value })}
                    placeholder="Иванов" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                {isSubmitting
                  ? <><Icon name="Loader2" size={18} className="animate-spin mr-2" />Подготавливаем...</>
                  : <><Icon name="Send" size={18} className="mr-2" />Открыть Telegram и получить код</>}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('method'); setError(''); }}>
                ← Назад
              </Button>
            </form>
          )}

          {/* ── Шаг 3: ожидание подключения к боту ── */}
          {step === 'tg-wait' && (
            <div className="space-y-5 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon name="Send" size={32} className="text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Откройте Telegram и нажмите /start</h3>
                <p className="text-sm text-muted-foreground">
                  Бот должен был открыться автоматически.<br />
                  Если нет — нажмите кнопку ниже.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Icon name="Loader2" size={16} className="animate-spin" />
                Ожидаем подтверждения...
              </div>
              <Button variant="outline" className="w-full" onClick={() => window.open(deepLink, '_blank')}>
                <Icon name="Send" size={16} className="mr-2 text-blue-500" />
                Открыть бота снова
              </Button>
              <Button variant="ghost" className="w-full text-sm"
                onClick={() => { setStep('tg-form'); setError(''); if (pollRef.current) clearInterval(pollRef.current); }}>
                ← Назад
              </Button>
            </div>
          )}

          {/* ── Шаг 4: ввод кода из Telegram ── */}
          {step === 'tg-code' && (
            <form onSubmit={handleTgVerify} className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Icon name="MessageSquare" size={28} className="text-green-600" />
                </div>
                <h3 className="font-semibold mb-1">Бот прислал код!</h3>
                <p className="text-sm text-muted-foreground">
                  Введите 6-значный код из Telegram.<br />
                  Код действует <strong>10 минут</strong>.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Код из Telegram</Label>
                <Input
                  value={tgCode}
                  onChange={e => setTgCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="text-center text-3xl tracking-[0.5em] font-mono h-14"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full h-12" disabled={isSubmitting || tgCode.length !== 6}>
                {isSubmitting
                  ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Проверяем...</>
                  : 'Подтвердить и создать аккаунт'}
              </Button>
              <Button type="button" variant="ghost" className="w-full text-sm"
                onClick={() => { setStep('tg-wait'); setTgCode(''); setError(''); }}>
                ← Назад
              </Button>
            </form>
          )}

          {/* ── Email: форма ── */}
          {step === 'email-form' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Имя *</Label>
                  <Input value={emailForm.firstName}
                    onChange={e => setEmailForm({ ...emailForm, firstName: e.target.value })}
                    placeholder="Иван" required />
                </div>
                <div className="space-y-2">
                  <Label>Фамилия *</Label>
                  <Input value={emailForm.lastName}
                    onChange={e => setEmailForm({ ...emailForm, lastName: e.target.value })}
                    placeholder="Иванов" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={emailForm.email}
                  onChange={e => setEmailForm({ ...emailForm, email: e.target.value })}
                  placeholder="ivan@example.com" required />
              </div>
              <div className="space-y-2">
                <Label>Пароль *</Label>
                <Input type="password" value={emailForm.password}
                  onChange={e => setEmailForm({ ...emailForm, password: e.target.value })}
                  placeholder="Минимум 8 символов" required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label>Подтвердите пароль *</Label>
                <Input type="password" value={emailForm.confirmPassword}
                  onChange={e => setEmailForm({ ...emailForm, confirmPassword: e.target.value })}
                  placeholder="Повторите пароль" required />
              </div>
              <Turnstile
                siteKey="0x4AAAAAABhHpkOBbVMj6VZe"
                onSuccess={setTurnstileToken}
                onError={() => setTurnstileToken('')}
                onExpire={() => setTurnstileToken('')}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Регистрация...</>
                  : 'Зарегистрироваться'}
              </Button>
              <Button type="button" variant="ghost" className="w-full"
                onClick={() => { setStep('method'); setError(''); }}>
                ← Назад
              </Button>
            </form>
          )}

          {/* ── Email: письмо отправлено ── */}
          {step === 'email-sent' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Icon name="Mail" size={32} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-lg">Проверьте почту</h3>
              <p className="text-muted-foreground text-sm">
                Мы отправили письмо с подтверждением на <strong>{emailForm.email}</strong>.<br />
                Перейдите по ссылке в письме для активации аккаунта.
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                На главную
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EmployeeRegister;
