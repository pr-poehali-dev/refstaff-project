export const PARTNER_URL = 'https://functions.poehali.dev/4c894112-f90d-46f8-8aeb-d2f35aeee15e';
export const APP_URL = 'https://i-hunt.ru';

export interface Partner {
  id: number;
  name: string;
  email: string;
  phone: string;
  partner_code: string;
  balance: number;
  total_earned: number;
  clients_invited: number;
  clients_registered: number;
  status: string;
  created_at: string;
  payment_method?: string;
  payment_details?: string;
  inn?: string;
  company_name?: string;
  notes?: string;
}

export interface Referral {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  source: string;
  created_at: string;
  commission_amount: number;
  commission_available_at: string | null;
  commission_available: boolean;
  hold_days_left: number | null;
  subscription_tier: string | null;
  subscription_expires_at: string | null;
  paid_months_count: number;
  total_commission_earned: number;
}

export interface Payout {
  id: number;
  amount: number;
  payment_method: string;
  payment_details: string;
  status: string;
  admin_comment: string;
  created_at: string;
}

export type AuthStep = 'choose' | 'messenger_wait' | 'enter_otp' | 'fill_profile';
export type Messenger = 'telegram' | 'max';

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  invited:    { label: 'Приглашён',        color: 'bg-gray-100 text-gray-700' },
  registered: { label: 'Зарегистрирован',  color: 'bg-blue-100 text-blue-800' },
  subscribed: { label: 'Оплатил',          color: 'bg-green-100 text-green-800' },
  churned:    { label: 'Ушёл',             color: 'bg-red-100 text-red-800' },
};

export const TIER_LABELS: Record<string, string> = {
  trial:    'Пробный',
  advanced: '1 месяц',
  pro:      '1 год',
  basic:    'Базовый',
};

export const PAYOUT_STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'На рассмотрении', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Одобрено',        color: 'bg-blue-100 text-blue-800' },
  paid:     { label: 'Выплачено',       color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Отклонено',       color: 'bg-red-100 text-red-800' },
};
