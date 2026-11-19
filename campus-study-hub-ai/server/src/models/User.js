const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student', index: true },
  department: { type: String, trim: true, default: '' },
  branch: { type: String, trim: true, default: '' },
  semester: { type: Number, min: 1, max: 12 },
  college: { type: String, trim: true, default: '' },
  bio: { type: String, maxlength: 500, default: '' },
  avatarUrl: { type: String, default: '' },
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  refreshTokenHash: { type: String, select: false },
  points: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastStudyDate: { type: Date },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true, transform: (_doc, ret) => { delete ret.passwordHash; delete ret.refreshTokenHash; delete ret.__v; return ret; } } });

userSchema.virtual('fullName').get(function () { return `${this.firstName} ${this.lastName}`; });
userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });
module.exports = mongoose.model('User', userSchema);
