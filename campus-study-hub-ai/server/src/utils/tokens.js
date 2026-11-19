const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function createAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' });
}
function createRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString(), type: 'refresh' }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' });
}
function hashToken(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
function refreshCookieOptions() {
  return { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', path: '/api/auth', maxAge: 7 * 24 * 60 * 60 * 1000 };
}
module.exports = { createAccessToken, createRefreshToken, hashToken, refreshCookieOptions };
