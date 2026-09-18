/**
 * subscriptionSettings.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight in-process cache for global subscription configuration.
 * Super Admin can call updateSettings() via the admin API; value is persisted
 * in SiteSettings (reuses the existing key:'main' document under a new field)
 * and cached in-memory so every request doesn't hit MongoDB.
 *
 * Fields managed here:
 *   freeResumeLimit (default 2)  — how many free ATS analyses each student gets
 *   atsRequiresSubscription      — if true, even the first check needs a sub (default false)
 *   aiRequiresSubscription       — if true, all AI analysis needs a sub (default false)
 */

const SiteSettings = require('../models/SiteSettings');

// ── In-memory defaults ────────────────────────────────────────────────────────
let _cache = {
  freeResumeLimit:          2,
  atsRequiresSubscription:  false,
  aiRequiresSubscription:   false,
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

async function updateSettings(newValues) {
  _cache = { ..._cache, ...newValues };
  _loaded = true;

  // Persist to SiteSettings document
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

/** Call this after server restart to bust the cache and re-read from DB. */
function invalidateCache() {
  _loaded = false;
}

module.exports = { getFreeLimit, getSettings, updateSettings, invalidateCache };
