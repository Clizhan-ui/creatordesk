export type UserRole = 'admin' | 'creator';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  bio?: string | null;
  avatar_url?: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export type IdeaStatus = 'New Idea' | 'Planned' | 'In Production' | 'Completed';

export interface ContentIdea {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  category: string;
  platform: string;
  status: IdeaStatus;
  created_at: string;
  updated_at: string;
}

export type PlanStatus = 'Planned' | 'In Production' | 'Ready' | 'Published';

export interface ContentPlan {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  platform: string;
  category: string;
  scheduled_at: string;
  status: PlanStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type ContentStatus = 'Draft' | 'In Production' | 'Scheduled' | 'Published';

export interface ContentItem {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  platform: string;
  category: string;
  content_url?: string | null;
  published_at?: string | null;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  // Aggregated analytics if joined
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

export interface ContentAnalytics {
  id: number;
  content_id: number;
  user_id: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  followers_count: number;
  recorded_at: string;
  created_at: string;
  content_title?: string;
  platform?: string;
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string | null;
}

export interface DashboardStats {
  totalContent: number;
  publishedContent: number;
  inProductionContent: number;
  totalIdeas: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  platformBreakdown: { platform: string; count: number; views: number }[];
  statusBreakdown: { status: string; count: number }[];
  upcomingSchedules: ContentPlan[];
  recentPerformances: ContentItem[];
  performanceTrend: { date: string; views: number; engagement: number }[];
}
