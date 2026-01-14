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
}

export interface Recommendation {
  id: number;
  candidateName: string;
  vacancy: string;
  status: 'pending' | 'accepted' | 'rejected';
  date: string;
  reward: number;
  recommendedBy?: string;
  recommendedById?: number;
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