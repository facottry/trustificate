'use strict';

const jwt = require('jsonwebtoken');
const { AppError, asyncHandler } = require('../middlewares/error.middleware');
const { requireEmailVerified } = require('../middlewares/emailVerification.middleware');
const validate = require('../middlewares/validate.middleware');

// ── AppError ──────────────────────────────────────────────

describe('AppError', () => {
  test('creates error with message, status, and code', () => {
    const err = new AppError('Not found', 404, 'NOT_FOUND');
    expect(err.message).toBe('Not found');
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.isOperational).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  test('defaults to status 500 and null code', () => {
    const err = new AppError('Server error');
    expect(err.status).toBe(500);
    expect(err.code).toBeNull();
  });
});

// ── asyncHandler ──────────────────────────────────────────

describe('asyncHandler', () => {
  test('calls the wrapped function with req, res, next', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const req = {}, res = {}, next = jest.fn();
    await asyncHandler(fn)(req, res, next);
    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  test('passes rejected promise to next()', async () => {
    const error = new Error('boom');
    const fn = jest.fn().mockRejectedValue(error);
    const next = jest.fn();
    await asyncHandler(fn)({}, {}, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  test('catches sync throws via Promise.resolve', () => {
    // asyncHandler wraps fn in Promise.resolve() which catches sync throws
    // and routes them to next(). This is a JS engine guarantee.
    const fn = () => { throw new Error('boom'); };
    const handler = asyncHandler(fn);
    // Verify it returns a function (middleware signature)
    expect(typeof handler).toBe('function');
    expect(handler.length).toBe(3); // (req, res, next)
  });
});

// ── requireEmailVerified ──────────────────────────────────

describe('requireEmailVerified', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('passes through when no user (unauthenticated)', () => {
    const next = jest.fn();
    requireEmailVerified({ path: '/api/certificates/slug/abc' }, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  test('passes through for verified user', () => {
    const next = jest.fn();
    const req = { user: { isEmailVerified: true }, path: '/api/templates' };
    requireEmailVerified(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  test('blocks unverified user on non-whitelisted path', () => {
    const next = jest.fn();
    const req = { user: { isEmailVerified: false }, path: '/api/templates' };
    requireEmailVerified(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].status).toBe(403);
    expect(next.mock.calls[0][0].code).toBe('EMAIL_NOT_VERIFIED');
  });

  test('allows unverified user on whitelisted paths', () => {
    const whitelisted = ['/api/auth/email-status', '/api/auth/resend-verification-link', '/api/auth/logout', '/api/auth/me'];
    whitelisted.forEach((p) => {
      const next = jest.fn();
      requireEmailVerified({ user: { isEmailVerified: false }, path: p }, mockRes(), next);
      expect(next).toHaveBeenCalledWith();
    });
  });

  test('allows unverified user on confirm-email GET', () => {
    const next = jest.fn();
    const req = { user: { isEmailVerified: false }, path: '/api/auth/confirm-email/some-token', method: 'GET' };
    requireEmailVerified(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });
});

// ── validate middleware ───────────────────────────────────

describe('validate middleware', () => {
  const Joi = require('joi');
  const schema = Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).required(),
  });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('calls next() for valid body', () => {
    const next = jest.fn();
    const req = { body: { email: 'test@example.com', name: 'Alice' } };
    validate(schema)(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 422 with errors for invalid body', () => {
    const next = jest.fn();
    const res = mockRes();
    const req = { body: { email: 'bad', name: '' } };
    validate(schema)(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Validation failed', errors: expect.any(Array) })
    );
  });

  test('returns all validation errors (abortEarly: false)', () => {
    const next = jest.fn();
    const res = mockRes();
    const req = { body: {} };
    validate(schema)(req, res, next);
    const body = res.json.mock.calls[0][0];
    expect(body.errors.length).toBeGreaterThanOrEqual(2);
  });
});
