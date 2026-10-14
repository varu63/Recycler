import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../../shared/src/constants.js';

const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`);

function passwordsMatch<T extends { password: string; confirmPassword: string }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  if (data.confirmPassword !== data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    });
  }
}

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
    email: z.string().trim().email('Enter a valid email address').max(254),
    phone: z.string().trim().min(7, 'Enter a valid phone number').max(30),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .superRefine(passwordsMatch);

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(254),
  password: z.string().min(1, 'Password is required').max(200),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(254),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(10, 'Invalid reset token').max(300),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .superRefine(passwordsMatch);

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(200),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .superRefine(passwordsMatch);

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().min(7).max(30).optional(),
  })
  .refine((data) => data.name !== undefined || data.phone !== undefined, {
    message: 'At least one field must be provided',
  });
