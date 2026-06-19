import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import type { Vacancy as ApiVacancy, Employee as ApiEmployee, Recommendation as ApiRecommendation, Company, WalletData, Chat } from '@/lib/api';
import type { CurrentUser, Vacancy, Employee, Recommendation, PayoutRequest, NewsPost } from '@/types';

type Notification = { id: number; type: string; message: string; date: string; read: boolean };
type ApiVacancyExtended = ApiVacancy & { motivation?: string; company_description?: string; company_name?: string };

export function useDataLoader(params: {
  userRole: string;
  currentUser: CurrentUser | null;
  currentCompanyId: number;
  currentEmployeeId: number;
  showNotificationsDialog: boolean;
  activeEmployeeTab: string;
}) {
  const { userRole, currentUser, currentCompanyId, currentEmployeeId, showNotificationsDialog, activeEmployeeTab } = params;

  // --- State ---
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [newRecommendationsCount, setNewRecommendationsCount] = useState<number>(0);
  const [newEmployeesCount, setNewEmployeesCount] = useState<number>(0);
  const [newPayoutsCount, setNewPayoutsCount] = useState<number>(0);
  const [newVacanciesCount, setNewVacanciesCount] = useState<number>(0);
  const [newNewsCount, setNewNewsCount] = useState<number>(() => 0);
  const [newNotificationsCount, setNewNotificationsCount] = useState<number>(() => 0);
  const [employeeTabsInitialized, setEmployeeTabsInitialized] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [subscriptionDaysLeft, setSubscriptionDaysLeft] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // --- Refs ---
  const prevRecommendationsCount = useRef<number>(0);
  const prevEmployeesCount = useRef<number>(0);
  const prevPayoutsCount = useRef<number>(0);
  const prevVacanciesCount = useRef<number>(0);
  const prevRecommendationsRef = useRef<Recommendation[]>([]);
  const prevEmployeesRef = useRef<Employee[]>([]);
  const prevPayoutsRef = useRef<PayoutRequest[]>([]);

  // --- Helpers ---
  const getReadNotifIds = () => {
    try { return new Set<string>(JSON.parse(localStorage.getItem('readNotifIds') || '[]')); } catch { return new Set<string>(); }
  };
  const markNotifIdsRead = (ids: string[]) => {
    const existing = getReadNotifIds();
    ids.forEach(id => existing.add(id));
    localStorage.setItem('readNotifIds', JSON.stringify([...existing].slice(-200)));
  };

  // --- loadData ---
  const loadData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      const dashParams = new URLSearchParams({
        resource: 'dashboard',
        company_id: String(currentCompanyId),
        role: userRole,
        ...(currentUser?.id ? { user_id: String(currentUser.id) } : {}),
      });
      const dashRes = await fetch(`https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?${dashParams}`);
      const dash = await dashRes.json();

      const vacanciesData = dash.vacancies || [];
      const employeesData = dash.employees || [];
      const recommendationsData = dash.recommendations || [];
      const companyData = dash.company || null;
      const chatsData = dash.chats || [];
      const newsData = dash.news || [];
      const walletDash = dash.wallet || null;

      const payoutsData = userRole === 'employer'
        ? await fetch(`https://functions.poehali.dev/f31523e1-66d9-4d65-8966-76cbff949641?company_id=${currentCompanyId}`).then(r => r.json()).catch(() => [])
        : [];

      const mappedVacancies: Vacancy[] = vacanciesData.map((v: ApiVacancy) => ({
        id: v.id,
        title: v.title,
        department: v.department,
        salary: v.salary_display,
        status: v.status,
        recommendations: v.recommendations_count || 0,
        reward: v.reward_amount,
        payoutDelayDays: v.payout_delay_days || 30,
        description: v.description || '',
        requirements: v.requirements || '',
        motivation: (v as ApiVacancyExtended).motivation || '',
        companyDescription: (v as ApiVacancyExtended).company_description || '',
        companyName: (v as ApiVacancyExtended).company_name || '',
        referralLink: v.referral_token && userRole === 'employee' ? `${window.location.origin}/r/${v.referral_token}?ref=${currentEmployeeId}` : ''
      }));

      const mappedEmployees: Employee[] = employeesData.map((e: ApiEmployee) => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name}`,
        position: e.position,
        department: e.department,
        avatar: e.avatar_url || '',
        recommendations: e.total_recommendations,
        hired: e.successful_hires,
        earnings: Number(e.total_earned ?? e.total_earnings),
        level: e.level,
        experiencePoints: e.experience_points || 0,
        email: e.email,
        phone: e.phone,
        telegram: e.telegram,
        vk: e.vk,
        isAdmin: e.is_admin || false,
        isFired: e.is_fired || false
      }));

      const mappedRecommendations: Recommendation[] = recommendationsData.map((r: ApiRecommendation) => {
        return {
          id: r.id,
          candidateName: r.candidate_name,
          candidateEmail: r.candidate_email,
          candidatePhone: r.candidate_phone,
          vacancy: r.vacancy_title || '',
          vacancyTitle: r.vacancy_title || '',
          status: r.status as 'pending' | 'interview' | 'hired' | 'rejected' | 'accepted',
          date: new Date(r.created_at).toISOString().split('T')[0],
          acceptedDate: r.accepted_at ? r.accepted_at : undefined,
          reward: r.reward_amount,
          recommendedBy: r.recommended_by_name,
          employeeId: r.recommended_by,
          comment: r.comment,
          resumeUrl: r.resume_url,
          payoutDelayDays: r.payout_delay_days ?? 30
        };
      });

      if (userRole === 'employee') {
        if (prevVacanciesCount.current > 0) {
          const vacDiff = mappedVacancies.length - prevVacanciesCount.current;
          if (vacDiff > 0) {
            setNewVacanciesCount(prev => prev + vacDiff);
            const newVacs = mappedVacancies.slice(mappedVacancies.length - vacDiff);
            setNotifications(prev => [
              ...newVacs.map((v, i) => ({
                id: Date.now() + i,
                type: 'vacancy',
                message: `Новая вакансия: "${v.title}" — ${v.salary}`,
                date: new Date().toISOString(),
                read: false
              })),
              ...prev
            ]);
          }
        }
        prevVacanciesCount.current = mappedVacancies.length;

        if (prevRecommendationsCount.current > 0) {
          mappedRecommendations.forEach((rec) => {
            const prevRec = prevRecommendationsRef.current.find((r: Recommendation) => r.id === rec.id);
            if (prevRec && prevRec.status !== rec.status) {
              const statusLabels: Record<string, string> = {
                pending: 'На рассмотрении',
                accepted: 'Принят',
                rejected: 'Отклонён',
                hired: 'Нанят',
                interview: 'На собеседовании'
              };
              setNotifications(prev => [{
                id: Date.now() + rec.id,
                type: 'recommendation',
                message: `Статус кандидата "${rec.candidateName}" изменён: ${statusLabels[rec.status] || rec.status}`,
                date: new Date().toISOString(),
                read: false
              }, ...prev]);
            }
          });
        }
      }
      setVacancies(mappedVacancies);

      if (prevEmployeesCount.current > 0) {
        const empDiff = mappedEmployees.length - prevEmployeesCount.current;
        if (empDiff > 0) setNewEmployeesCount(prev => prev + empDiff);
      }
      prevEmployeesCount.current = mappedEmployees.length;
      prevEmployeesRef.current = mappedEmployees;
      setEmployees(mappedEmployees);

      if (prevRecommendationsCount.current > 0) {
        const recDiff = mappedRecommendations.length - prevRecommendationsCount.current;
        if (recDiff > 0) setNewRecommendationsCount(prev => prev + recDiff);
      }
      prevRecommendationsCount.current = mappedRecommendations.length;
      prevRecommendationsRef.current = mappedRecommendations;
      setRecommendations(mappedRecommendations);
      setCompany(companyData);
      if (companyData?.subscription_tier === 'none' || !companyData?.subscription_expires_at) {
        setSubscriptionDaysLeft(-1);
      } else {
        const expiresStr = companyData.subscription_expires_at.endsWith('Z')
          ? companyData.subscription_expires_at
          : companyData.subscription_expires_at + 'Z';
        const expires = new Date(expiresStr);
        const now = new Date();
        const days = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setSubscriptionDaysLeft(days);
      }

      if (userRole === 'employer' && Array.isArray(payoutsData)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        if (prevPayoutsCount.current > 0) {
          const payDiff = mappedPayouts.length - prevPayoutsCount.current;
          if (payDiff > 0) {
            setNewPayoutsCount(prev => prev + payDiff);
            const newPays = mappedPayouts.filter(p => !prevPayoutsRef.current.find(ex => ex.id === p.id));
            newPays.forEach((pay, i) => {
              setNotifications(prev => [{
                id: Date.now() + 60 + i,
                type: 'payout',
                message: `Новый запрос на выплату от ${pay.userName}: ${pay.amount.toLocaleString()} ₽`,
                date: new Date().toISOString(),
                read: false
              }, ...prev]);
            });
          }
        }
        prevPayoutsCount.current = mappedPayouts.length;
        prevPayoutsRef.current = mappedPayouts;
        setPayoutRequests(mappedPayouts);
      }

      if (Array.isArray(chatsData) && chatsData.length > 0) {
        setChats(chatsData);
        const totalUnread = chatsData.reduce((sum: number, c: Chat) => sum + (c.unread_count || 0), 0);
        if (userRole === 'employer' && totalUnread > unreadMessagesCount && prevRecommendationsCount.current > 0) {
          setNotifications(prev => [{
            id: Date.now() + 10,
            type: 'chat',
            message: `Новые сообщения в чате (${totalUnread} непрочитанных)`,
            date: new Date().toISOString(),
            read: false
          }, ...prev]);
        }
        setUnreadMessagesCount(totalUnread);
      }

      if (userRole === 'employer') {
        if (prevEmployeesCount.current > 0) {
          const newEmps = mappedEmployees.filter(e => !prevEmployeesRef.current.find(ex => ex.id === e.id));
          newEmps.forEach((emp, i) => {
            setNotifications(prev => [{
              id: Date.now() + 20 + i,
              type: 'employee',
              message: `Зарегистрировался новый сотрудник: ${emp.name} (${emp.position})`,
              date: new Date().toISOString(),
              read: false
            }, ...prev]);
          });
        }

        if (prevRecommendationsCount.current > 0) {
          const newRecs = mappedRecommendations.filter(r => !prevRecommendationsRef.current.find(ex => ex.id === r.id));
          newRecs.forEach((rec, i) => {
            setNotifications(prev => [{
              id: Date.now() + 30 + i,
              type: 'recommendation',
              message: `Новая рекомендация: "${rec.candidateName}" на вакансию "${rec.vacancyTitle || rec.vacancy}"`,
              date: new Date().toISOString(),
              read: false
            }, ...prev]);
          });

          const statusLabels: Record<string, string> = {
            pending: 'На рассмотрении', accepted: 'Принят',
            rejected: 'Отклонён', hired: 'Нанят', interview: 'На собеседовании'
          };
          mappedRecommendations.forEach((rec, i) => {
            const prevRec = prevRecommendationsRef.current.find(r => r.id === rec.id);
            if (prevRec && prevRec.status !== rec.status) {
              setNotifications(prev => [{
                id: Date.now() + 40 + i,
                type: 'recommendation',
                message: `Статус кандидата "${rec.candidateName}" изменён на "${statusLabels[rec.status] || rec.status}"`,
                date: new Date().toISOString(),
                read: false
              }, ...prev]);
            }
          });
        }

        if (subscriptionDaysLeft !== null && subscriptionDaysLeft <= 3 && subscriptionDaysLeft > 0) {
          setNotifications(prev => {
            const alreadyExists = prev.some(n => n.type === 'subscription' && n.message.includes('подписка'));
            if (alreadyExists) return prev;
            return [{
              id: Date.now() + 50,
              type: 'subscription',
              message: `⚠️ Через ${subscriptionDaysLeft} дн. истекает подписка на сервис. Продлите, чтобы не потерять доступ.`,
              date: new Date().toISOString(),
              read: false
            }, ...prev];
          });
        }
      }

      if (userRole === 'employee') {
        const wallet = walletDash;
        if (wallet && walletData) {
          const prevBalance = walletData.wallet?.wallet_balance || 0;
          const newBalance = wallet.wallet?.wallet_balance || 0;
          if (newBalance > prevBalance) {
            setNotifications(prev => [{
              id: Date.now(),
              type: 'wallet',
              message: `Баланс пополнен: +${(newBalance - prevBalance).toLocaleString()} ₽`,
              date: new Date().toISOString(),
              read: false
            }, ...prev]);
          }
          const prevTxCount = walletData.transactions?.length || 0;
          const newTxCount = wallet.transactions?.length || 0;
          if (newTxCount > prevTxCount) {
            const newTx = wallet.transactions[0];
            if (newTx) {
              setNotifications(prev => [{
                id: Date.now() + 1,
                type: 'wallet',
                message: `Новая запись в истории кошелька: ${newTx.description || 'Транзакция'} (${newTx.amount > 0 ? '+' : ''}${newTx.amount.toLocaleString()} ₽)`,
                date: new Date().toISOString(),
                read: false
              }, ...prev]);
            }
          }
        }
        setWalletData(wallet);
      }

      if (userRole === 'employee') {
        const employeeChats = Array.isArray(chatsData) ? chatsData : [];
        const totalUnread = employeeChats.reduce((sum: number, c: Chat) => sum + (c.unread_count || 0), 0);
        // NOTE: prevRecommendationsCount (ref object) is always truthy — preserved exactly from Index.tsx
        if (totalUnread > unreadMessagesCount && unreadMessagesCount >= 0 && prevRecommendationsCount > 0) {
          setNotifications(prev => [{
            id: Date.now() + 2,
            type: 'chat',
            message: `Новые сообщения в чате с HR (${totalUnread} непрочитанных)`,
            date: new Date().toISOString(),
            read: false
          }, ...prev]);
        }
      }

      // Загружаем новости
      if (Array.isArray(newsData)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedNews = newsData.map((n: any) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          author: n.author || 'Администратор',
          date: n.created_at ? new Date(n.created_at).toISOString().split('T')[0] : '',
          category: n.category || 'news',
          likes: n.likes || 0,
          isArchived: n.is_archived || false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          comments: (n.comments || []).map((c: any) => ({
            id: c.id, newsId: n.id, authorName: c.author_name, comment: c.text,
            date: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : ''
          }))
        }));
        setNewsPosts(mappedNews);
      }

    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect #6 — main data loading with 180s polling
  useEffect(() => {
    if ((userRole === 'employer' || userRole === 'employee') && currentUser) {
      loadData();
      const pollInterval = setInterval(() => loadData(true), 180000);
      return () => clearInterval(pollInterval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, currentUser]);

  // useEffect #7 — mark notifications as read when dialog opens
  useEffect(() => {
    if (showNotificationsDialog) {
      setNotifications(prev => {
        const ids = prev.filter(n => !n.read).map(n => String(n.id));
        if (ids.length) markNotifIdsRead(ids);
        return prev.map(n => ({ ...n, read: true }));
      });
      setNewNotificationsCount(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNotificationsDialog]);

  // useEffect #8 — update notification count
  useEffect(() => {
    if (activeEmployeeTab === 'notifications') return;
    const unread = notifications.filter(n => !n.read).length;
    setNewNotificationsCount(unread);
  }, [notifications, activeEmployeeTab]);

  // useEffect #9 — load employee notifications
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

  return {
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
  };
}