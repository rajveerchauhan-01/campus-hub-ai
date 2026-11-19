const mongoose = require('mongoose');
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true, index: true }, title: { type: String, default: 'Chat with note' }, messages: [{ role: { type: String, enum: ['user', 'assistant'], required: true }, content: { type: String, required: true }, createdAt: { type: Date, default: Date.now } }] }, { timestamps: true });
module.exports = mongoose.model('Chat', schema);
