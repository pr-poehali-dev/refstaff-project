import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { AuthStep, Messenger } from './partnerTypes';

interface Props {
  authStep: AuthStep;
  setAuthStep: (s: AuthStep) => void;
  messenger: Messenger;
  deepLink: string;
  otp: string;
  setOtp: (v: string) => void;
  submitting: boolean;
  profileForm: { name: string; email: string; phone: string };
  setProfileForm: (fn: (p: { name: string; email: string; phone: string }) => { name: string; email: string; phone: string }) => void;
  handleSendToMessenger: (m: Messenger) => void;
  handleVerifyOtp: () => void;
  handleCompleteRegistration: () => void;
}

export default function PartnerAuth({
  authStep, setAuthStep, messenger, deepLink,
  otp, setOtp, submitting,
  profileForm, setProfileForm,
  handleSendToMessenger, handleVerifyOtp, handleCompleteRegistration,
}: Props) {
  return (
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
  );
}
