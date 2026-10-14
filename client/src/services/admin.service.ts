import { apiGet, apiPatch } from '@/lib/api';
import type {
  AuditLogDTO,
  DashboardChartData,
  DashboardStats,
  ListQuery,
  Paginated,
  ReportSummary,
  UserDTO,
} from '@/types';

export interface AdminSettings {
  nodeEnv: string;
  imageStorage: string;
  emailProvider: string;
  rateLimit: { windowMs: number; max: number; loginMax: number };
  uploads: { maxFiles: number; maxSizeBytes: number; allowedTypes: string[] };
  version: string;
}

export const adminService = {
  dashboard: () =>
    apiGet<{ stats: DashboardStats; charts: DashboardChartData }>('/admin/dashboard'),

  users: (query: ListQuery & { role?: string; status?: string }) =>
    apiGet<Paginated<UserDTO>>('/admin/users', { params: query }),

  updateUserStatus: async (id: string, status: 'active' | 'suspended') =>
    (await apiPatch<{ user: UserDTO }>(`/admin/users/${id}/status`, { status })).user,

  auditLogs: (query: ListQuery & { entity?: string; action?: string }) =>
    apiGet<Paginated<AuditLogDTO>>('/admin/audit-logs', { params: query }),

  reports: () =>
    apiGet<
      ReportSummary & { revenueSeries: { month: string; revenue: number; orders: number }[] }
    >('/admin/reports'),

  settings: () => apiGet<AdminSettings>('/admin/settings'),
};
