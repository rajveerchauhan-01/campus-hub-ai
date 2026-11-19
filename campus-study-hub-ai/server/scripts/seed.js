require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
(async () => {
  try {
    if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in server/.env before running the seed script.');
    await mongoose.connect(process.env.MONGO_URI);
    const email = process.env.SEED_ADMIN_EMAIL.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) { console.log('Admin account already exists.'); process.exit(0); }
    await User.create({ firstName: process.env.SEED_ADMIN_FIRST_NAME || 'Campus', lastName: 'Administrator', email, passwordHash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12), role: 'admin', isEmailVerified: true });
    console.log(`Admin account created: ${email}`);
    process.exit(0);
  } catch (error) { console.error(error.message); process.exit(1); }
})();
