// Shared TypeScript types for StudentLife AI

export interface User {
  id: string;
  cognito_id?: string;
  email: string;
  full_name: string;
  major?: string;
  year?: number;
  interests?: string[];
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  course_code: string;
  course_name: string;
  department?: string;
  credits?: number;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type?: 'workshop' | 'social' | 'academic' | 'sports';
  location?: string;
  start_time: string;
  end_time: string;
  organizer_id?: string;
  max_attendees?: number;
  tags?: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
  rsvp_count?: number;
  user_rsvp_status?: 'attending' | 'maybe' | 'cancelled';
}

export interface Resource {
  id: string;
  course_id: string;
  uploader_id?: string;
  title: string;
  description?: string;
  resource_type?: 'notes' | 'slides' | 'project' | 'guide';
  file_url: string;
  file_size?: number;
  ai_summary?: string;
  rating_avg?: number;
  rating_count?: number;
  download_count?: number;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category?: 'food' | 'transport' | 'books' | 'entertainment' | 'housing';
  description?: string;
  transaction_date: string;
  payment_method?: string;
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  course_id?: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  intensity?: 'low' | 'medium' | 'high';
  notes?: string;
  created_at: string;
  course?: Course;
}

export interface Assignment {
  id: string;
  user_id: string;
  course_id?: string;
  title: string;
  description?: string;
  due_date: string;
  estimated_hours?: number;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface Budget {
  id: string;
  user_id: string;
  month: number;
  year: number;
  category: string;
  planned_amount: number;
  spent_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'event' | 'resource' | 'burnout' | 'budget';
  title: string;
  message?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  context_data?: any;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// WebSocket event types
export interface SocketEvent {
  type: 'event_created' | 'resource_uploaded' | 'notification' | 'expense_added' | 'burnout_alert';
  data: any;
  timestamp: string;
}

// AI Request/Response types
export interface AIRecommendationRequest {
  user_id: string;
  type: 'events' | 'resources' | 'study_plan' | 'budget';
  context?: any;
}

export interface AIRecommendationResponse {
  recommendations: any[];
  reasoning?: string;
}

export interface AIChatRequest {
  user_id: string;
  message: string;
  context?: {
    events?: Event[];
    resources?: Resource[];
    expenses?: Expense[];
    study_sessions?: StudySession[];
  };
}

export interface AIChatResponse {
  message: string;
  suggestions?: string[];
}

// Burnout Analysis types
export interface BurnoutMetrics {
  user_id: string;
  workload_score: number; // 0-100
  stress_level: 'low' | 'medium' | 'high' | 'critical';
  study_hours_week: number;
  upcoming_deadlines: number;
  recommended_break_hours: number;
  insights: string[];
}

// Expense Analytics types
export interface ExpenseAnalytics {
  user_id: string;
  month: number;
  year: number;
  total_spent: number;
  by_category: Record<string, number>;
  predicted_monthly: number;
  budget_status: 'under' | 'on_track' | 'over';
  alerts: string[];
}
