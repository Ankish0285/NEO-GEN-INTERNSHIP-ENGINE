/**
 * subscriptionSettings.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight in-process cache for global subscription configuration.
 * Super Admin can toggle any AI feature on/off from the admin panel.
 *
 * Per-feature subscription flags:
 *   feature_atsAnalysis           — ATS resume upload/score
 *   feature_aiResumeAnalysis      — POST /api/ai/analyze
 *   feature_aiReport              — GET  /api/ai/intelligence
 *   feature_premiumRecommendations — GET  /api/ai/recommendations
 *   feature_aiChat                — POST /api/ai/chat
 *   feature_aiMatch               — POST /api/ai/match/:id
 *
 *   When a feature flag is TRUE  → subscription required (no free tier)
 *   When a feature flag is FALSE → free tier still applies (freeResumeLimit)
 *
 *   freeResumeLimit  — how many free analyses before subscription required
 */

const SiteSettings = require('../models/SiteSettings');

// ── In-memory defaults ────────────────────────────────────────────────────────
let _cache = {
  freeResumeLimit: 2,

  // Feature-level subscription gates — false = use free tier, true = always require sub
  feature_atsAnalysis:            false,
  feature_aiResumeAnalysis:       false,
  feature_aiReport:               false,
  feature_premiumRecommendations: false,
  feature_aiChat:                 false,
  feature_aiMatch:                false,
};

let _loaded = false;

async function _load() {
  if (_loaded) return;
  try {
    const doc = await SiteSettings.findOne({ key: 'main' }).lean();
    if (doc?.subscriptionSettings) {
      _cache = { ..._cache, ...doc.subscriptionSettings };
    }
  } catch (e) {
    console.warn('[subscriptionSettings] Could not load from DB, using defaults:', e.message);
  }
  _loaded = true;
}

async function getFreeLimit() {
  await _load();
  return _cache.freeResumeLimit ?? 2;
}

async function getSettings() {
  await _load();
  return { ..._cache };
}

/**
 * Returns true if the given featureKey requires a subscription RIGHT NOW
 * (i.e. the admin has turned on the gate for it).
 */
async function featureRequiresSubscription(featureKey) {
  await _load();
  const flag = `feature_${featureKey}`;
  return _cache[flag] === true;
}

async function updateSettings(newValues) {
  _cache = { ..._cache, ...newValues };
  _loaded = true;

  try {
    await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      { $set: { subscriptionSettings: _cache } },
      { upsert: true, new: true }
    );
  } catch (e) {
    console.error('[subscriptionSettings] Failed to persist to DB:', e.message);
  }

  return { ..._cache };
}

function invalidateCache() {
  _loaded = false;
}

module.exports = { getFreeLimit, getSettings, featureRequiresSubscription, updateSettings, invalidateCache };
