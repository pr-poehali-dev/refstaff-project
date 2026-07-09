import { useState, useRef } from 'react';
import type { UserRole, CurrentUser, Vacancy, Employee, Recommendation, ChatMessage, NewsPost, PayoutRequest } from '@/types';
import type { Company, WalletData, Chat } from '@/lib/api';
import type { AiMessage } from '@/components/AiAssistantTab';

export function useIndexState() {
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const saved = localStorage.getItem('userRole');
      return (saved as UserRole) || 'guest';
    }
    return 'guest';
  });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [isVerifying, setIsVerifying] = useState<boolean>(() => !!localStorage.getItem('authToken'));
  const [activeVacancy, setActiveVacancy] = useState<Vacancy | null>(null);

  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCompanySettingsDialog, setShowCompanySettingsDialog] = useState(false);
  const [companyEditForm, setCompanyEditForm] = useState({ description: '', website: '', industry: '', telegram: '', vk: '' });
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [activeChatEmployee, setActiveChatEmployee] = useState<Employee | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCompanyProfileDialog, setShowCompanyProfileDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPersonalDataDialog, setShowPersonalDataDialog] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetPasswordForm, setResetPasswordForm] = useState({ token: '', password: '', confirmPassword: '' });
  const [passwordResetMessage, setPasswordResetMessage] = useState('');
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tgLoginPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxLoginPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const [newReward, setNewReward] = useState('30000');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [chats, setChats] = useState<Chat[]>([]);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false);
  const [employeeEditForm, setEmployeeEditForm] = useState({ firstName: '', lastName: '', position: '', department: '' });
  const [showIntegrationsDialog, setShowIntegrationsDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  const [subscriptionDaysLeft, setSubscriptionDaysLeft] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<Array<{id: number; type: string; message: string; date: string; read: boolean}>>([]);

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const prevRecommendationsCount = useRef<number>(0);
  const [newRecommendationsCount, setNewRecommendationsCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem('active_tab') || 'vacancies');
  const prevEmployeesCount = useRef<number>(0);
  const [newEmployeesCount, setNewEmployeesCount] = useState<number>(0);
  const prevPayoutsCount = useRef<number>(0);
  const [newPayoutsCount, setNewPayoutsCount] = useState<number>(0);
  const prevVacanciesCount = useRef<number>(0);
  const [newVacanciesCount, setNewVacanciesCount] = useState<number>(0);
  const prevRecommendationsRef = useRef<Recommendation[]>([]);
  const prevEmployeesRef = useRef<Employee[]>([]);
  const prevPayoutsRef = useRef<PayoutRequest[]>([]);
  const [newNewsCount, setNewNewsCount] = useState<number>(() => 0);
  const [newNotificationsCount, setNewNotificationsCount] = useState<number>(() => 0);
  const [employeeTabsInitialized, setEmployeeTabsInitialized] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [payoutMethodsCollapsed, setPayoutMethodsCollapsed] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
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
    amount: '', paymentMethod: 'card', paymentDetails: '',
    bankName: '', accountFullName: '', accountBank: '', accountNumber: '', accountBik: ''
  });
  const [showProfileEditDialog, setShowProfileEditDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({ phone: '', telegram: '', vk: '', avatar: '' });
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false);
  const [integrationForm, setIntegrationForm] = useState({ source: '1c', apiUrl: '', apiKey: '', syncInterval: 'manual' });
  const [editProfileForm, setEditProfileForm] = useState({ firstName: '', lastName: '', position: '', department: '' });
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactFormSubmitting, setContactFormSubmitting] = useState(false);
  const [contactFormSuccess, setContactFormSuccess] = useState(false);
  const [activeBenefit, setActiveBenefit] = useState<number | null>(null);
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [demoForm, setDemoForm] = useState({ companyName: '', name: '', phone: '', email: '', employeeCount: '' });
  const [demoFormSubmitting, setDemoFormSubmitting] = useState(false);
  const [vacancyForm, setVacancyForm] = useState({
    title: '', department: '', salary: '', description: '', requirements: '',
    motivation: '', reward: '30000', payoutDelay: '30', city: '', isRemote: false
  });
  const [recommendationForm, setRecommendationForm] = useState({ name: '', email: '', phone: '', comment: '' });
  const [registerForm, setRegisterForm] = useState({
    companyName: '', firstName: '', lastName: '', email: '', password: '', phone: '', inn: '', employeeCount: '50'
  });
  const [innVerificationState, setInnVerificationState] = useState<{
    isChecking: boolean; isVerified: boolean; error: string | null; companyData: Record<string, unknown> | null;
  }>({ isChecking: false, isVerified: false, error: null, companyData: null });
  const [aiMessages, setAiMessages] = useState<AiMessage[]>(() => {
    try { return JSON.parse(localStorage.getItem('ai_chat_history') || '[]'); } catch { return []; }
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [resendVerificationEmail, setResendVerificationEmail] = useState('');
  const [resendVerificationTimer, setResendVerificationTimer] = useState(0);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', password: '', position: '', department: '' });
  const [vacancyFilter, setVacancyFilter] = useState({ search: '', department: 'all', status: 'all' });
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
  const [rolesForm, setRolesForm] = useState({ isAdmin: false });
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [showCreateNewsDialog, setShowCreateNewsDialog] = useState(false);
  const [showEditNewsDialog, setShowEditNewsDialog] = useState(false);
  const [newsToEdit, setNewsToEdit] = useState<NewsPost | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: '', content: '', category: 'news' as 'news' | 'achievement' | 'announcement' | 'blog'
  });
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [activeNewsPost, setActiveNewsPost] = useState<NewsPost | null>(null);
  const [newComment, setNewComment] = useState('');

  const isSubscriptionExpired = subscriptionDaysLeft !== null && subscriptionDaysLeft <= 0;
  const currentEmployeeId = currentUser?.id;
  const currentCompanyId = currentUser?.company_id;

  return {
    userRole, setUserRole,
    currentUser, setCurrentUser,
    authToken, setAuthToken,
    isVerifying, setIsVerifying,
    activeVacancy, setActiveVacancy,
    showRegisterDialog, setShowRegisterDialog,
    showLoginDialog, setShowLoginDialog,
    showInviteDialog, setShowInviteDialog,
    showCompanySettingsDialog, setShowCompanySettingsDialog,
    companyEditForm, setCompanyEditForm,
    isSavingCompany, setIsSavingCompany,
    companyLogoFile, setCompanyLogoFile,
    companyLogoPreview, setCompanyLogoPreview,
    showChatDialog, setShowChatDialog,
    activeChatEmployee, setActiveChatEmployee,
    lightboxImage, setLightboxImage,
    showOnboarding, setShowOnboarding,
    showCompanyProfileDialog, setShowCompanyProfileDialog,
    showAboutDialog, setShowAboutDialog,
    showPrivacyDialog, setShowPrivacyDialog,
    showTermsDialog, setShowTermsDialog,
    showPersonalDataDialog, setShowPersonalDataDialog,
    showForgotPasswordDialog, setShowForgotPasswordDialog,
    showResetPasswordDialog, setShowResetPasswordDialog,
    forgotPasswordEmail, setForgotPasswordEmail,
    resetPasswordForm, setResetPasswordForm,
    passwordResetMessage, setPasswordResetMessage,
    pricingPeriod, setPricingPeriod,
    chatMessages, setChatMessages,
    newMessage, setNewMessage,
    selectedFiles, setSelectedFiles,
    fileInputRef,
    activeChatId, setActiveChatId,
    isSendingMessage, setIsSendingMessage,
    chatPollRef, tgLoginPollRef, maxLoginPollRef, chatMessagesEndRef,
    newReward, setNewReward,
    unreadMessagesCount, setUnreadMessagesCount,
    chats, setChats,
    employeeToDelete, setEmployeeToDelete,
    showDeleteDialog, setShowDeleteDialog,
    employeeToEdit, setEmployeeToEdit,
    showEditEmployeeDialog, setShowEditEmployeeDialog,
    employeeEditForm, setEmployeeEditForm,
    showIntegrationsDialog, setShowIntegrationsDialog,
    showSubscriptionDialog, setShowSubscriptionDialog,
    showNotificationsDialog, setShowNotificationsDialog,
    subscriptionDaysLeft, setSubscriptionDaysLeft,
    notifications, setNotifications,
    vacancies, setVacancies,
    employees, setEmployees,
    recommendations, setRecommendations,
    prevRecommendationsCount, prevEmployeesCount, prevPayoutsCount,
    prevVacanciesCount, prevRecommendationsRef, prevEmployeesRef, prevPayoutsRef,
    newRecommendationsCount, setNewRecommendationsCount,
    activeTab, setActiveTab,
    newEmployeesCount, setNewEmployeesCount,
    newPayoutsCount, setNewPayoutsCount,
    newVacanciesCount, setNewVacanciesCount,
    newNewsCount, setNewNewsCount,
    newNotificationsCount, setNewNotificationsCount,
    employeeTabsInitialized, setEmployeeTabsInitialized,
    company, setCompany,
    payoutMethodsCollapsed, setPayoutMethodsCollapsed,
    walletData, setWalletData,
    isLoading, setIsLoading,
    payoutRequests, setPayoutRequests,
    selectedEmployee, setSelectedEmployee,
    showEmployeeDetail, setShowEmployeeDetail,
    showTestManager, setShowTestManager,
    testManagerVacancy, setTestManagerVacancy,
    employeeSearchQuery, setEmployeeSearchQuery,
    employeeStatusFilter, setEmployeeStatusFilter,
    selectedVacancyDetail, setSelectedVacancyDetail,
    showVacancyDetail, setShowVacancyDetail,
    showRecommendDialog, setShowRecommendDialog,
    selectedCandidate, setSelectedCandidate,
    showCandidateDetail, setShowCandidateDetail,
    vacancySearchQuery, setVacancySearchQuery,
    recommendationSearchQuery, setRecommendationSearchQuery,
    recommendationStatusFilter, setRecommendationStatusFilter,
    showWithdrawDialog, setShowWithdrawDialog,
    withdrawForm, setWithdrawForm,
    showProfileEditDialog, setShowProfileEditDialog,
    profileForm, setProfileForm,
    showIntegrationDialog, setShowIntegrationDialog,
    integrationForm, setIntegrationForm,
    editProfileForm, setEditProfileForm,
    contactForm, setContactForm,
    contactFormSubmitting, setContactFormSubmitting,
    contactFormSuccess, setContactFormSuccess,
    activeBenefit, setActiveBenefit,
    showDemoDialog, setShowDemoDialog,
    demoForm, setDemoForm,
    demoFormSubmitting, setDemoFormSubmitting,
    vacancyForm, setVacancyForm,
    recommendationForm, setRecommendationForm,
    registerForm, setRegisterForm,
    innVerificationState, setInnVerificationState,
    aiMessages, setAiMessages,
    loginForm, setLoginForm,
    isAuthLoading, setIsAuthLoading,
    resendVerificationEmail, setResendVerificationEmail,
    resendVerificationTimer, setResendVerificationTimer,
    isResendingVerification, setIsResendingVerification,
    showEditProfileDialog, setShowEditProfileDialog,
    inviteForm, setInviteForm,
    vacancyFilter, setVacancyFilter,
    referralLink, setReferralLink,
    showReferralLinkDialog, setShowReferralLinkDialog,
    activeRecommendation, setActiveRecommendation,
    showRecommendationDetailsDialog, setShowRecommendationDetailsDialog,
    loginType, setLoginType,
    employeeLoginMethod, setEmployeeLoginMethod,
    isTgLoginLoading, setIsTgLoginLoading,
    tgLoginError, setTgLoginError,
    tgLoginStep, setTgLoginStep,
    tgLoginSession, setTgLoginSession,
    tgLoginDeepLink, setTgLoginDeepLink,
    tgLoginCode, setTgLoginCode,
    isMaxLoginLoading, setIsMaxLoginLoading,
    maxLoginError, setMaxLoginError,
    maxLoginStep, setMaxLoginStep,
    maxLoginSession, setMaxLoginSession,
    maxLoginDeepLink, setMaxLoginDeepLink,
    maxLoginCode, setMaxLoginCode,
    employeeToEditRoles, setEmployeeToEditRoles,
    showEditRolesDialog, setShowEditRolesDialog,
    rolesForm, setRolesForm,
    newsPosts, setNewsPosts,
    showCreateNewsDialog, setShowCreateNewsDialog,
    showEditNewsDialog, setShowEditNewsDialog,
    newsToEdit, setNewsToEdit,
    newsForm, setNewsForm,
    showCommentsDialog, setShowCommentsDialog,
    activeNewsPost, setActiveNewsPost,
    newComment, setNewComment,
    // derived
    isSubscriptionExpired,
    currentEmployeeId,
    currentCompanyId,
  };
}