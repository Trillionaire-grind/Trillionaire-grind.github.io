import {

  createPost,

  deletePost,

  getContentCards,

  getPostLikeCount,

  getPosts,

  initMinContent,

  isCommunityPostId,

  isFirestorePostId,

  isPostLiked,

  loadComments,

  onMinContentChange,

  publishComment,

  refreshFeed,

  refreshUserLikes,

  resolvePost,

  startContentListeners,

  stopWatchingComments,

  togglePostLike,

  watchComments,

} from "./minContent.js";

import {

  getChatRoom,

  getChats,

  getMessages,

  initMinChat,

  onMinChatChange,

  sendMessage,

  startChatListeners,

  stopChatListeners,

  stopWatchingRoom,

  watchRoom,

} from "./minChat.js";

import {

  areNotificationsEnabled,

  checkForUpdates,

  getNotificationPermission,

  initMinNotifications,

  isNotificationSupported,

  requestNotificationPermission,

  resetNotificationSnapshot,

  setNotificationRoute,

  setNotificationsEnabled,

} from "./minNotifications.js";

import {

  getCurrentProfile,

  getCurrentUser,

  getSubscriptionId,

  getTier,

  handleCheckoutReturn,

  initMinAuth,

  isAuthReady,

  isRegistering,

  isSignedIn,

  loginAccount,

  logoutAccount,

  onMinAuthChange,

  refreshProfile,

  registerAccount,

  resetPassword,

  startSubscriptionCheckout,

  tierFromSubscription,

  updateProfile,

  waitForAuthReady,

} from "./minAuth.js";

import {
  isMuxUploadAvailable,
  uploadVideoForPost,
} from "./minMux.js";
import {
  clearPushToken,
  initMinPush,
  isPushConfigured,
  isPushSupported,
  refreshPushTokenTier,
  registerPushToken,
} from "./minPush.js";



window.MIN_AUTH = {

  getCurrentProfile,

  getCurrentUser,

  getSubscriptionId,

  getTier,

  handleCheckoutReturn,

  initMinAuth,

  isAuthReady,

  isRegistering,

  isSignedIn,

  loginAccount,

  logoutAccount,

  onMinAuthChange,

  refreshProfile,

  registerAccount,

  resetPassword,

  startSubscriptionCheckout,

  tierFromSubscription,

  updateProfile,

  waitForAuthReady,

};



window.MIN_CONTENT = {

  createPost,

  deletePost,

  getContentCards,

  getPostLikeCount,

  getPosts,

  initMinContent,

  isCommunityPostId,

  isFirestorePostId,

  isPostLiked,

  loadComments,

  onMinContentChange,

  publishComment,

  refreshFeed,

  refreshUserLikes,

  resolvePost,

  startContentListeners,

  stopWatchingComments,

  togglePostLike,

  watchComments,

};



window.MIN_MUX = {

  isMuxUploadAvailable,

  uploadVideoForPost,

};



window.MIN_CHAT = {

  getChatRoom,

  getChats,

  getMessages,

  initMinChat,

  onMinChatChange,

  sendMessage,

  startChatListeners,

  stopChatListeners,

  stopWatchingRoom,

  watchRoom,

};



window.MIN_NOTIFY = {

  areNotificationsEnabled,

  checkForUpdates,

  getNotificationPermission,

  initMinNotifications,

  isNotificationSupported,

  requestNotificationPermission,

  resetNotificationSnapshot,

  setNotificationRoute,

  setNotificationsEnabled,

};



window.MIN_PUSH = {
  clearPushToken,
  initMinPush,
  isPushConfigured,
  isPushSupported,
  refreshPushTokenTier,
  registerPushToken,
};



async function boot() {

  try {

    await initMinAuth();

  } catch (err) {

    console.error("MIN_AUTH init failed", err);

  }



  initMinNotifications();

  try {
    await initMinPush();
  } catch (err) {
    console.warn("MIN_PUSH init failed", err);
  }

  onMinAuthChange(async function (user) {
    if (!user) {
      if (window.MIN_PUSH && window.MIN_PUSH.clearPushToken) {
        await window.MIN_PUSH.clearPushToken().catch(() => null);
      }
      return;
    }

    if (
      window.MIN_NOTIFY &&
      window.MIN_NOTIFY.areNotificationsEnabled &&
      window.MIN_NOTIFY.areNotificationsEnabled() &&
      window.MIN_PUSH &&
      window.MIN_PUSH.isPushConfigured &&
      window.MIN_PUSH.isPushConfigured()
    ) {
      await window.MIN_PUSH.registerPushToken().catch((err) => {
        console.warn("MIN_PUSH token refresh on auth", err);
      });
    }
  });



  try {

    await initMinContent();

  } catch (err) {

    console.error("MIN_CONTENT init failed", err);

  }



  try {

    await initMinChat();

  } catch (err) {

    console.error("MIN_CHAT init failed", err);

  }



  const returnedFromCheckout = await handleCheckoutReturn().catch(() => false);

  if (returnedFromCheckout) {

    await refreshProfile().catch(() => null);

  }



  if (typeof window.__minOnBootstrapReady === "function") {

    window.__minOnBootstrapReady();

  }

}



boot().catch((err) => {

  console.error("Minorities bootstrap failed", err);

  if (typeof window.__minOnBootstrapReady === "function") {

    window.__minOnBootstrapReady();

  }

});


