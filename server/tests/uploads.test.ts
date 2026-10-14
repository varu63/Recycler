import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';
import {
  authHeader,
  buildApp,
  clearDb,
  jpegBuffer,
  makeAdmin,
  materialRequestBody,
  pngBuffer,
  registerUser,
  setupTestDb,
  teardownTestDb,
  type TestAccount,
} from './helpers.js';

let app: Express;
let customer: TestAccount;
let other: TestAccount;
let admin: TestAccount;

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearDb();
  app = buildApp();
  customer = await registerUser(app, { name: 'Image Seller' });
  other = await registerUser(app, { name: 'Another Seller' });
  admin = await registerUser(app, { name: 'Image Admin' });
  await makeAdmin(admin.id);
});

async function uploadPng(target: TestAccount, filename = 'photo.png') {
  return request(app)
    .post('/api/uploads/image')
    .set(authHeader(target.token))
    .attach('files', pngBuffer(), { filename, contentType: 'image/png' });
}

describe('image upload endpoint', () => {
  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/uploads/image')
      .attach('files', pngBuffer(), { filename: 'photo.png', contentType: 'image/png' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('rejects non-image extensions and executable content', async () => {
    const text = await request(app)
      .post('/api/uploads/image')
      .set(authHeader(customer.token))
      .attach('files', Buffer.from('plain text'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(text.status).toBe(400);

    const exe = await request(app)
      .post('/api/uploads/image')
      .set(authHeader(customer.token))
      .attach('files', Buffer.from('MZ\u0000\u0000'), {
        filename: 'malware.exe',
        contentType: 'application/octet-stream',
      });
    expect(exe.status).toBe(400);
  });

  it('rejects files whose bytes do not match the declared image type', async () => {
    const res = await request(app)
      .post('/api/uploads/image')
      .set(authHeader(customer.token))
      .attach('files', Buffer.from('definitely not an image'), {
        filename: 'spoof.png',
        contentType: 'image/png',
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not match/i);
  });

  it('rejects files larger than 5 MB', async () => {
    const oversized = Buffer.concat([pngBuffer(), Buffer.alloc(5 * 1024 * 1024 + 1024, 0x41)]);
    const res = await request(app)
      .post('/api/uploads/image')
      .set(authHeader(customer.token))
      .attach('files', oversized, { filename: 'huge.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/5MB or less/);
  });

  it('accepts multiple images and returns only safe metadata', async () => {
    const res = await request(app)
      .post('/api/uploads/image')
      .set(authHeader(customer.token))
      .attach('files', pngBuffer(), { filename: 'first.png', contentType: 'image/png' })
      .attach('files', jpegBuffer(), { filename: 'second.jpeg', contentType: 'image/jpeg' })
      .attach('files', pngBuffer(), { filename: 'third.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.data.images).toHaveLength(3);
    for (const image of res.body.data.images) {
      expect(image.url).toMatch(/^\/uploads\//);
      expect(image.publicId).toBeTruthy();
      expect(typeof image.bytes).toBe('number');
      expect(image.bytes).toBeGreaterThan(0);
      expect(JSON.stringify(image)).not.toMatch(/secret|api[_-]?key/i);
    }
  });
});

describe('material request image integration', () => {
  it('stores image references in MongoDB and never binary data', async () => {
    const upload = await uploadPng(customer, 'copper.png');
    const image = upload.body.data.images[0];

    const created = await request(app)
      .post('/api/material-requests')
      .set(authHeader(customer.token))
      .send(materialRequestBody({ images: [image] }));

    expect(created.status).toBe(201);
    expect(created.body.data.request.images).toHaveLength(1);
    expect(created.body.data.request.images[0].publicId).toBe(image.publicId);
    expect(created.body.data.request.images[0].bytes).toBe(image.bytes);
  });

  it('enforces user isolation: only the owner or admin can view request images', async () => {
    const upload = await uploadPng(customer, 'private.png');
    const created = await request(app)
      .post('/api/material-requests')
      .set(authHeader(customer.token))
      .send(materialRequestBody({ images: [upload.body.data.images[0]] }));
    const requestId = created.body.data.request.id as string;

    const owner = await request(app)
      .get(`/api/material-requests/${requestId}`)
      .set(authHeader(customer.token));
    expect(owner.status).toBe(200);
    expect(owner.body.data.request.images).toHaveLength(1);

    const adminView = await request(app)
      .get(`/api/material-requests/${requestId}`)
      .set(authHeader(admin.token));
    expect(adminView.status).toBe(200);
    expect(adminView.body.data.request.images).toHaveLength(1);

    const intruder = await request(app)
      .get(`/api/material-requests/${requestId}`)
      .set(authHeader(other.token));
    expect(intruder.status).toBe(404);
    expect(intruder.body.success).toBe(false);
  });

  it('rejects attaching another user image or an unknown image reference', async () => {
    const upload = await uploadPng(customer, 'shared.png');
    const image = upload.body.data.images[0];

    const foreign = await request(app)
      .post('/api/material-requests')
      .set(authHeader(other.token))
      .send(materialRequestBody({ images: [image] }));
    expect(foreign.status).toBe(403);

    const unknown = await request(app)
      .post('/api/material-requests')
      .set(authHeader(customer.token))
      .send(materialRequestBody({ images: [{ url: '/uploads/nope.png', publicId: 'nope.png' }] }));
    expect(unknown.status).toBe(400);
  });
});

describe('image deletion authorization', () => {
  it('requires authentication to delete', async () => {
    const upload = await uploadPng(customer);
    const publicId = upload.body.data.images[0].publicId as string;
    const res = await request(app).delete(`/api/uploads/image/${publicId}`);
    expect(res.status).toBe(401);
  });

  it('lets the owner delete their own upload exactly once', async () => {
    const upload = await uploadPng(customer);
    const publicId = upload.body.data.images[0].publicId as string;

    const first = await request(app)
      .delete(`/api/uploads/image/${encodeURIComponent(publicId)}`)
      .set(authHeader(customer.token));
    expect(first.status).toBe(200);

    const second = await request(app)
      .delete(`/api/uploads/image/${encodeURIComponent(publicId)}`)
      .set(authHeader(customer.token));
    expect(second.status).toBe(404);
  });

  it('forbids deleting another user image and allows an admin to do so', async () => {
    const upload = await uploadPng(customer);
    const publicId = upload.body.data.images[0].publicId as string;

    const forbidden = await request(app)
      .delete(`/api/uploads/image/${encodeURIComponent(publicId)}`)
      .set(authHeader(other.token));
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.code).toBe('FORBIDDEN');

    const stillThere = await request(app)
      .get('/api/material-requests')
      .set(authHeader(customer.token));
    expect(stillThere.status).toBe(200);

    const adminDelete = await request(app)
      .delete(`/api/uploads/image/${encodeURIComponent(publicId)}`)
      .set(authHeader(admin.token));
    expect(adminDelete.status).toBe(200);
  });

  it('refuses to delete arbitrary, unmanaged identifiers', async () => {
    const unknown = await request(app)
      .delete('/api/uploads/image/material-mundi/does-not-exist')
      .set(authHeader(customer.token));
    expect(unknown.status).toBe(404);

    const traversal = await request(app)
      .delete(`/api/uploads/image/${encodeURIComponent('../secret.txt')}`)
      .set(authHeader(customer.token));
    expect(traversal.status).toBe(400);
  });
});
