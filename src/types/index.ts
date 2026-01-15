export type UserRole = 'guest' | 'employer' | 'employee';

export interface Vacancy {
  id: number;
  title: string;
  department: string;
  salary: string;
  status: 'active' | 'closed' | 'archived';
  recommendations: number;
  reward: number;
  payoutDelayDays: number;
  referralLink?: string;
  city?: string;
  isRemote?: boolean;
}

export interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  avatar: string;
  recommendations: number;
  hired: number;
  earnings: number;
  level: number;
  isHrManager?: boolean;
  isAdmin?: boolean;
  email?: string;
  phone?: string;
  telegram?: string;
  vk?: string;
}

export interface Recommendation {
  id: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  vacancy: string;
  vacancyTitle?: string;
  status: 'pending' | 'interview' | 'hired' | 'rejected';
  date: string;
  reward: number;
  recommendedBy?: string;
  employeeId?: number;
  comment?: string;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  message: string;
  timestamp: string;
  isOwn: boolean;
}

export interface NewsPost {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  category: 'news' | 'achievement' | 'announcement' | 'blog';
  likes: number;
  comments: NewsComment[];
}

export interface NewsComment {
  id: number;
  newsId: number;
  authorName: string;
  authorAvatar?: string;
  comment: string;
  date: string;
}

export interface PayoutRequest {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  paymentMethod?: string;
  paymentDetails?: string;
  adminComment?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  candidateName?: string;
  candidateEmail?: string;
  vacancyTitle?: string;
  recommendationId?: number;
}