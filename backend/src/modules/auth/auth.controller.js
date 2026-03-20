const jwt = require('jsonwebtoken');
const authService = require('./auth.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { AppError } = require('../../middlewares/error.middleware');
const { success } = require('../../utils/apiResponse');

const signToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/** POST /api/auth/register */
const register = asyncHandler(async (req, res) => {
  const { displayName, email, password } = req.body;
  const data = await authService.register({ displayName, email, password });
  success(res, data, data.message, 201);
});

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login({ email, password });
  success(res, data, 'Login successful');
});

/** GET /api/auth/me */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getAuthUser(req.user.id);
  success(res, user, 'Authenticated user');
});

/** POST /api/auth/logout — stateless JWT: client discards token */
const logout = asyncHandler(async (_req, res) => {
  success(res, null, 'Logged out successfully');
});

/** POST /api/auth/forgot-password */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  success(res, null, 'Password reset email sent');
});

/** POST /api/auth/login-otp */
const loginWithOtp = asyncHandler(async (req, res) => {
  const { email, otp, token } = req.body;
  const data = await authService.loginWithOtp(email, otp, token);
  success(res, data, 'Logged in with OTP');
});

/** POST /api/auth/reset-password */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword, otp, token } = req.body;
  await authService.resetPassword(email, newPassword, otp, token);
  success(res, null, 'Password reset successfully');
});

/** POST /api/auth/verify */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  await authService.verifyEmailLink(token);
  success(res, null, 'Email verified');
});

/** GET /api/auth/confirm-email/:token */
const confirmEmailLink = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const user = await authService.verifyEmailLink(token);
  const jwtToken = signToken({ id: user._id, role: user.role, organizationId: user.organizationId });
  success(res, {
    token: jwtToken,
    user: {
      id: user._id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      isEmailVerified: true,
    },
  }, 'Email verified successfully');
});

/** POST /api/auth/resend-verification-link */
const resendVerificationLink = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const data = await authService.resendVerificationLink(email);
  success(res, data, 'Verification link sent');
});

/** GET /api/auth/email-status */
const checkEmailStatus = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) throw new AppError('Email query parameter is required', 400);
  const status = await authService.checkEmailVerificationStatusByEmail(email);
  success(res, status, 'Email status retrieved');
});

/** POST /api/auth/send-verification-otp */
const sendVerificationOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.sendVerificationOtp(email);
  success(res, null, 'Verification OTP sent');
});

/** POST /api/auth/verify-email */
const verifyEmailOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  await authService.verifyEmailOtp(email, otp);
  success(res, null, 'Email verified successfully');
});

/** POST /api/auth/forgot-password-otp */
const forgotPasswordOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPasswordOtp(email);
  success(res, null, 'Password reset OTP sent');
});

/** POST /api/auth/reset-password-otp */
const resetPasswordOtp = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  await authService.resetPasswordOtp(email, otp, newPassword);
  success(res, null, 'Password reset successfully');
});

module.exports = { register, login, getMe, logout, forgotPassword, loginWithOtp, resetPassword, verifyEmail, confirmEmailLink, resendVerificationLink, checkEmailStatus, sendVerificationOtp, verifyEmailOtp, forgotPasswordOtp, resetPasswordOtp };
