const Note = require('../models/Note');
const Chat = require('../models/Chat');
const Quiz = require('../models/Quiz');
const Flashcard = require('../models/Flashcard');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const ai = require('../services/ai.service');

async function getReadableNote(noteId, user) {
  const note = await Note.findOne({ _id: noteId, isRemoved: false }).select('+extractedText');
  if (!note || (note.uploader.equals(user._id) === false && user.role !== 'admin' && (note.visibility !== 'public' || note.status !== 'verified'))) throw new AppError('Note not found or access denied.', 404);
  if (!note.extractedText?.trim()) throw new AppError('No readable text was extracted from this document. Try a text-based PDF, DOCX, PPTX or TXT file.', 422, 'NO_EXTRACTED_TEXT');
  return note;
}
exports.summary = asyncHandler(async (req, res) => {
  const note = await getReadableNote(req.params.noteId, req.user);
  const summary = await ai.summarize(note.extractedText);
  res.json({ success: true, summary });
});
exports.explain = asyncHandler(async (req, res) => {
  const note = await getReadableNote(req.params.noteId, req.user);
  if (!req.body.concept) throw new AppError('Please enter the concept to explain.', 400);
  const explanation = await ai.explain(note.extractedText, String(req.body.concept).slice(0, 200));
  res.json({ success: true, explanation });
});
exports.chat = asyncHandler(async (req, res) => {
  const note = await getReadableNote(req.params.noteId, req.user);
  const question = String(req.body.question || '').trim();
  if (!question || question.length > 2000) throw new AppError('Question must be between 1 and 2000 characters.', 400);
  let conversation = req.body.chatId ? await Chat.findOne({ _id: req.body.chatId, user: req.user._id, note: note._id }) : null;
  if (!conversation) conversation = await Chat.create({ user: req.user._id, note: note._id, title: note.title });
  const answer = await ai.chat(note.extractedText, conversation.messages, question);
  conversation.messages.push({ role: 'user', content: question }, { role: 'assistant', content: answer });
  await conversation.save();
  res.json({ success: true, chatId: conversation._id, answer, messages: conversation.messages });
});
exports.chatHistory = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ user: req.user._id, note: req.params.noteId }).sort({ updatedAt: -1 }).limit(20).select('title messages createdAt updatedAt');
  res.json({ success: true, chats });
});
exports.generateQuiz = asyncHandler(async (req, res) => {
  const note = await getReadableNote(req.params.noteId, req.user);
  const generated = await ai.makeQuiz(note.extractedText, req.body.count, req.body.difficulty);
  if (!Array.isArray(generated.questions) || !generated.questions.length) throw new AppError('AI did not generate a valid quiz. Try again.', 502);
  const quiz = await Quiz.create({ user: req.user._id, note: note._id, title: generated.title || `Quiz: ${note.title}`, questions: generated.questions.slice(0, 20) });
  const publicQuiz = quiz.toObject();
  publicQuiz.questions = publicQuiz.questions.map(({ correctAnswer, ...question }) => question);
  res.status(201).json({ success: true, quiz: publicQuiz });
});
exports.generateFlashcards = asyncHandler(async (req, res) => {
  const note = await getReadableNote(req.params.noteId, req.user);
  const generated = await ai.makeFlashcards(note.extractedText, req.body.count);
  if (!Array.isArray(generated.cards) || !generated.cards.length) throw new AppError('AI did not generate valid flashcards. Try again.', 502);
  const flashcards = await Flashcard.create({ user: req.user._id, note: note._id, title: generated.title || `Flashcards: ${note.title}`, cards: generated.cards.slice(0, 30) });
  res.status(201).json({ success: true, flashcards });
});
exports.importantTopics = asyncHandler(async (req, res) => {
  const note = await getReadableNote(req.params.noteId, req.user);
  const topics = await ai.importantTopics(note.extractedText);
  res.json({ success: true, topics });
});
exports.myQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('note', 'title subject');
  const safeQuizzes = quizzes.map(quiz => { const value = quiz.toObject(); if (!value.completedAt) value.questions = value.questions.map(({ correctAnswer, ...question }) => question); return value; });
  res.json({ success: true, quizzes: safeQuizzes });
});
exports.submitQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
  if (!quiz) throw new AppError('Quiz not found.', 404);
  if (quiz.completedAt) throw new AppError('This quiz has already been submitted.', 409);
  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  let score = 0;
  quiz.answers = quiz.questions.map((q, i) => {
    const answer = String(answers[i] || ''); const isCorrect = answer === q.correctAnswer; if (isCorrect) score += 1;
    return { questionIndex: i, answer, isCorrect };
  });
  quiz.score = score; quiz.completedAt = new Date(); await quiz.save();
  res.json({ success: true, score, total: quiz.questions.length, percentage: Math.round((score / quiz.questions.length) * 100), quiz });
});
exports.myFlashcards = asyncHandler(async (req, res) => {
  const flashcards = await Flashcard.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('note', 'title subject');
  res.json({ success: true, flashcards });
});
exports.deleteFlashcards = asyncHandler(async (req, res) => {
  const result = await Flashcard.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!result.deletedCount) throw new AppError('Flashcard set not found.', 404);
  res.json({ success: true });
});

exports.recommendations = asyncHandler(async (req, res) => {
  const [resources, recent] = await Promise.all([
    Note.find({ visibility: 'public', status: 'verified', isRemoved: false, ...(req.user.semester ? { semester: req.user.semester } : {}) }).sort({ downloads: -1, averageRating: -1 }).limit(12).select('title subject branch semester tags downloads averageRating'),
    Note.find({ uploader: req.user._id, isRemoved: false }).sort({ createdAt: -1 }).limit(8).select('title subject semester tags')
  ]);
  const recommendations = await ai.studyRecommendations({ department: req.user.department, branch: req.user.branch, semester: req.user.semester, points: req.user.points, streak: req.user.streak }, { popularCampusResources: resources, recentUploads: recent });
  res.json({ success: true, recommendations, resources });
});
