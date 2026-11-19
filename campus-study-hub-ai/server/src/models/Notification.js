const mongoose = require('mongoose');
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, type: { type: String, enum: ['comment', 'rating', 'verification', 'follow', 'report', 'system'], default: 'system' }, message: { type: String, required: true }, resourceId: mongoose.Schema.Types.ObjectId, readAt: Date }, { timestamps: true });
module.exports = mongoose.model('Notification', schema);
