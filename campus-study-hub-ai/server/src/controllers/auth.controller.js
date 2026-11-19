const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const AppError = require('../utils/AppError');
const { createAccessToken, createRefreshToken, hashToken, refreshCookieOptions } = require('../utils/tokens');
const { sendEmail } = require('../services/email.service');
const asyncHandler = require('../utils/asyncHandler');

function issueSession(res, user, refreshToken) {
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  return { accessToken: createAccessToken(user), user };
}

exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, department, semester } = req.body;
  if (await User.exists({ email })) throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
  const user = await User.create({ firstName, lastName, email, passwordHash: await bcrypt.hash(password, 12), department, semester, role: 'student' });
  const refreshToken = createRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();
  const session = issueSession(res, user, refreshToken);
  res.status(201).json({ success: true, message: 'Account created successfully.', ...session });
});

exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  if (!user || !user.isActive || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw new AppError('Email or password is incorrect.', 401, 'INVALID_CREDENTIALS');
  const refreshToken = createRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();
  res.json({ success: true, message: 'Signed in successfully.', ...issueSession(res, user, refreshToken) });
});

exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new AppError('Refresh session not found.', 401, 'NO_REFRESH_TOKEN');
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET); } catch { throw new AppError('Refresh session expired. Please sign in again.', 401, 'REFRESH_EXPIRED'); }
  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.isActive || !user.refreshTokenHash || user.refreshTokenHash !== hashToken(token)) throw new AppError('Refresh session is no longer valid.', 401, 'REFRESH_REVOKED');
  const nextToken = createRefreshToken(user);
  user.refreshTokenHash = hashToken(nextToken);
  await user.save();
  res.json({ success: true, ...issueSession(res, user, nextToken) });
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(payload.sub, { $unset: { refreshTokenHash: 1 } });
    } catch { /* an expired cookie is still cleared */ }
  }
  res.clearCookie('refreshToken', { ...refreshCookieOptions(), maxAge: undefined });
  res.json({ success: true, message: 'Signed out.' });
});

exports.me = asyncHandler(async (req, res) => res.json({ success: true, user: req.user }));

exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const generic = 'If an account exists for that email, a reset code has been sent.';
  const user = await User.findOne({ email, isActive: true });
  if (user) {
    const code = String(crypto.randomInt(100000, 1000000));
    await OTP.deleteMany({ email, purpose: 'reset-password' });
    await OTP.create({ email, codeHash: hashToken(code), purpose: 'reset-password', expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
    await sendEmail({ to: email, subject: 'Campus Study Hub AI password reset', text: `Your password reset code is ${code}. It expires in 10 minutes.` });
    if (process.env.NODE_ENV === 'development' && process.env.DEV_RETURN_OTP === 'true') return res.json({ success: true, message: generic, developmentCode: code });
  }
  res.json({ success: true, message: generic });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const { code, newPassword } = req.body;
  const otp = await OTP.findOne({ email, purpose: 'reset-password', expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  if (!otp || otp.attempts >= 5 || otp.codeHash !== hashToken(String(code || ''))) {
    if (otp) { otp.attempts += 1; await otp.save(); }
    throw new AppError('The reset code is invalid or expired.', 400, 'INVALID_RESET_CODE');
  }
  const user = await User.findOne({ email, isActive: true });
  if (!user) throw new AppError('Account not found.', 404, 'USER_NOT_FOUND');
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.refreshTokenHash = undefined;
  await user.save();
  await OTP.deleteMany({ email, purpose: 'reset-password' });
  res.json({ success: true, message: 'Password updated. Please sign in again.' });
});
