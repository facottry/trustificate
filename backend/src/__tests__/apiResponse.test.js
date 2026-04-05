'use strict';

const { success, error, paginate } = require('../utils/apiResponse');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('apiResponse helpers', () => {
  describe('success()', () => {
    test('returns 200 with data and message', () => {
      const res = mockRes();
      success(res, { id: 1 }, 'OK');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'OK', data: { id: 1 } });
    });

    test('accepts custom status code', () => {
      const res = mockRes();
      success(res, null, 'Created', 201);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('defaults to null data and "Success" message', () => {
      const res = mockRes();
      success(res);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Success', data: null });
    });
  });

  describe('error()', () => {
    test('returns 500 by default', () => {
      const res = mockRes();
      error(res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Something went wrong' });
    });

    test('accepts custom message and status', () => {
      const res = mockRes();
      error(res, 'Not found', 404);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Not found' });
    });
  });

  describe('paginate()', () => {
    test('returns paginated response with correct math', () => {
      const res = mockRes();
      paginate(res, [1, 2, 3], 25, 2, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data).toEqual([1, 2, 3]);
      expect(body.pagination).toEqual({ total: 25, page: 2, limit: 10, pages: 3 });
    });

    test('handles single page', () => {
      const res = mockRes();
      paginate(res, ['a'], 1, 1, 20);
      expect(res.json.mock.calls[0][0].pagination.pages).toBe(1);
    });

    test('handles zero total', () => {
      const res = mockRes();
      paginate(res, [], 0, 1, 20);
      expect(res.json.mock.calls[0][0].pagination.pages).toBe(0);
    });
  });
});
