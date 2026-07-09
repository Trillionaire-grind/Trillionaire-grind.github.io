import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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

const POSTS_COLLECTION = "posts";
const CARDS_COLLECTION = "contentCards";

let db = null;
let postsCache = [];
let cardsCache = [];
const commentsCache = new Map();
const likedPostIds = new Set();
const staticLikeDeltas = new Map();
const staticLikedPostIds = new Set();
const listeners = new Set();

let postsUnsub = null;
let cardsUnsub = null;
let commentsUnsub = null;
let activeCommentsPostId = null;
let listenersStarted = false;

function getDisplayLikes(post) {
  const base = post.likes || 0;
  if (post._firestore) return base;
  return base + (staticLikeDeltas.get(post.id) || 0);
}

export function isPostLiked(postId) {
  if (isFirestorePostId(postId)) return likedPostIds.has(postId);
  return staticLikedPostIds.has(postId);
}

export function getPostLikeCount(postId) {
  const post = getPosts().find((entry) => entry.id === postId);
  if (!post) return 0;
  return getDisplayLikes(post);
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

  if (!isFirestorePostId(postId)) {
    if (staticLikedPostIds.has(postId)) {
      staticLikedPostIds.delete(postId);
      staticLikeDeltas.set(postId, (staticLikeDeltas.get(postId) || 0) - 1);
    } else {
      staticLikedPostIds.add(postId);
      staticLikeDeltas.set(postId, (staticLikeDeltas.get(postId) || 0) + 1);
    }
    notify();
    return getPostLikeCount(postId);
  }

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
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

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
    threadComments: [],
    _firestore: true,
  };
}

function normalizeCard(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title || "",
    author: data.author || data.authorName || "The Minorities",
    date: formatDate(data.createdAt) || data.date || "",
    comments: data.commentCount || 0,
    image: data.image || null,
    locked: Boolean(data.locked),
    body: data.body || "",
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

function staticPosts() {
  return (window.MIN_DATA && window.MIN_DATA.posts) || [];
}

function staticCards() {
  return (window.MIN_DATA && window.MIN_DATA.contentCards) || [];
}

function staticPostDetail() {
  return (window.MIN_DATA && window.MIN_DATA.postDetail) || {};
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
    query(collection(db, CARDS_COLLECTION), orderBy("createdAt", "desc"), limit(20)),
    (snap) => {
      cardsCache = snap.docs.map(normalizeCard);
      notify();
    },
    (err) => {
      console.warn("MIN_CONTENT cards listener failed", err);
    },
  );
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

export function startContentListeners() {
  if (!db || listenersStarted) return;
  startPostsListener();
  startCardsListener();
  listenersStarted = true;
}

export function stopContentListeners() {
  stopPostsListener();
  stopCardsListener();
  stopWatchingComments();
  listenersStarted = false;
}

export async function refreshFeed() {
  notify();
}

export function getPosts() {
  const seen = new Set(postsCache.map((p) => p.id));
  const merged = postsCache.slice();
  staticPosts().forEach((post) => {
    if (!seen.has(post.id)) merged.push(post);
  });
  return merged.sort((a, b) => {
    if (a._firestore && !b._firestore) return -1;
    if (!a._firestore && b._firestore) return 1;
    return 0;
  });
}

export function getContentCards() {
  if (cardsCache.length) return cardsCache;
  return staticCards();
}

export function isCommunityPostId(id) {
  return getPosts().some((p) => p.id === id);
}

export function isFirestorePostId(id) {
  return postsCache.some((p) => p.id === id);
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
      comments: cachedComments || community.threadComments || [],
      _firestore: Boolean(community._firestore),
    };
  }

  const card = getContentCards().find((entry) => entry.id === id);
  if (card) {
    const cachedComments = commentsCache.get(id);
    const detail = staticPostDetail()[id] || {};
    return {
      kind: "content",
      id: card.id,
      title: card.title || detail.title || "Post",
      author: card.author || detail.author || "The Minorities",
      date: card.date || "",
      body: card.body || detail.body || "",
      image: card.image != null ? card.image : detail.image,
      video: card.video || detail.video || null,
      comments: cachedComments || detail.comments || [],
      _firestore: Boolean(card._firestore),
    };
  }

  const content = staticPostDetail()[id];
  if (content) {
    const cachedComments = commentsCache.get(id);
    return {
      kind: "content",
      id: id,
      title: content.title,
      author: content.author || "The Minorities",
      body: content.body || "",
      image: content.image,
      video: content.video,
      comments: cachedComments || content.comments || [],
      _firestore: false,
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
    loadComments(postId);
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
  if (commentsCache.has(postId)) return commentsCache.get(postId);

  const staticPost = staticPosts().find((p) => p.id === postId);
  if (staticPost && staticPost.threadComments) {
    commentsCache.set(postId, staticPost.threadComments);
    return staticPost.threadComments;
  }

  const staticContent = staticPostDetail()[postId];
  if (staticContent && staticContent.comments) {
    commentsCache.set(postId, staticContent.comments);
    return staticContent.comments;
  }

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

  let imageUrl = null;
  if (imageFile) {
    imageUrl = await uploadPostImage(imageFile, user.uid);
  }

  const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
    authorUid: user.uid,
    authorName,
    authorUsername,
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
    throw new Error("Only your uploaded posts can be deleted.");
  }

  const post = postsCache.find((entry) => entry.id === postId);
  if (!post || post.authorUid !== user.uid) {
    throw new Error("You can only delete your own posts.");
  }

  if (post.image) {
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

export async function publishComment(postId, text) {
  if (!db) throw new Error("Comments are not connected yet.");
  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  const profile = window.MIN_AUTH && window.MIN_AUTH.getCurrentProfile();
  if (!user) throw new Error("Sign in to comment.");

  const trimmed = String(text || "").trim();
  if (!trimmed) throw new Error("Write a comment first.");

  const authorName =
    (profile && (profile.displayName || profile.username)) || user.email || "Member";

  const postRef = resolvePost(postId);
  if (postRef && postRef._firestore) {
    await addDoc(collection(db, POSTS_COLLECTION, postId, "comments"), {
      authorUid: user.uid,
      authorName,
      text: trimmed,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, POSTS_COLLECTION, postId), {
      commentCount: increment(1),
    });
    return;
  }

  const local = commentsCache.get(postId) || [];
  const next = local.concat({ author: authorName, text: trimmed });
  commentsCache.set(postId, next);
  notify();
}
