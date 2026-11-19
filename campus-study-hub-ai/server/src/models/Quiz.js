const mongoose = require('mongoose');
const questionSchema = new mongoose.Schema({ question: String, options: [String], correctAnswer: String, explanation: String, difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' } }, { _id: false });
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' }, title: { type: String, default: 'Practice quiz' }, questions: [questionSchema], answers: [{ questionIndex: Number, answer: String, isCorrect: Boolean }], score: Number, completedAt: Date }, { timestamps: true });
module.exports = mongoose.model('Quiz', schema);
