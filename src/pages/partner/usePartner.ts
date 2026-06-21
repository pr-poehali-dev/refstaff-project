import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  PARTNER_URL, APP_URL,
  Partner, Referral, Payout,
  AuthStep, Messenger,
} from './partnerTypes';

export function usePartner() {
  const { toast } = useToast();

  // Данные партнёра
  const [partner, setPartner] = useState<Partner | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth flow
  const [authStep, setAuthStep] = useState<AuthStep>('choose');
  const [messenger, setMessenger] = useState<Messenger>('telegram');
  const [sessionToken, setSessionToken] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingChatId, setPendingChatId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Формы
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [editProfile, setEditProfile] = useState({
    name: '', email: '', phone: '',
    payment_method: '', payment_details: '',
    inn: '', company_name: '', notes: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [referralForm, setReferralForm] = useState({ company_name: '', contact_name: '', contact_email: '', contact_phone: '' });
  const [payoutForm, setPayoutForm] = useState({ amount: '', payment_method: '', payment_details: '' });

  const savedCode = localStorage.getItem('partner_code');

  const apiCall = async (action: string, method = 'GET', body?: object, token?: string) => {
    const url = token
      ? `${PARTNER_URL}?action=${action}&pt=${encodeURIComponent(token)}`
      : `${PARTNER_URL}?action=${action}`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  };

  const loadPartnerData = async (code: string) => {
    setLoading(true);
    try {
      const [profileData, referralsData, payoutsData] = await Promise.all([
        apiCall('profile', 'GET', undefined, code),
        apiCall('referrals', 'GET', undefined, code),
        apiCall('payouts', 'GET', undefined, code),
      ]);
      if (profileData.error) {
        localStorage.removeItem('partner_code');
        setPartner(null);
      } else {
        setPartner(profileData);
        setEditProfile({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          payment_method: profileData.payment_method || '',
          payment_details: profileData.payment_details || '',
          inn: profileData.inn || '',
          company_name: profileData.company_name || '',
          notes: profileData.notes || '',
        });
        setReferrals(Array.isArray(referralsData) ? referralsData : []);
        setPayouts(Array.isArray(payoutsData) ? payoutsData : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (savedCode) {
      loadPartnerData(savedCode);
    } else {
      setLoading(false);
      const savedSession = localStorage.getItem('partner_session_token');
      const savedMessenger = localStorage.getItem('partner_session_messenger') as Messenger | null;
      if (savedSession) {
        setSessionToken(savedSession);
        if (savedMessenger) setMessenger(savedMessenger);
        apiCall('check_login_session', 'POST', { session_token: savedSession }).then(s => {
          if (s.status === 'code_sent' || s.status === 'verified') {
            setAuthStep('enter_otp');
          }
        });
      }
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendToMessenger = async (selectedMessenger: Messenger) => {
    setMessenger(selectedMessenger);
    setSubmitting(true);
    try {
      const data = await apiCall('create_login_session', 'POST', { messenger: selectedMessenger });
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        localStorage.setItem('partner_session_token', data.session_token);
        localStorage.setItem('partner_session_messenger', selectedMessenger);
        setSessionToken(data.session_token);
        setOtp('');
        setDeepLink(data.deep_link);
        setAuthStep('messenger_wait');
        window.open(data.deep_link, '_blank');
        pollRef.current = setInterval(async () => {
          const s = await apiCall('check_login_session', 'POST', { session_token: data.session_token });
          if (s.status === 'code_sent') {
            clearInterval(pollRef.current!);
            setAuthStep('enter_otp');
          }
        }, 2000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    const token = sessionToken || localStorage.getItem('partner_session_token') || '';
    if (!token) {
      toast({ title: 'Сессия не найдена, начните вход заново', variant: 'destructive' });
      setAuthStep('choose');
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiCall('verify_login_code', 'POST', { session_token: token, code: otp.trim() });
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else if (data.need_registration) {
        setPendingChatId(data.chat_id);
        setAuthStep('fill_profile');
      } else if (data.partner_code) {
        localStorage.setItem('partner_code', data.partner_code);
        localStorage.removeItem('partner_session_token');
        localStorage.removeItem('partner_session_messenger');
        await loadPartnerData(data.partner_code);
        setAuthStep('choose');
      } else {
        toast({ title: 'Ошибка входа, попробуйте снова', variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!profileForm.name) {
      toast({ title: 'Укажите ваше имя', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiCall('complete_registration', 'POST', {
        session_token: sessionToken,
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        messenger,
        chat_id: pendingChatId,
      });
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else if (data.partner_code) {
        localStorage.setItem('partner_code', data.partner_code);
        await loadPartnerData(data.partner_code);
        setAuthStep('choose');
        toast({ title: 'Добро пожаловать в партнёрскую программу!' });
      } else {
        toast({ title: 'Что-то пошло не так, попробуйте снова', variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReferral = async () => {
    if (!referralForm.company_name) {
      toast({ title: 'Укажите название компании', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiCall('add_referral', 'POST', { ...referralForm, source: 'link' }, savedCode!);
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Клиент добавлен!' });
        setShowAddReferral(false);
        setReferralForm({ company_name: '', contact_name: '', contact_email: '', contact_phone: '' });
        loadPartnerData(savedCode!);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutForm.amount);
    if (!amount || amount <= 0) {
      toast({ title: 'Укажите корректную сумму', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiCall('request_payout', 'POST', {
        amount,
        payment_method: payoutForm.payment_method,
        payment_details: payoutForm.payment_details,
      }, savedCode!);
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Запрос на выплату отправлен!' });
        setShowPayout(false);
        setPayoutForm({ amount: '', payment_method: '', payment_details: '' });
        loadPartnerData(savedCode!);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const data = await apiCall('update_profile', 'POST', editProfile, savedCode!);
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Профиль сохранён!' });
        loadPartnerData(savedCode!);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} скопирован!` });
  };

  const logout = () => {
    localStorage.removeItem('partner_code');
    setPartner(null);
    setReferrals([]);
    setPayouts([]);
    setAuthStep('choose');
  };

  const referralLink = partner ? `${APP_URL}/?ref=${partner.partner_code}` : '';

  return {
    // Данные
    partner, referrals, payouts, loading, referralLink,
    // Auth
    authStep, setAuthStep, messenger, setMessenger,
    sessionToken, deepLink, otp, setOtp,
    pendingChatId, submitting,
    // Формы
    profileForm, setProfileForm,
    editProfile, setEditProfile, savingProfile,
    showAddReferral, setShowAddReferral,
    showPayout, setShowPayout,
    referralForm, setReferralForm,
    payoutForm, setPayoutForm,
    // Действия
    handleSendToMessenger, handleVerifyOtp, handleCompleteRegistration,
    handleAddReferral, handleRequestPayout, handleSaveProfile,
    copyToClipboard, logout,
    loadPartnerData,
  };
}
