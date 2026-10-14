import { randomBytes } from 'crypto';
import type { Request } from 'express';
import {
  AuditAction,
  ListingStatus,
  NotificationType,
  OrderStatus,
  PaymentStatus,
  ProcessedInventoryStatus,
  Role,
} from '../../../shared/src/enums.js';
import type { ListQuery } from '../../../shared/src/types.js';
import { auditFromRequest } from '../middleware/audit.middleware.js';
import { MarketplaceListing, Order, ProcessedMaterial, type IOrder } from '../models/index.js';
import {
  badRequest,
  insufficientInventory,
  invalidState,
  notFound,
} from '../utils/errors.js';
import { buildPaginated, getPagination, parseSort } from '../utils/pagination.js';
import { toOrderDTO } from '../utils/dto.js';
import { round2 } from '../utils/math.js';
import { notify, notifyAdmins } from './notification.service.js';

const SORTABLE: Record<string, string> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  total: 'total',
  status: 'status',
};

function generateOrderNumber(): string {
  const now = new Date();
  const ymd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(
    now.getUTCDate()
  ).padStart(2, '0')}`;
  return `MM-${ymd}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export interface CreateOrderInput {
  listingId: string;
  quantity: number;
  shippingAddress: {
    fullName: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  customerNote?: string;
}

async function restoreListingStock(listingId: unknown, quantity: number): Promise<void> {
  await MarketplaceListing.updateOne(
    { _id: listingId },
    { $inc: { availableQuantity: quantity } }
  );
}

async function restoreProcessedStock(listing: any, quantity: number): Promise<void> {
  if (!listing?.processedMaterial) return;
  const material = await ProcessedMaterial.findOneAndUpdate(
    { _id: listing.processedMaterial },
    { $inc: { availableQuantity: quantity } },
    { new: true }
  );
  if (material) {
    material.status =
      material.availableQuantity > 0
        ? ProcessedInventoryStatus.AVAILABLE
        : ProcessedInventoryStatus.SOLD_OUT;
    await material.save();
  }
}

async function releaseOrderStock(order: IOrder): Promise<void> {
  for (const rawItem of order.items as any[]) {
    const item = rawItem.toObject ? rawItem.toObject() : rawItem;
    await MarketplaceListing.updateOne(
      { _id: item.listing },
      { $inc: { availableQuantity: item.quantity } }
    );
    const listing = await MarketplaceListing.findById(item.listing);
    if (!listing) continue;
    if (listing.status === ListingStatus.SOLD_OUT && listing.availableQuantity > 0) {
      listing.status = ListingStatus.PUBLISHED;
      await listing.save();
    }
    await restoreProcessedStock(listing, item.quantity);
  }
}

export async function createOrder(req: Request, userId: string, input: CreateOrderInput) {
  const listing = await MarketplaceListing.findById(input.listingId);
  if (!listing) throw notFound('Listing not found');
  if (listing.status !== ListingStatus.PUBLISHED) {
    throw invalidState('This listing is not available for purchase', 'INVALID_STATE_TRANSITION');
  }
  if (input.quantity < listing.minOrderQuantity) {
    throw badRequest(
      `Minimum order quantity is ${listing.minOrderQuantity}`,
      'VALIDATION_ERROR',
      { errors: { quantity: [`Minimum order quantity is ${listing.minOrderQuantity}`] } }
    );
  }

  const quantity = round2(input.quantity);
  const pricePerKg = listing.pricePerKg;

  const reservedListing = await MarketplaceListing.findOneAndUpdate(
    {
      _id: listing._id,
      status: ListingStatus.PUBLISHED,
      availableQuantity: { $gte: quantity },
    },
    { $inc: { availableQuantity: -quantity } },
    { new: true }
  );
  if (!reservedListing) {
    throw insufficientInventory('Not enough stock available for this listing');
  }

  let materialReserved = false;
  if (reservedListing.processedMaterial) {
    const material = await ProcessedMaterial.findOneAndUpdate(
      { _id: reservedListing.processedMaterial, availableQuantity: { $gte: quantity } },
      { $inc: { availableQuantity: -quantity } },
      { new: true }
    );
    if (!material) {
      await restoreListingStock(reservedListing._id, quantity);
      throw insufficientInventory('Not enough stock available for this listing');
    }
    materialReserved = true;
    material.status =
      material.availableQuantity > 0
        ? ProcessedInventoryStatus.RESERVED
        : ProcessedInventoryStatus.SOLD_OUT;
    await material.save();
  }

  const subtotal = round2(quantity * pricePerKg);

  let order: IOrder | null = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await Order.create({
        orderNumber: generateOrderNumber(),
        user: userId,
        items: [
          {
            listing: listing._id,
            productName: listing.productName,
            materialType: listing.materialType,
            grade: listing.grade,
            quantity,
            pricePerKg,
            total: subtotal,
          },
        ],
        subtotal,
        total: subtotal,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        shippingAddress: input.shippingAddress,
        customerNote: input.customerNote ?? null,
      });
    } catch (error: any) {
      lastError = error;
      if (error?.code !== 11000) break;
    }
  }

  if (!order) {
    await restoreListingStock(reservedListing._id, quantity);
    if (materialReserved) await restoreProcessedStock(reservedListing, quantity);
    throw lastError instanceof Error ? lastError : new Error('Failed to create order');
  }

  await MarketplaceListing.updateOne(
    { _id: reservedListing._id, status: ListingStatus.PUBLISHED, availableQuantity: { $lte: 0 } },
    { $set: { status: ListingStatus.SOLD_OUT } }
  );

  await auditFromRequest(req, AuditAction.ORDER_CREATED, 'Order', String(order._id), {
    orderNumber: order.orderNumber,
    listing: String(listing._id),
    quantity,
    total: subtotal,
  });
  await auditFromRequest(req, AuditAction.INVENTORY_RESERVED, 'MarketplaceListing', String(listing._id), {
    quantity,
  });
  await notifyAdmins(
    NotificationType.NEW_ORDER,
    'New order received',
    `Order ${order.orderNumber} was placed for ${quantity} kg of ${listing.productName}.`,
    '/admin/orders'
  );

  return toOrderDTO(order);
}

export async function listOrders(
  user: { _id: any; role: Role },
  query: ListQuery & { status?: OrderStatus }
) {
  const filter: Record<string, unknown> = {};
  if (user.role !== Role.ADMIN) filter.user = user._id;
  if (query.status) filter.status = query.status;

  const { page, limit, skip } = getPagination(query);
  const sort = parseSort(query.sort, SORTABLE, { createdAt: -1 });

  const [items, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  return buildPaginated(items.map(toOrderDTO), total, page, limit);
}

export async function getOrder(user: { _id: any; role: Role }, id: string) {
  const order = await Order.findById(id);
  if (!order) throw notFound('Order not found');
  if (String(order.user) !== String(user._id) && user.role !== Role.ADMIN) {
    throw notFound('Order not found');
  }
  return toOrderDTO(order);
}

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.READY_FOR_DISPATCH, OrderStatus.CANCELLED],
  [OrderStatus.READY_FOR_DISPATCH]: [OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
  [OrderStatus.DISPATCHED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export async function updateOrderStatus(
  req: Request,
  id: string,
  input: { status: OrderStatus; cancelReason?: string; paymentStatus?: PaymentStatus }
) {
  const order = await Order.findById(id);
  if (!order) throw notFound('Order not found');

  const changes: Record<string, unknown> = {};
  const previousStatus = order.status;

  if (input.status !== previousStatus) {
    const allowed = ORDER_TRANSITIONS[previousStatus];
    if (!allowed.includes(input.status)) {
      throw invalidState(
        `Cannot move an order from ${previousStatus} to ${input.status}`,
        'INVALID_STATE_TRANSITION'
      );
    }
    order.status = input.status;
    changes.status = input.status;

    if (input.status === OrderStatus.CANCELLED) {
      order.cancelReason = input.cancelReason ?? 'Cancelled by administrator';
      await releaseOrderStock(order);
      await auditFromRequest(req, AuditAction.ORDER_CANCELLED, 'Order', id, {
        orderNumber: order.orderNumber,
        cancelReason: order.cancelReason,
      });
    }
  }

  if (input.paymentStatus !== undefined) {
    order.paymentStatus = input.paymentStatus;
    changes.paymentStatus = input.paymentStatus;
  }
  if (input.cancelReason !== undefined && order.status !== OrderStatus.CANCELLED) {
    order.cancelReason = input.cancelReason;
  }

  await order.save();

  if (Object.keys(changes).length > 0) {
    await auditFromRequest(req, AuditAction.ORDER_STATUS_CHANGED, 'Order', id, {
      orderNumber: order.orderNumber,
      ...changes,
    });
    await notify(
      String(order.user),
      NotificationType.ORDER_STATUS_CHANGED,
      'Order updated',
      `Order ${order.orderNumber} is now ${order.status}.`,
      `/orders/${id}`
    );
  }

  return toOrderDTO(order);
}

export async function cancelOrder(
  req: Request,
  user: { _id: any },
  id: string,
  cancelReason?: string
) {
  const order = await Order.findById(id);
  if (!order) throw notFound('Order not found');
  if (String(order.user) !== String(user._id)) throw notFound('Order not found');

  if (order.status !== OrderStatus.PENDING) {
    throw invalidState(
      'Only pending orders can be cancelled',
      'INVALID_STATE_TRANSITION'
    );
  }

  order.status = OrderStatus.CANCELLED;
  order.cancelReason = cancelReason ?? 'Cancelled by customer';
  await order.save();
  await releaseOrderStock(order);

  await auditFromRequest(req, AuditAction.ORDER_CANCELLED, 'Order', id, {
    orderNumber: order.orderNumber,
    cancelReason: order.cancelReason,
  });
  await notify(
    String(order.user),
    NotificationType.ORDER_STATUS_CHANGED,
    'Order cancelled',
    `Order ${order.orderNumber} has been cancelled.`,
    `/orders/${id}`
  );

  return toOrderDTO(order);
}
