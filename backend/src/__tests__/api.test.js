'use strict';

const request = require('supertest');

// ── Mock mongoose BEFORE app loads ────────────────────────
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(true),
    connection: { readyState: 1, close: jest.fn() },
    Schema: actual.Schema,
    model: actual.model,
    Types: actual.Types,
  };
});

// Mock the DB config so it doesn't actually connect
jest.mock('../config/db.config', () => jest.fn().mockResolvedValue(true));

// Mock R2 service
jest.mock('../services/cloudflareR2Service', () => ({
  uploadCertificate: jest.fn().mockResolvedValue({ url: 'https://cdn.test.com/test.pdf', key: 'test.pdf' }),
  uploadFile: jest.fn().mockResolvedValue({ url: 'https://cdn.test.com/test.png', key: 'test.png' }),
  deleteFile: jest.fn().mockResolvedValue(true),
  getSignedUrl: jest.fn().mockResolvedValue('https://cdn.test.com/signed'),
}));

// Mock email service
jest.mock('../services/emailService', () => ({
  compileTemplate: jest.fn().mockReturnValue('<html>test</html>'),
  sendTransactional: jest.fn().mockResolvedValue(true),
  sendPromotional: jest.fn().mockResolvedValue(true),
}));

// Mock logger to suppress output
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock template seed
jest.mock('../modules/template/template.seed', () => ({
  seedSystemTemplates: jest.fn().mockResolvedValue(true),
}));

const app = require('../app');

// ── Root & Health ─────────────────────────────────────────

describe('Root & Health endpoints', () => {
  test('GET / returns server info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('up and running');
    expect(res.body.version).toBeDefined();
  });

  test('GET /health returns ok when DB connected', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ok');
  });

  test('GET /nonexistent returns 404', async () => {
    const res = await request(app).get('/this-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Route not found');
  });
});

// ── Security Headers ──────────────────────────────────────

describe('Security headers', () => {
  test('includes helmet security headers', async () => {
    const res = await request(app).get('/');
    // Helmet sets various headers
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  test('includes X-App-Version header', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-app-version']).toBeDefined();
  });
});

// ── CORS ──────────────────────────────────────────────────

describe('CORS', () => {
  test('allows requests from trustificate.clicktory.in', async () => {
    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://trustificate.clicktory.in')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.headers['access-control-allow-origin']).toBe('https://trustificate.clicktory.in');
  });

  test('allows requests from localhost origins (portless)', async () => {
    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://trustificate.localhost')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.headers['access-control-allow-origin']).toBe('http://trustificate.localhost');
  });

  test('rejects requests from unknown origins', async () => {
    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://evil.com')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.status).toBe(500); // CORS error
  });
});

// ── Auth Routes (no DB) ───────────────────────────────────

describe('Auth routes — validation', () => {
  test('POST /api/auth/login without body returns error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    // Should get 400 or 401 (service throws AppError)
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register without body returns error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ── Protected Routes ──────────────────────────────────────

describe('Protected routes — auth required', () => {
  test('GET /api/certificates returns 401 without token', async () => {
    const res = await request(app).get('/api/certificates');
    expect(res.status).toBe(401);
  });

  test('GET /api/templates returns 401 without token', async () => {
    const res = await request(app).get('/api/templates');
    expect(res.status).toBe(401);
  });

  test('GET /api/users returns 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  test('GET /api/organizations returns 401 without token', async () => {
    const res = await request(app).get('/api/organizations');
    expect(res.status).toBe(401);
  });
});

// ── Public Routes ─────────────────────────────────────────

describe('Public routes — no auth required', () => {
  // These routes pass through requireEmailVerified (which allows unauthenticated)
  // but hit Mongoose which buffers in test. We just verify they don't return 401.
  test('GET /api/certificates/slug/:slug does not require auth', async () => {
    const res = await request(app).get('/api/certificates/slug/test-slug').timeout(12000);
    // Mongoose buffering will eventually error (500) but NOT 401
    expect(res.status).not.toBe(401);
  }, 15000);

  test('GET /api/certificates/public/verify/:num does not require auth', async () => {
    const res = await request(app).get('/api/certificates/public/verify/CERT-TEST').timeout(12000);
    expect(res.status).not.toBe(401);
  }, 15000);
});

// ── Rate Limiting ─────────────────────────────────────────

describe('Rate limiting', () => {
  test('API routes have rate limit headers', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
  });
});

// ── Swagger Docs ──────────────────────────────────────────

describe('Swagger docs', () => {
  test('GET /api-docs returns HTML', async () => {
    const res = await request(app).get('/api-docs/').redirects(1);
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger');
  });
});
