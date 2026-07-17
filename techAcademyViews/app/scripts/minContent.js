import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {
  getDownloadURL,
  ref,
  deleteObject,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
import { initMinFirebase } from "./minFirebase.js";
import {
  SEED_APP_CONFIG,
  SEED_CONTENT_CARDS,
  SEED_POSTS,
  SEED_PRODUCTS,
} from "./minSeedFirestore.js";

/** Guide lessons shown before any Firestore content exists. */
const FALLBACK_CARDS = SEED_CONTENT_CARDS.map((card) => ({
  id: card.id,
  title: card.title,
  author: card.author,
  date: "",
  comments: 0,
  image: card.image,
  video: null,
  body: card.body || "",
  externalUrl: card.externalUrl || null,
  locked: Boolean(card.locked),
  access: card.access,
  _firestore: false,
}));

const POSTS_COLLECTION = "posts";
const CARDS_COLLECTION = "contentCards";
const PRODUCTS_COLLECTION = "products";
const APP_CONFIG_COLLECTION = "appConfig";

const DEFAULT_LEARN = {
  nextSession: "Live class schedule posted soon",
  previewNote: "VIP Experience joins live classes and the I.T. help desk.",
  zoomUrl: "",
};

const DEFAULT_PROMO = {
  title: "VIP Experience",
  body: "Tech Academy Mastermind — live classes, workshops & help desk",
  cta: "See access levels ›",
  image: "techAcademyViews/assets/access/vip.png",
  linkTab: "subscribe",
};

let db = null;
let postsCache = [];
let cardsCache = [];
let productsCache = [];
let appConfigCache = null;
const commentsCache = new Map();
const likedPostIds = new Set();
const listeners = new Set();

let postsUnsub = null;
let cardsUnsub = null;
let productsUnsub = null;
let appConfigUnsub = null;
let commentsUnsub = null;
let activeCommentsPostId = null;
let listenersStarted = false;
let seedInFlight = null;

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error("MIN_CONTENT listener error", err);
    }
  });
}

function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return "";
  return timestamp.toDate().toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
}

function normalizePost(docSnap) {
  const data = docSnap.data();
  const authorUsername = data.authorUsername || "";
  const authorName = data.authorName || authorUsername || "Member";
  return {
    id: docSnap.id,
    author: authorUsername || authorName,
    authorUsername,
    authorName,
    authorUid: data.authorUid || "",
    date: formatDate(data.createdAt),
    headline: data.headline || "",
    body: data.body || "",
    image: data.image || null,
    video: data.video || null,
    muxPlaybackId: data.muxPlaybackId || "",
    muxAssetId: data.muxAssetId || "",
    muxUploadId: data.muxUploadId || "",
    videoProvider: data.videoProvider || "",
    videoStatus: data.videoStatus || "",
    type: data.type || "text",
    likes: data.likes || 0,
    comments: data.commentCount || 0,
    authorType: data.authorType || "",
    authorTeamRole: data.authorTeamRole || "",
    _firestore: true,
  };
}

function normalizeCard(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title || "",
    author: data.author || data.authorName || "Tech Academy",
    date: formatDate(data.createdAt) || data.date || "",
    comments: data.commentCount || 0,
    image: data.image || null,
    video: data.video || null,
    body: data.body || "",
    externalUrl: data.externalUrl || null,
    locked: Boolean(data.locked),
    access: data.access || (data.locked ? "guide" : "free"),
    _firestore: true,
  };
}

function normalizeProduct(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || "",
    price: data.price || "",
    image: data.image || "",
    url: data.url || "",
    sortOrder: data.sortOrder || 0,
    _firestore: true,
  };
}

function normalizeComment(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    author: data.authorName || "Member",
    text: data.text || "",
    authorUid: data.authorUid || "",
  };
}

function stopPostsListener() {
  if (postsUnsub) {
    postsUnsub();
    postsUnsub = null;
  }
}

function stopCardsListener() {
  if (cardsUnsub) {
    cardsUnsub();
    cardsUnsub = null;
  }
}

function stopProductsListener() {
  if (productsUnsub) {
    productsUnsub();
    productsUnsub = null;
  }
}

function stopAppConfigListener() {
  if (appConfigUnsub) {
    appConfigUnsub();
    appConfigUnsub = null;
  }
}

function startPostsListener() {
  if (!db || postsUnsub) return;
  postsUnsub = onSnapshot(
    query(collection(db, POSTS_COLLECTION), orderBy("createdAt", "desc"), limit(50)),
    (snap) => {
      postsCache = snap.docs.map(normalizePost);
      notify();
    },
    (err) => {
      console.warn("MIN_CONTENT posts listener failed", err);
    },
  );
}

function startCardsListener() {
  if (!db || cardsUnsub) return;
  cardsUnsub = onSnapshot(
    query(collection(db, CARDS_COLLECTION), orderBy("sortOrder", "desc"), limit(30)),
    (snap) => {
      cardsCache = snap.docs.map(normalizeCard);
      notify();
    },
    (err) => {
      console.warn("MIN_CONTENT cards listener failed", err);
    },
  );
}

function startProductsListener() {
  if (!db || productsUnsub) return;
  productsUnsub = onSnapshot(
    query(collection(db, PRODUCTS_COLLECTION), orderBy("sortOrder", "desc"), limit(40)),
    (snap) => {
      productsCache = snap.docs.map(normalizeProduct);
      notify();
    },
    (err) => {
      console.warn("MIN_CONTENT products listener failed", err);
    },
  );
}

function startAppConfigListener() {
  if (!db || appConfigUnsub) return;
  appConfigUnsub = onSnapshot(doc(db, APP_CONFIG_COLLECTION, "main"), (snap) => {
    appConfigCache = snap.exists() ? snap.data() : null;
    notify();
  });
}

export function onMinContentChange(fn) {
  listeners.add(fn);
  return function unsubscribe() {
    listeners.delete(fn);
  };
}

export function isContentReady() {
  return listenersStarted;
}

export async function initMinContent() {
  const firebase = initMinFirebase();
  if (!firebase) return false;
  db = firebase.db;
  startContentListeners();
  return true;
}

async function seedDefaultFirestoreContent() {
  if (!db) return false;
  if (!(window.MIN_AUTH && window.MIN_AUTH.isAdmin && window.MIN_AUTH.isAdmin())) return false;

  const user = window.MIN_AUTH.getCurrentUser();
  if (!user) return false;

  const metaRef = doc(db, APP_CONFIG_COLLECTION, "meta");
  const metaSnap = await getDoc(metaRef);
  if (metaSnap.exists() && metaSnap.data().seeded) return false;

  const cardsSnap = await getDocs(query(collection(db, CARDS_COLLECTION), limit(1)));
  if (!cardsSnap.empty) {
    await setDoc(metaRef, { seeded: true, updatedAt: serverTimestamp() }, { merge: true });
    return false;
  }

  const now = serverTimestamp();
  const teamRole =
    window.MIN_AUTH.getTeamRole && window.MIN_AUTH.getTeamRole
      ? window.MIN_AUTH.getTeamRole()
      : "admin";

  await Promise.all(
    SEED_CONTENT_CARDS.map((card) =>
      setDoc(doc(db, CARDS_COLLECTION, card.id), {
        title: card.title,
        author: card.author,
        image: card.image,
        externalUrl: card.externalUrl || null,
        video: card.video || null,
        body: card.body || "",
        access: card.access,
        locked: Boolean(card.locked),
        commentCount: 0,
        sortOrder: card.sortOrder || 0,
        createdAt: now,
        updatedAt: now,
      }),
    ),
  );

  await Promise.all(
    SEED_POSTS.map((post) =>
      setDoc(doc(db, POSTS_COLLECTION, post.id), {
        authorUid: user.uid,
        authorName: post.authorName,
        authorUsername: post.authorUsername,
        authorType: post.authorType || "team",
        authorTeamRole: teamRole,
        headline: post.headline || "",
        body: post.body || "",
        image: post.image || null,
        video: post.video || null,
        muxPlaybackId: null,
        muxAssetId: null,
        muxUploadId: null,
        videoProvider: post.videoProvider || (post.video ? "youtube" : null),
        videoStatus: null,
        type: post.type || "text",
        likes: 0,
        commentCount: 0,
        sortOrder: post.sortOrder || 0,
        createdAt: now,
        updatedAt: now,
      }),
    ),
  );

  await Promise.all(
    SEED_PRODUCTS.map((product) =>
      setDoc(doc(db, PRODUCTS_COLLECTION, product.id), {
        name: product.name,
        price: product.price,
        image: product.image,
        url: product.url,
        sortOrder: product.sortOrder || 0,
        createdAt: now,
        updatedAt: now,
      }),
    ),
  );

  await setDoc(
    doc(db, APP_CONFIG_COLLECTION, "main"),
    {
      learn: SEED_APP_CONFIG.learn,
      promo: SEED_APP_CONFIG.promo,
      updatedAt: now,
    },
    { merge: true },
  );

  await setDoc(
    metaRef,
    {
      seeded: true,
      seededAt: now,
      seededBy: user.uid,
    },
    { merge: true },
  );

  notify();
  return true;
}

export function ensureDefaultFirestoreContent() {
  if (seedInFlight) return seedInFlight;
  seedInFlight = seedDefaultFirestoreContent()
    .catch((err) => {
      console.warn("MIN_CONTENT seed failed", err);
      return false;
    })
    .finally(() => {
      seedInFlight = null;
    });
  return seedInFlight;
}

export function startContentListeners() {
  if (!db || listenersStarted) return;
  startPostsListener();
  startCardsListener();
  startProductsListener();
  startAppConfigListener();
  listenersStarted = true;
  ensureDefaultFirestoreContent();
}

export function stopContentListeners() {
  stopPostsListener();
  stopCardsListener();
  stopProductsListener();
  stopAppConfigListener();
  stopWatchingComments();
  listenersStarted = false;
}

export async function refreshFeed() {
  notify();
}

export function getPosts() {
  return postsCache.slice();
}

export function getContentCards() {
  if (cardsCache.length) return cardsCache.slice();
  return FALLBACK_CARDS.slice();
}

export function getProducts() {
  return productsCache.slice();
}

function configString(value, fallback) {
  const trimmed = String(value || "").trim();
  return trimmed || fallback;
}

export function getLearnConfig() {
  const learn = appConfigCache && appConfigCache.learn;
  return {
    nextSession: configString(learn && learn.nextSession, DEFAULT_LEARN.nextSession),
    previewNote: configString(learn && learn.previewNote, DEFAULT_LEARN.previewNote),
    zoomUrl: configString(learn && learn.zoomUrl, DEFAULT_LEARN.zoomUrl),
  };
}

export function getHomePromo() {
  const promo = appConfigCache && appConfigCache.promo;
  return {
    title: configString(promo && promo.title, DEFAULT_PROMO.title),
    body: configString(promo && promo.body, DEFAULT_PROMO.body),
    cta: configString(promo && promo.cta, DEFAULT_PROMO.cta),
    image: configString(promo && promo.image, DEFAULT_PROMO.image),
    linkTab: configString(promo && promo.linkTab, DEFAULT_PROMO.linkTab),
  };
}

export function isCommunityPostId(id) {
  return getPosts().some((p) => p.id === id);
}

export function isFirestorePostId(id) {
  return postsCache.some((p) => p.id === id);
}

export function isFirestoreCardId(id) {
  return cardsCache.some((c) => c.id === id);
}

export function isPostLiked(postId) {
  return likedPostIds.has(postId);
}

export function getPostLikeCount(postId) {
  const post = getPosts().find((entry) => entry.id === postId);
  if (!post) return 0;
  return post.likes || 0;
}

export async function refreshUserLikes(postIds) {
  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  if (!user || !db || !Array.isArray(postIds)) return;

  await Promise.all(
    postIds.filter(isFirestorePostId).map(async (postId) => {
      const snap = await getDoc(doc(db, POSTS_COLLECTION, postId, "likes", user.uid));
      if (snap.exists()) likedPostIds.add(postId);
      else likedPostIds.delete(postId);
    }),
  );
}

export async function togglePostLike(postId) {
  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  if (!user) throw new Error("Sign in to like posts.");
  if (!isFirestorePostId(postId)) throw new Error("This post is not available to like yet.");

  const likeRef = doc(db, POSTS_COLLECTION, postId, "likes", user.uid);
  const postRef = doc(db, POSTS_COLLECTION, postId);
  const likeSnap = await getDoc(likeRef);

  if (likeSnap.exists()) {
    await deleteDoc(likeRef);
    await updateDoc(postRef, { likes: increment(-1) });
    likedPostIds.delete(postId);
  } else {
    await setDoc(likeRef, { createdAt: serverTimestamp() });
    await updateDoc(postRef, { likes: increment(1) });
    likedPostIds.add(postId);
  }

  notify();
  return getPostLikeCount(postId);
}

async function uploadPostImage(file, userId) {
  const firebase = initMinFirebase();
  if (!firebase?.storage) throw new Error("Image upload is not configured yet.");
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image must be 8 MB or smaller.");
  }

  const extension = String(file.name || "")
    .split(".")
    .pop()
    .toLowerCase();
  const safeExtension = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)
    ? extension
    : "jpg";
  const storageRef = ref(firebase.storage, `posts/${userId}/${Date.now()}.${safeExtension}`);
  const contentType = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
  await uploadBytes(storageRef, file, { contentType });
  return getDownloadURL(storageRef);
}

export function resolvePost(id) {
  const community = getPosts().find((p) => p.id === id);
  if (community) {
    const cachedComments = commentsCache.get(id);
    return {
      kind: "community",
      id: community.id,
      title: community.headline || community.body || "Post",
      author: community.authorUsername || community.author,
      authorUsername: community.authorUsername || "",
      authorName: community.authorName || community.author || "Member",
      authorUid: community.authorUid || "",
      date: community.date,
      body: community.body || "",
      image: community.image,
      video: community.video,
      muxPlaybackId: community.muxPlaybackId || "",
      muxAssetId: community.muxAssetId || "",
      muxUploadId: community.muxUploadId || "",
      videoProvider: community.videoProvider || "",
      videoStatus: community.videoStatus || "",
      comments: cachedComments || [],
      authorType: community.authorType || "",
      authorTeamRole: community.authorTeamRole || "",
      _firestore: true,
    };
  }

  const card = getContentCards().find((entry) => entry.id === id);
  if (card) {
    const cachedComments = commentsCache.get(id);
    return {
      kind: "content",
      id: card.id,
      title: card.title || "Post",
      externalUrl: card.externalUrl || null,
      author: card.author || "Tech Academy",
      date: card.date || "",
      body: card.body || "",
      image: card.image,
      video: card.video || null,
      comments: cachedComments || [],
      _firestore: true,
    };
  }

  return null;
}

export function watchComments(postId) {
  if (!postId) {
    stopWatchingComments();
    return;
  }

  if (!isFirestorePostId(postId)) {
    stopWatchingComments();
    return;
  }

  if (activeCommentsPostId === postId && commentsUnsub) return;

  stopWatchingComments();
  activeCommentsPostId = postId;

  if (!db) return;

  commentsUnsub = onSnapshot(
    query(
      collection(db, POSTS_COLLECTION, postId, "comments"),
      orderBy("createdAt", "asc"),
      limit(100),
    ),
    (snap) => {
      commentsCache.set(postId, snap.docs.map(normalizeComment));
      notify();
    },
    (err) => {
      console.warn("MIN_CONTENT comments listener failed", err);
    },
  );
}

export function stopWatchingComments() {
  if (commentsUnsub) {
    commentsUnsub();
    commentsUnsub = null;
  }
  activeCommentsPostId = null;
}

export async function loadComments(postId) {
  if (!postId) return [];
  return commentsCache.get(postId) || [];
}

export async function createPost(fields) {
  if (!db) throw new Error("Posts are not connected yet.");
  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  const profile = window.MIN_AUTH && window.MIN_AUTH.getCurrentProfile();
  if (!user) throw new Error("Sign in to create a post.");

  const headline = String(fields.headline || "").trim();
  const body = String(fields.body || "").trim();
  const video = String(fields.video || "").trim();
  const imageFile = fields.imageFile || null;
  const muxPlaybackId = String(fields.muxPlaybackId || "").trim();
  const muxAssetId = String(fields.muxAssetId || "").trim();
  const muxUploadId = String(fields.muxUploadId || "").trim();
  const videoProvider = String(fields.videoProvider || "").trim();
  const videoStatus = String(fields.videoStatus || "").trim();
  const hasMuxVideo = Boolean(muxPlaybackId);
  const hasLegacyVideo = Boolean(video) && !hasMuxVideo;

  if (imageFile && (hasMuxVideo || hasLegacyVideo)) {
    throw new Error("Add either an image or a video, not both.");
  }
  if (!body && !headline && !imageFile && !hasMuxVideo && !hasLegacyVideo) {
    throw new Error("Write something or add an image or video.");
  }

  const authorUsername = String((profile && profile.username) || "").trim();
  if (authorUsername.length < 2) {
    throw new Error("Add a username in Personal info before posting.");
  }

  const authorName =
    String((profile && profile.displayName) || "").trim() || authorUsername;
  const teamRole =
    window.MIN_AUTH && window.MIN_AUTH.getTeamRole ? window.MIN_AUTH.getTeamRole() : "member";
  const authorType =
    window.MIN_AUTH && window.MIN_AUTH.isCreator && window.MIN_AUTH.isCreator()
      ? "team"
      : window.MIN_AUTH && window.MIN_AUTH.isModerator && window.MIN_AUTH.isModerator()
        ? "team"
        : window.MIN_AUTH && window.MIN_AUTH.isAdmin && window.MIN_AUTH.isAdmin()
          ? "team"
          : "community";

  let imageUrl = null;
  if (imageFile) {
    imageUrl = await uploadPostImage(imageFile, user.uid);
  }

  const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
    authorUid: user.uid,
    authorName,
    authorUsername,
    authorType,
    authorTeamRole: teamRole,
    headline,
    body,
    image: imageUrl,
    video: hasLegacyVideo ? video : null,
    muxPlaybackId: hasMuxVideo ? muxPlaybackId : null,
    muxAssetId: hasMuxVideo ? muxAssetId || null : null,
    muxUploadId: hasMuxVideo ? muxUploadId || null : null,
    videoProvider: hasMuxVideo ? videoProvider || "mux" : hasLegacyVideo ? "youtube" : null,
    videoStatus: hasMuxVideo ? videoStatus || "ready" : null,
    type: hasMuxVideo || hasLegacyVideo ? "video" : "text",
    likes: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  notify();
  return docRef.id;
}

async function deleteStorageFileIfOwned(fileUrl, userId) {
  if (!fileUrl || !userId) return;
  const firebase = initMinFirebase();
  if (!firebase?.storage) return;
  if (!String(fileUrl).includes("/posts/" + userId + "/")) return;

  try {
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)$/);
    if (!pathMatch) return;
    const storageRef = ref(firebase.storage, decodeURIComponent(pathMatch[1]));
    await deleteObject(storageRef);
  } catch (err) {
    console.warn("MIN_CONTENT could not delete storage file", err);
  }
}

export async function deletePost(postId) {
  if (!db) throw new Error("Posts are not connected yet.");
  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  if (!user) throw new Error("Sign in to delete a post.");
  if (!isFirestorePostId(postId)) {
    throw new Error("Only uploaded posts can be deleted.");
  }

  const post = postsCache.find((entry) => entry.id === postId);
  const isAdmin = window.MIN_AUTH && window.MIN_AUTH.isAdmin && window.MIN_AUTH.isAdmin();
  if (!post) {
    throw new Error("Post not found.");
  }
  if (!isAdmin && post.authorUid !== user.uid) {
    throw new Error("You can only delete your own posts.");
  }

  if (post.image && post.authorUid === user.uid) {
    await deleteStorageFileIfOwned(post.image, user.uid);
  }

  await deleteDoc(doc(db, POSTS_COLLECTION, postId));
  commentsCache.delete(postId);
  likedPostIds.delete(postId);
  if (activeCommentsPostId === postId) {
    stopWatchingComments();
  }
  notify();
  return true;
}

export async function createContentCard(fields) {
  if (!db) throw new Error("Content is not connected yet.");
  const isAdmin = window.MIN_AUTH && window.MIN_AUTH.isAdmin && window.MIN_AUTH.isAdmin();
  if (!isAdmin) throw new Error("Only admins can add content cards.");

  const title = String(fields.title || "").trim();
  const image = String(fields.image || "").trim();
  const access = String(fields.access || "free").trim();
  const author = String(fields.author || "Tech Academy").trim();
  const video = String(fields.video || "").trim();
  const body = String(fields.body || "").trim();

  if (title.length < 2) throw new Error("Enter a title.");
  if (!image) throw new Error("Enter an image URL.");
  if (!["free", "guide", "vip"].includes(access)) {
    throw new Error("Invalid access level.");
  }

  const docRef = await addDoc(collection(db, CARDS_COLLECTION), {
    title,
    image,
    author,
    video: video || null,
    body,
    access,
    locked: access !== "free",
    commentCount: 0,
    sortOrder: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  notify();
  return docRef.id;
}

export async function deleteContentCard(cardId) {
  if (!db) throw new Error("Content is not connected yet.");
  const isAdmin = window.MIN_AUTH && window.MIN_AUTH.isAdmin && window.MIN_AUTH.isAdmin();
  if (!isAdmin) throw new Error("Only admins can remove content cards.");
  if (!cardId || !isFirestoreCardId(cardId)) {
    throw new Error("Only library cards stored in Firestore can be removed here.");
  }

  await deleteDoc(doc(db, CARDS_COLLECTION, cardId));
  notify();
  return true;
}

export async function publishComment(postId, text) {
  if (!db) throw new Error("Comments are not connected yet.");
  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  const profile = window.MIN_AUTH && window.MIN_AUTH.getCurrentProfile();
  if (!user) throw new Error("Sign in to comment.");
  if (!isFirestorePostId(postId)) {
    throw new Error("Comments are only available on live posts.");
  }

  const trimmed = String(text || "").trim();
  if (!trimmed) throw new Error("Write a comment first.");

  const authorName =
    (profile && (profile.displayName || profile.username)) || user.email || "Member";

  await addDoc(collection(db, POSTS_COLLECTION, postId, "comments"), {
    authorUid: user.uid,
    authorName,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, POSTS_COLLECTION, postId), {
    commentCount: increment(1),
  });
}
