const logger = require('../utils/logger');
module.exports = (err, req, res, _next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';
  let code = err.code || 'SERVER_ERROR';
  if (err.code === 'LIMIT_FILE_SIZE') { status = 413; message = `File is too large. Maximum size is ${Number(process.env.MAX_FILE_SIZE_MB || 20)} MB.`; code = 'FILE_TOO_LARGE'; }
  if (err.name === 'CastError') { status = 400; message = 'Invalid resource identifier.'; code = 'INVALID_ID'; }
  if (err.code === 11000) { status = 409; message = 'A record with this value already exists.'; code = 'DUPLICATE'; }
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map(e => e.message).join(', '); code = 'VALIDATION_ERROR'; }
  if (status >= 500) logger.error(`${req.method} ${req.originalUrl}: ${err.stack || message}`);
  res.status(status).json({ success: false, error: { code, message }, ...(process.env.NODE_ENV === 'development' && status >= 500 ? { stack: err.stack } : {}) });
};
