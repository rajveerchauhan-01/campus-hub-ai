require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const PORT = Number(process.env.PORT || 5000);

async function bootstrap() {
  await connectDB();
  const server = http.createServer(app);
  server.listen(PORT, () => logger.info(`Campus Study Hub AI API listening on port ${PORT}`));
  const shutdown = signal => server.close(() => { logger.info(`${signal}: server closed`); process.exit(0); });
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
bootstrap().catch(error => { logger.error(`Startup failed: ${error.stack || error.message}`); process.exit(1); });
