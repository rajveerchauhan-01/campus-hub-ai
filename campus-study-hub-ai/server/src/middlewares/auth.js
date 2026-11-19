const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Authentication required.', 401, 'UNAUTHENTICATED');
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET); }
  catch { throw new AppError('Your session is invalid or expired. Please sign in again.', 401, 'INVALID_TOKEN'); }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new AppError('Account is unavailable.', 401, 'ACCOUNT_UNAVAILABLE');
  req.user = user;
  next();
});

function allowRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN'));
    next();
  };
}
module.exports = { protect, allowRoles };
