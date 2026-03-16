const authService = require('./auth.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { success } = require('../../utils/apiResponse');

/** POST /api/auth/register */
const register = asyncHandler(async (req, res) => {
  const { displayName, email, password } = req.body;
  const data = await authService.register({ displayName, email, password });
  success(res, data, 'Registered successfully', 201);
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
  await authService.verifyEmail(token);
  success(res, null, 'Email verified');
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

module.exports = { register, login, getMe, logout, forgotPassword, loginWithOtp, resetPassword, verifyEmail, sendVerificationOtp, verifyEmailOtp, forgotPasswordOtp, resetPasswordOtp };
