import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';
import {
  authHeader,
  buildApp,
  clearDb,
  makeAdmin,
  registerUser,
  seedPurchasedRequest,
  seedProcessedMaterial,
  setupTestDb,
  teardownTestDb,
  type TestAccount,
} from './helpers.js';

let app: Express;
let admin: TestAccount;
let customer: TestAccount;

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearDb();
  app = buildApp();
  admin = await registerUser(app, { name: 'Inventory Admin' });
  await makeAdmin(admin.id);
  customer = await registerUser(app, { name: 'Seller' });
});

describe('raw inventory', () => {
  it('is created from a purchased request with verified weight and price', async () => {
    const seed = await seedPurchasedRequest(app, admin.token, customer.token, {
      weight: 80,
      pricePerKg: 3,
    });

    const res = await request(app)
      .get('/api/raw-inventory')
      .set(authHeader(admin.token));
    expect(res.status).toBe(200);
    const item = res.body.data.items.find((entry: any) => entry.id === seed.inventoryId);
    expect(item).toBeDefined();
    expect(item.purchaseWeight).toBe(80);
    expect(item.currentWeight).toBe(80);
    expect(item.pricePerKg).toBe(3);
    expect(item.purchasePrice).toBe(240);
    expect(item.status).toBe('PURCHASED');
    expect(item.materialType).toBe('metal');
  });

  it('is admin only', async () => {
    const asCustomer = await request(app)
      .get('/api/raw-inventory')
      .set(authHeader(customer.token));
    expect(asCustomer.status).toBe(403);
    expect(asCustomer.body.code).toBe('FORBIDDEN');

    const unauthenticated = await request(app).get('/api/raw-inventory');
    expect(unauthenticated.status).toBe(401);
  });

  it('rejects a current weight above the purchased weight', async () => {
    const seed = await seedPurchasedRequest(app, admin.token, customer.token);

    const tooHeavy = await request(app)
      .patch(`/api/raw-inventory/${seed.inventoryId}`)
      .set(authHeader(admin.token))
      .send({ currentWeight: seed.weight + 10 });
    expect(tooHeavy.status).toBe(400);
    expect(tooHeavy.body.errors.currentWeight).toBeDefined();

    const valid = await request(app)
      .patch(`/api/raw-inventory/${seed.inventoryId}`)
      .set(authHeader(admin.token))
      .send({ currentWeight: seed.weight - 5, storageLocation: 'Bay 3' });
    expect(valid.status).toBe(200);
    expect(valid.body.data.inventory.currentWeight).toBe(seed.weight - 5);
    expect(valid.body.data.inventory.storageLocation).toBe('Bay 3');
  });
});

describe('processing', () => {
  it('creates a batch, tracks stages and completes with recovery metrics', async () => {
    const seed = await seedPurchasedRequest(app, admin.token, customer.token, {
      weight: 100,
      pricePerKg: 2,
    });

    const created = await request(app)
      .post('/api/processing')
      .set(authHeader(admin.token))
      .send({ rawInventory: seed.inventoryId, processingType: 'Shredding', inputWeight: 100 });
    expect(created.status).toBe(201);
    expect(created.body.data.batch.status).toBe('PENDING');
    expect(created.body.data.batch.batchId).toMatch(/^BAT-/);
    expect(created.body.data.batch.inputWeight).toBe(100);

    const duplicate = await request(app)
      .post('/api/processing')
      .set(authHeader(admin.token))
      .send({ rawInventory: seed.inventoryId, processingType: 'Shredding', inputWeight: 10 });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe('CONFLICT');

    const started = await request(app)
      .patch(`/api/processing/${created.body.data.batch.id}`)
      .set(authHeader(admin.token))
      .send({ status: 'IN_PROGRESS', stage: 'CLEANING' });
    expect(started.status).toBe(200);
    expect(started.body.data.batch.status).toBe('IN_PROGRESS');
    expect(started.body.data.batch.stage).toBe('CLEANING');
    expect(started.body.data.batch.startedAt).not.toBeNull();

    const badTransition = await request(app)
      .patch(`/api/processing/${created.body.data.batch.id}`)
      .set(authHeader(admin.token))
      .send({ status: 'PENDING' });
    expect(badTransition.status).toBe(409);
    expect(badTransition.body.code).toBe('INVALID_STATE_TRANSITION');

    const completed = await request(app)
      .post(`/api/processing/${created.body.data.batch.id}/complete`)
      .set(authHeader(admin.token))
      .send({ outputWeight: 75, qualityGrade: 'A' });
    expect(completed.status).toBe(200);
    expect(completed.body.data.batch.status).toBe('COMPLETED');
    expect(completed.body.data.batch.outputWeight).toBe(75);
    expect(completed.body.data.batch.lossWeight).toBe(25);
    expect(completed.body.data.batch.recoveryPercentage).toBe(75);
    expect(completed.body.data.processed.weight).toBe(75);
    expect(completed.body.data.processed.availableQuantity).toBe(75);
    expect(completed.body.data.processed.grade).toBe('A');

    const rawRes = await request(app)
      .get('/api/raw-inventory')
      .set(authHeader(admin.token));
    const raw = rawRes.body.data.items.find((entry: any) => entry.id === seed.inventoryId);
    expect(raw.status).toBe('PROCESSED');
    expect(raw.currentWeight).toBe(0);

    const completedAgain = await request(app)
      .post(`/api/processing/${created.body.data.batch.id}/complete`)
      .set(authHeader(admin.token))
      .send({ outputWeight: 10 });
    expect(completedAgain.status).toBe(409);
    expect(completedAgain.body.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('rejects input above available stock and output above input', async () => {
    const seed = await seedPurchasedRequest(app, admin.token, customer.token, { weight: 50 });

    const tooMuchInput = await request(app)
      .post('/api/processing')
      .set(authHeader(admin.token))
      .send({ rawInventory: seed.inventoryId, processingType: 'Shredding', inputWeight: 60 });
    expect(tooMuchInput.status).toBe(409);
    expect(tooMuchInput.body.code).toBe('INSUFFICIENT_INVENTORY');

    const created = await request(app)
      .post('/api/processing')
      .set(authHeader(admin.token))
      .send({ rawInventory: seed.inventoryId, processingType: 'Shredding', inputWeight: 50 });
    expect(created.status).toBe(201);

    const tooMuchOutput = await request(app)
      .post(`/api/processing/${created.body.data.batch.id}/complete`)
      .set(authHeader(admin.token))
      .send({ outputWeight: 51 });
    expect(tooMuchOutput.status).toBe(400);
    expect(tooMuchOutput.body.errors.outputWeight).toBeDefined();

    const missingInventory = await request(app)
      .post('/api/processing')
      .set(authHeader(admin.token))
      .send({
        rawInventory: '0123456789abcdef01234567',
        processingType: 'Shredding',
        inputWeight: 1,
      });
    expect(missingInventory.status).toBe(404);
  });

  it('exposes processed inventory to admins only', async () => {
    await seedProcessedMaterial(app, admin.token, customer.token, {
      weight: 60,
      outputWeight: 55,
    });

    const adminRes = await request(app)
      .get('/api/processed-inventory')
      .set(authHeader(admin.token));
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.data.items).toHaveLength(1);
    expect(adminRes.body.data.items[0].availableQuantity).toBe(55);

    const customerRes = await request(app)
      .get('/api/processed-inventory')
      .set(authHeader(customer.token));
    expect(customerRes.status).toBe(403);
  });
});

describe('marketplace listings', () => {
  it('only lists processed material and caps quantity at available stock', async () => {
    const processed = await seedProcessedMaterial(app, admin.token, customer.token, {
      weight: 100,
      outputWeight: 70,
    });

    const fromRaw = await request(app)
      .post('/api/marketplace')
      .set(authHeader(admin.token))
      .send({
        processedMaterial: processed.inventoryId,
        productName: 'Raw copper',
        description: 'Trying to list raw inventory directly',
        pricePerKg: 4,
        availableQuantity: 50,
        minOrderQuantity: 1,
        publish: true,
      });
    expect(fromRaw.status).toBe(404);
    expect(fromRaw.body.code).toBe('NOT_FOUND');

    const tooMuchQuantity = await request(app)
      .post('/api/marketplace')
      .set(authHeader(admin.token))
      .send({
        processedMaterial: processed.processedId,
        productName: 'Recycled copper',
        description: 'High purity recycled copper granules',
        pricePerKg: 5,
        availableQuantity: 500,
        minOrderQuantity: 1,
      });
    expect(tooMuchQuantity.status).toBe(201);
    expect(tooMuchQuantity.body.data.listing.availableQuantity).toBe(70);

    const badMinOrder = await request(app)
      .post('/api/marketplace')
      .set(authHeader(admin.token))
      .send({
        processedMaterial: processed.processedId,
        productName: 'Recycled copper again',
        description: 'High purity recycled copper granules',
        pricePerKg: 5,
        availableQuantity: 70,
        minOrderQuantity: 80,
      });
    expect(badMinOrder.status).toBe(400);
    expect(badMinOrder.body.errors.minOrderQuantity).toBeDefined();
  });

  it('keeps drafts out of the public marketplace and publishes published listings', async () => {
    const processed = await seedProcessedMaterial(app, admin.token, customer.token, {
      weight: 40,
      outputWeight: 30,
    });

    const draft = await request(app)
      .post('/api/marketplace')
      .set(authHeader(admin.token))
      .send({
        processedMaterial: processed.processedId,
        productName: 'Draft copper granules',
        description: 'A draft listing that should stay private',
        pricePerKg: 6,
        availableQuantity: 30,
        minOrderQuantity: 1,
        publish: false,
      });
    expect(draft.status).toBe(201);
    expect(draft.body.data.listing.status).toBe('DRAFT');

    const publicList = await request(app).get('/api/marketplace');
    expect(publicList.status).toBe(200);
    expect(publicList.body.data.items).toHaveLength(0);

    const draftId = draft.body.data.listing.id;
    const draftPublicView = await request(app).get(`/api/marketplace/${draftId}`);
    expect(draftPublicView.status).toBe(404);

    const published = await request(app)
      .patch(`/api/marketplace/${draftId}`)
      .set(authHeader(admin.token))
      .send({ status: 'PUBLISHED' });
    expect(published.status).toBe(200);
    expect(published.body.data.listing.status).toBe('PUBLISHED');

    const afterPublish = await request(app).get('/api/marketplace');
    expect(afterPublish.body.data.items).toHaveLength(1);
    expect(afterPublish.body.data.items[0].id).toBe(draftId);
    expect(afterPublish.body.data.items[0].processedMaterial).toBe(processed.processedId);

    const adminList = await request(app)
      .get('/api/marketplace/admin')
      .set(authHeader(admin.token));
    expect(adminList.status).toBe(200);
    expect(adminList.body.data.items).toHaveLength(1);

    const customerAdminList = await request(app)
      .get('/api/marketplace/admin')
      .set(authHeader(customer.token));
    expect(customerAdminList.status).toBe(403);
  });

  it('validates listing payloads', async () => {
    const processed = await seedProcessedMaterial(app, admin.token, customer.token);

    const invalid = await request(app)
      .post('/api/marketplace')
      .set(authHeader(admin.token))
      .send({
        processedMaterial: processed.processedId,
        productName: 'x',
        description: 'too short',
        pricePerKg: -1,
        availableQuantity: 0,
        minOrderQuantity: 1,
      });
    expect(invalid.status).toBe(400);
    expect(invalid.body.code).toBe('VALIDATION_ERROR');

    const asCustomer = await request(app)
      .post('/api/marketplace')
      .set(authHeader(customer.token))
      .send({
        processedMaterial: processed.processedId,
        productName: 'Copper granules',
        description: 'High purity recycled copper granules',
        pricePerKg: 5,
        availableQuantity: 10,
        minOrderQuantity: 1,
      });
    expect(asCustomer.status).toBe(403);
  });
});
