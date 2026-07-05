import React from 'react';
import { api, type Vacancy as ApiVacancy, type Employee as ApiEmployee, type Recommendation as ApiRecommendation } from '@/lib/api';
import type { UserRole, Vacancy, Employee, Recommendation, ChatMessage, NewsPost, NewsComment, PayoutRequest } from '@/types';

// Принимает всё состояние из useIndexState и возвращает все обработчики
export function useIndexHandlers(s: ReturnType<typeof import('./useIndexState').useIndexState>) {
  const verifyToken = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/c6b69066-22c2-4545-bd88-10571ecd9140', {
        method: 'GET', mode: 'cors',
        headers: { 'X-Auth-Token': s.authToken || '' }
      });
      if (response.ok) {
        const data = await response.json();
        s.setCurrentUser(data.user);
        const newRole: UserRole = data.user?.is_admin ? 'employer' : 'employee';
        s.setUserRole(newRole);
        localStorage.setItem('userRole', newRole);
      } else { handleLogout(); }
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      handleLogout();
    } finally { s.setIsVerifying(false); }
  };

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из системы?')) {
      localStorage.removeItem('userRole');
      localStorage.removeItem('authToken');
      localStorage.removeItem('showOnboarding');
      localStorage.removeItem('onboarding_completed');
      s.setUserRole('guest');
      s.setAuthToken(null);
      s.setCurrentUser(null);
      s.setShowOnboarding(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const loadChatMessages = async (chatId: number) => {
    try {
      const msgs = await api.getMessages(chatId);
      const mapped: ChatMessage[] = msgs.map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender_name || 'Сотрудник',
        message: m.message,
        timestamp: new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        isOwn: m.sender_id === s.currentUser?.id,
        attachments: m.attachment_url ? [{
          type: m.attachment_type as 'image' | 'file',
          url: m.attachment_url,
          name: m.attachment_name || 'файл',
          size: m.attachment_size || 0,
        }] : undefined,
      }));
      s.setChatMessages(mapped);
      setTimeout(() => s.chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) { console.error('Failed to load messages:', e); }
  };

  const handleSelectChatEmployee = async (emp: Employee) => {
    s.setActiveChatEmployee(emp);
    s.setChatMessages([]);
    s.setActiveChatId(null);
    try {
      const chat = await api.createChat(s.currentCompanyId || 0, emp.id);
      const chatId = Number(chat.chat_id || chat.id);
      if (!chatId) { console.error('No chatId returned', chat); return; }
      s.setActiveChatId(chatId);
      await loadChatMessages(chatId);
      if (s.currentUser?.id) {
        api.markMessagesRead(chatId, s.currentUser.id);
        s.setChats(prev => prev.map(c => (c.id === chatId || c.chat_id === chatId) ? { ...c, unread_count: 0 } : c));
        s.setUnreadMessagesCount(prev => {
          const chatUnread = s.chats.find(c => c.id === chatId || c.chat_id === chatId)?.unread_count || 0;
          return Math.max(0, prev - chatUnread);
        });
      }
      if (s.chatPollRef.current) clearInterval(s.chatPollRef.current);
      s.chatPollRef.current = setInterval(() => loadChatMessages(chatId), 5000);
    } catch (e) { console.error('Failed to open chat:', e); }
  };

  const MAX_FILE_SIZE_MB = 4;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const compressImage = (file: File, maxSizeMB = 3): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1600;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        let quality = 0.85;
        const tryEncode = () => {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const bytes = (dataUrl.length * 3) / 4;
          if (bytes > maxSizeMB * 1024 * 1024 && quality > 0.4) { quality -= 0.1; tryEncode(); }
          else { resolve(dataUrl.split(',')[1]); }
        };
        tryEncode();
      };
      img.onerror = reject;
      img.src = url;
    });

  const handleSendMessage = async () => {
    if ((!s.newMessage.trim() && s.selectedFiles.length === 0) || !s.activeChatId || s.isSendingMessage) return;
    s.setIsSendingMessage(true);
    try {
      if (s.selectedFiles.length > 0) {
        for (const file of s.selectedFiles) {
          let base64: string;
          let mime_type = file.type;
          if (file.type.startsWith('image/')) { base64 = await compressImage(file); mime_type = 'image/jpeg'; }
          else {
            base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve((reader.result as string).split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          }
          await api.sendMessage(s.activeChatId, s.currentUser?.id || 0, s.newMessage.trim(), { base64, name: file.name, mime_type });
        }
      } else {
        await api.sendMessage(s.activeChatId, s.currentUser?.id || 0, s.newMessage.trim());
      }
      s.setNewMessage('');
      s.setSelectedFiles([]);
      await loadChatMessages(s.activeChatId);
    } catch (e) {
      console.error('Failed to send message:', e);
      alert('Не удалось отправить файл. Попробуйте файл меньшего размера.');
    } finally { s.setIsSendingMessage(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const tooBig = files.filter(f => f.size > MAX_FILE_SIZE_BYTES);
    if (tooBig.length > 0) {
      alert(`Файл "${tooBig[0].name}" слишком большой. Максимальный размер — ${MAX_FILE_SIZE_MB} МБ.`);
      e.target.value = '';
      return;
    }
    s.setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    s.setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleOpenChat = () => {
    s.setShowChatDialog(true);
    s.setUnreadMessagesCount(0);
    if (s.userRole === 'employee') {
      const hr = s.employees.find(e => e.isAdmin && !e.isFired) || s.employees[0];
      if (hr) s.setActiveChatEmployee(hr);
    }
  };

  const getReadNotifIds = () => {
    try { return new Set<string>(JSON.parse(localStorage.getItem('readNotifIds') || '[]')); }
    catch { return new Set<string>(); }
  };

  const markNotifIdsRead = (ids: string[]) => {
    const existing = getReadNotifIds();
    ids.forEach(id => existing.add(id));
    localStorage.setItem('readNotifIds', JSON.stringify([...existing].slice(-200)));
  };

  const loadData = async (silent = false) => {
    try {
      if (!silent) s.setIsLoading(true);
      const vacancyStatus = s.userRole === 'employer' ? 'all' : 'active';
      const [vacanciesData, employeesData, recommendationsData, companyData, payoutsData, chatsData, newsData] = await Promise.all([
        api.getVacancies(s.currentCompanyId, vacancyStatus).catch(() => []),
        api.getEmployees(s.currentCompanyId).catch(() => []),
        s.userRole === 'employer'
          ? api.getRecommendations(s.currentCompanyId).catch(() => [])
          : api.getRecommendations(s.currentCompanyId, undefined, s.currentEmployeeId).catch(() => []),
        api.getCompany(s.currentCompanyId).catch(() => null),
        s.userRole === 'employer'
          ? fetch(`https://functions.poehali.dev/f31523e1-66d9-4d65-8966-76cbff949641?company_id=${s.currentCompanyId}`)
              .then(res => res.json()).catch(() => [])
          : Promise.resolve([]),
        s.userRole === 'employer' && s.currentUser?.id
          ? api.getChats(s.currentUser.id, s.currentCompanyId).catch(() => [])
          : Promise.resolve([]),
        s.currentCompanyId
          ? fetch(`https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news&company_id=${s.currentCompanyId}&role=${s.userRole}`)
              .then(res => res.json()).catch(() => [])
          : Promise.resolve([])
      ]);

      const mappedVacancies: Vacancy[] = vacanciesData.map((v: ApiVacancy) => ({
        id: v.id, title: v.title, department: v.department, salary: v.salary_display,
        status: v.status, recommendations: v.recommendations_count || 0,
        reward: v.reward_amount, payoutDelayDays: v.payout_delay_days || 30,
        description: v.description || '', requirements: v.requirements || '',
        motivation: (v as any).motivation || '', companyDescription: (v as any).company_description || '',
        companyName: (v as any).company_name || '',
        referralLink: v.referral_token && s.userRole === 'employee'
          ? `${window.location.origin}/r/${v.referral_token}?ref=${s.currentEmployeeId}` : ''
      }));

      const mappedEmployees: Employee[] = employeesData.map((e: ApiEmployee) => ({
        id: e.id, name: `${e.first_name} ${e.last_name}`, position: e.position,
        department: e.department, avatar: e.avatar_url || '',
        recommendations: e.total_recommendations, hired: e.successful_hires,
        earnings: Number(e.total_earned ?? e.total_earnings), level: e.level,
        experiencePoints: e.experience_points || 0, email: e.email,
        phone: e.phone, telegram: e.telegram, vk: e.vk,
        isAdmin: e.is_admin || false, isFired: e.is_fired || false
      }));

      const mappedRecommendations: Recommendation[] = recommendationsData.map((r: ApiRecommendation) => ({
        id: r.id, candidateName: r.candidate_name, candidateEmail: r.candidate_email,
        candidatePhone: r.candidate_phone, vacancy: r.vacancy_title || '',
        vacancyTitle: r.vacancy_title || '',
        status: r.status as 'pending' | 'interview' | 'hired' | 'rejected' | 'accepted',
        date: new Date(r.created_at).toISOString().split('T')[0],
        acceptedDate: r.accepted_at ? r.accepted_at : undefined,
        reward: r.reward_amount, recommendedBy: r.recommended_by_name,
        employeeId: r.recommended_by, comment: r.comment,
        resumeUrl: r.resume_url, payoutDelayDays: r.payout_delay_days ?? 30
      }));

      if (s.userRole === 'employee') {
        if (s.prevVacanciesCount.current > 0) {
          const vacDiff = mappedVacancies.length - s.prevVacanciesCount.current;
          if (vacDiff > 0) {
            s.setNewVacanciesCount(prev => prev + vacDiff);
            const newVacs = mappedVacancies.slice(mappedVacancies.length - vacDiff);
            s.setNotifications(prev => [
              ...newVacs.map((v, i) => ({ id: Date.now() + i, type: 'vacancy', message: `Новая вакансия: "${v.title}" — ${v.salary}`, date: new Date().toISOString(), read: false })),
              ...prev
            ]);
          }
        }
        s.prevVacanciesCount.current = mappedVacancies.length;
        if (s.prevRecommendationsCount.current > 0) {
          mappedRecommendations.forEach((rec) => {
            const prevRec = s.prevRecommendationsRef.current.find((r: Recommendation) => r.id === rec.id);
            if (prevRec && prevRec.status !== rec.status) {
              const statusLabels: Record<string, string> = { pending: 'На рассмотрении', accepted: 'Принят', rejected: 'Отклонён', hired: 'Нанят', interview: 'На собеседовании' };
              s.setNotifications(prev => [{ id: Date.now() + rec.id, type: 'recommendation', message: `Статус кандидата "${rec.candidateName}" изменён: ${statusLabels[rec.status] || rec.status}`, date: new Date().toISOString(), read: false }, ...prev]);
            }
          });
        }
      }
      s.setVacancies(mappedVacancies);

      if (s.prevEmployeesCount.current > 0) {
        const empDiff = mappedEmployees.length - s.prevEmployeesCount.current;
        if (empDiff > 0) s.setNewEmployeesCount(prev => prev + empDiff);
      }
      s.prevEmployeesCount.current = mappedEmployees.length;
      s.prevEmployeesRef.current = mappedEmployees;
      s.setEmployees(mappedEmployees);

      if (s.prevRecommendationsCount.current > 0) {
        const recDiff = mappedRecommendations.length - s.prevRecommendationsCount.current;
        if (recDiff > 0) s.setNewRecommendationsCount(prev => prev + recDiff);
      }
      s.prevRecommendationsCount.current = mappedRecommendations.length;
      s.prevRecommendationsRef.current = mappedRecommendations;
      s.setRecommendations(mappedRecommendations);
      s.setCompany(companyData);
      if (companyData?.subscription_tier === 'none' || !companyData?.subscription_expires_at) {
        s.setSubscriptionDaysLeft(-1);
      } else {
        const expires = new Date(companyData.subscription_expires_at);
        const now = new Date();
        s.setSubscriptionDaysLeft(Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      if (s.userRole === 'employer' && Array.isArray(payoutsData)) {
        const mappedPayouts: PayoutRequest[] = payoutsData.map((p: any) => ({
          id: p.id, userId: p.user_id, userName: p.user_name, userEmail: p.user_email,
          amount: parseFloat(p.amount), status: p.status, paymentMethod: p.payment_method,
          paymentDetails: p.payment_details, adminComment: p.admin_comment,
          createdAt: p.created_at, reviewedAt: p.reviewed_at, reviewedBy: p.reviewed_by
        }));
        if (s.prevPayoutsCount.current > 0) {
          const payDiff = mappedPayouts.length - s.prevPayoutsCount.current;
          if (payDiff > 0) {
            s.setNewPayoutsCount(prev => prev + payDiff);
            const newPays = mappedPayouts.filter(p => !s.prevPayoutsRef.current.find(ex => ex.id === p.id));
            newPays.forEach((pay, i) => {
              s.setNotifications(prev => [{ id: Date.now() + 60 + i, type: 'payout', message: `Новый запрос на выплату от ${pay.userName}: ${pay.amount.toLocaleString()} ₽`, date: new Date().toISOString(), read: false }, ...prev]);
            });
          }
        }
        s.prevPayoutsCount.current = mappedPayouts.length;
        s.prevPayoutsRef.current = mappedPayouts;
        s.setPayoutRequests(mappedPayouts);
      }

      if (Array.isArray(chatsData) && chatsData.length > 0) {
        s.setChats(chatsData);
        const totalUnread = chatsData.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
        if (s.userRole === 'employer' && totalUnread > s.unreadMessagesCount && s.prevRecommendationsCount.current > 0) {
          s.setNotifications(prev => [{ id: Date.now() + 10, type: 'chat', message: `Новые сообщения в чате (${totalUnread} непрочитанных)`, date: new Date().toISOString(), read: false }, ...prev]);
        }
        s.setUnreadMessagesCount(totalUnread);
      }

      if (s.userRole === 'employer') {
        if (s.prevEmployeesCount.current > 0) {
          const newEmps = mappedEmployees.filter(e => !s.prevEmployeesRef.current.find(ex => ex.id === e.id));
          newEmps.forEach((emp, i) => {
            s.setNotifications(prev => [{ id: Date.now() + 20 + i, type: 'employee', message: `Зарегистрировался новый сотрудник: ${emp.name} (${emp.position})`, date: new Date().toISOString(), read: false }, ...prev]);
          });
        }
        if (s.prevRecommendationsCount.current > 0) {
          const newRecs = mappedRecommendations.filter(r => !s.prevRecommendationsRef.current.find(ex => ex.id === r.id));
          newRecs.forEach((rec, i) => {
            s.setNotifications(prev => [{ id: Date.now() + 30 + i, type: 'recommendation', message: `Новая рекомендация: "${rec.candidateName}" на вакансию "${rec.vacancyTitle || rec.vacancy}"`, date: new Date().toISOString(), read: false }, ...prev]);
          });
          const statusLabels: Record<string, string> = { pending: 'На рассмотрении', accepted: 'Принят', rejected: 'Отклонён', hired: 'Нанят', interview: 'На собеседовании' };
          mappedRecommendations.forEach((rec, i) => {
            const prevRec = s.prevRecommendationsRef.current.find(r => r.id === rec.id);
            if (prevRec && prevRec.status !== rec.status) {
              s.setNotifications(prev => [{ id: Date.now() + 40 + i, type: 'recommendation', message: `Статус кандидата "${rec.candidateName}" изменён на "${statusLabels[rec.status] || rec.status}"`, date: new Date().toISOString(), read: false }, ...prev]);
            }
          });
        }
        if (s.subscriptionDaysLeft !== null && s.subscriptionDaysLeft <= 3 && s.subscriptionDaysLeft > 0) {
          s.setNotifications(prev => {
            if (prev.some(n => n.type === 'subscription' && n.message.includes('подписка'))) return prev;
            return [{ id: Date.now() + 50, type: 'subscription', message: `Через ${s.subscriptionDaysLeft} дн. истекает подписка на сервис. Продлите, чтобы не потерять доступ.`, date: new Date().toISOString(), read: false }, ...prev];
          });
        }
      }

      if (s.userRole === 'employee') {
        const wallet = await api.getWallet(s.currentEmployeeId).catch(() => null);
        if (wallet && s.walletData) {
          const prevBalance = s.walletData.wallet?.wallet_balance || 0;
          const newBalance = wallet.wallet?.wallet_balance || 0;
          if (newBalance > prevBalance) {
            s.setNotifications(prev => [{ id: Date.now(), type: 'wallet', message: `Баланс пополнен: +${(newBalance - prevBalance).toLocaleString()} ₽`, date: new Date().toISOString(), read: false }, ...prev]);
          }
          const prevTxCount = s.walletData.transactions?.length || 0;
          const newTxCount = wallet.transactions?.length || 0;
          if (newTxCount > prevTxCount) {
            const newTx = wallet.transactions[0];
            if (newTx) {
              s.setNotifications(prev => [{ id: Date.now() + 1, type: 'wallet', message: `Новая запись в истории кошелька: ${newTx.description || 'Транзакция'} (${newTx.amount > 0 ? '+' : ''}${newTx.amount.toLocaleString()} ₽)`, date: new Date().toISOString(), read: false }, ...prev]);
            }
          }
        }
        s.setWalletData(wallet);
      }

      if (Array.isArray(newsData)) {
        const mappedNews = newsData.map((n: any) => ({
          id: n.id, title: n.title, content: n.content,
          author: n.author || 'Администратор',
          date: n.created_at ? new Date(n.created_at).toISOString().split('T')[0] : '',
          category: n.category || 'news', likes: n.likes || 0,
          isArchived: n.is_archived || false,
          comments: (n.comments || []).map((c: any) => ({
            id: c.id, newsId: n.id, authorName: c.author_name, comment: c.text,
            date: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : ''
          }))
        }));
        s.setNewsPosts(mappedNews);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally { s.setIsLoading(false); }
  };

  const calculateEmployeeRank = (emp: Employee) => {
    const sortedEmployees = [...s.employees].sort((a, b) => {
      if (b.hired !== a.hired) return b.hired - a.hired;
      if (b.recommendations !== a.recommendations) return b.recommendations - a.recommendations;
      return b.earnings - a.earnings;
    });
    return sortedEmployees.findIndex(e => e.id === emp.id) + 1;
  };

  const handleSaveCompany = async () => {
    try {
      s.setIsSavingCompany(true);
      let logoUrl: string | undefined;
      if (s.companyLogoFile) {
        logoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(s.companyLogoFile!);
        });
      }
      await api.updateCompany(s.currentCompanyId, {
        description: s.companyEditForm.description, website: s.companyEditForm.website,
        industry: s.companyEditForm.industry, telegram: s.companyEditForm.telegram,
        vk: s.companyEditForm.vk, ...(logoUrl ? { logo_url: logoUrl } : {})
      });
      s.setCompanyLogoFile(null);
      s.setCompanyLogoPreview(null);
      await loadData();
      s.setShowCompanySettingsDialog(false);
    } catch { alert('Ошибка при сохранении'); }
    finally { s.setIsSavingCompany(false); }
  };

  const handleCreateVacancy = async () => {
    if (!s.vacancyForm.title || !s.vacancyForm.salary) { alert('Заполните обязательные поля: Должность и Зарплата'); return; }
    try {
      await api.createVacancy({
        company_id: s.currentCompanyId, title: s.vacancyForm.title, department: s.vacancyForm.department,
        salary_display: s.vacancyForm.salary, description: s.vacancyForm.description,
        requirements: s.vacancyForm.requirements, motivation: s.vacancyForm.motivation,
        reward_amount: parseInt(s.vacancyForm.reward), payout_delay_days: parseInt(s.vacancyForm.payoutDelay),
        created_by: s.currentEmployeeId, city: s.vacancyForm.city, is_remote: s.vacancyForm.isRemote
      });
      await loadData();
      s.setVacancyForm({ title: '', department: '', salary: '', description: '', requirements: '', motivation: '', reward: '30000', payoutDelay: '30', city: '', isRemote: false });
      alert('Вакансия успешно создана!');
    } catch (error) { console.error(error); alert('Ошибка при создании вакансии. Попробуйте обновить страницу и войти заново.'); }
  };

  const handleCreateRecommendation = async (data: { vacancyId: number; name: string; email: string; phone: string; comment: string }) => {
    if (!data.name || !data.phone || !data.comment) { alert('Заполните обязательные поля: ФИО, Телефон и Сопроводительное письмо'); return; }
    try {
      await api.createRecommendation({ vacancy_id: data.vacancyId, recommended_by: s.currentEmployeeId, candidate_name: data.name, candidate_email: data.email, candidate_phone: data.phone, comment: data.comment });
      await loadData();
      s.setRecommendationForm({ name: '', email: '', phone: '', comment: '' });
      alert('Рекомендация успешно отправлена!');
    } catch (error) { console.error(error); alert('Не удалось отправить рекомендацию'); }
  };

  const handleUpdateRecommendationStatus = async (id: number, status: string) => {
    try {
      await api.updateRecommendationStatus(id, status);
      await loadData();
      if (status === 'accepted') alert('Кандидат принят!');
      else if (status === 'rejected') alert('Рекомендация отклонена.');
    } catch (error) { console.error(error); alert('Не удалось обновить статус рекомендации'); }
  };

  const handleDeleteEmployee = async (userId: number) => {
    if (!s.authToken) return;
    try {
      await api.deleteEmployee(s.authToken, userId);
      await loadData();
      s.setShowDeleteDialog(false);
      s.setEmployeeToDelete(null);
    } catch (error) { console.error(error); alert('Не удалось удалить сотрудника'); }
  };

  const handleUpdateVacancy = async () => {
    if (!s.activeVacancy || !s.vacancyForm.title || !s.vacancyForm.salary) { alert('Заполните обязательные поля: Должность и Зарплата'); return; }
    try {
      await api.updateVacancy(s.activeVacancy.id, {
        title: s.vacancyForm.title, department: s.vacancyForm.department, salary_display: s.vacancyForm.salary,
        description: s.vacancyForm.description, requirements: s.vacancyForm.requirements, motivation: s.vacancyForm.motivation,
        reward_amount: parseInt(s.vacancyForm.reward), payout_delay_days: parseInt(s.vacancyForm.payoutDelay)
      });
      await loadData();
      s.setActiveVacancy(null);
      s.setVacancyForm({ title: '', department: '', salary: '', description: '', requirements: '', motivation: '', reward: '30000', payoutDelay: '30', city: '', isRemote: false });
      alert('Вакансия успешно обновлена!');
    } catch (error) { console.error(error); alert('Не удалось обновить вакансию'); }
  };

  const handleArchiveVacancy = async (vacancyId: number) => {
    try { await api.updateVacancy(vacancyId, { status: 'archived' }); await loadData(); alert('Вакансия перенесена в архив'); }
    catch (error) { console.error(error); alert('Не удалось архивировать вакансию'); }
  };

  const handleRestoreVacancy = async (vacancyId: number) => {
    try { await api.updateVacancy(vacancyId, { status: 'active' }); await loadData(); alert('Вакансия восстановлена в активные'); }
    catch (error) { console.error(error); alert('Не удалось восстановить вакансию'); }
  };

  const handleDeleteVacancy = async (vacancyId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить вакансию? Это действие нельзя отменить.')) return;
    try { await api.deleteVacancy(vacancyId); await loadData(); alert('Вакансия удалена'); }
    catch (error) { console.error(error); alert('Не удалось удалить вакансию'); }
  };

  const handleGenerateReferralLink = () => {
    if (s.company?.invite_token) {
      const link = `${window.location.origin}/employee-register?token=${s.company.invite_token}`;
      s.setReferralLink(link);
      s.setShowEmployeeDetail(false);
      s.setShowReferralLinkDialog(true);
    } else { alert('Ошибка: токен компании не найден'); }
  };

  const handleCopyLink = (link: string) => { navigator.clipboard.writeText(link); alert('Ссылка скопирована в буфер обмена'); };

  const handleUpdateProfile = async () => {
    try {
      await api.updateEmployee(s.currentEmployeeId, { phone: s.profileForm.phone, telegram: s.profileForm.telegram, vk: s.profileForm.vk, avatar_url: s.profileForm.avatar });
      await loadData();
      s.setShowProfileEditDialog(false);
      alert('Профиль успешно обновлён!');
    } catch (error) { console.error(error); alert('Не удалось обновить профиль'); }
  };

  const handleUpdateEmployeeData = async () => {
    if (!s.employeeToEdit) return;
    try {
      await api.updateEmployee(s.employeeToEdit.id, { first_name: s.employeeEditForm.firstName, last_name: s.employeeEditForm.lastName, position: s.employeeEditForm.position, department: s.employeeEditForm.department });
      await loadData();
      s.setShowEditEmployeeDialog(false);
      s.setEmployeeToEdit(null);
      alert('Данные сотрудника обновлены!');
    } catch (error) { console.error(error); alert('Не удалось обновить данные сотрудника'); }
  };

  const handleInviteEmployee = async () => {
    if (!s.inviteForm.firstName || !s.inviteForm.lastName || !s.inviteForm.email || !s.inviteForm.password || !s.inviteForm.position || !s.inviteForm.department) { alert('Заполните все обязательные поля'); return; }
    if (s.inviteForm.password.length < 8) { alert('Пароль должен быть минимум 8 символов'); return; }
    if (!s.authToken || !s.currentUser?.company_id) { alert('Ошибка: не найдена информация о компании'); return; }
    s.setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/c6b69066-22c2-4545-bd88-10571ecd9140', {
        method: 'POST', mode: 'cors',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': s.authToken },
        body: JSON.stringify({ action: 'invite_employee', email: s.inviteForm.email, password: s.inviteForm.password, first_name: s.inviteForm.firstName, last_name: s.inviteForm.lastName, position: s.inviteForm.position, department: s.inviteForm.department, company_id: s.currentUser.company_id })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Сотрудник успешно добавлен!');
        s.setShowInviteDialog(false);
        s.setInviteForm({ firstName: '', lastName: '', email: '', password: '', position: '', department: '' });
        await loadData();
      } else { alert(data.error || 'Ошибка создания аккаунта сотрудника'); }
    } catch (error) { console.error(error); alert('Не удалось создать аккаунт сотрудника'); }
    finally { s.setIsAuthLoading(false); }
  };

  const handleVerifyInn = async (inn: string) => {
    if (!inn || inn.length < 10) { s.setInnVerificationState({ isChecking: false, isVerified: false, error: 'ИНН должен содержать 10 или 12 цифр', companyData: null }); return; }
    s.setInnVerificationState({ isChecking: true, isVerified: false, error: null, companyData: null });
    try {
      const response = await fetch('https://functions.poehali.dev/92a2d1b3-cdee-48b2-9883-c3df1bf50f52', {
        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inn })
      });
      const data = await response.json();
      if (response.ok) {
        s.setInnVerificationState({ isChecking: false, isVerified: true, error: null, companyData: data });
        if (data.name?.short && !s.registerForm.companyName) {
          s.setRegisterForm({ ...s.registerForm, companyName: data.name.short });
        }
      } else { s.setInnVerificationState({ isChecking: false, isVerified: false, error: data.error || 'Не удалось проверить ИНН', companyData: null }); }
    } catch { s.setInnVerificationState({ isChecking: false, isVerified: false, error: 'Ошибка соединения с сервисом проверки', companyData: null }); }
  };

  const handleDemoFormSubmit = async () => {
    if (!s.demoForm.companyName || !s.demoForm.name || !s.demoForm.phone || !s.demoForm.email) { alert('Заполните все обязательные поля'); return; }
    s.setDemoFormSubmitting(true);
    try {
      const response = await fetch('https://functions.poehali.dev/f58cb721-86b3-42c5-a5c1-c608cf9ee264', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: s.demoForm.name, email: 'info@i-hunt.ru', message: `ЗАПРОС НА ДЕМОНСТРАЦИЮ\n\nКомпания: ${s.demoForm.companyName}\nИмя: ${s.demoForm.name}\nТелефон: ${s.demoForm.phone}\nПочта: ${s.demoForm.email}\nКоличество сотрудников: ${s.demoForm.employeeCount || 'не указано'}` })
      });
      if (response.ok) {
        s.setShowDemoDialog(false);
        s.setDemoForm({ companyName: '', name: '', phone: '', email: '', employeeCount: '' });
        alert('Заявка на демонстрацию отправлена! Мы свяжемся с вами в ближайшее время.');
      } else { alert('Ошибка при отправке. Попробуйте позже.'); }
    } catch { alert('Не удалось отправить заявку. Проверьте подключение к интернету.'); }
    finally { s.setDemoFormSubmitting(false); }
  };

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!s.contactForm.name || !s.contactForm.email || !s.contactForm.message) { alert('Пожалуйста, заполните все поля'); return; }
    s.setContactFormSubmitting(true);
    s.setContactFormSuccess(false);
    try {
      const response = await fetch('https://functions.poehali.dev/f58cb721-86b3-42c5-a5c1-c608cf9ee264', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: s.contactForm.name, email: s.contactForm.email, message: `${s.contactForm.phone ? `Телефон: ${s.contactForm.phone}\n\n` : ''}${s.contactForm.message}` })
      });
      const data = await response.json();
      if (response.ok) {
        s.setContactFormSuccess(true);
        s.setContactForm({ name: '', email: '', phone: '', message: '' });
        alert('Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.');
      } else { alert('Ошибка при отправке: ' + (data.error || 'Попробуйте позже')); }
    } catch { alert('Не удалось отправить сообщение. Проверьте подключение к интернету.'); }
    finally { s.setContactFormSubmitting(false); }
  };

  const handleRegister = async () => {
    if (!s.registerForm.companyName || !s.registerForm.firstName || !s.registerForm.lastName || !s.registerForm.email || !s.registerForm.password || !s.registerForm.inn) { alert('Заполните все обязательные поля'); return; }
    if (s.registerForm.password.length < 8) { alert('Пароль должен быть минимум 8 символов'); return; }
    if (!s.innVerificationState.isVerified) { alert('Пожалуйста, проверьте ИНН компании перед регистрацией'); return; }
    s.setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/c6b69066-22c2-4545-bd88-10571ecd9140', {
        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email: s.registerForm.email, password: s.registerForm.password, first_name: s.registerForm.firstName, last_name: s.registerForm.lastName, company_name: s.registerForm.companyName, company_inn: s.registerForm.inn || undefined, employee_count: parseInt(s.registerForm.employeeCount) })
      });
      const data = await response.json();
      if (response.ok) {
        s.setShowRegisterDialog(false);
        s.setRegisterForm({ companyName: '', firstName: '', lastName: '', email: '', password: '', inn: '', employeeCount: '50' });
        localStorage.setItem('showOnboarding', 'true');
        if (typeof window.ym === 'function') window.ym(106919720, 'reachGoal', 'registration');
        alert(`Регистрация успешна!\n\nМы отправили письмо с подтверждением на ${s.registerForm.email}.\nПожалуйста, проверьте вашу почту и перейдите по ссылке в письме для активации аккаунта.`);
      } else { alert(data.error || 'Ошибка регистрации'); }
    } catch { alert('Не удалось зарегистрироваться'); }
    finally { s.setIsAuthLoading(false); }
  };

  const handleTgSendLoginCode = async () => {
    s.setTgLoginError('');
    s.setIsTgLoginLoading(true);
    try {
      const r = await fetch('https://functions.poehali.dev/c412b453-2112-4882-aaa5-64d3d6f3a3c6', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_login_session' }) });
      const data = await r.json();
      if (r.ok) {
        s.setTgLoginSession(data.session_token); s.setTgLoginDeepLink(data.deep_link); s.setTgLoginStep('wait');
        window.open(data.deep_link, '_blank');
        if (s.tgLoginPollRef.current) clearInterval(s.tgLoginPollRef.current);
        s.tgLoginPollRef.current = setInterval(async () => {
          try {
            const pr = await fetch('https://functions.poehali.dev/c412b453-2112-4882-aaa5-64d3d6f3a3c6', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_login_session', session_token: data.session_token }) });
            const pd = await pr.json();
            if (pr.status === 410) { clearInterval(s.tgLoginPollRef.current!); s.tgLoginPollRef.current = null; s.setTgLoginError('Сессия истекла. Попробуйте снова.'); s.setTgLoginStep('input'); return; }
            if (pd.status === 'code_sent') { clearInterval(s.tgLoginPollRef.current!); s.tgLoginPollRef.current = null; s.setTgLoginStep('code'); }
          } catch { /* ignore */ }
        }, 2000);
      } else { s.setTgLoginError(data.error || 'Ошибка'); }
    } catch { s.setTgLoginError('Не удалось создать сессию'); }
    finally { s.setIsTgLoginLoading(false); }
  };

  const handleTgVerifyLoginCode = async () => {
    s.setTgLoginError('');
    if (!s.tgLoginCode.trim()) { s.setTgLoginError('Введите код'); return; }
    s.setIsTgLoginLoading(true);
    try {
      const r = await fetch('https://functions.poehali.dev/c412b453-2112-4882-aaa5-64d3d6f3a3c6', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify_login_code', session_token: s.tgLoginSession, code: s.tgLoginCode.trim() }) });
      const data = await r.json();
      if (r.ok) {
        const tgRole: UserRole = data.user?.is_admin ? 'employer' : 'employee';
        localStorage.setItem('authToken', data.token); localStorage.setItem('userRole', tgRole);
        s.setAuthToken(data.token); s.setCurrentUser(data.user); s.setUserRole(tgRole);
        s.setShowLoginDialog(false); s.setTgLoginStep('input'); s.setTgLoginCode('');
        if (typeof window.ym === 'function') window.ym(106919720, 'reachGoal', 'login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else { s.setTgLoginError(data.error || 'Неверный код или аккаунт не найден'); }
    } catch { s.setTgLoginError('Ошибка входа через Telegram'); }
    finally { s.setIsTgLoginLoading(false); }
  };

  const handleMaxSendLoginCode = async () => {
    s.setMaxLoginError('');
    s.setIsMaxLoginLoading(true);
    try {
      const r = await fetch('https://functions.poehali.dev/42b7f6c0-39d7-4274-a41b-2223268f44ce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_login_session' }) });
      const data = await r.json();
      if (r.ok) {
        s.setMaxLoginSession(data.session_token); s.setMaxLoginDeepLink(data.deep_link); s.setMaxLoginStep('wait');
        window.open(data.deep_link, '_blank');
        if (s.maxLoginPollRef.current) clearInterval(s.maxLoginPollRef.current);
        s.maxLoginPollRef.current = setInterval(async () => {
          try {
            const pr = await fetch('https://functions.poehali.dev/42b7f6c0-39d7-4274-a41b-2223268f44ce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_login_session', session_token: data.session_token }) });
            const pd = await pr.json();
            if (pr.status === 410) { clearInterval(s.maxLoginPollRef.current!); s.maxLoginPollRef.current = null; s.setMaxLoginError('Сессия истекла. Попробуйте снова.'); s.setMaxLoginStep('input'); return; }
            if (pd.status === 'code_sent') { clearInterval(s.maxLoginPollRef.current!); s.maxLoginPollRef.current = null; s.setMaxLoginStep('code'); }
          } catch { /* ignore */ }
        }, 2000);
      } else { s.setMaxLoginError(data.error || 'Ошибка'); }
    } catch { s.setMaxLoginError('Не удалось создать сессию'); }
    finally { s.setIsMaxLoginLoading(false); }
  };

  const handleMaxVerifyLoginCode = async () => {
    s.setMaxLoginError('');
    if (!s.maxLoginCode.trim()) { s.setMaxLoginError('Введите код'); return; }
    s.setIsMaxLoginLoading(true);
    try {
      const r = await fetch('https://functions.poehali.dev/42b7f6c0-39d7-4274-a41b-2223268f44ce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify_login_code', session_token: s.maxLoginSession, code: s.maxLoginCode.trim() }) });
      const data = await r.json();
      if (r.ok) {
        const maxRole: UserRole = data.user?.is_admin ? 'employer' : 'employee';
        localStorage.setItem('authToken', data.token); localStorage.setItem('userRole', maxRole);
        s.setAuthToken(data.token); s.setCurrentUser(data.user); s.setUserRole(maxRole);
        s.setShowLoginDialog(false); s.setMaxLoginSession(''); s.setMaxLoginCode(''); s.setMaxLoginStep('input');
        if (typeof window.ym === 'function') window.ym(106919720, 'reachGoal', 'login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else { s.setMaxLoginError(data.error || 'Неверный код'); }
    } catch { s.setMaxLoginError('Ошибка входа'); }
    finally { s.setIsMaxLoginLoading(false); }
  };

  const handleLogin = async () => {
    if (!s.loginForm.email || !s.loginForm.password) { alert('Введите email и пароль'); return; }
    s.setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/c6b69066-22c2-4545-bd88-10571ecd9140', {
        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: s.loginForm.email.trim().toLowerCase(), password: s.loginForm.password, userType: s.loginType })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        const role = (data.user.role === 'admin' || data.user.is_admin) ? 'employer' : 'employee';
        localStorage.setItem('userRole', role);
        s.setAuthToken(data.token); s.setCurrentUser(data.user); s.setUserRole(role);
        s.setShowLoginDialog(false); s.setLoginForm({ email: '', password: '' });
        if (typeof window.ym === 'function') window.ym(106919720, 'reachGoal', 'login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (response.status === 403) {
        s.setResendVerificationEmail(s.loginForm.email);
        alert('Email не подтверждён!\n\nМы отправили письмо с подтверждением на вашу почту при регистрации.\nПожалуйста, проверьте почту (в том числе папку "Спам") и перейдите по ссылке в письме для активации аккаунта.');
      } else if (response.status === 401) {
        alert('Неверный email или пароль. Проверьте данные и попробуйте снова.');
      } else { alert(data.error || 'Не удалось войти. Попробуйте ещё раз.'); }
    } catch { alert('Не удалось войти в систему'); }
    finally { s.setIsAuthLoading(false); }
  };

  const handleResendVerification = async () => {
    if (!s.resendVerificationEmail) { alert('Email не найден'); return; }
    if (s.resendVerificationTimer > 0) { alert(`Подождите ${s.resendVerificationTimer} секунд перед повторной отправкой`); return; }
    s.setIsResendingVerification(true);
    try {
      const response = await fetch('https://functions.poehali.dev/c6b69066-22c2-4545-bd88-10571ecd9140', {
        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend_verification', email: s.resendVerificationEmail })
      });
      const data = await response.json();
      if (response.ok) {
        s.setResendVerificationTimer(30);
        alert('Письмо с подтверждением отправлено повторно!\n\nПроверьте вашу почту (в том числе папку "Спам").');
      } else { alert(data.error || 'Не удалось отправить письмо'); }
    } catch { alert('Не удалось отправить письмо с подтверждением'); }
    finally { s.setIsResendingVerification(false); }
  };

  const handleRequestPasswordReset = async () => {
    if (!s.forgotPasswordEmail.trim()) { alert('Введите email'); return; }
    s.setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/edea8e05-e989-4719-81d8-5c546d5ff771', {
        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: s.forgotPasswordEmail })
      });
      const data = await response.json();
      s.setPasswordResetMessage(response.ok ? 'Если email существует, на него отправлена ссылка для восстановления пароля' : (data.error || 'Произошла ошибка'));
    } catch { s.setPasswordResetMessage('Не удалось отправить запрос'); }
    finally { s.setIsAuthLoading(false); }
  };

  const handleResetPassword = async () => {
    if (s.resetPasswordForm.password !== s.resetPasswordForm.confirmPassword) { s.setPasswordResetMessage('Пароли не совпадают'); return; }
    if (s.resetPasswordForm.password.length < 6) { s.setPasswordResetMessage('Пароль должен содержать минимум 6 символов'); return; }
    s.setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/fccc90bf-440b-44ed-95d7-cae0af39adfe', {
        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: s.resetPasswordForm.token, password: s.resetPasswordForm.password })
      });
      const data = await response.json();
      if (response.ok) {
        s.setPasswordResetMessage('Пароль успешно изменен! Теперь вы можете войти с новым паролем.');
        setTimeout(() => { s.setShowResetPasswordDialog(false); s.setShowLoginDialog(true); s.setResetPasswordForm({ token: '', password: '', confirmPassword: '' }); s.setPasswordResetMessage(''); }, 2000);
      } else { s.setPasswordResetMessage(data.error || 'Произошла ошибка'); }
    } catch { s.setPasswordResetMessage('Не удалось изменить пароль'); }
    finally { s.setIsAuthLoading(false); }
  };

  const handleCreateNews = async () => {
    if (!s.newsForm.title || !s.newsForm.content) { alert('Заполните все поля'); return; }
    try {
      const r = await fetch('https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', company_id: s.currentCompanyId, author_id: s.currentUser?.id, title: s.newsForm.title, content: s.newsForm.content, category: s.newsForm.category })
      });
      if (r.ok) { s.setNewsForm({ title: '', content: '', category: 'news' }); s.setShowCreateNewsDialog(false); loadData(true); }
      else { const d = await r.json(); alert(d.error || 'Ошибка публикации'); }
    } catch { alert('Ошибка соединения'); }
  };

  const handleUpdateNews = async () => {
    if (!s.newsToEdit || !s.newsForm.title || !s.newsForm.content) { alert('Заполните все поля'); return; }
    try {
      const r = await fetch('https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', news_id: s.newsToEdit.id, title: s.newsForm.title, content: s.newsForm.content, category: s.newsForm.category })
      });
      if (r.ok) { s.setNewsForm({ title: '', content: '', category: 'news' }); s.setShowEditNewsDialog(false); s.setNewsToEdit(null); loadData(true); }
    } catch { alert('Ошибка обновления'); }
  };

  const handleDeleteNews = async (id: number) => {
    try { await fetch('https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', news_id: id }) }); loadData(true); }
    catch { alert('Ошибка удаления'); }
  };

  const handleArchiveNews = async (id: number, isArchived: boolean) => {
    try { await fetch('https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'archive', news_id: id, is_archived: isArchived }) }); loadData(true); }
    catch { alert('Ошибка архивирования'); }
  };

  const handleLikeNews = async (newsId: number) => {
    try {
      const r = await fetch('https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'like', news_id: newsId, user_id: s.currentUser?.id }) });
      if (r.ok) { const d = await r.json(); s.setNewsPosts(s.newsPosts.map(post => post.id === newsId ? { ...post, likes: d.likes } : post)); }
    } catch { /* ignore */ }
  };

  const handleAddComment = async () => {
    if (!s.activeNewsPost || !s.newComment.trim()) { alert('Напишите комментарий'); return; }
    try {
      const r = await fetch('https://functions.poehali.dev/fad87b35-32bf-4090-9a18-d8ecce13f24a?resource=news', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment', news_id: s.activeNewsPost.id, author_id: s.currentUser?.id, author_name: s.currentUser ? `${s.currentUser.first_name} ${s.currentUser.last_name}` : 'Сотрудник', text: s.newComment })
      });
      if (r.ok) {
        const c = await r.json();
        const comment: NewsComment = { id: c.id, newsId: s.activeNewsPost.id, authorName: c.author_name, comment: c.text, date: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '' };
        s.setNewsPosts(s.newsPosts.map(post => post.id === s.activeNewsPost!.id ? { ...post, comments: [...post.comments, comment] } : post));
        s.setNewComment('');
        s.setActiveNewsPost({ ...s.activeNewsPost, comments: [...s.activeNewsPost.comments, comment] });
      }
    } catch { alert('Ошибка комментария'); }
  };

  const handleDeleteComment = (commentId: number) => {
    if (!s.activeNewsPost) return;
    s.setNewsPosts(s.newsPosts.map(post => post.id === s.activeNewsPost!.id ? { ...post, comments: post.comments.filter(c => c.id !== commentId) } : post));
    s.setActiveNewsPost({ ...s.activeNewsPost, comments: s.activeNewsPost.comments.filter(c => c.id !== commentId) });
  };

  const handleUpdateEmployeeRoles = async () => {
    if (!s.employeeToEditRoles) return;
    try {
      await api.updateEmployeeRole(s.employeeToEditRoles.id, undefined, s.rolesForm.isAdmin);
      await loadData();
      if (s.employeeToEditRoles.id === s.currentEmployeeId) {
        const newRole: UserRole = s.rolesForm.isAdmin ? 'employer' : 'employee';
        s.setUserRole(newRole);
        localStorage.setItem('userRole', newRole);
        s.setCurrentUser((prev: unknown) => ({ ...(prev as object), is_admin: s.rolesForm.isAdmin, role: s.rolesForm.isAdmin ? 'admin' : 'employee' }));
      }
      s.setShowEditRolesDialog(false); s.setEmployeeToEditRoles(null);
      alert('Права сотрудника обновлены!');
    } catch (error) { console.error(error); alert('Не удалось обновить права сотрудника'); }
  };

  const handleToggleFired = async (employee: Employee) => {
    const action = employee.isFired ? 'восстановить' : 'уволить';
    if (!confirm(`Вы уверены, что хотите ${action} сотрудника ${employee.name}?`)) return;
    try { await api.updateEmployeeFired(employee.id, !employee.isFired); await loadData(); }
    catch (error) { console.error(error); alert('Не удалось изменить статус сотрудника'); }
  };

  return {
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
    MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES,
  };
}