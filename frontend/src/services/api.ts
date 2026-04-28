// src/services/api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  User,
  Submission,
  SubmissionStatus,
  Notification,
  TemplateConfig,
} from '../types';

// ── Axios instance with base config ──
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── JWT interceptor: attach token to every request ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-logout on 401 ──
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Error message extractor ──
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (data?.message && typeof data.message === 'string') return data.message;
    if (data?.error && typeof data.error === 'string') return data.error;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

// ── Auth Service ──
export const authService = {
  login: (email: string, password: string, role?: string) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, password, role }),

  register: (data: { name: string; email: string; password: string; role: string; rollNumber?: string; department?: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data),

  verify: () =>
    api.get<ApiResponse<{ user: User }>>('/auth/verify'),

  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),
};

// ── Submission Service ──
export const submissionService = {
  getAll: (params?: { page?: number; limit?: number; status?: string; category?: string; search?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Submission>>>('/submissions', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Submission>>(`/submissions/${id}`),

  create: (formData: FormData) =>
    api.post<ApiResponse<Submission>>('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: Partial<Submission>) =>
    api.patch<ApiResponse<Submission>>(`/submissions/${id}`, data),

  updateStatus: (id: string, status: SubmissionStatus, comment?: string) =>
    api.patch<ApiResponse<Submission>>(`/submissions/${id}/status`, { status, comment }),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/submissions/${id}`),

  getStats: () =>
    api.get<ApiResponse<{
      total: number;
      approved: number;
      needsReview: number;
      rejected: number;
      blocked: number;
      avgGrammarScore: number;
      avgToneScore: number;
    }>>('/submissions/stats'),

  setLabTemplate: (id: string, templateId: string) =>
    api.patch<ApiResponse<Submission>>(`/submissions/${id}/template`, { templateId }),
};

// ── User Service ──
export const userService = {
  getAll: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    api.get<ApiResponse<PaginatedResponse<User>>>('/users', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<User>>(`/users/${id}`),

  update: (id: string, data: Partial<User>) =>
    api.patch<ApiResponse<User>>(`/users/${id}`, data),

  deactivate: (id: string) =>
    api.patch<ApiResponse<User>>(`/users/${id}`, { isActive: false }),

  create: (data: { name: string; email: string; password: string; role: string; rollNumber?: string; department?: string }) =>
    api.post<ApiResponse<User>>('/auth/register', data),

  createFaculty: (data: { name: string; email: string; password: string; department: string }) =>
    api.post<ApiResponse<User>>('/users/create-faculty', data),
};

// ── Notification Service ──
export const notificationService = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications', { params }),

  markRead: (id: string) =>
    api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<ApiResponse<null>>('/notifications/read-all'),
};

// ── Template Service ──
export const templateService = {
  getAll: () =>
    api.get<ApiResponse<TemplateConfig[]>>('/templates'),

  getById: (id: string) =>
    api.get<ApiResponse<TemplateConfig>>(`/templates/${id}`),

  create: (data: Partial<TemplateConfig>) =>
    api.post<ApiResponse<TemplateConfig>>('/templates', data),

  update: (id: string, data: Partial<TemplateConfig>) =>
    api.patch<ApiResponse<TemplateConfig>>(`/templates/${id}`, data),
};

// ── Generate Service ──
export const generateService = {
  generate: (config: { templateId: string; title?: string; department?: string; volume?: string; year?: string }) =>
    api.post<ApiResponse<{ filename: string; path: string }>>('/generate', config),

  download: (filename: string) =>
    api.get(`/generate/download/${filename}`, { responseType: 'blob' }),

  getHistory: () =>
    api.get<ApiResponse<{ filename: string; createdAt: string; size: number }[]>>('/generate/history'),
};

export default api;
