/**
 * Async error wrapper — eliminates try/catch boilerplate in every controller
 * Usage: router.get('/', asyncHandler(controller.getAll))
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Custom operational error — status is sent to the client
 */
class AppError extends Error {
  constructor(message, status = 500, code = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.isOperational = true;
  }
}

module.exports = { asyncHandler, AppError };
