import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';
import {
  authHeader,
  buildApp,
  clearDb,
  makeAdmin,
  registerUser,
  seedListing,
  setupTestDb,
  shippingAddress,
  teardownTestDb,
  type TestAccount,
} from './helpers.js';

let app: Express;
let admin: TestAccount;
let customer: TestAccount;
let other: TestAccount;

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearDb();
  app = buildApp();
  admin = await registerUser(app, { name: 'Orders Admin' });
  await makeAdmin(admin.id);
  customer = await registerUser(app, { name: 'Buyer One' });
  other = await registerUser(app, { name: 'Buyer Two' });
});

function orderPayload(listingId: string, quantity: number, overrides: Record<string, unknown> = {}) {
  return {
    listingId,
    quantity,
    shippingAddress,
    ...overrides,
  };
}

async function placeOrder(
  token: string,
  listingId: string,
  quantity: number,
  overrides: Record<string, unknown> = {}
) {
  return request(app)
    .post('/api/orders')
    .set(authHeader(token))
    .send(orderPayload(listingId, quantity, overrides));
}

describe('orders', () => {
  it('places an order with server-side pricing and reserves stock', async () => {
    const seed = await seedListing(app, admin.token, customer.token, {
      weight: 20,
      outputWeight: 10,
      quantity: 10,
      minOrderQuantity: 2,
      listingPrice: 5,
    });

    const res = await placeOrder(customer.token, seed.listingId, 6, { pricePerKg: 0.01 });
    expect(res.status).toBe(201);
    const order = res.body.data.order;
    expect(order.status).toBe('PENDING');
    expect(order.paymentStatus).toBe('UNPAID');
    expect(order.items[0].pricePerKg).toBe(5);
    expect(order.items[0].quantity).toBe(6);
    expect(order.total).toBe(30);
    expect(order.subtotal).toBe(30);
    expect(order.shippingAddress.city).toBe('Mumbai');
    expect(order.orderNumber).toMatch(/^MM-\d{8}-[A-F0-9]{8}$/);

    const listing = await request(app).get(`/api/marketplace/${seed.listingId}`);
    expect(listing.status).toBe(200);
    expect(listing.body.data.listing.availableQuantity).toBe(4);

    const adminNotices = await request(app)
      .get('/api/notifications')
      .set(authHeader(admin.token));
    expect(adminNotices.body.data.items.map((item: any) => item.type)).toContain('NEW_ORDER');

    const second = await placeOrder(customer.token, seed.listingId, 4);
    expect(second.status).toBe(201);

    const soldOut = await request(app).get(`/api/marketplace/${seed.listingId}`);
    expect(soldOut.status).toBe(404);

    const adminListing = await request(app)
      .get('/api/marketplace/admin')
      .set(authHeader(admin.token));
    const entry = adminListing.body.data.items.find((item: any) => item.id === seed.listingId);
    expect(entry.status).toBe('SOLD_OUT');
    expect(entry.availableQuantity).toBe(0);
  });

  it('enforces minimum order quantity and stock limits', async () => {
    const seed = await seedListing(app, admin.token, customer.token, {
      outputWeight: 10,
      quantity: 10,
      minOrderQuantity: 3,
      listingPrice: 5,
    });

    const tooSmall = await placeOrder(customer.token, seed.listingId, 2);
    expect(tooSmall.status).toBe(400);
    expect(tooSmall.body.errors.quantity).toBeDefined();

    const tooLarge = await placeOrder(customer.token, seed.listingId, 11);
    expect(tooLarge.status).toBe(409);
    expect(tooLarge.body.code).toBe('INSUFFICIENT_INVENTORY');

    const invalidId = await placeOrder(customer.token, '0123456789abcdef01234567', 5);
    expect(invalidId.status).toBe(404);

    const missingAddress = await request(app)
      .post('/api/orders')
      .set(authHeader(customer.token))
      .send({ listingId: seed.listingId, quantity: 5 });
    expect(missingAddress.status).toBe(400);
    expect(missingAddress.body.code).toBe('VALIDATION_ERROR');
  });

  it('reserves stock atomically under concurrent orders', async () => {
    const seed = await seedListing(app, admin.token, customer.token, {
      outputWeight: 10,
      quantity: 10,
      minOrderQuantity: 1,
      listingPrice: 5,
    });

    const attempts = await Promise.all(
      Array.from({ length: 5 }, () => placeOrder(customer.token, seed.listingId, 3))
    );
    const successes = attempts.filter((res) => res.status === 201);
    const failures = attempts.filter((res) => res.status === 409);

    expect(successes).toHaveLength(3);
    expect(failures).toHaveLength(2);
    for (const failure of failures) {
      expect(failure.body.code).toBe('INSUFFICIENT_INVENTORY');
    }

    const listing = await request(app).get(`/api/marketplace/${seed.listingId}`);
    expect(listing.body.data.listing.availableQuantity).toBe(1);
  });

  it('cancels a pending order and restores stock', async () => {
    const seed = await seedListing(app, admin.token, customer.token, {
      outputWeight: 10,
      quantity: 10,
      minOrderQuantity: 1,
      listingPrice: 5,
    });

    const created = await placeOrder(customer.token, seed.listingId, 5);
    const orderId = created.body.data.order.id as string;

    const wrongOwner = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set(authHeader(other.token))
      .send({});
    expect(wrongOwner.status).toBe(404);

    const cancelled = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set(authHeader(customer.token))
      .send({ cancelReason: 'Changed my mind' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.order.status).toBe('CANCELLED');
    expect(cancelled.body.data.order.cancelReason).toBe('Changed my mind');

    const listing = await request(app).get(`/api/marketplace/${seed.listingId}`);
    expect(listing.body.data.listing.availableQuantity).toBe(10);

    const cancelAgain = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set(authHeader(customer.token))
      .send({});
    expect(cancelAgain.status).toBe(409);
    expect(cancelAgain.body.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('walks an order through the admin status pipeline', async () => {
    const seed = await seedListing(app, admin.token, customer.token, {
      outputWeight: 8,
      quantity: 8,
      minOrderQuantity: 1,
      listingPrice: 4,
    });
    const created = await placeOrder(customer.token, seed.listingId, 4);
    const orderId = created.body.data.order.id as string;

    const skipped = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set(authHeader(admin.token))
      .send({ status: 'DISPATCHED' });
    expect(skipped.status).toBe(409);
    expect(skipped.body.code).toBe('INVALID_STATE_TRANSITION');

    const sequence = ['CONFIRMED', 'PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED'];
    let previous = 'PENDING';
    for (const status of sequence) {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set(authHeader(admin.token))
        .send({ status, paymentStatus: status === 'DELIVERED' ? 'PAID' : undefined });
      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe(status);
      previous = status;
    }
    expect(previous).toBe('DELIVERED');

    const notices = await request(app)
      .get('/api/notifications')
      .set(authHeader(customer.token));
    expect(notices.body.data.items.map((item: any) => item.type)).toContain(
      'ORDER_STATUS_CHANGED'
    );

    const customerStatus = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set(authHeader(customer.token))
      .send({ status: 'CANCELLED' });
    expect(customerStatus.status).toBe(403);
  });

  it('releases stock when an admin cancels an order', async () => {
    const seed = await seedListing(app, admin.token, customer.token, {
      outputWeight: 6,
      quantity: 6,
      minOrderQuantity: 1,
      listingPrice: 5,
    });
    const created = await placeOrder(customer.token, seed.listingId, 6);
    expect(created.status).toBe(201);

    const soldOut = await request(app).get(`/api/marketplace/${seed.listingId}`);
    expect(soldOut.status).toBe(404);

    const cancelled = await request(app)
      .patch(`/api/orders/${created.body.data.order.id}/status`)
      .set(authHeader(admin.token))
      .send({ status: 'CANCELLED', cancelReason: 'Stock reallocated' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.order.status).toBe('CANCELLED');
    expect(cancelled.body.data.order.cancelReason).toBe('Stock reallocated');

    const restored = await request(app).get(`/api/marketplace/${seed.listingId}`);
    expect(restored.status).toBe(200);
    expect(restored.body.data.listing.availableQuantity).toBe(6);
    expect(restored.body.data.listing.status).toBe('PUBLISHED');
  });

  it('scopes orders to their owner unless an admin is asking', async () => {
    const seed = await seedListing(app, admin.token, customer.token, {
      outputWeight: 5,
      quantity: 5,
      minOrderQuantity: 1,
      listingPrice: 5,
    });
    const created = await placeOrder(customer.token, seed.listingId, 2);
    const orderId = created.body.data.order.id as string;

    const ownerView = await request(app)
      .get(`/api/orders/${orderId}`)
      .set(authHeader(customer.token));
    expect(ownerView.status).toBe(200);
    expect(ownerView.body.data.order.id).toBe(orderId);

    const strangerView = await request(app)
      .get(`/api/orders/${orderId}`)
      .set(authHeader(other.token));
    expect(strangerView.status).toBe(404);

    const adminView = await request(app)
      .get(`/api/orders/${orderId}`)
      .set(authHeader(admin.token));
    expect(adminView.status).toBe(200);

    const strangerList = await request(app)
      .get('/api/orders')
      .set(authHeader(other.token));
    expect(strangerList.status).toBe(200);
    expect(strangerList.body.data.items).toHaveLength(0);

    const adminList = await request(app)
      .get('/api/orders')
      .set(authHeader(admin.token));
    expect(adminList.body.data.items).toHaveLength(1);
  });
});
