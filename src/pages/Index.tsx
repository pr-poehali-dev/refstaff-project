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
import { api, type Vacancy as ApiVacancy, type Employee as ApiEmployee, type Recommendation as ApiRecommendation, type Company, type WalletData } from '@/lib/api';
import type { UserRole, Vacancy, Employee, Recommendation, ChatMessage, NewsPost, NewsComment, PayoutRequest } from '@/types';
import { EmployeeDetail } from '@/components/EmployeeDetail';
import { PayoutRequests } from '@/components/PayoutRequests';

function Index() {
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const saved = localStorage.getItem('userRole');
      return (saved as UserRole) || 'guest';
    }
    return 'guest';
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [activeVacancy, setActiveVacancy] = useState<Vacancy | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCompanySettingsDialog, setShowCompanySettingsDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [activeChatEmployee, setActiveChatEmployee] = useState<Employee | null>(null);
  const [showCompanyProfileDialog, setShowCompanyProfileDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, senderId: 1, senderName: 'HR Manager', message: 'Здравствуйте! Как дела с рекомендациями?', timestamp: '10:30', isOwn: false },
    { id: 2, senderId: 2, senderName: 'Вы', message: 'Отлично! У меня есть кандидат на вакансию Frontend Developer', timestamp: '10:32', isOwn: true },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [newReward, setNewReward] = useState('30000');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(2);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false);
  const [employeeEditForm, setEmployeeEditForm] = useState({
    firstName: '',
    lastName: '',
    position: '',
    department: ''
  });
  const [showIntegrationsDialog, setShowIntegrationsDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  const [subscriptionDaysLeft, setSubscriptionDaysLeft] = useState(12);
  const [notifications, setNotifications] = useState<Array<{id: number; type: string; message: string; date: string; read: boolean}>>([
    { id: 1, type: 'recommendation', message: 'Новая рекомендация от Анны Смирновой', date: '2025-11-13', read: false },
    { id: 2, type: 'subscription', message: 'Подписка заканчивается через 12 дней', date: '2025-11-13', read: false },
    { id: 3, type: 'hire', message: 'Кандидат Елена Новикова принята', date: '2025-11-12', read: true },
  ]);
  
  const currentEmployeeId = 1;
  const currentCompanyId = 1;
  
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  
  const [vacancyForm, setVacancyForm] = useState({
    title: '',
    department: '',
    salary: '',
    requirements: '',
    reward: '30000',
    payoutDelay: '30'
  });
  
  const [recommendationForm, setRecommendationForm] = useState({
    name: '',
    email: '',
    phone: '',
    comment: ''
  });

  const [registerForm, setRegisterForm] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    inn: '',
    employeeCount: '50'
  });

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: 'Анна',
    lastName: 'Смирнова',
    position: 'Tech Lead',
    department: 'Разработка'
  });

  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    position: '',
    department: ''
  });

  const [vacancyFilter, setVacancyFilter] = useState({
    search: '',
    department: 'all',
    status: 'all'
  });

  const [referralLink, setReferralLink] = useState('');
  const [showReferralLinkDialog, setShowReferralLinkDialog] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState<Recommendation | null>(null);
  const [showRecommendationDetailsDialog, setShowRecommendationDetailsDialog] = useState(false);
  const [loginType, setLoginType] = useState<'employer' | 'employee'>('employer');

  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([
    { 
      id: 1, 
      title: 'Добро пожаловать в реферальную программу!', 
      content: 'Мы рады запустить новую систему вознаграждений за рекомендацию кандидатов. Теперь вы можете зарабатывать бонусы, помогая компании находить лучшие таланты.', 
      author: 'HR Отдел', 
      date: '2025-11-10',
      category: 'announcement',
      likes: 12,
      comments: [
        { id: 1, newsId: 1, authorName: 'Анна Смирнова', comment: 'Отличная инициатива!', date: '2025-11-11' }
      ]
    },
    { 
      id: 2, 
      title: 'Наша команда выросла до 50 человек!', 
      content: 'Благодаря вашим рекомендациям, наша команда достигла важной отметки. Спасибо всем за активное участие в программе!', 
      author: 'Руководство', 
      date: '2025-11-08',
      category: 'achievement',
      likes: 25,
      comments: []
    },
    { 
      id: 3, 
      title: 'Новые вакансии в отделе разработки', 
      content: 'Открыты 5 новых позиций для frontend и backend разработчиков. Повышенное вознаграждение - до 50 000 ₽ за успешный найм!', 
      author: 'Отдел разработки', 
      date: '2025-11-05',
      category: 'news',
      likes: 8,
      comments: []
    }
  ]);
  const [showCreateNewsDialog, setShowCreateNewsDialog] = useState(false);
  const [showEditNewsDialog, setShowEditNewsDialog] = useState(false);
  const [newsToEdit, setNewsToEdit] = useState<NewsPost | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    category: 'news' as 'news' | 'achievement' | 'announcement' | 'blog'
  });
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [activeNewsPost, setActiveNewsPost] = useState<NewsPost | null>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (userRole !== 'guest') {
      localStorage.setItem('userRole', userRole);
    }
  }, [userRole]);

  useEffect(() => {
    if (authToken && userRole !== 'guest') {
      verifyToken();
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/acbe95f3-fa47-4ba2-bd00-aba68c67fafa', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'X-Auth-Token': authToken || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      handleLogout();
    }
  };

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из системы?')) {
      localStorage.removeItem('userRole');
      localStorage.removeItem('authToken');
      setUserRole('guest');
      setAuthToken(null);
      setCurrentUser(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  useEffect(() => {
    if (userRole === 'employer' || userRole === 'employee') {
      loadData();
    }
  }, [userRole]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const vacancyStatus = userRole === 'employer' ? 'all' : 'active';
      const [vacanciesData, employeesData, recommendationsData, companyData, payoutsData] = await Promise.all([
        api.getVacancies(currentCompanyId, vacancyStatus).catch(() => []),
        api.getEmployees(currentCompanyId).catch(() => []),
        api.getRecommendations(currentCompanyId).catch(() => []),
        api.getCompany(currentCompanyId).catch(() => null),
        userRole === 'employer' 
          ? fetch(`https://functions.poehali.dev/f88ab2cf-1304-40dd-82e4-a7a1f7358901?company_id=${currentCompanyId}`)
              .then(res => res.json()).catch(() => [])
          : Promise.resolve([])
      ]);

      const mappedVacancies: Vacancy[] = vacanciesData.map((v: ApiVacancy) => ({
        id: v.id,
        title: v.title,
        department: v.department,
        salary: v.salary_display,
        status: v.status,
        recommendations: v.recommendations_count || 0,
        reward: v.reward_amount,
        payoutDelayDays: v.payout_delay_days || 30,
        referralLink: v.referral_token ? `${window.location.origin}/r/${v.referral_token}?ref=${currentEmployeeId}` : ''
      }));

      const mappedEmployees: Employee[] = employeesData.map((e: ApiEmployee) => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name}`,
        position: e.position,
        department: e.department,
        avatar: e.avatar_url || '',
        recommendations: e.total_recommendations,
        hired: e.successful_hires,
        earnings: Number(e.total_earnings),
        level: e.level,
        email: e.email,
        phone: e.phone
      }));

      const mappedRecommendations: Recommendation[] = recommendationsData.map((r: ApiRecommendation) => ({
        id: r.id,
        candidateName: r.candidate_name,
        candidateEmail: r.candidate_email,
        candidatePhone: r.candidate_phone,
        vacancy: r.vacancy_title || '',
        vacancyTitle: r.vacancy_title || '',
        status: r.status as 'pending' | 'interview' | 'hired' | 'rejected',
        date: new Date(r.created_at).toISOString().split('T')[0],
        reward: r.reward_amount,
        recommendedBy: r.recommended_by_name,
        employeeId: r.recommended_by,
        comment: r.comment
      }));

      setVacancies(mappedVacancies);
      setEmployees(mappedEmployees);
      setRecommendations(mappedRecommendations);
      setCompany(companyData);
      
      if (userRole === 'employer' && Array.isArray(payoutsData)) {
        const mappedPayouts: PayoutRequest[] = payoutsData.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          userName: p.user_name,
          userEmail: p.user_email,
          amount: parseFloat(p.amount),
          status: p.status,
          paymentMethod: p.payment_method,
          paymentDetails: p.payment_details,
          adminComment: p.admin_comment,
          createdAt: p.created_at,
          reviewedAt: p.reviewed_at,
          reviewedBy: p.reviewed_by
        }));
        setPayoutRequests(mappedPayouts);
      }

      if (userRole === 'employee') {
        const wallet = await api.getWallet(currentEmployeeId).catch(() => null);
        setWalletData(wallet);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEmployeeRank = (emp: Employee) => {
    const sortedEmployees = [...employees].sort((a, b) => {
      if (b.hired !== a.hired) return b.hired - a.hired;
      if (b.recommendations !== a.recommendations) return b.recommendations - a.recommendations;
      return b.earnings - a.earnings;
    });
    return sortedEmployees.findIndex(e => e.id === emp.id) + 1;
  };

  const handleCreateVacancy = async () => {
    if (!vacancyForm.title || !vacancyForm.department || !vacancyForm.salary) {
      alert('Заполните обязательные поля');
      return;
    }
    
    try {
      await api.createVacancy({
        company_id: currentCompanyId,
        title: vacancyForm.title,
        department: vacancyForm.department,
        salary_display: vacancyForm.salary,
        requirements: vacancyForm.requirements,
        reward_amount: parseInt(vacancyForm.reward),
        payout_delay_days: parseInt(vacancyForm.payoutDelay),
        created_by: currentEmployeeId
      });
      await loadData();
      setVacancyForm({ title: '', department: '', salary: '', requirements: '', reward: '30000', payoutDelay: '30' });
      alert('Вакансия успешно создана!');
    } catch (error) {
      console.error('Ошибка создания вакансии:', error);
      alert('Не удалось создать вакансию');
    }
  };

  const handleCreateRecommendation = async (data: { vacancyId: number; name: string; email: string; phone: string; comment: string }) => {
    if (!data.name || !data.email) {
      alert('Заполните обязательные поля: ФИО и Email');
      return;
    }
    
    try {
      await api.createRecommendation({
        vacancy_id: data.vacancyId,
        recommended_by: currentEmployeeId,
        candidate_name: data.name,
        candidate_email: data.email,
        candidate_phone: data.phone,
        comment: data.comment
      });
      await loadData();
      setRecommendationForm({ name: '', email: '', phone: '', comment: '' });
      alert('Рекомендация успешно отправлена!');
    } catch (error) {
      console.error('Ошибка создания рекомендации:', error);
      alert('Не удалось отправить рекомендацию');
    }
  };

  const handleUpdateRecommendationStatus = async (id: number, status: string) => {
    try {
      await api.updateRecommendationStatus(id, status);
      await loadData();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('Не удалось обновить статус рекомендации');
    }
  };

  const handleDeleteEmployee = async (userId: number) => {
    try {
      await api.deleteEmployee(userId);
      await loadData();
      setShowDeleteDialog(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Ошибка удаления сотрудника:', error);
      alert('Не удалось удалить сотрудника');
    }
  };

  const handleUpdateVacancy = async () => {
    if (!activeVacancy || !vacancyForm.title || !vacancyForm.department || !vacancyForm.salary) {
      alert('Заполните обязательные поля');
      return;
    }
    
    try {
      await api.updateVacancy(activeVacancy.id, {
        title: vacancyForm.title,
        department: vacancyForm.department,
        salary_display: vacancyForm.salary,
        requirements: vacancyForm.requirements,
        reward_amount: parseInt(vacancyForm.reward),
        payout_delay_days: parseInt(vacancyForm.payoutDelay)
      });
      await loadData();
      setActiveVacancy(null);
      setVacancyForm({ title: '', department: '', salary: '', requirements: '', reward: '30000', payoutDelay: '30' });
      alert('Вакансия успешно обновлена!');
    } catch (error) {
      console.error('Ошибка обновления вакансии:', error);
      alert('Не удалось обновить вакансию');
    }
  };

  const handleCloseVacancy = async (vacancyId: number) => {
    try {
      await api.updateVacancy(vacancyId, { status: 'closed' });
      await loadData();
      alert('Вакансия закрыта');
    } catch (error) {
      console.error('Ошибка закрытия вакансии:', error);
      alert('Не удалось закрыть вакансию');
    }
  };

  const handleArchiveVacancy = async (vacancyId: number) => {
    try {
      await api.updateVacancy(vacancyId, { status: 'archived' });
      await loadData();
      alert('Вакансия перенесена в архив');
    } catch (error) {
      console.error('Ошибка архивирования вакансии:', error);
      alert('Не удалось архивировать вакансию');
    }
  };

  const handleDeleteVacancy = async (vacancyId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить вакансию? Это действие нельзя отменить.')) {
      return;
    }
    try {
      await api.deleteVacancy(vacancyId);
      await loadData();
      alert('Вакансия удалена');
    } catch (error) {
      console.error('Ошибка удаления вакансии:', error);
      alert('Не удалось удалить вакансию');
    }
  };

  const handleGenerateReferralLink = () => {
    const token = Math.random().toString(36).substring(2, 15);
    const link = `${window.location.origin}/employee-register?company=${currentCompanyId}&token=${token}`;
    setReferralLink(link);
    setShowReferralLinkDialog(true);
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Ссылка скопирована в буфер обмена');
  };

  const handleUpdateProfile = async () => {
    try {
      await api.updateEmployee(currentEmployeeId, {
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        position: profileForm.position,
        department: profileForm.department
      });
      await loadData();
      setShowEditProfileDialog(false);
      alert('Профиль успешно обновлён!');
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      alert('Не удалось обновить профиль');
    }
  };

  const handleUpdateEmployeeData = async () => {
    if (!employeeToEdit) return;
    
    try {
      await api.updateEmployee(employeeToEdit.id, {
        first_name: employeeEditForm.firstName,
        last_name: employeeEditForm.lastName,
        position: employeeEditForm.position,
        department: employeeEditForm.department
      });
      await loadData();
      setShowEditEmployeeDialog(false);
      setEmployeeToEdit(null);
      alert('Данные сотрудника обновлены!');
    } catch (error) {
      console.error('Ошибка обновления данных сотрудника:', error);
      alert('Не удалось обновить данные сотрудника');
    }
  };

  const handleInviteEmployee = async () => {
    if (!inviteForm.firstName || !inviteForm.lastName || !inviteForm.email || !inviteForm.password || !inviteForm.position || !inviteForm.department) {
      alert('Заполните все обязательные поля');
      return;
    }

    if (inviteForm.password.length < 8) {
      alert('Пароль должен быть минимум 8 символов');
      return;
    }

    if (!authToken || !currentUser?.company_id) {
      alert('Ошибка: не найдена информация о компании');
      return;
    }

    setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/acbe95f3-fa47-4ba2-bd00-aba68c67fafa', {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify({
          action: 'invite_employee',
          email: inviteForm.email,
          password: inviteForm.password,
          first_name: inviteForm.firstName,
          last_name: inviteForm.lastName,
          position: inviteForm.position,
          department: inviteForm.department,
          company_id: currentUser.company_id
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Сотрудник успешно добавлен!');
        setShowInviteDialog(false);
        setInviteForm({ firstName: '', lastName: '', email: '', password: '', position: '', department: '' });
        await loadData();
      } else {
        alert(data.error || 'Ошибка создания аккаунта сотрудника');
      }
    } catch (error) {
      console.error('Ошибка создания аккаунта сотрудника:', error);
      alert('Не удалось создать аккаунт сотрудника');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerForm.companyName || !registerForm.firstName || !registerForm.lastName || !registerForm.email || !registerForm.password) {
      alert('Заполните все обязательные поля');
      return;
    }

    if (registerForm.password.length < 8) {
      alert('Пароль должен быть минимум 8 символов');
      return;
    }

    setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/acbe95f3-fa47-4ba2-bd00-aba68c67fafa', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: registerForm.email,
          password: registerForm.password,
          first_name: registerForm.firstName,
          last_name: registerForm.lastName,
          company_name: registerForm.companyName,
          company_inn: registerForm.inn || undefined,
          employee_count: parseInt(registerForm.employeeCount)
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', 'employer');
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setUserRole('employer');
        setShowRegisterDialog(false);
        setRegisterForm({ companyName: '', firstName: '', lastName: '', email: '', password: '', inn: '', employeeCount: '50' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(data.error || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      alert('Не удалось зарегистрироваться');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      alert('Введите email и пароль');
      return;
    }

    setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/acbe95f3-fa47-4ba2-bd00-aba68c67fafa', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginForm.email,
          password: loginForm.password,
          userType: loginType
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        const role = data.user.role === 'admin' ? 'employer' : 'employee';
        localStorage.setItem('userRole', role);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setUserRole(role);
        setShowLoginDialog(false);
        setLoginForm({ email: '', password: '' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(data.error || 'Неверный email или пароль');
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
      alert('Не удалось войти в систему');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCreateNews = () => {
    if (!newsForm.title || !newsForm.content) {
      alert('Заполните все поля');
      return;
    }

    const newPost: NewsPost = {
      id: newsPosts.length + 1,
      title: newsForm.title,
      content: newsForm.content,
      author: company?.name || 'Администратор',
      date: new Date().toISOString().split('T')[0],
      category: newsForm.category,
      likes: 0,
      comments: []
    };

    setNewsPosts([newPost, ...newsPosts]);
    setNewsForm({ title: '', content: '', category: 'news' });
    setShowCreateNewsDialog(false);
    alert('Новость успешно опубликована!');
  };

  const handleUpdateNews = () => {
    if (!newsToEdit || !newsForm.title || !newsForm.content) {
      alert('Заполните все поля');
      return;
    }

    setNewsPosts(newsPosts.map(post => 
      post.id === newsToEdit.id 
        ? { ...post, title: newsForm.title, content: newsForm.content, category: newsForm.category }
        : post
    ));
    setNewsForm({ title: '', content: '', category: 'news' });
    setShowEditNewsDialog(false);
    setNewsToEdit(null);
    alert('Новость успешно обновлена!');
  };

  const handleDeleteNews = (id: number) => {
    setNewsPosts(newsPosts.filter(post => post.id !== id));
    alert('Новость удалена');
  };

  const handleLikeNews = (newsId: number) => {
    setNewsPosts(newsPosts.map(post => 
      post.id === newsId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const handleAddComment = () => {
    if (!activeNewsPost || !newComment.trim()) {
      alert('Напишите комментарий');
      return;
    }

    const comment: NewsComment = {
      id: Date.now(),
      newsId: activeNewsPost.id,
      authorName: 'Анна Смирнова',
      comment: newComment,
      date: new Date().toISOString().split('T')[0]
    };

    setNewsPosts(newsPosts.map(post => 
      post.id === activeNewsPost.id 
        ? { ...post, comments: [...post.comments, comment] }
        : post
    ));

    setNewComment('');
    setActiveNewsPost({ ...activeNewsPost, comments: [...activeNewsPost.comments, comment] });
  };

  const handleDeleteComment = (commentId: number) => {
    if (!activeNewsPost) return;

    setNewsPosts(newsPosts.map(post => 
      post.id === activeNewsPost.id 
        ? { ...post, comments: post.comments.filter(c => c.id !== commentId) }
        : post
    ));

    setActiveNewsPost({
      ...activeNewsPost,
      comments: activeNewsPost.comments.filter(c => c.id !== commentId)
    });
  };

  const renderLandingPage = () => renderLandingPageComponent(
    setShowRegisterDialog,
    setShowLoginDialog,
    setShowAboutDialog,
    setShowPrivacyDialog,
    setShowTermsDialog,
    pricingPeriod,
    setPricingPeriod,
    showRegisterDialog,
    showLoginDialog,
    showAboutDialog,
    showPrivacyDialog,
    showTermsDialog,
    registerForm,
    setRegisterForm,
    loginForm,
    setLoginForm,
    handleRegister,
    handleLogin,
    isAuthLoading
  );

  const renderLandingPageComponent = (
    setShowRegisterDialog: (show: boolean) => void,
    setShowLoginDialog: (show: boolean) => void,
    setShowAboutDialog: (show: boolean) => void,
    setShowPrivacyDialog: (show: boolean) => void,
    setShowTermsDialog: (show: boolean) => void,
    pricingPeriod: 'monthly' | 'yearly',
    setPricingPeriod: (period: 'monthly' | 'yearly') => void,
    showRegisterDialog: boolean,
    showLoginDialog: boolean,
    showAboutDialog: boolean,
    showPrivacyDialog: boolean,
    showTermsDialog: boolean,
    registerForm: any,
    setRegisterForm: (form: any) => void,
    loginForm: any,
    setLoginForm: (form: any) => void,
    handleRegister: () => void,
    handleLogin: () => void,
    isAuthLoading: boolean
  ) => (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-50" role="banner">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Icon name="Rocket" className="text-primary" size={32} aria-hidden="true" />
            <span className="text-2xl font-bold">iHUNT</span>
          </div>
          <nav className="hidden md:flex items-center gap-8" role="navigation" aria-label="Основная навигация">
            <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm hover:text-primary transition-colors">Как работает</button>
            <button onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm hover:text-primary transition-colors">Преимущества</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm hover:text-primary transition-colors">Тарифы</button>
            <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm hover:text-primary transition-colors">Контакты</button>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setShowLoginDialog(true)} aria-label="Войти в систему">Вход</Button>
            <Button onClick={() => setShowRegisterDialog(true)} aria-label="Зарегистрировать компанию" className="text-xs">Зарегистрировать компанию</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-32 pb-20 px-4" aria-labelledby="hero-title">
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <Badge className="mb-6 animate-fade-in">🚀 Реферальный рекрутинг нового поколения</Badge>
                <h1 id="hero-title" className="text-5xl md:text-6xl font-bold mb-6 animate-slide-up bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Нанимайте лучших кандидатов через своих сотрудников
                </h1>
                <p className="text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  Платформа для реферального найма с геймификацией и прозрачной системой вознаграждений
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button size="lg" className="animate-scale-in shadow-lg shadow-primary/25" style={{ animationDelay: '0.2s' }} onClick={() => setShowRegisterDialog(true)} aria-label="Начать бесплатный пробный период на 14 дней">
                    <Icon name="Rocket" className="mr-2" size={20} aria-hidden="true" />
                    Начать бесплатно — 14 дней
                  </Button>
                  <Button size="lg" variant="outline" className="animate-scale-in" style={{ animationDelay: '0.3s' }} onClick={() => setShowLoginDialog(true)}>
                    <Icon name="LogIn" className="mr-2" size={20} />
                    Войти
                  </Button>
                </div>
                <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={18} />
                    <span>Прост в использовании</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={18} />
                    <span>Настройка за 5 минут</span>
                  </div>
                </div>
              </div>
              <div className="relative animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/files/e96124dc-c09c-454b-a967-49eff0e74945.jpg" 
                    alt="Команда сотрудников работает вместе"
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-4 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Icon name="TrendingUp" className="text-green-600" size={24} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">+127%</div>
                      <div className="text-xs text-muted-foreground">эффективность найма</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="py-20 px-4 bg-gradient-to-b from-white to-gray-50" aria-labelledby="how-title">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <Badge className="mb-4">⚡ Простой процесс</Badge>
              <h2 id="how-title" className="text-4xl font-bold mb-4">Как это работает</h2>
              <p className="text-xl text-muted-foreground">Запустите реферальную программу за 4 простых шага</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: 'Building2', emoji: '🏢', title: 'Регистрация', desc: 'Зарегистрируйте компанию и добавьте вакансии', color: 'bg-blue-500' },
                { icon: 'Users', emoji: '👥', title: 'Приглашение', desc: 'Пригласите сотрудников в систему', color: 'bg-green-500' },
                { icon: 'UserPlus', emoji: '🎯', title: 'Рекомендации', desc: 'Сотрудники рекомендуют кандидатов', color: 'bg-purple-500' },
                { icon: 'TrendingUp', emoji: '💰', title: 'Вознаграждение', desc: 'Выплачивайте бонусы за успешный найм', color: 'bg-orange-500' },
              ].map((step, i) => (
                <article key={i} className="relative">
                  <Card className="h-full border-2 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                    <CardHeader>
                      <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center shadow-lg`}>
                        <span className="text-3xl">{step.emoji}</span>
                      </div>
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                      <CardTitle as="h3" className="text-xl">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{step.desc}</p>
                    </CardContent>
                  </Card>
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <Icon name="ArrowRight" className="text-primary" size={24} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="benefits" className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white" aria-labelledby="benefits-title">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <Badge className="mb-4">✨ Почему iHUNT</Badge>
              <h2 id="benefits-title" className="text-4xl font-bold mb-4">Преимущества платформы</h2>
              <p className="text-xl text-muted-foreground">Все инструменты для эффективного реферального найма</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: 'Wallet', emoji: '💵', title: 'Экономия бюджета', desc: 'Снижение затрат на рекрутинг до 70%', gradient: 'from-green-500 to-emerald-500' },
                { icon: 'Zap', emoji: '⚡', title: 'Быстрый найм', desc: 'Сокращение времени закрытия вакансий в 2 раза', gradient: 'from-yellow-500 to-orange-500' },
                { icon: 'Shield', emoji: '🛡️', title: 'Качество кандидатов', desc: 'Рекомендации от проверенных сотрудников', gradient: 'from-blue-500 to-cyan-500' },
                { icon: 'Trophy', emoji: '🏆', title: 'Геймификация', desc: 'Вовлечение сотрудников через достижения', gradient: 'from-purple-500 to-pink-500' },
                { icon: 'BarChart3', emoji: '📊', title: 'Прозрачность', desc: 'Полная статистика и аналитика процесса', gradient: 'from-indigo-500 to-purple-500' },
                { icon: 'Link', emoji: '🔗', title: 'Интеграция', desc: 'API для подключения к вашим системам', gradient: 'from-red-500 to-pink-500' },
              ].map((benefit, i) => (
                <article key={i}>
                  <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full border-2 group">
                    <CardHeader>
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                        <span className="text-3xl">{benefit.emoji}</span>
                      </div>
                      <CardTitle as="h3" className="text-xl">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{benefit.desc}</p>
                    </CardContent>
                  </Card>
                </article>
              ))}
            </div>
            <div className="mt-16">
              <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-2xl font-bold mb-4">🎯 Результаты наших клиентов</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-2xl">📈</span>
                          </div>
                          <div>
                            <div className="font-bold text-xl">+127%</div>
                            <div className="text-sm text-muted-foreground">рост числа рекомендаций</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-2xl">⏱️</span>
                          </div>
                          <div>
                            <div className="font-bold text-xl">-40%</div>
                            <div className="text-sm text-muted-foreground">сокращение времени найма</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-2xl">💎</span>
                          </div>
                          <div>
                            <div className="font-bold text-xl">92%</div>
                            <div className="text-sm text-muted-foreground">прошли испытательный срок</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <img 
                        src="https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/files/ff1c4a57-63e0-4e5e-ab1b-8c592b9d9ac2.jpg" 
                        alt="Статистика и результаты"
                        className="rounded-xl shadow-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 px-4 bg-white" aria-labelledby="pricing-title">
          <div className="container mx-auto max-w-6xl">
            <h2 id="pricing-title" className="text-4xl font-bold text-center mb-4">Тарифы</h2>
            <p className="text-center text-muted-foreground mb-8">14 дней бесплатно для всех новых клиентов</p>
            
            <div className="flex items-center justify-center gap-3 mb-12">
              <Button 
                variant={pricingPeriod === 'monthly' ? 'default' : 'outline'} 
                onClick={() => setPricingPeriod('monthly')}
                className="min-w-[120px]"
              >
                Месяц
              </Button>
              <Button 
                variant={pricingPeriod === 'yearly' ? 'default' : 'outline'} 
                onClick={() => setPricingPeriod('yearly')}
                className="min-w-[120px]"
              >
                Год
                <Badge className="ml-2 bg-green-500 text-white">-20%</Badge>
              </Button>
            </div>
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
                <div className="text-4xl font-bold mb-1">
                  {pricingPeriod === 'monthly' ? '19 900 ₽' : '15 920 ₽'}
                </div>
                <p className="text-sm text-muted-foreground mb-2">в месяц</p>
                {pricingPeriod === 'yearly' && (
                  <p className="text-sm text-green-600 font-medium mb-6">190 800 ₽/год (экономия 47 880 ₽)</p>
                )}
                {pricingPeriod === 'monthly' && <div className="mb-6"></div>}
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
                <div className="text-4xl font-bold mb-1">
                  {pricingPeriod === 'monthly' ? '48 900 ₽' : '39 120 ₽'}
                </div>
                <p className="text-sm text-muted-foreground mb-2">в месяц</p>
                {pricingPeriod === 'yearly' && (
                  <p className="text-sm text-green-600 font-medium mb-6">469 440 ₽/год (экономия 117 360 ₽)</p>
                )}
                {pricingPeriod === 'monthly' && <div className="mb-6"></div>}
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

        <section id="contact" className="py-20 px-4" aria-labelledby="contact-title">
          <div className="container mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle as="h2" id="contact-title" className="text-2xl">Остались вопросы?</CardTitle>
                <CardDescription>Свяжитесь с нами, и мы с радостью ответим</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" aria-label="Форма обратной связи">
                  <div>
                    <Label htmlFor="name">Имя</Label>
                    <Input id="name" name="name" placeholder="Иван Иванов" autoComplete="name" required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="ivan@company.ru" autoComplete="email" required />
                  </div>
                  <div>
                    <Label htmlFor="message">Сообщение</Label>
                    <Textarea id="message" name="message" placeholder="Расскажите о вашем проекте..." rows={4} required />
                  </div>
                  <Button type="submit" className="w-full">Отправить</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t bg-gray-50 py-12 px-4" role="contentinfo">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Rocket" className="text-primary" size={24} />
                <span className="text-lg font-bold">iHUNT</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Платформа реферального рекрутинга с геймификацией
              </p>
            </div>
            <nav aria-label="Продукт">
              <h4 className="font-semibold mb-4">Продукт</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#benefits" className="hover:text-primary">Возможности</a></li>
                <li><a href="#pricing" className="hover:text-primary">Тарифы</a></li>
                <li><a href="#contact" className="hover:text-primary">API документация</a></li>
              </ul>
            </nav>
            <nav aria-label="Компания">
              <h4 className="font-semibold mb-4">Компания</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setShowAboutDialog(true)} className="hover:text-primary">О нас</button></li>
                <li><a href="#contact" className="hover:text-primary">Блог</a></li>
                <li><a href="#contact" className="hover:text-primary">Контакты</a></li>
              </ul>
            </nav>
            <nav aria-label="Правовая информация">
              <h4 className="font-semibold mb-4">Правовая информация</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setShowPrivacyDialog(true)} className="hover:text-primary">Политика конфиденциальности</button></li>
                <li><button onClick={() => setShowTermsDialog(true)} className="hover:text-primary">Пользовательское соглашение</button></li>
              </ul>
            </nav>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 iHUNT. Все права защищены.
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
              <Input 
                id="company-name" 
                placeholder="Acme Corp" 
                value={registerForm.companyName}
                onChange={(e) => setRegisterForm({...registerForm, companyName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="admin-first-name">Имя</Label>
              <Input 
                id="admin-first-name" 
                placeholder="Иван" 
                value={registerForm.firstName}
                onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="admin-last-name">Фамилия</Label>
              <Input 
                id="admin-last-name" 
                placeholder="Иванов" 
                value={registerForm.lastName}
                onChange={(e) => setRegisterForm({...registerForm, lastName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="admin-email">Email</Label>
              <Input 
                id="admin-email" 
                type="email" 
                placeholder="ivan@company.ru" 
                value={registerForm.email}
                onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="admin-password">Пароль</Label>
              <Input 
                id="admin-password" 
                type="password" 
                placeholder="Минимум 8 символов" 
                value={registerForm.password}
                onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="company-inn">ИНН компании (необязательно)</Label>
              <Input 
                id="company-inn" 
                placeholder="1234567890" 
                maxLength={12} 
                value={registerForm.inn}
                onChange={(e) => setRegisterForm({...registerForm, inn: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="employee-count">Количество сотрудников</Label>
              <Input 
                id="employee-count" 
                type="number" 
                placeholder="50" 
                value={registerForm.employeeCount}
                onChange={(e) => setRegisterForm({...registerForm, employeeCount: e.target.value})}
              />
            </div>
            <Button className="w-full" onClick={handleRegister} disabled={isAuthLoading}>
              {isAuthLoading ? 'Регистрация...' : 'Создать аккаунт'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Нажимая кнопку, вы соглашаетесь с{' '}
              <button onClick={() => setShowTermsDialog(true)} className="text-primary hover:underline">условиями использования</button>
              {' '}и{' '}
              <button onClick={() => setShowPrivacyDialog(true)} className="text-primary hover:underline">политикой конфиденциальности</button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Вход в систему</DialogTitle>
            <DialogDescription>Выберите тип аккаунта и войдите</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Тип аккаунта</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button
                  type="button"
                  variant={loginType === 'employer' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setLoginType('employer')}
                >
                  <Icon name="Building2" className="mr-2" size={18} />
                  Компания
                </Button>
                <Button
                  type="button"
                  variant={loginType === 'employee' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setLoginType('employee')}
                >
                  <Icon name="User" className="mr-2" size={18} />
                  Сотрудник
                </Button>
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg border">
              <p className="text-xs font-medium mb-2 flex items-center gap-1">
                <Icon name="Info" size={14} />
                Тестовые данные для входа:
              </p>
              {loginType === 'employer' ? (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Email:</strong> admin@company.ru</p>
                  <p><strong>Пароль:</strong> admin123</p>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Email:</strong> employee@company.ru</p>
                  <p><strong>Пароль:</strong> employee123</p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input 
                id="login-email" 
                type="email" 
                placeholder="ivan@company.ru" 
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="login-password">Пароль</Label>
              <Input 
                id="login-password" 
                type="password" 
                placeholder="Ваш пароль" 
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                Запомнить меня
              </label>
              <a href="#" className="text-sm text-primary hover:underline">Забыли пароль?</a>
            </div>
            <Button className="w-full" onClick={handleLogin} disabled={isAuthLoading}>
              {isAuthLoading ? 'Вход...' : 'Войти'}
            </Button>
            {loginType === 'employer' && (
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
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">О iHUNT</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Наша миссия</h3>
              <p className="text-muted-foreground">
                iHUNT создан для того, чтобы сделать процесс найма персонала максимально эффективным и прозрачным. 
                Мы верим, что лучшие кандидаты приходят по рекомендациям доверенных сотрудников, и наша платформа 
                помогает компаниям использовать этот потенциал на 100%.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Почему мы?</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="Target" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Фокус на результат</h4>
                    <p className="text-sm text-muted-foreground">
                      Наши клиенты сокращают время найма в 2 раза и экономят до 70% бюджета на рекрутинг.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="Users" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Вовлечение сотрудников</h4>
                    <p className="text-sm text-muted-foreground">
                      Геймификация и прозрачная система вознаграждений мотивируют команду активно участвовать в найме.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="Zap" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Простота внедрения</h4>
                    <p className="text-sm text-muted-foreground">
                      Настройка занимает 5 минут. Интуитивный интерфейс не требует обучения.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Наши достижения</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-1">500+</div>
                  <div className="text-sm text-muted-foreground">Компаний используют</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-1">15,000+</div>
                  <div className="text-sm text-muted-foreground">Успешных найма</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-1">4.8/5</div>
                  <div className="text-sm text-muted-foreground">Средняя оценка</div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Свяжитесь с нами</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Icon name="Mail" size={16} className="text-muted-foreground" />
                  <a href="mailto:info@ihunt.ru" className="text-primary hover:underline">info@ihunt.ru</a>
                </p>
                <p className="flex items-center gap-2">
                  <Icon name="Phone" size={16} className="text-muted-foreground" />
                  <a href="tel:+74951234567" className="text-primary hover:underline">+7 (495) 123-45-67</a>
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Политика конфиденциальности</DialogTitle>
            <DialogDescription>Последнее обновление: 14 ноября 2025 г.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4 text-sm">
            <div>
              <h3 className="text-lg font-semibold mb-3">1. Общие положения</h3>
              <p className="text-muted-foreground">
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных 
                пользователей платформы iHUNT (далее — «Платформа»). Используя Платформу, вы соглашаетесь с условиями 
                настоящей Политики.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">2. Какие данные мы собираем</h3>
              <p className="text-muted-foreground mb-2">Мы можем собирать следующие категории персональных данных:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Контактные данные: имя, фамилия, электронная почта, номер телефона</li>
                <li>Данные компании: название, ИНН, количество сотрудников, отрасль</li>
                <li>Данные о вакансиях и рекомендациях кандидатов</li>
                <li>Техническая информация: IP-адрес, тип браузера, операционная система</li>
                <li>Данные об использовании Платформы: активность, статистика взаимодействий</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">3. Цели обработки данных</h3>
              <p className="text-muted-foreground mb-2">Мы обрабатываем ваши персональные данные для:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Предоставления услуг Платформы и их улучшения</li>
                <li>Выполнения договорных обязательств</li>
                <li>Технической поддержки пользователей</li>
                <li>Отправки уведомлений о важных событиях</li>
                <li>Аналитики и улучшения функционала</li>
                <li>Соблюдения законодательных требований</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">4. Защита данных</h3>
              <p className="text-muted-foreground">
                Мы применяем современные технические и организационные меры для защиты ваших данных от несанкционированного 
                доступа, изменения, раскрытия или уничтожения. Данные хранятся на защищенных серверах с использованием 
                шифрования и других методов защиты.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">5. Передача данных третьим лицам</h3>
              <p className="text-muted-foreground">
                Мы не продаем и не передаем ваши персональные данные третьим лицам, за исключением случаев:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                <li>Когда это необходимо для предоставления услуг (например, платежные системы)</li>
                <li>По требованию законодательства или государственных органов</li>
                <li>С вашего явного согласия</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">6. Ваши права</h3>
              <p className="text-muted-foreground mb-2">Вы имеете право:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Запрашивать доступ к своим персональным данным</li>
                <li>Требовать исправления неточных данных</li>
                <li>Запрашивать удаление своих данных</li>
                <li>Отозвать согласие на обработку данных</li>
                <li>Ограничить обработку данных</li>
                <li>Получить копию своих данных</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">7. Cookies</h3>
              <p className="text-muted-foreground">
                Мы используем cookies для улучшения работы Платформы, анализа трафика и персонализации контента. 
                Вы можете настроить параметры cookies в своем браузере.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">8. Изменения в Политике</h3>
              <p className="text-muted-foreground">
                Мы можем периодически обновлять настоящую Политику. О существенных изменениях мы уведомим вас 
                по электронной почте или через Платформу.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">9. Контакты</h3>
              <p className="text-muted-foreground">
                По вопросам обработки персональных данных обращайтесь:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: <a href="mailto:privacy@ihunt.ru" className="text-primary hover:underline">privacy@ihunt.ru</a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Пользовательское соглашение</DialogTitle>
            <DialogDescription>Последнее обновление: 14 ноября 2025 г.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4 text-sm">
            <div>
              <h3 className="text-lg font-semibold mb-3">1. Общие условия</h3>
              <p className="text-muted-foreground">
                Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между iHUNT 
                (далее — «Сервис») и пользователями платформы. Регистрируясь на Платформе, вы подтверждаете, что 
                прочитали, поняли и согласны соблюдать условия настоящего Соглашения.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">2. Предмет Соглашения</h3>
              <p className="text-muted-foreground">
                iHUNT предоставляет онлайн-платформу для организации реферального рекрутинга, включающую:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                <li>Управление вакансиями и кандидатами</li>
                <li>Систему вознаграждений за рекомендации</li>
                <li>Инструменты коммуникации и аналитики</li>
                <li>Интеграцию с внешними сервисами</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">3. Регистрация и учетная запись</h3>
              <p className="text-muted-foreground mb-2">При регистрации вы обязуетесь:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Предоставить достоверные и актуальные данные</li>
                <li>Обеспечить конфиденциальность учетных данных</li>
                <li>Немедленно уведомлять о несанкционированном доступе к аккаунту</li>
                <li>Нести ответственность за все действия, совершенные через вашу учетную запись</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">4. Тарифы и оплата</h3>
              <p className="text-muted-foreground">
                Сервис предоставляет 14-дневный бесплатный пробный период. После окончания пробного периода использование 
                Платформы осуществляется на платной основе согласно выбранному тарифному плану.
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                <li>Оплата производится ежемесячно или ежегодно</li>
                <li>Цены указаны на сайте и могут быть изменены с уведомлением за 30 дней</li>
                <li>Возврат средств возможен в течение 14 дней с момента оплаты</li>
                <li>При просрочке оплаты доступ к Платформе может быть ограничен</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">5. Права и обязанности пользователя</h3>
              <p className="text-muted-foreground mb-2">Пользователь обязуется:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Использовать Платформу в законных целях</li>
                <li>Не нарушать права третьих лиц</li>
                <li>Не распространять вредоносное ПО</li>
                <li>Не создавать несколько аккаунтов для одной компании без согласования</li>
                <li>Соблюдать правила работы с персональными данными кандидатов</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">6. Права и обязанности Сервиса</h3>
              <p className="text-muted-foreground mb-2">iHUNT имеет право:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Изменять функционал Платформы</li>
                <li>Проводить технические работы с уведомлением пользователей</li>
                <li>Ограничить доступ при нарушении условий Соглашения</li>
                <li>Удалить аккаунт при систематических нарушениях</li>
              </ul>
              <p className="text-muted-foreground mt-2 mb-2">iHUNT обязуется:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Обеспечивать доступность Платформы не менее 99% времени</li>
                <li>Защищать персональные данные пользователей</li>
                <li>Предоставлять техническую поддержку</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">7. Интеллектуальная собственность</h3>
              <p className="text-muted-foreground">
                Все права на Платформу, включая код, дизайн, логотипы и контент, принадлежат iHUNT. 
                Использование материалов Платформы без письменного разрешения запрещено.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">8. Ограничение ответственности</h3>
              <p className="text-muted-foreground">
                iHUNT не несет ответственности за:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                <li>Качество и достоверность информации о кандидатах</li>
                <li>Результаты найма персонала</li>
                <li>Действия пользователей на Платформе</li>
                <li>Технические сбои, вызванные внешними факторами</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">9. Расторжение Соглашения</h3>
              <p className="text-muted-foreground">
                Вы можете прекратить использование Платформы в любое время, удалив свою учетную запись. 
                iHUNT может расторгнуть Соглашение при нарушении его условий.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">10. Изменения Соглашения</h3>
              <p className="text-muted-foreground">
                iHUNT оставляет за собой право изменять условия настоящего Соглашения. О существенных изменениях 
                пользователи будут уведомлены за 30 дней.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">11. Применимое право</h3>
              <p className="text-muted-foreground">
                Настоящее Соглашение регулируется законодательством Российской Федерации. Все споры разрешаются 
                путем переговоров, а при невозможности достижения согласия — в судебном порядке.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">12. Контакты</h3>
              <p className="text-muted-foreground">
                По вопросам Соглашения обращайтесь:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: <a href="mailto:legal@ihunt.ru" className="text-primary hover:underline">legal@ihunt.ru</a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderEmployerDashboard = () => {
    const isSubscriptionExpired = company?.subscription_end_date 
      ? new Date(company.subscription_end_date) < new Date() 
      : false;
    
    return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Rocket" className="text-primary" size={28} />
            <span className="text-xl font-bold">iHUNT</span>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <span className="text-4xl">📈</span>
            Личный кабинет работодателя
          </h1>
          <p className="text-muted-foreground">Управляйте вакансиями, сотрудниками и рекомендациями</p>
        </div>

        {isSubscriptionExpired && (
          <Card className="mb-8 bg-destructive/10 border-destructive">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="AlertTriangle" className="text-destructive" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 text-destructive">Подписка истекла</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ваша подписка закончилась. Данные сохранены, но доступ к функционалу ограничен. 
                    Продлите подписку, чтобы продолжить управление вакансиями и рекомендациями.
                  </p>
                  <Button onClick={() => setShowSubscriptionDialog(true)}>
                    <Icon name="CreditCard" className="mr-2" size={18} />
                    Продлить подписку
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Загрузка данных...</p>
            </div>
          </div>
        ) : (
        <Tabs defaultValue="vacancies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto">
            <TabsTrigger value="vacancies">💼 Вакансии</TabsTrigger>
            <TabsTrigger value="employees">👥 Сотрудники</TabsTrigger>
            <TabsTrigger value="recommendations">🎯 Рекомендации</TabsTrigger>
            <TabsTrigger value="payouts">💰 Выплаты</TabsTrigger>
            <TabsTrigger value="news">📢 Новости</TabsTrigger>
            <TabsTrigger value="chats">💬 Чаты</TabsTrigger>
            <TabsTrigger value="stats">📊 Статистика</TabsTrigger>
          </TabsList>

          <TabsContent value="vacancies" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <span>💼</span>
                Вакансии
              </h2>
              <Dialog>
                  <DialogTrigger asChild>
                    <Button disabled={isSubscriptionExpired}>
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
                      <Input 
                        id="vacancy-title" 
                        placeholder="Senior Frontend Developer"
                        value={vacancyForm.title}
                        onChange={(e) => setVacancyForm({...vacancyForm, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Отдел</Label>
                      <Input 
                        id="department" 
                        placeholder="Разработка"
                        value={vacancyForm.department}
                        onChange={(e) => setVacancyForm({...vacancyForm, department: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="salary">Зарплата</Label>
                      <Input 
                        id="salary" 
                        placeholder="250 000 ₽"
                        value={vacancyForm.salary}
                        onChange={(e) => setVacancyForm({...vacancyForm, salary: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reward-amount">Вознаграждение за рекомендацию</Label>
                      <Input 
                        id="reward-amount" 
                        type="number" 
                        placeholder="30000" 
                        value={vacancyForm.reward}
                        onChange={(e) => setVacancyForm({...vacancyForm, reward: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Сумма в рублях, которую получит сотрудник за успешный найм</p>
                    </div>
                    <div>
                      <Label htmlFor="payout-delay">Срок выплаты вознаграждения</Label>
                      <Select 
                        value={vacancyForm.payoutDelay}
                        onValueChange={(value) => setVacancyForm({...vacancyForm, payoutDelay: value})}
                      >
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
                      <Textarea 
                        id="requirements" 
                        placeholder="Опыт работы от 5 лет..." 
                        rows={4}
                        value={vacancyForm.requirements}
                        onChange={(e) => setVacancyForm({...vacancyForm, requirements: e.target.value})}
                      />
                    </div>
                    <Button className="w-full" onClick={handleCreateVacancy}>Создать вакансию</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input 
                  placeholder="Поиск по названию или отделу..."
                  value={vacancyFilter.search}
                  onChange={(e) => setVacancyFilter({...vacancyFilter, search: e.target.value})}
                />
              </div>
              <Select value={vacancyFilter.status} onValueChange={(value) => setVacancyFilter({...vacancyFilter, status: value})}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="closed">Закрытые</SelectItem>
                  <SelectItem value="archived">Архив</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {vacancies.filter(v => {
                const searchMatch = vacancyFilter.search === '' || 
                  v.title.toLowerCase().includes(vacancyFilter.search.toLowerCase()) ||
                  v.department.toLowerCase().includes(vacancyFilter.search.toLowerCase());
                const statusMatch = vacancyFilter.status === 'all' || v.status === vacancyFilter.status;
                return searchMatch && statusMatch;
              }).map((vacancy) => (
                <Card key={vacancy.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{vacancy.title}</CardTitle>
                        <CardDescription>{vacancy.department}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {vacancy.status === 'active' ? 'Активна' : vacancy.status === 'archived' ? 'В архиве' : 'Закрыта'}
                      </Badge>
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
                        <div className="flex gap-2">
                          {vacancy.status !== 'archived' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setActiveVacancy(vacancy);
                                setVacancyForm({
                                  title: vacancy.title,
                                  department: vacancy.department,
                                  salary: vacancy.salary,
                                  requirements: '',
                                  reward: vacancy.reward.toString(),
                                  payoutDelay: vacancy.payoutDelayDays.toString()
                                });
                              }}
                            >
                              Редактировать
                            </Button>
                          )}
                          {vacancy.status === 'active' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleArchiveVacancy(vacancy.id)}
                            >
                              <Icon name="Archive" size={16} className="mr-1" />
                              В архив
                            </Button>
                          )}
                          {vacancy.status === 'archived' && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteVacancy(vacancy.id)}
                            >
                              <Icon name="Trash2" size={16} className="mr-1" />
                              Удалить
                            </Button>
                          )}
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Реферальная ссылка для сотрудников</Label>
                        <div className="flex gap-2">
                          <Input value={vacancy.referralLink || ''} readOnly className="text-xs" />
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(vacancy.referralLink || '')}>
                            <Icon name="Copy" size={16} />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Поделиться вакансией</Label>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const text = `${vacancy.title} — ${vacancy.department}\nЗарплата: ${vacancy.salary}\nВознаграждение за рекомендацию: ${vacancy.reward.toLocaleString()} ₽`;
                              const url = vacancy.referralLink || window.location.href;
                              window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                            }}
                          >
                            <Icon name="Send" size={14} className="mr-1" />
                            Telegram
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const text = `${vacancy.title} — ${vacancy.department}\nЗарплата: ${vacancy.salary}\nВознаграждение: ${vacancy.reward.toLocaleString()} ₽`;
                              const url = vacancy.referralLink || window.location.href;
                              window.open(`https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(vacancy.title)}&description=${encodeURIComponent(text)}`, '_blank');
                            }}
                          >
                            <Icon name="Share2" size={14} className="mr-1" />
                            ВКонтакте
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const text = `${vacancy.title} — ${vacancy.department}. Зарплата: ${vacancy.salary}. Вознаграждение: ${vacancy.reward.toLocaleString()} ₽`;
                              const url = vacancy.referralLink || window.location.href;
                              window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
                            }}
                          >
                            <Icon name="MessageCircle" size={14} className="mr-1" />
                            WhatsApp
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={activeVacancy !== null} onOpenChange={(open) => !open && setActiveVacancy(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Редактировать вакансию</DialogTitle>
                  <DialogDescription>Обновите информацию о вакансии</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="edit-vacancy-title">Название должности</Label>
                    <Input 
                      id="edit-vacancy-title" 
                      value={vacancyForm.title}
                      onChange={(e) => setVacancyForm({...vacancyForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-department">Отдел</Label>
                    <Input 
                      id="edit-department" 
                      value={vacancyForm.department}
                      onChange={(e) => setVacancyForm({...vacancyForm, department: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-salary">Зарплата</Label>
                    <Input 
                      id="edit-salary" 
                      value={vacancyForm.salary}
                      onChange={(e) => setVacancyForm({...vacancyForm, salary: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-reward-amount">Вознаграждение за рекомендацию</Label>
                    <Input 
                      id="edit-reward-amount" 
                      type="number" 
                      value={vacancyForm.reward}
                      onChange={(e) => setVacancyForm({...vacancyForm, reward: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-payout-delay">Срок выплаты вознаграждения</Label>
                    <Select 
                      value={vacancyForm.payoutDelay}
                      onValueChange={(value) => setVacancyForm({...vacancyForm, payoutDelay: value})}
                    >
                      <SelectTrigger id="edit-payout-delay">
                        <SelectValue />
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
                  </div>
                  <div>
                    <Label htmlFor="edit-requirements">Требования</Label>
                    <Textarea 
                      id="edit-requirements" 
                      rows={4}
                      value={vacancyForm.requirements}
                      onChange={(e) => setVacancyForm({...vacancyForm, requirements: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleUpdateVacancy}>Сохранить изменения</Button>
                    {activeVacancy?.status === 'active' && (
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          if (activeVacancy) {
                            handleCloseVacancy(activeVacancy.id);
                            setActiveVacancy(null);
                          }
                        }}
                      >
                        Закрыть вакансию
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <span>👥</span>
                  Сотрудники компании
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Зарегистрировано сотрудников: <span className="font-semibold">{employees.length}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerateReferralLink}>
                  <Icon name="Link" className="mr-2" size={18} />
                  Ссылка для регистрации
                </Button>
                <Button onClick={() => setShowInviteDialog(true)}>
                  <Icon name="UserPlus" className="mr-2" size={18} />
                  Добавить сотрудника
                </Button>
              </div>
            </div>
            <div className="mb-4">
              <Input
                placeholder="Поиск сотрудника по имени, email или должности..."
                value={employeeSearchQuery}
                onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="grid gap-4">
              {employees.filter(emp => 
                employeeSearchQuery === '' || 
                emp.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                emp.position.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                emp.department.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                (emp.email && emp.email.toLowerCase().includes(employeeSearchQuery.toLowerCase()))
              ).map((employee) => (
                <Card 
                  key={employee.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setShowEmployeeDetail(true);
                  }}
                >
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
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveChatEmployee(employee);
                            setShowChatDialog(true);
                          }}
                        >
                          <Icon name="MessageCircle" className="mr-1" size={16} />
                          Написать
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmployeeToEdit(employee);
                            const [firstName, ...lastNameParts] = employee.name.split(' ');
                            setEmployeeEditForm({
                              firstName: firstName,
                              lastName: lastNameParts.join(' '),
                              position: employee.position,
                              department: employee.department
                            });
                            setShowEditEmployeeDialog(true);
                          }}
                        >
                          <Icon name="Edit" size={16} />
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
                          onClick={(e) => {
                            e.stopPropagation();
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
            <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
              <span>🎯</span>
              Рекомендации кандидатов
            </h2>
            <div className="grid gap-4">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                  setActiveRecommendation(rec);
                  setShowRecommendationDetailsDialog(true);
                }}>
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
                          <Button variant="outline" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateRecommendationStatus(rec.id, 'rejected');
                          }} disabled={isSubscriptionExpired}>
                            <Icon name="X" className="mr-1" size={16} />
                            Отклонить
                          </Button>
                          <Button size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateRecommendationStatus(rec.id, 'accepted');
                          }} disabled={isSubscriptionExpired}>
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

          <TabsContent value="payouts" className="space-y-4">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2 mb-2">
                <span>💰</span>
                Запросы на выплаты
              </h2>
              <p className="text-sm text-muted-foreground">
                Управляйте запросами сотрудников на вывод заработанных средств
              </p>
            </div>
            <PayoutRequests 
              requests={payoutRequests}
              onUpdateStatus={async (requestId, status, comment) => {
                try {
                  const response = await fetch('https://functions.poehali.dev/f88ab2cf-1304-40dd-82e4-a7a1f7358901', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      request_id: requestId,
                      status: status,
                      admin_comment: comment,
                      reviewed_by: currentUser?.id || 1
                    })
                  });
                  
                  if (response.ok) {
                    await loadData();
                  } else {
                    const error = await response.json();
                    alert(`Ошибка: ${error.error || 'Не удалось обновить статус'}`);
                  }
                } catch (error) {
                  console.error('Ошибка обновления статуса выплаты:', error);
                  alert('Не удалось обновить статус выплаты');
                }
              }}
            />
          </TabsContent>

          <TabsContent value="news" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <span>📢</span>
                Новости компании
              </h2>
              <Button onClick={() => setShowCreateNewsDialog(true)}>
                <Icon name="Plus" className="mr-2" size={18} />
                Создать новость
              </Button>
            </div>

            <div className="grid gap-4">
              {newsPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={
                            post.category === 'news' ? 'default' :
                            post.category === 'achievement' ? 'secondary' :
                            post.category === 'announcement' ? 'outline' :
                            'default'
                          }>
                            {post.category === 'news' ? '📰 Новость' :
                             post.category === 'achievement' ? '🏆 Достижение' :
                             post.category === 'announcement' ? '📢 Объявление' :
                             '✍️ Блог'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <CardTitle className="text-xl">{post.title}</CardTitle>
                        <CardDescription className="mt-1">Автор: {post.author}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setNewsToEdit(post);
                            setNewsForm({
                              title: post.title,
                              content: post.content,
                              category: post.category
                            });
                            setShowEditNewsDialog(true);
                          }}
                        >
                          <Icon name="Edit" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteNews(post.id)}
                        >
                          <Icon name="Trash2" size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                  </CardContent>
                  <CardFooter className="flex-col items-stretch gap-3 border-t pt-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Icon name="ThumbsUp" size={16} />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="MessageCircle" size={16} />
                          {post.comments.length}
                        </span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chats" className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span>💬</span>
              Чаты с сотрудниками
            </h2>
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
            <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
              <span>📊</span>
              Статистика по компании
            </h2>
            
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


        </Tabs>
        )}
      </div>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить сотрудника</DialogTitle>
            <DialogDescription>Создайте аккаунт для нового сотрудника компании</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="invite-first-name">Имя</Label>
              <Input 
                id="invite-first-name"
                placeholder="Иван"
                value={inviteForm.firstName}
                onChange={(e) => setInviteForm({...inviteForm, firstName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="invite-last-name">Фамилия</Label>
              <Input 
                id="invite-last-name"
                placeholder="Иванов"
                value={inviteForm.lastName}
                onChange={(e) => setInviteForm({...inviteForm, lastName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="invite-email">Email</Label>
              <Input 
                id="invite-email"
                type="email"
                placeholder="ivan@company.ru"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="invite-password">Пароль</Label>
              <Input 
                id="invite-password"
                type="password"
                placeholder="Минимум 8 символов"
                value={inviteForm.password}
                onChange={(e) => setInviteForm({...inviteForm, password: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="invite-position">Должность</Label>
              <Input 
                id="invite-position"
                placeholder="Frontend Developer"
                value={inviteForm.position}
                onChange={(e) => setInviteForm({...inviteForm, position: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="invite-department">Отдел</Label>
              <Input 
                id="invite-department"
                placeholder="Разработка"
                value={inviteForm.department}
                onChange={(e) => setInviteForm({...inviteForm, department: e.target.value})}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleInviteEmployee}
              disabled={isAuthLoading}
            >
              {isAuthLoading ? 'Создание...' : 'Создать аккаунт сотрудника'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompanySettingsDialog} onOpenChange={setShowCompanySettingsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                    <SelectItem value="services">Услуги</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Контакты</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company-phone">Телефон</Label>
                  <Input 
                    id="company-phone" 
                    type="tel" 
                    placeholder="+7 (999) 123-45-67" 
                  />
                </div>
                <div>
                  <Label htmlFor="company-email">Email</Label>
                  <Input 
                    id="company-email" 
                    type="email" 
                    placeholder="info@company.ru" 
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Социальные сети</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company-telegram">
                    <div className="flex items-center gap-2">
                      <Icon name="Send" size={16} />
                      Telegram
                    </div>
                  </Label>
                  <Input 
                    id="company-telegram" 
                    placeholder="@company или https://t.me/company" 
                  />
                </div>
                <div>
                  <Label htmlFor="company-vk">
                    <div className="flex items-center gap-2">
                      <Icon name="MessageCircle" size={16} />
                      VK
                    </div>
                  </Label>
                  <Input 
                    id="company-vk" 
                    placeholder="https://vk.com/company" 
                  />
                </div>
              </div>
            </div>

            <Separator />

            <Button className="w-full" size="lg">
              <Icon name="Save" className="mr-2" size={18} />
              Сохранить изменения
            </Button>
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

      <Dialog open={showEditEmployeeDialog} onOpenChange={setShowEditEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать данные сотрудника</DialogTitle>
            <DialogDescription>
              Обновите информацию о {employeeToEdit?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emp-firstName">Имя</Label>
                <Input 
                  id="emp-firstName" 
                  value={employeeEditForm.firstName}
                  onChange={(e) => setEmployeeEditForm({...employeeEditForm, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="emp-lastName">Фамилия</Label>
                <Input 
                  id="emp-lastName" 
                  value={employeeEditForm.lastName}
                  onChange={(e) => setEmployeeEditForm({...employeeEditForm, lastName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="emp-position">Должность</Label>
              <Input 
                id="emp-position" 
                value={employeeEditForm.position}
                onChange={(e) => setEmployeeEditForm({...employeeEditForm, position: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="emp-department">Отдел</Label>
              <Input 
                id="emp-department" 
                value={employeeEditForm.department}
                onChange={(e) => setEmployeeEditForm({...employeeEditForm, department: e.target.value})}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1"
                onClick={handleUpdateEmployeeData}
              >
                Сохранить изменения
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowEditEmployeeDialog(false);
                  setEmployeeToEdit(null);
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReferralLinkDialog} onOpenChange={setShowReferralLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ссылка для регистрации сотрудников</DialogTitle>
            <DialogDescription>
              Отправьте эту ссылку новым сотрудникам для регистрации в системе
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly />
              <Button onClick={() => handleCopyLink(referralLink)}>
                <Icon name="Copy" size={18} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              После регистрации по этой ссылке сотрудник автоматически присоединится к вашей компании
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRecommendationDetailsDialog} onOpenChange={setShowRecommendationDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали рекомендации</DialogTitle>
            <DialogDescription>
              Полная информация о кандидате {activeRecommendation?.candidateName}
            </DialogDescription>
          </DialogHeader>
          {activeRecommendation && (
            <div className="space-y-4 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ФИО кандидата</Label>
                  <p className="font-medium">{activeRecommendation.candidateName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Вакансия</Label>
                  <p className="font-medium">{activeRecommendation.vacancy}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{activeRecommendation.candidateEmail}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Телефон</Label>
                  <p className="font-medium">{activeRecommendation.candidatePhone || 'Не указан'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Дата рекомендации</Label>
                  <p className="font-medium">{new Date(activeRecommendation.date).toLocaleDateString('ru-RU')}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Статус</Label>
                  <Badge variant={
                    activeRecommendation.status === 'accepted' ? 'default' : 
                    activeRecommendation.status === 'rejected' ? 'destructive' : 
                    'secondary'
                  }>
                    {activeRecommendation.status === 'accepted' ? 'Принят' : 
                     activeRecommendation.status === 'rejected' ? 'Отклонён' : 
                     'На рассмотрении'}
                  </Badge>
                </div>
              </div>

              {activeRecommendation.recommendedBy && (
                <div>
                  <Label className="text-xs text-muted-foreground">Рекомендовал</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {activeRecommendation.recommendedBy.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{activeRecommendation.recommendedBy}</span>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Комментарий</Label>
                <p className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                  {activeRecommendation.comment || 'Комментарий отсутствует'}
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Вознаграждение</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Icon name="Award" size={20} className="text-primary" />
                  <span className="text-xl font-bold">{activeRecommendation.reward.toLocaleString()} ₽</span>
                </div>
              </div>

              {activeRecommendation.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      handleUpdateRecommendationStatus(activeRecommendation.id, 'rejected');
                      setShowRecommendationDetailsDialog(false);
                    }}
                    disabled={isSubscriptionExpired}
                  >
                    <Icon name="X" className="mr-2" size={18} />
                    Отклонить
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      handleUpdateRecommendationStatus(activeRecommendation.id, 'accepted');
                      setShowRecommendationDetailsDialog(false);
                    }}
                    disabled={isSubscriptionExpired}
                  >
                    <Icon name="Check" className="mr-2" size={18} />
                    Принять кандидата
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateNewsDialog} onOpenChange={setShowCreateNewsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать новость</DialogTitle>
            <DialogDescription>
              Опубликуйте новость или объявление для сотрудников компании
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="news-category">Категория</Label>
              <Select 
                value={newsForm.category}
                onValueChange={(value) => setNewsForm({...newsForm, category: value as any})}
              >
                <SelectTrigger id="news-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">📰 Новость</SelectItem>
                  <SelectItem value="achievement">🏆 Достижение</SelectItem>
                  <SelectItem value="announcement">📢 Объявление</SelectItem>
                  <SelectItem value="blog">✍️ Блог</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="news-title">Заголовок</Label>
              <Input 
                id="news-title" 
                placeholder="Введите заголовок новости"
                value={newsForm.title}
                onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="news-content">Содержание</Label>
              <Textarea 
                id="news-content" 
                placeholder="Расскажите подробнее..."
                rows={8}
                value={newsForm.content}
                onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Эта новость увидят все сотрудники компании на главной странице
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1"
                onClick={handleCreateNews}
              >
                <Icon name="Send" className="mr-2" size={18} />
                Опубликовать
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowCreateNewsDialog(false);
                  setNewsForm({ title: '', content: '', category: 'news' });
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditNewsDialog} onOpenChange={setShowEditNewsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать новость</DialogTitle>
            <DialogDescription>
              Внесите изменения в новость
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-news-category">Категория</Label>
              <Select 
                value={newsForm.category}
                onValueChange={(value) => setNewsForm({...newsForm, category: value as any})}
              >
                <SelectTrigger id="edit-news-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">📰 Новость</SelectItem>
                  <SelectItem value="achievement">🏆 Достижение</SelectItem>
                  <SelectItem value="announcement">📢 Объявление</SelectItem>
                  <SelectItem value="blog">✍️ Блог</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-news-title">Заголовок</Label>
              <Input 
                id="edit-news-title" 
                placeholder="Введите заголовок новости"
                value={newsForm.title}
                onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-news-content">Содержание</Label>
              <Textarea 
                id="edit-news-content" 
                placeholder="Расскажите подробнее..."
                rows={8}
                value={newsForm.content}
                onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1"
                onClick={handleUpdateNews}
              >
                <Icon name="Save" className="mr-2" size={18} />
                Сохранить изменения
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowEditNewsDialog(false);
                  setNewsToEdit(null);
                  setNewsForm({ title: '', content: '', category: 'news' });
                }}
              >
                Отмена
              </Button>
            </div>
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
                onClick={() => employeeToDelete && handleDeleteEmployee(employeeToDelete.id)}
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
  };

  const renderEmployeeDashboard = () => {
    const employeeNotifications = notifications.filter(n => n.type !== 'subscription');
    
    return (
    <>
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Rocket" className="text-primary" size={28} />
            <span className="text-xl font-bold">iHUNT</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotificationsDialog(true)}>
              <Icon name="Bell" size={20} />
              {employeeNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {employeeNotifications.filter(n => !n.read).length}
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
                <Button variant="outline" onClick={() => setShowEditProfileDialog(true)}>Редактировать</Button>
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
                    <div className="text-3xl mb-1">🎯</div>
                    <div className="text-2xl font-bold text-primary">12</div>
                    <div className="text-xs text-muted-foreground">Рекомендаций</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-1">✅</div>
                    <div className="text-2xl font-bold text-green-600">4</div>
                    <div className="text-xs text-muted-foreground">Нанято</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-1">💸</div>
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
                <span className="text-2xl">💰</span>
                Кошелек
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Доступно для вывода</div>
                <div className="text-3xl font-bold text-green-600">
                  {walletData?.wallet?.wallet_balance?.toLocaleString() || 0} ₽
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Ожидает разблокировки</div>
                <div className="text-2xl font-bold text-muted-foreground">
                  {walletData?.wallet?.wallet_pending?.toLocaleString() || 0} ₽
                </div>
                {walletData?.pending_payouts && walletData.pending_payouts.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <Icon name="Clock" size={12} className="inline mr-1" />
                    Следующая: {new Date(walletData.pending_payouts[0].unlock_date).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
              <Button className="w-full" variant="outline">
                <Icon name="Download" className="mr-2" size={16} />
                Вывести средства
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="news" className="space-y-6">
          <TabsList>
            <TabsTrigger value="news">📢 Новости</TabsTrigger>
            <TabsTrigger value="vacancies">💼 Вакансии</TabsTrigger>
            <TabsTrigger value="my-recommendations">⭐ Мои рекомендации</TabsTrigger>
            <TabsTrigger value="achievements">🏆 Достижения</TabsTrigger>
            <TabsTrigger value="wallet-history">💳 История кошелька</TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span>📢</span>
              Новости компании
            </h2>
            
            {newsPosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="Newspaper" className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <p className="text-muted-foreground">Пока нет новостей</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {newsPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={
                          post.category === 'news' ? 'default' :
                          post.category === 'achievement' ? 'secondary' :
                          post.category === 'announcement' ? 'outline' :
                          'default'
                        }>
                          {post.category === 'news' ? '📰 Новость' :
                           post.category === 'achievement' ? '🏆 Достижение' :
                           post.category === 'announcement' ? '📢 Объявление' :
                           '✍️ Блог'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.date).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <CardTitle className="text-xl">{post.title}</CardTitle>
                      <CardDescription>Автор: {post.author}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleLikeNews(post.id)}
                          >
                            <Icon name="Heart" className="mr-1" size={16} />
                            {post.likes}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setActiveNewsPost(post);
                              setShowCommentsDialog(true);
                            }}
                          >
                            <Icon name="MessageCircle" className="mr-1" size={16} />
                            {post.comments.length}
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

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
                              <Input 
                                id="candidate-name" 
                                placeholder="Иван Иванов"
                                value={recommendationForm.name}
                                onChange={(e) => setRecommendationForm({...recommendationForm, name: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="candidate-email">Email</Label>
                              <Input 
                                id="candidate-email" 
                                type="email" 
                                placeholder="ivan@example.com"
                                value={recommendationForm.email}
                                onChange={(e) => setRecommendationForm({...recommendationForm, email: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="candidate-phone">Телефон</Label>
                              <Input 
                                id="candidate-phone" 
                                placeholder="+7 (999) 123-45-67"
                                value={recommendationForm.phone}
                                onChange={(e) => setRecommendationForm({...recommendationForm, phone: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="comment">Комментарий</Label>
                              <Textarea 
                                id="comment" 
                                placeholder="Почему этот кандидат подходит..." 
                                rows={3}
                                value={recommendationForm.comment}
                                onChange={(e) => setRecommendationForm({...recommendationForm, comment: e.target.value})}
                              />
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
                            <Button 
                              className="w-full" 
                              onClick={() => activeVacancy && handleCreateRecommendation({
                                vacancyId: activeVacancy.id,
                                name: recommendationForm.name,
                                email: recommendationForm.email,
                                phone: recommendationForm.phone,
                                comment: recommendationForm.comment
                              })}
                            >
                              Отправить рекомендацию
                            </Button>
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

      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
            <DialogDescription>
              Обновите информацию о вашем профиле
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="firstName">Имя</Label>
              <Input 
                id="firstName" 
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Фамилия</Label>
              <Input 
                id="lastName" 
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="position">Должность</Label>
              <Input 
                id="position" 
                value={profileForm.position}
                onChange={(e) => setProfileForm({...profileForm, position: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="department">Отдел</Label>
              <Input 
                id="department" 
                value={profileForm.department}
                onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1"
                onClick={handleUpdateProfile}
              >
                Сохранить
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowEditProfileDialog(false)}
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Комментарии</DialogTitle>
            <DialogDescription>
              {activeNewsPost?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {activeNewsPost && activeNewsPost.comments.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="MessageCircle" size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">Пока нет комментариев</p>
                <p className="text-sm text-muted-foreground mt-1">Будьте первым!</p>
              </div>
            ) : (
              activeNewsPost?.comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {comment.authorName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.authorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.comment}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Icon name="Trash2" size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Напишите комментарий..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <Button 
                onClick={handleAddComment}
                className="self-end"
              >
                <Icon name="Send" size={18} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
    );
  };

  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.getElementById(hash.slice(1));
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    };

    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);
    return () => window.removeEventListener('hashchange', handleHashNavigation);
  }, []);

  return (
    <>
      {userRole === 'guest' && renderLandingPage()}
      {userRole === 'employer' && renderEmployerDashboard()}
      {userRole === 'employee' && renderEmployeeDashboard()}
      
      <EmployeeDetail
        employee={selectedEmployee}
        open={showEmployeeDetail}
        onOpenChange={setShowEmployeeDetail}
        recommendations={recommendations}
      />
    </>
  );
}

export default Index;