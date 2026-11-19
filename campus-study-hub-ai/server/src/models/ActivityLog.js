const mongoose = require('mongoose');
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, action: { type: String, required: true }, entityType: String, entityId: mongoose.Schema.Types.ObjectId, metadata: mongoose.Schema.Types.Mixed }, { timestamps: true });
module.exports = mongoose.model('ActivityLog', schema);
