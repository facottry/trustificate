const { AppError } = require('./error.middleware');

/**
 * Email verification middleware
 * Ensures authenticated users have verified their email before accessing protected resources
 * 
 * Allowed endpoints for unverified users:
 * - GET /api/auth/email-status
 * - POST /api/auth/resend-verification-link
 * - GET /api/auth/confirm-email/:token
 * - POST /api/auth/logout
 * - GET /api/auth/me (info only)
 */
const requireEmailVerified = (req, res, next) => {
  // Only check for authenticated users
  if (!req.user) {
    return next();
  }

  // List of endpoints that work without email verification
  const whitelistedPaths = [
    '/api/auth/email-status',
    '/api/auth/resend-verification-link',
    '/api/auth/logout',
    '/api/auth/me', // Allow read-only access to current user data
  ];

  // Check if current path is whitelisted
  const isWhitelisted = whitelistedPaths.some(path => req.path === path);
  
  // Also allow confirm-email endpoint
  const isConfirmEmail = req.path.match(/^\/api\/auth\/confirm-email\//) && req.method === 'GET';

  if (isWhitelisted || isConfirmEmail) {
    return next();
  }

  // If email not verified and not in whitelist, reject request
  if (!req.user.isEmailVerified) {
    return next(new AppError(
      'Please verify your email address to access this resource. Check your inbox for the verification link.',
      403,
      'EMAIL_NOT_VERIFIED'
    ));
  }

  next();
};

module.exports = { requireEmailVerified };
