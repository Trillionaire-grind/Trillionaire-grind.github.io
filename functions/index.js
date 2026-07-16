"use strict";

const crypto = require("crypto");
const express = require("express");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const stripePriceId = defineString("STRIPE_PRICE_ID");
const livPublicUrl = defineString("LIV_PUBLIC_URL", {
  default: "https://keplersiguineau.com",
});

/** Set only on dev/staging. Client sends same value in header X-Liv-Dev-Mint. Leave empty to disable mint. */
const livDevMintKey = defineString("LIV_DEV_MINT_KEY", { default: "" });

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateAccessCode(length = 14) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHARSET[bytes[i] % CHARSET.length];
  }
  return out;
}

function safeRelativePath(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("..")) return fallback;
  return trimmed;
}

const CODES_PURCHASED_COLL = "codesPurchased";

function purchasedCodePayload(extra) {
  return {
    used: false,
    active: true,
    createdAt: FieldValue.serverTimestamp(),
    ...extra,
  };
}

/**
 * Idempotently create codesPurchased/{code} after a paid Checkout Session.
 */
async function issueAccessCodeFromCheckoutSession(session) {
  const sessionId = session.id;
  const ref = db.collection("stripeCheckoutSessions").doc(sessionId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      return;
    }
    const code = generateAccessCode();
    const email = session.customer_details?.email || session.customer_email || null;

    tx.set(ref, {
      accessCodeId: code,
      createdAt: FieldValue.serverTimestamp(),
      purchaserEmail: email,
    });

    tx.set(
      db.collection(CODES_PURCHASED_COLL).doc(code),
      purchasedCodePayload({
        stripeSessionId: sessionId,
        stripePaymentIntent: session.payment_intent || null,
        purchaserEmail: email,
      }),
    );
  });
}

/**
 * POST / → { url: string }  (Stripe Checkout Session URL)
 * CORS enabled for static Liv Lakay site.
 */
exports.createLivPassCheckout = onRequest(
  {
    secrets: [stripeSecretKey],
    cors: true,
    region: "us-central1",
    invoker: "public",
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const stripe = new Stripe(stripeSecretKey.value());
      const base = livPublicUrl.value().replace(/\/$/, "");
      const requestedSuccessPath = req.body && req.body.successPath;
      const requestedCancelPath = req.body && req.body.cancelPath;
      const successPath = safeRelativePath(requestedSuccessPath, "/liv.html");
      const cancelPath = safeRelativePath(requestedCancelPath, "/liv.html");

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price: stripePriceId.value(),
            quantity: 1,
          },
        ],
        success_url: `${base}${successPath}?pass=paid&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}${cancelPath}?pass=cancelled`,
        metadata: { app: "liv-lakay-pass" },
      });

      res.status(200).json({ url: session.url });
    } catch (err) {
      logger.error("createLivPassCheckout", err);
      res.status(500).json({ error: "checkout_failed" });
    }
  },
);

/**
 * Stripe webhook — raw JSON body required for signature verification.
 * Add URL in Stripe Dashboard → Developers → Webhooks.
 */
const stripeWebhookApp = express();
stripeWebhookApp.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).send("Missing stripe-signature");
      return;
    }

    let event;
    try {
      const stripe = new Stripe(stripeSecretKey.value());
      event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret.value());
    } catch (err) {
      logger.error("Webhook signature failed", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          if (session.payment_status === "paid") {
            await issueAccessCodeFromCheckoutSession(session);
          }
          break;
        }
        case "checkout.session.async_payment_succeeded": {
          const session = event.data.object;
          await issueAccessCodeFromCheckoutSession(session);
          break;
        }
        default:
          break;
      }
    } catch (err) {
      logger.error("Webhook handler error", err);
      res.status(500).json({ error: "handler_failed" });
      return;
    }

    res.status(200).json({ received: true });
  },
);

exports.stripeWebhook = onRequest(
  {
    secrets: [stripeSecretKey, stripeWebhookSecret],
    region: "us-central1",
    invoker: "public",
  },
  stripeWebhookApp,
);

/**
 * POST JSON { sessionId } — after redirect from Checkout, return access code from Firestore.
 */
const revealApp = express();
revealApp.use(express.json({ limit: "32kb" }));
revealApp.post("/", async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const sessionId = req.body && req.body.sessionId;
  if (!sessionId || typeof sessionId !== "string") {
    res.status(400).json({ error: "missing_session_id" });
    return;
  }

  try {
    const stripe = new Stripe(stripeSecretKey.value());
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      res.status(400).json({ error: "not_paid" });
      return;
    }

    const snap = await db.collection("stripeCheckoutSessions").doc(sessionId).get();
    if (!snap.exists) {
      res.status(202).json({
        pending: true,
        message: "Payment recorded; generating your code. Wait a few seconds and try again.",
      });
      return;
    }

    res.status(200).json({ accessCodeId: snap.data().accessCodeId });
  } catch (err) {
    logger.error("revealLivAccessCode", err);
    res.status(500).json({ error: "reveal_failed" });
  }
});

exports.revealLivAccessCode = onRequest(
  {
    secrets: [stripeSecretKey],
    cors: true,
    region: "us-central1",
    invoker: "public",
  },
  revealApp,
);

/**
 * POST / — dev/staging only: mint a real codesPurchased/{id} doc (same shape as Stripe webhook).
 * Requires function param LIV_DEV_MINT_KEY (non-empty) and matching header: X-Liv-Dev-Mint: <key>
 * Body: {} (ignored). Do NOT set LIV_DEV_MINT_KEY in production projects.
 */
const mintDevApp = express();
mintDevApp.use(express.json({ limit: "4kb" }));
mintDevApp.options("/", (req, res) => {
  res.status(204).send("");
});
mintDevApp.post("/", async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  const expected = livDevMintKey.value();
  if (!expected || String(expected).trim() === "") {
    res.status(503).json({ error: "dev_mint_not_configured" });
    return;
  }
  const sent = String(req.get("x-liv-dev-mint") || req.get("X-Liv-Dev-Mint") || "").trim();
  if (sent !== String(expected).trim()) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  try {
    const code = generateAccessCode();
    await db
      .collection(CODES_PURCHASED_COLL)
      .doc(code)
      .set(purchasedCodePayload({ devMinted: true }));
    res.status(200).json({ accessCodeId: code });
  } catch (err) {
    logger.error("mintLivDevAccessCode", err);
    res.status(500).json({ error: "mint_failed" });
  }
});

exports.mintLivDevAccessCode = onRequest(
  {
    cors: true,
    region: "us-central1",
    invoker: "public",
  },
  mintDevApp,
);
