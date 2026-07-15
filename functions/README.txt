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

The Minorities — subscription checkout (the-minorities)
========================================================

Separate Firebase project — NOT naples-sunrise-bay or liv-lakay.

1) Firebase Console project: the-minorities
   • Enable Authentication → Email/Password
   • Create Firestore database
   • Web app config → minoritiesView/scripts/minFirebaseConfig.js

2) Install & deploy (from repo root):
   cd minoritiesFunctions && npm install
   firebase deploy -c firebase.minorities.json --project minorities --only firestore:rules,functions

3) Functions (region us-central1, project the-minorities):
   createMinSubscriptionCheckout  POST + Bearer Firebase ID token → { url }
   createMuxDirectUpload          POST + Bearer Firebase ID token → { uploadId, uploadUrl }
   getMuxUploadStatus             POST + Bearer Firebase ID token → { playbackId, ready, ... }
   muxWebhook                     POST (Mux signed events — optional but recommended)
   stripeWebhook                  POST (Stripe signed events)

4) Mux (free plan at mux.com — no credit card):
   Settings → Access Tokens → create token (Mux Token ID + Mux Token Secret)
   Settings → Webhooks → add endpoint:
   https://us-central1-the-minorities.cloudfunctions.net/muxWebhook
   Event: video.asset.ready
   Copy signing secret.

   firebase functions:secrets:set MUX_TOKEN_ID
   firebase functions:secrets:set MUX_TOKEN_SECRET
   firebase functions:secrets:set MUX_WEBHOOK_SECRET

5) Stripe — create 3 monthly Prices (Waterboy is free), set function params:
   MIN_STRIPE_PRICE_BENCH, MIN_STRIPE_PRICE_STARTER, MIN_STRIPE_PRICE_OWNER, MIN_PUBLIC_URL

   Leave params as CLEAR_REQUIRED until real price_… IDs exist.
   Also paste Price IDs into minoritiesView/scripts/minStripeConfig.js and set CHECKOUT_LIVE = true.

   Webhook URL:
   https://us-central1-the-minorities.cloudfunctions.net/stripeWebhook
   Events: checkout.session.completed, checkout.session.async_payment_succeeded,
           customer.subscription.updated, customer.subscription.deleted

   Secrets (same names as Liv): STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

   Full steps: minoritiesFunctions/README.txt

Firestore (minoritiesView/firestore.rules):
  users/{uid}                  profiles + tier (paid tiers should be webhook-updated when live)
  stripeCheckoutSessions/{id}  webhook idempotency (client blocked)
