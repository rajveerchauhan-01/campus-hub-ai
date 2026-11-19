const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const Note = require('../models/Note');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');

exports.listComments = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.noteId, isRemoved: false, visibility: 'public', status: 'verified' });
  if (!note) throw new AppError('Note not found.', 404);
  const comments = await Comment.find({ note: note._id, isHidden: false }).sort({ createdAt: -1 }).limit(100).populate('author', 'firstName lastName role avatarUrl');
  res.json({ success: true, comments });
});
exports.addComment = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.noteId);
  if (!note || note.isRemoved || note.visibility !== 'public' || note.status !== 'verified') throw new AppError('Note not found.', 404);
  const body = String(req.body.body || '').trim();
  if (!body || body.length > 2000) throw new AppError('Comment must contain between 1 and 2000 characters.', 400);
  const comment = await Comment.create({ note: note._id, author: req.user._id, body, parent: req.body.parent || null });
  note.commentCount += 1; await note.save();
  if (!note.uploader.equals(req.user._id)) await Notification.create({ user: note.uploader, actor: req.user._id, type: 'comment', message: `${req.user.fullName} commented on your note: ${note.title}`, resourceId: note._id });
  await comment.populate('author', 'firstName lastName role avatarUrl');
  res.status(201).json({ success: true, comment });
});
exports.deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new AppError('Comment not found.', 404);
  if (!comment.author.equals(req.user._id) && req.user.role !== 'admin') throw new AppError('You cannot delete this comment.', 403);
  if (comment.isHidden) throw new AppError('Comment is already hidden.', 409);
  comment.isHidden = true; await comment.save();
  await Note.updateOne({ _id: comment.note }, { $inc: { commentCount: -1 } });
  res.json({ success: true });
});
exports.rateNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.noteId);
  if (!note || note.isRemoved || note.visibility !== 'public' || note.status !== 'verified' || note.uploader.equals(req.user._id)) throw new AppError('This note cannot be rated.', 400);
  const value = Number(req.body.value);
  if (!Number.isInteger(value) || value < 1 || value > 5) throw new AppError('Rating must be between 1 and 5.', 400);
  await Rating.findOneAndUpdate({ note: note._id, user: req.user._id }, { value, review: String(req.body.review || '').slice(0, 1000) }, { upsert: true, new: true, setDefaultsOnInsert: true });
  const [stats] = await Rating.aggregate([{ $match: { note: note._id } }, { $group: { _id: null, average: { $avg: '$value' }, count: { $sum: 1 } } }]);
  note.averageRating = Number((stats?.average || 0).toFixed(2)); note.ratingCount = stats?.count || 0; await note.save();
  if (!note.uploader.equals(req.user._id)) await Notification.create({ user: note.uploader, actor: req.user._id, type: 'rating', message: `${req.user.fullName} rated your note ${value}/5.`, resourceId: note._id });
  res.json({ success: true, averageRating: note.averageRating, ratingCount: note.ratingCount });
});
exports.getRatings = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.noteId, visibility: 'public', status: 'verified', isRemoved: false });
  if (!note) throw new AppError('Note not found.', 404);
  const { page, limit, skip } = getPagination(req.query);
  const [ratings, total] = await Promise.all([Rating.find({ note: req.params.noteId }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'firstName lastName avatarUrl'), Rating.countDocuments({ note: req.params.noteId })]);
  res.json({ success: true, ratings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
