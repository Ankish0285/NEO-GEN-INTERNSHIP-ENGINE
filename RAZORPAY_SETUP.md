# Razorpay Setup

The NEO GEN Internship Engine uses Razorpay Orders and Checkout for paid subscription plans. The backend remains the source of truth for plan, amount, payment verification, and subscription activation.

## Step 1: Create or activate a Razorpay account

Create a Razorpay account and complete the required account and business verification steps.

## Step 2: Get Test API keys

In the Razorpay Dashboard, switch to **Test Mode**, then open **Account & Settings > API Keys** and generate a key pair.

## Step 3: Configure the backend environment

Add these values to `backend/.env`. Never add the secret or webhook secret to frontend environment variables.

```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

The existing project `.gitignore` excludes `.env` files. The public key is returned by the authenticated order-creation response only; Checkout never receives the secret.

## Step 4: Test a payment

1. Start the backend and frontend.
2. Log in as a student and open the existing subscription/paywall UI.
3. Select **Starter (₹49)** or another active paid plan.
4. Complete Razorpay Test Mode Checkout with a Razorpay test payment method.
5. Confirm that Checkout success is followed by `/api/subscriptions/verify-payment`, then check `/api/subscriptions/me` for `ACTIVE`, `startedAt`, and `expiresAt`.
6. Confirm the payment in the admin dashboard under **Subscription Management > Payments**.

The backend routes are:

- `POST /api/subscriptions/create-order`
- `POST /api/subscriptions/verify-payment`
- `POST /api/subscriptions/webhook`
- `GET /api/subscriptions/me`
- `GET /api/subscriptions/plans`

## Step 5: Switch to production

After successful testing, switch the Razorpay Dashboard to **Live Mode**, generate live API keys, and replace only the three backend `.env` values. No code change is required. Restart the backend after changing environment variables.

## Step 6: Configure the webhook

In Razorpay Dashboard **Webhooks**, add this publicly reachable HTTPS URL:

```text
https://<your-backend-domain>/api/subscriptions/webhook
```

Use the same value as `RAZORPAY_WEBHOOK_SECRET` and enable at least:

- `payment.captured`
- `payment.failed`
- `order.paid`

The webhook handler verifies `x-razorpay-signature`, deduplicates `x-razorpay-event-id`, and activates only the matching pending subscription. The authenticated verification endpoint also fetches the Razorpay order and payment before activation, so frontend values cannot change the amount, currency, user, or plan.

## Deployment notes

- Set the variables in the EC2 backend environment, not in the S3/CloudFront frontend build.
- Keep the webhook URL HTTPS and publicly reachable by Razorpay.
- Keep the frontend API base URL in the existing environment configuration; no localhost URL is used by the payment integration.
- Use Test Mode keys for development and Live Mode keys for production.