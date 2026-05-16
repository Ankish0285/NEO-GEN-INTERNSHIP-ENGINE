const User = require('../models/User');

/**
 * ensureAdminExists
 * - Idempotent: creates admin only if none exists
 * - Password: pass PLAIN text — User model pre('save') hashes once. Pre-hashing here
 *   caused double-hashing and login always failed with "Invalid email or password".
 */
module.exports = async function ensureAdminExists() {
  try {
    const defaultName = process.env.ADMIN_NAME || 'Super Admin';
    const defaultEmail = (process.env.ADMIN_EMAIL || 'admin@neogen.com').toLowerCase().trim();
    const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin@0285';

    // One-time fix: older bootstrap pre-hashed the password → double hash in DB → login failed.
    // Set REPAIR_BOOTSTRAP_ADMIN=true in .env, restart once, then remove the line.
    console.log(`[Bootstrap] Checking repair - REPAIR_BOOTSTRAP_ADMIN: ${process.env.REPAIR_BOOTSTRAP_ADMIN}`);
    if (process.env.REPAIR_BOOTSTRAP_ADMIN === 'true') {
      console.log(`[Bootstrap] Force Re-creating admin for: ${defaultEmail}`);
      await User.deleteOne({ email: defaultEmail });
      console.log(`[Bootstrap] Old admin deleted.`);
    }

    const adminExists = await User.findOne({ email: defaultEmail });
    if (adminExists) {
      console.log(`[Bootstrap] Admin (${defaultEmail}) already exists. Skipping creation.`);
      return;
    }

    const adminUser = await User.create({
      name: defaultName,
      email: defaultEmail,
      password: defaultPassword,
      role: 'admin',
      active: true,
      isVerified: true
    });

    console.log('\n════════ Admin Bootstrap ═════════');
    console.log(`✅ Admin created successfully`);
    console.log(`👤 Name:     ${adminUser.name}`);
    console.log(`📧 Email:    ${adminUser.email}`);
    console.log('🔐 Password: (hidden)');
    console.log('🔎 Role:     admin');
    console.log('════════════════════════════════════\n');
  } catch (err) {
    console.error('[Bootstrap] Failed to ensure admin exists:', err.message);
  }
};
