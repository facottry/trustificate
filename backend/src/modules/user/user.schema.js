const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { BCRYPT_ROUNDS } = require('../../utils/constants');

const userSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [50, 'Display name must be under 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      select: false,
    },
    avatarUrl: { type: String, default: null },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    isEmailVerified: { type: Boolean, default: false },
    authOtp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    resetOtp: { type: String, default: null },
    resetToken: { type: String, default: null },
    resetExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

// Virtual helper for setting password in a friendly way.
userSchema.virtual('password')
  .set(function (value) {
    this._password = value;
  });

userSchema.pre('save', async function (next) {
  if (this.isNew && !this._password) {
    return next(new Error('Password is required'));
  }
  if (!this._password) return next();
  this.passwordHash = await bcrypt.hash(this._password, BCRYPT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
