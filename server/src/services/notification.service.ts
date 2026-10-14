import { NotificationType, Role, UserStatus } from '../../../shared/src/enums.js';
import type { ListQuery } from '../../../shared/src/types.js';
import { Notification, User, type INotification } from '../models/index.js';
import { buildPaginated } from '../utils/pagination.js';
import { toNotificationDTO } from '../utils/dto.js';
import { notFound } from '../utils/errors.js';

export async function notify(
  userId: string,
  type: NotificationType | string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  await Notification.create({ user: userId, type, title, message, link: link ?? null });
}

export async function notifyAdmins(
  type: NotificationType | string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  const admins = await User.find({ role: Role.ADMIN, status: UserStatus.ACTIVE }).select('_id');
  if (admins.length === 0) return;
  await Notification.insertMany(
    admins.map((admin) => ({
      user: admin._id,
      type,
      title,
      message,
      link: link ?? null,
    }))
  );
}

export async function listNotifications(userId: string, query: ListQuery & { unread?: boolean }) {
  const filter: Record<string, unknown> = { user: userId };
  if (query.unread) filter.read = false;
  const { page, limit, skip } = {
    page: query.page ?? 1,
    limit: query.limit ?? 12,
    skip: ((query.page ?? 1) - 1) * (query.limit ?? 12),
  };
  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);
  return buildPaginated(items.map(toNotificationDTO), total, page, limit);
}

export async function unreadCount(userId: string): Promise<number> {
  return Notification.countDocuments({ user: userId, read: false });
}

export async function markRead(userId: string, id: string): Promise<void> {
  const result = await Notification.updateOne(
    { _id: id, user: userId },
    { $set: { read: true } }
  );
  if (result.matchedCount === 0) throw notFound('Notification not found');
}

export async function markAllRead(userId: string): Promise<void> {
  await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
}

export type { INotification };
