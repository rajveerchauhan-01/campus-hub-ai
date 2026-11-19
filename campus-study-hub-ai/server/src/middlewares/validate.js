const AppError = require('../utils/AppError');
module.exports = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(new AppError(result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 400, 'VALIDATION_ERROR'));
  req[source] = result.data;
  next();
};
