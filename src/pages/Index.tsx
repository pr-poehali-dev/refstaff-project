import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useIndexState } from './index/useIndexState';
import { useIndexHandlers } from './index/useIndexHandlers';
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
import { api, type Vacancy as ApiVacancy, type Employee as ApiEmployee, type Recommendation as ApiRecommendation, type Company, type WalletData, type Chat } from '@/lib/api';
import type { UserRole, Vacancy, Employee, Recommendation, ChatMessage, NewsPost, NewsComment, PayoutRequest } from '@/types';
import ScrollableTabs from '@/components/ScrollableTabs';
import TelegramLoginButton from '@/components/TelegramLoginButton';
import AiAssistantTab, { type AiMessage } from '@/components/AiAssistantTab';
import { BENEFITS_DATA } from '@/data/benefitsData';

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

const LazyFallback = () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;



function Index() {
  const navigate = useNavigate();
  const s = useIndexState();
  const {
    userRole, setUserRole, currentUser, setCurrentUser, authToken, setAuthToken,
    isVerifying, setIsVerifying, activeVacancy, setActiveVacancy,
    showRegisterDialog, setShowRegisterDialog, showLoginDialog, setShowLoginDialog,
    showInviteDialog, setShowInviteDialog, showCompanySettingsDialog, setShowCompanySettingsDialog,
    companyEditForm, setCompanyEditForm, isSavingCompany, setIsSavingCompany,
    companyLogoFile, setCompanyLogoFile, companyLogoPreview, setCompanyLogoPreview,
    showChatDialog, setShowChatDialog, activeChatEmployee, setActiveChatEmployee,
    lightboxImage, setLightboxImage, showOnboarding, setShowOnboarding,
    showCompanyProfileDialog, setShowCompanyProfileDialog,
    showAboutDialog, setShowAboutDialog, showPrivacyDialog, setShowPrivacyDialog,
    showTermsDialog, setShowTermsDialog, showPersonalDataDialog, setShowPersonalDataDialog,
    showForgotPasswordDialog, setShowForgotPasswordDialog,
    showResetPasswordDialog, setShowResetPasswordDialog,
    forgotPasswordEmail, setForgotPasswordEmail,
    resetPasswordForm, setResetPasswordForm, passwordResetMessage, setPasswordResetMessage,
    pricingPeriod, setPricingPeriod, chatMessages, setChatMessages,
    newMessage, setNewMessage, selectedFiles, setSelectedFiles, fileInputRef,
    activeChatId, setActiveChatId, isSendingMessage, setIsSendingMessage,
    chatPollRef, tgLoginPollRef, maxLoginPollRef, chatMessagesEndRef,
    newReward, setNewReward, unreadMessagesCount, setUnreadMessagesCount, chats, setChats,
    employeeToDelete, setEmployeeToDelete, showDeleteDialog, setShowDeleteDialog,
    employeeToEdit, setEmployeeToEdit, showEditEmployeeDialog, setShowEditEmployeeDialog,
    employeeEditForm, setEmployeeEditForm,
    showIntegrationsDialog, setShowIntegrationsDialog,
    showSubscriptionDialog, setShowSubscriptionDialog,
    showNotificationsDialog, setShowNotificationsDialog,
    subscriptionDaysLeft, setSubscriptionDaysLeft, notifications, setNotifications,
    vacancies, setVacancies, employees, setEmployees, recommendations, setRecommendations,
    prevRecommendationsCount, prevEmployeesCount, prevPayoutsCount, prevVacanciesCount,
    prevRecommendationsRef, prevEmployeesRef, prevPayoutsRef,
    newRecommendationsCount, setNewRecommendationsCount,
    activeTab, setActiveTab, newEmployeesCount, setNewEmployeesCount,
    newPayoutsCount, setNewPayoutsCount, newVacanciesCount, setNewVacanciesCount,
    newNewsCount, setNewNewsCount, newNotificationsCount, setNewNotificationsCount,
    employeeTabsInitialized, setEmployeeTabsInitialized,
    company, setCompany, payoutMethodsCollapsed, setPayoutMethodsCollapsed,
    walletData, setWalletData, isLoading, setIsLoading,
    payoutRequests, setPayoutRequests, selectedEmployee, setSelectedEmployee,
    showEmployeeDetail, setShowEmployeeDetail, showTestManager, setShowTestManager,
    testManagerVacancy, setTestManagerVacancy,
    employeeSearchQuery, setEmployeeSearchQuery, employeeStatusFilter, setEmployeeStatusFilter,
    selectedVacancyDetail, setSelectedVacancyDetail, showVacancyDetail, setShowVacancyDetail,
    showRecommendDialog, setShowRecommendDialog, selectedCandidate, setSelectedCandidate,
    showCandidateDetail, setShowCandidateDetail, vacancySearchQuery, setVacancySearchQuery,
    recommendationSearchQuery, setRecommendationSearchQuery,
    recommendationStatusFilter, setRecommendationStatusFilter,
    showWithdrawDialog, setShowWithdrawDialog, withdrawForm, setWithdrawForm,
    showProfileEditDialog, setShowProfileEditDialog, profileForm, setProfileForm,
    showIntegrationDialog, setShowIntegrationDialog, integrationForm, setIntegrationForm,
    editProfileForm, setEditProfileForm, contactForm, setContactForm,
    contactFormSubmitting, setContactFormSubmitting, contactFormSuccess, setContactFormSuccess,
    activeBenefit, setActiveBenefit, showDemoDialog, setShowDemoDialog,
    demoForm, setDemoForm, demoFormSubmitting, setDemoFormSubmitting,
    vacancyForm, setVacancyForm, recommendationForm, setRecommendationForm,
    registerForm, setRegisterForm, innVerificationState, setInnVerificationState,
    aiMessages, setAiMessages, loginForm, setLoginForm,
    isAuthLoading, setIsAuthLoading, resendVerificationEmail, setResendVerificationEmail,
    resendVerificationTimer, setResendVerificationTimer,
    isResendingVerification, setIsResendingVerification,
    showEditProfileDialog, setShowEditProfileDialog,
    inviteForm, setInviteForm, vacancyFilter, setVacancyFilter,
    referralLink, setReferralLink, showReferralLinkDialog, setShowReferralLinkDialog,
    activeRecommendation, setActiveRecommendation,
    showRecommendationDetailsDialog, setShowRecommendationDetailsDialog,
    loginType, setLoginType, employeeLoginMethod, setEmployeeLoginMethod,
    isTgLoginLoading, setIsTgLoginLoading, tgLoginError, setTgLoginError,
    tgLoginStep, setTgLoginStep, tgLoginSession, setTgLoginSession,
    tgLoginDeepLink, setTgLoginDeepLink, tgLoginCode, setTgLoginCode,
    isMaxLoginLoading, setIsMaxLoginLoading, maxLoginError, setMaxLoginError,
    maxLoginStep, setMaxLoginStep, maxLoginSession, setMaxLoginSession,
    maxLoginDeepLink, setMaxLoginDeepLink, maxLoginCode, setMaxLoginCode,
    employeeToEditRoles, setEmployeeToEditRoles, showEditRolesDialog, setShowEditRolesDialog,
    rolesForm, setRolesForm, newsPosts, setNewsPosts,
    showCreateNewsDialog, setShowCreateNewsDialog, showEditNewsDialog, setShowEditNewsDialog,
    newsToEdit, setNewsToEdit, newsForm, setNewsForm,
    showCommentsDialog, setShowCommentsDialog, activeNewsPost, setActiveNewsPost,
    newComment, setNewComment,
    isSubscriptionExpired, currentEmployeeId, currentCompanyId,
  } = s;
  const h = useIndexHandlers(s);
  const {
    verifyToken, handleLogout, loadChatMessages, handleSelectChatEmployee,
    handleSendMessage, handleFileSelect, removeFile, handleOpenChat,
    getReadNotifIds, markNotifIdsRead, loadData, calculateEmployeeRank,
    handleSaveCompany, handleCreateVacancy, handleCreateRecommendation,
    handleUpdateRecommendationStatus, handleDeleteEmployee, handleUpdateVacancy,
    handleArchiveVacancy, handleRestoreVacancy, handleDeleteVacancy,
    handleGenerateReferralLink, handleCopyLink, handleUpdateProfile,
    handleUpdateEmployeeData, handleInviteEmployee, handleVerifyInn,
    handleDemoFormSubmit, handleContactFormSubmit, handleRegister,
    handleTgSendLoginCode, handleTgVerifyLoginCode,
    handleMaxSendLoginCode, handleMaxVerifyLoginCode,
    handleLogin, handleResendVerification, handleRequestPasswordReset,
    handleResetPassword, handleCreateNews, handleUpdateNews, handleDeleteNews,
    handleArchiveNews, handleLikeNews, handleAddComment, handleDeleteComment,
    handleUpdateEmployeeRoles, handleToggleFired,
  } = h;
  // ── state and handlers are provided by useIndexState / useIndexHandlers above ──
  const [activeEmployeeTab, setActiveEmployeeTab] = useState('news');

  // keep original useEffects that depend on derived values
  useEffect(() => {
    if (userRole !== 'guest') localStorage.setItem('userRole', userRole);
  }, [userRole]);

  useEffect(() => {
    if (resendVerificationTimer > 0) {
      const timer = setTimeout(() => setResendVerificationTimer(resendVerificationTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendVerificationTimer]);

  useEffect(() => {
    if (authToken && userRole !== 'guest') {
      verifyToken();
      if (localStorage.getItem('showOnboarding') === 'true' && !localStorage.getItem('onboarding_completed')) {
        setShowOnboarding(true);
      }
    }
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
      setResetPasswordForm({ token: resetToken, password: '', confirmPassword: '' });
      setShowResetPasswordDialog(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    const verified = urlParams.get('verified');
    if (verified === '1') {
      window.history.replaceState({}, document.title, window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (showChatDialog && activeChatEmployee) handleSelectChatEmployee(activeChatEmployee);
    if (!showChatDialog && chatPollRef.current) { clearInterval(chatPollRef.current); chatPollRef.current = null; }
  }, [showChatDialog, activeChatEmployee?.id]);

  useEffect(() => {
    if (!showLoginDialog) {
      if (tgLoginPollRef.current) { clearInterval(tgLoginPollRef.current); tgLoginPollRef.current = null; }
      if (maxLoginPollRef.current) { clearInterval(maxLoginPollRef.current); maxLoginPollRef.current = null; }
    }
  }, [showLoginDialog]);

  useEffect(() => {
    if ((userRole === 'employer' || userRole === 'employee') && currentUser) {
      loadData();
      const pollInterval = setInterval(() => loadData(true), 30000);
      return () => clearInterval(pollInterval);
    }
  }, [userRole, currentUser]);

  useEffect(() => {
    if (showNotificationsDialog) {
      setNotifications(prev => {
        const ids = prev.filter(n => !n.read).map(n => String(n.id));
        if (ids.length) markNotifIdsRead(ids);
        return prev.map(n => ({ ...n, read: true }));
      });
      setNewNotificationsCount(0);
    }
  }, [showNotificationsDialog]);

  useEffect(() => {
    if (activeEmployeeTab === 'notifications') return;
    const unread = notifications.filter(n => !n.read).length;
    setNewNotificationsCount(unread);
  }, [notifications, activeEmployeeTab]);

  useEffect(() => {
    if (userRole === 'employee' && !isLoading && !employeeTabsInitialized && currentEmployeeId) {
      const readIds = getReadNotifIds();
      api.getNotifications(currentEmployeeId)
        .then(notifs => {
          const mapped = notifs.map(n => {
            const rawId = String(n.id);
            const numericId = typeof n.id === 'string' ? parseInt(n.id.replace(/\D/g, '')) || Date.now() : n.id;
            return { ...n, id: numericId, read: n.read || readIds.has(rawId) || readIds.has(String(numericId)) };
          });
          setNotifications(mapped);
        })
        .catch(() => {});
      setEmployeeTabsInitialized(true);
    }
  }, [userRole, isLoading, employeeTabsInitialized, currentEmployeeId]);

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
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-lg">
              <Icon name="Rocket" className="text-white" size={20} aria-hidden="true" />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl px-0 py-0 my-0 font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">iHUNT</span>
          </div>
          <nav className="hidden md:flex items-center gap-4 lg:gap-8" role="navigation" aria-label="Основная навигация">
            <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs lg:text-sm hover:text-primary transition-colors">Как работает</button>
            <button onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs lg:text-sm hover:text-primary transition-colors">Преимущества</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs lg:text-sm hover:text-primary transition-colors">Тарифы</button>
            <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs lg:text-sm hover:text-primary transition-colors">Контакты</button>

            <a href="/create-test" target="_blank" className="text-xs lg:text-sm hover:text-primary transition-colors font-medium">✨ AI тесты</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="/create-test" target="_blank" className="md:hidden inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-primary/40 text-primary bg-primary/5 active:bg-primary/10 transition-colors whitespace-nowrap leading-none">✨ AI</a>
            <Button variant="ghost" onClick={() => setShowLoginDialog(true)} aria-label="Войти в систему" size="sm" className="text-xs sm:text-sm">Вход</Button>
            <Button onClick={() => setShowRegisterDialog(true)} aria-label="Зарегистрировать компанию" size="sm" className="text-xs">
              <span className="hidden sm:inline">Зарегистрировать</span>
              <span className="sm:hidden">Регистрация</span>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-16 sm:pt-20 md:pt-24 lg:pt-32 pb-8 sm:pb-12 md:pb-16 lg:pb-20 px-3 sm:px-4 lg:px-6" aria-labelledby="hero-title">
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
              <div className="text-center lg:text-left">
                <Badge className="mb-4 sm:mb-6 animate-fade-in text-xs sm:text-sm">🚀 Реферальный рекрутинг</Badge>
                <h1 id="hero-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 animate-slide-up bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
                  Нанимайте лучших кандидатов через своих сотрудников
                </h1>
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-4 sm:mb-6 md:mb-8 animate-slide-up font-normal" style={{ animationDelay: '0.1s' }}>
                  Платформа для реферального найма с геймификацией
                </h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center lg:justify-start">
                  <Button size="default" className="animate-scale-in shadow-lg shadow-primary/25 text-sm sm:text-base" style={{ animationDelay: '0.2s' }} onClick={() => { setShowRegisterDialog(true); if (typeof window.ym === 'function') window.ym(106919720, 'reachGoal', 'click_cta_hero'); }} aria-label="Начать бесплатный пробный период на 14 дней">
                    <Icon name="Rocket" className="mr-2" size={18} aria-hidden="true" />
                    <span className="hidden sm:inline">Начать бесплатно — 14 дней</span>
                    <span className="sm:hidden">Начать бесплатно</span>
                  </Button>
                  <Button size="default" variant="outline" className="animate-scale-in text-sm sm:text-base" style={{ animationDelay: '0.3s' }} onClick={() => setShowLoginDialog(true)}>
                    <Icon name="LogIn" className="mr-2" size={18} />
                    Войти
                  </Button>
                </div>
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-6 justify-center lg:justify-start text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={16} />
                    <span>Прост в использовании</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={16} />
                    <span>Настройка за 5 минут</span>
                  </div>
                </div>
              </div>
              <div className="relative animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="hero-image-wrap relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/files/e96124dc-c09c-454b-a967-49eff0e74945.jpg" 
                    alt="Команда сотрудников работает вместе"
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                    width={640}
                    height={480}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                </div>
                <div className="hidden sm:block absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-4" style={{ animation: 'float 3s ease-in-out 1s infinite' }}>
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

        <section id="how" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-primary/5 via-white to-purple-50 relative overflow-hidden" aria-labelledby="how-title">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center mb-8 sm:mb-12 md:mb-20">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">⚡ Простой процесс</Badge>
              <h2 id="how-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Как это работает
              </h2>
              <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                Запустите реферальную программу за 4 простых шага и начните получать рекомендации
              </p>
            </div>
            
            <div className="relative max-w-5xl mx-auto">
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 via-purple-500 to-orange-500 transform -translate-y-1/2 opacity-20"></div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-4">
                {[
                  { emoji: '🏢', title: 'Регистрация', desc: 'Создайте аккаунт компании и разместите открытые вакансии', color: 'from-blue-500 to-blue-600' },
                  { emoji: '👥', title: 'Приглашение', desc: 'Добавьте своих сотрудников в систему одним кликом', color: 'from-green-500 to-green-600' },
                  { emoji: '🎯', title: 'Рекомендации', desc: 'Получайте качественные кандидатуры от вашей команды', color: 'from-purple-500 to-purple-600' },
                  { emoji: '💰', title: 'Вознаграждение', desc: 'Выплачивайте бонусы за найм', color: 'from-orange-500 to-orange-600' },
                ].map((step, i) => (
                  <div key={i} className="relative group">
                    <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 overflow-hidden h-full">
                      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${step.color}`}></div>
                      
                      <div className="p-4 sm:p-6 pt-6 sm:pt-8">
                        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className={`flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                            <span className="text-xl sm:text-2xl">{step.emoji}</span>
                          </div>
                          <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${step.color} text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md`}>
                            {i + 1}
                          </div>
                        </div>
                        
                        <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">{step.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                      
                      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${step.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                    </div>
                    
                    {i < 3 && (
                      <div className="hidden lg:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-20 w-8 h-8 items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-primary/20">
                          <Icon name="ChevronRight" className="text-primary" size={18} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="benefits" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-purple-50 via-white to-blue-50 relative overflow-hidden" aria-labelledby="benefits-title">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center mb-10 sm:mb-14 md:mb-20">
              <Badge className="mb-4 bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs sm:text-sm">✨ Почему iHUNT</Badge>
              <h2 id="benefits-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Преимущества платформы
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                Все инструменты для эффективного реферального найма в одной системе
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-6xl mx-auto">
              {BENEFITS_DATA.map((benefit, i) => (
                <div key={i} className="group cursor-pointer" onClick={() => setActiveBenefit(i)}>
                  <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 overflow-hidden h-full">
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${benefit.gradient}`}></div>
                    <div className="p-4 sm:p-6 pt-5 sm:pt-8">
                      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className={`flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                          <span className="text-xl sm:text-2xl">{benefit.emoji}</span>
                        </div>
                      </div>
                      <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">{benefit.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                      <p className="text-xs text-primary mt-3 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Подробнее →</p>
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${benefit.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                  </div>
                </div>
              ))}
            </div>
            <Dialog open={activeBenefit !== null} onOpenChange={(open) => !open && setActiveBenefit(null)}>
              <DialogContent className="max-w-lg">
                {activeBenefit !== null && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3 text-xl">
                        <span className="text-3xl">{BENEFITS_DATA[activeBenefit].emoji}</span>
                        {BENEFITS_DATA[activeBenefit].title}
                      </DialogTitle>
                      <DialogDescription className="text-base text-gray-700 mt-2 leading-relaxed">
                        {BENEFITS_DATA[activeBenefit].details}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Примеры из практики:</p>
                      <ul className="space-y-3">
                        {BENEFITS_DATA[activeBenefit].examples.map((ex, j) => (
                          <li key={j} className="flex gap-2 text-sm text-muted-foreground">
                            <span className="mt-0.5 shrink-0 text-primary">✓</span>
                            <span>{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
            <div className="mt-8 sm:mt-12 md:mt-16">
              <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">🎯 Результаты наших клиентов</h3>
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
                        loading="lazy"
                        decoding="async"
                        width={600}
                        height={400}
                        className="rounded-xl shadow-xl w-full h-auto"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden" aria-labelledby="pricing-title">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <Badge className="mb-4 bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs sm:text-sm">💎 Прозрачное ценообразование</Badge>
              <h2 id="pricing-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Тарифы</h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">14 дней бесплатно для всех новых клиентов</p>
            </div>
            
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 md:mb-12">
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
                <Badge className="ml-2 bg-green-500 text-white">-15%</Badge>
              </Button>
            </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 max-w-3xl mx-auto">
            <div className="group">
              <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-200 overflow-hidden h-full">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gray-400 to-gray-500"></div>
                
                <div className="p-5 sm:p-8">
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">Пробный период</h3>
                    <p className="text-sm text-muted-foreground">Протестируйте платформу</p>
                  </div>
                  
                  <div className="mb-4 sm:mb-6">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">0 ₽</div>
                    <p className="text-sm text-muted-foreground">14 дней бесплатно</p>
                  </div>
                  
                  <ul className="space-y-3 mb-5 sm:mb-8">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Все функции платформы</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Поддержка 24/7</span>
                    </li>
                  </ul>
                  
                  <Button className="w-full" variant="outline" onClick={() => setShowRegisterDialog(true)}>Попробовать самостоятельно</Button>
                  <Button className="w-full mt-2" variant="secondary" onClick={() => setShowDemoDialog(true)}>Запросить демонстрацию</Button>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-200 overflow-hidden h-full">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-500"></div>
                
                <div className="p-5 sm:p-8">
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">Продвинутый</h3>
                    <p className="text-sm text-muted-foreground">Корпоративный тариф</p>
                  </div>
                  
                  <div className="mb-4 sm:mb-6">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                      {pricingPeriod === 'monthly' ? '19 900 ₽' : '16 915 ₽'}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">в месяц</p>
                    {pricingPeriod === 'yearly' && (
                      <p className="text-sm text-green-600 font-medium">202 980 ₽/год (экономия 35 820 ₽)</p>
                    )}
                  </div>
                  
                  <ul className="space-y-3 mb-5 sm:mb-8">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Нет ограничений на  кол-во сотрудников</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Подробная аналитика</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Геймификация</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Нет ограничений на размещение вакансий</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">AI тесты для кандидатов</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Работа с рекомендациями</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Внутренний чат с сотрудниками</span>
                    </li>
                  </ul>
                  
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500" onClick={() => setShowDemoDialog(true)}>Подключить</Button>
                </div>
              </div>
            </div>

          </div>
        </div>
        </section>

        <section id="contact" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-green-50 via-white to-blue-50 relative overflow-hidden" aria-labelledby="contact-title">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto max-w-3xl relative z-10">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20 text-xs sm:text-sm">💬 Контакты</Badge>
              <h2 id="contact-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Остались вопросы?
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground px-4">
                Свяжитесь с нами, и мы с радостью ответим на все ваши вопросы
              </p>
            </div>
            
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 to-blue-500"></div>
              
              <div className="p-5 sm:p-6 md:p-8 lg:p-10">
                <form className="space-y-4 sm:space-y-5 md:space-y-6" aria-label="Форма обратной связи" onSubmit={handleContactFormSubmit}>
                  <div>
                    <Label htmlFor="name" className="text-sm sm:text-base font-medium">Имя</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Иван Иванов" 
                      autoComplete="name" 
                      required 
                      className="mt-1.5 sm:mt-2 h-10 sm:h-11 md:h-12"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      disabled={contactFormSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm sm:text-base font-medium">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="ivan@company.ru" 
                      autoComplete="email" 
                      required 
                      className="mt-1.5 sm:mt-2 h-10 sm:h-11 md:h-12"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      disabled={contactFormSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-phone" className="text-sm sm:text-base font-medium">Телефон</Label>
                    <Input 
                      id="contact-phone" 
                      name="phone" 
                      type="tel" 
                      placeholder="+7 (999) 123-45-67" 
                      autoComplete="tel" 
                      className="mt-1.5 sm:mt-2 h-10 sm:h-11 md:h-12"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                      disabled={contactFormSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-sm sm:text-base font-medium">Сообщение</Label>
                    <Textarea 
                      id="message" 
                      name="message" 
                      placeholder="Расскажите о вашем проекте..." 
                      rows={4} 
                      required 
                      className="mt-1.5 sm:mt-2 text-sm sm:text-base"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      disabled={contactFormSubmitting}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    disabled={contactFormSubmitting}
                  >
                    {contactFormSubmitting ? (
                      <>
                        <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                        Отправка...
                      </>
                    ) : (
                      <>
                        <Icon name="Send" className="mr-2" size={18} />
                        Отправить сообщение
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <Suspense fallback={null}>
          <BlogCarousel />
        </Suspense>
      </main>

      <footer className="border-t bg-gray-50 py-6 px-3 sm:px-4 lg:px-6" role="contentinfo">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-2 mb-5">
            <Icon name="Rocket" className="text-primary" size={20} />
            <span className="text-base font-bold">iHUNT</span>
            <span className="text-xs text-muted-foreground ml-1">— реферальный рекрутинг с геймификацией</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
            <nav aria-label="Продукт">
              <h4 className="font-semibold mb-2 text-sm">Продукт</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><a href="#benefits" className="hover:text-primary">Возможности</a></li>
                <li><a href="#pricing" className="hover:text-primary">Тарифы</a></li>
              </ul>
            </nav>
            <nav aria-label="Компания">
              <h4 className="font-semibold mb-2 text-sm">Компания</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><a href="/blog" className="hover:text-primary">Блог</a></li>
                <li><a href="#contact" className="hover:text-primary">Контакты</a></li>
                <li><button onClick={() => setShowAboutDialog(true)} className="hover:text-primary">О нас</button></li>
              </ul>
            </nav>
            <nav aria-label="Правовая информация" className="col-span-2 sm:col-span-1">
              <h4 className="font-semibold mb-2 text-sm">Правовая информация</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><button onClick={() => setShowPrivacyDialog(true)} className="hover:text-primary text-left">Политика конфиденциальности</button></li>
                <li><button onClick={() => setShowTermsDialog(true)} className="hover:text-primary text-left">Пользовательское соглашение</button></li>
                <li><button onClick={() => setShowPersonalDataDialog(true)} className="hover:text-primary text-left">Обработка персональных данных</button></li>
              </ul>
            </nav>
          </div>
          <div className="mt-5 pt-4 border-t text-center text-xs text-muted-foreground">© 2026 iHUNT. Все права защищены.</div>
        </div>
      </footer>

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

            {loginType === 'employee' ? (
              <div className="space-y-3">
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

      <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Запросить доступ</DialogTitle>
            <DialogDescription>Заполните форму и мы свяжемся с вами в ближайшее время</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label htmlFor="demo-company" className="text-sm">Наименование компании <span className="text-destructive">*</span></Label>
              <Input
                id="demo-company"
                className="mt-1"
                placeholder="Acme Corp"
                value={demoForm.companyName}
                onChange={(e) => setDemoForm({ ...demoForm, companyName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="demo-name" className="text-sm">Имя <span className="text-destructive">*</span></Label>
              <Input
                id="demo-name"
                className="mt-1"
                placeholder="Иван Иванов"
                value={demoForm.name}
                onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="demo-phone" className="text-sm">Номер телефона <span className="text-destructive">*</span></Label>
              <Input
                id="demo-phone"
                className="mt-1"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={demoForm.phone}
                onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="demo-email" className="text-sm">Почта <span className="text-destructive">*</span></Label>
              <Input
                id="demo-email"
                className="mt-1"
                type="email"
                placeholder="ivan@company.ru"
                value={demoForm.email}
                onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="demo-count" className="text-sm">Количество сотрудников</Label>
              <Input
                id="demo-count"
                className="mt-1"
                placeholder="100"
                value={demoForm.employeeCount}
                onChange={(e) => setDemoForm({ ...demoForm, employeeCount: e.target.value })}
              />
            </div>
            <Button className="w-full mt-2" onClick={handleDemoFormSubmit} disabled={demoFormSubmitting}>
              {demoFormSubmitting ? (
                <><Icon name="Loader2" className="mr-2 animate-spin" size={16} />Отправка...</>
              ) : (
                <><Icon name="Send" className="mr-2" size={16} />Отправить заявку</>
              )}
            </Button>
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
                    <p className="text-sm text-muted-foreground">Наши клиенты сокращают время найма в 2 раза и экономят до 70% бюджета на рекрутинг.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="Users" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Вовлечение сотрудников</h4>
                    <p className="text-sm text-muted-foreground">Геймификация и прозрачная система вознаграждений мотивируют команду активно участвовать в найме.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="Zap" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Простота внедрения</h4>
                    <p className="text-sm text-muted-foreground">Настройка занимает 5 минут. Интуитивный интерфейс не требует обучения.</p>
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
                  <a href="mailto:info@ihunt.ru" className="text-primary hover:underline">info@i-hunt.ru</a>
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
            <div><h3 className="text-lg font-semibold mb-3">1. Общие положения</h3><p className="text-muted-foreground">Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей платформы iHUNT (далее — «Платформа»). Используя Платформу, вы соглашаетесь с условиями настоящей Политики.</p></div>
            <div><h3 className="text-lg font-semibold mb-3">2. Какие данные мы собираем</h3><p className="text-muted-foreground mb-2">Мы можем собирать следующие категории персональных данных:</p><ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4"><li>Контактные данные: имя, фамилия, электронная почта, номер телефона</li><li>Данные компании: название, ИНН, количество сотрудников, отрасль</li><li>Данные о вакансиях и рекомендациях кандидатов</li><li>Техническая информация: IP-адрес, тип браузера, операционная система</li><li>Данные об использовании Платформы: активность, статистика взаимодействий</li></ul></div>
            <div><h3 className="text-lg font-semibold mb-3">3. Цели обработки данных</h3><p className="text-muted-foreground mb-2">Мы обрабатываем ваши персональные данные для:</p><ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4"><li>Предоставления услуг Платформы и их улучшения</li><li>Выполнения договорных обязательств</li><li>Технической поддержки пользователей</li><li>Отправки уведомлений о важных событиях</li><li>Аналитики и улучшения функционала</li><li>Соблюдения законодательных требований</li></ul></div>
            <div><h3 className="text-lg font-semibold mb-3">4. Защита данных</h3><p className="text-muted-foreground">Мы применяем технические и организационные меры для защиты персональных данных от несанкционированного доступа, изменения, раскрытия или уничтожения.</p></div>
            <div><h3 className="text-lg font-semibold mb-3">5. Передача данных третьим лицам</h3><p className="text-muted-foreground">Мы не продаем и не передаем персональные данные третьим лицам без согласия пользователя, за исключением случаев, предусмотренных законодательством.</p></div>
            <div><h3 className="text-lg font-semibold mb-3">6. Права пользователей</h3><p className="text-muted-foreground mb-2">Вы имеете право:</p><ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4"><li>Получить информацию об обработке ваших данных</li><li>Исправить неточные данные</li><li>Удалить ваши данные</li><li>Отозвать согласие на обработку</li></ul></div>
            <div><h3 className="text-lg font-semibold mb-3">7. Cookies</h3><p className="text-muted-foreground">Мы используем cookie-файлы для улучшения работы сайта. Продолжая использовать Платформу, вы соглашаетесь с использованием cookies.</p></div>
            <div><h3 className="text-lg font-semibold mb-3">8. Изменения политики</h3><p className="text-muted-foreground">Мы можем обновлять настоящую Политику. Актуальная версия всегда доступна на нашем сайте.</p></div>
            <div><h3 className="text-lg font-semibold mb-3">9. Контакты</h3><p className="text-muted-foreground">По вопросам обработки персональных данных обращайтесь:</p><p className="text-muted-foreground mt-2">Email: <a href="mailto:privacy@ihunt.ru" className="text-primary hover:underline">info@i-hunt.ru</a></p></div>
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
            <div><h3 className="text-lg font-semibold mb-3">1. Общие условия</h3><p className="text-muted-foreground">Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между iHUNT (далее — «Сервис») и пользователями платформы. Регистрируясь на Платформе, вы подтверждаете, что прочитали, поняли и согласны соблюдать условия настоящего Соглашения.</p></div>
            <div><h3 className="text-lg font-semibold mb-3">2. Предмет Соглашения</h3><p className="text-muted-foreground">iHUNT предоставляет онлайн-платформу для организации реферального рекрутинга.</p></div>
            <div><h3 className="text-lg font-semibold mb-3">3. Регистрация и учетная запись</h3><p className="text-muted-foreground mb-2">При регистрации вы обязуетесь:</p><ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4"><li>Предоставить достоверные и актуальные данные</li><li>Обеспечить конфиденциальность учетных данных</li><li>Немедленно уведомлять о несанкционированном доступе к аккаунту</li></ul></div>
            <div><h3 className="text-lg font-semibold mb-3">4. Тарифы и оплата</h3><p className="text-muted-foreground">Сервис предоставляет 14-дневный бесплатный пробный период. После окончания пробного периода использование Платформы осуществляется на платной основе согласно выбранному тарифному плану.</p></div>
            <div><h3 className="text-lg font-semibold mb-3">5. Права и обязанности пользователя</h3><p className="text-muted-foreground mb-2">Пользователь обязуется:</p><ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4"><li>Использовать Платформу в законных целях</li><li>Не нарушать права третьих лиц</li><li>Соблюдать правила работы с персональными данными кандидатов</li></ul></div>
            <div><h3 className="text-lg font-semibold mb-3">12. Контакты</h3><p className="text-muted-foreground">По вопросам Соглашения обращайтесь:</p><p className="text-muted-foreground mt-2">Email: <a href="mailto:legal@ihunt.ru" className="text-primary hover:underline">info@i-hunt.ru</a></p></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPersonalDataDialog} onOpenChange={setShowPersonalDataDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Положение об обработке персональных данных</DialogTitle>
            <DialogDescription>Информация о порядке обработки и защиты персональных данных в соответствии с законодательством РФ</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            <div><h3 className="text-lg font-semibold mb-3">1. Общие положения</h3><p className="text-muted-foreground">Настоящее Положение об обработке персональных данных разработано в соответствии с требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных».</p></div>
            <div><h3 className="text-lg font-semibold mb-3">14. Контактная информация</h3><p className="text-muted-foreground">Оператор персональных данных: iHUNT</p><p className="text-muted-foreground mt-2"><strong>Дата вступления в силу:</strong> 16 января 2026 г.</p></div>
          </div>
        </DialogContent>
      </Dialog>
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
        <p className="text-muted-foreground">Загрузка панели работодателя...</p>
      </div>
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
            <Button variant="ghost" onClick={handleLogout} size="sm" className="text-xs sm:text-sm">Выход</Button>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Загрузка панели сотрудника...</p>
      </div>
    </div>
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

      <Dialog open={showReferralLinkDialog} onOpenChange={setShowReferralLinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Регистрация сотрудников</DialogTitle>
            <DialogDescription>Поделитесь ссылкой или QR-кодом с новыми сотрудниками для регистрации</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200 invite-qr-container">
                <QRCodeSVG value={referralLink} size={200} level="H" />
              </div>
            </div>
            <div>
              <Label>Ссылка для регистрации</Label>
              <div className="flex gap-2 mt-2">
                <Input value={referralLink} readOnly className="font-mono text-sm" />
                <Button variant="outline" onClick={() => handleCopyLink(referralLink)}>
                  <Icon name="Copy" size={16} />
                </Button>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Icon name="Info" className="text-blue-600 mt-0.5" size={16} />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Как использовать:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Отправьте ссылку новому сотруднику</li>
                    <li>Покажите QR-код для быстрого сканирования</li>
                    <li>Сотрудник автоматически привяжется к вашей компании</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForgotPasswordDialog} onOpenChange={(open) => {
        setShowForgotPasswordDialog(open);
        if (!open) { setForgotPasswordEmail(''); setPasswordResetMessage(''); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Восстановление пароля</DialogTitle>
            <DialogDescription>Введите email, и мы отправим вам ссылку для восстановления пароля</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="forgot-email">Email</Label>
              <Input 
                id="forgot-email" 
                type="email"
                placeholder="email@example.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRequestPasswordReset()}
              />
            </div>
            {passwordResetMessage && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded">{passwordResetMessage}</div>
            )}
            <Button className="w-full" onClick={handleRequestPasswordReset} disabled={!forgotPasswordEmail.trim()}>
              Отправить ссылку
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => {
              setShowForgotPasswordDialog(false);
              setForgotPasswordEmail('');
              setPasswordResetMessage('');
              setShowLoginDialog(true);
            }}>
              Назад к входу
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый пароль</DialogTitle>
            <DialogDescription>Введите новый пароль для вашего аккаунта</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="new-password">Новый пароль</Label>
              <Input 
                id="new-password" 
                type="password"
                placeholder="Минимум 6 символов"
                value={resetPasswordForm.password}
                onChange={(e) => setResetPasswordForm({...resetPasswordForm, password: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Подтвердите пароль</Label>
              <Input 
                id="confirm-password" 
                type="password"
                placeholder="Введите пароль еще раз"
                value={resetPasswordForm.confirmPassword}
                onChange={(e) => setResetPasswordForm({...resetPasswordForm, confirmPassword: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
              />
            </div>
            {passwordResetMessage && (
              <div className={`text-sm p-3 rounded ${passwordResetMessage.includes('успешно') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                {passwordResetMessage}
              </div>
            )}
            <Button 
              className="w-full" 
              onClick={handleResetPassword}
              disabled={!resetPasswordForm.password || !resetPasswordForm.confirmPassword || resetPasswordForm.password !== resetPasswordForm.confirmPassword}
            >
              Изменить пароль
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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