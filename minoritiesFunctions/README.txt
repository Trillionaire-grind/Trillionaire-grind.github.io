The Minorities — Cloud Functions (project: the-minorities)
==========================================================

Deploy from repo root:
  cd minoritiesFunctions && npm install
  firebase deploy -c firebase.minorities.json --project the-minorities --only functions

Region: us-central1

Functions
---------
  createMuxDirectUpload           POST + Bearer Firebase ID token
  getMuxUploadStatus              POST + Bearer Firebase ID token
  createMinSubscriptionCheckout   POST + Bearer Firebase ID token → { url }
  stripeWebhook                   POST (Stripe signed events)
  onPostCreatedPush / onContentCardCreatedPush / onChatMessageCreatedPush

Public site URL (push deep links + Checkout success/cancel)
------------------------------------------------------------
  Param: MIN_PUBLIC_URL
  Default: https://trillionaire-grind.github.io
  Set to your real brand domain when ready (no trailing slash).

  firebase functions:params:set MIN_PUBLIC_URL --project the-minorities
  (or set in Google Cloud Console → Cloud Functions → environment / params)

Stripe subscription checkout
----------------------------
1) Stripe Dashboard → create Products + monthly Prices for:
     bench ($1), starter ($14.99), owner ($2497)
   Waterboy is free — no Price ID.

2) Set function string params (placeholders until live):
     MIN_STRIPE_PRICE_BENCH    = price_…   (or leave empty / CLEAR_REQUIRED)
     MIN_STRIPE_PRICE_STARTER  = price_…
     MIN_STRIPE_PRICE_OWNER    = price_…
     MIN_PUBLIC_URL            = https://your-domain.example

3) Secrets:
     firebase functions:secrets:set STRIPE_SECRET_KEY --project the-minorities
     firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project the-minorities

4) Webhook endpoint:
     https://us-central1-the-minorities.cloudfunctions.net/stripeWebhook
   Events:
     checkout.session.completed
     checkout.session.async_payment_succeeded
     customer.subscription.updated
     customer.subscription.deleted

5) Client: minoritiesView/scripts/minStripeConfig.js
     Paste the same Price IDs, then set CHECKOUT_LIVE = true.
     Until then the Subscribe page stays in honest demo/preview mode.

Mux (optional video)
--------------------
  firebase functions:secrets:set MUX_TOKEN_ID --project the-minorities
  firebase functions:secrets:set MUX_TOKEN_SECRET --project the-minorities
