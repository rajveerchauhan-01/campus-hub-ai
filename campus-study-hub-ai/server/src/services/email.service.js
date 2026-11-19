const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
let transporter;
function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!transporter) transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  return transporter;
}
async function sendEmail({ to, subject, text, html }) {
  const mailer = getTransporter();
  if (!mailer) { logger.warn(`Email not sent because SMTP is not configured. Intended recipient: ${to}; subject: ${subject}`); return { skipped: true }; }
  return mailer.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, to, subject, text, html });
}
module.exports = { sendEmail };
