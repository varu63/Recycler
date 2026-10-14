import { randomUUID } from 'crypto';
import type { Express } from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';

let mongod: MongoMemoryServer | null = null;

export async function setupTestDb(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

export async function teardownTestDb(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

export async function clearDb(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export function buildApp(): Express {
  return createApp();
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export interface TestAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  token: string;
  cookie?: string;
}

export async function registerUser(
  app: Express,
  overrides: Partial<{ name: string; email: string; phone: string; password: string }> = {}
): Promise<TestAccount> {
  const password = overrides.password ?? 'Password123!';
  const payload = {
    name: overrides.name ?? `User ${randomUUID().slice(0, 8)}`,
    email: overrides.email ?? `user-${randomUUID()}@test.dev`,
    phone: overrides.phone ?? '+15550001111',
    password,
    confirmPassword: password,
  };

  const res = await request(app).post('/api/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    id: res.body.data.user.id as string,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password,
    token: res.body.data.accessToken as string,
    cookie: extractRefreshCookie(res),
  };
}

export async function makeAdmin(userId: string): Promise<void> {
  await mongoose.connection.db
    ?.collection('users')
    .updateOne({ _id: new mongoose.Types.ObjectId(userId) }, { $set: { role: 'admin' } });
}

export async function setUserStatus(userId: string, status: string): Promise<void> {
  await mongoose.connection.db
    ?.collection('users')
    .updateOne({ _id: new mongoose.Types.ObjectId(userId) }, { $set: { status } });
}

export async function login(
  app: Express,
  email: string,
  password: string
): Promise<request.Response> {
  return request(app).post('/api/auth/login').send({ email, password });
}

export function setCookieHeader(res: request.Response): string[] {
  const header = (res.headers as Record<string, unknown>)['set-cookie'];
  if (Array.isArray(header)) return header as string[];
  if (typeof header === 'string' && header.length > 0) return [header];
  return [];
}

export function extractRefreshCookie(res: request.Response): string | undefined {
  const refresh = setCookieHeader(res).find((cookie) => cookie.startsWith('mm_refresh='));
  return refresh ? refresh.split(';')[0] : undefined;
}

export interface SeedOptions {
  listings?: number;
}

export function pngBuffer(size = 64): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([signature, Buffer.alloc(Math.max(0, size - signature.length), 0x42)]);
}

export function jpegBuffer(size = 64): Buffer {
  const signature = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  return Buffer.concat([signature, Buffer.alloc(Math.max(0, size - signature.length), 0x43)]);
}

export const shippingAddress = {
  fullName: 'Test Buyer',
  line1: '12 Harbor Road',
  city: 'Mumbai',
  state: 'MH',
  postalCode: '400001',
  country: 'India',
  phone: '+15550002222',
};

function expectStatus(res: request.Response, status: number): request.Response {
  if (res.status !== status) {
    throw new Error(
      `expected ${status} but got ${res.status}: ${JSON.stringify(res.body)}`
    );
  }
  return res;
}

export function materialRequestBody(overrides: Record<string, unknown> = {}) {
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

export async function submitMaterialRequest(
  app: Express,
  token: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const res = await request(app)
    .post('/api/material-requests')
    .set(authHeader(token))
    .send(materialRequestBody(overrides));
  expectStatus(res, 201);
  return res.body.data.request.id as string;
}

export interface RawSeed {
  requestId: string;
  inventoryId: string;
  weight: number;
  pricePerKg: number;
  totalPurchasePrice: number;
}

export async function seedPurchasedRequest(
  app: Express,
  adminToken: string,
  customerToken: string,
  options: { weight?: number; pricePerKg?: number } = {}
): Promise<RawSeed> {
  const weight = options.weight ?? 100;
  const pricePerKg = options.pricePerKg ?? 2.5;
  const requestId = await submitMaterialRequest(app, customerToken);

  expectStatus(
    await request(app)
      .post(`/api/material-requests/${requestId}/review`)
      .set(authHeader(adminToken)),
    200
  );
  expectStatus(
    await request(app)
      .post(`/api/material-requests/${requestId}/schedule-inspection`)
      .set(authHeader(adminToken))
      .send({ scheduledAt: new Date(Date.now() + 86_400_000).toISOString() }),
    200
  );
  expectStatus(
    await request(app)
      .post(`/api/material-requests/${requestId}/inspection`)
      .set(authHeader(adminToken))
      .send({
        actualWeight: weight,
        materialType: 'metal',
        grade: 'A',
        quality: 'GOOD',
        notes: 'Looks clean',
      }),
    201
  );
  expectStatus(
    await request(app)
      .post(`/api/material-requests/${requestId}/offer`)
      .set(authHeader(adminToken))
      .send({
        verifiedWeight: weight,
        pricePerKg,
        pickupDate: new Date(Date.now() + 172_800_000).toISOString(),
        paymentMethod: 'CASH',
      }),
    201
  );
  expectStatus(
    await request(app)
      .post(`/api/material-requests/${requestId}/accept-offer`)
      .set(authHeader(customerToken)),
    200
  );
  expectStatus(
    await request(app)
      .post(`/api/material-requests/${requestId}/purchase`)
      .set(authHeader(adminToken)),
    200
  );

  const list = await request(app)
    .get('/api/raw-inventory?limit=100')
    .set(authHeader(adminToken));
  expectStatus(list, 200);
  const inventory = (list.body.data.items as any[]).find(
    (item) => item.purchaseRequest === requestId
  );
  if (!inventory) throw new Error('raw inventory was not created for purchase');

  return {
    requestId,
    inventoryId: inventory.id,
    weight,
    pricePerKg,
    totalPurchasePrice: inventory.purchasePrice,
  };
}

export interface ProcessedSeed extends RawSeed {
  batchId: string;
  processedId: string;
  outputWeight: number;
}

export async function seedProcessedMaterial(
  app: Express,
  adminToken: string,
  customerToken: string,
  options: { weight?: number; pricePerKg?: number; outputWeight?: number } = {}
): Promise<ProcessedSeed> {
  const raw = await seedPurchasedRequest(app, adminToken, customerToken, options);
  const outputWeight = options.outputWeight ?? raw.weight;

  const created = await request(app)
    .post('/api/processing')
    .set(authHeader(adminToken))
    .send({
      rawInventory: raw.inventoryId,
      processingType: 'Shredding and sorting',
      inputWeight: raw.weight,
    });
  expectStatus(created, 201);
  const batchId = created.body.data.batch.id as string;

  expectStatus(
    await request(app)
      .patch(`/api/processing/${batchId}`)
      .set(authHeader(adminToken))
      .send({ status: 'IN_PROGRESS', stage: 'SORTING' }),
    200
  );

  const completed = await request(app)
    .post(`/api/processing/${batchId}/complete`)
    .set(authHeader(adminToken))
    .send({ outputWeight, qualityGrade: 'A' });
  expectStatus(completed, 200);

  return {
    ...raw,
    batchId,
    processedId: completed.body.data.processed.id as string,
    outputWeight,
  };
}

export interface ListingSeed extends ProcessedSeed {
  listingId: string;
  availableQuantity: number;
  listingPrice: number;
}

export async function seedListing(
  app: Express,
  adminToken: string,
  customerToken: string,
  options: {
    weight?: number;
    pricePerKg?: number;
    outputWeight?: number;
    quantity?: number;
    minOrderQuantity?: number;
    listingPrice?: number;
    publish?: boolean;
  } = {}
): Promise<ListingSeed> {
  const processed = await seedProcessedMaterial(app, adminToken, customerToken, options);
  const quantity = options.quantity ?? processed.outputWeight;
  const minOrderQuantity = options.minOrderQuantity ?? 1;
  const listingPrice = options.listingPrice ?? 5;

  const created = await request(app)
    .post('/api/marketplace')
    .set(authHeader(adminToken))
    .send({
      processedMaterial: processed.processedId,
      productName: 'Recycled copper granules',
      description: 'High purity recycled copper granules ready for resale',
      pricePerKg: listingPrice,
      availableQuantity: quantity,
      minOrderQuantity,
      publish: options.publish ?? true,
    });
  expectStatus(created, 201);

  return {
    ...processed,
    listingId: created.body.data.listing.id as string,
    availableQuantity: created.body.data.listing.availableQuantity,
    listingPrice,
  };
}
