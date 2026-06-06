export const ADMIN_URL = 'https://functions.poehali.dev/89a9ad66-d40d-42cf-bc67-de5c6f29af53';

export async function adminFetch(secret: string, path: string, method = 'GET', body?: object) {
  const res = await fetch(`${ADMIN_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return res.json();
}

export interface Analytics {
  companies_total: number;
  users_total: number;
  vacancies_total: number;
  recommendations_total: number;
  hired_total: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  registrations_by_day: { date: string; count: number }[];
}

export interface Company {
  id: number;
  name: string;
  inn?: string;
  subscription_tier?: string;
  subscription_expires_at?: string;
  created_at: string;
  users_count: number;
  vacancies_count: number;
  recommendations_count: number;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  position?: string;
  is_admin: boolean;
  is_fired: boolean;
  total_recommendations: number;
  successful_hires: number;
  total_earnings: number;
  wallet_balance: number;
  wallet_pending: number;
  created_at: string;
  company_name?: string;
}

export function daysLeft(dateStr?: string) {
  if (!dateStr) return -999;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
