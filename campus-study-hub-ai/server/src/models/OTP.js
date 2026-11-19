const mongoose = require('mongoose');
const schema = new mongoose.Schema({ email: { type: String, required: true, lowercase: true, index: true }, codeHash: { type: String, required: true }, purpose: { type: String, enum: ['verify-email', 'reset-password'], required: true }, expiresAt: { type: Date, required: true, index: { expires: 0 } }, attempts: { type: Number, default: 0 } }, { timestamps: true });
module.exports = mongoose.model('OTP', schema);
