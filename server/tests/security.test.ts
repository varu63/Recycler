import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import {
  authHeader,
  buildApp,
  clearDb,
  jpegBuffer,
  makeAdmin,
  pngBuffer,
  registerUser,
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
  admin = await registerUser(app, { name: 'Security Admin' });
  await makeAdmin(admin.id);
  customer = await registerUser(app, { name: 'Regular Customer' });
});

const adminOnlyGet = [
  '/api/admin/dashboard',
  '/api/admin/users',
  '/api/admin/audit-logs',
  '/api/admin/reports',
  '/api/admin/settings',
  '/api/raw-inventory',
  '/api/processing',
  '/api/processed-inventory',
  '/api/inspections',
  '/api/marketplace/admin',
];

describe('authorization', () => {
  it('blocks customers from every admin route', async () => {
    for (const path of adminOnlyGet) {
      const res = await request(app).get(path).set(authHeader(customer.token));
      expect(res.status, `${path} should be forbidden for customers`).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.success).toBe(false);
    }

    const statusPatch = await request(app)
      .patch(`/api/admin/users/${admin.id}/status`)
      .set(authHeader(customer.token))
      .send({ status: 'suspended' });
    expect(statusPatch.status).toBe(403);

    const listingCreate = await request(app)
      .post('/api/marketplace')
      .set(authHeader(customer.token))
      .send({
        processedMaterial: '0123456789abcdef01234567',
        productName: 'Sneaky listing',
        description: 'Trying to publish without admin role',
        pricePerKg: 1,
        availableQuantity: 1,
        minOrderQuantity: 1,
      });
    expect(listingCreate.status).toBe(403);

    const orderStatus = await request(app)
      .patch('/api/orders/0123456789abcdef01234567/status')
      .set(authHeader(customer.token))
      .send({ status: 'CONFIRMED' });
    expect(orderStatus.status).toBe(403);

    const processingCreate = await request(app)
      .post('/api/processing')
      .set(authHeader(customer.token))
      .send({ rawInventory: '0123456789abcdef01234567', processingType: 'Shredding', inputWeight: 1 });
    expect(processingCreate.status).toBe(403);
  });

  it('requires a token on protected routes', async () => {
    for (const path of [...adminOnlyGet, '/api/material-requests', '/api/orders', '/api/notifications']) {
      const res = await request(app).get(path);
      expect(res.status, `${path} should require authentication`).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    }
  });

  it('rejects forged, expired and malformed tokens', async () => {
    const malformed = await request(app)
      .get('/api/auth/me')
      .set(authHeader('bm90LWEtand0'));
    expect(malformed.status).toBe(401);

    const wrongSecret = jwt.sign(
      { sub: customer.id, role: 'admin' },
      'a-completely-different-secret-value-0123456789',
      { expiresIn: '15m' }
    );
    const forged = await request(app).get('/api/auth/me').set(authHeader(wrongSecret));
    expect(forged.status).toBe(401);

    const expired = jwt.sign(
      { sub: customer.id, role: 'admin' },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '-1h' }
    );
    const stale = await request(app).get('/api/auth/me').set(authHeader(expired));
    expect(stale.status).toBe(401);
  });

  it('rejects invalid object ids with a validation error', async () => {
    const res = await request(app)
      .get('/api/material-requests/not-an-object-id')
      .set(authHeader(customer.token));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.id).toBeDefined();
  });
});

describe('injection and input hardening', () => {
  it('rejects operator objects in login credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects operator objects in list queries', async () => {
    const statusInjection = await request(app)
      .get('/api/material-requests?status[$ne]=REJECTED')
      .set(authHeader(customer.token));
    expect(statusInjection.status).toBe(400);
    expect(statusInjection.body.code).toBe('VALIDATION_ERROR');

    const pageInjection = await request(app)
      .get('/api/orders?page[$ne]=1')
      .set(authHeader(customer.token));
    expect(pageInjection.status).toBe(400);

    const adminInjection = await request(app)
      .get('/api/admin/users?role[$ne]=customer')
      .set(authHeader(admin.token));
    expect(adminInjection.status).toBe(400);
  });

  it('never exposes password hashes or lock metadata', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: customer.email, password: customer.password });
    expect(login.status).toBe(200);
    const serialized = JSON.stringify(login.body);
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('failedLoginAttempts');
    expect(serialized).not.toContain('lockedUntil');

    const users = await request(app)
      .get('/api/admin/users')
      .set(authHeader(admin.token));
    expect(users.status).toBe(200);
    expect(JSON.stringify(users.body)).not.toContain('"password"');
  });
});

describe('upload security', () => {
  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/uploads/images')
      .attach('files', pngBuffer(), { filename: 'photo.png', contentType: 'image/png' });
    expect(res.status).toBe(401);
  });

  it('rejects disallowed file extensions', async () => {
    const res = await request(app)
      .post('/api/uploads/images')
      .set(authHeader(customer.token))
      .attach('files', Buffer.from('plain text content'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects files whose bytes do not match the declared type', async () => {
    const res = await request(app)
      .post('/api/uploads/images')
      .set(authHeader(customer.token))
      .attach('files', Buffer.from('this is definitely not a png image'), {
        filename: 'spoof.png',
        contentType: 'image/png',
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not match/i);
  });

  it('rejects oversized files and too many files', async () => {
    const oversized = Buffer.concat([
      pngBuffer(),
      Buffer.alloc(5 * 1024 * 1024 + 1024, 0x41),
    ]);
    const tooBig = await request(app)
      .post('/api/uploads/images')
      .set(authHeader(customer.token))
      .attach('files', oversized, { filename: 'huge.png', contentType: 'image/png' });
    expect(tooBig.status).toBe(400);
    expect(tooBig.body.message).toMatch(/5MB or less/);

    const tooMany = request(app)
      .post('/api/uploads/images')
      .set(authHeader(customer.token));
    for (let index = 1; index <= 7; index += 1) {
      tooMany.attach('files', pngBuffer(), {
        filename: `photo-${index}.png`,
        contentType: 'image/png',
      });
    }
    const res = await tooMany;
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/maximum of 6/);
  });

  it('accepts valid png and jpeg images', async () => {
    const res = await request(app)
      .post('/api/uploads/images')
      .set(authHeader(customer.token))
      .attach('files', pngBuffer(), { filename: 'first.png', contentType: 'image/png' })
      .attach('files', jpegBuffer(), { filename: 'second.jpeg', contentType: 'image/jpeg' });
    expect(res.status).toBe(201);
    expect(res.body.data.images).toHaveLength(2);
    for (const image of res.body.data.images) {
      expect(image.url).toMatch(/^\/uploads\//);
    }
  });
});

describe('transport security', () => {
  it('sets helmet headers and hides framework fingerprints', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['referrer-policy']).toBe('no-referrer');
  });

  it('only allows the configured client origin', async () => {
    const allowed = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');

    const blocked = await request(app)
      .get('/api/health')
      .set('Origin', 'https://evil.example');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers health checks without authentication', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok' }, message: 'OK' });
  });
});

describe('admin operations', () => {
  it('suspends and restores a user account', async () => {
    const suspended = await request(app)
      .patch(`/api/admin/users/${customer.id}/status`)
      .set(authHeader(admin.token))
      .send({ status: 'suspended' });
    expect(suspended.status).toBe(200);
    expect(suspended.body.data.user.status).toBe('suspended');

    const blocked = await request(app)
      .get('/api/auth/me')
      .set(authHeader(customer.token));
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('ACCOUNT_SUSPENDED');

    const restored = await request(app)
      .patch(`/api/admin/users/${customer.id}/status`)
      .set(authHeader(admin.token))
      .send({ status: 'active' });
    expect(restored.status).toBe(200);
    expect(restored.body.data.user.status).toBe('active');

    const backIn = await request(app)
      .get('/api/auth/me')
      .set(authHeader(customer.token));
    expect(backIn.status).toBe(200);
  });

  it('refuses self-suspension and invalid statuses', async () => {
    const selfSuspension = await request(app)
      .patch(`/api/admin/users/${admin.id}/status`)
      .set(authHeader(admin.token))
      .send({ status: 'suspended' });
    expect(selfSuspension.status).toBe(400);

    const invalidStatus = await request(app)
      .patch(`/api/admin/users/${customer.id}/status`)
      .set(authHeader(admin.token))
      .send({ status: 'locked' });
    expect(invalidStatus.status).toBe(400);
    expect(invalidStatus.body.errors.status).toBeDefined();
  });

  it('serves dashboard, reports, settings and audit logs to admins', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: customer.email, password: customer.password });

    const dashboard = await request(app)
      .get('/api/admin/dashboard')
      .set(authHeader(admin.token));
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.stats).toBeDefined();
    expect(dashboard.body.data.stats.totalUsers).toBeGreaterThanOrEqual(2);
    expect(dashboard.body.data.charts).toBeDefined();

    const reports = await request(app)
      .get('/api/admin/reports')
      .set(authHeader(admin.token));
    expect(reports.status).toBe(200);
    expect(reports.body.data.totalRequests).toBe(0);
    expect(reports.body.data.totalRevenue).toBe(0);

    const settings = await request(app)
      .get('/api/admin/settings')
      .set(authHeader(admin.token));
    expect(settings.status).toBe(200);
    expect(settings.body.data.uploads.maxFiles).toBe(6);
    expect(settings.body.data.imageStorage).toBe('local');

    const audit = await request(app)
      .get('/api/admin/audit-logs')
      .set(authHeader(admin.token));
    expect(audit.status).toBe(200);
    expect(audit.body.data.items.length).toBeGreaterThan(0);
    expect(audit.body.data.meta).toMatchObject({ page: 1, limit: 12 });
    const actions = audit.body.data.items.map((entry: any) => entry.action);
    expect(actions).toContain('USER_REGISTERED');
    expect(actions).toContain('USER_LOGIN');
  });
});
