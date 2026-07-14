"use strict";

const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const muxTokenId = defineSecret("MUX_TOKEN_ID");
const muxTokenSecret = defineSecret("MUX_TOKEN_SECRET");
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

/** Public site origin for Checkout redirects + push deep links (no trailing slash). */
const minPublicUrl = defineString("MIN_PUBLIC_URL", {
  default: "https://trillionaire-grind.github.io",
});

/** Stripe Price IDs — leave CLEAR_REQUIRED / empty until live prices exist. Waterboy is free. */
const minStripePriceBench = defineString("MIN_STRIPE_PRICE_BENCH", { default: "CLEAR_REQUIRED" });
const minStripePriceStarter = defineString("MIN_STRIPE_PRICE_STARTER", { default: "CLEAR_REQUIRED" });
const minStripePriceOwner = defineString("MIN_STRIPE_PRICE_OWNER", { default: "CLEAR_REQUIRED" });

const TIER_FROM_SUBSCRIPTION = {
  waterboy: "free",
  bench: "bench",
  starter: "starter",
  owner: "owner",
};

const PUSH_ICON = "/minoritiesView/assets/graduation.svg";

function publicBaseUrl() {
  return String(minPublicUrl.value() || "https://trillionaire-grind.github.io").replace(/\/$/, "");
}

function isPriceConfigured(value) {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "CLEAR_REQUIRED") return false;
  if (trimmed.startsWith("LIVE_REQUIRED")) return false;
  return trimmed.startsWith("price_");
}

function priceIdForTier(tierId) {
  const map = {
    bench: minStripePriceBench.value(),
    starter: minStripePriceStarter.value(),
    owner: minStripePriceOwner.value(),
  };
  const priceId = map[tierId];
  return isPriceConfigured(priceId) ? priceId.trim() : null;
}

function safeRelativePath(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("..")) return fallback;
  const pathOnly = trimmed.split("?")[0].split("#")[0];
  return pathOnly || fallback;
}

async function collectPushTokens(excludeUid, options = {}) {
  const { vipOnly = false } = options;
  const snap = await db.collectionGroup("fcmTokens").get();
  const tokens = [];

  snap.forEach((docSnap) => {
    const uid = docSnap.ref.parent.parent.id;
    if (excludeUid && uid === excludeUid) return;

    const data = docSnap.data() || {};
    if (!data.token || typeof data.token !== "string") return;
    if (vipOnly && data.tier !== "owner") return;

    tokens.push(data.token);
  });

  logger.info("collectPushTokens", { count: tokens.length, excludeUid: excludeUid || null, vipOnly });
  return [...new Set(tokens)];
}

async function sendPushMulticast(tokens, notification, data = {}) {
  if (!tokens.length) {
    logger.warn("sendPushMulticast skipped — no tokens");
    return;
  }

  const messaging = admin.messaging();
  const base = publicBaseUrl();
  const url = data.url || `${base}/minorities.html`;
  const absoluteLink = url.startsWith("http")
    ? url
    : `${base}/${url.replace(/^\//, "")}`;
  const payloadData = {
    title: String(notification.title || "The Minorities"),
    body: String(notification.body || ""),
    url: url,
    tag: String(data.tag || "min-push"),
    type: String(data.type || "general"),
  };

  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const response = await messaging.sendEachForMulticast({
      tokens: batch,
      // Data-only so the service worker always runs onBackgroundMessage (iOS PWA).
      data: payloadData,
      webpush: {
        headers: {
          Urgency: "high",
        },
        fcmOptions: {
          link: absoluteLink,
        },
      },
    });

    if (response.failureCount > 0) {
      logger.warn("sendPushMulticast partial failure", {
        success: response.successCount,
        failure: response.failureCount,
        errors: response.responses
          .map((entry, index) =>
            entry.success ? null : { token: batch[index].slice(0, 12) + "…", error: entry.error?.message },
          )
          .filter(Boolean)
          .slice(0, 5),
      });
    } else {
      logger.info("sendPushMulticast ok", { count: response.successCount });
    }
  }
}

async function notifyAllUsers(notification, data, excludeUid, options) {
  const tokens = await collectPushTokens(excludeUid, options);
  await sendPushMulticast(tokens, notification, data);
}

async function verifyBearerToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch (err) {
    logger.warn("verifyBearerToken failed", err.message);
    return null;
  }
}

function muxAuthHeader() {
  const token = Buffer.from(`${muxTokenId.value()}:${muxTokenSecret.value()}`).toString("base64");
  return `Basic ${token}`;
}

function pickCorsOrigin(req) {
  const origin = req.headers.origin;
  if (typeof origin === "string" && origin.startsWith("http")) {
    return origin;
  }
  return publicBaseUrl();
}

async function applyUserSubscription(uid, updates) {
  if (!uid || typeof uid !== "string") {
    throw new Error("missing_uid");
  }
  await db.collection("users").doc(uid).set(
    {
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

async function fulfillCheckoutSession(session) {
  const sessionId = session.id;
  const ref = db.collection("stripeCheckoutSessions").doc(sessionId);
  const existing = await ref.get();
  if (existing.exists) {
    return;
  }

  const tierId = (session.metadata && session.metadata.tierId) || null;
  const uid =
    (session.metadata && session.metadata.firebaseUid) ||
    session.client_reference_id ||
    null;

  if (!uid || !tierId || !TIER_FROM_SUBSCRIPTION[tierId] || tierId === "waterboy") {
    logger.warn("fulfillCheckoutSession skipped — missing tier/uid", {
      sessionId,
      uid: uid || null,
      tierId: tierId || null,
    });
    await ref.set({
      skipped: true,
      reason: "missing_tier_or_uid",
      createdAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  const tier = TIER_FROM_SUBSCRIPTION[tierId];
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription && session.subscription.id
        ? session.subscription.id
        : null;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer && session.customer.id
        ? session.customer.id
        : null;

  await applyUserSubscription(uid, {
    subscriptionId: tierId,
    tier,
    subscriptionStatus: "active",
    ...(customerId ? { stripeCustomerId: customerId } : {}),
    ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
  });

  await ref.set({
    firebaseUid: uid,
    tierId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function syncSubscriptionStatus(subscription) {
  const uid =
    (subscription.metadata && subscription.metadata.firebaseUid) || null;
  if (!uid) {
    logger.warn("syncSubscriptionStatus skipped — no firebaseUid metadata");
    return;
  }

  const statusMap = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "past_due",
    incomplete_expired: "canceled",
    paused: "canceled",
  };
  const subscriptionStatus = statusMap[subscription.status] || "none";
  const tierId = (subscription.metadata && subscription.metadata.tierId) || null;

  const updates = {
    subscriptionStatus,
    stripeSubscriptionId: subscription.id,
  };
  if (typeof subscription.customer === "string") {
    updates.stripeCustomerId = subscription.customer;
  }
  if (subscriptionStatus === "canceled" || subscriptionStatus === "none") {
    updates.subscriptionId = "waterboy";
    updates.tier = "free";
  } else if (tierId && TIER_FROM_SUBSCRIPTION[tierId]) {
    updates.subscriptionId = tierId;
    updates.tier = TIER_FROM_SUBSCRIPTION[tierId];
  }
  if (subscription.current_period_end) {
    updates.subscriptionRenewsAt = new Date(subscription.current_period_end * 1000);
  }

  await applyUserSubscription(uid, updates);
}

async function muxApi(path, options = {}) {
  const response = await fetch(`https://api.mux.com${path}`, {
    ...options,
    headers: {
      Authorization: muxAuthHeader(),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error?.messages?.join(" ") || payload.error?.type || "mux_request_failed";
    throw new Error(message);
  }
  return payload.data;
}

/**
 * POST JSON { tierId, successPath?, cancelPath? }
 * Authorization: Bearer <Firebase ID token>
 * Returns { url } Stripe Checkout Session URL when Price IDs are configured.
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

    try {
      const decoded = await verifyBearerToken(req);
      if (!decoded || !decoded.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }

      const tierId = req.body && req.body.tierId;
      if (!tierId || typeof tierId !== "string" || !TIER_FROM_SUBSCRIPTION[tierId]) {
        res.status(400).json({ error: "invalid_tier" });
        return;
      }
      if (tierId === "waterboy") {
        res.status(400).json({ error: "free_tier_no_checkout" });
        return;
      }

      const priceId = priceIdForTier(tierId);
      if (!priceId) {
        res.status(503).json({ error: "tier_not_configured" });
        return;
      }

      const stripe = new Stripe(stripeSecretKey.value());
      const base = publicBaseUrl();
      const successPath = safeRelativePath(
        req.body && req.body.successPath,
        "/minorities.html",
      );
      const cancelPath = safeRelativePath(
        req.body && req.body.cancelPath,
        "/minorities.html",
      );

      const userSnap = await db.collection("users").doc(decoded.uid).get();
      const userData = userSnap.exists ? userSnap.data() || {} : {};
      const existingCustomerId =
        typeof userData.stripeCustomerId === "string" && userData.stripeCustomerId
          ? userData.stripeCustomerId
          : null;

      const sessionParams = {
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${base}${successPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}${cancelPath}?checkout=cancelled`,
        client_reference_id: decoded.uid,
        metadata: {
          app: "the-minorities",
          firebaseUid: decoded.uid,
          tierId,
        },
        subscription_data: {
          metadata: {
            app: "the-minorities",
            firebaseUid: decoded.uid,
            tierId,
          },
        },
      };

      if (existingCustomerId) {
        sessionParams.customer = existingCustomerId;
      } else if (decoded.email) {
        sessionParams.customer_email = decoded.email;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      res.status(200).json({ url: session.url, sessionId: session.id });
    } catch (err) {
      logger.error("createMinSubscriptionCheckout", err);
      res.status(500).json({ error: err.message || "checkout_failed" });
    }
  },
);

/**
 * Stripe webhook — uses req.rawBody for signature verification.
 * Events: checkout.session.completed, async_payment_succeeded,
 *         customer.subscription.updated, customer.subscription.deleted
 */
exports.stripeWebhook = onRequest(
  {
    secrets: [stripeSecretKey, stripeWebhookSecret],
    region: "us-central1",
    invoker: "public",
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).send("Missing stripe-signature");
      return;
    }

    let event;
    try {
      const stripe = new Stripe(stripeSecretKey.value());
      const payload = req.rawBody || req.body;
      event = stripe.webhooks.constructEvent(payload, sig, stripeWebhookSecret.value());
    } catch (err) {
      logger.error("stripeWebhook signature failed", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          if (session.mode === "subscription") {
            await fulfillCheckoutSession(session);
          }
          break;
        }
        case "checkout.session.async_payment_succeeded": {
          const session = event.data.object;
          if (session.mode === "subscription") {
            await fulfillCheckoutSession(session);
          }
          break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          await syncSubscriptionStatus(event.data.object);
          break;
        }
        default:
          break;
      }
    } catch (err) {
      logger.error("stripeWebhook handler error", err);
      res.status(500).json({ error: "handler_failed" });
      return;
    }

    res.status(200).json({ received: true });
  },
);

/**
 * POST JSON { title? }
 * Authorization: Bearer <Firebase ID token>
 */
exports.createMuxDirectUpload = onRequest(
  {
    secrets: [muxTokenId, muxTokenSecret],
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
      const decoded = await verifyBearerToken(req);
      if (!decoded || !decoded.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }

      const title = (req.body && req.body.title) || "Minorities upload";
      const upload = await muxApi("/video/v1/uploads", {
        method: "POST",
        body: JSON.stringify({
          cors_origin: pickCorsOrigin(req),
          new_asset_settings: {
            playback_policy: ["public"],
            passthrough: JSON.stringify({
              uid: decoded.uid,
              title: String(title).slice(0, 120),
            }),
          },
        }),
      });

      res.status(200).json({
        uploadId: upload.id,
        uploadUrl: upload.url,
      });
    } catch (err) {
      logger.error("createMuxDirectUpload", err);
      res.status(500).json({ error: err.message || "mux_upload_create_failed" });
    }
  },
);

/**
 * POST JSON { uploadId }
 * Authorization: Bearer <Firebase ID token>
 */
exports.getMuxUploadStatus = onRequest(
  {
    secrets: [muxTokenId, muxTokenSecret],
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
      const decoded = await verifyBearerToken(req);
      if (!decoded || !decoded.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }

      const uploadId = req.body && req.body.uploadId;
      if (!uploadId || typeof uploadId !== "string") {
        res.status(400).json({ error: "missing_upload_id" });
        return;
      }

      const upload = await muxApi(`/video/v1/uploads/${uploadId}`);
      let asset = null;
      if (upload.asset_id) {
        asset = await muxApi(`/video/v1/assets/${upload.asset_id}`);
      }

      const playbackId =
        asset && Array.isArray(asset.playback_ids) && asset.playback_ids[0]
          ? asset.playback_ids[0].id
          : null;

      res.status(200).json({
        uploadStatus: upload.status,
        assetId: upload.asset_id || null,
        assetStatus: asset ? asset.status : null,
        playbackId,
        ready: Boolean(playbackId && asset && asset.status === "ready"),
      });
    } catch (err) {
      logger.error("getMuxUploadStatus", err);
      res.status(500).json({ error: err.message || "mux_status_failed" });
    }
  },
);

exports.onPostCreatedPush = onDocumentCreated(
  {
    document: "posts/{postId}",
    region: "us-central1",
  },
  async (event) => {
    const post = event.data && event.data.data();
    if (!post) return;

    const postId = event.params.postId;
    const title = post.headline || post.body || "New community post";
    const author = post.authorName || post.authorUsername || "Someone";

    try {
      await notifyAllUsers(
        {
          title: "New community post",
          body: `${author}: ${String(title).slice(0, 120)}`,
        },
        {
          url: `minorities.html#post/${postId}`,
          tag: `min-post-${postId}`,
          type: "post",
        },
        post.authorUid || null,
      );
    } catch (err) {
      logger.error("onPostCreatedPush", err);
    }
  },
);

exports.onContentCardCreatedPush = onDocumentCreated(
  {
    document: "contentCards/{cardId}",
    region: "us-central1",
  },
  async (event) => {
    const card = event.data && event.data.data();
    if (!card) return;

    const cardId = event.params.cardId;

    try {
      await notifyAllUsers(
        {
          title: "New content",
          body: card.title || "Fresh content is live on The Minorities.",
        },
        {
          url: `minorities.html#post/${cardId}`,
          tag: `min-card-${cardId}`,
          type: "card",
        },
      );
    } catch (err) {
      logger.error("onContentCardCreatedPush", err);
    }
  },
);

exports.onChatMessageCreatedPush = onDocumentCreated(
  {
    document: "chatrooms/{roomId}/messages/{messageId}",
    region: "us-central1",
  },
  async (event) => {
    const message = event.data && event.data.data();
    if (!message) return;

    const roomId = event.params.roomId;
    const senderUid = message.authorUid || null;
    let roomName = "Chat";
    let vipOnly = false;

    try {
      const roomSnap = await db.collection("chatrooms").doc(roomId).get();
      if (roomSnap.exists) {
        const room = roomSnap.data() || {};
        roomName = room.name || roomName;
        vipOnly = room.vip === true;
      }

      await notifyAllUsers(
        {
          title: roomName,
          body: `${message.authorName || "Member"}: ${String(message.text || "").slice(0, 120)}`,
        },
        {
          url: `minorities.html#thread/${roomId}`,
          tag: `min-chat-${roomId}`,
          type: "chat",
          roomId,
        },
        senderUid,
        { vipOnly },
      );
    } catch (err) {
      logger.error("onChatMessageCreatedPush", err);
    }
  },
);
