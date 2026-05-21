/**
 * Approve one or all pending partner accounts.
 * Usage:
 *   node scripts/approve-partner.js
 *   node scripts/approve-partner.js poonam.kumari@vgu.ac.in
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2]?.toLowerCase().trim();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const filter = email
    ? { email, role: 'partner' }
    : { role: 'partner', partnerStatus: 'pending' };

  const users = await User.find(filter);
  if (!users.length) {
    console.log(email ? `No partner found: ${email}` : 'No pending partners found.');
    process.exit(0);
  }

  for (const user of users) {
    user.partnerStatus = 'approved';
    user.isVerified = true;
    await user.save();
    console.log(`Approved: ${user.email} (${user.name})`);
  }

  process.exit(0);
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
