"use strict";

const express = require("express");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const { auth } = require("firebase-functions/v1");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Stripe = require("stripe");

const { normalizeTier, tierFromStripePriceId, PAID_TIER_IDS } = require("./tiers");
const seedData = require("./seedData");

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const APP_ID = "the-minorities";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const minPublicUrl = defineString("MIN_PUBLIC_URL", {
  default: "https://keplersiguineau.com",
});

/** Stripe Price IDs — set in Firebase Functions params (one per tier). */
const minPriceWaterboy = defineString("MIN_PRICE_WATERBOY", { default: "" });
const minPriceBench = defineString("MIN_PRICE_BENCH", { default: "" });
const minPriceStarter = defineString("MIN_PRICE_STARTER", { default: "" });
const minPriceVip = defineString("MIN_PRICE_VIP", { default: "" });

/** Protect one-time seed endpoint. Leave empty in prod after seeding. */
const minAdminSeedKey = defineString("MIN_ADMIN_SEED_KEY", { default: "" });

function priceMapFromParams() {
  return {
    waterboy: minPriceWaterboy.value(),
    bench: minPriceBench.value(),
    starter: minPriceStarter.value(),
    vip: minPriceVip.value(),
  };
}

function safeRelativePath(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("..")) return fallback;
  return trimmed;
}

function userProfileDefaults(extra) {
  return {
    displayName: "",
    username: "",
    bio: "",
    avatarUrl: "",
    tier: "free",
    admin: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    subscriptionStatus: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ...extra,
  };
}

async function verifyFirebaseIdToken(req) {
  const header = req.get("authorization") || req.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch (err) {
    logger.warn("verifyFirebaseIdToken failed", err.message);
    return null;
  }
}

async function applySubscriptionToUser(uid, subscription, priceMap) {
  if (!uid) return;

  const priceId =
    subscription.items &&
    subscription.items.data &&
    subscription.items.data[0] &&
    subscription.items.data[0].price &&
    subscription.items.data[0].price.id;

  const status = subscription.status;
  const active = status === "active" || status === "trialing";
  const tier = active ? tierFromStripePriceId(priceId, priceMap) : "free";

  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        tier: normalizeTier(tier),
        stripeCustomerId: subscription.customer || null,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId || null,
        subscriptionStatus: status,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

async function handleMinCheckoutCompleted(session, priceMap) {
  const uid = session.client_reference_id || session.metadata?.firebaseUid;
  if (!uid) {
    logger.error("Min checkout missing firebase uid", session.id);
    return;
  }

  const subscriptionId = session.subscription;
  if (!subscriptionId) {
    logger.error("Min checkout missing subscription id", session.id);
    return;
  }

  const stripe = new Stripe(stripeSecretKey.value());
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await applySubscriptionToUser(uid, subscription, priceMap);

  await db.collection("stripeCheckoutSessions").doc(session.id).set(
    {
      app: APP_ID,
      firebaseUid: uid,
      subscriptionId,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Auth trigger — create users/{uid} with tier free on sign-up.
 */
exports.minAuthUserCreate = auth.user().onCreate(async (user) => {
  const ref = db.collection("users").doc(user.uid);
  const snap = await ref.get();
  if (snap.exists) return;

  await ref.set(
    userProfileDefaults({
      email: user.email || "",
      displayName: user.displayName || "",
    }),
  );
});

/**
 * POST { tierId, successPath?, cancelPath? }
 * Authorization: Bearer <Firebase ID token>
 * Returns { url } Stripe Checkout Session for subscription.
 */
exports.createMinSubscriptionCheckout = onRequest(
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

    const decoded = await verifyFirebaseIdToken(req);
    if (!decoded) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const tierId = normalizeTier(req.body && req.body.tierId);
    if (!PAID_TIER_IDS.includes(tierId)) {
      res.status(400).json({ error: "invalid_tier" });
      return;
    }

    const priceMap = priceMapFromParams();
    const priceId = priceMap[tierId];
    if (!priceId) {
      res.status(503).json({ error: "price_not_configured", tierId });
      return;
    }

    try {
      const stripe = new Stripe(stripeSecretKey.value());
      const base = minPublicUrl.value().replace(/\/$/, "");
      const successPath = safeRelativePath(req.body && req.body.successPath, "/minorities.html");
      const cancelPath = safeRelativePath(req.body && req.body.cancelPath, "/minorities.html#subscribe");

      const userSnap = await db.collection("users").doc(decoded.uid).get();
      const existingCustomerId =
        userSnap.exists && userSnap.data().stripeCustomerId
          ? userSnap.data().stripeCustomerId
          : undefined;

      const sessionParams = {
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${base}${successPath}?min=sub_ok&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}${cancelPath}?min=sub_cancel`,
        client_reference_id: decoded.uid,
        metadata: {
          app: APP_ID,
          tierId,
          firebaseUid: decoded.uid,
        },
        subscription_data: {
          metadata: {
            app: APP_ID,
            tierId,
            firebaseUid: decoded.uid,
          },
        },
      };

      if (existingCustomerId) {
        sessionParams.customer = existingCustomerId;
      } else if (decoded.email) {
        sessionParams.customer_email = decoded.email;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      res.status(200).json({ url: session.url });
    } catch (err) {
      logger.error("createMinSubscriptionCheckout", err);
      res.status(500).json({ error: "checkout_failed" });
    }
  },
);

/**
 * POST { returnPath? }
 * Authorization: Bearer <Firebase ID token>
 * Returns { url } Stripe Customer Portal session.
 */
exports.createMinBillingPortal = onRequest(
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

    const decoded = await verifyFirebaseIdToken(req);
    if (!decoded) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    try {
      const userSnap = await db.collection("users").doc(decoded.uid).get();
      const customerId = userSnap.exists ? userSnap.data().stripeCustomerId : null;
      if (!customerId) {
        res.status(400).json({ error: "no_stripe_customer" });
        return;
      }

      const stripe = new Stripe(stripeSecretKey.value());
      const base = minPublicUrl.value().replace(/\/$/, "");
      const returnPath = safeRelativePath(req.body && req.body.returnPath, "/minorities.html#subscribe");

      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${base}${returnPath}`,
      });

      res.status(200).json({ url: portal.url });
    } catch (err) {
      logger.error("createMinBillingPortal", err);
      res.status(500).json({ error: "portal_failed" });
    }
  },
);

/**
 * POST { sessionId }
 * After Checkout redirect — confirm subscription synced (webhook may lag).
 */
const syncApp = express();
syncApp.use(express.json({ limit: "32kb" }));
syncApp.post("/", async (req, res) => {
  const sessionId = req.body && req.body.sessionId;
  if (!sessionId || typeof sessionId !== "string") {
    res.status(400).json({ error: "missing_session_id" });
    return;
  }

  try {
    const stripe = new Stripe(stripeSecretKey.value());
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.metadata?.app !== APP_ID) {
      res.status(400).json({ error: "wrong_app" });
      return;
    }

    if (session.payment_status !== "paid" && session.status !== "complete") {
      res.status(400).json({ error: "not_paid" });
      return;
    }

    const uid = session.client_reference_id || session.metadata?.firebaseUid;
    if (!uid) {
      res.status(400).json({ error: "missing_uid" });
      return;
    }

    const priceMap = priceMapFromParams();
    if (session.subscription && typeof session.subscription === "object") {
      await applySubscriptionToUser(uid, session.subscription, priceMap);
    } else if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      await applySubscriptionToUser(uid, subscription, priceMap);
    }

    const userSnap = await db.collection("users").doc(uid).get();
    res.status(200).json({
      tier: userSnap.exists ? userSnap.data().tier : "free",
      subscriptionStatus: userSnap.exists ? userSnap.data().subscriptionStatus : null,
    });
  } catch (err) {
    logger.error("syncMinSubscription", err);
    res.status(500).json({ error: "sync_failed" });
  }
});

exports.syncMinSubscription = onRequest(
  {
    secrets: [stripeSecretKey],
    cors: true,
    region: "us-central1",
    invoker: "public",
  },
  syncApp,
);

/**
 * Stripe webhook for The Minorities subscriptions.
 * Point a separate webhook in Stripe Dashboard to this function URL.
 */
const webhookApp = express();
webhookApp.post("/", express.raw({ type: "application/json" }), async (req, res) => {
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
    logger.error("Min webhook signature failed", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const priceMap = priceMapFromParams();

  try {
    const eventRef = db.collection("stripeEvents").doc(event.id);
    const existing = await eventRef.get();
    if (existing.exists) {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.metadata?.app === APP_ID && session.mode === "subscription") {
          await handleMinCheckoutCompleted(session, priceMap);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object;
        if (subscription.metadata?.app === APP_ID) {
          const uid = subscription.metadata.firebaseUid;
          await applySubscriptionToUser(uid, subscription, priceMap);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        if (subscription.metadata?.app === APP_ID) {
          const uid = subscription.metadata.firebaseUid;
          if (uid) {
            await db.collection("users").doc(uid).set(
              {
                tier: "free",
                subscriptionStatus: "canceled",
                stripeSubscriptionId: null,
                stripePriceId: null,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
          }
        }
        break;
      }
      default:
        break;
    }

    await eventRef.set({
      type: event.type,
      app: APP_ID,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    logger.error("Min webhook handler error", err);
    res.status(500).json({ error: "handler_failed" });
    return;
  }

  res.status(200).json({ received: true });
});

exports.minStripeWebhook = onRequest(
  {
    secrets: [stripeSecretKey, stripeWebhookSecret],
    region: "us-central1",
    invoker: "public",
  },
  webhookApp,
);

/**
 * POST — seed default contentCards, chatRooms, learnSessions.
 * Header: X-Min-Admin-Seed: <MIN_ADMIN_SEED_KEY>
 * Run once on new project; leave MIN_ADMIN_SEED_KEY empty afterward.
 */
const seedApp = express();
seedApp.use(express.json({ limit: "4kb" }));
seedApp.options("/", (req, res) => {
  res.status(204).send("");
});
seedApp.post("/", async (req, res) => {
  const expected = minAdminSeedKey.value();
  if (!expected || String(expected).trim() === "") {
    res.status(503).json({ error: "seed_not_configured" });
    return;
  }
  const sent = String(req.get("x-min-admin-seed") || req.get("X-Min-Admin-Seed") || "").trim();
  if (sent !== String(expected).trim()) {
    res.status(403).json({ error: "forbidden" });
    return;
  }

  try {
    const batch = db.batch();
    const now = FieldValue.serverTimestamp();

    seedData.contentCards.forEach((card) => {
      const { id, ...rest } = card;
      batch.set(
        db.collection("contentCards").doc(id),
        { ...rest, updatedAt: now },
        { merge: true },
      );
    });

    seedData.chatRooms.forEach((room) => {
      const { id, ...rest } = room;
      batch.set(
        db.collection("chatRooms").doc(id),
        { ...rest, createdAt: now, updatedAt: now },
        { merge: true },
      );
    });

    seedData.learnSessions.forEach((session) => {
      const { id, ...rest } = session;
      batch.set(
        db.collection("learnSessions").doc(id),
        { ...rest, updatedAt: now },
        { merge: true },
      );
    });

    await batch.commit();
    res.status(200).json({ ok: true, seeded: true });
  } catch (err) {
    logger.error("adminSeedMinContent", err);
    res.status(500).json({ error: "seed_failed" });
  }
});

exports.adminSeedMinContent = onRequest(
  {
    cors: true,
    region: "us-central1",
    invoker: "public",
  },
  seedApp,
);
