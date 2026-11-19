const mongoose = require('mongoose');
const schema = new mongoose.Schema({ note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true, index: true }, author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, body: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 }, parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, isHidden: { type: Boolean, default: false } }, { timestamps: true });
module.exports = mongoose.model('Comment', schema);
