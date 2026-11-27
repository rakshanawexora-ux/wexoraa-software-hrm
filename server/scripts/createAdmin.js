require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdmin() {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGO_URI || !ADMIN_NAME?.trim() || !ADMIN_EMAIL?.trim() ||
      !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12 || Buffer.byteLength(ADMIN_PASSWORD) > 72) {
    throw new Error('Set MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD of 12–72 bytes.');
  }
  await mongoose.connect(MONGO_URI);
  await User.init();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (await User.exists({ email })) throw new Error('This email already has an account.');
  const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.create({ name: ADMIN_NAME, email, password, role: 'admin' });
  console.log('Administrator account created.');
}

createAdmin().catch((error) => {
  console.error(error.code === 11000 ? 'This email already has an account.' :
    error.name === 'Error' ? error.message : error.name);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
