import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import PartnerAuth from './PartnerAuth';
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

export default function PartnerLanding(props: Props) {
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
                { n: '3', icon: 'CreditCard', title: 'Клиент оплачивает подписку', desc: 'Как только компания оплачивает подписку — вам начисляется ваше партнёрское вознаграждение: 50% от суммы оплаты. За месячную подписку вы получаете 9 950 ₽, за годовую — 101 490 ₽. Начисление происходит автоматически.' },
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
              <div className="text-sm font-semibold text-primary-foreground/70 mb-1 uppercase tracking-wide">При оплате клиентом за 1 месяц</div>
              <div className="text-4xl font-extrabold mb-2">9 950 ₽</div>
              <div className="text-sm text-primary-foreground/80">Вознаграждение начисляется в течении 3х месяцев, если данный период продлевается клиентом</div>
              <div className="mt-4 pt-4 border-t border-white/20 text-sm">
                Итого с 1 клиента: <strong className="text-white">29 850 ₽</strong>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 ring-2 ring-white/40">
              <div className="text-sm font-semibold text-primary-foreground/70 mb-1 uppercase tracking-wide">При оплате клиентом за 1 год</div>
              <div className="text-4xl font-extrabold mb-2">101 490 ₽</div>
              <div className="text-sm text-primary-foreground/80">разово при оплате клиентом года</div>
              <div className="mt-4 pt-4 border-t border-white/20 text-sm">
                Разовое начисление за <strong className="text-white">1 клиента</strong>
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
          <div className="grid sm:grid-cols-2 gap-5 mb-8">
            {[
              { icon: 'Share2', title: 'Реферальный найм', desc: 'Сотрудники получают персональные реферальные ссылки на каждую вакансию и делятся ими с кандидатами. Рекомендованные люди уже знают о компании — конверсия в найм выше на 35%.', badge: 'Главная фича' },
              { icon: 'Trophy', title: 'Геймификация команды', desc: 'Рейтинги, бейджи и достижения превращают рекрутинг в соревнование. Ежемесячный рейтинг «Лучший рекрутёр» повышает активность сотрудников на 60%.', badge: null },
              { icon: 'Wallet', title: 'Автоматические выплаты', desc: 'Встроенный кошелёк для бонусов: HR настраивает размер вознаграждения, а система автоматически начисляет его сотруднику после выхода кандидата на работу.', badge: null },
              { icon: 'BrainCircuit', title: 'AI-тесты для кандидатов', desc: 'ИИ генерирует профессиональный тест по описанию вакансии за 15 секунд. Кандидат проходит тест без регистрации, HR получает результаты на почту сразу после прохождения.', badge: null },
              { icon: 'BarChart3', title: 'Аналитика в реальном времени', desc: 'Полная воронка найма: кто рекомендовал → на каком этапе кандидат → когда выплатить бонус. Отчёт за квартал — в один клик.', badge: null },
              { icon: 'MessageSquare', title: 'Встроенный чат', desc: 'HR общается с сотрудниками напрямую внутри платформы. Уведомления о статусе кандидатов приходят в Telegram — ничего не теряется.', badge: null },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon name={f.icon} size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-bold text-gray-900 text-sm">{f.title}</div>
                      {f.badge && <Badge className="text-xs bg-primary/10 text-primary border-0">{f.badge}</Badge>}
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button size="lg" className="px-8" onClick={scrollToLogin}>
              <Icon name="Handshake" size={18} className="mr-2" />
              Стать партнёром iHUNT
            </Button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-gray-900">Частые вопросы</h2>
          <div className="space-y-3">
            {[
              { q: 'Нужно ли платить за участие в партнёрской программе?', a: 'Нет, участие в программе полностью бесплатное. Вы только зарабатываете — никаких взносов, депозитов и скрытых платежей.' },
              { q: 'Как происходит выплата комиссии?', a: 'После каждой оплаты вашего клиента комиссия начисляется на ваш баланс в личном кабинете. После 30-дневного hold-периода вы можете запросить вывод на карту, СБП или расчётный счёт.' },
              { q: 'Сколько клиентов я могу привлечь?', a: 'Количество клиентов не ограничено. Чем больше компаний вы привлечёте — тем выше ваш доход. Комиссия начисляется с каждого оплатившего клиента.' },
              { q: 'Как долго клиент «привязан» ко мне?', a: 'Навсегда. Как только компания зарегистрировалась по вашей ссылке, она закреплена за вами. Вы получаете комиссию со всех их платежей (в рамках лимита в 3 платежа).' },
              { q: 'Что такое hold-период?', a: 'Hold — это 30 дней после начисления комиссии, в течение которых средства заморожены. Это защита от возвратов платежей. После hold-периода деньги становятся доступны для вывода.' },
              { q: 'Есть ли минимальная сумма для вывода?', a: 'Нет, минимальной суммы нет. Вы можете выводить деньги с любой суммой на балансе.' },
            ].map(f => (
              <details key={f.q} className="group border border-gray-100 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 transition-colors list-none">
                  {f.q}
                  <Icon name="ChevronDown" size={16} className="text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-3" />
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <PartnerAuth {...props} />

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
