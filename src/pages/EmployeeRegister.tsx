import { useState, useEffect } from 'react';
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

type Step = 'method' | 'email-form' | 'email-verify' | 'tg-form' | 'tg-code';
type Method = 'email' | 'telegram';

function EmployeeRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteToken = searchParams.get('token');

  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<Method>('email');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const [emailForm, setEmailForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: ''
  });

  const [tgForm, setTgForm] = useState({
    firstName: '', lastName: '', chatId: ''
  });
  const [tgCode, setTgCode] = useState('');
  const [tgChatId, setTgChatId] = useState('');

  useEffect(() => {
    if (!inviteToken) {
      alert('Неверная ссылка для регистрации');
      navigate('/');
      return;
    }
    fetch(`${COMPANY_URL}?invite_token=${inviteToken}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setCompanyName(data.company.name))
      .catch(() => { alert('Компания не найдена или ссылка недействительна'); navigate('/'); })
      .finally(() => setIsLoading(false));
  }, [inviteToken, navigate]);

  useEffect(() => {
    const title = 'Получай вознаграждение за рекомендацию наших вакансий | iHUNT';
    const desc = 'Зарегистрируйся и рекомендуй вакансии своим знакомым — получай денежное вознаграждение за каждого успешного кандидата.';
    const image = 'https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/bucket/1a4f08a4-f047-444f-aab6-82e0357b0c94.jpg';
    document.title = title;
    const setMeta = (attr: string, key: string, value: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', value);
    };
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:url', window.location.href);
    setMeta('property', 'og:type', 'website');
  }, [inviteToken]);

  // ── EMAIL: отправка формы ──────────────────────────────────────────────────
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
          email: emailForm.email,
          password: emailForm.password,
          first_name: emailForm.firstName,
          last_name: emailForm.lastName,
          invite_token: inviteToken,
          turnstile_token: turnstileToken
        })
      });
      const data = await r.json();
      if (r.ok) setStep('email-verify');
      else setError(data.error || 'Ошибка регистрации');
    } catch {
      setError('Не удалось зарегистрироваться');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── TELEGRAM: отправить код ────────────────────────────────────────────────
  const handleTgSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!tgForm.firstName || !tgForm.lastName || !tgForm.chatId)
      return setError('Заполните все поля');

    const chatIdNum = parseInt(tgForm.chatId);
    if (isNaN(chatIdNum)) return setError('Chat ID должен быть числом');

    setIsSubmitting(true);
    try {
      const r = await fetch(TG_AUTH_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_register_code',
          telegram_chat_id: chatIdNum,
          first_name: tgForm.firstName,
          last_name: tgForm.lastName,
          invite_token: inviteToken
        })
      });
      const data = await r.json();
      if (r.ok) {
        setTgChatId(tgForm.chatId);
        setStep('tg-code');
      } else {
        setError(data.error || 'Ошибка отправки кода');
      }
    } catch {
      setError('Не удалось отправить код');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── TELEGRAM: подтвердить код ──────────────────────────────────────────────
  const handleTgVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!tgCode.trim()) return setError('Введите код из Telegram');

    setIsSubmitting(true);
    try {
      const r = await fetch(TG_AUTH_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_register_code',
          telegram_chat_id: parseInt(tgChatId),
          code: tgCode.trim()
        })
      });
      const data = await r.json();
      if (r.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', 'employee');
        navigate('/employee');
      } else {
        setError(data.error || 'Неверный код');
      }
    } catch {
      setError('Ошибка подтверждения кода');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center">
          <Icon name="Loader2" className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

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
              <Button
                className="w-full h-14 flex items-center gap-3 justify-start px-5"
                variant="outline"
                onClick={() => { setMethod('email'); setStep('email-form'); }}
              >
                <Icon name="Mail" size={20} className="text-primary" />
                <div className="text-left">
                  <div className="font-medium">Через Email</div>
                  <div className="text-xs text-muted-foreground">Код придёт на почту</div>
                </div>
              </Button>
              <Button
                className="w-full h-14 flex items-center gap-3 justify-start px-5"
                variant="outline"
                onClick={() => { setMethod('telegram'); setStep('tg-form'); }}
              >
                <Icon name="Send" size={20} className="text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Через Telegram</div>
                  <div className="text-xs text-muted-foreground">Код придёт в мессенджер</div>
                </div>
              </Button>
            </div>
          )}

          {/* ── Шаг 2а: форма Email ── */}
          {step === 'email-form' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя *</Label>
                  <Input id="firstName" value={emailForm.firstName}
                    onChange={e => setEmailForm({ ...emailForm, firstName: e.target.value })}
                    placeholder="Иван" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия *</Label>
                  <Input id="lastName" value={emailForm.lastName}
                    onChange={e => setEmailForm({ ...emailForm, lastName: e.target.value })}
                    placeholder="Иванов" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={emailForm.email}
                  onChange={e => setEmailForm({ ...emailForm, email: e.target.value })}
                  placeholder="ivan@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль *</Label>
                <Input id="password" type="password" value={emailForm.password}
                  onChange={e => setEmailForm({ ...emailForm, password: e.target.value })}
                  placeholder="Минимум 8 символов" required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль *</Label>
                <Input id="confirmPassword" type="password" value={emailForm.confirmPassword}
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
                {isSubmitting ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Регистрация...</> : 'Зарегистрироваться'}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('method'); setError(''); }}>
                ← Назад
              </Button>
            </form>
          )}

          {/* ── Шаг 2б: подтверждение Email ── */}
          {step === 'email-verify' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Icon name="Mail" size={32} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-lg">Проверьте почту</h3>
              <p className="text-muted-foreground text-sm">
                Мы отправили письмо с подтверждением на <strong>{emailForm.email}</strong>.
                Перейдите по ссылке в письме для активации аккаунта.
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                На главную
              </Button>
            </div>
          )}

          {/* ── Шаг 3а: форма Telegram ── */}
          {step === 'tg-form' && (
            <form onSubmit={handleTgSendCode} className="space-y-4">
              <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-800 space-y-1">
                <p className="font-medium flex items-center gap-1.5">
                  <Icon name="Info" size={14} />
                  Как найти свой Telegram Chat ID?
                </p>
                <p>Напишите боту <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="underline font-medium">@userinfobot</a> — он пришлёт ваш ID в ответ.</p>
              </div>
              <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <p className="font-medium flex items-center gap-1.5 mb-1">
                  <Icon name="MessageCircle" size={14} />
                  Важно: напишите боту iHUNT первым
                </p>
                <p>Перед получением кода напишите любое сообщение боту: <strong>@ihunt_auth_bot</strong> (или тому, который указан в инструкции компании).</p>
              </div>
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
              <div className="space-y-2">
                <Label>Ваш Telegram Chat ID *</Label>
                <Input value={tgForm.chatId}
                  onChange={e => setTgForm({ ...tgForm, chatId: e.target.value })}
                  placeholder="123456789" required />
                <p className="text-xs text-muted-foreground">Только цифры, узнайте у @userinfobot</p>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Отправляем...</>
                  : <><Icon name="Send" size={16} className="mr-2" />Получить код в Telegram</>}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('method'); setError(''); }}>
                ← Назад
              </Button>
            </form>
          )}

          {/* ── Шаг 3б: ввод кода из Telegram ── */}
          {step === 'tg-code' && (
            <form onSubmit={handleTgVerifyCode} className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Icon name="Send" size={28} className="text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Мы отправили 6-значный код в ваш Telegram.<br />
                  Код действует <strong>10 минут</strong>.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Код из Telegram *</Label>
                <Input
                  value={tgCode}
                  onChange={e => setTgCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="text-center text-2xl tracking-[0.4em] font-mono"
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting || tgCode.length !== 6}>
                {isSubmitting
                  ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Проверяем...</>
                  : 'Подтвердить и войти'}
              </Button>
              <Button type="button" variant="ghost" className="w-full text-sm"
                onClick={() => { setStep('tg-form'); setTgCode(''); setError(''); }}>
                ← Изменить данные
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EmployeeRegister;
