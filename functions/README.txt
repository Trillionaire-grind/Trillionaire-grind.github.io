Liv Lakay — Stripe Cloud Functions
==================================

Functions (region: us-central1, project: liv-lakay)
  createLivPassCheckout  POST → JSON { url } (redirect user to url)
  stripeWebhook          POST (Stripe signed events only)
  revealLivAccessCode    POST JSON { sessionId } → JSON { accessCodeId } or { pending: true }
  mintLivDevAccessCode   POST (dev/staging only) header X-Liv-Dev-Mint → JSON { accessCodeId }
                         Disabled when param LIV_DEV_MINT_KEY is empty. Writes codesPurchased/{code}.

Prerequisites
  • Node 20+
  • Firebase CLI: npm i -g firebase-tools
  • Stripe account + Product + one-time Price
  • Logged in: firebase login

1) Install deps
   cd functions && npm install

2) Create Stripe secrets & params (first time, interactive)
   firebase functions:secrets:set STRIPE_SECRET_KEY
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

   firebase functions:config:set does NOT apply to v2 defineSecret — use secrets:set above.

   For defineString params:
   firebase functions:config:export   # optional — see Firebase docs for v2 params

   v2 string params (STRIPE_PRICE_ID, LIV_PUBLIC_URL) are set in Google Cloud Console:
   Firebase console → Functions → your function → … or use:
   gcloud functions deploy ... (advanced)

   Simpler path — use Firebase Console → Build → Functions → select project →
   "Manage" environment/configuration for 2nd gen, or run locally:

   firebase deploy --only functions

   Then in Google Cloud Console → Cloud Functions → each function → Edit →
   Variables & secrets — add:
     STRIPE_PRICE_ID    = price_xxxxxxxx (from Stripe Dashboard → Products → Price ID)
     LIV_PUBLIC_URL     = https://YOUR-GITHUB-PAGES-HOST (no trailing slash)
                          e.g. https://trillionaire-grind.github.io

   Secrets STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be attached to each
   function that lists them in index.js (Console → function → Secrets tab).

3) Deploy
   From repo root:
   firebase deploy --only functions

4) Stripe Dashboard
   Developers → Webhooks → Add endpoint
     URL: https://us-central1-liv-lakay.cloudfunctions.net/stripeWebhook
     Events: checkout.session.completed, checkout.session.async_payment_succeeded
   Copy signing secret → STRIPE_WEBHOOK_SECRET (if you rotate, update the secret).

   Developers → API keys → Secret key → STRIPE_SECRET_KEY

5) Test checkout locally
   stripe listen --forward-to localhost:5001/...
   (Use Firebase emulator; optional.)

6) Site config
   Paste deployed HTTPS URLs into livViews/scripts/livCheckoutConfig.js :
     LIV_CREATE_CHECKOUT_SESSION_URL
     LIV_REVEAL_ACCESS_CODE_URL
     LIV_DEV_MINT_URL (optional; dev mint only — leave "" in production)

   Dev mint flow: set LIV_DEV_MINT_KEY on mintLivDevAccessCode in Cloud Console (non-empty string).
   On localhost / 127.0.0.1 / livPass.html?devMint=1, the pass page shows a panel to POST mint
   and redirect to liv.html?openSignup=1&code=… (query stripped after opening signup).

Notes
  • Webhook must return 200 quickly; heavy work stays minimal (one Firestore txn).
  • If reveal returns pending, the client retries (webhook slightly delayed).
  • Firestore rules must block client access to stripeCheckoutSessions (see livViews/firestore.accessCodes.rules.txt).
