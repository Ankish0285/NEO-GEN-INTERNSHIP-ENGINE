const User = require('../models/User');

/**
 * Approve partner accounts stuck in "pending" (e.g. role set to partner without status update).
 * Set PARTNER_REQUIRE_APPROVAL=true in .env to keep manual approval workflow.
 */
module.exports = async function syncPartnerApprovals() {
  if (process.env.PARTNER_REQUIRE_APPROVAL === 'true') {
    console.log('[Bootstrap] Partner auto-approval disabled (PARTNER_REQUIRE_APPROVAL=true)');
    return;
  }

  try {
    const result = await User.updateMany(
      { role: 'partner', partnerStatus: 'pending' },
      { $set: { partnerStatus: 'approved', isVerified: true } }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Bootstrap] Approved ${result.modifiedCount} pending partner account(s)`);
    }
  } catch (err) {
    console.error('[Bootstrap] Partner approval sync failed:', err.message);
  }
};
