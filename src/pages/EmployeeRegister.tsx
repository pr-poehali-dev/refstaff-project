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
const MAX_AUTH_URL = 'https://functions.poehali.dev/1c0d254b-96a5-4bfe-8255-0c39014a62b4';
const COMPANY_URL = 'https://functions.poehali.dev/f1f66940-161e-4221-a729-4e0e555af034';

type Method = 'email' | 'telegram' | 'max';
type Step =
  | 'method'
  | 'email-form' | 'email-sent'
  | 'tg-form' | 'tg-wait' | 'tg-code'
  | 'max-form' | 'max-wait' | 'max-code';

function EmployeeRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteToken = searchParams.get('token') || '';

  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<Step>('method');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  // Email
  const [emailForm, setEmailForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });

  // Telegram
  const [tgForm, setTgForm] = useState({ firstName: '', lastName: '' });
  const [tgSession, setTgSession] = useState('');
  const [tgDeepLink, setTgDeepLink] = useState('');
  const [tgCode, setTgCode] = useState('');
  const tgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // MAX
  const [maxForm, setMaxForm] = useState({ firstName: '', lastName: '' });
  const [maxSession, setMaxSession] = useState('');
  const [maxDeepLink, setMaxDeepLink] = useState('');
  const [maxCode, setMaxCode] = useState('');
  const maxPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!inviteToken) { alert('Неверная ссылка для регистрации'); navigate('/'); return; }
    fetch(`${COMPANY_URL}?invite_token=${inviteToken}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setCompanyName(d.company.name))
      .catch(() => { alert('Компания не найдена или ссылка недействительна'); navigate('/'); })
      .finally(() => setIsLoading(false));
  }, [inviteToken, navigate]);

  useEffect(() => {
    document.title = 'Получай вознаграждение за рекомендацию наших вакансий | iHUNT';
  }, [inviteToken]);

  // Поллинг Telegram сессии
  useEffect(() => {
    if (step !== 'tg-wait' || !tgSession) return;
    tgPollRef.current = setInterval(async () => {
      try {
        const r = await fetch(TG_AUTH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_session', session_token: tgSession }) });
        const d = await r.json();
        if (r.status === 410) { clearInterval(tgPollRef.current!); setError('Сессия истекла. Попробуйте ещё раз.'); setStep('tg-form'); return; }
        if (d.status === 'code_sent') { clearInterval(tgPollRef.current!); setStep('tg-code'); }
      } catch { /* ignore */ }
    }, 2000);
    return () => { if (tgPollRef.current) clearInterval(tgPollRef.current); };
  }, [step, tgSession]);

  // Поллинг MAX сессии
  useEffect(() => {
    if (step !== 'max-wait' || !maxSession) return;
    maxPollRef.current = setInterval(async () => {
      try {
        const r = await fetch(MAX_AUTH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_session', session_token: maxSession }) });
        const d = await r.json();
        if (r.status === 410) { clearInterval(maxPollRef.current!); setError('Сессия истекла. Попробуйте ещё раз.'); setStep('max-form'); return; }
        if (d.status === 'code_sent') { clearInterval(maxPollRef.current!); setStep('max-code'); }
      } catch { /* ignore */ }
    }, 2000);
    return () => { if (maxPollRef.current) clearInterval(maxPollRef.current); };
  }, [step, maxSession]);

  const goBack = (to: Step) => { setStep(to); setError(''); };

  // ── Email ──────────────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!emailForm.firstName || !emailForm.lastName || !emailForm.email || !emailForm.password) return setError('Заполните все поля');
    if (!turnstileToken) return setError('Пожалуйста, подтвердите, что вы не робот');
    if (emailForm.password.length < 8) return setError('Пароль минимум 8 символов');
    if (emailForm.password !== emailForm.confirmPassword) return setError('Пароли не совпадают');
    setIsSubmitting(true);
    try {
      const r = await fetch(AUTH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register_employee_by_token', email: emailForm.email, password: emailForm.password, first_name: emailForm.firstName, last_name: emailForm.lastName, invite_token: inviteToken, turnstile_token: turnstileToken }) });
      const d = await r.json();
      if (r.ok) setStep('email-sent'); else setError(d.error || 'Ошибка регистрации');
    } catch { setError('Не удалось зарегистрироваться'); }
    finally { setIsSubmitting(false); }
  };

  // ── Telegram: создать сессию ───────────────────────────────────────────────
  const handleTgStart = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!tgForm.firstName || !tgForm.lastName) return setError('Введите имя и фамилию');
    setIsSubmitting(true);
    try {
      const r = await fetch(TG_AUTH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_session', first_name: tgForm.firstName, last_name: tgForm.lastName, invite_token: inviteToken }) });
      const d = await r.json();
      if (r.ok) { setTgSession(d.session_token); setTgDeepLink(d.deep_link); setStep('tg-wait'); window.open(d.deep_link, '_blank'); }
      else setError(d.error || 'Ошибка создания сессии');
    } catch { setError('Не удалось подключиться'); }
    finally { setIsSubmitting(false); }
  };

  // ── Telegram: подтвердить код ──────────────────────────────────────────────
  const handleTgVerify = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (tgCode.length !== 6) return setError('Введите 6-значный код');
    setIsSubmitting(true);
    try {
      const r = await fetch(TG_AUTH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify_code', session_token: tgSession, code: tgCode }) });
      const d = await r.json();
      if (r.ok) { localStorage.setItem('authToken', d.token); localStorage.setItem('userRole', 'employee'); localStorage.setItem('showOnboarding', 'true'); navigate('/'); }
      else setError(d.error || 'Неверный код');
    } catch { setError('Ошибка подтверждения'); }
    finally { setIsSubmitting(false); }
  };

  // ── MAX: создать сессию ────────────────────────────────────────────────────
  const handleMaxStart = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!maxForm.firstName || !maxForm.lastName) return setError('Введите имя и фамилию');
    setIsSubmitting(true);
    try {
      const r = await fetch(MAX_AUTH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_session', first_name: maxForm.firstName, last_name: maxForm.lastName, invite_token: inviteToken }) });
      const d = await r.json();
      if (r.ok) { setMaxSession(d.session_token); setMaxDeepLink(d.deep_link); setStep('max-wait'); window.open(d.deep_link, '_blank'); }
      else setError(d.error || 'Ошибка создания сессии');
    } catch { setError('Не удалось подключиться'); }
    finally { setIsSubmitting(false); }
  };

  // ── MAX: подтвердить код ───────────────────────────────────────────────────
  const handleMaxVerify = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (maxCode.length !== 6) return setError('Введите 6-значный код');
    setIsSubmitting(true);
    try {
      const r = await fetch(MAX_AUTH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify_code', session_token: maxSession, code: maxCode }) });
      const d = await r.json();
      if (r.ok) { localStorage.setItem('authToken', d.token); localStorage.setItem('userRole', 'employee'); localStorage.setItem('showOnboarding', 'true'); navigate('/'); }
      else setError(d.error || 'Неверный код');
    } catch { setError('Ошибка подтверждения'); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
      <div className="text-center"><Icon name="Loader2" className="animate-spin mx-auto mb-4" size={48} /><p className="text-muted-foreground">Загрузка...</p></div>
    </div>
  );

  // Переиспользуемый компонент ожидания
  const WaitScreen = ({ deepLink, onBack, onReopen, messenger }: { deepLink: string; onBack: () => void; onReopen: () => void; messenger: string }) => (
    <div className="space-y-5 text-center">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
        <Icon name="Send" size={32} className="text-blue-500" />
      </div>
      <div>
        <h3 className="font-semibold text-base mb-1">Откройте {messenger} и нажмите /start</h3>
        <p className="text-sm text-muted-foreground">Бот должен был открыться автоматически.<br />Если нет — нажмите кнопку ниже.</p>
      </div>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Icon name="Loader2" size={16} className="animate-spin" />Ожидаем подтверждения...
      </div>
      <Button variant="outline" className="w-full" onClick={onReopen}><Icon name="Send" size={16} className="mr-2 text-blue-500" />Открыть бота снова</Button>
      <Button variant="ghost" className="w-full text-sm" onClick={onBack}>← Назад</Button>
    </div>
  );

  // Переиспользуемая форма кода
  const CodeScreen = ({ code, onChange, onSubmit, onBack }: { code: string; onChange: (v: string) => void; onSubmit: (e: React.FormEvent) => void; onBack: () => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center">
        <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
          <Icon name="MessageSquare" size={28} className="text-green-600" />
        </div>
        <h3 className="font-semibold mb-1">Бот прислал код!</h3>
        <p className="text-sm text-muted-foreground">Введите 6-значный код из мессенджера.<br />Код действует <strong>10 минут</strong>.</p>
      </div>
      <div className="space-y-2">
        <Label>Код</Label>
        <Input value={code} onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className="text-center text-3xl tracking-[0.5em] font-mono h-14" maxLength={6} autoFocus />
      </div>
      <Button type="submit" className="w-full h-12" disabled={isSubmitting || code.length !== 6}>
        {isSubmitting ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Проверяем...</> : 'Подтвердить и создать аккаунт'}
      </Button>
      <Button type="button" variant="ghost" className="w-full text-sm" onClick={onBack}>← Назад</Button>
    </form>
  );

  // Переиспользуемая форма имени
  const NameForm = ({ form, onChange, onSubmit, messenger, color }: { form: { firstName: string; lastName: string }; onChange: (f: { firstName: string; lastName: string }) => void; onSubmit: (e: React.FormEvent) => void; messenger: string; color: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Имя *</Label><Input value={form.firstName} onChange={e => onChange({ ...form, firstName: e.target.value })} placeholder="Иван" required /></div>
        <div className="space-y-2"><Label>Фамилия *</Label><Input value={form.lastName} onChange={e => onChange({ ...form, lastName: e.target.value })} placeholder="Иванов" required /></div>
      </div>
      <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
        {isSubmitting ? <><Icon name="Loader2" size={18} className="animate-spin mr-2" />Подготавливаем...</> : <><Icon name="Send" size={18} className={`mr-2 ${color}`} />Открыть {messenger} и получить код</>}
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={() => goBack('method')}>← Назад</Button>
    </form>
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
          <CardDescription>Вы регистрируетесь как сотрудник компании <strong>{companyName}</strong></CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
              <Icon name="AlertCircle" size={16} className="mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          {/* ── Выбор способа ── */}
          {step === 'method' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center mb-4">Выберите способ регистрации</p>
              {[
                { key: 'telegram' as Method, icon: 'Send', color: 'text-blue-500', bg: 'bg-blue-100', title: 'Через Telegram', sub: 'Нажмите кнопку — бот пришлёт код', step: 'tg-form' as Step },
                { key: 'max' as Method, icon: 'MessageCircle', color: 'text-purple-500', bg: 'bg-purple-100', title: 'Через MAX', sub: 'Нажмите кнопку — бот MAX пришлёт код', step: 'max-form' as Step },
                { key: 'email' as Method, icon: 'Mail', color: 'text-gray-500', bg: 'bg-gray-100', title: 'Через Email', sub: 'Ссылка подтверждения на почту', step: 'email-form' as Step },
              ].map(item => (
                <button key={item.key}
                  className="w-full h-16 flex items-center gap-4 px-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  onClick={() => { setStep(item.step); setError(''); }}>
                  <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center shrink-0`}>
                    <Icon name={item.icon as 'Send'} size={20} className={item.color} />
                  </div>
                  <div><div className="font-semibold">{item.title}</div><div className="text-xs text-muted-foreground">{item.sub}</div></div>
                  <Icon name="ChevronRight" size={18} className="ml-auto text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {/* ── Telegram флоу ── */}
          {step === 'tg-form' && <NameForm form={tgForm} onChange={setTgForm} onSubmit={handleTgStart} messenger="Telegram" color="text-blue-500" />}
          {step === 'tg-wait' && <WaitScreen deepLink={tgDeepLink} messenger="Telegram" onReopen={() => window.open(tgDeepLink, '_blank')} onBack={() => { goBack('tg-form'); if (tgPollRef.current) clearInterval(tgPollRef.current); }} />}
          {step === 'tg-code' && <CodeScreen code={tgCode} onChange={setTgCode} onSubmit={handleTgVerify} onBack={() => goBack('tg-wait')} />}

          {/* ── MAX флоу ── */}
          {step === 'max-form' && <NameForm form={maxForm} onChange={setMaxForm} onSubmit={handleMaxStart} messenger="MAX" color="text-purple-500" />}
          {step === 'max-wait' && <WaitScreen deepLink={maxDeepLink} messenger="MAX" onReopen={() => window.open(maxDeepLink, '_blank')} onBack={() => { goBack('max-form'); if (maxPollRef.current) clearInterval(maxPollRef.current); }} />}
          {step === 'max-code' && <CodeScreen code={maxCode} onChange={setMaxCode} onSubmit={handleMaxVerify} onBack={() => goBack('max-wait')} />}

          {/* ── Email флоу ── */}
          {step === 'email-form' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Имя *</Label><Input value={emailForm.firstName} onChange={e => setEmailForm({ ...emailForm, firstName: e.target.value })} placeholder="Иван" required /></div>
                <div className="space-y-2"><Label>Фамилия *</Label><Input value={emailForm.lastName} onChange={e => setEmailForm({ ...emailForm, lastName: e.target.value })} placeholder="Иванов" required /></div>
              </div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={emailForm.email} onChange={e => setEmailForm({ ...emailForm, email: e.target.value })} placeholder="ivan@example.com" required /></div>
              <div className="space-y-2"><Label>Пароль *</Label><Input type="password" value={emailForm.password} onChange={e => setEmailForm({ ...emailForm, password: e.target.value })} placeholder="Минимум 8 символов" required minLength={8} /></div>
              <div className="space-y-2"><Label>Подтвердите пароль *</Label><Input type="password" value={emailForm.confirmPassword} onChange={e => setEmailForm({ ...emailForm, confirmPassword: e.target.value })} placeholder="Повторите пароль" required /></div>
              <Turnstile siteKey="0x4AAAAAABhHpkOBbVMj6VZe" onSuccess={setTurnstileToken} onError={() => setTurnstileToken('')} onExpire={() => setTurnstileToken('')} />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Регистрация...</> : 'Зарегистрироваться'}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => goBack('method')}>← Назад</Button>
            </form>
          )}

          {step === 'email-sent' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"><Icon name="Mail" size={32} className="text-green-600" /></div>
              <h3 className="font-semibold text-lg">Проверьте почту</h3>
              <p className="text-muted-foreground text-sm">Мы отправили письмо с подтверждением на <strong>{emailForm.email}</strong>.<br />Перейдите по ссылке для активации аккаунта.</p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>На главную</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EmployeeRegister;
