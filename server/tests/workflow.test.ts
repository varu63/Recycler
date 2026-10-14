import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';
import {
  authHeader,
  buildApp,
  clearDb,
  makeAdmin,
  registerUser,
  setupTestDb,
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
  admin = await registerUser(app, { name: 'Site Admin' });
  await makeAdmin(admin.id);
  customer = await registerUser(app, { name: 'Scrap Seller' });
  other = await registerUser(app, { name: 'Other Seller' });
});

function requestBody(overrides: Record<string, unknown> = {}) {
  return {
    materialType: 'metal',
    materialName: 'Copper wire scrap',
    description: 'Clean copper wire scrap collected from renovation work',
    approximateWeight: 120,
    location: 'Mumbai, MH',
    pickupPreference: 'COMPANY_PICKUP',
    ...overrides,
  };
}

async function submitRequest(token: string, overrides: Record<string, unknown> = {}) {
  return request(app)
    .post('/api/material-requests')
    .set(authHeader(token))
    .send(requestBody(overrides));
}

describe('material request workflow', () => {
  it('runs the full request lifecycle and keeps requests private per owner', async () => {
    const created = await submitRequest(customer.token);
    expect(created.status).toBe(201);
    const requestId = created.body.data.request.id as string;
    expect(created.body.data.request.status).toBe('SUBMITTED');
    expect(created.body.data.request.user).toBe(customer.id);

    const otherView = await request(app)
      .get(`/api/material-requests/${requestId}`)
      .set(authHeader(other.token));
    expect(otherView.status).toBe(404);

    const customerList = await request(app)
      .get('/api/material-requests')
      .set(authHeader(customer.token));
    expect(customerList.status).toBe(200);
    expect(customerList.body.data.items.map((item: any) => item.id)).toEqual([requestId]);

    const otherList = await request(app)
      .get('/api/material-requests')
      .set(authHeader(other.token));
    expect(otherList.status).toBe(200);
    expect(otherList.body.data.items).toHaveLength(0);

    const adminList = await request(app)
      .get('/api/material-requests')
      .set(authHeader(admin.token));
    expect(adminList.status).toBe(200);
    expect(adminList.body.data.items.map((item: any) => item.id)).toContain(requestId);
    expect(adminList.body.data.meta.total).toBe(1);

    const reviewed = await request(app)
      .post(`/api/material-requests/${requestId}/review`)
      .set(authHeader(admin.token));
    expect(reviewed.status).toBe(200);
    expect(reviewed.body.data.request.status).toBe('UNDER_REVIEW');

    const scheduled = await request(app)
      .post(`/api/material-requests/${requestId}/schedule-inspection`)
      .set(authHeader(admin.token))
      .send({ scheduledAt: new Date(Date.now() + 86_400_000).toISOString() });
    expect(scheduled.status).toBe(200);
    expect(scheduled.body.data.request.status).toBe('INSPECTION');

    const inspection = await request(app)
      .post(`/api/material-requests/${requestId}/inspection`)
      .set(authHeader(admin.token))
      .send({ actualWeight: 100, materialType: 'metal', grade: 'A', quality: 'GOOD' });
    expect(inspection.status).toBe(201);
    expect(inspection.body.data.inspection.actualWeight).toBe(100);
    expect(inspection.body.data.inspection.request).toBe(requestId);

    const offer = await request(app)
      .post(`/api/material-requests/${requestId}/offer`)
      .set(authHeader(admin.token))
      .send({
        verifiedWeight: 100,
        pricePerKg: 2.5,
        pickupDate: new Date(Date.now() + 172_800_000).toISOString(),
        paymentMethod: 'CASH',
        totalPurchasePrice: 1,
      });
    expect(offer.status).toBe(201);
    expect(offer.body.data.offer.totalPurchasePrice).toBe(250);
    expect(offer.body.data.offer.status).toBe('PENDING');

    const wrongOwner = await request(app)
      .post(`/api/material-requests/${requestId}/accept-offer`)
      .set(authHeader(other.token));
    expect(wrongOwner.status).toBe(403);

    const accepted = await request(app)
      .post(`/api/material-requests/${requestId}/accept-offer`)
      .set(authHeader(customer.token));
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.request.status).toBe('ACCEPTED');
    expect(accepted.body.data.offer.status).toBe('ACCEPTED');

    const notifications = await request(app)
      .get('/api/notifications')
      .set(authHeader(customer.token));
    expect(notifications.status).toBe(200);
    const types = notifications.body.data.items.map((item: any) => item.type);
    expect(types).toContain('INSPECTION_SCHEDULED');
    expect(types).toContain('OFFER_RECEIVED');

    const unread = await request(app)
      .get('/api/notifications/unread-count')
      .set(authHeader(customer.token));
    expect(unread.status).toBe(200);
    expect(unread.body.data.count).toBeGreaterThan(0);

    const purchased = await request(app)
      .post(`/api/material-requests/${requestId}/purchase`)
      .set(authHeader(admin.token));
    expect(purchased.status).toBe(200);
    expect(purchased.body.data.request.status).toBe('PURCHASED');

    const rawList = await request(app)
      .get('/api/raw-inventory')
      .set(authHeader(admin.token));
    expect(rawList.status).toBe(200);
    const inventory = rawList.body.data.items.find(
      (item: any) => item.purchaseRequest === requestId
    );
    expect(inventory).toBeDefined();
    expect(inventory.purchaseWeight).toBe(100);
    expect(inventory.purchasePrice).toBe(250);

    const completed = await request(app)
      .post(`/api/material-requests/${requestId}/complete`)
      .set(authHeader(admin.token));
    expect(completed.status).toBe(200);
    expect(completed.body.data.request.status).toBe('COMPLETED');

    const reReview = await request(app)
      .post(`/api/material-requests/${requestId}/review`)
      .set(authHeader(admin.token));
    expect(reReview.status).toBe(409);
    expect(reReview.body.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('rejects invalid state transitions at each step', async () => {
    const created = await submitRequest(customer.token);
    const requestId = created.body.data.request.id as string;

    const offerFirst = await request(app)
      .post(`/api/material-requests/${requestId}/offer`)
      .set(authHeader(admin.token))
      .send({
        verifiedWeight: 10,
        pricePerKg: 1,
        pickupDate: new Date(Date.now() + 86_400_000).toISOString(),
        paymentMethod: 'CASH',
      });
    expect(offerFirst.status).toBe(409);
    expect(offerFirst.body.code).toBe('INVALID_STATE_TRANSITION');

    const acceptWithoutOffer = await request(app)
      .post(`/api/material-requests/${requestId}/accept-offer`)
      .set(authHeader(customer.token));
    expect(acceptWithoutOffer.status).toBe(409);
    expect(acceptWithoutOffer.body.code).toBe('INVALID_STATE_TRANSITION');

    const purchaseEarly = await request(app)
      .post(`/api/material-requests/${requestId}/purchase`)
      .set(authHeader(admin.token));
    expect(purchaseEarly.status).toBe(409);

    const completeEarly = await request(app)
      .post(`/api/material-requests/${requestId}/complete`)
      .set(authHeader(admin.token));
    expect(completeEarly.status).toBe(409);

    const reviewTwice = await request(app)
      .post(`/api/material-requests/${requestId}/review`)
      .set(authHeader(admin.token));
    expect(reviewTwice.status).toBe(200);
    const reviewAgain = await request(app)
      .post(`/api/material-requests/${requestId}/review`)
      .set(authHeader(admin.token));
    expect(reviewAgain.status).toBe(409);
    expect(reviewAgain.body.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('rejects a request with a reason and blocks further transitions', async () => {
    const created = await submitRequest(customer.token);
    const requestId = created.body.data.request.id as string;

    const rejected = await request(app)
      .post(`/api/material-requests/${requestId}/reject`)
      .set(authHeader(admin.token))
      .send({ reason: 'Material is contaminated' });
    expect(rejected.status).toBe(200);
    expect(rejected.body.data.request.status).toBe('REJECTED');
    expect(rejected.body.data.request.rejectionReason).toBe('Material is contaminated');

    const reviewAfterReject = await request(app)
      .post(`/api/material-requests/${requestId}/review`)
      .set(authHeader(admin.token));
    expect(reviewAfterReject.status).toBe(409);

    const missingReason = await submitRequest(customer.token);
    const rejectedNoReason = await request(app)
      .post(`/api/material-requests/${missingReason.body.data.request.id}/reject`)
      .set(authHeader(admin.token))
      .send({ reason: 'x' });
    expect(rejectedNoReason.status).toBe(400);
    expect(rejectedNoReason.body.errors.reason).toBeDefined();
  });

  it('returns an offer to review when the owner rejects it', async () => {
    const created = await submitRequest(customer.token);
    const requestId = created.body.data.request.id as string;

    await request(app)
      .post(`/api/material-requests/${requestId}/review`)
      .set(authHeader(admin.token));
    const offer = await request(app)
      .post(`/api/material-requests/${requestId}/offer`)
      .set(authHeader(admin.token))
      .send({
        verifiedWeight: 50,
        pricePerKg: 3,
        pickupDate: new Date(Date.now() + 86_400_000).toISOString(),
        paymentMethod: 'BANK_TRANSFER',
      });
    expect(offer.status).toBe(201);

    const rejectedOffer = await request(app)
      .post(`/api/material-requests/${requestId}/reject-offer`)
      .set(authHeader(customer.token));
    expect(rejectedOffer.status).toBe(200);
    expect(rejectedOffer.body.data.request.status).toBe('UNDER_REVIEW');
    expect(rejectedOffer.body.data.offer.status).toBe('REJECTED');

    const secondOffer = await request(app)
      .post(`/api/material-requests/${requestId}/offer`)
      .set(authHeader(admin.token))
      .send({
        verifiedWeight: 50,
        pricePerKg: 3.5,
        pickupDate: new Date(Date.now() + 86_400_000).toISOString(),
        paymentMethod: 'BANK_TRANSFER',
      });
    expect(secondOffer.status).toBe(201);
    expect(secondOffer.body.data.offer.totalPurchasePrice).toBe(175);
  });

  it('scopes offers to the owner and inspections to admins', async () => {
    const created = await submitRequest(customer.token);
    const requestId = created.body.data.request.id as string;
    await request(app)
      .post(`/api/material-requests/${requestId}/review`)
      .set(authHeader(admin.token));
    await request(app)
      .post(`/api/material-requests/${requestId}/offer`)
      .set(authHeader(admin.token))
      .send({
        verifiedWeight: 20,
        pricePerKg: 4,
        pickupDate: new Date(Date.now() + 86_400_000).toISOString(),
        paymentMethod: 'CHECK',
      });

    const ownOffers = await request(app)
      .get('/api/offers')
      .set(authHeader(customer.token));
    expect(ownOffers.status).toBe(200);
    expect(ownOffers.body.data.items).toHaveLength(1);

    const otherOffers = await request(app)
      .get('/api/offers')
      .set(authHeader(other.token));
    expect(otherOffers.status).toBe(200);
    expect(otherOffers.body.data.items).toHaveLength(0);

    const customerInspections = await request(app)
      .get('/api/inspections')
      .set(authHeader(customer.token));
    expect(customerInspections.status).toBe(403);
    expect(customerInspections.body.code).toBe('FORBIDDEN');

    const adminInspections = await request(app)
      .get('/api/inspections')
      .set(authHeader(admin.token));
    expect(adminInspections.status).toBe(200);
    expect(adminInspections.body.data.items).toHaveLength(0);
  });

  it('validates request payloads', async () => {
    const invalid = await submitRequest(customer.token, { approximateWeight: -5 });
    expect(invalid.status).toBe(400);
    expect(invalid.body.code).toBe('VALIDATION_ERROR');
    expect(invalid.body.errors.approximateWeight).toBeDefined();

    const missingField = await submitRequest(customer.token, { location: undefined });
    expect(missingField.status).toBe(400);
    expect(missingField.body.errors.location).toBeDefined();

    const adminOnly = await request(app)
      .post('/api/material-requests')
      .set(authHeader(admin.token))
      .send(requestBody());
    expect(adminOnly.status).toBe(403);
    expect(adminOnly.body.code).toBe('FORBIDDEN');
  });

  it('marks notifications read', async () => {
    const created = await submitRequest(customer.token);
    const requestId = created.body.data.request.id as string;
    await request(app)
      .post(`/api/material-requests/${requestId}/review`)
      .set(authHeader(admin.token));

    const list = await request(app)
      .get('/api/notifications')
      .set(authHeader(customer.token));
    const first = list.body.data.items[0];

    const marked = await request(app)
      .post(`/api/notifications/${first.id}/read`)
      .set(authHeader(customer.token));
    expect(marked.status).toBe(200);

    const afterMark = await request(app)
      .get('/api/notifications')
      .set(authHeader(customer.token));
    expect(afterMark.body.data.items.find((item: any) => item.id === first.id).read).toBe(true);

    const allRead = await request(app)
      .post('/api/notifications/read-all')
      .set(authHeader(customer.token));
    expect(allRead.status).toBe(200);

    const unread = await request(app)
      .get('/api/notifications/unread-count')
      .set(authHeader(customer.token));
    expect(unread.body.data.count).toBe(0);
  });
});
