import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import type { z } from 'zod';
import { appConfig } from '../config/env.js';
import { AuditAction, Role, UserStatus } from '../../../shared/src/enums.js';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '../../../shared/src/types.js';
import { signAccessToken } from '../middleware/auth.middleware.js';
import { recordAudit } from '../middleware/audit.middleware.js';
import { PasswordResetToken, RefreshToken, User, type IUser } from '../models/index.js';
import { conflict, badRequest, unauthorized, forbidden } from '../utils/errors.js';
import { toUserDTO } from '../utils/dto.js';
import { generateRandomToken, hashToken } from '../utils/tokens.js';
import { registerSchema } from '../validators/auth.validators.js';
import { sendEmail } from './email.service.js';

const BCRYPT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
export const REFRESH_COOKIE = 'mm_refresh';

export type RegisterBody = z.infer<typeof registerSchema>;

function parseDuration(value: string, fallbackMs: number): number {
  const match = /^(\d+)\s*(ms|s|m|h|d|w)?$/i.exec(String(value).trim());
  if (!match) return fallbackMs;
  const unit = (match[2] || 'ms').toLowerCase();
  const mult: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };
  return Number(match[1]) * (mult[unit] ?? 1);
}

export function refreshCookieOptions(expiresAt?: Date): Record<string, unknown> {
  return {
    httpOnly: true,
    secure: appConfig.cookies.secure,
    sameSite: appConfig.cookies.sameSite,
    domain: appConfig.cookies.domain || undefined,
    path: '/api/auth',
    ...(expiresAt ? { expires: expiresAt } : {}),
  };
}

export function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions(expiresAt));
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
}

async function issueSession(res: Response, user: IUser): Promise<void> {
  const token = generateRandomToken(48);
  const expiresAt = new Date(Date.now() + parseDuration(appConfig.jwt.refreshExpiresIn, 7 * 86_400_000));
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt,
  });
  setRefreshCookie(res, token, expiresAt);
}

function evaluateLocked(user: IUser & { lockedUntil?: Date | null; failedLoginAttempts?: number }): void {
  if (user.status === UserStatus.LOCKED) {
    const locked = user.lockedUntil && user.lockedUntil.getTime() > Date.now();
    if (locked) {
      throw unauthorized('Account temporarily locked due to failed login attempts', 'ACCOUNT_LOCKED');
    }
    user.status = UserStatus.ACTIVE;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
  }
}

export async function register(
  input: RegisterBody,
  res: Response,
  context: { ip?: string | null } = {}
): Promise<{ user: ReturnType<typeof toUserDTO>; accessToken: string }> {
  const email = input.email.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    throw conflict('An account with this email already exists');
  }

  const password = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await User.create({
    name: input.name,
    email,
    phone: input.phone,
    password,
    role: Role.CUSTOMER,
    status: UserStatus.ACTIVE,
  });

  await recordAudit({
    actor: String(user._id),
    action: AuditAction.USER_REGISTERED,
    entity: 'User',
    entityId: String(user._id),
    ip: context.ip ?? null,
    metadata: { email },
  });

  const accessToken = signAccessToken(user);
  await issueSession(res, user);
  return { user: toUserDTO(user), accessToken };
}

function signAccess(user: IUser): string {
  return signAccessToken(user);
}

export async function login(
  input: LoginInput,
  res: Response,
  context: { ip?: string | null } = {}
): Promise<{ user: ReturnType<typeof toUserDTO>; accessToken: string }> {
  const email = input.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select(
    '+password +failedLoginAttempts +lockedUntil'
  );

  const failAudit = (reason: string, userId?: string) =>
    recordAudit({
      actor: userId ?? null,
      action: AuditAction.USER_LOGIN_FAILED,
      entity: 'User',
      entityId: userId ?? null,
      ip: context.ip ?? null,
      metadata: { email, reason },
    });

  if (!user) {
    await failAudit('unknown_email');
    throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (user.status === UserStatus.SUSPENDED) {
    await failAudit('suspended', String(user._id));
    throw forbidden('Your account has been suspended', 'ACCOUNT_SUSPENDED');
  }

  evaluateLocked(user);

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
    const locked = user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS;
    if (locked) {
      user.status = UserStatus.LOCKED;
      user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
    }
    await user.save();
    await failAudit('bad_password', String(user._id));
    if (locked) {
      throw unauthorized(
        `Account locked for ${LOCK_MINUTES} minutes after too many failed attempts`,
        'ACCOUNT_LOCKED'
      );
    }
    throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  if (user.status === UserStatus.LOCKED) user.status = UserStatus.ACTIVE;
  await user.save();

  await recordAudit({
    actor: String(user._id),
    action: AuditAction.USER_LOGIN,
    entity: 'User',
    entityId: String(user._id),
    ip: context.ip ?? null,
  });

  const accessToken = signAccess(user);
  await issueSession(res, user);
  return { user: toUserDTO(user), accessToken };
}

export async function refresh(
  token: string | undefined,
  res: Response,
  context: { ip?: string | null } = {}
): Promise<{ user: ReturnType<typeof toUserDTO>; accessToken: string }> {
  if (!token) throw unauthorized('Refresh token missing');
  const record = await RefreshToken.findOne({
    tokenHash: hashToken(token),
    revoked: false,
    expiresAt: { $gt: new Date() },
  });
  if (!record) throw unauthorized('Invalid or expired refresh token');

  const user = await User.findById(record.user);
  if (!user || user.status === UserStatus.SUSPENDED) {
    record.revoked = true;
    await record.save();
    throw unauthorized('Invalid or expired refresh token');
  }
  evaluateLocked(user);

  record.revoked = true;
  await record.save();

  const accessToken = signAccess(user);
  await issueSession(res, user);
  await recordAudit({
    actor: String(user._id),
    action: AuditAction.USER_LOGIN,
    entity: 'User',
    entityId: String(user._id),
    ip: context.ip ?? null,
    metadata: { via: 'refresh' },
  });
  return { user: toUserDTO(user), accessToken };
}

export async function logout(
  token: string | undefined,
  res: Response,
  context: { userId?: string | null; ip?: string | null } = {}
): Promise<null> {
  clearRefreshCookie(res);
  if (token) {
    await RefreshToken.updateOne({ tokenHash: hashToken(token) }, { $set: { revoked: true } });
  }
  await recordAudit({
    actor: context.userId ?? null,
    action: AuditAction.USER_LOGOUT,
    entity: 'User',
    entityId: context.userId ?? null,
    ip: context.ip ?? null,
  });
  return null;
}

export async function forgotPassword(
  input: ForgotPasswordInput,
  context: { ip?: string | null } = {}
): Promise<null> {
  const email = input.email.trim().toLowerCase();
  const user = await User.findOne({ email });
  if (user) {
    await PasswordResetToken.updateMany({ user: user._id, used: false }, { $set: { used: true } });
    const token = generateRandomToken(32);
    const expiresAt = new Date(Date.now() + appConfig.passwordResetExpiresMinutes * 60_000);
    await PasswordResetToken.create({
      user: user._id,
      tokenHash: hashToken(token),
      expiresAt,
    });
    const link = `${appConfig.clientUrl}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your Material Mundi password',
      text: `Use this link to reset your password: ${link}\nThis link expires in ${appConfig.passwordResetExpiresMinutes} minutes.`,
    });
    await recordAudit({
      actor: String(user._id),
      action: AuditAction.USER_PASSWORD_RESET_REQUESTED,
      entity: 'User',
      entityId: String(user._id),
      ip: context.ip ?? null,
    });
  }
  return null;
}

export async function resetPassword(
  input: ResetPasswordInput,
  context: { ip?: string | null } = {}
): Promise<null> {
  const record = await PasswordResetToken.findOne({
    tokenHash: hashToken(input.token),
    used: false,
    expiresAt: { $gt: new Date() },
  });
  if (!record) {
    throw badRequest('Invalid or expired reset token', 'VALIDATION_ERROR', {
      errors: { token: ['Invalid or expired reset token'] },
    });
  }

  const user = await User.findById(record.user).select('+password +failedLoginAttempts +lockedUntil');
  if (!user) {
    throw badRequest('Invalid or expired reset token', 'VALIDATION_ERROR', {
      errors: { token: ['Invalid or expired reset token'] },
    });
  }

  user.password = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  if (user.status === UserStatus.LOCKED) user.status = UserStatus.ACTIVE;
  await user.save();

  record.used = true;
  await record.save();
  await RefreshToken.updateMany({ user: user._id }, { $set: { revoked: true } });

  await recordAudit({
    actor: String(user._id),
    action: AuditAction.USER_PASSWORD_RESET_COMPLETED,
    entity: 'User',
    entityId: String(user._id),
    ip: context.ip ?? null,
  });
  return null;
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
  context: { ip?: string | null } = {}
): Promise<null> {
  const user = await User.findById(userId).select('+password');
  if (!user) throw unauthorized('Authentication required');

  const valid = await bcrypt.compare(input.currentPassword, user.password);
  if (!valid) {
    throw badRequest('Current password is incorrect', 'VALIDATION_ERROR', {
      errors: { currentPassword: ['Current password is incorrect'] },
    });
  }

  user.password = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  await user.save();
  await RefreshToken.updateMany({ user: userId }, { $set: { revoked: true } });
  await recordAudit({
    actor: userId,
    action: AuditAction.USER_UPDATED,
    entity: 'User',
    entityId: userId,
    ip: context.ip ?? null,
    metadata: { field: 'password' },
  });
  return null;
}

export async function getProfile(userId: string): Promise<ReturnType<typeof toUserDTO>> {
  const user = await User.findById(userId);
  if (!user) throw unauthorized('Authentication required');
  return toUserDTO(user);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
  context: { ip?: string | null } = {}
): Promise<ReturnType<typeof toUserDTO>> {
  const updates: Record<string, string> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (Object.keys(updates).length === 0) {
    throw badRequest('At least one field must be provided');
  }
  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });
  if (!user) throw unauthorized('Authentication required');
  await recordAudit({
    actor: userId,
    action: AuditAction.USER_UPDATED,
    entity: 'User',
    entityId: userId,
    ip: context.ip ?? null,
    metadata: { fields: Object.keys(updates) },
  });
  return toUserDTO(user);
}
