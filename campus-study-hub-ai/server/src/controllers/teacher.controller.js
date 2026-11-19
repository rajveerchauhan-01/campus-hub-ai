const Assignment = require('../models/Assignment');
const Note = require('../models/Note');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.createAssignment = asyncHandler(async (req, res) => {
  const { title, description, subject, branch, semester, dueAt } = req.body;
  if (!title || !subject) throw new AppError('Title and subject are required.', 400);
  const assignment = await Assignment.create({ title, description, subject, branch, semester: Number(semester) || undefined, dueAt: dueAt ? new Date(dueAt) : undefined, createdBy: req.user._id });
  res.status(201).json({ success: true, assignment });
});
exports.listAssignments = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'teacher' ? { createdBy: req.user._id } : { isPublished: true };
  const assignments = await Assignment.find(filter).sort({ createdAt: -1 }).populate('createdBy', 'firstName lastName role');
  res.json({ success: true, assignments });
});
exports.updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new AppError('Assignment not found.', 404);
  if (!assignment.createdBy.equals(req.user._id) && req.user.role !== 'admin') throw new AppError('You cannot edit this assignment.', 403);
  for (const key of ['title', 'description', 'subject', 'branch', 'semester', 'dueAt', 'isPublished']) if (req.body[key] !== undefined) assignment[key] = req.body[key];
  await assignment.save(); res.json({ success: true, assignment });
});
exports.deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new AppError('Assignment not found.', 404);
  if (!assignment.createdBy.equals(req.user._id) && req.user.role !== 'admin') throw new AppError('You cannot delete this assignment.', 403);
  await assignment.deleteOne(); res.json({ success: true });
});

exports.pendingNotes = asyncHandler(async (req, res) => {
  const filter = { status: 'pending', isRemoved: false };
  if (req.user.branch) filter.branch = req.user.branch;
  const notes = await Note.find(filter).sort({ createdAt: 1 }).limit(50).populate('uploader', 'firstName lastName department branch');
  res.json({ success: true, notes });
});
exports.verifyNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, status: 'pending', isRemoved: false });
  if (!note) throw new AppError('Pending note not found.', 404);
  if (req.user.branch && note.branch !== req.user.branch) throw new AppError('You can verify resources only for your assigned branch.', 403);
  note.status = 'verified'; note.verifiedBy = req.user._id; note.verifiedAt = new Date(); await note.save();
  await Notification.create({ user: note.uploader, actor: req.user._id, type: 'verification', message: `Your note "${note.title}" was verified by a teacher.`, resourceId: note._id });
  res.json({ success: true, note });
});
