const mongoose = require('mongoose');
const schema = new mongoose.Schema({ note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true }, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } }, { timestamps: true });
schema.index({ note: 1, user: 1 }, { unique: true });
module.exports = mongoose.model('Bookmark', schema);
