"use strict";

const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const muxTokenId = defineSecret("MUX_TOKEN_ID");
const muxTokenSecret = defineSecret("MUX_TOKEN_SECRET");

const DEFAULT_PUBLIC_URL = "https://keplersiguineau.com";
const PUSH_ICON = "/minoritiesView/assets/graduation.svg";

async function collectPushTokens(excludeUid, options = {}) {
  const { vipOnly = false } = options;
  const snap = await db.collectionGroup("fcmTokens").get();
  const tokens = [];

  snap.forEach((docSnap) => {
    const uid = docSnap.ref.parent.parent.id;
    if (excludeUid && uid === excludeUid) return;

    const data = docSnap.data() || {};
    if (!data.token || typeof data.token !== "string") return;
    if (vipOnly && data.tier !== "vip") return;

    tokens.push(data.token);
  });

  return [...new Set(tokens)];
}

async function sendPushMulticast(tokens, notification, data = {}) {
  if (!tokens.length) return;

  const messaging = admin.messaging();
  const url = data.url || `${DEFAULT_PUBLIC_URL}/minorities.html`;
  const payloadData = {
    ...data,
    url,
  };

  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const response = await messaging.sendEachForMulticast({
      tokens: batch,
      notification,
      data: payloadData,
      webpush: {
        notification: {
          icon: PUSH_ICON,
        },
        fcmOptions: {
          link: url.startsWith("http") ? url : `${DEFAULT_PUBLIC_URL}/${url.replace(/^\//, "")}`,
        },
      },
    });

    if (response.failureCount > 0) {
      logger.warn("sendPushMulticast partial failure", {
        success: response.successCount,
        failure: response.failureCount,
      });
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
  return DEFAULT_PUBLIC_URL.replace(/\/$/, "");
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
