const mongoose = require('mongoose');
const schema = new mongoose.Schema({ title: { type: String, required: true }, description: String, subject: { type: String, required: true }, branch: String, semester: Number, dueAt: Date, attachment: Object, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, isPublished: { type: Boolean, default: true } }, { timestamps: true });
module.exports = mongoose.model('Assignment', schema);
