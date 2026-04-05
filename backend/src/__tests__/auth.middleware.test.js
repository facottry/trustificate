'use strict';

const jwt = require('jsonwebtoken');

// Mock User model before requiring auth middleware
jest.mock('../modules/user/user.schema', () => {
  const findById = jest.fn();
  findById.select = jest.fn().mockReturnThis();
  const model = { findById: jest.fn(() => ({ select: findById.select })) };
  // Expose the inner mock for assertions
  model._selectMock = findById.select;
  return model;
});

const { protect, restrictTo } = require('../middlewares/auth.middleware');
const User = require('../modules/user/user.schema');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('protect middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 401 when no Authorization header', async () => {
    const res = mockRes();
    const next = jest.fn();
    await protect({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for invalid token', async () => {
    const res = mockRes();
    const next = jest.fn();
    await protect({ headers: { authorization: 'Bearer invalid.token.here' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for expired token', async () => {
    const token = jwt.sign({ id: '123', role: 'user' }, SECRET, { expiresIn: '-1s' });
    const res = mockRes();
    const next = jest.fn();
    await protect({ headers: { authorization: `Bearer ${token}` } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toContain('expired');
  });

  test('returns 401 when user not found', async () => {
    const token = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'user' }, SECRET);
    User._selectMock.mockResolvedValue(null);
    const res = mockRes();
    const next = jest.fn();
    await protect({ headers: { authorization: `Bearer ${token}` } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 when user is inactive', async () => {
    const token = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'user' }, SECRET);
    User._selectMock.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', isActive: false });
    const res = mockRes();
    const next = jest.fn();
    await protect({ headers: { authorization: `Bearer ${token}` } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('sets req.user and calls next() for valid token + active user', async () => {
    const user = { _id: '507f1f77bcf86cd799439011', role: 'admin', isActive: true };
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET);
    User._selectMock.mockResolvedValue(user);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    await protect(req, res, next);
    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalled();
  });
});

describe('restrictTo middleware', () => {
  test('returns 403 when user role not in allowed list', () => {
    const res = mockRes();
    const next = jest.fn();
    restrictTo('admin')({ user: { role: 'user' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() when user role is allowed', () => {
    const next = jest.fn();
    restrictTo('admin', 'user')({ user: { role: 'admin' } }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 403 when no user on request', () => {
    const res = mockRes();
    const next = jest.fn();
    restrictTo('admin')({}, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
