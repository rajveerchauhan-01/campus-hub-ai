const fs = require('fs/promises');
const path = require('path');
const Note = require('../models/Note');
const Bookmark = require('../models/Bookmark');
const Download = require('../models/Download');
const ActivityLog = require('../models/ActivityLog');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');
const { extractText } = require('../services/document.service');

const canAccess = (note, user) => Boolean(user && (note.uploader.equals(user._id) || user.role === 'admin' || (note.visibility === 'public' && note.status === 'verified')));
function serializeNote(note) {
  const value = note.toObject ? note.toObject() : note;
  if (value.file) { delete value.file.path; delete value.file.filename; }
  delete value.extractedText;
  return value;
}

exports.create = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please attach a study material file.', 400, 'FILE_REQUIRED');
  const data = req.body;
  const tags = Array.isArray(data.tags) ? data.tags : String(data.tags || '').split(',');
  let extractedText = '';
  try { extractedText = await extractText(req.file.path, req.file.originalname); } catch { /* document extraction is best-effort; upload itself remains available */ }
  const isOfficial = req.user.role === 'teacher' || req.user.role === 'admin';
  extractedText = extractedText.slice(0, 250000);
  const note = await Note.create({
    title: data.title, description: data.description, subject: data.subject, branch: data.branch || req.user.branch || 'General',
    semester: Number(data.semester || req.user.semester || 1), tags: tags.map(t => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 15),
    visibility: data.visibility || 'public', type: data.type || 'notes', uploader: req.user._id,
    status: isOfficial ? 'verified' : 'pending', isOfficial,
    file: { storage: 'local', originalName: req.file.originalname, filename: req.file.filename, mimeType: req.file.mimetype, size: req.file.size, path: req.file.path, url: '' },
    extractedText
  });
  await ActivityLog.create({ user: req.user._id, action: 'uploaded a note', entityType: 'note', entityId: note._id, metadata: { title: note.title } });
  await req.user.updateOne({ $inc: { points: 10 } });
  res.status(201).json({ success: true, note: serializeNote(note), message: isOfficial ? 'Official material uploaded and verified.' : 'Note uploaded and sent for verification.' });
});

exports.myNotes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { uploader: req.user._id, isRemoved: false };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.visibility) filter.visibility = req.query.visibility;
  const [notes, total] = await Promise.all([Note.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-extractedText -file.path -file.filename'), Note.countDocuments(filter)]);
  res.json({ success: true, notes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.community = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { visibility: 'public', status: 'verified', isRemoved: false };
  for (const key of ['subject', 'branch', 'semester', 'type']) if (req.query[key]) filter[key] = key === 'semester' ? Number(req.query[key]) : req.query[key];
  if (req.query.tag) filter.tags = String(req.query.tag).toLowerCase();
  if (req.query.uploader) filter.uploader = req.query.uploader;
  if (req.query.q) {
    const q = String(req.query.q).trim().slice(0, 100);
    filter.$or = ['title', 'description', 'subject', 'tags'].map(field => ({ [field]: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }));
  }
  const sortMap = { recent: { createdAt: -1 }, downloads: { downloads: -1 }, rating: { averageRating: -1 }, popular: { downloads: -1, averageRating: -1 } };
  const sort = sortMap[req.query.sort] || sortMap.popular;
  const [notes, total] = await Promise.all([Note.find(filter).sort(sort).skip(skip).limit(limit).populate('uploader', 'firstName lastName role department').select('-extractedText -file.path -file.filename'), Note.countDocuments(filter)]);
  res.json({ success: true, notes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getById = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, isRemoved: false }).populate('uploader', 'firstName lastName role department branch semester avatarUrl');
  if (!note || !canAccess(note, req.user)) throw new AppError('Note not found or you do not have access.', 404, 'NOTE_NOT_FOUND');
  note.views += 1; await note.save();
  const [bookmarked, related] = await Promise.all([
    req.user ? Bookmark.exists({ note: note._id, user: req.user._id }) : false,
    Note.find({ _id: { $ne: note._id }, visibility: 'public', status: 'verified', subject: note.subject, isRemoved: false }).limit(4).select('title subject semester downloads averageRating')
  ]);
  res.json({ success: true, note: serializeNote(note), bookmarked: Boolean(bookmarked), related });
});

exports.update = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note || note.isRemoved) throw new AppError('Note not found.', 404);
  if (!note.uploader.equals(req.user._id) && req.user.role !== 'admin') throw new AppError('You cannot edit this note.', 403);
  const fields = ['title', 'description', 'subject', 'branch', 'semester', 'tags', 'visibility', 'type'];
  for (const field of fields) if (req.body[field] !== undefined) note[field] = field === 'tags' ? (Array.isArray(req.body.tags) ? req.body.tags : String(req.body.tags).split(',')).map(t => String(t).trim().toLowerCase()).filter(Boolean) : req.body[field];
  if (req.file) {
    if (note.file?.path) await fs.unlink(note.file.path).catch(() => {});
    note.file = { storage: 'local', originalName: req.file.originalname, filename: req.file.filename, mimeType: req.file.mimetype, size: req.file.size, path: req.file.path };
    try { note.extractedText = (await extractText(req.file.path, req.file.originalname)).slice(0, 250000); } catch { note.extractedText = ''; }
  }
  if (req.user.role === 'student') note.status = 'pending';
  await note.save();
  res.json({ success: true, note: serializeNote(note) });
});

exports.remove = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note || note.isRemoved) throw new AppError('Note not found.', 404);
  if (!note.uploader.equals(req.user._id) && req.user.role !== 'admin') throw new AppError('You cannot delete this note.', 403);
  note.isRemoved = true; await note.save();
  res.json({ success: true, message: 'Note removed.' });
});

exports.download = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note || note.isRemoved || !canAccess(note, req.user)) throw new AppError('File not found or access denied.', 404);
  if (!note.file?.path) throw new AppError('The file is no longer available.', 404);
  await fs.access(note.file.path).catch(() => { throw new AppError('The file is no longer available on this server.', 404); });
  note.downloads += 1; await note.save();
  await Download.create({ note: note._id, user: req.user?._id });
  if (req.user) await ActivityLog.create({ user: req.user._id, action: 'downloaded a note', entityType: 'note', entityId: note._id, metadata: { title: note.title } });
  res.download(note.file.path, note.file.originalName);
});

exports.bookmark = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note || note.isRemoved || !canAccess(note, req.user)) throw new AppError('Note not found.', 404);
  const existing = await Bookmark.findOne({ note: note._id, user: req.user._id });
  if (existing) { await existing.deleteOne(); return res.json({ success: true, bookmarked: false }); }
  await Bookmark.create({ note: note._id, user: req.user._id });
  res.json({ success: true, bookmarked: true });
});

exports.bookmarks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await Promise.all([Bookmark.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate({ path: 'note', match: { isRemoved: false }, select: 'title subject semester branch averageRating downloads status visibility uploader', populate: { path: 'uploader', select: 'firstName lastName' } }), Bookmark.countDocuments({ user: req.user._id })]);
  res.json({ success: true, notes: items.map(i => i.note).filter(Boolean), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
