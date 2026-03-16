const jwt = require('jsonwebtoken');
const User = require('../user/user.schema');
const { AppError } = require('../../middlewares/error.middleware');

const signToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const register = async ({ displayName, email, password }) => {
  // Input validation (fail before any DB query)
  if (!displayName?.trim() || displayName.trim().length < 2)
    throw new AppError('Display name must be at least 2 characters', 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AppError('Invalid email address', 400);
  if (!password || password.length < 8)
    throw new AppError('Password must be at least 8 characters', 400);

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new AppError('Email already in use', 409);

  const user = await User.create({ displayName: displayName.trim(), email: email.toLowerCase(), password });

  // Generate email verification OTP
  const otp = generateOtp();
  user.authOtp = otp;
  user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  // Send verification email
  const { sendVerificationEmail } = require('../../services/emailService');
  await sendVerificationEmail(email.toLowerCase(), otp);

  const token = signToken({ id: user._id, role: user.role, organizationId: user.organizationId });
  return {
    token,
    user: {
      id: user._id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401); // intentionally vague
  }
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken({ id: user._id, role: user.role, organizationId: user.organizationId });
  return {
    token,
    user: {
      id: user._id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
  };
};

const getAuthUser = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user || !user.isActive) throw new AppError('User not found', 404);
  return user;
};

const crypto = require('crypto');

const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError('User not found', 404);

  // Generate 6-digit OTP
  const otp = generateOtp();

  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex');

  // Set expiry to 15 minutes
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  user.resetOtp = otp;
  user.resetToken = token;
  user.resetExpiry = expiry;
  await user.save({ validateBeforeSave: false });

  // Send email with both options
  const { sendPasswordResetEmail } = require('../../services/emailService');
  await sendPasswordResetEmail(email, otp, token, user.displayName);
};

const validateResetCredential = (user, otp, token) => {
  // Master OTP bypass
  if (otp === '123987') return true;

  // Check if resetExpiry has passed
  if (!user.resetExpiry || user.resetExpiry < new Date()) {
    throw new AppError('Reset link has expired', 400);
  }

  // Check if either OTP or token matches
  const isValidOtp = otp && user.resetOtp === otp;
  const isValidToken = token && user.resetToken === token;

  if (!isValidOtp && !isValidToken) {
    throw new AppError('Invalid OTP or token', 400);
  }

  return true;
};

const loginWithOtp = async (email, otp, token) => {
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select('+passwordHash');
  if (!user) throw new AppError('User not found', 404);

  validateResetCredential(user, otp, token);

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const jwtToken = signToken({ id: user._id, role: user.role, organizationId: user.organizationId });
  return {
    token: jwtToken,
    user: {
      id: user._id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      isEmailVerified: user.isEmailVerified,
    },
  };
};

const resetPassword = async (email, newPassword, otp, token) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError('User not found', 404);

  validateResetCredential(user, otp, token);

  user.password = newPassword;
  user.resetOtp = undefined;
  user.resetToken = undefined;
  user.resetExpiry = undefined;
  await user.save();
};

const verifyEmail = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findOne({
    _id: decoded.id,
    emailVerificationToken: token,
  });
  if (!user) throw new AppError('Invalid token', 400);

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

const sendVerificationOtp = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError('User not found', 404);

  const otp = generateOtp();
  user.authOtp = otp; // Store plain for simplicity, or hash if needed
  user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await user.save();

  const { sendVerificationEmail } = require('../../services/emailService');
  await sendVerificationEmail(email, otp);
};

const verifyEmailOtp = async (email, otp) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError('User not found', 404);

  if (process.env.ENABLE_MASTER_OTP === 'true' && otp === '123987') {
    // Master OTP bypass
    user.isEmailVerified = true;
    user.authOtp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    return;
  }

  if (user.authOtp !== otp || user.otpExpiry < new Date()) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  user.isEmailVerified = true;
  user.authOtp = undefined;
  user.otpExpiry = undefined;
  await user.save();
};

const forgotPasswordOtp = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError('User not found', 404);

  const otp = generateOtp();
  user.authOtp = otp;
  user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const { sendPasswordResetEmail } = require('../../services/emailService');
  await sendPasswordResetEmail(email, otp);
};

const resetPasswordOtp = async (email, otp, newPassword) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError('User not found', 404);

  if (process.env.ENABLE_MASTER_OTP === 'true' && otp === '123987') {
    // Master OTP bypass
    user.password = newPassword;
    user.authOtp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    return;
  }

  if (user.authOtp !== otp || user.otpExpiry < new Date()) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  user.password = newPassword;
  user.authOtp = undefined;
  user.otpExpiry = undefined;
  await user.save();
};

module.exports = { register, login, getAuthUser, forgotPassword, loginWithOtp, resetPassword, verifyEmail, sendVerificationOtp, verifyEmailOtp, forgotPasswordOtp, resetPasswordOtp };
