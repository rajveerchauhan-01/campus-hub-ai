const mongoose = require('mongoose');
const schema = new mongoose.Schema({ note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true, index: true }, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, downloadedAt: { type: Date, default: Date.now } });
module.exports = mongoose.model('Download', schema);
