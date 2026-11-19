const mongoose = require('mongoose');
const User = require('../models/User');
const Note = require('../models/Note');
const Report = require('../models/Report');
const Download = require('../models/Download');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');

exports.analytics = asyncHandler(async (_req, res) => {
  const since = new Date(); since.setDate(since.getDate() - 30);
  const [users, notes, downloads, pendingNotes, openReports, aiCollections, topSubjects, dailyUploads, roles] = await Promise.all([
    User.countDocuments({ isActive: true }), Note.countDocuments({ isRemoved: false }), Download.countDocuments(), Note.countDocuments({ status: 'pending', isRemoved: false }), Report.countDocuments({ status: 'open' }),
    Promise.all([mongoose.model('Chat').countDocuments({ createdAt: { $gte: since } }), mongoose.model('Quiz').countDocuments({ createdAt: { $gte: since } }), mongoose.model('Flashcard').countDocuments({ createdAt: { $gte: since } })]),
    Note.aggregate([{ $match: { isRemoved: false } }, { $group: { _id: '$subject', notes: { $sum: 1 }, downloads: { $sum: '$downloads' } } }, { $sort: { notes: -1 } }, { $limit: 8 }]),
    Note.aggregate([{ $match: { createdAt: { $gte: since }, isRemoved: false } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    User.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$role', count: { $sum: 1 } } }])
  ]);
  res.json({ success: true, analytics: { users, notes, downloads, pendingNotes, openReports, ai: { chats: aiCollections[0], quizzes: aiCollections[1], flashcardSets: aiCollections[2] }, topSubjects, dailyUploads, roles } });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) { const q = String(req.query.q).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.$or = [{ email: new RegExp(q, 'i') }, { firstName: new RegExp(q, 'i') }, { lastName: new RegExp(q, 'i') }]; }
  const [users, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
  res.json({ success: true, users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
exports.updateUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw new AppError('User not found.', 404);
  if (target._id.equals(req.user._id) && (req.body.role || req.body.isActive === false)) throw new AppError('You cannot change your own admin access.', 400);
  const updates = {};
  if (['student', 'teacher', 'admin'].includes(req.body.role)) updates.role = req.body.role;
  if (typeof req.body.isActive === 'boolean') updates.isActive = req.body.isActive;
  const user = await User.findByIdAndUpdate(target._id, { $set: updates }, { new: true });
  res.json({ success: true, user });
});
exports.pendingNotes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [notes, total] = await Promise.all([Note.find({ status: 'pending', isRemoved: false }).sort({ createdAt: 1 }).skip(skip).limit(limit).populate('uploader', 'firstName lastName email role'), Note.countDocuments({ status: 'pending', isRemoved: false })]);
  res.json({ success: true, notes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
exports.verifyNote = asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  if (!['verify', 'reject'].includes(action)) throw new AppError('Action must be verify or reject.', 400);
  const note = await Note.findById(req.params.id);
  if (!note || note.isRemoved) throw new AppError('Note not found.', 404);
  note.status = action === 'verify' ? 'verified' : 'rejected';
  note.verifiedBy = req.user._id; note.verifiedAt = new Date(); note.rejectionReason = action === 'reject' ? String(reason || 'Does not meet community guidelines').slice(0, 500) : undefined;
  await note.save();
  await Notification.create({ user: note.uploader, actor: req.user._id, type: 'verification', message: action === 'verify' ? `Your note "${note.title}" was verified.` : `Your note "${note.title}" was rejected: ${note.rejectionReason}`, resourceId: note._id });
  res.json({ success: true, note });
});
exports.listReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = req.query.status ? { status: req.query.status } : {};
  const [reports, total] = await Promise.all([Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('reporter', 'firstName lastName email').populate('note', 'title subject status'), Report.countDocuments(filter)]);
  res.json({ success: true, reports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
exports.resolveReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new AppError('Report not found.', 404);
  const status = ['reviewed', 'dismissed', 'actioned'].includes(req.body.status) ? req.body.status : 'reviewed';
  report.status = status; report.resolvedBy = req.user._id; report.resolvedAt = new Date(); await report.save();
  if (status === 'actioned') await Note.updateOne({ _id: report.note }, { $set: { isRemoved: true } });
  res.json({ success: true, report });
});
exports.reportNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.noteId, isRemoved: false, visibility: 'public' });
  if (!note) throw new AppError('Note not found.', 404);
  if (note.uploader.equals(req.user._id)) throw new AppError('You cannot report your own note.', 400);
  const report = await Report.create({ reporter: req.user._id, note: note._id, reason: req.body.reason, details: req.body.details });
  res.status(201).json({ success: true, report });
});
