import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';
import {
  authHeader,
  buildApp,
  clearDb,
  registerUser,
  setCookieHeader,
  setupTestDb,
  teardownTestDb,
  setUserStatus,
} from './helpers.js';
import { outbox, resetOutbox } from '../src/services/email.service.js';

let app: Express;

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearDb();
  resetOutbox();
  app = buildApp();
});

const weakPasswordPayload = {
  name: 'Weak Password',
  email: 'weak@test.dev',
  phone: '+15550009999',
  password: 'short',
  confirmPassword: 'short',
};

describe('auth', () => {
  it('registers a customer and returns the user, access token and refresh cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Ada Lovelace',
        email: 'Ada@Test.dev',
        phone: '+15550001234',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('ada@test.dev');
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.user.status).toBe('active');
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(typeof res.body.data.accessToken).toBe('string');

    const cookie = setCookieHeader(res).find((c) => c.startsWith('mm_refresh='));
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/httponly/i);
    expect(cookie).toMatch(/path=\/api\/auth/i);
  });

  it('rejects duplicate emails with 409 CONFLICT', async () => {
    await registerUser(app, { email: 'dupe@test.dev' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate',
        email: 'dupe@test.dev',
        phone: '+15550001234',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('CONFLICT');
    expect(typeof res.body.message).toBe('string');
  });

  it('returns field errors for a weak password', async () => {
    const res = await request(app).post('/api/auth/register').send(weakPasswordPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toBeDefined();
    expect(Object.keys(res.body.errors).length).toBeGreaterThan(0);
  });

  it('rejects mismatched passwords with field errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Mismatch',
        email: 'mismatch@test.dev',
        phone: '+15550001234',
        password: 'Password123!',
        confirmPassword: 'Password1234!',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.confirmPassword).toBeDefined();
  });

  it('logs in, exposes the profile and refreshes the session', async () => {
    const account = await registerUser(app);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: account.email, password: account.password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.id).toBe(account.id);
    expect(typeof loginRes.body.data.accessToken).toBe('string');

    const meRes = await request(app)
      .get('/api/auth/me')
      .set(authHeader(loginRes.body.data.accessToken));
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.id).toBe(account.id);

    const cookie = setCookieHeader(loginRes).find((c) => c.startsWith('mm_refresh='));
    expect(cookie).toBeDefined();

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie!.split(';')[0]);
    expect(refreshRes.status).toBe(200);
    expect(typeof refreshRes.body.data.accessToken).toBe('string');

    const refreshedMe = await request(app)
      .get('/api/auth/me')
      .set(authHeader(refreshRes.body.data.accessToken));
    expect(refreshedMe.status).toBe(200);

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie!.split(';')[0]);
    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie!.split(';')[0]);
    expect(refreshAfterLogout.status).toBe(401);
  });

  it('rejects bad credentials without leaking which field was wrong', async () => {
    const account = await registerUser(app);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: account.email, password: 'NotThePassword1' });
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.code).toBe('INVALID_CREDENTIALS');

    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.dev', password: 'Password123!' });
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('requires authentication for protected routes', async () => {
    const missing = await request(app).get('/api/auth/me');
    expect(missing.status).toBe(401);
    expect(missing.body.code).toBe('UNAUTHORIZED');

    const garbage = await request(app)
      .get('/api/auth/me')
      .set(authHeader('not-a-jwt'));
    expect(garbage.status).toBe(401);

    const wrongSecret = await request(app)
      .get('/api/auth/me')
      .set(
        authHeader(
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NGI2YTZiNmM3YTdlOGFlMzIyZGVkYTAiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMDAwMH0.9kQ4tG3RL5Qq3r4bF1r2v8xJ4vK5tM7nP9sR2uW3xY0'
        )
      );
    expect(wrongSecret.status).toBe(401);
  });

  it('locks an account after five failed logins', async () => {
    const account = await registerUser(app);

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: account.email, password: `WrongPass${attempt}!` });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    }

    const fifth = await request(app)
      .post('/api/auth/login')
      .send({ email: account.email, password: 'StillWrong1!' });
    expect(fifth.status).toBe(401);
    expect(fifth.body.code).toBe('ACCOUNT_LOCKED');

    const freshApp = buildApp();
    const correctButLocked = await request(freshApp)
      .post('/api/auth/login')
      .send({ email: account.email, password: account.password });
    expect(correctButLocked.status).toBe(401);
    expect(correctButLocked.body.code).toBe('ACCOUNT_LOCKED');
  });

  it('rate limits repeated login attempts from one IP', async () => {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `flood-${attempt}@test.dev`, password: 'Password123!' });
      expect(res.status).toBe(401);
    }

    const blocked = await request(app)
      .post('/api/auth/login')
      .send({ email: 'flood-6@test.dev', password: 'Password123!' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
  });

  it('resets a password through the emailed token', async () => {
    const account = await registerUser(app);

    const forgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: account.email });
    expect(forgot.status).toBe(200);

    const email = outbox.find((message) => message.to === account.email);
    expect(email).toBeDefined();
    const tokenMatch = /reset-password\?token=([A-Za-z0-9_-]+)/.exec(email!.text);
    expect(tokenMatch).not.toBeNull();
    const token = tokenMatch![1];

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'BrandNewPass1!', confirmPassword: 'BrandNewPass1!' });
    expect(reset.status).toBe(200);

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: account.email, password: account.password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: account.email, password: 'BrandNewPass1!' });
    expect(newLogin.status).toBe(200);

    const reuse = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'AnotherPass1!', confirmPassword: 'AnotherPass1!' });
    expect(reuse.status).toBe(400);
    expect(reuse.body.code).toBe('VALIDATION_ERROR');
  });

  it('never reveals whether an email exists during password reset', async () => {
    const unknown = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@test.dev' });
    expect(unknown.status).toBe(200);
    expect(outbox).toHaveLength(0);
  });

  it('changes password and updates the profile', async () => {
    const account = await registerUser(app);

    const wrongCurrent = await request(app)
      .post('/api/auth/change-password')
      .set(authHeader(account.token))
      .send({
        currentPassword: 'NopeNotIt1!',
        password: 'ChangedPass1!',
        confirmPassword: 'ChangedPass1!',
      });
    expect(wrongCurrent.status).toBe(400);
    expect(wrongCurrent.body.errors.currentPassword).toBeDefined();

    const changed = await request(app)
      .post('/api/auth/change-password')
      .set(authHeader(account.token))
      .send({
        currentPassword: account.password,
        password: 'ChangedPass1!',
        confirmPassword: 'ChangedPass1!',
      });
    expect(changed.status).toBe(200);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: account.email, password: 'ChangedPass1!' });
    expect(newLogin.status).toBe(200);

    const profile = await request(app)
      .patch('/api/auth/me')
      .set(authHeader(account.token))
      .send({ name: 'Renamed Person' });
    expect(profile.status).toBe(200);
    expect(profile.body.data.user.name).toBe('Renamed Person');
    expect(profile.body.data.user).not.toHaveProperty('password');
  });

  it('blocks suspended users from logging in', async () => {
    const account = await registerUser(app);
    await setUserStatus(account.id, 'suspended');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: account.email, password: account.password });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ACCOUNT_SUSPENDED');
  });
});
