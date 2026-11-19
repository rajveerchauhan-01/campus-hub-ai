const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const logger = require('./utils/logger');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(v => v.trim()), credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: { write: message => logger.info(message.trim()) } }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' } } }));

app.get('/api/health', (_req, res) => res.json({ success: true, name: 'Campus Study Hub AI API', status: 'healthy', timestamp: new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/notes', require('./routes/note.routes'));
app.use('/api/community', require('./routes/community.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/teacher', require('./routes/teacher.routes'));

app.use(notFound);
app.use(errorHandler);
module.exports = app;
