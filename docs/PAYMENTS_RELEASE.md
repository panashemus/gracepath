# GracePath payment release checklist

## Current status (12 November 2026)

The payment backend has been hardened, but **live checkout is not ready to accept money**. Do not advertise purchases until sandbox payment testing and a separately approved live launch succeed.

**12 November follow-up:** `paypal-create-order` and `paypal-webhook` have been redeployed with strict sandbox-only API guards. Webhook receipts are immutable and replay-resistant; expired events do not re-enable Premium or downgrade newer entitlements. Legacy unverified direct PayPal payment links were removed from frontend source. The frontend SDK now requires `VITE_PAYMENT_MODE=sandbox`. These changes are in GitHub and Supabase; the live Netlify website has NOT been redeployed because it is still an October 4 manual upload.

**Connected-tool blockers:** The Netlify environment-variable write was rejected with HTTP 403. The connected PayPal integration does not expose Developer Dashboard REST-app credential rotation or sandbox app configuration. The connected Supabase tools can deploy functions but do not provide production Edge Function secret management. Credential rotation, secret entry, Git repository linking, and an actual sandbox buyer payment therefore remain incomplete; do not claim that these steps have passed.

The current production Netlify deploy is a standalone Vite build from October 4 and does **not** automatically publish GitHub commits.

## Critical: rotate the old PayPal credentials

A previous deployed version of `paypal-create-order` contained a hardcoded **live** PayPal client secret. That code has been replaced, but the old secret must be revoked/rotated in the PayPal Developer Dashboard. Never paste credentials in code, repository files, chat, or public client environment variables.

## Configure server secrets in Supabase

Add function secrets:
- `PAYPAL_CLIENT_ID`: public client identifier of the PayPal REST app for the selected environment.
- `PAYPAL_SECRET`: freshly rotated, private PayPal REST API client secret.
- `PAYPAL_API_BASE`: `https://api-m.sandbox.paypal.com` for sandbox testing; `https://api-m.paypal.com` for verified live use.
- `PAYPAL_WEBHOOK_ID`: ID of PayPal webhook subscribed to `PAYMENT.CAPTURE.COMPLETED` for `https://puvmcmglntpqgfelxrcu.supabase.co/functions/v1/paypal-webhook`.

The Supabase runtime supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. The service-role key must never be exposed in the web app.

The webhook verifies PayPal signatures, captures and prices. Both order creation and receipt checks require a valid signed-in user.

## Configure Netlify

Link the existing site `silly-kitsune-0ba133` to the GitHub repository `panashemus/gracepath` (branch `main`) for automatic builds.

Build command: `npm run build`; publish directory: `dist`. Both are declared in `netlify.toml`.

Set:
- `VITE_PAYMENT_MODE=sandbox` (currently missing; required to enable the frontend SDK)
- `VITE_SUPABASE_URL` (already present)
- `VITE_SUPABASE_ANON_KEY` (already present; publishable client key)
- `VITE_PAYPAL_CLIENT_ID` (currently missing; the **public** client identifier only)

Never set `VITE_PAYPAL_SECRET` or `VITE_OPENROUTER_API_KEY`: Vite's `VITE_` values are exposed to browsers.

## Test before accepting real payments

1. On a non-production build, use consistent sandbox REST app keys, SDK client ID and webhook ID.
2. Run `npm ci`, `npm run typecheck`, `npm run lint`, and `npm run build`.
3. Sign in as a test user; confirm missing SDK / blocked requests return understandable errors.
4. Purchase each plan using **PayPal sandbox accounts only**. Verify one receipt, the correct authenticated account's access, the expected price and expiration.
5. Confirm an unverified/fake webhook, a different user's order ID, invalid amount, duplicate webhook and cancelled payment **never unlock Premium**. The source-level safety tests are in `tests/payment-guards.test.mjs` and CI runs from `.github/workflows/gracepath-ci.yml`; these are NOT substitutes for real sandbox checkout.
6. Verify refunds/reversals, customer support, failure recovery and time-limited access policies before launch.
7. Repeat an authorized small live transaction after switching to rotated live credentials and complete a legitimate refund.

**Billing behavior:** The current REST Orders implementation is *one-time billing*. Monthly and annual plan labels are now represented as prepaid 30-day and 365-day access; there is no automatic renewal. Proper recurring subscriptions require separate PayPal Subscriptions API plans, cancellation/rebilling logic, and lifecycle webhooks.

**AI behavior:** Production currently lacks a server-side OpenRouter integration; prayers fall back to in-browser templates. Do not market them as AI-generated until an authenticated, rate-limited server endpoint has been tested.
