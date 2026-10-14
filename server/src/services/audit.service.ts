import type { ListQuery } from '../../../shared/src/types.js';
import { AuditLog } from '../models/index.js';
import { buildPaginated, getPagination, parseSort } from '../utils/pagination.js';
import { toAuditLogDTO } from '../utils/dto.js';

export async function listAuditLogs(query: ListQuery & { entity?: string; action?: string }) {
  const filter: Record<string, unknown> = {};
  if (query.entity) filter.entity = query.entity;
  if (query.action) filter.action = query.action;

  const { page, limit, skip } = getPagination(query);
  const sort = parseSort(query.sort, { createdAt: 'createdAt', action: 'action' }, { createdAt: -1 });

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('actor', 'name email'),
    AuditLog.countDocuments(filter),
  ]);
  return buildPaginated(items.map(toAuditLogDTO), total, page, limit);
}
