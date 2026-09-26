/**
 * razorpay.js — thin wrapper around the Razorpay Node SDK.
 * Lazily initialised so the server starts even without credentials
 * (they are required only when a student actually tries to pay).
 */

const crypto = require('crypto');
let _razorpay = null;

function getRazorpay() {
  if (_razorpay) return _razorpay;
  const Razorpay = require('razorpay');
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET ||
      process.env.RAZORPAY_KEY_ID.includes('REPLACE')) {
    throw new Error(
      'Razorpay credentials not configured. ' +
      'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env'
    );
  }
  _razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return _razorpay;
}

/**
 * Create a Razorpay order.
 * amount: in PAISE (rupees × 100)
 */
async function createOrder({ amountInPaise, currency = 'INR', receipt, notes = {} }) {
  const rz = getRazorpay();
  return rz.orders.create({
    amount:   amountInPaise,
    currency,
    receipt,
    notes,
  });
}

/**
 * Verify Razorpay payment signature.
 * Returns true if valid.
 */
function verifySignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !orderId || !paymentId || !signature) return false;
  const body    = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');
  return expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

async function fetchOrder(orderId) {
  return getRazorpay().orders.fetch(orderId);
}

async function fetchPayment(paymentId) {
  return getRazorpay().payments.fetch(paymentId);
}

/**
 * Verify Razorpay webhook signature.
 */
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature || secret.includes('REPLACE')) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');
  return expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

module.exports = {
  createOrder,
  fetchOrder,
  fetchPayment,
  verifySignature,
  verifyWebhookSignature,
};
