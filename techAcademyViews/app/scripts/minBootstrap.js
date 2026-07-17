import {

  createPost,

  createContentCard,

  deleteContentCard,

  deletePost,

  ensureDefaultFirestoreContent,

  getContentCards,

  getLearnConfig,

  getHomePromo,

  getPostLikeCount,

  getPosts,

  getProducts,

  initMinContent,

  isCommunityPostId,

  isFirestorePostId,

  isFirestoreCardId,

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

  canAccessRoom,

  ensureDefaultChatrooms,

  getChatRoom,

  getChats,

  getDefaultChatrooms,

  getMessages,

  initMinChat,

  isChatReady,

  isRoomMessagesLoaded,

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

  syncNotificationOptInFromBrowser,

} from "./minNotifications.js";

import {

  getCurrentProfile,

  getCurrentUser,

  getSubscriptionId,

  getSubscriptionRank,

  getTier,

  assignTeamRole,

  getTeamRole,

  getTeamRoleLabel,

  isAdmin,

  isCreator,

  isModerator,

  isTeamAuthoredPost,

  canAccessContentLevel,

  hasBenchAccess,

  hasChatAccess,

  hasCommentAccess,

  hasOwnerAccess,

  hasStarterAccess,

  hasTrainingAccess,

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

  selectSubscriptionPlan,

  startSubscriptionCheckout,

  tierFromSubscription,

  updateProfile,

  prepareProfileAvatar,

  validateProfileAvatarFile,

  PROFILE_AVATAR_MAX_BYTES,

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
  syncPushTokenIfPermitted,
  isStandalonePwa,
  isIosDevice,
} from "./minPush.js";



window.MIN_AUTH = {

  getCurrentProfile,

  getCurrentUser,

  getSubscriptionId,

  getSubscriptionRank,

  getTier,

  assignTeamRole,

  getTeamRole,

  getTeamRoleLabel,

  isAdmin,

  isCreator,

  isModerator,

  isTeamAuthoredPost,

  canAccessContentLevel,

  hasBenchAccess,

  hasChatAccess,

  hasCommentAccess,

  hasOwnerAccess,

  hasStarterAccess,

  hasTrainingAccess,

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

  selectSubscriptionPlan,

  startSubscriptionCheckout,

  tierFromSubscription,

  updateProfile,

  prepareProfileAvatar,

  validateProfileAvatarFile,

  PROFILE_AVATAR_MAX_BYTES,

  waitForAuthReady,

};



window.MIN_CONTENT = {

  createPost,

  createContentCard,

  deleteContentCard,

  deletePost,

  ensureDefaultFirestoreContent,

  getContentCards,

  getLearnConfig,

  getHomePromo,

  getPostLikeCount,

  getPosts,

  getProducts,

  initMinContent,

  isCommunityPostId,

  isFirestorePostId,

  isFirestoreCardId,

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

  canAccessRoom,

  ensureDefaultChatrooms,

  getChatRoom,

  getChats,

  getDefaultChatrooms,

  getMessages,

  initMinChat,

  isChatReady,

  isRoomMessagesLoaded,

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

  syncNotificationOptInFromBrowser,

};



window.MIN_PUSH = {
  clearPushToken,
  initMinPush,
  isPushConfigured,
  isPushSupported,
  refreshPushTokenTier,
  registerPushToken,
  syncPushTokenIfPermitted,
  isStandalonePwa,
  isIosDevice,
};



async function refreshPushIfAllowed() {
  if (!window.MIN_AUTH || !window.MIN_AUTH.isSignedIn || !window.MIN_AUTH.isSignedIn()) {
    return;
  }

  if (
    window.MIN_NOTIFY &&
    window.MIN_NOTIFY.syncNotificationOptInFromBrowser
  ) {
    window.MIN_NOTIFY.syncNotificationOptInFromBrowser();
  }

  if (
    !window.MIN_NOTIFY ||
    !window.MIN_NOTIFY.areNotificationsEnabled ||
    !window.MIN_NOTIFY.areNotificationsEnabled()
  ) {
    return;
  }

  if (window.MIN_PUSH && window.MIN_PUSH.syncPushTokenIfPermitted) {
    await window.MIN_PUSH.syncPushTokenIfPermitted().catch((err) => {
      console.warn("MIN_PUSH refresh on open", err);
    });
  }
}



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

    if (window.MIN_NOTIFY && window.MIN_NOTIFY.syncNotificationOptInFromBrowser) {
      window.MIN_NOTIFY.syncNotificationOptInFromBrowser();
    }

    if (window.MIN_PUSH && window.MIN_PUSH.syncPushTokenIfPermitted) {
      await window.MIN_PUSH.syncPushTokenIfPermitted().catch((err) => {
        console.warn("MIN_PUSH token refresh on auth", err);
      });
    }

    if (
      window.MIN_AUTH &&
      window.MIN_AUTH.isAdmin &&
      window.MIN_AUTH.isAdmin() &&
      window.MIN_CONTENT &&
      window.MIN_CONTENT.ensureDefaultFirestoreContent
    ) {
      await window.MIN_CONTENT.ensureDefaultFirestoreContent().catch((err) => {
        console.warn("MIN_CONTENT seed on auth", err);
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

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      refreshPushIfAllowed().catch(() => null);
    }
  });

  window.addEventListener("pageshow", function () {
    refreshPushIfAllowed().catch(() => null);
  });

  await refreshPushIfAllowed().catch(() => null);

}



boot().catch((err) => {

  console.error("Tech Academy bootstrap failed", err);

  if (typeof window.__minOnBootstrapReady === "function") {

    window.__minOnBootstrapReady();

  }

});


