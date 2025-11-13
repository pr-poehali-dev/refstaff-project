import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

type UserRole = 'guest' | 'employer' | 'employee';

interface Vacancy {
  id: number;
  title: string;
  department: string;
  salary: string;
  status: 'active' | 'closed';
  recommendations: number;
  reward: number;
  payoutDelayDays: number;
  referralLink?: string;
}

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  avatar: string;
  recommendations: number;
  hired: number;
  earnings: number;
  level: number;
  isHrManager?: boolean;
  isAdmin?: boolean;
}

interface Recommendation {
  id: number;
  candidateName: string;
  vacancy: string;
  status: 'pending' | 'accepted' | 'rejected';
  date: string;
  reward: number;
  recommendedBy?: string;
  recommendedById?: number;
}

interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  message: string;
  timestamp: string;
  isOwn: boolean;
}

function Index() {
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('userRole');
    return (saved as UserRole) || 'guest';
  });
  const [activeVacancy, setActiveVacancy] = useState<Vacancy | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCompanySettingsDialog, setShowCompanySettingsDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [activeChatEmployee, setActiveChatEmployee] = useState<Employee | null>(null);
  const [showCompanyProfileDialog, setShowCompanyProfileDialog] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, senderId: 1, senderName: 'HR Manager', message: 'Здравствуйте! Как дела с рекомендациями?', timestamp: '10:30', isOwn: false },
    { id: 2, senderId: 2, senderName: 'Вы', message: 'Отлично! У меня есть кандидат на вакансию Frontend Developer', timestamp: '10:32', isOwn: true },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [inviteLink, setInviteLink] = useState('https://refstaff.app/join/abc123def456');
  const [newReward, setNewReward] = useState('30000');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(2);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showIntegrationsDialog, setShowIntegrationsDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  const [subscriptionDaysLeft, setSubscriptionDaysLeft] = useState(12);
  const [notifications, setNotifications] = useState<Array<{id: number; type: string; message: string; date: string; read: boolean}>>([
    { id: 1, type: 'recommendation', message: 'Новая рекомендация от Анны Смирновой', date: '2025-11-13', read: false },
    { id: 2, type: 'subscription', message: 'Подписка заканчивается через 12 дней', date: '2025-11-13', read: false },
    { id: 3, type: 'hire', message: 'Кандидат Елена Новикова принята', date: '2025-11-12', read: true },
  ]);

  useEffect(() => {
    localStorage.setItem('userRole', userRole);
  }, [userRole]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    setUserRole('guest');
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const newMsg: ChatMessage = {
      id: chatMessages.length + 1,
      senderId: 2,
      senderName: 'Вы',
      message: newMessage,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true
    };
    setChatMessages([...chatMessages, newMsg]);
    setNewMessage('');
  };

  const handleOpenChat = () => {
    setShowChatDialog(true);
    setUnreadMessagesCount(0);
  };

  const currentEmployeeId = 1;
  
  const vacancies: Vacancy[] = [
    { id: 1, title: 'Senior Frontend Developer', department: 'Разработка', salary: '250 000 ₽', status: 'active', recommendations: 5, reward: 30000, payoutDelayDays: 30, referralLink: `https://refstaff.app/r/vac1?ref=${currentEmployeeId}` },
    { id: 2, title: 'Product Manager', department: 'Продукт', salary: '200 000 ₽', status: 'active', recommendations: 3, reward: 25000, payoutDelayDays: 45, referralLink: `https://refstaff.app/r/vac2?ref=${currentEmployeeId}` },
    { id: 3, title: 'UX/UI Designer', department: 'Дизайн', salary: '180 000 ₽', status: 'active', recommendations: 8, reward: 30000, payoutDelayDays: 60, referralLink: `https://refstaff.app/r/vac3?ref=${currentEmployeeId}` },
    { id: 4, title: 'DevOps Engineer', department: 'Инфраструктура', salary: '220 000 ₽', status: 'active', recommendations: 2, reward: 35000, payoutDelayDays: 90, referralLink: `https://refstaff.app/r/vac4?ref=${currentEmployeeId}` },
  ];

  const employees: Employee[] = [
    { id: 1, name: 'Анна Смирнова', position: 'Tech Lead', department: 'Разработка', avatar: '', recommendations: 12, hired: 4, earnings: 120000, level: 5, isHrManager: true },
    { id: 2, name: 'Дмитрий Иванов', position: 'Senior Developer', department: 'Разработка', avatar: '', recommendations: 8, hired: 2, earnings: 60000, level: 3 },
    { id: 3, name: 'Мария Петрова', position: 'Product Owner', department: 'Продукт', avatar: '', recommendations: 15, hired: 5, earnings: 150000, level: 6, isAdmin: true },
  ];

  const calculateEmployeeRank = (emp: Employee) => {
    const sortedEmployees = [...employees].sort((a, b) => {
      if (b.hired !== a.hired) return b.hired - a.hired;
      if (b.recommendations !== a.recommendations) return b.recommendations - a.recommendations;
      return b.earnings - a.earnings;
    });
    return sortedEmployees.findIndex(e => e.id === emp.id) + 1;
  };

  const recommendations: Recommendation[] = [
    { id: 1, candidateName: 'Алексей Козлов', vacancy: 'Senior Frontend Developer', status: 'pending', date: '2025-11-10', reward: 30000, recommendedBy: 'Анна Смирнова', recommendedById: 1 },
    { id: 2, candidateName: 'Елена Новикова', vacancy: 'UX/UI Designer', status: 'accepted', date: '2025-11-08', reward: 30000, recommendedBy: 'Анна Смирнова', recommendedById: 1 },
    { id: 3, candidateName: 'Сергей Волков', vacancy: 'Product Manager', status: 'pending', date: '2025-11-12', reward: 30000, recommendedBy: 'Дмитрий Иванов', recommendedById: 2 },
  ];

  const renderLandingPage = () => (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Rocket" className="text-primary" size={32} />
            <span className="text-2xl font-bold">RefStaff</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#how" className="text-sm hover:text-primary transition-colors">Как работает</a>
            <a href="#benefits" className="text-sm hover:text-primary transition-colors">Преимущества</a>
            <a href="#pricing" className="text-sm hover:text-primary transition-colors">Тарифы</a>
            <a href="#contact" className="text-sm hover:text-primary transition-colors">Контакты</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setShowLoginDialog(true)}>Вход</Button>
            <Button onClick={() => setShowRegisterDialog(true)}>Зарегистрировать компанию</Button>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 animate-fade-in">Реферальный рекрутинг нового поколения</Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-slide-up">
            Нанимайте лучших кандидатов через своих сотрудников
          </h1>
          <p className="text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Платформа для реферального найма с геймификацией и прозрачной системой вознаграждений
          </p>
          <Button size="lg" className="animate-scale-in" style={{ animationDelay: '0.2s' }} onClick={() => setShowRegisterDialog(true)}>
            <Icon name="Rocket" className="mr-2" size={20} />
            Начать бесплатно — 14 дней
          </Button>
        </div>
      </section>

      <section id="how" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">Как это работает</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: 'Building2', title: 'Регистрация', desc: 'Зарегистрируйте компанию и добавьте вакансии' },
              { icon: 'Users', title: 'Приглашение', desc: 'Пригласите сотрудников в систему' },
              { icon: 'UserPlus', title: 'Рекомендации', desc: 'Сотрудники рекомендуют кандидатов' },
              { icon: 'TrendingUp', title: 'Вознаграждение', desc: 'Выплачивайте бонусы за успешный найм' },
            ].map((step, i) => (
              <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name={step.icon as any} className="text-primary" size={32} />
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">Преимущества платформы</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: 'Wallet', title: 'Экономия бюджета', desc: 'Снижение затрат на рекрутинг до 70%' },
              { icon: 'Zap', title: 'Быстрый найм', desc: 'Сокращение времени закрытия вакансий в 2 раза' },
              { icon: 'Shield', title: 'Качество кандидатов', desc: 'Рекомендации от проверенных сотрудников' },
              { icon: 'Trophy', title: 'Геймификация', desc: 'Вовлечение сотрудников через достижения' },
              { icon: 'BarChart3', title: 'Прозрачность', desc: 'Полная статистика и аналитика процесса' },
              { icon: 'Link', title: 'Интеграция', desc: 'API для подключения к вашим системам' },
            ].map((benefit, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Icon name={benefit.icon as any} className="text-secondary mb-3" size={40} />
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Тарифы</h2>
          <p className="text-center text-muted-foreground mb-16">14 дней бесплатно для всех новых клиентов</p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Пробный период</CardTitle>
                <CardDescription>Протестируйте платформу</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-4">0 ₽</div>
                <p className="text-sm text-muted-foreground mb-6">14 дней бесплатно</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1" size={18} />
                    <span className="text-sm">До 300 сотрудников</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1" size={18} />
                    <span className="text-sm">Все функции платформы</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1" size={18} />
                    <span className="text-sm">Поддержка 24/7</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => setShowRegisterDialog(true)}>Попробовать</Button>
              </CardFooter>
            </Card>

            <Card className="border-2 border-primary shadow-xl scale-105 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-secondary">Популярный</Badge>
              </div>
              <CardHeader>
                <CardTitle>До 300 сотрудников</CardTitle>
                <CardDescription>Для растущих компаний</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1">19 900 ₽</div>
                <p className="text-sm text-muted-foreground mb-2">в месяц</p>
                <p className="text-sm text-green-600 font-medium mb-6">15 920 ₽/мес при годовой оплате</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1" size={18} />
                    <span className="text-sm">До 300 сотрудников</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1" size={18} />
                    <span className="text-sm">Неограниченные вакансии</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1" size={18} />
                    <span className="text-sm">API интеграция</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1" size={18} />
                    <span className="text-sm">Аналитика и отчёты</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => setShowRegisterDialog(true)}>Подключить</Button>
              </CardFooter>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Свыше 300 сотрудников</CardTitle>
                <CardDescription>Для крупных компаний</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1">48 900 ₽</div>
                <p className="text-sm text-muted-foreground mb-2">в месяц</p>
                <p className="text-sm text-green-600 font-medium mb-6">39 120 ₽/мес при годовой оплате</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1" size={18} />
                    <span className="text-sm">Неограниченное количество</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1" size={18} />
                    <span className="text-sm">Приоритетная поддержка</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1" size={18} />
                    <span className="text-sm">Персональный менеджер</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1" size={18} />
                    <span className="text-sm">Кастомизация системы</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => setShowRegisterDialog(true)}>Подключить</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Остались вопросы?</CardTitle>
              <CardDescription>Свяжитесь с нами, и мы с радостью ответим</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name">Имя</Label>
                  <Input id="name" placeholder="Иван Иванов" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="ivan@company.ru" />
                </div>
                <div>
                  <Label htmlFor="message">Сообщение</Label>
                  <Textarea id="message" placeholder="Расскажите о вашем проекте..." rows={4} />
                </div>
                <Button className="w-full">Отправить</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t bg-gray-50 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Rocket" className="text-primary" size={24} />
                <span className="text-lg font-bold">RefStaff</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Платформа реферального рекрутинга с геймификацией
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Продукт</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Возможности</a></li>
                <li><a href="#" className="hover:text-primary">Тарифы</a></li>
                <li><a href="#" className="hover:text-primary">API документация</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Компания</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">О нас</a></li>
                <li><a href="#" className="hover:text-primary">Блог</a></li>
                <li><a href="#" className="hover:text-primary">Контакты</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Правовая информация</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Политика конфиденциальности</a></li>
                <li><a href="#" className="hover:text-primary">Пользовательское соглашение</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 RefStaff. Все права защищены.
          </div>
        </div>
      </footer>

      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Регистрация компании</DialogTitle>
            <DialogDescription>Начните 14-дневный бесплатный пробный период</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="company-name">Название компании</Label>
              <Input id="company-name" placeholder="Acme Corp" />
            </div>
            <div>
              <Label htmlFor="admin-name">Ваше имя</Label>
              <Input id="admin-name" placeholder="Иван Иванов" />
            </div>
            <div>
              <Label htmlFor="admin-email">Email</Label>
              <Input id="admin-email" type="email" placeholder="ivan@company.ru" />
            </div>
            <div>
              <Label htmlFor="admin-password">Пароль</Label>
              <Input id="admin-password" type="password" placeholder="Минимум 8 символов" />
            </div>
            <div>
              <Label htmlFor="employee-count">Количество сотрудников</Label>
              <Input id="employee-count" type="number" placeholder="50" />
            </div>
            <Button className="w-full" onClick={() => {
              setShowRegisterDialog(false);
              setUserRole('employer');
            }}>
              Создать аккаунт
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Нажимая кнопку, вы соглашаетесь с условиями использования
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Вход в систему</DialogTitle>
            <DialogDescription>Войдите в свой аккаунт</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" placeholder="ivan@company.ru" />
            </div>
            <div>
              <Label htmlFor="login-password">Пароль</Label>
              <Input id="login-password" type="password" placeholder="Ваш пароль" />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                Запомнить меня
              </label>
              <a href="#" className="text-sm text-primary hover:underline">Забыли пароль?</a>
            </div>
            <Button className="w-full" onClick={() => {
              setShowLoginDialog(false);
              setUserRole('employee');
            }}>
              Войти
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Нет аккаунта?{' '}
              <button 
                onClick={() => {
                  setShowLoginDialog(false);
                  setShowRegisterDialog(true);
                }}
                className="text-primary hover:underline"
              >
                Зарегистрируйтесь
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderEmployerDashboard = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setUserRole('guest')}>
            <Icon name="Rocket" className="text-primary" size={28} />
            <span className="text-xl font-bold">RefStaff</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotificationsDialog(true)}>
              <Icon name="Bell" size={20} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setShowSubscriptionDialog(true)}>
              <Icon name="CreditCard" className="mr-2" size={18} />
              Подписка
              {subscriptionDaysLeft < 14 && (
                <Badge variant="destructive" className="ml-2">{subscriptionDaysLeft} дн.</Badge>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setShowCompanySettingsDialog(true)}>
              <Icon name="Settings" className="mr-2" size={18} />
              Настройки
            </Button>
            <Button variant="ghost" onClick={handleLogout}>Выход</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Личный кабинет работодателя</h1>

        <Tabs defaultValue="vacancies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="vacancies">Вакансии</TabsTrigger>
            <TabsTrigger value="employees">Сотрудники</TabsTrigger>
            <TabsTrigger value="recommendations">Рекомендации</TabsTrigger>
            <TabsTrigger value="chats">Чаты</TabsTrigger>
            <TabsTrigger value="integrations">Интеграции</TabsTrigger>
            <TabsTrigger value="stats">Статистика</TabsTrigger>
          </TabsList>

          <TabsContent value="vacancies" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Активные вакансии</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Icon name="Plus" className="mr-2" size={18} />
                    Добавить вакансию
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новая вакансия</DialogTitle>
                    <DialogDescription>Создайте новую вакансию для реферального найма</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="vacancy-title">Название должности</Label>
                      <Input id="vacancy-title" placeholder="Senior Frontend Developer" />
                    </div>
                    <div>
                      <Label htmlFor="department">Отдел</Label>
                      <Input id="department" placeholder="Разработка" />
                    </div>
                    <div>
                      <Label htmlFor="salary">Зарплата</Label>
                      <Input id="salary" placeholder="250 000 ₽" />
                    </div>
                    <div>
                      <Label htmlFor="reward-amount">Вознаграждение за рекомендацию</Label>
                      <Input 
                        id="reward-amount" 
                        type="number" 
                        placeholder="30000" 
                        value={newReward}
                        onChange={(e) => setNewReward(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Сумма в рублях, которую получит сотрудник за успешный найм</p>
                    </div>
                    <div>
                      <Label htmlFor="payout-delay">Срок выплаты вознаграждения</Label>
                      <Select defaultValue="30">
                        <SelectTrigger id="payout-delay">
                          <SelectValue placeholder="Выберите срок" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Сразу после найма</SelectItem>
                          <SelectItem value="7">Через 7 дней</SelectItem>
                          <SelectItem value="14">Через 14 дней</SelectItem>
                          <SelectItem value="30">Через 30 дней</SelectItem>
                          <SelectItem value="45">Через 45 дней</SelectItem>
                          <SelectItem value="60">Через 60 дней</SelectItem>
                          <SelectItem value="90">Через 90 дней (испытательный срок)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Когда сотрудник получит деньги после принятия кандидата</p>
                    </div>
                    <div>
                      <Label htmlFor="requirements">Требования</Label>
                      <Textarea id="requirements" placeholder="Опыт работы от 5 лет..." rows={4} />
                    </div>
                    <Button className="w-full">Создать вакансию</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {vacancies.map((vacancy) => (
                <Card key={vacancy.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{vacancy.title}</CardTitle>
                        <CardDescription>{vacancy.department}</CardDescription>
                      </div>
                      <Badge variant="secondary">{vacancy.status === 'active' ? 'Активна' : 'Закрыта'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Icon name="Wallet" size={16} className="text-muted-foreground" />
                            <span>{vacancy.salary}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Icon name="Users" size={16} className="text-muted-foreground" />
                            <span>{vacancy.recommendations} рекомендаций</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <Icon name="Award" size={16} />
                            <span className="font-medium">{vacancy.reward.toLocaleString()} ₽ за найм</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon name="Clock" size={16} />
                            <span>Выплата через {vacancy.payoutDelayDays} {vacancy.payoutDelayDays === 1 ? 'день' : vacancy.payoutDelayDays < 5 ? 'дня' : 'дней'}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Редактировать</Button>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Реферальная ссылка для сотрудников</Label>
                        <div className="flex gap-2">
                          <Input value={vacancy.referralLink} readOnly className="text-xs" />
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(vacancy.referralLink || '')}>
                            <Icon name="Copy" size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Сотрудники компании</h2>
              <Button onClick={() => setShowInviteDialog(true)}>
                <Icon name="UserPlus" className="mr-2" size={18} />
                Пригласить сотрудника
              </Button>
            </div>
            <div className="grid gap-4">
              {employees.map((employee) => (
                <Card key={employee.id}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={employee.avatar} />
                        <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{employee.name}</CardTitle>
                          {employee.isHrManager && <Badge variant="secondary">HR Manager</Badge>}
                          {employee.isAdmin && <Badge>Admin</Badge>}
                          <Badge variant="outline" className="bg-primary/10">
                            <Icon name="Trophy" size={12} className="mr-1" />
                            #{calculateEmployeeRank(employee)} в рейтинге
                          </Badge>
                        </div>
                        <CardDescription>{employee.position} • {employee.department}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setActiveChatEmployee(employee);
                            setShowChatDialog(true);
                          }}
                        >
                          <Icon name="MessageCircle" className="mr-1" size={16} />
                          Написать
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Icon name="Shield" size={16} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Управление ролями: {employee.name}</DialogTitle>
                              <DialogDescription>Назначьте права доступа сотруднику</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label>HR Manager</Label>
                                  <p className="text-xs text-muted-foreground">Управление вакансиями и рекомендациями</p>
                                </div>
                                <input type="checkbox" defaultChecked={employee.isHrManager} className="rounded" />
                              </div>
                              <Separator />
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label>Администратор</Label>
                                  <p className="text-xs text-muted-foreground">Полный доступ к системе</p>
                                </div>
                                <input type="checkbox" defaultChecked={employee.isAdmin} className="rounded" />
                              </div>
                              <Button className="w-full">Сохранить</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEmployeeToDelete(employee);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Icon name="Trash2" size={16} className="text-destructive" />
                        </Button>
                      </div>
                      <Badge variant="outline">Уровень {employee.level}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">{employee.recommendations}</div>
                        <div className="text-xs text-muted-foreground">Рекомендаций</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{employee.hired}</div>
                        <div className="text-xs text-muted-foreground">Нанято</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-secondary">{employee.earnings.toLocaleString()} ₽</div>
                        <div className="text-xs text-muted-foreground">Заработано</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <h2 className="text-2xl font-semibold">Рекомендации кандидатов</h2>
            <div className="grid gap-4">
              {recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{rec.candidateName}</CardTitle>
                        <CardDescription>{rec.vacancy}</CardDescription>
                        {rec.recommendedBy && (
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{rec.recommendedBy.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              Рекомендовал: <span className="font-medium text-foreground">{rec.recommendedBy}</span>
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge variant={
                        rec.status === 'accepted' ? 'default' : 
                        rec.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }>
                        {rec.status === 'accepted' ? 'Принят' : 
                         rec.status === 'rejected' ? 'Отклонён' : 
                         'На рассмотрении'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Icon name="Calendar" size={16} />
                          <span>{new Date(rec.date).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Award" size={16} />
                          <span>{rec.reward.toLocaleString()} ₽</span>
                        </div>
                      </div>
                      {rec.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Icon name="X" className="mr-1" size={16} />
                            Отклонить
                          </Button>
                          <Button size="sm">
                            <Icon name="Check" className="mr-1" size={16} />
                            Принять
                          </Button>
                        </div>
                      )}
                      {rec.status === 'accepted' && (
                        <div className="text-sm text-muted-foreground">
                          <Icon name="Clock" size={14} className="inline mr-1" />
                          Выплата через 30 дней
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chats" className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Чаты с сотрудниками</h2>
            <div className="grid gap-3">
              {employees.slice(0, 3).map((emp) => (
                <Card key={emp.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                  setActiveChatEmployee(emp);
                  setShowChatDialog(true);
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{emp.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-muted-foreground truncate">Отлично! У меня есть кандидат...</div>
                      </div>
                      <Badge variant="secondary">2</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <h2 className="text-2xl font-semibold">Статистика по компании</h2>
            
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Всего рекомендаций</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">35</div>
                  <p className="text-xs text-green-600 mt-1">+12% за месяц</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Принято кандидатов</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">11</div>
                  <p className="text-xs text-green-600 mt-1">Конверсия 31%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Выплачено бонусов</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">330К ₽</div>
                  <p className="text-xs text-muted-foreground mt-1">За весь период</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Средний срок найма</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">18 дней</div>
                  <p className="text-xs text-green-600 mt-1">-40% vs рынка</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Топ рекрутеров месяца</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.sort((a, b) => b.hired - a.hired).map((emp, idx) => (
                    <div key={emp.id} className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-muted-foreground w-8">#{idx + 1}</div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{emp.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-muted-foreground">{emp.hired} успешных найма</div>
                      </div>
                      <Badge variant="secondary">
                        <Icon name="TrendingUp" className="mr-1" size={14} />
                        {emp.earnings.toLocaleString()} ₽
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <h2 className="text-2xl font-semibold">Интеграции с внешними сервисами</h2>
            <p className="text-muted-foreground">Подключите внешние сервисы для автоматизации процессов рекрутинга</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Icon name="Mail" className="text-blue-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Email уведомления</CardTitle>
                      <CardDescription>SendGrid / Mailgun</CardDescription>
                    </div>
                    <Badge variant="secondary">Активна</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Автоматическая отправка уведомлений сотрудникам и кандидатам</p>
                  <Button variant="outline" size="sm" className="w-full">Настроить</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <Icon name="MessageSquare" className="text-green-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Slack интеграция</CardTitle>
                      <CardDescription>Уведомления в Slack</CardDescription>
                    </div>
                    <Badge variant="outline">Не подключена</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Получайте уведомления о новых рекомендациях в Slack</p>
                  <Button size="sm" className="w-full">Подключить</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Icon name="Calendar" className="text-purple-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Календарь</CardTitle>
                      <CardDescription>Google Calendar / Outlook</CardDescription>
                    </div>
                    <Badge variant="outline">Не подключена</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Синхронизация собеседований с календарем</p>
                  <Button size="sm" className="w-full">Подключить</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Icon name="FileText" className="text-orange-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">ATS системы</CardTitle>
                      <CardDescription>BambooHR / Greenhouse</CardDescription>
                    </div>
                    <Badge variant="outline">Не подключена</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Интеграция с вашей системой управления персоналом</p>
                  <Button size="sm" className="w-full">Подключить</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                      <Icon name="Link" className="text-red-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Webhook API</CardTitle>
                      <CardDescription>Собственная интеграция</CardDescription>
                    </div>
                    <Badge variant="outline">Не подключена</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Подключите свои системы через Webhook</p>
                  <Button size="sm" className="w-full">Настроить</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Icon name="Smartphone" className="text-yellow-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">SMS уведомления</CardTitle>
                      <CardDescription>Twilio / SMS.ru</CardDescription>
                    </div>
                    <Badge variant="outline">Не подключена</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Отправка SMS кандидатам и сотрудникам</p>
                  <Button size="sm" className="w-full">Подключить</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пригласить сотрудника</DialogTitle>
            <DialogDescription>Отправьте ссылку для регистрации сотрудника в системе</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Реферальная ссылка компании</Label>
              <div className="flex gap-2 mt-2">
                <Input value={inviteLink} readOnly />
                <Button onClick={() => navigator.clipboard.writeText(inviteLink)}>
                  <Icon name="Copy" size={18} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Отправьте эту ссылку сотрудникам для регистрации в системе
              </p>
            </div>
            <Separator />
            <div>
              <Label>Или отправьте приглашение на email</Label>
              <div className="flex gap-2 mt-2">
                <Input type="email" placeholder="email@example.com" />
                <Button>Отправить</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompanySettingsDialog} onOpenChange={setShowCompanySettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Настройки профиля компании</DialogTitle>
            <DialogDescription>Управляйте информацией о вашей компании</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="company-name-edit">Название компании</Label>
              <Input id="company-name-edit" defaultValue="Acme Tech" />
            </div>
            <div>
              <Label htmlFor="company-logo">Логотип</Label>
              <Input id="company-logo" type="file" accept="image/*" />
            </div>
            <div>
              <Label htmlFor="company-desc">Описание</Label>
              <Textarea id="company-desc" rows={3} placeholder="Расскажите о вашей компании..." />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-website">Веб-сайт</Label>
                <Input id="company-website" placeholder="https://example.com" />
              </div>
              <div>
                <Label htmlFor="company-industry">Отрасль</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите отрасль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">IT и технологии</SelectItem>
                    <SelectItem value="finance">Финансы</SelectItem>
                    <SelectItem value="retail">Розничная торговля</SelectItem>
                    <SelectItem value="manufacturing">Производство</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full">Сохранить изменения</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Чат с {activeChatEmployee?.name}</DialogTitle>
            <DialogDescription>{activeChatEmployee?.position}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-4 py-2`}>
                  <div className="text-xs opacity-70 mb-1">{msg.senderName}</div>
                  <div className="text-sm">{msg.message}</div>
                  <div className="text-xs opacity-70 mt-1">{msg.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Input 
              placeholder="Введите сообщение..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}>
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить сотрудника?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить {employeeToDelete?.name} из компании?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="AlertTriangle" className="text-destructive mt-0.5" size={20} />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-destructive mb-1">Внимание!</p>
                  <p className="text-muted-foreground">
                    Это действие нельзя отменить. Сотрудник потеряет доступ к системе, но его рекомендации и статистика сохранятся.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setEmployeeToDelete(null);
                }}
              >
                Отмена
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setEmployeeToDelete(null);
                }}
              >
                <Icon name="Trash2" className="mr-2" size={16} />
                Удалить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Управление подпиской</DialogTitle>
            <DialogDescription>Ваш текущий тарифный план</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>До 300 сотрудников</CardTitle>
                  <Badge variant={subscriptionDaysLeft < 7 ? 'destructive' : 'secondary'}>
                    {subscriptionDaysLeft} дней осталось
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">19 900 ₽ / мес</div>
                <Progress value={(subscriptionDaysLeft / 30) * 100} className="h-2" />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={16} />
                    <span>Неограниченные вакансии</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={16} />
                    <span>API интеграция</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={16} />
                    <span>Аналитика и отчёты</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button className="w-full" size="lg">
                <Icon name="CreditCard" className="mr-2" size={18} />
                Продлить подписку
              </Button>
              <Button variant="outline" className="w-full">
                Изменить тарифный план
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground">
                История платежей
              </Button>
            </div>

            {subscriptionDaysLeft < 7 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="AlertTriangle" className="text-destructive mt-0.5" size={20} />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-destructive mb-1">Подписка заканчивается!</p>
                    <p className="text-muted-foreground">
                      Продлите подписку, чтобы не потерять доступ к функциям платформы
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Уведомления</DialogTitle>
            <DialogDescription>Последние обновления и события</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-4 max-h-[500px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Bell" size={48} className="mx-auto mb-2 opacity-20" />
                <p>Нет новых уведомлений</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Card 
                  key={notif.id} 
                  className={`cursor-pointer transition-all ${!notif.read ? 'bg-primary/5 border-primary/20' : ''}`}
                  onClick={() => {
                    setNotifications(notifications.map(n => 
                      n.id === notif.id ? { ...n, read: true } : n
                    ));
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        notif.type === 'recommendation' ? 'bg-blue-100' :
                        notif.type === 'subscription' ? 'bg-orange-100' :
                        'bg-green-100'
                      }`}>
                        <Icon 
                          name={
                            notif.type === 'recommendation' ? 'UserPlus' :
                            notif.type === 'subscription' ? 'CreditCard' :
                            'CheckCircle'
                          } 
                          className={
                            notif.type === 'recommendation' ? 'text-blue-600' :
                            notif.type === 'subscription' ? 'text-orange-600' :
                            'text-green-600'
                          }
                          size={20} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.date).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="pt-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
            >
              Отметить все как прочитанные
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderEmployeeDashboard = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setUserRole('guest')}>
            <Icon name="Rocket" className="text-primary" size={28} />
            <span className="text-xl font-bold">RefStaff</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotificationsDialog(true)}>
              <Icon name="Bell" size={20} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setShowCompanyProfileDialog(true)}>
              <Icon name="Building2" className="mr-2" size={18} />
              О компании
            </Button>
            <Button variant="ghost" onClick={handleOpenChat} className="relative">
              <Icon name="MessageCircle" className="mr-2" size={18} />
              Чат с HR
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadMessagesCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={handleLogout}>Выход</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>АС</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl">Анна Смирнова</CardTitle>
                  <CardDescription>Tech Lead • Разработка</CardDescription>
                </div>
                <Button variant="outline">Редактировать</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Уровень 5</span>
                    <span className="text-muted-foreground">250 / 500 XP</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">12</div>
                    <div className="text-xs text-muted-foreground">Рекомендаций</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">4</div>
                    <div className="text-xs text-muted-foreground">Нанято</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">120К ₽</div>
                    <div className="text-xs text-muted-foreground">Заработано</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Wallet" className="text-primary" size={24} />
                Кошелек
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Доступно для вывода</div>
                <div className="text-3xl font-bold text-green-600">60 000 ₽</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Ожидает разблокировки</div>
                <div className="text-2xl font-bold text-muted-foreground">60 000 ₽</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Icon name="Clock" size={12} className="inline mr-1" />
                  Разблокируется через 18 дней
                </p>
              </div>
              <Button className="w-full" variant="outline">
                <Icon name="Download" className="mr-2" size={16} />
                Вывести средства
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="vacancies" className="space-y-6">
          <TabsList>
            <TabsTrigger value="vacancies">Вакансии</TabsTrigger>
            <TabsTrigger value="my-recommendations">Мои рекомендации</TabsTrigger>
            <TabsTrigger value="achievements">Достижения</TabsTrigger>
            <TabsTrigger value="wallet-history">История кошелька</TabsTrigger>
          </TabsList>

          <TabsContent value="vacancies" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Открытые вакансии</h2>
            </div>

            <div className="grid gap-4">
              {vacancies.map((vacancy) => (
                <Card key={vacancy.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{vacancy.title}</CardTitle>
                        <CardDescription>{vacancy.department}</CardDescription>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button onClick={() => setActiveVacancy(vacancy)}>
                            <Icon name="UserPlus" className="mr-2" size={18} />
                            Рекомендовать
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Рекомендовать кандидата</DialogTitle>
                            <DialogDescription>
                              Вакансия: {activeVacancy?.title}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label htmlFor="candidate-name">ФИО кандидата</Label>
                              <Input id="candidate-name" placeholder="Иван Иванов" />
                            </div>
                            <div>
                              <Label htmlFor="candidate-email">Email</Label>
                              <Input id="candidate-email" type="email" placeholder="ivan@example.com" />
                            </div>
                            <div>
                              <Label htmlFor="candidate-phone">Телефон</Label>
                              <Input id="candidate-phone" placeholder="+7 (999) 123-45-67" />
                            </div>
                            <div>
                              <Label htmlFor="candidate-resume">Резюме (DOC, DOCX, PDF)</Label>
                              <Input id="candidate-resume" type="file" accept=".doc,.docx,.pdf" />
                            </div>
                            <div>
                              <Label htmlFor="comment">Комментарий</Label>
                              <Textarea id="comment" placeholder="Почему этот кандидат подходит..." rows={3} />
                            </div>
                            <div className="bg-primary/10 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Icon name="Award" className="text-primary" size={20} />
                                <span className="font-medium">Вознаграждение за успешный найм</span>
                              </div>
                              <div className="text-2xl font-bold text-primary">{activeVacancy?.reward.toLocaleString()} ₽</div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {activeVacancy?.payoutDelayDays === 0 
                                  ? 'Выплата сразу после найма'
                                  : `Выплата через ${activeVacancy?.payoutDelayDays} ${activeVacancy?.payoutDelayDays === 1 ? 'день' : (activeVacancy?.payoutDelayDays ?? 0) < 5 ? 'дня' : 'дней'} после найма`
                                }
                              </p>
                            </div>
                            <Button className="w-full">Отправить рекомендацию</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Wallet" size={16} className="text-muted-foreground" />
                          <span>{vacancy.salary}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Users" size={16} className="text-muted-foreground" />
                          <span>{vacancy.recommendations} рекомендаций</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <Icon name="Award" size={16} />
                          <span className="font-medium">{vacancy.reward.toLocaleString()} ₽ за найм</span>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <Label className="text-xs text-muted-foreground">Реферальная ссылка для рекомендаций</Label>
                        <div className="flex gap-2">
                          <Input value={vacancy.referralLink} readOnly className="text-xs flex-1" />
                          <Button size="sm" variant="outline" onClick={() => {
                            navigator.clipboard.writeText(vacancy.referralLink || '');
                          }}>
                            <Icon name="Copy" size={16} />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                            const text = `Привет! Смотри, есть отличная вакансия "${vacancy.title}" в нашей компании. Зарплата ${vacancy.salary}. Вот ссылка: ${vacancy.referralLink}`;
                            const url = `https://t.me/share/url?url=${encodeURIComponent(vacancy.referralLink || '')}&text=${encodeURIComponent(text)}`;
                            window.open(url, '_blank');
                          }}>
                            <Icon name="Send" size={16} className="mr-1" />
                            Telegram
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                            const text = `Привет! Смотри, есть отличная вакансия "${vacancy.title}" в нашей компании. Зарплата ${vacancy.salary}. Вот ссылка: ${vacancy.referralLink}`;
                            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                            window.open(url, '_blank');
                          }}>
                            <Icon name="MessageCircle" size={16} className="mr-1" />
                            WhatsApp
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                            const text = `Привет! Смотри, есть отличная вакансия "${vacancy.title}" в нашей компании. Зарплата ${vacancy.salary}. Вот ссылка: ${vacancy.referralLink}`;
                            navigator.clipboard.writeText(text);
                          }}>
                            <Icon name="Share2" size={16} className="mr-1" />
                            Копировать
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Отправьте эту ссылку знакомым, которые ищут работу</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-recommendations" className="space-y-4">
            <h2 className="text-2xl font-semibold">Мои рекомендации</h2>
            <div className="grid gap-4">
              {recommendations.slice(0, 2).map((rec) => (
                <Card key={rec.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{rec.candidateName}</CardTitle>
                        <CardDescription>{rec.vacancy}</CardDescription>
                      </div>
                      <Badge variant={
                        rec.status === 'accepted' ? 'default' : 
                        rec.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }>
                        {rec.status === 'accepted' ? 'Принят' : 
                         rec.status === 'rejected' ? 'Отклонён' : 
                         'На рассмотрении'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Icon name="Calendar" size={16} />
                        <span>{new Date(rec.date).toLocaleDateString('ru-RU')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Award" size={16} />
                        <span>{rec.reward.toLocaleString()} ₽</span>
                      </div>
                      {rec.status === 'accepted' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Icon name="Clock" size={16} />
                          <span>Разблокировка через 25 дней</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <h2 className="text-2xl font-semibold">Достижения</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Icon name="Star" className="text-yellow-600" size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-lg">Первая рекомендация</div>
                      <div className="text-sm text-muted-foreground">Получено 10.11.2025</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <Icon name="Target" className="text-green-600" size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-lg">Меткий глаз</div>
                      <div className="text-sm text-muted-foreground">3 успешных найма</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="opacity-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                      <Icon name="Award" className="text-purple-600" size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-lg">Рекрутер месяца</div>
                      <div className="text-sm text-muted-foreground">2/5 наймов</div>
                      <Progress value={40} className="h-1 mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="opacity-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <Icon name="Crown" className="text-blue-600" size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-lg">Золотой рекрутер</div>
                      <div className="text-sm text-muted-foreground">4/10 успешных наймов</div>
                      <Progress value={40} className="h-1 mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="wallet-history" className="space-y-4">
            <h2 className="text-2xl font-semibold">История кошелька</h2>
            <div className="space-y-3">
              {[
                { id: 1, type: 'pending', amount: 30000, desc: 'Вознаграждение за рекомендацию Елены Новиковой', date: '08.11.2025', unlockDate: '08.12.2025' },
                { id: 2, type: 'pending', amount: 30000, desc: 'Вознаграждение за рекомендацию Алексея Козлова', date: '10.11.2025', unlockDate: '10.12.2025' },
                { id: 3, type: 'earned', amount: 30000, desc: 'Вознаграждение за рекомендацию Ивана Петрова', date: '01.10.2025', unlockDate: '01.11.2025' },
                { id: 4, type: 'earned', amount: 30000, desc: 'Вознаграждение за рекомендацию Марии Сидоровой', date: '15.09.2025', unlockDate: '15.10.2025' },
              ].map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'pending' ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          <Icon name={transaction.type === 'pending' ? 'Clock' : 'CheckCircle'} 
                                className={transaction.type === 'pending' ? 'text-yellow-600' : 'text-green-600'} 
                                size={20} />
                        </div>
                        <div>
                          <div className="font-medium">{transaction.desc}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.date} 
                            {transaction.type === 'pending' && ` • Разблокировка ${transaction.unlockDate}`}
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        transaction.type === 'pending' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        +{transaction.amount.toLocaleString()} ₽
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showCompanyProfileDialog} onOpenChange={setShowCompanyProfileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Профиль компании</DialogTitle>
            <DialogDescription>Информация о вашей компании</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="Building2" className="text-primary" size={40} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">Acme Tech</h3>
                <p className="text-muted-foreground">IT и технологии</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">О компании</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Мы ведущая технологическая компания, специализирующаяся на разработке инновационных решений для бизнеса. 
                  Наша команда состоит из 500+ профессионалов по всему миру.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Веб-сайт</Label>
                  <a href="https://acme-tech.com" target="_blank" className="text-sm text-primary hover:underline mt-1 flex items-center gap-1">
                    acme-tech.com
                    <Icon name="ExternalLink" size={14} />
                  </a>
                </div>
                <div>
                  <Label className="text-sm font-medium">Количество сотрудников</Label>
                  <p className="text-sm text-muted-foreground mt-1">500+</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Открытые вакансии</Label>
                <p className="text-sm text-muted-foreground mt-1">{vacancies.length} активных вакансий</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Чат с HR отделом</DialogTitle>
            <DialogDescription>Задайте вопросы о рекомендациях и вакансиях</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-4 py-2`}>
                  <div className="text-xs opacity-70 mb-1">{msg.senderName}</div>
                  <div className="text-sm">{msg.message}</div>
                  <div className="text-xs opacity-70 mt-1">{msg.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Input 
              placeholder="Введите сообщение..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}>
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Уведомления</DialogTitle>
            <DialogDescription>Последние обновления и события</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-4 max-h-[500px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Bell" size={48} className="mx-auto mb-2 opacity-20" />
                <p>Нет новых уведомлений</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Card 
                  key={notif.id} 
                  className={`cursor-pointer transition-all ${!notif.read ? 'bg-primary/5 border-primary/20' : ''}`}
                  onClick={() => {
                    setNotifications(notifications.map(n => 
                      n.id === notif.id ? { ...n, read: true } : n
                    ));
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        notif.type === 'recommendation' ? 'bg-blue-100' :
                        notif.type === 'subscription' ? 'bg-orange-100' :
                        'bg-green-100'
                      }`}>
                        <Icon 
                          name={
                            notif.type === 'recommendation' ? 'UserPlus' :
                            notif.type === 'subscription' ? 'CreditCard' :
                            'CheckCircle'
                          } 
                          className={
                            notif.type === 'recommendation' ? 'text-blue-600' :
                            notif.type === 'subscription' ? 'text-orange-600' :
                            'text-green-600'
                          }
                          size={20} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.date).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="pt-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
            >
              Отметить все как прочитанные
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <>
      {userRole === 'guest' && renderLandingPage()}
      {userRole === 'employer' && renderEmployerDashboard()}
      {userRole === 'employee' && renderEmployeeDashboard()}
    </>
  );
}

export default Index;