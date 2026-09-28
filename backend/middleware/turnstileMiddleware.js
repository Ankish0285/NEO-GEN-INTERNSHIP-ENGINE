/**
 * turnstileMiddleware.js
 *
 * Verifies Cloudflare Turnstile tokens server-side before allowing
 * login or registration requests to proceed.
 *
 * Usage — add to a route BEFORE the controller:
 *   router.post('/login', verifyTurnstile, loginUser);
 *
 * The frontend must send the token in req.body.turnstileToken.
 *
 * Security rules:
 *  - Secret key is read only from process.env.TURNSTILE_SECRET_KEY
 *  - Tokens are never logged
 *  - Cloudflare errors are masked from client responses in production
 *  - Remote IP is forwarded to Cloudflare for better bot detection
 */

const asyncHandler = require('express-async-handler');

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Express middleware — reject the request if Turnstile verification fails.
 */
const verifyTurnstile = asyncHandler(async (req, res, next) => {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If TURNSTILE_SECRET_KEY is not configured, skip in development, block in production
  if (!secretKey || secretKey === 'your_cloudflare_turnstile_secret_key_here') {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        message: 'Human verification service is not configured. Please contact support.',
      });
    }
    // Dev/test: allow through with a warning
    console.warn('[Turnstile] TURNSTILE_SECRET_KEY not set — skipping verification in development');
    return next();
  }

  const token = req.body.turnstileToken;

  if (!token || typeof token !== 'string' || token.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Human verification is required. Please complete the Turnstile challenge.',
    });
  }

  // Get the real client IP (respects X-Forwarded-For from Cloudflare proxy)
  const remoteip =
    (req.headers['cf-connecting-ip'] || // Cloudflare sets this
     req.headers['x-forwarded-for']?.split(',')[0] ||
     req.ip ||
     '').trim();

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteip) formData.append('remoteip', remoteip);

    const cfResponse = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!cfResponse.ok) {
      console.error('[Turnstile] Cloudflare siteverify HTTP error:', cfResponse.status);
      return res.status(503).json({
        success: false,
        message: 'Human verification service is temporarily unavailable. Please try again.',
      });
    }

    const result = await cfResponse.json();

    if (result.success === true) {
      // Verification passed — continue to controller
      return next();
    }

    // Verification failed — return user-safe message
    const codes = result['error-codes'] || [];
    console.warn('[Turnstile] Verification failed. Error codes:', codes);

    const isExpired = codes.includes('timeout-or-duplicate');
    return res.status(403).json({
      success: false,
      message: isExpired
        ? 'Verification expired. Please refresh the page and try again.'
        : 'Human verification failed. Please complete the challenge and try again.',
      turnstileError: true,
    });
  } catch (err) {
    // Network / fetch error reaching Cloudflare
    console.error('[Turnstile] Network error contacting Cloudflare:', err.message);
    return res.status(503).json({
      success: false,
      message: 'Human verification service is temporarily unavailable. Please try again.',
    });
  }
});

module.exports = { verifyTurnstile };
