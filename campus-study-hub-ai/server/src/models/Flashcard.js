const mongoose = require('mongoose');
const cardSchema = new mongoose.Schema({ front: { type: String, required: true }, back: { type: String, required: true } }, { _id: true });
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' }, title: { type: String, default: 'Revision cards' }, cards: [cardSchema] }, { timestamps: true });
module.exports = mongoose.model('Flashcard', schema);
