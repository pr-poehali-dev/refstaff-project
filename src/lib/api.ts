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
  }
};
