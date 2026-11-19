const User = require('../models/User');
const Note = require('../models/Note');
const Bookmark = require('../models/Bookmark');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('firstName lastName role department branch semester college bio avatarUrl github linkedin points streak followers following createdAt');
  if (!user) throw new AppError('User not found.', 404);
  const [notes, downloads] = await Promise.all([
    Note.countDocuments({ uploader: user._id, isRemoved: false, visibility: 'public' }),
    Note.aggregate([{ $match: { uploader: user._id } }, { $group: { _id: null, total: { $sum: '$downloads' } } }])
  ]);
  const totalDownloads = downloads[0]?.total || 0;
  const badges = [];
  if (notes > 0) badges.push({ name: 'First Contributor', description: 'Shared a public learning resource.' });
  if (totalDownloads >= 100) badges.push({ name: '100 Downloads', description: 'Your resources have been downloaded 100 times.' });
  if (user.points >= 50) badges.push({ name: 'Rising Contributor', description: 'Earned 50 learning points.' });
  if (user.streak >= 7) badges.push({ name: '7-Day Study Streak', description: 'Built a week-long learning habit.' });
  if (user.followers.length >= 10) badges.push({ name: 'Campus Connector', description: 'Built a community of 10 followers.' });
  res.json({ success: true, profile: { ...user.toObject(), publicNotes: notes, totalDownloads, badges } });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['firstName', 'lastName', 'department', 'branch', 'semester', 'college', 'bio', 'avatarUrl', 'github', 'linkedin'];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
  res.json({ success: true, user });
});

exports.follow = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw new AppError('You cannot follow yourself.', 400);
  const target = await User.findById(req.params.id);
  if (!target || !target.isActive) throw new AppError('User not found.', 404);
  const already = target.followers.some(id => id.equals(req.user._id));
  if (already) {
    await Promise.all([User.updateOne({ _id: target._id }, { $pull: { followers: req.user._id } }), User.updateOne({ _id: req.user._id }, { $pull: { following: target._id } })]);
  } else {
    await Promise.all([User.updateOne({ _id: target._id }, { $addToSet: { followers: req.user._id } }), User.updateOne({ _id: req.user._id }, { $addToSet: { following: target._id } })]);
    await Notification.create({ user: target._id, actor: req.user._id, type: 'follow', message: `${req.user.fullName} started following you.` });
  }
  res.json({ success: true, following: !already });
});

exports.dashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [myNotes, downloads, bookmarks, recentNotes, trending, activities, unreadNotifications] = await Promise.all([
    Note.countDocuments({ uploader: userId, isRemoved: false }),
    Note.aggregate([{ $match: { uploader: userId } }, { $group: { _id: null, total: { $sum: '$downloads' } } }]),
    Bookmark.countDocuments({ user: userId }),
    Note.find({ uploader: userId, isRemoved: false }).sort({ createdAt: -1 }).limit(5).select('title subject semester downloads status createdAt'),
    Note.find({ visibility: 'public', status: 'verified', isRemoved: false }).sort({ downloads: -1, averageRating: -1 }).limit(5).populate('uploader', 'firstName lastName role').select('title subject semester downloads averageRating ratingCount uploader'),
    ActivityLog.find({ user: userId }).sort({ createdAt: -1 }).limit(8).lean(),
    Notification.countDocuments({ user: userId, readAt: null })
  ]);
  res.json({ success: true, stats: { uploadedNotes: myNotes, downloads: downloads[0]?.total || 0, bookmarks, unreadNotifications }, recentNotes, trending, activities });
});

exports.studySession = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const previous = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
  if (!previous || previous < today) {
    if (previous) { const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1); user.streak = previous >= yesterday ? user.streak + 1 : 1; }
    else user.streak = 1;
    user.lastStudyDate = new Date(); user.points += 5; await user.save();
  }
  await ActivityLog.create({ user: user._id, action: 'completed a study session', entityType: 'study-session' });
  res.json({ success: true, streak: user.streak, points: user.points });
});

exports.leaderboard = asyncHandler(async (_req, res) => {
  const users = await User.find({ isActive: true }).sort({ points: -1, streak: -1 }).limit(20).select('firstName lastName role department points streak avatarUrl');
  res.json({ success: true, users });
});

exports.notifications = asyncHandler(async (req, res) => {
  const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30).populate('actor', 'firstName lastName');
  res.json({ success: true, notifications: items });
});
exports.markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { $set: { readAt: new Date() } });
  res.json({ success: true });
});
