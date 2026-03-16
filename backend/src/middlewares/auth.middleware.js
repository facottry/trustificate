const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.schema');

/**
 * Protect routes — verifies Bearer JWT and loads user
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token. Authorization denied.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive.' });
    }

    req.user = user;
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token has expired. Please login again.'
      : 'Token invalid.';
    res.status(401).json({ success: false, message });
  }
};

/**
 * Restrict to specific roles
 * Usage: router.delete('/:id', protect, restrictTo('admin'))
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'You do not have permission for this action.' });
  }
  next();
};

module.exports = { protect, restrictTo };
