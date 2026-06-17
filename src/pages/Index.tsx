import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { QRCodeSVG } from 'qrcode.react';
import { api, type Company } from '@/lib/api';
import type { UserRole, Vacancy, Employee, Recommendation, NewsPost, NewsComment, PayoutRequest } from '@/types';
import ScrollableTabs from '@/components/ScrollableTabs';
import TelegramLoginButton from '@/components/TelegramLoginButton';
import AiAssistantTab, { type AiMessage } from '@/components/AiAssistantTab';
import { BENEFITS_DATA } from '@/data/benefitsData';
import { useAuth } from '@/hooks/useAuth';
import { useDataLoader } from '@/hooks/useDataLoader';
import { useChat } from '@/hooks/useChat';

const EmployeeDetail = lazy(() => import('@/components/EmployeeDetail').then(m => ({ default: m.EmployeeDetail })));
const PayoutRequests = lazy(() => import('@/components/PayoutRequests').then(m => ({ default: m.PayoutRequests })));
const VacancyDetail = lazy(() => import('@/components/VacancyDetail').then(m => ({ default: m.VacancyDetail })));
const CandidateDetail = lazy(() => import('@/components/CandidateDetail').then(m => ({ default: m.CandidateDetail })));
const SubscriptionExpiredBlock = lazy(() => import('@/components/SubscriptionExpiredBlock').then(m => ({ default: m.SubscriptionExpiredBlock })));
const CompanyStats = lazy(() => import('@/components/CompanyStats'));
const BlogCarousel = lazy(() => import('@/components/BlogCarousel'));
const Onboarding = lazy(() => import('@/components/Onboarding'));
const GamesTab = lazy(() => import('@/components/GamesTab'));
const VacancyTestManager = lazy(() => import('@/components/VacancyTestManager').then(m => ({ default: m.VacancyTestManager })));
import { AboutDialog } from '@/components/dialogs/AboutDialog';
import { PrivacyDialog } from '@/components/dialogs/PrivacyDialog';
import { TermsDialog } from '@/components/dialogs/TermsDialog';
import { PersonalDataDialog } from '@/components/dialogs/PersonalDataDialog';
import { ForgotPasswordDialog } from '@/components/dialogs/ForgotPasswordDialog';
import { ResetPasswordDialog } from '@/components/dialogs/ResetPasswordDialog';
import { DemoDialog } from '@/components/dialogs/DemoDialog';
import { ReferralLinkDialog } from '@/components/dialogs/ReferralLinkDialog';
import { RecommendDialog } from '@/components/dialogs/RecommendDialog';
import { WithdrawDialog } from '@/components/dialogs/WithdrawDialog';
import { CompanySettingsDialog } from '@/components/dialogs/CompanySettingsDialog';
import { ChatDialog } from '@/components/dialogs/ChatDialog';
import { InviteEmployeeDialog } from '@/components/dialogs/InviteEmployeeDialog';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { VacanciesTab } from '@/components/employer/VacanciesTab';
import { EmployeesTab } from '@/components/employer/EmployeesTab';
import { RecommendationsTab } from '@/components/employer/RecommendationsTab';
import { PayoutsTab } from '@/components/employer/PayoutsTab';
import { NewsTab } from '@/components/employer/NewsTab';
import { ChatsTab } from '@/components/employer/ChatsTab';
import { StatsTab } from '@/components/employer/StatsTab';
import { SubscriptionTab } from '@/components/employer/SubscriptionTab';
import { HelpTab } from '@/components/employer/HelpTab';
import { AiAssistantTabWrapper } from '@/components/employer/AiAssistantTabWrapper';
import { EmployeeNewsTab } from '@/components/employee/EmployeeNewsTab';
import { EmployeeVacanciesTab } from '@/components/employee/EmployeeVacanciesTab';
import { MyRecommendationsTab } from '@/components/employee/MyRecommendationsTab';
import { AchievementsTab } from '@/components/employee/AchievementsTab';
import { WalletHistoryTab } from '@/components/employee/WalletHistoryTab';
import { NotificationsTab } from '@/components/employee/NotificationsTab';
import { EmployeeHelpTab } from '@/components/employee/EmployeeHelpTab';
import { GamesTabWrapper } from '@/components/employee/GamesTabWrapper';
import { HrVacanciesTab } from '@/components/employee/HrVacanciesTab';
import { HrRecommendationsTab } from '@/components/employee/HrRecommendationsTab';

const LazyFallback = () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;



function Index() {
  const navigate = useNavigate();

  // === HOOKS ===
  const auth = useAuth();
  const {
    userRole, setUserRole,
    currentUser, setCurrentUser,
    authToken, setAuthToken,
    isVerifying, setIsVerifying,
    showOnboarding, setShowOnboarding,
    showResetPasswordDialog, setShowResetPasswordDialog,
    resetPasswordForm, setResetPasswordForm,
    handleLogout,
  } = auth;

  const [activeVacancy, setActiveVacancy] = useState<Vacancy | null>(null);

  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCompanySettingsDialog, setShowCompanySettingsDialog] = useState(false);
  const [companyEditForm, setCompanyEditForm] = useState({ description: '', website: '', industry: '', telegram: '', vk: '' });
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showCompanyProfileDialog, setShowCompanyProfileDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPersonalDataDialog, setShowPersonalDataDialog] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [passwordResetMessage, setPasswordResetMessage] = useState('');
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const tgLoginPollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const maxLoginPollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [newReward, setNewReward] = useState('30000');
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

  const currentEmployeeId = currentUser?.id;
  const currentCompanyId = currentUser?.company_id;

  const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem('active_tab') || 'vacancies');
  const [activeEmployeeTab, setActiveEmployeeTab] = useState('news');
  const [payoutMethodsCollapsed, setPayoutMethodsCollapsed] = useState(false);

  const data = useDataLoader({
    userRole,
    currentUser,
    currentCompanyId: currentUser?.company_id,
    currentEmployeeId: currentUser?.id,
    showNotificationsDialog,
    activeEmployeeTab,
  });
  const {
    vacancies, setVacancies,
    employees, setEmployees,
    recommendations, setRecommendations,
    company, setCompany,
    payoutRequests, setPayoutRequests,
    chats, setChats,
    newsPosts, setNewsPosts,
    walletData, setWalletData,
    subscriptionDaysLeft, setSubscriptionDaysLeft,
    isLoading, setIsLoading,
    notifications, setNotifications,
    unreadMessagesCount, setUnreadMessagesCount,
    newRecommendationsCount, setNewRecommendationsCount,
    newEmployeesCount, setNewEmployeesCount,
    newPayoutsCount, setNewPayoutsCount,
    newVacanciesCount, setNewVacanciesCount,
    newNewsCount, setNewNewsCount,
    newNotificationsCount, setNewNotificationsCount,
    employeeTabsInitialized, setEmployeeTabsInitialized,
    loadData,
  } = data;

  const chat = useChat({
    userRole,
    currentUser,
    currentCompanyId: currentUser?.company_id,
    currentEmployeeId: currentUser?.id,
    chats,
    setChats,
    setUnreadMessagesCount,
  });
  const {
    chatMessages, setChatMessages,
    newMessage, setNewMessage,
    selectedFiles, setSelectedFiles,
    activeChatId, setActiveChatId,
    isSendingMessage,
    activeChatEmployee, setActiveChatEmployee,
    showChatDialog, setShowChatDialog,
    chatMessagesEndRef,
    fileInputRef,
    loadChatMessages,
    handleSelectChatEmployee,
    handleSendMessage,
    handleFileSelect,
    removeFile,
    handleOpenChat,
  } = chat;

  const isSubscriptionExpired = subscriptionDaysLeft !== null && subscriptionDaysLeft <= 0;

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(false);
  const [showTestManager, setShowTestManager] = useState(false);
  const [testManagerVacancy, setTestManagerVacancy] = useState<{ id: number; title: string } | null>(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<'all' | 'active' | 'fired' | 'admin'>('active');
  const [selectedVacancyDetail, setSelectedVacancyDetail] = useState<Vacancy | null>(null);
  const [showVacancyDetail, setShowVacancyDetail] = useState(false);
  const [showRecommendDialog, setShowRecommendDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Recommendation | null>(null);
  const [showCandidateDetail, setShowCandidateDetail] = useState(false);
  const [vacancySearchQuery, setVacancySearchQuery] = useState('');
  const [recommendationSearchQuery, setRecommendationSearchQuery] = useState('');
  const [recommendationStatusFilter, setRecommendationStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    paymentMethod: 'card',
    paymentDetails: '',
    bankName: '',
    accountFullName: '',
    accountBank: '',
    accountNumber: '',
    accountBik: ''
  });
  const [showProfileEditDialog, setShowProfileEditDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: '',
    telegram: '',
    vk: '',
    avatar: ''
  });
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false);
  const [integrationForm, setIntegrationForm] = useState({
    source: '1c',
    apiUrl: '',
    apiKey: '',
    syncInterval: 'manual'
  });
  
  const [editProfileForm, setEditProfileForm] = useState({
    firstName: '',
    lastName: '',
    position: '',
    department: ''
  });
  
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [contactFormSubmitting, setContactFormSubmitting] = useState(false);
  const [contactFormSuccess, setContactFormSuccess] = useState(false);

  const [activeBenefit, setActiveBenefit] = useState<number | null>(null);
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [demoForm, setDemoForm] = useState({
    companyName: '',
    name: '',
    phone: '',
    email: '',
    employeeCount: ''
  });
  const [demoFormSubmitting, setDemoFormSubmitting] = useState(false);
  
  const [vacancyForm, setVacancyForm] = useState({
    title: '',
    department: '',
    salary: '',
    description: '',
    requirements: '',
    motivation: '',
    reward: '30000',
    payoutDelay: '30',
    city: '',
    isRemote: false
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

  const [innVerificationState, setInnVerificationState] = useState<{
    isChecking: boolean;
    isVerified: boolean;
    error: string | null;
    companyData: any | null;
  }>({
    isChecking: false,
    isVerified: false,
    error: null,
    companyData: null
  });

  const [aiMessages, setAiMessages] = useState<AiMessage[]>(() => {
    try { return JSON.parse(localStorage.getItem('ai_chat_history') || '[]'); } catch { return []; }
  });

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [resendVerificationEmail, setResendVerificationEmail] = useState('');
  const [resendVerificationTimer, setResendVerificationTimer] = useState(0);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);

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
  const [employeeLoginMethod, setEmployeeLoginMethod] = useState<'telegram' | 'max'>('telegram');
  const [isTgLoginLoading, setIsTgLoginLoading] = useState(false);
  const [tgLoginError, setTgLoginError] = useState('');
  const [tgLoginStep, setTgLoginStep] = useState<'input' | 'wait' | 'code'>('input');
  const [tgLoginSession, setTgLoginSession] = useState('');
  const [tgLoginDeepLink, setTgLoginDeepLink] = useState('');
  const [tgLoginCode, setTgLoginCode] = useState('');
  const [isMaxLoginLoading, setIsMaxLoginLoading] = useState(false);
  const [maxLoginError, setMaxLoginError] = useState('');
  const [maxLoginStep, setMaxLoginStep] = useState<'input' | 'wait' | 'code'>('input');
  const [maxLoginSession, setMaxLoginSession] = useState('');
  const [maxLoginDeepLink, setMaxLoginDeepLink] = useState('');
  const [maxLoginCode, setMaxLoginCode] = useState('');
  const [employeeToEditRoles, setEmployeeToEditRoles] = useState<Employee | null>(null);
  const [showEditRolesDialog, setShowEditRolesDialog] = useState(false);
  const [rolesForm, setRolesForm] = useState({
    isAdmin: false
  });

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
    if (resendVerificationTimer > 0) {
      const timer = setTimeout(() => {
        setResendVerificationTimer(resendVerificationTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendVerificationTimer]);

  useEffect(() => {
    if (!showLoginDialog) {
      if (tgLoginPollRef.current) { clearInterval(tgLoginPollRef.current); tgLoginPollRef.current = null; }
      if (maxLoginPollRef.current) { clearInterval(maxLoginPollRef.current); maxLoginPollRef.current = null; }
    }
  }, [showLoginDialog]);

  const calculateEmployeeRank = (emp: Employee) => {
    const sortedEmployees = [...employees].sort((a, b) => {
      if (b.hired !== a.hired) return b.hired - a.hired;
      if (b.recommendations !== a.recommendations) return b.recommendations - a.recommendations;
      return b.earnings - a.earnings;
    });
    return sortedEmployees.findIndex(e => e.id === emp.id) + 1;
  };

  const handleSaveCompany = async () => {
    try {
      setIsSavingCompany(true);
      let logoUrl: string | undefined;
      if (companyLogoFile) {
        logoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(companyLogoFile);
        });
      }
      await api.updateCompany(currentCompanyId, {
        description: companyEditForm.description,
        website: companyEditForm.website,
        industry: companyEditForm.industry,
        telegram: companyEditForm.telegram,
        vk: companyEditForm.vk,
        ...(logoUrl ? { logo_url: logoUrl } : {})
      });
      setCompanyLogoFile(null);
      setCompanyLogoPreview(null);
      await loadData();
      setShowCompanySettingsDialog(false);
    } catch (error) {
      alert('Ошибка при сохранении');
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleCreateVacancy = async () => {
    if (!vacancyForm.title || !vacancyForm.salary) {
      alert('Заполните обязательные поля: Должность и Зарплата');
      return;
    }
    
    try {
      await api.createVacancy({
        company_id: currentCompanyId,
        title: vacancyForm.title,
        department: vacancyForm.department,
        salary_display: vacancyForm.salary,
        description: vacancyForm.description,
        requirements: vacancyForm.requirements,
        motivation: vacancyForm.motivation,
        reward_amount: parseInt(vacancyForm.reward),
        payout_delay_days: parseInt(vacancyForm.payoutDelay),
        created_by: currentEmployeeId,
        city: vacancyForm.city,
        is_remote: vacancyForm.isRemote
      });
      await loadData();
      setVacancyForm({ title: '', department: '', salary: '', description: '', requirements: '', motivation: '', reward: '30000', payoutDelay: '30', city: '', isRemote: false });
      alert('Вакансия успешно создана!');
    } catch (error) {
      console.error('Ошибка создания вакансии:', error);
      alert('Ошибка при создании вакансии. Попробуйте обновить страницу и войти заново.');
    }
  };

  const handleCreateRecommendation = async (data: { vacancyId: number; name: string; email: string; phone: string; comment: string }) => {
    if (!data.name || !data.phone || !data.comment) {
      alert('Заполните обязательные поля: ФИО, Телефон и Сопроводительное письмо');
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
      if (status === 'accepted') {
        alert('Кандидат принят!');
      } else if (status === 'rejected') {
        alert('Рекомендация отклонена.');
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('Не удалось обновить статус рекомендации');
    }
  };

  const handleDeleteEmployee = async (userId: number) => {
    if (!authToken) return;
    try {
      await api.deleteEmployee(authToken, userId);
      await loadData();
      setShowDeleteDialog(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Ошибка удаления сотрудника:', error);
      alert('Не удалось удалить сотрудника');
    }
  };

  const handleUpdateVacancy = async () => {
    if (!activeVacancy || !vacancyForm.title || !vacancyForm.salary) {
      alert('Заполните обязательные поля: Должность и Зарплата');
      return;
    }
    
    try {
      await api.updateVacancy(activeVacancy.id, {
        title: vacancyForm.title,
        department: vacancyForm.department,
        salary_display: vacancyForm.salary,
        description: vacancyForm.description,
        requirements: vacancyForm.requirements,
        motivation: vacancyForm.motivation,
        reward_amount: parseInt(vacancyForm.reward),
        payout_delay_days: parseInt(vacancyForm.payoutDelay)
      });
      await loadData();
      setActiveVacancy(null);
      setVacancyForm({ title: '', department: '', salary: '', description: '', requirements: '', motivation: '', reward: '30000', payoutDelay: '30', city: '', isRemote: false });
      alert('Вакансия успешно обновлена!');
    } catch (error) {
      console.error('Ошибка обновления вакансии:', error);
      alert('Не удалось обновить вакансию');
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

  const handleRestoreVacancy = async (vacancyId: number) => {
    try {
      await api.updateVacancy(vacancyId, { status: 'active' });
      await loadData();
      alert('Вакансия восстановлена в активные');
    } catch (error) {
      console.error('Ошибка восстановления вакансии:', error);
      alert('Не удалось восстановить вакансию');
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
    if (company?.invite_token) {
      const link = `${window.location.origin}/employee-register?token=${company.invite_token}`;
      setReferralLink(link);
      setShowEmployeeDetail(false);
      setShowReferralLinkDialog(true);
    } else {
      alert('Ошибка: токен компании не найден');
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Ссылка скопирована в буфер обмена');
  };

  const handleUpdateProfile = async () => {
    try {
      await api.updateEmployee(currentEmployeeId, {
        phone: profileForm.phone,
        telegram: profileForm.telegram,
        vk: profileForm.vk,
        avatar_url: profileForm.avatar
      });
      await loadData();
      setShowProfileEditDialog(false);
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
      const response = await fetch('https://functions.poehali.dev/c6b69066-22c2-4545-bd88-10571ecd9140', {
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

  const handleVerifyInn = async (inn: string) => {
    if (!inn || inn.length < 10) {
      setInnVerificationState({
        isChecking: false,
        isVerified: false,
        error: 'ИНН должен содержать 10 или 12 цифр',
        companyData: null
      });
      return;
    }

    setInnVerificationState({
      isChecking: true,
      isVerified: false,
      error: null,
      companyData: null
    });

    try {
      const response = await fetch('https://functions.poehali.dev/92a2d1b3-cdee-48b2-9883-c3df1bf50f52', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inn })
      });

      const data = await response.json();

      if (response.ok) {
        setInnVerificationState({
          isChecking: false,
          isVerified: true,
          error: null,
          companyData: data
        });

        if (data.name?.short && !registerForm.companyName) {
          setRegisterForm({
            ...registerForm,
            companyName: data.name.short
          });
        }
      } else {
        setInnVerificationState({
          isChecking: false,
          isVerified: false,
          error: data.error || 'Не удалось проверить ИНН',
          companyData: null
        });
      }
    } catch (error) {
      console.error('Ошибка проверки ИНН:', error);
      setInnVerificationState({
        isChecking: false,
        isVerified: false,
        error: 'Ошибка соединения с сервисом проверки',
        companyData: null
      });
    }
  };

  const handleDemoFormSubmit = async () => {
    if (!demoForm.companyName || !demoForm.name || !demoForm.phone || !demoForm.email) {
      alert('Заполните все обязательные поля');
      return;
    }
    setDemoFormSubmitting(true);
    try {
      const response = await fetch('https://functions.poehali.dev/f58cb721-86b3-42c5-a5c1-c608cf9ee264', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: demoForm.name,
          email: 'info@i-hunt.ru',
          message: `ЗАПРОС НА ДЕМОНСТРАЦИЮ\n\nКомпания: ${demoForm.companyName}\nИмя: ${demoForm.name}\nТелефон: ${demoForm.phone}\nПочта: ${demoForm.email}\nКоличество сотрудников: ${demoForm.employeeCount || 'не указано'}`
        })
      });
      if (response.ok) {
        setShowDemoDialog(false);
        setDemoForm({ companyName: '', name: '', phone: '', email: '', employeeCount: '' });
        alert('✅ Заявка на демонстрацию отправлена! Мы свяжемся с вами в ближайшее время.');
      } else {
        alert('❌ Ошибка при отправке. Попробуйте позже.');
      }
    } catch {
      alert('❌ Не удалось отправить заявку. Проверьте подключение к интернету.');
    } finally {
      setDemoFormSubmitting(false);
    }
  };

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    setContactFormSubmitting(true);
    setContactFormSuccess(false);

    try {
      const response = await fetch('https://functions.poehali.dev/f58cb721-86b3-42c5-a5c1-c608cf9ee264', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          message: `${contactForm.phone ? `Телефон: ${contactForm.phone}\n\n` : ''}${contactForm.message}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        setContactFormSuccess(true);
        setContactForm({ name: '', email: '', phone: '', message: '' });
        alert('✅ Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.');
      } else {
        alert('❌ Ошибка при отправке: ' + (data.error || 'Попробуйте позже'));
      }
    } catch (error) {
      console.error('Ошибка отправки формы:', error);
      alert('❌ Не удалось отправить сообщение. Проверьте подключение к интернету.');
    } finally {
      setContactFormSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!registerForm.companyName || !registerForm.firstName || !registerForm.lastName || !registerForm.email || !registerForm.password || !registerForm.inn) {
      alert('Заполните все обязательные поля');
      return;
    }

    if (registerForm.password.length < 8) {
      alert('Пароль должен быть минимум 8 символов');
      return;
    }

    if (!innVerificationState.isVerified) {
      alert('Пожалуйста, проверьте ИНН компании перед регистрацией');
      return;
    }

    setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/c6b69066-22c2-4545-bd88-10571ecd9140', {
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
          employee_count: parseInt(registerForm.employeeCount),
          ref_code: localStorage.getItem('partner_ref') || undefined,
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowRegisterDialog(false);
        setRegisterForm({ companyName: '', firstName: '', lastName: '', email: '', password: '', inn: '', employeeCount: '50' });
        if (typeof window.ym === 'function') window.ym(106919720, 'reachGoal', 'registration');
        alert(`✅ Регистрация успешна!\n\nМы отправили письмо с подтверждением на ${registerForm.email}.\nПожалуйста, проверьте вашу почту и перейдите по ссылке в письме для активации аккаунта.`);
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

  const handleTgSendLoginCode = async () => {
    setTgLoginError('');
    setIsTgLoginLoading(true);
    try {
      const r = await fetch('https://functions.poehali.dev/c412b453-2112-4882-aaa5-64d3d6f3a3c6', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_login_session' })
      });
      const data = await r.json();
      if (r.ok) {
        setTgLoginSession(data.session_token);
        setTgLoginDeepLink(data.deep_link);
        setTgLoginStep('wait');
        window.open(data.deep_link, '_blank');
        if (tgLoginPollRef.current) clearInterval(tgLoginPollRef.current);
        tgLoginPollRef.current = setInterval(async () => {
          try {
            const pr = await fetch('https://functions.poehali.dev/c412b453-2112-4882-aaa5-64d3d6f3a3c6', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'check_login_session', session_token: data.session_token })
            });
            const pd = await pr.json();
            if (pr.status === 410) { clearInterval(tgLoginPollRef.current!); tgLoginPollRef.current = null; setTgLoginError('Сессия истекла. Попробуйте снова.'); setTgLoginStep('input'); return; }
            if (pd.status === 'code_sent') { clearInterval(tgLoginPollRef.current!); tgLoginPollRef.current = null; setTgLoginStep('code'); }
          } catch { /* ignore */ }
        }, 2000);
      } else { setTgLoginError(data.error || 'Ошибка'); }
    } catch { setTgLoginError('Не удалось создать сессию'); }
    finally { setIsTgLoginLoading(false); }
  };

  const handleTgVerifyLoginCode = async () => {
    setTgLoginError('');
    if (!tgLoginCode.trim()) { setTgLoginError('Введите код'); return; }
    setIsTgLoginLoading(true);
    try {
      const r = await fetch('https://functions.poehali.dev/c412b453-2112-4882-aaa5-64d3d6f3a3c6', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_login_code', session_token: tgLoginSession, code: tgLoginCode.trim() })
      });
      const data = await r.json();
      if (r.ok) {
        const tgRole: UserRole = data.user?.is_admin ? 'employer' : 'employee';
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', tgRole);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setUserRole(tgRole);
        setShowLoginDialog(false);
        setTgLoginStep('input'); setTgLoginCode('');
        if (typeof window.ym === 'function') window.ym(106919720, 'reachGoal', 'login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setTgLoginError(data.error || 'Неверный код или аккаунт не найден');
      }
    } catch {
      setTgLoginError('Ошибка входа через Telegram');
    } finally {
      setIsTgLoginLoading(false);
    }
  };

  const handleMaxSendLoginCode = async () => {
    setMaxLoginError('');
    setIsMaxLoginLoading(true);
    try {
      const r = await fetch('https://functions.poehali.dev/42b7f6c0-39d7-4274-a41b-2223268f44ce', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_login_session' })
      });
      const data = await r.json();
      if (r.ok) {
        setMaxLoginSession(data.session_token);
        setMaxLoginDeepLink(data.deep_link);
        setMaxLoginStep('wait');
        window.open(data.deep_link, '_blank');
        if (maxLoginPollRef.current) clearInterval(maxLoginPollRef.current);
        maxLoginPollRef.current = setInterval(async () => {
          try {
            const pr = await fetch('https://functions.poehali.dev/42b7f6c0-39d7-4274-a41b-2223268f44ce', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'check_login_session', session_token: data.session_token })
            });
            const pd = await pr.json();
            if (pr.status === 410) { clearInterval(maxLoginPollRef.current!); maxLoginPollRef.current = null; setMaxLoginError('Сессия истекла. Попробуйте снова.'); setMaxLoginStep('input'); return; }
            if (pd.status === 'code_sent') { clearInterval(maxLoginPollRef.current!); maxLoginPollRef.current = null; setMaxLoginStep('code'); }
          } catch { /* ignore */ }
        }, 2000);
      } else { setMaxLoginError(data.error || 'Ошибка'); }
    } catch { setMaxLoginError('Не удалось создать сессию'); }
    finally { setIsMaxLoginLoading(false); }
  };

  const handleMaxVerifyLoginCode = async () => {
    setMaxLoginError('');
    if (!maxLoginCode.trim()) { setMaxLoginError('Введите код'); return; }
    setIsMaxLoginLoading(true);
    try {
      const r = await fetch('https://functions.poehali.dev/42b7f6c0-39d7-4274-a41b-2223268f44ce', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_login_code', session_token: maxLoginSession, code: maxLoginCode.trim() })
      });
      const data = await r.json();
      if (r.ok) {
        const maxRole: UserRole = data.user?.is_admin ? 'employer' : 'employee';
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', maxRole);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setUserRole(maxRole);
        setShowLoginDialog(false);
        setMaxLoginSession(''); setMaxLoginCode(''); setMaxLoginStep('input');
        if (typeof window.ym === 'function') window.ym(106919720, 'reachGoal', 'login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else { setMaxLoginError(data.error || 'Неверный код'); }
    } catch { setMaxLoginError('Ошибка входа'); }
    finally { setIsMaxLoginLoading(false); }
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      alert('Введите email и пароль');
      return;
    }

    setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/c6b69066-22c2-4545-bd88-10571ecd9140', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginForm.email.trim().toLowerCase(),
          password: loginForm.password,
          userType: loginType
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        const role = (data.user.role === 'admin' || data.user.is_admin) ? 'employer' : 'employee';
        localStorage.setItem('userRole', role);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setUserRole(role);
        setShowLoginDialog(false);
        setLoginForm({ email: '', password: '' });
        if (typeof window.ym === 'function') window.ym(106919720, 'reachGoal', 'login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (response.status === 403) {
        setResendVerificationEmail(loginForm.email);
        alert('❌ Email не подтверждён!\n\nМы отправили письмо с подтверждением на вашу почту при регистрации.\nПожалуйста, проверьте почту (в том числе папку "Спам") и перейдите по ссылке в письме для активации аккаунта.');
      } else if (response.status === 401) {
        alert('Неверный email или пароль. Проверьте данные и попробуйте снова.');
      } else {
        alert(data.error || 'Не удалось войти. Попробуйте ещё раз.');
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
      alert('Не удалось войти в систему');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!resendVerificationEmail) {
      alert('Email не найден');
      return;
    }

    if (resendVerificationTimer > 0) {
      alert(`Подождите ${resendVerificationTimer} секунд перед повторной отправкой`);
      return;
    }

    setIsResendingVerification(true);
    try {
      const response = await fetch('https://functions.poehali.dev/c6b69066-22c2-4545-bd88-10571ecd9140', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend_verification',
          email: resendVerificationEmail
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResendVerificationTimer(30);
        alert('✅ Письмо с подтверждением отправлено повторно!\n\nПроверьте вашу почту (в том числе папку "Спам").');
      } else {
        alert(data.error || 'Не удалось отправить письмо');
      }
    } catch (error) {
      console.error('Ошибка отправки письма:', error);
      alert('Не удалось отправить письмо с подтверждением');
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!forgotPasswordEmail.trim()) {
      alert('Введите email');
      return;
    }

    setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/edea8e05-e989-4719-81d8-5c546d5ff771', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordResetMessage('Если email существует, на него отправлена ссылка для восстановления пароля');
      } else {
        setPasswordResetMessage(data.error || 'Произошла ошибка');
      }
    } catch (error) {
      console.error('Ошибка запроса восстановления:', error);
      setPasswordResetMessage('Не удалось отправить запрос');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
      setPasswordResetMessage('Пароли не совпадают');
      return;
    }

    if (resetPasswordForm.password.length < 6) {
      setPasswordResetMessage('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/fccc90bf-440b-44ed-95d7-cae0af39adfe', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetPasswordForm.token,
          password: resetPasswordForm.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordResetMessage('Пароль успешно изменен! Теперь вы можете войти с новым паролем.');
        setTimeout(() => {
          setShowResetPasswordDialog(false);
          setShowLoginDialog(true);
          setResetPasswordForm({ token: '', password: '', confirmPassword: '' });
          setPasswordResetMessage('');
        }, 2000);
      } else {
        setPasswordResetMessage(data.error || 'Произошла ошибка');
      }
    } catch (error) {
      console.error('Ошибка сброса пароля:', error);
      setPasswordResetMessage('Не удалось изменить пароль');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCreateNews = async () => {
    if (!newsForm.title || !newsForm.content) {
      alert('Заполните все поля');
      return;
    }
    try {
      const r = await fetch('https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', company_id: currentCompanyId, author_id: currentUser?.id, title: newsForm.title, content: newsForm.content, category: newsForm.category })
      });
      if (r.ok) {
        setNewsForm({ title: '', content: '', category: 'news' });
        setShowCreateNewsDialog(false);
        loadData(true);
      } else {
        const d = await r.json();
        alert(d.error || 'Ошибка публикации');
      }
    } catch { alert('Ошибка соединения'); }
  };

  const handleUpdateNews = async () => {
    if (!newsToEdit || !newsForm.title || !newsForm.content) {
      alert('Заполните все поля');
      return;
    }
    try {
      const r = await fetch('https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', news_id: newsToEdit.id, title: newsForm.title, content: newsForm.content, category: newsForm.category })
      });
      if (r.ok) {
        setNewsForm({ title: '', content: '', category: 'news' });
        setShowEditNewsDialog(false);
        setNewsToEdit(null);
        loadData(true);
      }
    } catch { alert('Ошибка обновления'); }
  };

  const handleDeleteNews = async (id: number) => {
    try {
      await fetch('https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', news_id: id })
      });
      loadData(true);
    } catch { alert('Ошибка удаления'); }
  };

  const handleArchiveNews = async (id: number, isArchived: boolean) => {
    try {
      await fetch('https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', news_id: id, is_archived: isArchived })
      });
      loadData(true);
    } catch { alert('Ошибка архивирования'); }
  };

  const handleLikeNews = async (newsId: number) => {
    try {
      const r = await fetch('https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', news_id: newsId, user_id: currentUser?.id })
      });
      if (r.ok) {
        const d = await r.json();
        setNewsPosts(newsPosts.map(post => post.id === newsId ? { ...post, likes: d.likes } : post));
      }
    } catch { /* ignore */ }
  };

  const handleAddComment = async () => {
    if (!activeNewsPost || !newComment.trim()) {
      alert('Напишите комментарий');
      return;
    }
    try {
      const r = await fetch('https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment', news_id: activeNewsPost.id, author_id: currentUser?.id, author_name: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Сотрудник', text: newComment })
      });
      if (r.ok) {
        const c = await r.json();
        const comment: NewsComment = { id: c.id, newsId: activeNewsPost.id, authorName: c.author_name, comment: c.text, date: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '' };
        setNewsPosts(newsPosts.map(post => post.id === activeNewsPost.id ? { ...post, comments: [...post.comments, comment] } : post));
        setNewComment('');
        setActiveNewsPost({ ...activeNewsPost, comments: [...activeNewsPost.comments, comment] });
      }
    } catch { alert('Ошибка комментария'); }
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

  const handleUpdateEmployeeRoles = async () => {
    if (!employeeToEditRoles) return;
    
    try {
      await api.updateEmployeeRole(employeeToEditRoles.id, undefined, rolesForm.isAdmin);
      await loadData();

      if (employeeToEditRoles.id === currentEmployeeId) {
        const newRole: UserRole = rolesForm.isAdmin ? 'employer' : 'employee';
        setUserRole(newRole);
        localStorage.setItem('userRole', newRole);
        setCurrentUser((prev: unknown) => ({ ...(prev as object), is_admin: rolesForm.isAdmin, role: rolesForm.isAdmin ? 'admin' : 'employee' }));
      }

      setShowEditRolesDialog(false);
      setEmployeeToEditRoles(null);
      alert('Права сотрудника обновлены!');
    } catch (error) {
      console.error('Ошибка обновления прав сотрудника:', error);
      alert('Не удалось обновить права сотрудника');
    }
  };

  const handleToggleFired = async (employee: Employee) => {
    const action = employee.isFired ? 'восстановить' : 'уволить';
    if (!confirm(`Вы уверены, что хотите ${action} сотрудника ${employee.name}?`)) return;
    try {
      await api.updateEmployeeFired(employee.id, !employee.isFired);
      await loadData();
    } catch (error) {
      console.error('Ошибка изменения статуса сотрудника:', error);
      alert('Не удалось изменить статус сотрудника');
    }
  };

  const handleSaveRoles = handleUpdateEmployeeRoles;

  const handleRestoreEmployee = async (employee: Employee) => {
    try {
      await api.updateEmployeeFired(employee.id, false);
      await loadData();
    } catch (error) {
      console.error('Ошибка восстановления сотрудника:', error);
      alert('Не удалось восстановить сотрудника');
    }
  };

  const handleEditNews = async () => {
    if (!newsToEdit || !newsForm.title || !newsForm.content) {
      alert('Заполните все поля');
      return;
    }
    try {
      const r = await fetch('https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', news_id: newsToEdit.id, title: newsForm.title, content: newsForm.content, category: newsForm.category })
      });
      if (r.ok) {
        setNewsForm({ title: '', content: '', category: 'news' });
        setShowEditNewsDialog(false);
        setNewsToEdit(null);
        loadData(true);
      }
    } catch { alert('Ошибка обновления'); }
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
      <LandingHeader
        onLogin={() => setShowLoginDialog(true)}
        onRegister={() => setShowRegisterDialog(true)}
      />

      <main>
        <HeroSection
          onRegister={() => setShowRegisterDialog(true)}
          onLogin={() => setShowLoginDialog(true)}
        />

        <HowItWorksSection />

        <BenefitsSection
          activeBenefit={activeBenefit}
          onBenefitClick={setActiveBenefit}
          onBenefitClose={() => setActiveBenefit(null)}
        />

        <PricingSection
          period={pricingPeriod}
          onPeriodChange={setPricingPeriod}
          onRegister={() => setShowRegisterDialog(true)}
          onDemo={() => setShowDemoDialog(true)}
        />

        <ContactSection
          form={contactForm}
          onFormChange={setContactForm}
          onSubmit={handleContactFormSubmit}
          isSubmitting={contactFormSubmitting}
        />

        <Suspense fallback={null}>
          <BlogCarousel />
        </Suspense>
      </main>

      <LandingFooter
        onAbout={() => setShowAboutDialog(true)}
        onPrivacy={() => setShowPrivacyDialog(true)}
        onTerms={() => setShowTermsDialog(true)}
        onPersonalData={() => setShowPersonalDataDialog(true)}
      />

      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90dvh] overflow-y-auto md:overflow-visible md:max-h-none p-4 sm:p-6">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-base sm:text-lg">Регистрация компании</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Начните 14-дневный пробный период или{' '}
              <button
                className="text-primary hover:underline font-medium"
                onClick={() => { setShowRegisterDialog(false); setShowDemoDialog(true); }}
              >
                запросите демо
              </button>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label htmlFor="company-name" className="text-xs">Название компании <span className="text-destructive">*</span></Label>
                <Input 
                  id="company-name" 
                  className="mt-1 h-8 text-sm"
                  placeholder="Acme Corp" 
                  value={registerForm.companyName}
                  onChange={(e) => setRegisterForm({...registerForm, companyName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="admin-first-name" className="text-xs">Имя <span className="text-destructive">*</span></Label>
                <Input 
                  id="admin-first-name" 
                  className="mt-1 h-8 text-sm"
                  placeholder="Иван" 
                  value={registerForm.firstName}
                  onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="admin-last-name" className="text-xs">Фамилия <span className="text-destructive">*</span></Label>
                <Input 
                  id="admin-last-name" 
                  className="mt-1 h-8 text-sm"
                  placeholder="Иванов" 
                  value={registerForm.lastName}
                  onChange={(e) => setRegisterForm({...registerForm, lastName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="admin-email" className="text-xs">Email <span className="text-destructive">*</span></Label>
                <Input 
                  id="admin-email" 
                  className="mt-1 h-8 text-sm"
                  type="email" 
                  placeholder="ivan@company.ru" 
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="admin-password" className="text-xs">Пароль <span className="text-destructive">*</span></Label>
                <Input 
                  id="admin-password" 
                  className="mt-1 h-8 text-sm"
                  type="password" 
                  placeholder="Минимум 8 символов" 
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="company-inn" className="text-xs">ИНН компании <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Input 
                    id="company-inn" 
                    placeholder="1234567890" 
                    maxLength={12} 
                    value={registerForm.inn}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setRegisterForm({...registerForm, inn: value});
                      if (innVerificationState.isVerified || innVerificationState.error) {
                        setInnVerificationState({
                          isChecking: false,
                          isVerified: false,
                          error: null,
                          companyData: null
                        });
                      }
                    }}
                    className={`h-8 text-sm ${innVerificationState.isVerified ? 'border-green-500' : innVerificationState.error ? 'border-red-500' : ''}`}
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    className="h-8 text-xs shrink-0 px-3"
                    onClick={() => handleVerifyInn(registerForm.inn)}
                    disabled={innVerificationState.isChecking || !registerForm.inn || registerForm.inn.length < 10}
                  >
                    {innVerificationState.isChecking ? (
                      <Icon name="Loader2" className="w-4 h-4 animate-spin" />
                    ) : innVerificationState.isVerified ? (
                      <><Icon name="CheckCircle2" className="w-4 h-4 text-green-600 mr-1" />OK</>
                    ) : (
                      'Проверить'
                    )}
                  </Button>
                </div>
                {innVerificationState.error && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <Icon name="AlertCircle" className="w-3 h-3 shrink-0" />
                    {innVerificationState.error}
                  </p>
                )}
                {innVerificationState.isVerified && innVerificationState.companyData && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-medium text-green-900 flex items-center gap-1">
                      <Icon name="CheckCircle2" className="w-3 h-3 shrink-0" />
                      {innVerificationState.companyData.name?.short || innVerificationState.companyData.name?.full}
                      {' · '}{innVerificationState.companyData.status?.text || ''}
                    </p>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="employee-count" className="text-xs">Количество сотрудников <span className="text-destructive">*</span></Label>
                <Input 
                  id="employee-count" 
                  className="mt-1 h-8 text-sm"
                  type="number" 
                  placeholder="50" 
                  value={registerForm.employeeCount}
                  onChange={(e) => setRegisterForm({...registerForm, employeeCount: e.target.value})}
                />
              </div>
            </div>
            <Button className="w-full h-9 text-sm" onClick={handleRegister} disabled={isAuthLoading}>
              {isAuthLoading ? 'Регистрация...' : 'Создать аккаунт'}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
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
                  onClick={() => { setLoginType('employer'); setTgLoginError(''); }}
                >
                  <Icon name="Building2" className="mr-2" size={18} />
                  Компания
                </Button>
                <Button
                  type="button"
                  variant={loginType === 'employee' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => { setLoginType('employee'); setTgLoginError(''); }}
                >
                  <Icon name="User" className="mr-2" size={18} />
                  Сотрудник
                </Button>
              </div>
            </div>

            {/* Вход для сотрудников */}
            {loginType === 'employee' ? (
              <div className="space-y-3">
                {/* Переключатель мессенджера */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`flex items-center justify-center gap-2 h-10 rounded-lg border-2 text-sm font-medium transition-all ${employeeLoginMethod === 'telegram' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-border text-muted-foreground hover:border-muted-foreground'}`}
                    onClick={() => { setEmployeeLoginMethod('telegram'); setTgLoginError(''); setMaxLoginError(''); }}
                  >
                    <Icon name="Send" size={15} />Telegram
                  </button>
                  <button
                    className={`flex items-center justify-center gap-2 h-10 rounded-lg border-2 text-sm font-medium transition-all ${employeeLoginMethod === 'max' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-border text-muted-foreground hover:border-muted-foreground'}`}
                    onClick={() => { setEmployeeLoginMethod('max'); setTgLoginError(''); setMaxLoginError(''); }}
                  >
                    <Icon name="MessageCircle" size={15} />MAX
                  </button>
                </div>

                {/* Telegram */}
                {employeeLoginMethod === 'telegram' && (
                  <div className="space-y-3">
                    {tgLoginError && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2"><Icon name="AlertCircle" size={15} className="mt-0.5 shrink-0" /><span>{tgLoginError}</span></div>}
                    {tgLoginStep === 'input' ? (
                      <div className="text-center space-y-3 py-1">
                        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Icon name="Send" size={24} className="text-blue-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">Нажмите кнопку — откроется бот Telegram, нажмите /start и получите код</p>
                        <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={handleTgSendLoginCode} disabled={isTgLoginLoading}>
                          {isTgLoginLoading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Открываем...</> : <><Icon name="Send" size={16} className="mr-2" />Войти через Telegram</>}
                        </Button>
                      </div>
                    ) : tgLoginStep === 'wait' ? (
                      <div className="text-center space-y-3 py-1">
                        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Icon name="Send" size={24} className="text-blue-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">Откройте Telegram и нажмите <strong>/start</strong> в боте</p>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Icon name="Loader2" size={14} className="animate-spin" />Ожидаем подтверждения...
                        </div>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(tgLoginDeepLink, '_blank')}>Открыть бота снова</Button>
                        <Button variant="ghost" className="w-full text-sm" onClick={() => { setTgLoginStep('input'); setTgLoginError(''); }}>← Назад</Button>
                      </div>
                    ) : (
                      <>
                        <div className="text-center">
                          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2"><Icon name="Send" size={22} className="text-blue-500" /></div>
                          <p className="text-sm text-muted-foreground">Бот прислал код в Telegram. Действует 10 минут.</p>
                        </div>
                        <div>
                          <Label>Код из Telegram</Label>
                          <Input value={tgLoginCode} onChange={e => setTgLoginCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className="text-center text-2xl tracking-[0.4em] font-mono" maxLength={6} onKeyDown={e => e.key === 'Enter' && handleTgVerifyLoginCode()} />
                        </div>
                        <Button className="w-full" onClick={handleTgVerifyLoginCode} disabled={isTgLoginLoading || tgLoginCode.length !== 6}>
                          {isTgLoginLoading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Проверяем...</> : 'Войти'}
                        </Button>
                        <Button variant="ghost" className="w-full text-sm" onClick={() => { setTgLoginStep('wait'); setTgLoginCode(''); setTgLoginError(''); }}>← Назад</Button>
                      </>
                    )}
                  </div>
                )}

                {/* MAX */}
                {employeeLoginMethod === 'max' && (
                  <div className="space-y-3">
                    {maxLoginError && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2"><Icon name="AlertCircle" size={15} className="mt-0.5 shrink-0" /><span>{maxLoginError}</span></div>}
                    {maxLoginStep === 'input' ? (
                      <div className="text-center space-y-3 py-1">
                        <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Icon name="MessageCircle" size={24} className="text-purple-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">Нажмите кнопку — откроется бот MAX, нажмите /start и получите код</p>
                        <Button className="w-full" onClick={handleMaxSendLoginCode} disabled={isMaxLoginLoading}>
                          {isMaxLoginLoading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Открываем...</> : <><Icon name="MessageCircle" size={16} className="mr-2" />Войти через MAX</>}
                        </Button>
                      </div>
                    ) : maxLoginStep === 'wait' ? (
                      <div className="text-center space-y-3 py-1">
                        <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Icon name="MessageCircle" size={24} className="text-purple-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">Откройте MAX и нажмите <strong>/start</strong> в боте</p>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Icon name="Loader2" size={14} className="animate-spin" />Ожидаем подтверждения...
                        </div>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(maxLoginDeepLink, '_blank')}>
                          Открыть бота снова
                        </Button>
                        <Button variant="ghost" className="w-full text-sm" onClick={() => { setMaxLoginStep('input'); setMaxLoginError(''); }}>← Назад</Button>
                      </div>
                    ) : (
                      <>
                        <div className="text-center">
                          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2"><Icon name="MessageCircle" size={22} className="text-purple-500" /></div>
                          <p className="text-sm text-muted-foreground">Бот прислал код в MAX. Действует 10 минут.</p>
                        </div>
                        <div>
                          <Label>Код из MAX</Label>
                          <Input value={maxLoginCode} onChange={e => setMaxLoginCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className="text-center text-2xl tracking-[0.4em] font-mono" maxLength={6} onKeyDown={e => e.key === 'Enter' && handleMaxVerifyLoginCode()} />
                        </div>
                        <Button className="w-full" onClick={handleMaxVerifyLoginCode} disabled={isMaxLoginLoading || maxLoginCode.length !== 6}>
                          {isMaxLoginLoading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Проверяем...</> : 'Войти'}
                        </Button>
                        <Button variant="ghost" className="w-full text-sm" onClick={() => { setMaxLoginStep('wait'); setMaxLoginCode(''); setMaxLoginError(''); }}>← Назад</Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
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
                  <button 
                    onClick={() => {
                      setShowLoginDialog(false);
                      setShowForgotPasswordDialog(true);
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    Забыли пароль?
                  </button>
                </div>
                <Button className="w-full" onClick={handleLogin} disabled={isAuthLoading}>
                  {isAuthLoading ? 'Вход...' : 'Войти'}
                </Button>
              </>
            )}
            
            {resendVerificationEmail && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
                <p className="text-sm font-medium text-yellow-900 flex items-center gap-1">
                  <Icon name="AlertCircle" className="w-4 h-4" />
                  Email не подтверждён
                </p>
                <p className="text-xs text-yellow-700">
                  Проверьте почту {resendVerificationEmail} и перейдите по ссылке в письме
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification || resendVerificationTimer > 0}
                >
                  {isResendingVerification ? (
                    <>
                      <Icon name="Loader2" className="w-3 h-3 mr-1 animate-spin" />
                      Отправка...
                    </>
                  ) : resendVerificationTimer > 0 ? (
                    <>
                      <Icon name="Clock" className="w-3 h-3 mr-1" />
                      Повторить через {resendVerificationTimer}с
                    </>
                  ) : (
                    <>
                      <Icon name="Mail" className="w-3 h-3 mr-1" />
                      Отправить письмо повторно
                    </>
                  )}
                </Button>
              </div>
            )}
            
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

      <DemoDialog
        open={showDemoDialog}
        onOpenChange={setShowDemoDialog}
        form={demoForm}
        onFormChange={setDemoForm}
        onSubmit={handleDemoFormSubmit}
        isSubmitting={demoFormSubmitting}
      />

      <AboutDialog open={showAboutDialog} onOpenChange={setShowAboutDialog} />

      <PrivacyDialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog} />

      <TermsDialog open={showTermsDialog} onOpenChange={setShowTermsDialog} />

      <PersonalDataDialog open={showPersonalDataDialog} onOpenChange={setShowPersonalDataDialog} />
    </div>
  );

  const renderEmployerDashboard = () => {
    
    return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-8 max-w-[140px] object-contain" />
            ) : (
              <>
                <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-lg">
                  <Icon name="Rocket" className="text-white" size={20} />
                </div>
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">iHUNT</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotificationsDialog(true)}>
              <Icon name="Bell" size={18} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setShowSubscriptionDialog(true)} size="sm" className="hidden sm:flex">
              <Icon name="CreditCard" className="mr-2" size={18} />
              <span className="hidden lg:inline">Подписка</span>
              {subscriptionDaysLeft !== null && subscriptionDaysLeft < 14 && (
                <Badge variant="destructive" className="ml-2 text-xs">{subscriptionDaysLeft} дн.</Badge>
              )}
            </Button>
            <Button variant="ghost" onClick={() => { setCompanyEditForm({ description: company?.description || '', website: company?.website || '', industry: company?.industry || '', telegram: company?.telegram || '', vk: company?.vk || '' }); setShowCompanySettingsDialog(true); }} size="icon" className="sm:hidden">
              <Icon name="Settings" size={18} />
            </Button>
            <Button variant="ghost" onClick={() => { setCompanyEditForm({ description: company?.description || '', website: company?.website || '', industry: company?.industry || '', telegram: company?.telegram || '', vk: company?.vk || '' }); setShowCompanySettingsDialog(true); }} size="sm" className="hidden sm:flex">
              <Icon name="Settings" className="mr-2" size={18} />
              <span className="hidden lg:inline">Настройки</span>
            </Button>
            <Button variant="ghost" onClick={handleLogout} size="sm" className="text-xs sm:text-sm">Выход</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-4xl">📈</span>
            <span className="hidden sm:inline">Личный кабинет работодателя</span>
            <span className="sm:hidden text-base">Кабинет</span>
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground">Управление вакансиями и сотрудниками</p>
        </div>

        {isSubscriptionExpired && (
          <Card className="mb-6 sm:mb-8 bg-destructive/10 border-destructive">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="AlertTriangle" className="text-destructive" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base sm:text-lg mb-2 text-destructive">Подписка истекла</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
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
        <Tabs value={activeTab} className="space-y-6" onValueChange={(val) => {
          setActiveTab(val);
          localStorage.setItem('active_tab', val);
          if (val === 'recommendations') setNewRecommendationsCount(0);
          if (val === 'employees') setNewEmployeesCount(0);
          if (val === 'payouts') setNewPayoutsCount(0);
          if (val === 'chats') setUnreadMessagesCount(0);
        }}>
          <ScrollableTabs>
            <TabsList className="w-max sm:w-full">
              <TabsTrigger value="vacancies">💼 Вакансии</TabsTrigger>
              <TabsTrigger value="employees">👥 Сотрудники{newEmployeesCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center bg-blue-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px]">+{newEmployeesCount}</span>}</TabsTrigger>
              <TabsTrigger value="recommendations">🎯 Рекомендации{newRecommendationsCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center bg-green-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px]">+{newRecommendationsCount}</span>}</TabsTrigger>
              <TabsTrigger value="payouts">💰 Выплаты{newPayoutsCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center bg-orange-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px]">+{newPayoutsCount}</span>}</TabsTrigger>
              <TabsTrigger value="news">📢 Новости</TabsTrigger>
              <TabsTrigger value="chats">💬 Чаты{unreadMessagesCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px]">{unreadMessagesCount}</span>}</TabsTrigger>
              <TabsTrigger value="stats">📊 Статистика</TabsTrigger>
              <TabsTrigger value="subscription" className="sm:hidden">💳 Подписка{subscriptionDaysLeft !== null && subscriptionDaysLeft < 14 ? ` (${subscriptionDaysLeft})` : ''}</TabsTrigger>
              <TabsTrigger value="help">❓ Помощь</TabsTrigger>
              <TabsTrigger value="ai-assistant">🤖 ИИ-чат</TabsTrigger>

            </TabsList>
          </ScrollableTabs>

          <TabsContent value="vacancies" className="space-y-4">
            <VacanciesTab
              isSubscriptionExpired={isSubscriptionExpired}
              onRenew={() => setShowSubscriptionDialog(true)}
              vacancies={vacancies}
              vacancyFilter={vacancyFilter}
              onVacancyFilterChange={setVacancyFilter}
              vacancyForm={vacancyForm}
              onVacancyFormChange={setVacancyForm}
              onCreateVacancy={handleCreateVacancy}
              onUpdateVacancy={handleUpdateVacancy}
              onArchiveVacancy={handleArchiveVacancy}
              onRestoreVacancy={handleRestoreVacancy}
              onDeleteVacancy={handleDeleteVacancy}
              onViewDetail={(v) => { setSelectedVacancyDetail(v); setShowVacancyDetail(true); }}
              newReward={newReward}
              onNewRewardChange={setNewReward}
              activeVacancy={activeVacancy}
              onActiveVacancyChange={setActiveVacancy}
              onTestManager={(v) => { setTestManagerVacancy(v); setShowTestManager(true); }}
            />
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <EmployeesTab
              isSubscriptionExpired={isSubscriptionExpired}
              onRenew={() => setShowSubscriptionDialog(true)}
              employees={employees}
              employeeSearchQuery={employeeSearchQuery}
              onSearchChange={setEmployeeSearchQuery}
              employeeStatusFilter={employeeStatusFilter}
              onStatusFilterChange={setEmployeeStatusFilter}
              onReferralLink={handleGenerateReferralLink}
              onViewEmployee={(emp) => { setSelectedEmployee(emp); setShowEmployeeDetail(true); }}
              onEditEmployee={(emp) => { setEmployeeToEdit(emp); setEmployeeEditForm({ firstName: emp.name.split(' ')[1] || '', lastName: emp.name.split(' ')[0] || '', position: emp.position || '', department: emp.department || '' }); setShowEditEmployeeDialog(true); }}
              onOpenChat={(emp) => { setActiveChatEmployee(emp); setShowChatDialog(true); }}
              showEditRolesDialog={showEditRolesDialog}
              onEditRolesDialogChange={setShowEditRolesDialog}
              employeeToEditRoles={employeeToEditRoles}
              rolesForm={rolesForm}
              onRolesFormChange={setRolesForm}
              onSaveRoles={handleSaveRoles}
              onFireEmployee={handleToggleFired}
              onSetEmployeeToEditRoles={setEmployeeToEditRoles}
              currentUserRole={userRole}
              calculateEmployeeRank={calculateEmployeeRank}
            />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <RecommendationsTab
              isSubscriptionExpired={isSubscriptionExpired}
              onRenew={() => setShowSubscriptionDialog(true)}
              recommendations={recommendations}
              searchQuery={recommendationSearchQuery}
              onSearchChange={setRecommendationSearchQuery}
              statusFilter={recommendationStatusFilter}
              onStatusFilterChange={setRecommendationStatusFilter}
              onUpdateStatus={handleUpdateRecommendationStatus}
              onViewDetails={(rec) => { setActiveRecommendation(rec); setShowRecommendationDetailsDialog(true); }}
            />
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            <PayoutsTab
              isSubscriptionExpired={isSubscriptionExpired}
              onRenew={() => setShowSubscriptionDialog(true)}
              payoutMethodsCollapsed={payoutMethodsCollapsed}
              onPayoutMethodsCollapsedChange={setPayoutMethodsCollapsed}
              company={company}
              onCompanyChange={setCompany}
              payoutRequests={payoutRequests}
              currentCompanyId={currentCompanyId}
              vacancies={vacancies}
              onViewVacancy={(v) => { setSelectedVacancyDetail(v); setShowVacancyDetail(true); }}
              onReloadData={loadData}
              currentUserId={currentUser?.id || 1}
            />
          </TabsContent>

          <TabsContent value="news" className="space-y-4">
            <NewsTab
              isSubscriptionExpired={isSubscriptionExpired}
              onRenew={() => setShowSubscriptionDialog(true)}
              newsPosts={newsPosts}
              onCreateNews={() => setShowCreateNewsDialog(true)}
              onEditNews={(post) => { setNewsToEdit(post); setNewsForm({ title: post.title, content: post.content, category: post.category || '' }); setShowEditNewsDialog(true); }}
              onArchiveNews={handleArchiveNews}
              onLikeNews={handleLikeNews}
              onViewComments={(post) => { setActiveNewsPost(post); setShowCommentsDialog(true); }}
              showCreateNewsDialog={showCreateNewsDialog}
              onCreateNewsDialogChange={setShowCreateNewsDialog}
              newsForm={newsForm}
              onNewsFormChange={setNewsForm}
              onSubmitNews={handleCreateNews}
              showEditNewsDialog={showEditNewsDialog}
              onEditNewsDialogChange={setShowEditNewsDialog}
              newsToEdit={newsToEdit}
              onSubmitEditNews={handleEditNews}
            />
          </TabsContent>

          <TabsContent value="chats" className="space-y-4">
            <ChatsTab
              isSubscriptionExpired={isSubscriptionExpired}
              onRenew={() => setShowSubscriptionDialog(true)}
              chats={chats}
              employees={employees}
              onOpenChat={(emp) => { setActiveChatEmployee(emp); setShowChatDialog(true); }}
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <StatsTab
              recommendations={recommendations}
              employees={employees}
              vacancies={vacancies}
              companyName={company?.name}
            />
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4 sm:hidden">
            <SubscriptionTab
              subscriptionDaysLeft={subscriptionDaysLeft}
              company={company}
              onRenew={() => setShowSubscriptionDialog(true)}
            />
          </TabsContent>

          <TabsContent value="help" className="space-y-6">
            <HelpTab />
          </TabsContent>


          <TabsContent value="ai-assistant" className="space-y-4">
            <AiAssistantTabWrapper
              companyId={currentCompanyId}
              messages={aiMessages}
              setMessages={setAiMessages}
            />
          </TabsContent>

        </Tabs>
        )}
      </div>

      <InviteEmployeeDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        form={inviteForm}
        onFormChange={setInviteForm}
        onSubmit={handleInviteEmployee}
        isLoading={isAuthLoading}
      />

      <CompanySettingsDialog
        open={showCompanySettingsDialog}
        onOpenChange={setShowCompanySettingsDialog}
        company={company}
        form={companyEditForm}
        onFormChange={setCompanyEditForm}
        logoPreview={companyLogoPreview}
        onLogoFileChange={(file) => {
          setCompanyLogoFile(file);
          const reader = new FileReader();
          reader.onload = (ev) => setCompanyLogoPreview(ev.target?.result as string);
          reader.readAsDataURL(file);
        }}
        onLogoRemove={() => {
          setCompanyLogoPreview(null);
          setCompanyLogoFile(null);
          if (company?.logo_url) {
            api.updateCompany(currentCompanyId, { logo_url: '' });
            setCompany(prev => prev ? { ...prev, logo_url: undefined } : null);
          }
        }}
        onSave={handleSaveCompany}
        isSaving={isSavingCompany}
      />

      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent hideClose className="max-w-4xl h-[100dvh] sm:h-[600px] w-[100vw] sm:w-full rounded-none sm:rounded-lg flex flex-col p-0 overflow-hidden">
          <div className="flex h-full overflow-hidden">
            {/* Sidebar — on mobile hidden when chat is open */}
            <div className={`${activeChatEmployee ? 'hidden sm:flex' : 'flex'} w-full sm:w-72 border-r flex-col shrink-0`}>
              <div className="p-3 sm:p-4 border-b flex items-center justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-base">Чаты</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Выберите сотрудника для диалога</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 sm:hidden" onClick={() => setShowChatDialog(false)}>
                  <Icon name="X" size={18} />
                </Button>
              </div>
              <div className="px-3 py-2 sm:px-4 border-b">
                <Input 
                  placeholder="Поиск сотрудника..." 
                  value={employeeSearchQuery}
                  onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {employees.filter(emp => {
                  if (!employeeSearchQuery) return true;
                  const query = employeeSearchQuery.toLowerCase();
                  return emp.name.toLowerCase().includes(query) || 
                         emp.position.toLowerCase().includes(query) ||
                         emp.department.toLowerCase().includes(query);
                }).map((emp) => (
                  <div
                    key={emp.id}
                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      activeChatEmployee?.id === emp.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleSelectChatEmployee(emp)}
                  >
                    <div className="flex items-center gap-3">
                      {emp.avatar ? (
                        <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover shrink-0" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon name="User" size={18} className="text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{emp.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{emp.position}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${activeChatEmployee ? 'flex' : 'hidden sm:flex'} flex-1 flex-col min-w-0`}>
              {activeChatEmployee ? (
                <>
                  <div className="p-3 sm:p-4 border-b shrink-0">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 sm:hidden" onClick={() => setActiveChatEmployee(null)}>
                        <Icon name="ArrowLeft" size={18} />
                      </Button>
                      <button
                        className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setSelectedEmployee(activeChatEmployee);
                          setShowEmployeeDetail(true);
                        }}
                      >
                        {activeChatEmployee.avatar ? (
                          <img src={activeChatEmployee.avatar} alt={activeChatEmployee.name} className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover shrink-0" loading="lazy" decoding="async" />
                        ) : (
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon name="User" size={18} className="text-primary" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{activeChatEmployee.name}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{activeChatEmployee.position}</p>
                        </div>
                      </button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 sm:hidden" onClick={() => setShowChatDialog(false)}>
                        <Icon name="X" size={18} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
                    {chatMessages.length === 0 && (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Начните диалог</div>
                    )}
                    {chatMessages.map((msg, idx) => {
                      const msgDate = new Date(msg.createdAt);
                      const prevMsg = chatMessages[idx - 1];
                      const prevDate = prevMsg ? new Date(prevMsg.createdAt) : null;
                      const showDateSeparator = !prevDate ||
                        msgDate.getFullYear() !== prevDate.getFullYear() ||
                        msgDate.getMonth() !== prevDate.getMonth() ||
                        msgDate.getDate() !== prevDate.getDate();
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(today.getDate() - 1);
                      const isToday = msgDate.toDateString() === today.toDateString();
                      const isYesterday = msgDate.toDateString() === yesterday.toDateString();
                      const dateLabel = isToday
                        ? 'Сегодня'
                        : isYesterday
                        ? 'Вчера'
                        : msgDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
                      return (
                        <div key={msg.id}>
                          {showDateSeparator && (
                            <div className="flex items-center gap-2 my-3">
                              <div className="flex-1 h-px bg-border" />
                              <span className="text-[10px] sm:text-xs text-muted-foreground px-2 shrink-0">{dateLabel}</span>
                              <div className="flex-1 h-px bg-border" />
                            </div>
                          )}
                          <div className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] sm:max-w-[70%] ${msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-2 py-1.5 sm:px-4 sm:py-2`}>
                              <div className="text-[10px] sm:text-xs opacity-70 mb-0.5">{msg.senderName}</div>
                              {msg.message && <div className="text-xs sm:text-sm break-words">{msg.message}</div>}
                              {msg.attachments && msg.attachments.map((att, aidx) => (
                                <div key={aidx} className="mt-1.5">
                                  {att.type === 'image' ? (
                                    <img
                                      src={att.url}
                                      alt={att.name}
                                      className="rounded max-w-full max-h-32 sm:max-h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => setLightboxImage(att.url)}
                                      loading="lazy"
                                      decoding="async"
                                    />
                                  ) : (
                                    <a
                                      href={att.url}
                                      download={att.name}
                                      className="flex items-center gap-1.5 p-1.5 bg-background/10 rounded hover:bg-background/20 transition-colors group"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Icon name="FileText" size={14} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] sm:text-xs font-medium truncate">{att.name}</p>
                                        <p className="text-[10px] sm:text-xs opacity-70">{(att.size / 1024).toFixed(1)} KB</p>
                                      </div>
                                      <Icon name="Download" size={12} className="opacity-60 group-hover:opacity-100 shrink-0" />
                                    </a>
                                  )}
                                </div>
                              ))}
                              <div className="text-[10px] sm:text-xs opacity-70 mt-0.5">{msg.timestamp}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatMessagesEndRef} />
                  </div>
                  <div className="p-1.5 sm:p-4 border-t shrink-0">
                    {selectedFiles.length > 0 && (
                      <div className="mb-1.5 sm:mb-3 flex flex-wrap gap-1.5">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="relative bg-muted rounded-lg p-1.5 pr-7">
                            <div className="flex items-center gap-1.5">
                              <Icon name={file.type.startsWith('image/') ? 'Image' : 'FileText'} size={14} />
                              <span className="text-[10px] sm:text-xs max-w-[80px] sm:max-w-[120px] truncate">{file.name}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-0.5 right-0.5 h-5 w-5 p-0"
                              onClick={() => removeFile(idx)}
                            >
                              <Icon name="X" size={12} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1 sm:gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          onChange={handleFileSelect}
                          multiple
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        <span className="inline-flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                          <Icon name="Paperclip" size={14} className="sm:hidden" />
                          <Icon name="Paperclip" size={18} className="hidden sm:block" />
                        </span>
                      </label>
                      <Input 
                        placeholder={activeChatId ? "Сообщение..." : "Загрузка чата..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={!activeChatId || isSendingMessage}
                        className="flex-1 text-xs sm:text-sm h-8 sm:h-10 min-w-0"
                      />
                      <Button onClick={handleSendMessage} disabled={!activeChatId || isSendingMessage} className="h-8 w-8 sm:h-10 sm:w-10 p-0 shrink-0">
                        <Icon name="Send" size={14} className="sm:hidden" />
                        <Icon name="Send" size={18} className="hidden sm:block" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
                  <div className="text-center">
                    <Icon name="MessageSquare" size={36} className="mx-auto mb-2 opacity-50 sm:mb-3" />
                    <p className="text-xs sm:text-base">Выберите сотрудника</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditEmployeeDialog} onOpenChange={setShowEditEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Данные сотрудника</DialogTitle>
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

      <Dialog open={showRecommendationDetailsDialog} onOpenChange={setShowRecommendationDetailsDialog}>
        <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl rounded-none sm:rounded-lg flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
            <DialogTitle className="text-base">Детали рекомендации</DialogTitle>
            <DialogDescription className="text-xs">
              Кандидат: {activeRecommendation?.candidateName}
            </DialogDescription>
          </DialogHeader>
          {activeRecommendation && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">ФИО кандидата</p>
                    <p className="text-sm font-medium">{activeRecommendation.candidateName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Вакансия</p>
                    <p className="text-sm font-medium">{activeRecommendation.vacancy}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium break-all">{activeRecommendation.candidateEmail}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Телефон</p>
                    <p className="text-sm font-medium">{activeRecommendation.candidatePhone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Дата</p>
                    <p className="text-sm font-medium">{new Date(activeRecommendation.date).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Статус</p>
                    <Badge className="mt-0.5 text-[10px] px-1.5 py-0.5" variant={
                      activeRecommendation.status === 'accepted' ? 'default' :
                      activeRecommendation.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {activeRecommendation.status === 'accepted' ? 'Принят' :
                       activeRecommendation.status === 'rejected' ? 'Отклонён' : 'На рассмотрении'}
                    </Badge>
                  </div>
                </div>

                {activeRecommendation.recommendedBy && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Рекомендовал</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px]">
                          {activeRecommendation.recommendedBy.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium flex-1">{activeRecommendation.recommendedBy}</span>
                      {activeRecommendation.employeeId && (() => {
                        const emp = employees.find(e => e.id === activeRecommendation.employeeId);
                        if (!emp) return null;
                        return (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2"
                              title="Написать"
                              onClick={() => {
                                setActiveChatEmployee(emp);
                                setShowChatDialog(true);
                              }}
                            >
                              <Icon name="MessageCircle" size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2"
                              title="Профиль"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setShowEmployeeDetail(true);
                              }}
                            >
                              <Icon name="User" size={14} />
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Комментарий</p>
                  <p className="text-sm p-2.5 bg-muted rounded-md whitespace-pre-wrap">
                    {activeRecommendation.comment || 'Комментарий отсутствует'}
                  </p>
                </div>

                {activeRecommendation.resumeUrl && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Резюме</p>
                    <a href={activeRecommendation.resumeUrl} target="_blank" rel="noopener noreferrer" download>
                      <Button variant="outline" size="sm" className="gap-2 text-xs h-8">
                        <Icon name="Download" size={14} />
                        Скачать резюме
                      </Button>
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Icon name="Award" size={18} className="text-primary" />
                  <span className="text-lg font-bold">{activeRecommendation.reward.toLocaleString()} ₽</span>
                  <span className="text-xs text-muted-foreground">вознаграждение</span>
                </div>
              </div>

              {activeRecommendation.status === 'pending' && (
                <div className="px-4 py-3 border-t shrink-0 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      handleUpdateRecommendationStatus(activeRecommendation.id, 'rejected');
                      setShowRecommendationDetailsDialog(false);
                    }}
                    disabled={isSubscriptionExpired}
                  >
                    <Icon name="X" className="mr-1.5" size={16} />
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
                    <Icon name="Check" className="mr-1.5" size={16} />
                    Принять
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateNewsDialog} onOpenChange={setShowCreateNewsDialog}>
        <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl rounded-none sm:rounded-lg flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
            <DialogTitle className="text-base">Создать новость</DialogTitle>
            <DialogDescription className="text-xs">
              Опубликуйте новость или объявление для сотрудников
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <div>
              <Label htmlFor="news-category" className="text-xs">Категория</Label>
              <Select
                value={newsForm.category}
                onValueChange={(value) => setNewsForm({...newsForm, category: value as any})}
              >
                <SelectTrigger id="news-category" className="mt-1 h-9 text-sm">
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
              <Label htmlFor="news-title" className="text-xs">Заголовок</Label>
              <Input
                id="news-title"
                className="mt-1 h-9 text-sm"
                placeholder="Введите заголовок новости"
                value={newsForm.title}
                onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="news-content" className="text-xs">Содержание</Label>
              <Textarea
                id="news-content"
                className="mt-1 text-sm"
                placeholder="Расскажите подробнее..."
                rows={6}
                value={newsForm.content}
                onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Новость увидят все сотрудники на главной странице
              </p>
            </div>
          </div>
          <div className="px-4 py-3 border-t shrink-0 flex gap-2">
            <Button className="flex-1" onClick={handleCreateNews}>
              <Icon name="Send" className="mr-1.5" size={16} />
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

      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Управление подпиской</DialogTitle>
            <DialogDescription>Текущий статус и продление тарифного плана</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Card className={subscriptionDaysLeft <= 0 ? 'border-destructive' : subscriptionDaysLeft < 7 ? 'border-orange-400' : 'border-primary'}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{company?.subscription_tier === 'trial' ? 'Пробный период' : 'Продвинутый'}</CardTitle>
                  <Badge variant={subscriptionDaysLeft <= 0 ? 'destructive' : subscriptionDaysLeft < 7 ? 'destructive' : 'secondary'}>
                    {subscriptionDaysLeft <= 0 ? 'Истекла' : `${subscriptionDaysLeft} дн. осталось`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={Math.max(0, Math.min(100, (subscriptionDaysLeft / 30) * 100))} className="h-2" />
                {company?.subscription_expires_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Действует до: {new Date(company.subscription_expires_at).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </CardContent>
            </Card>

            {subscriptionDaysLeft < 7 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                <Icon name="AlertTriangle" className="text-destructive mt-0.5 shrink-0" size={16} />
                <p className="text-sm text-destructive">
                  {subscriptionDaysLeft <= 0 ? 'Подписка истекла. Доступ ограничен.' : 'Подписка заканчивается. Продлите, чтобы не потерять доступ.'}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Тариф "Продвинутый" — без ограничений на сотрудников</p>
              <div className="grid grid-cols-2 gap-3">
                <Card className={`cursor-pointer border-2 transition-colors ${demoForm.employeeCount === '30' ? 'border-primary bg-primary/5' : 'border-border'}`}
                  onClick={() => setDemoForm({ ...demoForm, employeeCount: '30' })}>
                  <CardContent className="p-4 text-center">
                    <p className="font-bold text-lg">19 900 ₽</p>
                    <p className="text-xs text-muted-foreground">30 дней</p>
                  </CardContent>
                </Card>
                <Card className={`cursor-pointer border-2 transition-colors ${demoForm.employeeCount === '365' ? 'border-primary bg-primary/5' : 'border-border'}`}
                  onClick={() => setDemoForm({ ...demoForm, employeeCount: '365' })}>
                  <CardContent className="p-4 text-center">
                    <p className="font-bold text-lg">202 980 ₽</p>
                    <p className="text-xs text-muted-foreground">1 год <span className="text-green-600 font-medium">−15%</span></p>
                  </CardContent>
                </Card>
              </div>
              <Input
                placeholder="Ваше имя *"
                value={demoForm.name}
                onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
              />
              <Input
                placeholder="Телефон *"
                type="tel"
                value={demoForm.phone}
                onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
              />
              <Input
                placeholder="Email *"
                type="email"
                value={demoForm.email}
                onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
              />
              <Button
                className="w-full"
                disabled={demoFormSubmitting}
                onClick={async () => {
                  if (!demoForm.name || !demoForm.phone || !demoForm.email) {
                    alert('Заполните имя, телефон и email');
                    return;
                  }
                  const period = demoForm.employeeCount === '365' ? '1 год (202 980 ₽)' : demoForm.employeeCount === '30' ? '30 дней (19 900 ₽)' : 'не выбран';
                  setDemoFormSubmitting(true);
                  try {
                    await fetch('https://functions.poehali.dev/f58cb721-86b3-42c5-a5c1-c608cf9ee264', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: demoForm.name,
                        email: 'info@i-hunt.ru',
                        message: `ЗАЯВКА НА ПРОДЛЕНИЕ ПОДПИСКИ\n\nКомпания: ${company?.name || '—'}\nИмя: ${demoForm.name}\nТелефон: ${demoForm.phone}\nEmail: ${demoForm.email}\nВыбранный период: ${period}\nТекущий тариф: ${company?.subscription_tier || '—'}\nОсталось дней: ${subscriptionDaysLeft}`
                      })
                    });
                    setShowSubscriptionDialog(false);
                    setDemoForm({ companyName: '', name: '', phone: '', email: '', employeeCount: '' });
                    alert('✅ Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
                  } catch {
                    alert('Ошибка отправки. Попробуйте позже.');
                  } finally {
                    setDemoFormSubmitting(false);
                  }
                }}
              >
                {demoFormSubmitting ? (
                  <><Icon name="Loader2" className="mr-2 animate-spin" size={16} />Отправка...</>
                ) : (
                  <><Icon name="CreditCard" className="mr-2" size={16} />Отправить заявку</>
                )}
              </Button>
            </div>
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

      <Suspense fallback={null}>
        <VacancyDetail
          vacancy={selectedVacancyDetail}
          open={showVacancyDetail}
          onOpenChange={setShowVacancyDetail}
          showRecommendButton={false}
        />
      </Suspense>

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
                      {userRole === 'employer' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Icon name="Trash2" size={14} className="text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Написать комментарий..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              <Icon name="Send" size={18} />
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
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-lg">
              <Icon name="Rocket" className="text-white" size={20} />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">iHUNT</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotificationsDialog(true)}>
              <Icon name="Bell" size={18} />
              {employeeNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs">
                  {employeeNotifications.filter(n => !n.read).length}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setShowCompanyProfileDialog(true)} size="icon" className="sm:hidden">
              <Icon name="Building2" size={18} />
            </Button>
            <Button variant="ghost" onClick={() => setShowCompanyProfileDialog(true)} size="sm" className="hidden sm:flex">
              <Icon name="Building2" className="mr-2" size={18} />
              <span className="hidden lg:inline">О компании</span>
            </Button>
            <Button variant="ghost" onClick={handleOpenChat} className="relative hidden sm:flex" size="sm">
              <Icon name="MessageCircle" className="mr-2" size={18} />
              <span className="hidden lg:inline">Чат с HR</span>
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadMessagesCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={handleOpenChat} className="relative sm:hidden" size="icon">
              <Icon name="MessageCircle" size={18} />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                  {unreadMessagesCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={handleLogout} size="sm" className="text-xs sm:text-sm">Выход</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="md:col-span-2">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                  <AvatarImage src={employees.find(e => e.id === currentEmployeeId)?.avatar} />
                  <AvatarFallback>
                    {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 w-full">
                  <CardTitle className="text-lg sm:text-2xl flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span>{currentUser?.first_name} {currentUser?.last_name}</span>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs">
                      🏆 #{calculateEmployeeRank(employees.find(e => e.id === currentEmployeeId) || employees[0])} в рейтинге
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <span>{employees.find(e => e.id === currentEmployeeId)?.position || currentUser?.position} • {employees.find(e => e.id === currentEmployeeId)?.department || currentUser?.department}</span>
                    {(employees.find(e => e.id === currentEmployeeId)?.hired || 0) >= 5 && (
                      <span className="text-primary font-medium">• Мастер рекрутинга</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-initial text-xs" onClick={() => {
                    const currentEmployee = employees.find(e => e.id === currentEmployeeId);
                    if (currentEmployee) {
                      const names = currentEmployee.name.split(' ');
                      setEditProfileForm({
                        firstName: names[0] || '',
                        lastName: names[1] || '',
                        position: currentEmployee.position || '',
                        department: currentEmployee.department || ''
                      });
                      setProfileForm({
                        phone: currentEmployee.phone || '',
                        telegram: currentEmployee.telegram || '',
                        vk: currentEmployee.vk || '',
                        avatar: currentEmployee.avatar || ''
                      });
                    }
                    setShowEditProfileDialog(true);
                  }}>
                    <Icon name="Edit" size={14} className="mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Редактировать профиль</span>
                    <span className="sm:hidden">Редактировать</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-3 sm:space-y-4">
                {(() => {
                  const emp = employees.find(e => e.id === currentEmployeeId);
                  const level = emp?.level || 1;
                  const xp = emp?.experiencePoints || 0;
                  const xpForNextLevel = level * 100;
                  const xpProgress = Math.min(100, Math.round((xp / xpForNextLevel) * 100));
                  return (
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-2">
                        <span className="font-medium">Уровень {level}</span>
                        <span className="text-muted-foreground">{xp} / {xpForNextLevel} XP</span>
                      </div>
                      <Progress value={xpProgress} className="h-2" />
                    </div>
                  );
                })()}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1">🎯</div>
                    <div className="text-xl sm:text-2xl font-bold text-primary">
                      {employees.find(e => e.id === currentEmployeeId)?.recommendations || 0}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Рекомендаций</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1">✅</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {employees.find(e => e.id === currentEmployeeId)?.hired || 0}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Нанято</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1">💸</div>
                    <div className="text-xl sm:text-2xl font-bold text-secondary">
                      {(employees.find(e => e.id === currentEmployeeId)?.earnings || 0).toLocaleString()} ₽
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Заработано</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <span className="text-xl sm:text-2xl">💰</span>
                Кошелек
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Доступно для выплаты</div>
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  {walletData?.wallet?.wallet_balance?.toLocaleString() || 0} ₽
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Ожидает разблокировки</div>
                <div className="text-xl sm:text-2xl font-bold text-muted-foreground">
                  {walletData?.wallet?.wallet_pending?.toLocaleString() || 0} ₽
                </div>
                {walletData?.pending_payouts && walletData.pending_payouts.length > 0 && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    <Icon name="Clock" size={12} className="inline mr-1" />
                    Следующая: {new Date(walletData.pending_payouts[0].unlock_date).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
              <Button 
                className="w-full text-xs sm:text-sm" 
                variant="outline"
                size="sm"
                onClick={() => setShowWithdrawDialog(true)}
                disabled={(walletData?.wallet?.wallet_balance || 0) === 0}
              >Запросить выплату</Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="news" className="space-y-4 sm:space-y-6" onValueChange={(tab) => {
          setActiveEmployeeTab(tab);
          if (tab === 'vacancies') setNewVacanciesCount(0);
          if (tab === 'news') setNewNewsCount(0);
          if (tab === 'my-recommendations') setNewRecommendationsCount(0);
          if (tab === 'notifications') {
            setNewNotificationsCount(0);
            setNotifications(prev => {
              const ids = prev.filter(n => !n.read).map(n => String(n.id));
              if (ids.length) markNotifIdsRead(ids);
              return prev.map(n => ({ ...n, read: true }));
            });
          }
        }}>
          <ScrollableTabs>
            <TabsList className="inline-flex w-max gap-1">
              <TabsTrigger value="news" className="text-xs whitespace-nowrap px-2 py-1.5 relative">
                <span>📢</span><span className="tab-label ml-1">Новости</span>
                {newNewsCount > 0 && <Badge className="ml-1 px-1 py-0 text-[10px] bg-purple-500 text-white border-0 leading-4">+{newNewsCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="vacancies" className="text-xs whitespace-nowrap px-2 py-1.5 relative">
                <span>💼</span><span className="tab-label ml-1">Вакансии</span>
                {newVacanciesCount > 0 && <Badge className="ml-1 px-1 py-0 text-[10px] bg-green-500 text-white border-0 leading-4">+{newVacanciesCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="my-recommendations" className="text-xs whitespace-nowrap px-2 py-1.5 relative">
                <span>⭐</span><span className="tab-label ml-1">Рекомендации</span>
                {newRecommendationsCount > 0 && <Badge className="ml-1 px-1 py-0 text-[10px] bg-orange-500 text-white border-0 leading-4">+{newRecommendationsCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="achievements" className="text-xs whitespace-nowrap px-2 py-1.5">
                <span>🏆</span><span className="tab-label ml-1">Рейтинг</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs whitespace-nowrap px-2 py-1.5 relative">
                <span>🔔</span><span className="tab-label ml-1">Уведомления</span>
                {newNotificationsCount > 0 && <Badge className="ml-1 px-1 py-0 text-[10px] bg-red-500 text-white border-0 leading-4">+{newNotificationsCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="wallet-history" className="text-xs whitespace-nowrap px-2 py-1.5">
                <span>💳</span><span className="tab-label ml-1">История</span>
              </TabsTrigger>
              <TabsTrigger value="help" className="text-xs whitespace-nowrap px-2 py-1.5">
                <span>❓</span><span className="tab-label ml-1">Помощь</span>
              </TabsTrigger>
              <TabsTrigger value="games" className="text-xs whitespace-nowrap px-2 py-1.5">
                <span>🎮</span><span className="tab-label ml-1">Игры</span>
              </TabsTrigger>
            </TabsList>
          </ScrollableTabs>

          <TabsContent value="news" className="space-y-4">
            <EmployeeNewsTab
              newsPosts={newsPosts}
              onLike={handleLikeNews}
              onComments={(post) => { setActiveNewsPost(post); setShowCommentsDialog(true); }}
            />
          </TabsContent>

          <TabsContent value="vacancies" className="space-y-4">
            <EmployeeVacanciesTab
              isSubscriptionExpired={isSubscriptionExpired}
              vacancies={vacancies}
              vacancySearchQuery={vacancySearchQuery}
              onSearchChange={setVacancySearchQuery}
              activeVacancy={activeVacancy}
              onSetActiveVacancy={setActiveVacancy}
              recommendationForm={recommendationForm}
              onRecommendationFormChange={setRecommendationForm}
              onCreateRecommendation={handleCreateRecommendation}
              onViewDetail={(v) => { setSelectedVacancyDetail(v); setShowVacancyDetail(true); }}
            />
          </TabsContent>

          <TabsContent value="my-recommendations" className="space-y-4">
            <MyRecommendationsTab
              recommendations={recommendations}
              currentEmployeeId={currentEmployeeId}
              onViewCandidate={(rec) => { setSelectedCandidate(rec); setShowCandidateDetail(true); }}
              onNavigateToVacancies={() => setActiveTab('vacancies')}
            />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <AchievementsTab
              employees={employees}
              recommendations={recommendations}
              currentEmployeeId={currentEmployeeId}
            />
          </TabsContent>

          <TabsContent value="wallet-history" className="space-y-4">
            <WalletHistoryTab
              recommendations={recommendations}
              currentEmployeeId={currentEmployeeId}
            />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationsTab
              notifications={notifications}
              userRole={userRole}
              onMarkRead={(id) => {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
                setNewNotificationsCount(prev => Math.max(0, prev - 1));
              }}
            />
          </TabsContent>

          <TabsContent value="help" className="space-y-6">
            <EmployeeHelpTab />
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <GamesTabWrapper />
          </TabsContent>

          {currentUser?.is_hr_manager && (
            <TabsContent value="hr-vacancies" className="space-y-4">
              <HrVacanciesTab vacancies={vacancies} />
            </TabsContent>
          )}

          {currentUser?.is_hr_manager && (
            <TabsContent value="hr-recommendations" className="space-y-4">
              <HrRecommendationsTab recommendations={recommendations} />
            </TabsContent>
          )}
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
              <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain p-1" loading="lazy" decoding="async" />
                ) : (
                  <Icon name="Building2" className="text-primary" size={40} />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{company?.name || '—'}</h3>
                <p className="text-muted-foreground">{{ tech: 'IT и технологии', finance: 'Финансы', retail: 'Розничная торговля', manufacturing: 'Производство', services: 'Услуги' }[company?.industry || ''] || company?.industry || ''}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              {company?.description && (
                <div>
                  <Label className="text-sm font-medium">О компании</Label>
                  <p className="text-sm text-muted-foreground mt-1">{company.description}</p>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                {company?.website && (
                  <div>
                    <Label className="text-sm font-medium">Веб-сайт</Label>
                    <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" className="text-sm text-primary hover:underline mt-1 flex items-center gap-1">
                      {company.website.replace(/^https?:\/\//, '')}
                      <Icon name="ExternalLink" size={14} />
                    </a>
                  </div>
                )}
                {company?.size && (
                  <div>
                    <Label className="text-sm font-medium">Количество сотрудников</Label>
                    <p className="text-sm text-muted-foreground mt-1">{company.size}</p>
                  </div>
                )}
                {company?.telegram && (
                  <div>
                    <Label className="text-sm font-medium">Telegram</Label>
                    <a href={company.telegram.startsWith('http') ? company.telegram : `https://t.me/${company.telegram.replace(/^@/, '')}`} target="_blank" className="text-sm text-primary hover:underline mt-1 flex items-center gap-1">
                      <Icon name="Send" size={14} />
                      {company.telegram}
                    </a>
                  </div>
                )}
                {company?.vk && (
                  <div>
                    <Label className="text-sm font-medium">ВКонтакте</Label>
                    <a href={company.vk.startsWith('http') ? company.vk : `https://${company.vk}`} target="_blank" className="text-sm text-primary hover:underline mt-1 flex items-center gap-1">
                      <Icon name="MessageCircle" size={14} />
                      {company.vk}
                    </a>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Открытые вакансии</Label>
                <p className="text-sm text-muted-foreground mt-1">{vacancies.length} активных вакансий</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showIntegrationDialog} onOpenChange={setShowIntegrationDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Загрузка базы сотрудников</DialogTitle>
            <DialogDescription>
              Выберите источник для автоматической загрузки сотрудников
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <Label htmlFor="integration-source">Источник данных</Label>
              <Select 
                value={integrationForm.source} 
                onValueChange={(value) => setIntegrationForm({...integrationForm, source: value})}
              >
                <SelectTrigger id="integration-source" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1c">
                    <div className="flex items-center gap-2">
                      <Icon name="Database" size={16} />
                      <span>1С: Предприятие</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Дополнительные интеграции будут добавлены в ближайшее время
              </p>
            </div>

            {integrationForm.source === '1c' && (
              <>
                <div>
                  <Label htmlFor="api-url">URL API 1С</Label>
                  <Input
                    id="api-url"
                    placeholder="https://your-1c-server.com/api/employees"
                    value={integrationForm.apiUrl}
                    onChange={(e) => setIntegrationForm({...integrationForm, apiUrl: e.target.value})}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Укажите адрес API для получения списка сотрудников
                  </p>
                </div>

                <div>
                  <Label htmlFor="api-key">Ключ API</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Введите ключ доступа"
                    value={integrationForm.apiKey}
                    onChange={(e) => setIntegrationForm({...integrationForm, apiKey: e.target.value})}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ключ для авторизации запросов к API 1С
                  </p>
                </div>

                <div>
                  <Label htmlFor="sync-interval">Периодичность синхронизации</Label>
                  <Select 
                    value={integrationForm.syncInterval} 
                    onValueChange={(value) => setIntegrationForm({...integrationForm, syncInterval: value})}
                  >
                    <SelectTrigger id="sync-interval" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Вручную</SelectItem>
                      <SelectItem value="daily">Ежедневно</SelectItem>
                      <SelectItem value="weekly">Еженедельно</SelectItem>
                      <SelectItem value="monthly">Ежемесячно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      <Icon name="Info" className="text-blue-600 mt-0.5" size={18} />
                      <div className="space-y-2 text-sm">
                        <p className="font-medium text-blue-900">Что будет загружено из 1С:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-800">
                          <li>ФИО сотрудников</li>
                          <li>Должности и отделы</li>
                          <li>Контактные данные (email, телефон)</li>
                          <li>Статус сотрудника (работает/уволен)</li>
                        </ul>
                        <p className="text-xs text-blue-700 mt-2">
                          Существующие сотрудники будут обновлены, новые — добавлены
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                className="flex-1"
                onClick={() => {
                  alert('Интеграция настроена! Загрузка сотрудников начнется автоматически.');
                  setShowIntegrationDialog(false);
                }}
                disabled={!integrationForm.apiUrl || !integrationForm.apiKey}
              >
                <Icon name="Download" size={16} className="mr-2" />
                Настроить интеграцию
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowIntegrationDialog(false)}
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ChatDialog
        open={showChatDialog}
        onOpenChange={setShowChatDialog}
        messages={chatMessages}
        newMessage={newMessage}
        onNewMessageChange={setNewMessage}
        selectedFiles={selectedFiles}
        onFileSelect={handleFileSelect}
        onRemoveFile={removeFile}
        onSend={handleSendMessage}
      />

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
                <p className="text-xs mt-1">Здесь появятся уведомления о новых вакансиях, изменениях статусов кандидатов, сообщениях и балансе</p>
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
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notif.type === 'recommendation' ? 'bg-blue-100' :
                        notif.type === 'subscription' ? 'bg-orange-100' :
                        notif.type === 'vacancy' ? 'bg-purple-100' :
                        notif.type === 'wallet' ? 'bg-green-100' :
                        notif.type === 'chat' ? 'bg-indigo-100' :
                        notif.type === 'news' ? 'bg-yellow-100' :
                        notif.type === 'employee' ? 'bg-teal-100' :
                        notif.type === 'payout' ? 'bg-rose-100' :
                        'bg-gray-100'
                      }`}>
                        <Icon 
                          name={
                            notif.type === 'recommendation' ? 'UserPlus' :
                            notif.type === 'subscription' ? 'CreditCard' :
                            notif.type === 'vacancy' ? 'Briefcase' :
                            notif.type === 'wallet' ? 'Wallet' :
                            notif.type === 'chat' ? 'MessageCircle' :
                            notif.type === 'news' ? 'Newspaper' :
                            notif.type === 'employee' ? 'UserCheck' :
                            notif.type === 'payout' ? 'Banknote' :
                            'Bell'
                          } 
                          className={
                            notif.type === 'recommendation' ? 'text-blue-600' :
                            notif.type === 'subscription' ? 'text-orange-600' :
                            notif.type === 'vacancy' ? 'text-purple-600' :
                            notif.type === 'wallet' ? 'text-green-600' :
                            notif.type === 'chat' ? 'text-indigo-600' :
                            notif.type === 'news' ? 'text-yellow-600' :
                            notif.type === 'employee' ? 'text-teal-600' :
                            notif.type === 'payout' ? 'text-rose-600' :
                            'text-gray-600'
                          }
                          size={18} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(notif.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="pt-4 border-t flex gap-2">
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={() => {
                const ids = notifications.filter(n => !n.read).map(n => String(n.id));
                if (ids.length) markNotifIdsRead(ids);
                setNotifications(notifications.map(n => ({ ...n, read: true })));
                setNewNotificationsCount(0);
              }}
            >
              Прочитать все
            </Button>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                className="flex-1 text-muted-foreground"
                onClick={() => setNotifications([])}
              >
                Очистить
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>

      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent className="w-[calc(100vw-16px)] max-w-lg max-h-[92dvh] overflow-y-auto p-4">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-base">Изменить профиль</DialogTitle>
            <DialogDescription className="text-xs">
              Обновите информацию о вашем профиле и контакты
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="firstName" className="text-xs">Имя</Label>
                <Input 
                  id="firstName" 
                  className="mt-1 h-9 text-sm"
                  value={editProfileForm.firstName}
                  onChange={(e) => setEditProfileForm({...editProfileForm, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-xs">Фамилия</Label>
                <Input 
                  id="lastName" 
                  className="mt-1 h-9 text-sm"
                  value={editProfileForm.lastName}
                  onChange={(e) => setEditProfileForm({...editProfileForm, lastName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="position" className="text-xs">Должность</Label>
              <Input 
                id="position" 
                className="mt-1 h-9 text-sm"
                value={editProfileForm.position}
                onChange={(e) => setEditProfileForm({...editProfileForm, position: e.target.value})}
              />
            </div>
            <div className="border-t pt-3">
              <h3 className="text-xs font-medium mb-2">Контактная информация</h3>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Телефон</Label>
                  <Input
                    className="mt-1 h-9 text-sm"
                    placeholder="+7 (900) 123-45-67"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Telegram</Label>
                    <Input
                      className="mt-1 h-9 text-sm"
                      placeholder="@username"
                      value={profileForm.telegram}
                      onChange={(e) => setProfileForm({...profileForm, telegram: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">ВКонтакте</Label>
                    <Input
                      className="mt-1 h-9 text-sm"
                      placeholder="vk.com/id"
                      value={profileForm.vk}
                      onChange={(e) => setProfileForm({...profileForm, vk: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Фото профиля</Label>
              <div className="flex items-center gap-3 mt-1">
                {profileForm.avatar ? (
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profileForm.avatar} />
                      <AvatarFallback>{editProfileForm.firstName?.[0]}{editProfileForm.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none hover:bg-red-700"
                      onClick={() => setProfileForm(f => ({...f, avatar: ''}))}
                      title="Удалить фото"
                    >✕</button>
                  </div>
                ) : (
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback>{editProfileForm.firstName?.[0]}{editProfileForm.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const size = 200;
                            canvas.width = size;
                            canvas.height = size;
                            const ctx = canvas.getContext('2d')!;
                            const scale = Math.max(size / img.width, size / img.height);
                            const x = (size - img.width * scale) / 2;
                            const y = (size - img.height * scale) / 2;
                            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                            const compressed = canvas.toDataURL('image/jpeg', 0.8);
                            setProfileForm(f => ({...f, avatar: compressed}));
                          };
                          img.src = reader.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="cursor-pointer text-xs h-9"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Выберите изображение</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button 
                className="flex-1 h-10 text-sm"
                onClick={async () => {
                  try {
                    await api.updateEmployee(currentEmployeeId, {
                      first_name: editProfileForm.firstName,
                      last_name: editProfileForm.lastName,
                      position: editProfileForm.position,
                      department: editProfileForm.department,
                      phone: profileForm.phone,
                      telegram: profileForm.telegram,
                      vk: profileForm.vk,
                      ...(profileForm.avatar ? { avatar_url: profileForm.avatar } : {})
                    });
                    await loadData();
                    setShowEditProfileDialog(false);
                    alert('Профиль успешно обновлён!');
                  } catch (error) {
                    console.error('Ошибка обновления профиля:', error);
                    alert('Не удалось обновить профиль');
                  }
                }}
              >
                Сохранить
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-10 text-sm"
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

      <Suspense fallback={null}>
        <VacancyDetail
          vacancy={selectedVacancyDetail}
          open={showVacancyDetail}
          onOpenChange={setShowVacancyDetail}
          showRecommendButton={userRole === 'employee'}
          showPublicLink={userRole === 'employer'}
          onRecommend={() => {
            if (selectedVacancyDetail) {
              setShowRecommendDialog(true);
            }
          }}
          onRestore={userRole === 'employer' ? (id) => { handleRestoreVacancy(id); setShowVacancyDetail(false); } : undefined}
        />
      </Suspense>

      <RecommendDialog
        open={showRecommendDialog}
        onOpenChange={setShowRecommendDialog}
        vacancyTitle={selectedVacancyDetail?.title}
        form={recommendationForm}
        onFormChange={setRecommendationForm}
        onSubmit={async () => {
          if (!selectedVacancyDetail) return;
          await handleCreateRecommendation({
            vacancyId: selectedVacancyDetail.id,
            name: recommendationForm.name,
            email: recommendationForm.email,
            phone: recommendationForm.phone,
            comment: recommendationForm.comment,
          });
          setShowRecommendDialog(false);
          setShowVacancyDetail(false);
        }}
      />

      <CandidateDetail
        recommendation={selectedCandidate}
        open={showCandidateDetail}
        onOpenChange={setShowCandidateDetail}
        userRole={userRole}
      />

      <WithdrawDialog
        open={showWithdrawDialog}
        onOpenChange={setShowWithdrawDialog}
        form={withdrawForm}
        onFormChange={setWithdrawForm}
        walletData={walletData}
        company={company}
        onSubmit={async () => {
          const requestedAmount = parseFloat(withdrawForm.amount);
          const availableBalance = walletData?.wallet?.wallet_balance || 0;
          if (!withdrawForm.amount || requestedAmount <= 0) { alert('Введите сумму больше 0'); return; }
          if (requestedAmount > availableBalance) { alert(`Недостаточно средств. Доступно для вывода: ${availableBalance.toLocaleString()} ₽`); return; }
          if (withdrawForm.paymentMethod === 'account') {
            if (!withdrawForm.accountFullName.trim() || !withdrawForm.accountBank.trim() || !withdrawForm.accountNumber.trim() || !withdrawForm.accountBik.trim()) { alert('Заполните все поля для расчётного счёта'); return; }
            if (withdrawForm.accountBik.length !== 9) { alert('БИК должен содержать 9 цифр'); return; }
            if (withdrawForm.accountNumber.length !== 20) { alert('Расчётный счёт должен содержать 20 цифр'); return; }
          } else {
            if (!withdrawForm.paymentDetails.trim() || !withdrawForm.bankName.trim()) { alert('Заполните реквизиты и наименование банка'); return; }
          }
          try {
            const paymentDetails = withdrawForm.paymentMethod === 'account'
              ? `ФИО: ${withdrawForm.accountFullName}\nБанк: ${withdrawForm.accountBank}\nРасчётный счёт: ${withdrawForm.accountNumber}\nБИК: ${withdrawForm.accountBik}`
              : `${withdrawForm.paymentDetails}\nБанк: ${withdrawForm.bankName}`;
            const response = await fetch('https://functions.poehali.dev/f88ab2cf-1304-40dd-82e4-a7a1f7358901', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                employee_id: currentEmployeeId,
                amount: requestedAmount,
                payment_method: withdrawForm.paymentMethod,
                payment_details: paymentDetails,
                account_full_name: withdrawForm.accountFullName,
              })
            });
            if (response.ok) {
              alert('✅ Запрос на выплату отправлен!');
              setShowWithdrawDialog(false);
              setWithdrawForm({ amount: '', paymentMethod: 'card', paymentDetails: '', accountFullName: '', accountBank: '', accountNumber: '', accountBik: '', bankName: '' });
              await loadData();
            } else {
              alert('Ошибка при отправке запроса');
            }
          } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось отправить запрос');
          }
        }}
      />


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

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {userRole === 'guest' && renderLandingPage()}
      {userRole === 'employer' && renderEmployerDashboard()}
      {userRole === 'employee' && renderEmployeeDashboard()}

      {showOnboarding && userRole !== 'guest' && (
        <Suspense fallback={null}>
          <Onboarding
            role={userRole}
            onComplete={() => {
              setShowOnboarding(false);
              localStorage.removeItem('showOnboarding');
            }}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <EmployeeDetail
          employee={selectedEmployee}
          open={showEmployeeDetail}
          onOpenChange={setShowEmployeeDetail}
          recommendations={recommendations}
        />
      </Suspense>

      {testManagerVacancy && currentCompanyId && (
        <Suspense fallback={null}>
          <VacancyTestManager
            open={showTestManager}
            onOpenChange={setShowTestManager}
            vacancyId={testManagerVacancy.id}
            vacancyTitle={testManagerVacancy.title}
            companyId={currentCompanyId}
          />
        </Suspense>
      )}

      {/* Диалог реферальной ссылки с QR-кодом */}
      <ReferralLinkDialog
        open={showReferralLinkDialog}
        onOpenChange={setShowReferralLinkDialog}
        referralLink={referralLink}
        onCopyLink={handleCopyLink}
      />

      {/* Диалог запроса восстановления пароля */}
      <ForgotPasswordDialog
        open={showForgotPasswordDialog}
        onOpenChange={setShowForgotPasswordDialog}
        email={forgotPasswordEmail}
        onEmailChange={setForgotPasswordEmail}
        message={passwordResetMessage}
        onMessageChange={setPasswordResetMessage}
        onSubmit={handleRequestPasswordReset}
        onBackToLogin={() => {
          setShowForgotPasswordDialog(false);
          setForgotPasswordEmail('');
          setPasswordResetMessage('');
          setShowLoginDialog(true);
        }}
        isLoading={isAuthLoading}
      />

      {/* Диалог сброса пароля */}
      <ResetPasswordDialog
        open={showResetPasswordDialog}
        onOpenChange={setShowResetPasswordDialog}
        form={resetPasswordForm}
        onFormChange={setResetPasswordForm}
        message={passwordResetMessage}
        onSubmit={handleResetPassword}
        isLoading={isAuthLoading}
      />

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <Icon name="X" size={28} />
          </button>
          <img
            src={lightboxImage}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={lightboxImage}
            download
            className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="Download" size={16} />
            Скачать
          </a>
        </div>
      )}
    </>
  );
}

export default Index;