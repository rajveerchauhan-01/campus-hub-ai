const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const AppError = require('../utils/AppError');
const uploadDir = path.resolve(__dirname, '../../uploads/notes');
fs.mkdirSync(uploadDir, { recursive: true });
const allowed = new Set(['.pdf', '.docx', '.ppt', '.pptx', '.txt']);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase()}`)
});
function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.has(ext)) return cb(new AppError('Only PDF, DOCX, PPT, PPTX and TXT files are allowed.', 400, 'UNSUPPORTED_FILE'));
  cb(null, true);
}
const upload = multer({ storage, fileFilter, limits: { fileSize: Number(process.env.MAX_FILE_SIZE_MB || 20) * 1024 * 1024, files: 1 } });
module.exports = { upload, uploadDir };
