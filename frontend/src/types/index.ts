// src/types/index.ts

export type UserRole = 'student' | 'faculty' | 'lab_assistant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rollNumber?: string;
  department?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type SubmissionStatus =
  | 'draft'
  | 'ai_triage'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'blocked';

export type RiskLevel = 'clean' | 'flagged' | 'blocked';

export type ContentCategory =
  | 'technical'
  | 'sports'
  | 'cultural'
  | 'academic'
  | 'achievements'
  | 'department';

export interface AIAnalysis {
  grammarScore: number;
  toneScore: number;
  correctedText?: string;
  diffSummary?: string;
  shortSummary?: string;
  teaserParagraph?: string;
  suggestedCategory?: ContentCategory;
  riskLevel: RiskLevel;
  riskScore: number;
  flaggedKeywords?: string[];
}

export interface Submission {
  _id: string;
  title: string;
  content: string;
  category: ContentCategory;
  status: SubmissionStatus;
  authorId: string;
  authorName: string;
  authorRoll: string;
  department: string;
  attachments: Attachment[];
  aiAnalysis?: AIAnalysis;
  facultyComment?: string;
  version: number;
  chosenTemplate?: ArticleTemplate;
  labOverrideTemplate?: ArticleTemplate | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedAt: string;
}

export type ArticleTemplate =
  | 'two_column'
  | 'single_column'
  | 'photo_left'
  | 'photo_right'
  | 'full_bleed'
  | 'pull_quote_hero';

export interface TemplateConfig {
  _id: string;
  name: string;
  description: string;
  thumbnail: string;
  layout: 'two_column' | 'single_column' | 'gallery' | 'cover' | 'achievement';
  sections: TemplateSection[];
}

export interface TemplateSection {
  id: string;
  type: 'text' | 'image' | 'heading' | 'pull_quote' | 'gallery';
  title: string;
  order: number;
}

export interface MagazineEdition {
  id: string;
  title: string;
  year: number;
  deadline: string;
  status: 'collecting' | 'reviewing' | 'generating' | 'published';
  totalSubmissions: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  ipAddress?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'approved' | 'flagged' | 'rejected' | 'comment' | 'system';
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
