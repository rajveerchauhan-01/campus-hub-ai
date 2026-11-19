const mongoose = require('mongoose');
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: '', maxlength: 2000 },
  subject: { type: String, required: true, trim: true, index: true },
  branch: { type: String, default: 'General', trim: true, index: true },
  semester: { type: Number, required: true, min: 1, max: 12, index: true },
  tags: [{ type: String, trim: true, lowercase: true }],
  visibility: { type: String, enum: ['public', 'private'], default: 'public', index: true },
  type: { type: String, enum: ['notes', 'syllabus', 'assignment', 'question-paper', 'lab-manual', 'other'], default: 'notes' },
  file: { storage: { type: String, enum: ['local', 's3'], default: 'local' }, originalName: String, filename: String, mimeType: String, size: Number, path: String, url: String },
  extractedText: { type: String, default: '', select: false },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending', index: true },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  rejectionReason: String,
  downloads: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  isOfficial: { type: Boolean, default: false },
  isRemoved: { type: Boolean, default: false, index: true }
}, { timestamps: true });
noteSchema.index({ title: 'text', description: 'text', subject: 'text', tags: 'text' });
noteSchema.index({ visibility: 1, status: 1, createdAt: -1 });
module.exports = mongoose.model('Note', noteSchema);
