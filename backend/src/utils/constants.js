module.exports = {
  ROLES: Object.freeze({ USER: 'user', ADMIN: 'admin' }),
  TOKEN_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS: 12,
  PASSWORD_MIN_LEN: 8,
};
