const API_URL = 'https://functions.poehali.dev/30d9dba4-a499-4866-8ccc-ea7addf62b16';

export interface Vacancy {
  id: number;
  title: string;
  department: string;
  salary_display: string;
  requirements?: string;
  description?: string;
  status: 'active' | 'closed';
  reward_amount: number;
  payout_delay_days?: number;
  referral_token?: string;
  recommendations_count?: number;
  created_at: string;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  level: number;
  experience_points: number;
  total_recommendations: number;
  successful_hires: number;
  total_earnings: number;
  avatar_url?: string;
}

export interface Recommendation {
  id: number;
  vacancy_id: number;
  vacancy_title?: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  comment?: string;
  status: 'pending' | 'accepted' | 'rejected';
  reward_amount: number;
  recommended_by?: number;
  recommended_by_name?: string;
  created_at: string;
}

export interface CompanyStats {
  total_recommendations: number;
  accepted_candidates: number;
  total_bonuses: number;
  active_vacancies: number;
  total_employees: number;
}

export interface Company {
  id: number;
  name: string;
  employee_count: number;
  invite_token: string;
  logo_url?: string;
  description?: string;
  website?: string;
  industry?: string;
  created_at: string;
}

export interface Wallet {
  wallet_balance: number;
  wallet_pending: number;
}

export interface WalletTransaction {
  id: number;
  amount: number;
  type: string;
  description?: string;
  created_at: string;
}

export interface PendingPayout {
  id: number;
  amount: number;
  unlock_date: string;
  status: string;
}

export interface WalletData {
  wallet: Wallet;
  transactions: WalletTransaction[];
  pending_payouts: PendingPayout[];
}

export interface Chat {
  id: number;
  company_id: number;
  employee_id: number;
  last_message_at?: string;
  employee_name?: string;
  company_name?: string;
  position?: string;
  avatar_url?: string;
  unread_count: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  sender_id: number;
  sender_name?: string;
  sender_avatar?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const api = {
  async getVacancies(companyId: number = 1, status: string = 'active'): Promise<Vacancy[]> {
    const response = await fetch(`${API_URL}/?resource=vacancies&company_id=${companyId}&status=${status}`);
    if (!response.ok) throw new Error('Failed to fetch vacancies');
    return response.json();
  },

  async createVacancy(data: Partial<Vacancy>): Promise<Vacancy> {
    const response = await fetch(`${API_URL}/?resource=vacancies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create vacancy');
    return response.json();
  },

  async getEmployees(companyId: number = 1): Promise<Employee[]> {
    const response = await fetch(`${API_URL}/?resource=employees&company_id=${companyId}`);
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
  },

  async getRecommendations(companyId: number = 1, status?: string, userId?: number): Promise<Recommendation[]> {
    let url = `${API_URL}/?resource=recommendations&company_id=${companyId}`;
    if (status) url += `&status=${status}`;
    if (userId) url += `&user_id=${userId}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch recommendations');
    return response.json();
  },

  async createRecommendation(data: Partial<Recommendation>): Promise<Recommendation> {
    const response = await fetch(`${API_URL}/?resource=recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create recommendation');
    return response.json();
  },

  async updateRecommendationStatus(id: number, status: string): Promise<Recommendation> {
    const response = await fetch(`${API_URL}/?resource=recommendations&action=status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    if (!response.ok) throw new Error('Failed to update recommendation');
    return response.json();
  },

  async getStats(companyId: number = 1): Promise<CompanyStats> {
    const response = await fetch(`${API_URL}/?resource=stats&company_id=${companyId}`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  async getCompany(companyId: number = 1): Promise<Company> {
    const response = await fetch(`${API_URL}/?resource=company&company_id=${companyId}`);
    if (!response.ok) throw new Error('Failed to fetch company');
    return response.json();
  },

  async updateCompany(companyId: number, data: Partial<Company>): Promise<Company> {
    const response = await fetch(`${API_URL}/?resource=company`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, ...data })
    });
    if (!response.ok) throw new Error('Failed to update company');
    return response.json();
  },

  async registerEmployee(inviteToken: string, data: { email: string; first_name: string; last_name: string; position?: string; department?: string }): Promise<Employee> {
    const response = await fetch(`${API_URL}/?resource=employees&action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_token: inviteToken, ...data })
    });
    if (!response.ok) throw new Error('Failed to register employee');
    return response.json();
  },

  async updateEmployeeRole(userId: number, isHrManager?: boolean, isAdmin?: boolean): Promise<Employee> {
    const response = await fetch(`${API_URL}/?resource=employees&action=role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_hr_manager: isHrManager, is_admin: isAdmin })
    });
    if (!response.ok) throw new Error('Failed to update employee role');
    return response.json();
  },

  async getWallet(userId: number): Promise<WalletData> {
    const response = await fetch(`${API_URL}/?resource=wallet&user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch wallet');
    return response.json();
  },

  async createChat(companyId: number, employeeId: number): Promise<Chat> {
    const response = await fetch(`${API_URL}/?resource=chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, employee_id: employeeId })
    });
    if (!response.ok) throw new Error('Failed to create chat');
    return response.json();
  },

  async getChats(userId: number, companyId?: number): Promise<Chat[]> {
    let url = `${API_URL}/?resource=chats&user_id=${userId}`;
    if (companyId) url += `&company_id=${companyId}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch chats');
    return response.json();
  },

  async sendMessage(chatId: number, senderId: number, message: string): Promise<ChatMessage> {
    const response = await fetch(`${API_URL}/?resource=messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, sender_id: senderId, message })
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  async getMessages(chatId: number): Promise<ChatMessage[]> {
    const response = await fetch(`${API_URL}/?resource=messages&chat_id=${chatId}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  }
};