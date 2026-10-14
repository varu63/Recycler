import { apiGet, apiPatch, apiPost } from '@/lib/api';
import type { AuthResponse, UserDTO } from '@/types';

export const authService = {
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => apiPost<AuthResponse>('/auth/register', input),

  login: (input: { email: string; password: string }) =>
    apiPost<AuthResponse>('/auth/login', input),

  logout: () => apiPost<null>('/auth/logout'),

  me: async () => (await apiGet<{ user: UserDTO }>('/auth/me')).user,

  updateProfile: async (input: { name?: string; phone?: string }) =>
    (await apiPatch<{ user: UserDTO }>('/auth/me', input)).user,

  changePassword: (input: { currentPassword: string; password: string; confirmPassword: string }) =>
    apiPost<null>('/auth/change-password', input),

  forgotPassword: (email: string) => apiPost<null>('/auth/forgot-password', { email }),

  resetPassword: (input: { token: string; password: string; confirmPassword: string }) =>
    apiPost<null>('/auth/reset-password', input),
};
