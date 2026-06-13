import { useState, useEffect } from 'react';
import type { UserRole } from '@/types';

interface ResetPasswordForm {
  token: string;
  password: string;
  confirmPassword: string;
}

export function useAuth() {
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const saved = localStorage.getItem('userRole');
      return (saved as UserRole) || 'guest';
    }
    return 'guest';
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [isVerifying, setIsVerifying] = useState<boolean>(() => !!localStorage.getItem('authToken'));
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState<ResetPasswordForm>({ token: '', password: '', confirmPassword: '' });

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из системы?')) {
      localStorage.removeItem('userRole');
      localStorage.removeItem('authToken');
      localStorage.removeItem('showOnboarding');
      localStorage.removeItem('onboarding_completed');
      setUserRole('guest');
      setAuthToken(null);
      setCurrentUser(null);
      setShowOnboarding(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const verifyToken = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/c6b69066-22c2-4545-bd88-10571ecd9140', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'X-Auth-Token': authToken || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        const newRole: UserRole = data.user?.is_admin ? 'employer' : 'employee';
        setUserRole(newRole);
        localStorage.setItem('userRole', newRole);
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      handleLogout();
    } finally {
      setIsVerifying(false);
    }
  };

  // useEffect #1 — save userRole to localStorage
  useEffect(() => {
    if (userRole !== 'guest') {
      localStorage.setItem('userRole', userRole);
    }
  }, [userRole]);

  // useEffect #3 — initial token verification + URL params
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

    // Редирект после подтверждения email — скроллим вверх к ЛК
    const verified = urlParams.get('verified');
    if (verified === '1') {
      window.history.replaceState({}, document.title, window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    userRole, setUserRole,
    currentUser, setCurrentUser,
    authToken, setAuthToken,
    isVerifying, setIsVerifying,
    showOnboarding, setShowOnboarding,
    showResetPasswordDialog, setShowResetPasswordDialog,
    resetPasswordForm, setResetPasswordForm,
    handleLogout,
  };
}