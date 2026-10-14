import type { Request } from 'express';
import { appConfig } from '../config/env.js';
import {
  AuditAction,
  ListingStatus,
  MaterialRequestStatus,
  OrderStatus,
  Role,
} from '../../../shared/src/enums.js';
import type { ListQuery } from '../../../shared/src/types.js';
import { auditFromRequest } from '../middleware/audit.middleware.js';
import {
  Inspection,
  MaterialRequest,
  MarketplaceListing,
  Order,
  ProcessingBatch,
  ProcessedMaterial,
  PurchaseOffer,
  RawInventory,
  User,
} from '../models/index.js';
import { badRequest, notFound } from '../utils/errors.js';
import { buildPaginated, getPagination, parseSort } from '../utils/pagination.js';
import { escapeRegex } from '../utils/common.js';
import { toUserDTO } from '../utils/dto.js';
import { UPLOAD_ALLOWED_MIME_TYPES, UPLOAD_MAX_FILES, UPLOAD_MAX_FILE_SIZE_BYTES } from '../../../shared/src/constants.js';

const USER_SORT: Record<string, string> = {
  createdAt: 'createdAt',
  name: 'name',
  email: 'email',
  role: 'role',
  status: 'status',
};

export async function listUsers(query: ListQuery & { role?: Role; status?: string }) {
  const filter: Record<string, unknown> = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
  }

  const { page, limit, skip } = getPagination(query);
  const sort = parseSort(query.sort, USER_SORT, { createdAt: -1 });

  const [items, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return buildPaginated(items.map(toUserDTO), total, page, limit);
}

export async function updateUserStatus(
  req: Request,
  id: string,
  status: 'active' | 'suspended'
) {
  if (String(req.user?._id) === id) {
    throw badRequest('You cannot change the status of your own account');
  }
  const user = await User.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  if (!user) throw notFound('User not found');
  if (status === 'suspended') {
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();
  }

  await auditFromRequest(req, AuditAction.USER_UPDATED, 'User', id, { status });
  return toUserDTO(user);
}

export async function getDashboard() {
  const [
    pendingRequests,
    inspections,
    purchaseOffers,
    rawMaterials,
    processingBatches,
    processedMaterials,
    activeListings,
    orders,
    totalUsers,
    revenueResult,
    requestsByStatus,
    listingsByStatus,
    inventoryByMaterial,
    ordersOverTime,
  ] = await Promise.all([
    MaterialRequest.countDocuments({
      status: { $in: [MaterialRequestStatus.SUBMITTED, MaterialRequestStatus.UNDER_REVIEW] },
    }),
    Inspection.countDocuments({}),
    PurchaseOffer.countDocuments({}),
    RawInventory.countDocuments({}),
    ProcessingBatch.countDocuments({}),
    ProcessedMaterial.countDocuments({}),
    MarketplaceListing.countDocuments({ status: ListingStatus.PUBLISHED }),
    Order.countDocuments({}),
    User.countDocuments({}),
    Order.aggregate([
      { $match: { status: { $ne: OrderStatus.CANCELLED } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]),
    MaterialRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { status: 1 } },
    ]),
    MarketplaceListing.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { status: 1 } },
    ]),
    RawInventory.aggregate([
      { $group: { _id: '$materialType', weight: { $sum: '$currentWeight' } } },
      { $project: { _id: 0, material: '$_id', weight: 1 } },
      { $sort: { material: 1 } },
    ]),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 86_400_000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', OrderStatus.CANCELLED] }, 0, '$total'] } },
        },
      },
      { $project: { _id: 0, date: '$_id', orders: 1, revenue: 1 } },
      { $sort: { date: 1 } },
    ]),
  ]);

  return {
    stats: {
      pendingRequests,
      inspections,
      purchaseOffers,
      rawMaterials,
      processingBatches,
      processedMaterials,
      activeListings,
      orders,
      revenue: revenueResult[0]?.revenue ?? 0,
      totalUsers,
    },
    charts: {
      requestsByStatus,
      ordersOverTime,
      inventoryByMaterial,
      listingsByStatus,
    },
  };
}

export async function getReports() {
  const [
    totalRequests,
    approvedRequests,
    rejectedRequests,
    purchasedAgg,
    processedAgg,
    soldAgg,
    revenueAgg,
    ordersByStatusRaw,
    revenueSeries,
  ] = await Promise.all([
    MaterialRequest.countDocuments({}),
    MaterialRequest.countDocuments({
      status: {
        $in: [
          MaterialRequestStatus.ACCEPTED,
          MaterialRequestStatus.PURCHASED,
          MaterialRequestStatus.COMPLETED,
        ],
      },
    }),
    MaterialRequest.countDocuments({ status: MaterialRequestStatus.REJECTED }),
    RawInventory.aggregate([
      { $group: { _id: null, kg: { $sum: '$purchaseWeight' }, cost: { $sum: '$purchasePrice' } } },
    ]),
    ProcessedMaterial.aggregate([{ $group: { _id: null, kg: { $sum: '$weight' } } }]),
    Order.aggregate([
      { $match: { status: { $ne: OrderStatus.CANCELLED } } },
      { $unwind: '$items' },
      { $group: { _id: null, kg: { $sum: '$items.quantity' } } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: OrderStatus.CANCELLED } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { status: 1 } },
    ]),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 86_400_000) },
          status: { $ne: OrderStatus.CANCELLED },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $project: { _id: 0, month: '$_id', revenue: 1, orders: 1 } },
      { $sort: { month: 1 } },
    ]),
  ]);

  return {
    totalRequests,
    approvedRequests,
    rejectedRequests,
    totalPurchasedKg: purchasedAgg[0]?.kg ?? 0,
    totalPurchaseCost: purchasedAgg[0]?.cost ?? 0,
    totalProcessedKg: processedAgg[0]?.kg ?? 0,
    totalSoldKg: soldAgg[0]?.kg ?? 0,
    totalRevenue: revenueAgg[0]?.revenue ?? 0,
    ordersByStatus: ordersByStatusRaw,
    revenueSeries,
  };
}

export function getSettings() {
  return {
    nodeEnv: appConfig.env,
    imageStorage: appConfig.imageStorage,
    emailProvider: appConfig.email.provider,
    rateLimit: {
      windowMs: appConfig.rateLimit.windowMs,
      max: appConfig.rateLimit.max,
      loginMax: appConfig.rateLimit.loginMax,
    },
    uploads: {
      maxFiles: UPLOAD_MAX_FILES,
      maxSizeBytes: UPLOAD_MAX_FILE_SIZE_BYTES,
      allowedTypes: [...UPLOAD_ALLOWED_MIME_TYPES],
    },
    version: '1.0.0',
  };
}
