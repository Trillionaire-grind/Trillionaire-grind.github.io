(function () {
  "use strict";

  var A = "minoritiesView/assets/";
  var C = window.MIN_CATALOG || {};
  var learnInClass = false;
  var lastCommentsFetchId = null;
  var subscribePreviewId = null;
  var postsFilter = "all";

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function youtubeEmbedUrl(url) {
    if (!url) return "";
    var match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/
    );
    if (match) return "https://www.youtube.com/embed/" + match[1] + "?rel=0";
    return url;
  }

  function isMp4Video(url) {
    return /\.mp4(\?|$)/i.test(url || "");
  }

  function postVideoHtml(post) {
    if (post.muxPlaybackId) {
      var muxTitle = esc(post.headline || post.body || post.title || "Video post");
      return (
        '<div class="min-video-embed min-video-embed--mux">' +
        '<mux-player playback-id="' +
        esc(post.muxPlaybackId) +
        '" stream-type="on-demand" metadata-video-title="' +
        muxTitle +
        '"></mux-player></div>'
      );
    }
    if (post.videoStatus === "processing") {
      return '<p class="min-auth-hint min-video-processing">Video is processing. Check back in a minute.</p>';
    }
    if (!post.video) return "";
    var title = esc(post.headline || post.body || "Video post");
    if (isMp4Video(post.video)) {
      return (
        '<div class="min-video-embed"><video class="min-post-video" controls playsinline preload="metadata" src="' +
        esc(post.video) +
        '"></video></div>'
      );
    }
    return (
      '<div class="min-video-embed"><iframe src="' +
      esc(youtubeEmbedUrl(post.video)) +
      '" title="' +
      title +
      '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>'
    );
  }

  function postHasVideo(post) {
    return Boolean(post.muxPlaybackId || post.video || post.videoStatus === "processing");
  }

  function catalogSubscriptions() {
    return C.subscriptions || [];
  }

  function defaultProfile() {
    return (
      C.profile || {
        name: "Member",
        tier: "free",
        avatar: A + "person.svg",
      }
    );
  }

  function productsList() {
    if (window.MIN_CONTENT && window.MIN_CONTENT.getProducts) {
      return window.MIN_CONTENT.getProducts();
    }
    return [];
  }

  function learnConfig() {
    if (window.MIN_CONTENT && window.MIN_CONTENT.getLearnConfig) {
      return window.MIN_CONTENT.getLearnConfig();
    }
    return {
      nextSession: "Schedule posted soon",
      previewNote: "Starter+ joins live group training.",
      zoomUrl: "",
    };
  }

  function homePromo() {
    if (window.MIN_CONTENT && window.MIN_CONTENT.getHomePromo) {
      return window.MIN_CONTENT.getHomePromo();
    }
    return {
      title: "Shop",
      body: "University collection — live now",
      cta: "Shop the collection ›",
      image: A + "shop/uni_hd.webp",
      linkTab: "shop",
    };
  }

  function postsList() {
    if (window.MIN_CONTENT && window.MIN_CONTENT.getPosts) {
      return window.MIN_CONTENT.getPosts();
    }
    return [];
  }

  function contentCardsList() {
    if (window.MIN_CONTENT && window.MIN_CONTENT.getContentCards) {
      return window.MIN_CONTENT.getContentCards();
    }
    return [];
  }

  function chatsList() {
    if (window.MIN_CHAT && window.MIN_CHAT.getChats) {
      return window.MIN_CHAT.getChats();
    }
    return [];
  }

  function threadMessages(id) {
    if (window.MIN_CHAT && window.MIN_CHAT.getMessages) {
      return window.MIN_CHAT.getMessages(id);
    }
    return [];
  }

  var activeThreadId = null;

  function isCommunityPostId(id) {
    if (window.MIN_CONTENT && window.MIN_CONTENT.isCommunityPostId) {
      return window.MIN_CONTENT.isCommunityPostId(id);
    }
    return false;
  }

  function resolvePost(id) {
    if (window.MIN_CONTENT && window.MIN_CONTENT.resolvePost) {
      return window.MIN_CONTENT.resolvePost(id);
    }
    return null;
  }

  function getPostingUsername() {
    var profile = getProfile();
    return String(profile.username || "").trim();
  }

  function loadPostsFilter() {
    try {
      var saved = localStorage.getItem("minPostsFilter");
      if (saved === "all" || saved === "community" || saved === "minorities") {
        postsFilter = saved;
      }
    } catch (err) {
      /* ignore */
    }
  }

  function savePostsFilter(value) {
    postsFilter = value;
    try {
      localStorage.setItem("minPostsFilter", value);
    } catch (err) {
      /* ignore */
    }
  }

  function isTeamAuthoredPost(post) {
    if (window.MIN_AUTH && window.MIN_AUTH.isTeamAuthoredPost) {
      return window.MIN_AUTH.isTeamAuthoredPost(post);
    }
    return false;
  }

  function postsFilterLabel(value) {
    if (value === "minorities") return "Minorities";
    if (value === "community") return "Community";
    return "All posts";
  }

  function filteredPostsList() {
    var posts = postsList();
    if (postsFilter === "minorities") {
      return posts.filter(function (post) {
        return isTeamAuthoredPost(post);
      });
    }
    if (postsFilter === "community") {
      return posts.filter(function (post) {
        return !isTeamAuthoredPost(post);
      });
    }
    return posts;
  }

  function getCommunityAuthorLabel(post) {
    if (isTeamAuthoredPost(post)) {
      var name = String(post.authorName || post.author || "").trim();
      if (name && name.toLowerCase() !== "the minorities") {
        return name + " · The Minorities";
      }
      return "The Minorities";
    }
    return post.authorUsername || post.author || post.authorName || "Member";
  }

  function getPostLikes(post) {
    if (window.MIN_CONTENT && window.MIN_CONTENT.getPostLikeCount) {
      return window.MIN_CONTENT.getPostLikeCount(post.id);
    }
    return post.likes || 0;
  }

  function isPostLikedByUser(postId) {
    return window.MIN_CONTENT && window.MIN_CONTENT.isPostLiked && window.MIN_CONTENT.isPostLiked(postId);
  }

  function renderPostLikeButton(postId, likeCount) {
    var liked = isPostLikedByUser(postId);
    return (
      '<button type="button" class="min-like-btn' +
      (liked ? " is-liked" : "") +
      '" data-like-post="' +
      esc(postId) +
      '" aria-label="' +
      (liked ? "Unlike post" : "Like post") +
      '" aria-pressed="' +
      (liked ? "true" : "false") +
      '"><img src="' +
      A +
      'heart.fill.svg" width="16" height="12" alt=""><span data-like-count="' +
      esc(postId) +
      '">' +
      likeCount +
      "</span></button>"
    );
  }

  function wirePostLikeButtons() {
    document.querySelectorAll("[data-like-post]").forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!requireAuthForAction()) return;
        if (!window.MIN_CONTENT || !window.MIN_CONTENT.togglePostLike) return;
        var postId = btn.getAttribute("data-like-post");
        btn.disabled = true;
        window.MIN_CONTENT
          .togglePostLike(postId)
          .then(function (count) {
            var liked = window.MIN_CONTENT.isPostLiked(postId);
            btn.classList.toggle("is-liked", liked);
            btn.setAttribute("aria-pressed", liked ? "true" : "false");
            btn.setAttribute("aria-label", liked ? "Unlike post" : "Like post");
            document.querySelectorAll('[data-like-count="' + postId + '"]').forEach(function (el) {
              el.textContent = String(count);
            });
          })
          .catch(function (err) {
            alert(err && err.message ? err.message : "Could not update like.");
          })
          .finally(function () {
            btn.disabled = false;
          });
      };
    });
  }

  function applyLikeButtonStates() {
    document.querySelectorAll("[data-like-post]").forEach(function (btn) {
      var postId = btn.getAttribute("data-like-post");
      if (!postId || !window.MIN_CONTENT || !window.MIN_CONTENT.isPostLiked) return;
      var liked = window.MIN_CONTENT.isPostLiked(postId);
      btn.classList.toggle("is-liked", liked);
      btn.setAttribute("aria-pressed", liked ? "true" : "false");
      btn.setAttribute("aria-label", liked ? "Unlike post" : "Like post");
    });
  }

  function refreshVisiblePostLikes(route) {
    if (!window.MIN_AUTH || !window.MIN_AUTH.isSignedIn || !window.MIN_AUTH.isSignedIn()) return;
    if (!window.MIN_CONTENT || !window.MIN_CONTENT.refreshUserLikes) return;
    var ids = [];
    if (route.name === "post" && route.id && isCommunityPostId(route.id)) {
      ids = [route.id];
    } else if (route.name === "posts") {
      ids = postsList().map(function (post) {
        return post.id;
      });
    }
    if (!ids.length) return;
    window.MIN_CONTENT.refreshUserLikes(ids).then(applyLikeButtonStates);
  }

  function getPostHeaderTitle(postRef) {
    if (!postRef) return "Post";
    if (postRef.kind === "content") {
      return postRef.author || "The Minorities";
    }
    if (postRef.kind === "community") {
      return postRef.authorUsername || postRef.author || "Member";
    }
    return postRef.author || postRef.title || "Post";
  }

  function renderCommentsSheet(comments, expanded) {
    var isOpen = Boolean(expanded);
    var canComment = hasCommentAccess();
    var html =
      '<div class="min-comments-sheet' +
      (isOpen ? " is-expanded" : "") +
      '" id="minCommentsSheet">' +
      '<button type="button" class="min-comments-handle" id="minCommentsHandle" aria-label="' +
      (isOpen ? "Collapse comments" : "Expand comments") +
      '"></button>' +
      '<p class="min-comments-preview" id="minCommentsPreview">' +
      (isOpen ? "Tap to close comments" : "Tap to open comments") +
      "</p>" +
      '<div class="min-comments-panel" id="minCommentsPanel">';
    (comments || []).forEach(function (c) {
      html +=
        '<div class="min-comment"><img src="' +
        A +
        'person.svg" alt=""><div><p class="min-comment-meta">' +
        esc(c.author) +
        "</p><p style=\"margin:0\">" +
        esc(c.text) +
        "</p></div></div>";
    });
    html += "</div>";
    if (canComment) {
      html +=
        '<div class="min-comments-compose" id="minCommentsCompose">' +
        '<input type="text" placeholder="Add a comment…" id="minCommentInput" aria-label="Add a comment">' +
        '<button type="button" class="min-comment-send" id="minCommentPublish" aria-label="Publish comment">' +
        '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 20.5v-17l15 8.5z"/></svg></button></div></div>';
    } else {
      html +=
        '<p class="min-auth-hint min-comments-locked">Bench Player+ can comment. <button type="button" class="min-link-btn" data-nav="#subscribe">Upgrade</button></p></div>';
    }
    return html;
  }

  function getTier() {
    if (window.MIN_AUTH && window.MIN_AUTH.isSignedIn()) {
      return window.MIN_AUTH.getTier();
    }
    return "free";
  }

  function getProfile() {
    if (window.MIN_AUTH && window.MIN_AUTH.getCurrentProfile()) {
      return window.MIN_AUTH.getCurrentProfile();
    }
    return defaultProfile();
  }

  function getDisplayName() {
    var profile = getProfile();
    return profile.displayName || profile.name || "Member";
  }

  function isAdminUser() {
    return window.MIN_AUTH && window.MIN_AUTH.isAdmin && window.MIN_AUTH.isAdmin();
  }

  function canDeletePost(post) {
    if (!post || !post._firestore || !post.authorUid) return false;
    if (isAdminUser()) return true;
    if (!window.MIN_AUTH || !window.MIN_AUTH.getCurrentUser) return false;
    var user = window.MIN_AUTH.getCurrentUser();
    return Boolean(user && user.uid === post.authorUid);
  }

  function canDeleteResolvedPost(post) {
    if (!post || post.kind !== "community" || !post._firestore || !post.authorUid) return false;
    if (isAdminUser()) return true;
    if (!window.MIN_AUTH || !window.MIN_AUTH.getCurrentUser) return false;
    var user = window.MIN_AUTH.getCurrentUser();
    return Boolean(user && user.uid === post.authorUid);
  }

  function requireAuthForAction() {
    if (window.MIN_AUTH && window.MIN_AUTH.isSignedIn()) return true;
    navigate("#login");
    return false;
  }

  function tierLabel(t) {
    if (t === "owner") return "Owner";
    if (t === "starter") return "Starter";
    if (t === "bench") return "Bench";
    if (t === "vip") return "Owner";
    if (t === "member") return "Member";
    return "Free";
  }

  function tierClass(t) {
    if (t === "owner" || t === "vip") return "min-tier--owner";
    if (t === "starter") return "min-tier--starter";
    if (t === "bench" || t === "member") return "min-tier--bench";
    return "min-tier--free";
  }

  function contentAccessLevel(card) {
    if (!card) return "free";
    if (card.access) return card.access;
    return card.locked ? "starter" : "free";
  }

  function canAccessContent(level) {
    if (window.MIN_AUTH && window.MIN_AUTH.canAccessContentLevel) {
      return window.MIN_AUTH.canAccessContentLevel(level || "free");
    }
    return !level || level === "free";
  }

  function contentAccessLabel(level) {
    if (level === "owner") return "Owner only";
    if (level === "starter") return "Starter+";
    if (level === "bench") return "Bench Player+";
    return "";
  }

  function formatPlanPrice(price) {
    if (!price) return "Free";
    if (price >= 1000) return "US$" + price.toLocaleString("en-US");
    return "US$" + price;
  }

  function planHighlights(plan) {
    if (!plan || !plan.perks) return [];
    return plan.perks
      .split(/\.\s+/)
      .map(function (part) {
        return part.replace(/\.$/, "").trim();
      })
      .filter(function (part) {
        return part.length > 0;
      });
  }

  function renderCurrentPlanCard(plan, opts) {
    opts = opts || {};
    var isSaved = Boolean(opts.isSaved);
    var tierImage = plan.image || A + "stack.svg";
    var highlights = planHighlights(plan);
    var html =
      '<article class="min-sub-current-card min-tier-card--' +
      esc(plan.id) +
      '" role="status">' +
      '<div class="min-sub-current-media">' +
      '<img src="' +
      esc(tierImage) +
      '" alt="' +
      esc(plan.name) +
      ' plan" loading="lazy">' +
      '<span class="min-sub-current-badge' +
      (isSaved ? "" : " min-sub-current-badge--preview") +
      '">' +
      (isSaved ? "Active" : "Preview") +
      "</span>" +
      "</div>" +
      '<div class="min-sub-current-body">' +
      '<p class="min-sub-current-label">' +
      (isSaved ? "Your current plan" : "Selected plan") +
      "</p>" +
      '<h3 class="min-sub-current-name">' +
      esc(plan.name) +
      "</h3>" +
      '<p class="min-sub-current-price">' +
      esc(formatPlanPrice(plan.price)) +
      (plan.price ? "<span>/month</span>" : "") +
      "</p>";
    if (plan.limited) {
      html += '<p class="min-tier-limited min-sub-current-limited">Limited to 20 members</p>';
    }
    if (highlights.length) {
      html += '<ul class="min-sub-current-features">';
      highlights.forEach(function (item) {
        html += "<li>" + esc(item) + "</li>";
      });
      html += "</ul>";
    }
    html += "</div></article>";
    return html;
  }

  function hasChatAccess() {
    return window.MIN_AUTH && window.MIN_AUTH.hasChatAccess && window.MIN_AUTH.hasChatAccess();
  }

  function hasCommentAccess() {
    return window.MIN_AUTH && window.MIN_AUTH.hasCommentAccess && window.MIN_AUTH.hasCommentAccess();
  }

  function hasTrainingAccess() {
    return window.MIN_AUTH && window.MIN_AUTH.hasTrainingAccess && window.MIN_AUTH.hasTrainingAccess();
  }

  function hasOwnerAccess() {
    return window.MIN_AUTH && window.MIN_AUTH.hasOwnerAccess && window.MIN_AUTH.hasOwnerAccess();
  }

  function getPlanById(id) {
    var subs = catalogSubscriptions();
    for (var i = 0; i < subs.length; i += 1) {
      if (subs[i].id === id) return subs[i];
    }
    return subs[0] || null;
  }

  function getSavedSubscriptionId() {
    if (window.MIN_AUTH && window.MIN_AUTH.isSignedIn() && window.MIN_AUTH.getSubscriptionId) {
      return window.MIN_AUTH.getSubscriptionId() || "waterboy";
    }
    return "";
  }

  function getSubscribeSelectedId() {
    if (subscribePreviewId) return subscribePreviewId;
    var saved = getSavedSubscriptionId();
    if (saved) return saved;
    var subs = catalogSubscriptions();
    return subs[0] ? subs[0].id : "waterboy";
  }

  function applySubscribeSelection() {
    var selectedId = getSubscribeSelectedId();
    var plan = getPlanById(selectedId);
    if (!plan) return;

    var signedIn = window.MIN_AUTH && window.MIN_AUTH.isSignedIn();
    var savedId = getSavedSubscriptionId();
    var isSaved = signedIn && savedId === selectedId;

    var currentEl = document.getElementById("minSubCurrentPlan");
    if (currentEl) {
      currentEl.innerHTML = renderCurrentPlanCard(plan, { isSaved: isSaved });
    }

    document.querySelectorAll(".min-tier-card[data-tier]").forEach(function (card) {
      var tier = card.getAttribute("data-tier");
      var isSelected = tier === selectedId;
      var isSavedPlan = signedIn && tier === savedId;

      card.classList.toggle("is-selected", isSelected);
      card.classList.toggle("is-current", isSelected && isSavedPlan);
      card.setAttribute("aria-pressed", isSelected ? "true" : "false");

      var media = card.querySelector(".min-tier-card-media");
      if (media) {
        var existingBadge = media.querySelector(".min-tier-card-badge");
        if (existingBadge) existingBadge.remove();
        if (isSelected) {
          var badge = document.createElement("span");
          badge.className = "min-tier-card-badge";
          badge.textContent = isSavedPlan ? "Your plan" : "Selected";
          media.appendChild(badge);
        }
      }

      var btn = card.querySelector(".min-tier-select");
      if (btn) {
        var tierPlan = getPlanById(tier);
        if (isSavedPlan) {
          btn.disabled = true;
          btn.setAttribute("aria-disabled", "true");
          btn.textContent = "Current plan";
        } else {
          btn.disabled = false;
          btn.removeAttribute("aria-disabled");
          btn.textContent = tierSelectCta(tierPlan, savedId, signedIn);
        }
      }
    });

    if (currentEl) {
      currentEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function getSubscriptionPlan() {
    if (!window.MIN_AUTH || !window.MIN_AUTH.getSubscriptionId) return null;
    var id = window.MIN_AUTH.getSubscriptionId();
    if (!id) id = "waterboy";
    var subs = catalogSubscriptions();
    for (var i = 0; i < subs.length; i += 1) {
      if (subs[i].id === id) return subs[i];
    }
    return null;
  }

  function tierSelectCta(sub, subscriptionId, signedIn) {
    if (!signedIn) return "Join " + sub.name;
    if (sub.id === subscriptionId) return "Current plan";
    var currentRank =
      window.MIN_AUTH && window.MIN_AUTH.getSubscriptionRank
        ? window.MIN_AUTH.getSubscriptionRank()
        : 0;
    var targetRank = 0;
    if (sub.id === "bench") targetRank = 1;
    else if (sub.id === "starter") targetRank = 2;
    else if (sub.id === "owner") targetRank = 3;
    if (targetRank > currentRank) return "Upgrade to " + sub.name;
    if (targetRank < currentRank) return "Switch to " + sub.name;
    return "Select " + sub.name;
  }

  function subscriptionPlansForDisplay() {
    var subscriptionId =
      window.MIN_AUTH && window.MIN_AUTH.isSignedIn() && window.MIN_AUTH.getSubscriptionId
        ? window.MIN_AUTH.getSubscriptionId()
        : "";
    var plans = catalogSubscriptions().slice();
    plans.sort(function (a, b) {
      if (subscriptionId && a.id === subscriptionId) return -1;
      if (subscriptionId && b.id === subscriptionId) return 1;
      return a.price - b.price;
    });
    return { subscriptionId: subscriptionId, plans: plans };
  }

  function profilePlanLabel() {
    var plan = getSubscriptionPlan();
    if (plan) return plan.name;
    return tierLabel(getTier());
  }

  function isAuthReady() {
    return window.MIN_AUTH && window.MIN_AUTH.isAuthReady && window.MIN_AUTH.isAuthReady();
  }

  function isPublicRoute(name) {
    return name === "register" || name === "login";
  }

  function isHomeRoute(name) {
    return name === "home";
  }

  function enforceRouteAccess(route) {
    if (isAuthRoute(route.name)) {
      return route;
    }

    if (!isAuthReady()) return route;

    var signedIn = window.MIN_AUTH.isSignedIn();

    if (signedIn) {
      if (route.name === "admin" && !isAdminUser()) {
        return { name: "home", id: null, tab: "home", isSub: false };
      }
      return route;
    }

    if (isHomeRoute(route.name)) {
      return { name: "register", id: null, tab: null, isSub: true };
    }

    if (!isPublicRoute(route.name)) {
      return { name: "register", id: null, tab: null, isSub: true };
    }

    return route;
  }

  function parseRoute() {
    var raw = (location.hash || "#register").slice(1);
    var parts = raw.split("/");
    var name = parts[0] || "register";
    if (name === "sales") name = "register";
    var id = parts[1] || null;
    var openComments = name === "post" && parts[2] === "comments";
    var mainTabs = ["home", "posts", "chat", "learn", "admin", "shop"];
    var isSub = ["post", "thread", "subscribe", "register", "login", "profile"].indexOf(name) >= 0;
    var tab = name === "posts" ? "home" : mainTabs.indexOf(name) >= 0 ? name : "home";
    if (isSub) tab = null;
    return { name: name, id: id, tab: tab, isSub: isSub, openComments: openComments };
  }

  function navigate(hash) {
    if (hash.charAt(0) !== "#") hash = "#" + hash;
    if (location.hash === hash) {
      render();
      return;
    }
    location.hash = hash;
  }

  function goToRegister() {
    navigate("#register");
  }

  function isAuthRoute(name) {
    return name === "register" || name === "login";
  }

  function icon(name, active) {
    var suffix = active ? "_b" : "";
    if (name === "house") return A + "house" + suffix + ".svg";
    if (name === "message") return A + "message" + suffix + ".svg";
    if (name === "graduation") return A + "graduation" + suffix + ".svg";
    if (name === "basket") return A + "basket" + suffix + ".svg";
    if (name === "filter") return A + "filter.svg";
    return A + name + ".svg";
  }

  function renderHeader(route) {
    var header = $("#minHeader");
    if (!header) return;

    if (route.isSub) {
      var titles = {
        post: "Post",
        thread: "Chat",
        subscribe: "Subscriptions",
        register: "Register",
        login: "Sign in",
        profile: "Personal info",
      };
      var title = titles[route.name] || "The Minorities";
      if (route.name === "post" && route.id) {
        var postRef = resolvePost(route.id);
        if (postRef) {
          title = getPostHeaderTitle(postRef);
        }
      }
      if (route.name === "thread" && route.id) {
        var chat = chatsList().find(function (c) {
          return c.id === route.id;
        });
        if (chat) title = chat.name;
      }
      header.className = "min-header min-header--sub";
      header.innerHTML =
        '<div class="min-header-inner">' +
        '<button type="button" class="min-back-btn" id="minBackBtn" aria-label="Go back">‹</button>' +
        "<p class=\"min-header-title\">" +
        esc(title) +
        "</p></div>";
      return;
    }

    if (route.tab === "home") {
      header.className = "min-header";
      header.innerHTML =
        '<div class="min-header-inner">' +
        '<img class="min-logo" src="' +
        A +
        'logo_site.png" alt="The Minorities logo">' +
        '<p class="min-wordmark">the minorities</p>' +
        '<button type="button" class="min-icon-btn min-spacer" id="minProfileBtn" aria-label="Open profile">' +
        '<img src="' +
        A +
        'person.svg" width="32" height="32" alt="">' +
        "</button></div>" +
        '<div class="min-segments">' +
        '<button type="button" class="min-segment' +
        (route.name === "home" ? " is-active" : "") +
        '" data-segment="home">Home</button>' +
        '<button type="button" class="min-segment' +
        (route.name === "posts" ? " is-active" : "") +
        '" data-segment="posts">Posts</button></div>';
      return;
    }

    var tabTitles = { chat: "Chat", learn: "Learn", shop: "Shop", admin: "Admin" };
    header.className = "min-header";
    header.innerHTML =
      '<div class="min-header-inner" style="justify-content:center">' +
      '<p class="min-header-title">' +
      esc(tabTitles[route.tab] || "The Minorities") +
      "</p></div>";
  }

  function renderTabbar(route) {
    var bar = $("#minTabbar");
    if (!bar) return;
    if (route.isSub) {
      bar.innerHTML = "";
      bar.style.display = "none";
      return;
    }
    bar.style.display = "";
    var tabs = [
      { id: "home", label: "Home", icon: "house" },
      { id: "chat", label: "Chat", icon: "message" },
      { id: "learn", label: "Learn", icon: "graduation" },
    ];
    if (isAdminUser()) {
      tabs.push({ id: "admin", label: "Admin", icon: "filter" });
    }
    tabs.push({ id: "shop", label: "Shop", icon: "basket" });
    var active = route.tab || "home";
    bar.innerHTML =
      "<nav>" +
      tabs
        .map(function (t) {
          var isActive = t.id === active;
          return (
            '<button type="button" class="min-tab' +
            (isActive ? " is-active" : "") +
            '" data-tab="' +
            t.id +
            '" aria-label="' +
            esc(t.label) +
            '">' +
            '<img src="' +
            icon(t.icon, isActive) +
            '" alt="">' +
            "<span>" +
            esc(t.label) +
            "</span></button>"
          );
        })
        .join("") +
      "</nav>";
  }

  function upgradeBanner() {
    return (
      '<div class="min-upgrade-banner" data-nav="#subscribe" role="button" tabindex="0">' +
      '<img src="' +
      A +
      'lock_open.svg" width="28" height="28" alt="">' +
      "<div><strong>Upgrade for full access</strong><span>Bench → chat · Starter → training & 90% content · Owner → all-in</span></div>" +
      '<span class="min-chevron">›</span></div>'
    );
  }

  function metaLine(date, comments) {
    return (
      '<p class="min-meta">' +
      esc(date) +
      " · " +
      comments +
      ' <img src="' +
      A +
      'message.svg" width="14" height="11" alt=""></p>'
    );
  }

  function renderHomeFeed() {
    var html =
      '<div class="min-screen">' +
      upgradeBanner() +
      '<p class="min-section-label">Content</p>';

    var cards = contentCardsList();
    if (!cards.length) {
      html +=
        '<p class="min-auth-hint" style="margin-bottom:12px">Content library loads from Firestore. Check back in a moment.</p>';
    }

    cards.forEach(function (card) {
      var access = contentAccessLevel(card);
      var locked = !canAccessContent(access);
      var dest = locked ? "#subscribe" : "#post/" + card.id;
      html += '<article class="min-content-card" data-nav="' + dest + '">';
      if (card.image) {
        if (locked) {
          html +=
            '<div class="min-locked-wrap"><img class="hero" src="' +
            esc(card.image) +
            '" alt="">' +
            '<div class="min-locked-badge"><span>🔒 ' +
            esc(contentAccessLabel(access) || "Upgrade to unlock") +
            "</span></div></div>";
        } else {
          html += '<img class="hero" src="' + esc(card.image) + '" alt="">';
        }
      }
      html +=
        '<div class="min-card-body"><h3>' +
        esc(card.title) +
        "</h3>" +
        metaLine(card.date, card.comments) +
        "</div></article>";
    });

    var promo = homePromo();
    var promoLink = promo.linkTab ? "#" + promo.linkTab : "#shop";
    html +=
      '<div class="min-promo">' +
      '<div class="min-promo-text"><div><h4>' +
      esc(promo.title) +
      "</h4><p>" +
      esc(promo.body) +
      '</p></div><button type="button" class="min-promo-cta" data-nav="' +
      esc(promoLink) +
      '">' +
      esc(promo.cta) +
      '</button></div><div class="min-promo-img"><img src="' +
      esc(promo.image) +
      '" alt=""></div></div>';

    html += "</div>";
    return html;
  }

  function renderPosts() {
    var filtered = filteredPostsList();
    var filterActive = postsFilter !== "all";
    var html =
      '<div class="min-screen">' +
      '<div class="min-posts-toolbar">' +
      '<button type="button" class="min-icon-btn' +
      (filterActive ? " min-icon-btn--active" : "") +
      '" id="minFilterBtn" aria-label="Filter posts">' +
      '<img src="' +
      A +
      'filter.svg" width="28" height="28" alt="">' +
      "</button>" +
      (filterActive
        ? '<span class="min-posts-filter-label">Showing: ' + esc(postsFilterLabel(postsFilter)) + "</span>"
        : "") +
      "</div>";

    if (!filtered.length) {
      html +=
        '<div class="min-empty"><p>No posts match this filter.</p>' +
        '<button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minFilterClear">Show all posts</button></div>';
      html += "</div>";
      return html;
    }

    filtered.forEach(function (post) {
      var authorLabel = getCommunityAuthorLabel(post);
      html +=
        '<article class="min-post min-post--link" data-nav="#post/' +
        esc(post.id) +
        '" role="button" tabindex="0">';
      html +=
        '<div class="min-post-header"><img src="' +
        A +
        'person.svg" alt=""><div><strong>' +
        esc(authorLabel) +
        "</strong><time>" +
        esc(post.date) +
        "</time></div></div>";
      if (postHasVideo(post)) {
        if (post.headline) {
          html += '<h3 class="min-post-headline">' + esc(post.headline) + "</h3>";
        }
        html += postVideoHtml(post);
      } else {
        if (post.headline) {
          html += '<h3 class="min-post-headline">' + esc(post.headline) + "</h3>";
        }
        if (post.body) {
          html += '<p class="min-post-body">' + esc(post.body) + "</p>";
        }
        if (post.image) {
          html += '<img class="content" src="' + esc(post.image) + '" alt="">';
        }
      }
      html +=
        '<div class="min-post-actions">' +
        renderPostLikeButton(post.id, getPostLikes(post)) +
        renderPostCommentButton(post.id, post.comments, false) +
        "</div></article>";
    });

    html += "</div>";
    return html;
  }

  function chatPreviewLabel(preview) {
    var text = String(preview || "").trim();
    return text || "No messages yet";
  }

  function renderChat() {
    var html = '<div class="min-screen">';
    var ownerLocked = !hasOwnerAccess();
    var chatLocked = !hasChatAccess();

    if (chatLocked) {
      html +=
        '<p class="min-auth-hint">Bench Player unlocks member chat and comments. <button type="button" class="min-link-btn" data-nav="#subscribe">View plans</button></p>';
    }

    html +=
      '<div class="min-chat-hero" data-nav="' +
      (ownerLocked ? "#subscribe" : "#thread/vip") +
      '" role="button" tabindex="0">' +
      '<img src="' +
      A +
      'message_b.svg" width="28" height="44" alt="">' +
      "<div><h3>Owner<br>Mastermind</h3>" +
      (ownerLocked
        ? '<span class="min-tier min-tier--owner">Owner only · 20 seats max</span>'
        : "") +
      "</div>" +
      '<span class="min-chevron" style="margin-left:auto;font-size:1.75rem">›</span></div>';

    html += '<p class="min-section-label">Chats</p>';

    if (chatLocked) {
      html +=
        '<div class="min-group-card min-group-card--locked" data-nav="#subscribe">Member chat — Bench Player+</div>';
    } else {
      var memberRooms = chatsList().filter(function (c) {
        return !c.vip;
      });
      var chatReady =
        window.MIN_CHAT && window.MIN_CHAT.isChatReady && window.MIN_CHAT.isChatReady();

      if (!memberRooms.length) {
        html +=
          '<p class="min-auth-hint" style="margin-bottom:12px">' +
          (chatReady
            ? "No chatrooms yet."
            : "Loading chats…") +
          "</p>";
      }

      memberRooms.forEach(function (chat) {
        html +=
          '<div class="min-chat-row" data-nav="#thread/' +
          esc(chat.id) +
          '" role="button" tabindex="0">' +
          '<img src="' +
          A +
          'person.svg" alt=""><div><p class="name">' +
          esc(chat.name) +
          '</p><p class="preview">' +
          esc(chatPreviewLabel(chat.preview)) +
          "</p></div></div>";
      });

      html +=
        '<button type="button" class="min-btn min-btn--ghost min-btn--block" id="minNewChatBtn" style="margin-top:8px">+ New Chatroom</button>';
    }

    html += "</div>";
    return html;
  }

  function renderLearn() {
    var learn = learnConfig();
    if (learnInClass) {
      return (
        '<div class="min-screen min-screen--full">' +
        '<iframe class="min-class-iframe" title="Live class stream" src="' +
        esc(learn.zoomUrl) +
        '" allow="camera; microphone; display-capture"></iframe></div>'
      );
    }
    return (
      '<div class="min-screen" style="display:flex;align-items:center;min-height:60dvh">' +
      '<section class="min-class-card" style="width:100%">' +
      '<p class="eyebrow">Upcoming Live Session</p>' +
      "<h2>" +
      esc(learn.nextSession) +
      "</h2>" +
      '<button type="button" class="min-btn min-btn--primary" id="minJoinClass"' +
      (hasTrainingAccess() ? "" : ' data-nav="#subscribe"') +
      ">" +
      (hasTrainingAccess() ? "Join Live Class" : "Upgrade to join (Starter+)") +
      "</button>" +
      '<p style="margin-top:16px;font-size:0.8125rem;color:var(--min-muted)">' +
      esc(learn.previewNote || "Members get the full session — free accounts see schedule only.") +
      "</p>" +
      "</section></div>"
    );
  }

  function renderShop() {
    var products = productsList();
    var html =
      '<div class="min-screen min-screen--wide"><div class="min-shop-grid">';
    if (!products.length) {
      html +=
        '<p class="min-auth-hint" style="grid-column:1/-1">Shop products load from Firestore. Check back in a moment.</p>';
    }
    products.forEach(function (p) {
      html +=
        '<div class="min-product" data-shop-url="' +
        esc(p.url) +
        '" role="button" tabindex="0">' +
        '<img src="' +
        esc(p.image) +
        '" alt="' +
        esc(p.name) +
        '">' +
        "<h3>" +
        esc(p.name) +
        "</h3>" +
        '<p class="price">' +
        esc(p.price) +
        '</p><span class="shop-cta">Shop Now ›</span></div>';
    });
    html += "</div></div>";
    return html;
  }

  function renderPostCommentButton(postId, count, expandOnly) {
    var attrs = expandOnly
      ? ' data-expand-comments="true"'
      : ' data-open-comments="' + esc(postId) + '"';
    return (
      '<button type="button" class="min-post-comment-btn"' +
      attrs +
      ' aria-label="View comments"><img src="' +
      A +
      'message.svg" width="16" height="12" alt=""><span>' +
      count +
      "</span></button>"
    );
  }

  function renderPostDetail(id, openComments) {
    var post = resolvePost(id);
    if (!post) {
      return (
        '<div class="min-screen min-empty"><p>Post not found.</p><button type="button" class="min-btn min-btn--primary" data-nav="#posts">Back to posts</button></div>'
      );
    }

    if (post.kind === "content") {
      var card = contentCardsList().find(function (entry) {
        return entry.id === id;
      });
      var access = contentAccessLevel(card);
      if (!canAccessContent(access)) {
        return (
          '<div class="min-screen min-empty"><p>This content requires ' +
          esc(contentAccessLabel(access) || "an upgrade") +
          '.</p><button type="button" class="min-btn min-btn--primary" data-nav="#subscribe">View plans</button> <button type="button" class="min-btn min-btn--ghost" data-nav="#home">Back to Home</button></div>'
        );
      }
    }

    var html = '<div class="min-screen min-post-detail min-post-detail--full">';

    var authorLabel = getPostHeaderTitle(post);

    if (authorLabel) {
      html +=
        '<div class="min-post-detail-author"><img src="' +
        A +
        'person.svg" alt=""><div><strong>' +
        esc(authorLabel) +
        "</strong><time>" +
        esc(post.date) +
        "</time></div></div>";
    }

    html += "<h1>" + esc(post.title) + "</h1>";

    if (postHasVideo(post)) {
      html += postVideoHtml(post);
    } else if (post.image) {
      html += '<img class="hero" src="' + esc(post.image) + '" alt="">';
    }

    if (post.body && !postHasVideo(post)) {
      html += '<p class="body-copy">' + esc(post.body) + "</p>";
    }

    if (post.kind === "community") {
      var listPost = postsList().find(function (entry) {
        return entry.id === id;
      });
      html +=
        '<div class="min-post-detail-actions">' +
        renderPostLikeButton(id, listPost ? getPostLikes(listPost) : getPostLikes({ id: id, likes: 0 })) +
        renderPostCommentButton(id, Array.isArray(post.comments) ? post.comments.length : 0, true) +
        "</div>";
      if (canDeleteResolvedPost(post)) {
        html +=
          '<button type="button" class="min-btn min-btn--ghost min-btn--block" id="minDeletePostBtn" style="margin-top:16px;color:var(--min-danger)">Delete post</button>';
      }
    }

    html += "</div>" + renderCommentsSheet(post.comments, openComments);
    return html;
  }

  function renderThread(id) {
    var chat = chatsList().find(function (c) {
      return c.id === id;
    });

    if (chat && chat.vip && !hasOwnerAccess()) {
      return (
        '<div class="min-screen min-empty"><p>Owner Mastermind is limited to 20 members.</p><button type="button" class="min-btn min-btn--primary" data-nav="#subscribe">View Owner plan</button> <button type="button" class="min-btn min-btn--ghost" data-nav="#chat">Back</button></div>'
      );
    }

    if (!hasChatAccess()) {
      return (
        '<div class="min-screen min-empty"><p>Bench Player unlocks member chat.</p><button type="button" class="min-btn min-btn--primary" data-nav="#subscribe">View plans</button> <button type="button" class="min-btn min-btn--ghost" data-nav="#chat">Back</button></div>'
      );
    }

    var msgs = threadMessages(id);
    var msgsLoaded =
      window.MIN_CHAT &&
      window.MIN_CHAT.isRoomMessagesLoaded &&
      window.MIN_CHAT.isRoomMessagesLoaded(id);
    var html = '<div class="min-screen min-screen--full">';
    html += '<div class="min-messages" id="minMessages">';
    if (!msgsLoaded) {
      html += '<p class="min-auth-hint min-chat-empty">Loading messages…</p>';
    } else if (!msgs.length) {
      html +=
        '<p class="min-auth-hint min-chat-empty">No messages yet. Say something to start the room.</p>';
    }
    msgs.forEach(function (m) {
      html +=
        '<div class="min-msg-row' +
        (m.mine ? " is-mine" : "") +
        '">' +
        (m.mine ? "" : '<img src="' + A + 'person.svg" alt="">') +
        '<div class="min-bubble ' +
        (m.mine ? "min-bubble--mine" : "min-bubble--them") +
        '">' +
        esc(m.text) +
        "</div>" +
        (m.mine ? '<img src="' + A + 'person.svg" alt="">' : "") +
        "</div>";
    });
    html += "</div>";
    html +=
      '<div class="min-chat-input-bar"><input type="text" id="minChatInput" placeholder="Type a message…" aria-label="Message">' +
      '<button type="button" class="min-btn min-btn--primary min-btn--sm" id="minChatSend">Send</button></div></div>';
    return html;
  }

  function renderLogin() {
    return (
      '<div class="min-screen">' +
      '<h2 class="min-page-title" style="text-align:left;font-size:1.75rem">Sign in to<br>The Minorities</h2>' +
      '<form class="min-form" id="minLoginForm">' +
      '<div class="min-field"><label for="minLoginEmail">Email</label><input id="minLoginEmail" type="email" placeholder="Email" autocomplete="email"></div>' +
      '<div class="min-field"><label for="minLoginPassword">Password</label><input id="minLoginPassword" type="password" placeholder="Password" autocomplete="current-password"></div>' +
      '<button type="submit" class="min-btn min-btn--accent min-btn--block" id="minLoginSubmit">Sign in</button>' +
      '<button type="button" class="min-btn min-btn--ghost min-btn--block" id="minForgotPassword" style="margin-top:12px">Forgot password</button>' +
      '<p class="min-auth-switch">No account? <button type="button" class="min-link-btn" data-nav="#register">Register</button></p>' +
      "</form></div>"
    );
  }

  function renderSubscribe() {
    var signedIn = window.MIN_AUTH && window.MIN_AUTH.isSignedIn();
    var savedId = getSavedSubscriptionId();
    var selectedId = getSubscribeSelectedId();
    var displayedPlan = getPlanById(selectedId);
    var isSavedSelection = signedIn && savedId === selectedId;
    var html =
      '<div class="min-screen min-screen--subscribe min-screen--wide"><h2 class="min-page-title">Subscription Options</h2>';

    html +=
      '<p class="min-auth-hint min-subscribe-hint">Tap any plan to preview it above' +
      (signedIn
        ? '. Use the button to save your choice.'
        : '. <button type="button" class="min-link-btn" data-nav="#login">Sign in</button> to save.') +
      "</p>";

    if (displayedPlan) {
      html +=
        '<div id="minSubCurrentPlan">' +
        renderCurrentPlanCard(displayedPlan, { isSaved: isSavedSelection }) +
        "</div>";
    }

    html += '<p class="min-section-label">All plans</p>';
    html += '<p class="min-tier-grid-hint">Swipe to compare all plans</p>';
    html += '<div class="min-tier-grid-wrap"><div class="min-tier-grid" role="list">';

    catalogSubscriptions().forEach(function (sub) {
      var isSelected = sub.id === selectedId;
      var isSavedPlan = signedIn && sub.id === savedId;
      var cta = tierSelectCta(sub, savedId, signedIn);
      var priceLine =
        formatPlanPrice(sub.price) + (sub.price ? '<span style="font-size:0.75rem;font-weight:400;color:var(--min-muted)">/month</span>' : "");
      var tierImage = sub.image || A + "stack.svg";
      html +=
        '<article class="min-tier-card min-tier-card--pickable min-tier-card--' +
        esc(sub.id) +
        (sub.limited ? " min-tier-card--limited" : "") +
        (isSelected ? " is-selected" : "") +
        (isSelected && isSavedPlan ? " is-current" : "") +
        '" role="listitem button" tabindex="0" aria-pressed="' +
        (isSelected ? "true" : "false") +
        '" data-tier="' +
        esc(sub.id) +
        '">' +
        '<div class="min-tier-card-media">' +
        '<img src="' +
        esc(tierImage) +
        '" alt="' +
        esc(sub.name) +
        ' plan" loading="lazy">' +
        (isSelected
          ? '<span class="min-tier-card-badge">' + (isSavedPlan ? "Your plan" : "Selected") + "</span>"
          : "") +
        "</div>" +
        '<div class="min-tier-card-body"><h3>' +
        esc(sub.name) +
        '</h3><p class="price">' +
        priceLine +
        "</p>" +
        (sub.limited ? '<p class="min-tier-limited">Limited to 20 members</p>' : "") +
        '<p class="min-tier-perks">' +
        esc(sub.perks) +
        '</p><button type="button" class="min-btn min-btn--primary min-btn--block min-tier-select"' +
        (isSavedPlan ? ' disabled aria-disabled="true"' : "") +
        ' data-tier="' +
        esc(sub.id) +
        '">' +
        esc(isSavedPlan ? "Current plan" : cta) +
        "</button></div></article>";
    });
    html += "</div></div></div>";
    return html;
  }

  function renderAdmin() {
    if (!isAdminUser()) {
      return (
        '<div class="min-screen"><p class="min-auth-hint">Admin access only.</p></div>'
      );
    }

    var firestorePosts = postsList().filter(function (p) {
      return p._firestore;
    });
    var firestoreCards = contentCardsList().filter(function (c) {
      return c._firestore;
    });
    var teamRole =
      window.MIN_AUTH && window.MIN_AUTH.getTeamRoleLabel
        ? window.MIN_AUTH.getTeamRoleLabel()
        : "Admin";

    var html =
      '<div class="min-screen min-screen--admin">' +
      '<p class="min-admin-eyebrow">Team console</p>' +
      "<h2 class=\"min-page-title\">Admin</h2>" +
      '<div class="min-admin-stats">' +
      '<div class="min-admin-stat"><strong>' +
      esc(String(firestorePosts.length)) +
      '</strong><span>Live posts</span></div>' +
      '<div class="min-admin-stat"><strong>' +
      esc(String(firestoreCards.length)) +
      '</strong><span>Library cards</span></div>' +
      '<div class="min-admin-stat"><strong>' +
      esc(teamRole) +
      '</strong><span>Your role</span></div>' +
      "</div>";

    html +=
      '<section class="min-admin-section">' +
      "<h3>Add home content card</h3>" +
      '<p class="min-admin-hint">Shows on the Home feed. Use a direct image URL (YouTube thumbnail, CDN, etc.).</p>' +
      '<form class="min-form" id="minAdminCardForm">' +
      '<div class="min-field"><label for="minAdminCardTitle">Title</label><input id="minAdminCardTitle" type="text" placeholder="Episode title"></div>' +
      '<div class="min-field"><label for="minAdminCardImage">Image URL</label><input id="minAdminCardImage" type="url" placeholder="https://…"></div>' +
      '<div class="min-field"><label for="minAdminCardVideo">Video URL (optional)</label><input id="minAdminCardVideo" type="url" placeholder="YouTube link"></div>' +
      '<div class="min-field"><label for="minAdminCardAuthor">Author label</label><input id="minAdminCardAuthor" type="text" value="The Minorities"></div>' +
      '<div class="min-field"><label for="minAdminCardAccess">Access level</label><select id="minAdminCardAccess">' +
      '<option value="free">Free (Waterboy)</option>' +
      '<option value="bench">Bench+</option>' +
      '<option value="starter" selected>Starter+</option>' +
      '<option value="owner">Owner only</option>' +
      "</select></div>" +
      '<button type="submit" class="min-btn min-btn--primary min-btn--block" id="minAdminCardSubmit">Publish card</button>' +
      "</form></section>";

    html +=
      '<section class="min-admin-section">' +
      "<h3>Home library</h3>";
    if (!firestoreCards.length) {
      html += '<p class="min-admin-empty">No library cards in Firestore yet. An admin login on a fresh project auto-seeds starter content.</p>';
    } else {
      html += '<ul class="min-admin-list">';
      firestoreCards.forEach(function (card) {
        html +=
          '<li class="min-admin-list-item">' +
          '<div><strong>' +
          esc(card.title) +
          '</strong><span class="min-admin-meta">' +
          esc(card.access || "free") +
          "</span></div>" +
          '<button type="button" class="min-btn min-btn--ghost min-btn--sm min-admin-delete-card" data-card-id="' +
          esc(card.id) +
          '">Remove</button></li>';
      });
      html += "</ul>";
    }
    html += "</section>";

    html +=
      '<section class="min-admin-section">' +
      "<h3>Moderate posts</h3>";
    if (!firestorePosts.length) {
      html += '<p class="min-admin-empty">No community posts in Firestore yet.</p>';
    } else {
      html += '<ul class="min-admin-list">';
      firestorePosts.slice(0, 12).forEach(function (post) {
        var label = post.headline || post.body || "Post";
        html +=
          '<li class="min-admin-list-item">' +
          '<div><strong>' +
          esc(post.author || "Member") +
          '</strong><span class="min-admin-meta">' +
          esc(label.slice(0, 80)) +
          "</span></div>" +
          '<button type="button" class="min-btn min-btn--ghost min-btn--sm min-admin-delete-post" data-post-id="' +
          esc(post.id) +
          '">Delete</button></li>';
      });
      html += "</ul>";
    }
    html += "</section>";

    html +=
      '<section class="min-admin-section">' +
      "<h3>Assign team role</h3>" +
      '<p class="min-admin-hint">Paste a user UID from Firebase Console → Authentication. Roles control moderation — separate from paid subscriptions.</p>' +
      '<form class="min-form" id="minAdminRoleForm">' +
      '<div class="min-field"><label for="minAdminRoleUid">User UID</label><input id="minAdminRoleUid" type="text" placeholder="Firebase Auth UID"></div>' +
      '<div class="min-field"><label for="minAdminRoleSelect">Team role</label><select id="minAdminRoleSelect">' +
      '<option value="member">Member — regular fan</option>' +
      '<option value="creator">Creator — Jason/Jay, crew</option>' +
      '<option value="moderator">Moderator — delete posts, moderate</option>' +
      '<option value="admin">Admin — full access (Zeb/Jay)</option>' +
      "</select></div>" +
      '<button type="submit" class="min-btn min-btn--accent min-btn--block" id="minAdminRoleSubmit">Save role</button>' +
      "</form></section>";

    html += "</div>";
    return html;
  }

  function validateAvatarSelection(file, inputEl) {
    if (!file || !window.MIN_AUTH || !window.MIN_AUTH.validateProfileAvatarFile) return true;
    var err = window.MIN_AUTH.validateProfileAvatarFile(file);
    if (!err) return true;
    alert(err);
    if (inputEl) inputEl.value = "";
    return false;
  }

  function handleAvatarFileSelect(file, inputEl, previewEl, onReady, btnEl) {
    if (!file) return;
    if (!validateAvatarSelection(file, inputEl)) return;

    var originalLabel = btnEl ? btnEl.textContent : "";
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = "Compressing…";
    }

    var prepare =
      window.MIN_AUTH && window.MIN_AUTH.prepareProfileAvatar
        ? window.MIN_AUTH.prepareProfileAvatar(file)
        : Promise.resolve(file);

    prepare
      .then(function (readyFile) {
        if (typeof onReady === "function") onReady(readyFile);
        if (!previewEl) return;
        var reader = new FileReader();
        reader.onload = function () {
          previewEl.src = reader.result;
        };
        reader.readAsDataURL(readyFile);
      })
      .catch(function (err) {
        alert(err && err.message ? err.message : "Could not prepare image.");
        if (inputEl) inputEl.value = "";
        if (typeof onReady === "function") onReady(null);
      })
      .finally(function () {
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.textContent = originalLabel || "Change picture";
        }
      });
  }

  function renderProfile() {
    var profile = getProfile();
    var signedIn = window.MIN_AUTH && window.MIN_AUTH.isSignedIn();
    if (!signedIn) {
      return (
        '<div class="min-screen"><p class="min-auth-hint">Sign in to edit your profile. ' +
        '<button type="button" class="min-link-btn" data-nav="#login">Sign in</button></p></div>'
      );
    }
    var avatarSrc = profile.avatarUrl || A + "person.svg";
    return (
      '<div class="min-screen">' +
      '<form class="min-form" id="minProfileForm">' +
      '<div class="min-avatar-upload"><input type="file" id="minProfileAvatarInput" accept="image/*" hidden>' +
      '<img id="minProfileAvatarPreview" src="' +
      esc(avatarSrc) +
      '" alt="Profile"><br>' +
      '<button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minProfileAvatarBtn" style="margin-top:12px">Change picture</button>' +
      '<p class="min-auth-hint" style="margin-top:8px">JPEG, PNG, WebP, or GIF · large photos are compressed automatically</p></div>' +
      '<div class="min-field"><label for="minProfileName">Name</label><input id="minProfileName" type="text" placeholder="Your name"></div>' +
      '<div class="min-field"><label for="minProfileUsername">Username</label><input id="minProfileUsername" type="text" placeholder="Username"></div>' +
      '<div class="min-field"><label for="minProfileBio">Bio</label><input id="minProfileBio" type="text" placeholder="Short bio"></div>' +
      '<button type="submit" class="min-btn min-btn--accent min-btn--block" id="minProfileSubmit">Save changes</button>' +
      "</form></div>"
    );
  }

  function renderRegister() {
    return (
      '<div class="min-screen">' +
      '<h2 class="min-page-title" style="text-align:left;font-size:1.75rem">Register for<br>The Minorities App</h2>' +
      '<form class="min-form" id="minRegisterForm">' +
      '<div class="min-avatar-upload"><input type="file" id="minAvatarInput" accept="image/*" hidden>' +
      '<img id="minAvatarPreview" src="' +
      A +
      'person.svg" alt="Profile"><br>' +
      '<button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minAvatarBtn" style="margin-top:12px">Change picture</button>' +
      '<p class="min-auth-hint" style="margin-top:8px">JPEG, PNG, WebP, or GIF · large photos are compressed automatically</p></div>' +
      '<div class="min-field"><label for="minName">Name</label><input id="minName" type="text" placeholder="Your name"></div>' +
      '<div class="min-field"><label for="minUsername">Username</label><input id="minUsername" type="text" placeholder="Username"></div>' +
      '<div class="min-field"><label for="minBio">Bio</label><input id="minBio" type="text" placeholder="Short bio"></div>' +
      '<div class="min-field"><label for="minEmail">Email</label><input id="minEmail" type="email" placeholder="Email"></div>' +
      '<div class="min-field"><label for="minPassword">Password</label><input id="minPassword" type="password" placeholder="Password" autocomplete="new-password"></div>' +
      '<button type="submit" class="min-btn min-btn--accent min-btn--block" id="minRegisterSubmit">Create account</button>' +
      '<p class="min-auth-switch">Already have an account? <button type="button" class="min-link-btn" data-nav="#login">Sign in</button></p>' +
      "</form></div>"
    );
  }

  function renderMain(route) {
    switch (route.name) {
      case "home":
        return renderHomeFeed();
      case "posts":
        return renderPosts();
      case "chat":
        return renderChat();
      case "learn":
        return renderLearn();
      case "shop":
        return renderShop();
      case "admin":
        return renderAdmin();
      case "post":
        return renderPostDetail(route.id, route.openComments);
      case "thread":
        return renderThread(route.id);
      case "subscribe":
        return renderSubscribe();
      case "register":
        return renderRegister();
      case "login":
        return renderLogin();
      case "profile":
        return renderProfile();
      default:
        return renderRegister();
    }
  }

  function notificationMenuLabel() {
    if (window.MIN_NOTIFY && window.MIN_NOTIFY.areNotificationsEnabled && window.MIN_NOTIFY.areNotificationsEnabled()) {
      return "Notifications on";
    }
    if (window.MIN_NOTIFY && window.MIN_NOTIFY.isNotificationSupported && !window.MIN_NOTIFY.isNotificationSupported()) {
      return "Notifications unavailable";
    }
    return "Enable notifications";
  }

  function renderOverlays() {
    var tier = getTier();
    var profile = getProfile();
    var signedIn = window.MIN_AUTH && window.MIN_AUTH.isSignedIn();
    var avatarSrc = profile.avatarUrl || A + "person.svg";
    var postingUsername = signedIn ? getPostingUsername() : "";
    var createPostAuthorHint = postingUsername
      ? '<p class="min-auth-hint" id="minCreatePostAuthor">Posting as <strong>' +
        esc(postingUsername) +
        "</strong></p>"
      : '<p class="min-auth-hint" id="minCreatePostAuthor">Add a username in <button type="button" class="min-link-btn" data-nav="#profile">Personal info</button> before posting.</p>';
    return (
      '<div class="min-overlay min-overlay--center" id="minFilterOverlay">' +
      '<div class="min-dialog" role="dialog" aria-labelledby="minFilterTitle">' +
      '<h2 id="minFilterTitle">Filter posts</h2>' +
      '<label><input type="radio" name="minFilter" value="all"' +
      (postsFilter === "all" ? " checked" : "") +
      '> All posts</label><br>' +
      '<label><input type="radio" name="minFilter" value="minorities"' +
      (postsFilter === "minorities" ? " checked" : "") +
      '> The Minorities (team / VIP)</label><br>' +
      '<label><input type="radio" name="minFilter" value="community"' +
      (postsFilter === "community" ? " checked" : "") +
      "> Community members</label>" +
      '<div class="min-dialog-actions">' +
      '<button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minFilterCancel">Cancel</button>' +
      '<button type="button" class="min-btn min-btn--primary min-btn--sm" id="minFilterDone">Done</button></div></div></div>' +
      '<div class="min-overlay" id="minProfileOverlay">' +
      '<div class="min-sheet min-profile-menu">' +
      '<div class="min-sheet-header"><button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minProfileClose">Close</button></div>' +
      '<div class="min-profile-menu-header">' +
      '<img class="avatar" src="' +
      esc(avatarSrc) +
      '" alt="">' +
      "<h3>" +
      esc(signedIn ? getDisplayName() : "Guest") +
      "</h3>" +
      '<span class="min-tier ' +
      tierClass(tier) +
      '">' +
      esc(signedIn ? profilePlanLabel() : tierLabel(tier)) +
      "</span>" +
      (signedIn && window.MIN_AUTH.getTeamRole && window.MIN_AUTH.getTeamRole() !== "member"
        ? '<span class="min-team-role min-team-role--' +
          esc(window.MIN_AUTH.getTeamRole()) +
          '">' +
          esc(window.MIN_AUTH.getTeamRoleLabel ? window.MIN_AUTH.getTeamRoleLabel() : "") +
          "</span>"
        : "") +
      "</div>" +
      '<div class="min-menu-list">' +
      (signedIn
        ? menuRow("dollar.svg", "Subscriptions", "#subscribe") +
          (isAdminUser() ? menuRow("filter.svg", "Admin", "#admin") : "") +
          menuRow("signature.svg", "Personal info", "#profile") +
          menuRow("message.svg", notificationMenuLabel(), null, "toggle-notify") +
          menuRow("profile.svg", "Log out", null, "logout")
        : menuRow("profile.svg", "Sign in", "#login") +
          menuRow("signature.svg", "Register", "#register") +
          menuRow("dollar.svg", "Subscriptions", "#subscribe")) +
      "</div></div></div>" +
      '<div class="min-overlay" id="minCreatePostOverlay">' +
      '<div class="min-sheet">' +
      '<div class="min-sheet-header"><button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minCreateClose">Cancel</button>' +
      '<h2>Create post</h2><button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minCreatePublish" style="color:var(--min-primary)">Post</button></div>' +
      createPostAuthorHint +
      '<div class="min-field"><input type="text" id="minCreateTitle" placeholder="Title (optional)"></div>' +
      '<div class="min-field" style="margin-top:16px"><textarea id="minCreateBody" rows="6" placeholder="What\'s on your mind?" style="width:100%;padding:10px;border-radius:12px;border:1px solid var(--min-outline);resize:none"></textarea></div>' +
      '<div class="min-create-media">' +
      '<input type="file" id="minCreateImageInput" accept="image/*" hidden>' +
      '<button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minCreateImageBtn">Add image</button>' +
      '<button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minCreateImageClear" style="display:none">Remove image</button>' +
      '<img id="minCreateImagePreview" class="min-create-media-preview" alt="" style="display:none">' +
      '<input type="file" id="minCreateVideoInput" accept="video/*" hidden>' +
      '<button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minCreateVideoBtn">Add video</button>' +
      '<button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minCreateVideoClear" style="display:none">Remove video</button>' +
      '<p class="min-auth-hint" id="minCreateVideoName" style="display:none"></p>' +
      '<p class="min-auth-hint" id="minCreateVideoProgress" style="display:none"></p>' +
      '<p class="min-auth-hint">Add an image or a video, not both. Videos upload through Mux.</p></div></div></div>' +
      '<div class="min-overlay" id="minChatroomOverlay">' +
      '<div class="min-sheet">' +
      '<div class="min-sheet-header"><button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minChatroomClose">Cancel</button>' +
      '<h2>New chatroom</h2><button type="button" class="min-btn min-btn--ghost min-btn--sm" style="color:var(--min-primary)">Done</button></div>' +
      '<div class="min-field"><input type="text" id="minChatroomName" placeholder="Chatroom name"></div>' +
      '<p class="min-auth-hint">Custom chatrooms are coming soon. Use the default rooms for now.</p></div></div>'
    );
  }

  function menuRow(iconFile, label, hash, action) {
    var attrs = hash ? ' data-nav="' + hash + '"' : "";
    if (action) attrs += ' data-action="' + action + '"';
    return (
      '<div class="min-menu-row"' +
      attrs +
      "><img src=\"" +
      A +
      iconFile +
      '" alt=""><span>' +
      esc(label) +
      '</span><span class="chev">›</span></div>'
    );
  }

  function openOverlay(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add("is-open");
  }

  function closeOverlay(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove("is-open");
  }

  function closeAllOverlays() {
    document.querySelectorAll(".min-overlay.is-open").forEach(function (el) {
      el.classList.remove("is-open");
    });
  }

  function bindEvents(route) {
    var back = $("#minBackBtn");
    if (back) {
      back.onclick = function () {
        if (route.name === "post") {
          navigate(isCommunityPostId(route.id) ? "#posts" : "#home");
        } else if (route.name === "thread") navigate("#chat");
        else if (route.name === "register" || route.name === "login") {
          window.location.assign("minoritiesLanding.html");
        } else navigate("#home");
      };
    }

    document.querySelectorAll("[data-nav]").forEach(function (el) {
      el.onclick = function (e) {
        e.preventDefault();
        closeAllOverlays();
        navigate(el.getAttribute("data-nav"));
      };
      el.onkeydown = function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          el.click();
        }
      };
    });

    document.querySelectorAll("[data-tab]").forEach(function (btn) {
      btn.onclick = function () {
        navigate("#" + btn.getAttribute("data-tab"));
      };
    });

    document.querySelectorAll("[data-segment]").forEach(function (btn) {
      btn.onclick = function () {
        navigate("#" + btn.getAttribute("data-segment"));
      };
    });

    document.querySelectorAll(".min-product[data-shop-url]").forEach(function (el) {
      el.onclick = function () {
        window.open(el.getAttribute("data-shop-url"), "_blank", "noopener");
      };
    });

    var profileBtn = $("#minProfileBtn");
    if (profileBtn) profileBtn.onclick = function () {
      openOverlay("minProfileOverlay");
    };

    var profileClose = $("#minProfileClose");
    if (profileClose) profileClose.onclick = function () {
      closeOverlay("minProfileOverlay");
    };

    document.querySelectorAll(".min-overlay").forEach(function (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeOverlay(overlay.id);
      });
    });

    var filterBtn = $("#minFilterBtn");
    if (filterBtn) filterBtn.onclick = function () {
      openOverlay("minFilterOverlay");
    };
    var filterCancel = $("#minFilterCancel");
    if (filterCancel) filterCancel.onclick = function () {
      closeOverlay("minFilterOverlay");
    };
    var filterDone = $("#minFilterDone");
    if (filterDone) filterDone.onclick = function () {
      var selected = document.querySelector('input[name="minFilter"]:checked');
      var value = selected && selected.value ? selected.value : "all";
      if (value !== "all" && value !== "community" && value !== "minorities") {
        value = "all";
      }
      savePostsFilter(value);
      closeOverlay("minFilterOverlay");
      if (route.name === "posts" || route.name === "home") {
        render();
      }
    };
    var filterClear = $("#minFilterClear");
    if (filterClear) filterClear.onclick = function () {
      savePostsFilter("all");
      render();
    };

    var newChat = $("#minNewChatBtn");
    if (newChat) newChat.onclick = function () {
      openOverlay("minChatroomOverlay");
    };
    var chatroomClose = $("#minChatroomClose");
    if (chatroomClose) chatroomClose.onclick = function () {
      closeOverlay("minChatroomOverlay");
    };

    var createClose = $("#minCreateClose");

    var createPublish = $("#minCreatePublish");
    var pendingCreateImageFile = null;
    var createImageBtn = $("#minCreateImageBtn");
    var createImageInput = $("#minCreateImageInput");
    var createImageClear = $("#minCreateImageClear");
    var createImagePreview = $("#minCreateImagePreview");
    var createVideoBtn = $("#minCreateVideoBtn");
    var createVideoInput = $("#minCreateVideoInput");
    var createVideoClear = $("#minCreateVideoClear");
    var createVideoName = $("#minCreateVideoName");
    var createVideoProgress = $("#minCreateVideoProgress");
    var pendingCreateVideoFile = null;

    function setCreateVideoProgress(message) {
      if (!createVideoProgress) return;
      if (!message) {
        createVideoProgress.style.display = "none";
        createVideoProgress.textContent = "";
        return;
      }
      createVideoProgress.style.display = "block";
      createVideoProgress.textContent = message;
    }

    function clearCreateVideo() {
      pendingCreateVideoFile = null;
      if (createVideoInput) createVideoInput.value = "";
      if (createVideoName) {
        createVideoName.style.display = "none";
        createVideoName.textContent = "";
      }
      if (createVideoClear) createVideoClear.style.display = "none";
      if (createVideoBtn) createVideoBtn.style.display = "";
      setCreateVideoProgress("");
    }

    function clearCreateImage() {
      pendingCreateImageFile = null;
      if (createImageInput) createImageInput.value = "";
      if (createImagePreview) {
        createImagePreview.src = "";
        createImagePreview.style.display = "none";
      }
      if (createImageClear) createImageClear.style.display = "none";
      if (createImageBtn) createImageBtn.style.display = "";
    }

    if (createImageBtn && createImageInput) {
      createImageBtn.onclick = function () {
        createImageInput.click();
      };
      createImageInput.onchange = function (ev) {
        var file = ev.target.files[0];
        if (!file) return;
        pendingCreateImageFile = file;
        clearCreateVideo();
        var reader = new FileReader();
        reader.onload = function () {
          if (createImagePreview) {
            createImagePreview.src = reader.result;
            createImagePreview.style.display = "block";
          }
          if (createImageClear) createImageClear.style.display = "";
          if (createImageBtn) createImageBtn.style.display = "none";
        };
        reader.readAsDataURL(file);
      };
    }

    if (createImageClear) {
      createImageClear.onclick = function () {
        clearCreateImage();
      };
    }

    if (createVideoBtn && createVideoInput) {
      createVideoBtn.onclick = function () {
        createVideoInput.click();
      };
      createVideoInput.onchange = function (ev) {
        var file = ev.target.files[0];
        if (!file) return;
        pendingCreateVideoFile = file;
        clearCreateImage();
        if (createVideoName) {
          createVideoName.style.display = "block";
          createVideoName.textContent = file.name;
        }
        if (createVideoClear) createVideoClear.style.display = "";
        if (createVideoBtn) createVideoBtn.style.display = "none";
      };
    }

    if (createVideoClear) {
      createVideoClear.onclick = function () {
        clearCreateVideo();
      };
    }

    if (createClose) {
      createClose.onclick = function () {
        clearCreateImage();
        clearCreateVideo();
        closeOverlay("minCreatePostOverlay");
      };
    }

    if (createPublish) {
      createPublish.onclick = function () {
        if (!requireAuthForAction()) return;
        if (!getPostingUsername()) {
          alert("Add a username in Personal info before posting.");
          closeOverlay("minCreatePostOverlay");
          navigate("#profile");
          return;
        }
        if (!window.MIN_CONTENT || !window.MIN_CONTENT.createPost) {
          alert("Posts are not connected yet. Check Firebase setup.");
          return;
        }
        var titleEl = $("#minCreateTitle");
        var bodyEl = $("#minCreateBody");
        var headline = titleEl && titleEl.value;
        var body = bodyEl && bodyEl.value;

        createPublish.disabled = true;
        createPublish.textContent = "Posting…";

        var publishPromise;
        if (pendingCreateVideoFile) {
          if (!window.MIN_MUX || !window.MIN_MUX.uploadVideoForPost) {
            alert("Mux video upload is not configured yet.");
            createPublish.disabled = false;
            createPublish.textContent = "Post";
            return;
          }
          publishPromise = window.MIN_MUX
            .uploadVideoForPost(pendingCreateVideoFile, headline || body || "Minorities video", function (
              loaded,
              total,
              phase,
            ) {
              if (phase === "uploading" && total) {
                var pct = Math.round((loaded / total) * 100);
                setCreateVideoProgress("Uploading video… " + pct + "%");
                createPublish.textContent = "Uploading… " + pct + "%";
              } else if (phase === "processing") {
                setCreateVideoProgress("Processing video…");
                createPublish.textContent = "Processing…";
              } else if (phase === "ready") {
                setCreateVideoProgress("Finishing post…");
              }
            })
            .then(function (muxResult) {
              return window.MIN_CONTENT.createPost({
                headline: headline,
                body: body,
                imageFile: pendingCreateImageFile,
                muxPlaybackId: muxResult.muxPlaybackId,
                muxAssetId: muxResult.muxAssetId,
                muxUploadId: muxResult.muxUploadId,
                videoProvider: muxResult.videoProvider,
                videoStatus: muxResult.videoStatus,
              });
            });
        } else {
          publishPromise = window.MIN_CONTENT.createPost({
            headline: headline,
            body: body,
            imageFile: pendingCreateImageFile,
          });
        }

        publishPromise
          .then(function (postId) {
            closeOverlay("minCreatePostOverlay");
            if (titleEl) titleEl.value = "";
            if (bodyEl) bodyEl.value = "";
            clearCreateImage();
            clearCreateVideo();
            navigate("#post/" + postId);
          })
          .catch(function (err) {
            alert(err && err.message ? err.message : "Could not create post.");
          })
          .finally(function () {
            createPublish.disabled = false;
            createPublish.textContent = "Post";
            setCreateVideoProgress("");
          });
      };
    }

    if (route.name === "posts") {
      var appRoot = $("#minApp");
      var fab = document.createElement("button");
      fab.className = "min-fab";
      fab.type = "button";
      fab.setAttribute("aria-label", "Create post");
      fab.textContent = "+";
      fab.onclick = function () {
        if (!requireAuthForAction()) return;
        openOverlay("minCreatePostOverlay");
      };
      (appRoot || document.body).appendChild(fab);
    }

    if (route.name === "post" && route.id && lastCommentsFetchId !== route.id && window.MIN_CONTENT) {
      lastCommentsFetchId = route.id;
      window.MIN_CONTENT.loadComments(route.id).then(function () {
        render();
      });
    }

    var joinClass = $("#minJoinClass");
    if (joinClass)
      joinClass.onclick = function () {
        if (!hasTrainingAccess()) {
          navigate("#subscribe");
          return;
        }
        learnInClass = true;
        render();
      };

    if (route.name === "subscribe") {
      document.querySelectorAll(".min-tier-card[data-tier]").forEach(function (card) {
        function pickCard() {
          subscribePreviewId = card.getAttribute("data-tier");
          applySubscribeSelection();
        }

        card.onclick = function (e) {
          if (e.target.closest(".min-tier-select")) return;
          pickCard();
        };

        card.onkeydown = function (e) {
          if (e.target.closest(".min-tier-select")) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pickCard();
          }
        };
      });

      document.querySelectorAll(".min-tier-select").forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          var t = btn.getAttribute("data-tier");
          if (btn.disabled || btn.getAttribute("aria-disabled") === "true") return;
          subscribePreviewId = t;
          applySubscribeSelection();
          if (!requireAuthForAction()) return;
          if (!window.MIN_AUTH || !window.MIN_AUTH.selectSubscriptionPlan) return;
          btn.disabled = true;
          var previousText = btn.textContent;
          btn.textContent = "Saving…";
          window.MIN_AUTH
            .selectSubscriptionPlan(t)
            .then(function () {
              if (window.MIN_PUSH && window.MIN_PUSH.refreshPushTokenTier) {
                return window.MIN_PUSH.refreshPushTokenTier().catch(function () {
                  return null;
                });
              }
              return null;
            })
            .then(function () {
              subscribePreviewId = t;
              applySubscribeSelection();
            })
            .catch(function (err) {
              alert(err && err.message ? err.message : "Could not save plan.");
              btn.disabled = false;
              btn.textContent = previousText;
            });
        };
      });
    }

    if (route.name === "admin") {
      var adminCardForm = $("#minAdminCardForm");
      if (adminCardForm) {
        adminCardForm.onsubmit = function (e) {
          e.preventDefault();
          if (!window.MIN_CONTENT || !window.MIN_CONTENT.createContentCard) return;
          var submitBtn = $("#minAdminCardSubmit");
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Publishing…";
          }
          window.MIN_CONTENT
            .createContentCard({
              title: $("#minAdminCardTitle") && $("#minAdminCardTitle").value,
              image: $("#minAdminCardImage") && $("#minAdminCardImage").value,
              video: $("#minAdminCardVideo") && $("#minAdminCardVideo").value,
              author: $("#minAdminCardAuthor") && $("#minAdminCardAuthor").value,
              access: $("#minAdminCardAccess") && $("#minAdminCardAccess").value,
            })
            .then(function () {
              adminCardForm.reset();
              if ($("#minAdminCardAuthor")) $("#minAdminCardAuthor").value = "The Minorities";
              render();
            })
            .catch(function (err) {
              alert(err && err.message ? err.message : "Could not publish card.");
            })
            .finally(function () {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Publish card";
              }
            });
        };
      }

      document.querySelectorAll(".min-admin-delete-card").forEach(function (btn) {
        btn.onclick = function () {
          var cardId = btn.getAttribute("data-card-id");
          if (!cardId || !window.MIN_CONTENT || !window.MIN_CONTENT.deleteContentCard) return;
          if (!confirm("Remove this content card?")) return;
          btn.disabled = true;
          window.MIN_CONTENT
            .deleteContentCard(cardId)
            .then(function () {
              render();
            })
            .catch(function (err) {
              alert(err && err.message ? err.message : "Could not remove card.");
              btn.disabled = false;
            });
        };
      });

      document.querySelectorAll(".min-admin-delete-post").forEach(function (btn) {
        btn.onclick = function () {
          var postId = btn.getAttribute("data-post-id");
          if (!postId || !window.MIN_CONTENT || !window.MIN_CONTENT.deletePost) return;
          if (!confirm("Delete this post?")) return;
          btn.disabled = true;
          window.MIN_CONTENT
            .deletePost(postId)
            .then(function () {
              render();
            })
            .catch(function (err) {
              alert(err && err.message ? err.message : "Could not delete post.");
              btn.disabled = false;
            });
        };
      });

      var adminRoleForm = $("#minAdminRoleForm");
      if (adminRoleForm) {
        adminRoleForm.onsubmit = function (e) {
          e.preventDefault();
          if (!window.MIN_AUTH || !window.MIN_AUTH.assignTeamRole) return;
          var submitBtn = $("#minAdminRoleSubmit");
          var uid = $("#minAdminRoleUid") && $("#minAdminRoleUid").value;
          var teamRole = $("#minAdminRoleSelect") && $("#minAdminRoleSelect").value;
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Saving…";
          }
          window.MIN_AUTH
            .assignTeamRole(uid, teamRole)
            .then(function () {
              alert("Team role updated.");
              if ($("#minAdminRoleUid")) $("#minAdminRoleUid").value = "";
            })
            .catch(function (err) {
              alert(err && err.message ? err.message : "Could not save role.");
            })
            .finally(function () {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Save role";
              }
            });
        };
      }
    }

    document.querySelectorAll('[data-action="logout"]').forEach(function (el) {
      el.onclick = function (e) {
        e.preventDefault();
        if (!window.MIN_AUTH || !window.MIN_AUTH.logoutAccount) return;
        window.MIN_AUTH.logoutAccount().then(function () {
          closeAllOverlays();
          window.location.replace("minoritiesLanding.html");
        });
      };
    });

    document.querySelectorAll('[data-action="toggle-notify"]').forEach(function (el) {
      el.onclick = function (e) {
        e.preventDefault();
        if (!window.MIN_NOTIFY || !window.MIN_NOTIFY.requestNotificationPermission) return;
        if (!window.MIN_NOTIFY.isNotificationSupported || !window.MIN_NOTIFY.isNotificationSupported()) {
          alert("Notifications are not supported in this browser.");
          return;
        }
        window.MIN_NOTIFY
          .requestNotificationPermission()
          .then(function (result) {
            if (result === "granted") {
              var iosHint =
                window.MIN_PUSH &&
                window.MIN_PUSH.isIosDevice &&
                window.MIN_PUSH.isIosDevice() &&
                window.MIN_PUSH.isStandalonePwa &&
                !window.MIN_PUSH.isStandalonePwa()
                  ? " On iPhone: Share → Add to Home Screen, then open that app and enable notifications again."
                  : "";
              var pushNote =
                window.MIN_PUSH && window.MIN_PUSH.isPushConfigured && window.MIN_PUSH.isPushConfigured()
                  ? " Alerts work when the app is closed (iPhone: use the Home Screen icon, not Safari)." + iosHint
                  : " Add your FCM VAPID key in minFirebaseConfig.js for push when the app is closed.";
              alert("Notifications enabled." + pushNote);
              if (window.MIN_NOTIFY.resetNotificationSnapshot) {
                window.MIN_NOTIFY.resetNotificationSnapshot();
              }
            } else if (result === "denied") {
              alert("Notifications are blocked. Enable them in your browser settings to receive alerts.");
            }
            closeAllOverlays();
            render();
          })
          .catch(function (err) {
            alert(err && err.message ? err.message : "Could not enable push notifications.");
            closeAllOverlays();
            render();
          });
      };
    });

    var loginForm = $("#minLoginForm");
    if (loginForm) {
      loginForm.onsubmit = function (e) {
        e.preventDefault();
        var email = $("#minLoginEmail") && $("#minLoginEmail").value;
        var password = $("#minLoginPassword") && $("#minLoginPassword").value;
        var submitBtn = $("#minLoginSubmit");
        if (!window.MIN_AUTH || !window.MIN_AUTH.loginAccount) {
          alert("Sign-in is still loading. Wait a moment and try again.");
          return;
        }
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Signing in…";
        }
        var authReady = window.MIN_AUTH.waitForAuthReady
          ? window.MIN_AUTH.waitForAuthReady()
          : Promise.resolve();
        authReady
          .then(function () {
            return window.MIN_AUTH.loginAccount(email, password);
          })
          .catch(function (err) {
            alert(err && err.message ? err.message : "Sign in failed.");
          })
          .finally(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = "Sign in";
            }
          });
      };
      var forgotBtn = $("#minForgotPassword");
      if (forgotBtn) {
        forgotBtn.onclick = function () {
          var email = $("#minLoginEmail") && $("#minLoginEmail").value;
          if (!window.MIN_AUTH || !window.MIN_AUTH.resetPassword) return;
          window.MIN_AUTH
            .resetPassword(email)
            .then(function () {
              alert("Check your email for a password reset link.");
            })
            .catch(function (err) {
              alert(err && err.message ? err.message : "Could not send reset email.");
            });
        };
      }
    }

    var regForm = $("#minRegisterForm");
    if (regForm) {
      var pendingRegisterAvatarFile = null;
      regForm.onsubmit = function (e) {
        e.preventDefault();
        if (!window.MIN_AUTH || !window.MIN_AUTH.registerAccount) {
          alert("Registration is still loading. Wait a moment and try again.");
          return;
        }
        var submitBtn = $("#minRegisterSubmit");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Creating account…";
        }
        var authReady = window.MIN_AUTH.waitForAuthReady
          ? window.MIN_AUTH.waitForAuthReady()
          : Promise.resolve();
        authReady
          .then(function () {
            return window.MIN_AUTH.registerAccount({
              displayName: $("#minName") && $("#minName").value,
              username: $("#minUsername") && $("#minUsername").value,
              bio: $("#minBio") && $("#minBio").value,
              email: $("#minEmail") && $("#minEmail").value,
              password: $("#minPassword") && $("#minPassword").value,
              avatarFile: pendingRegisterAvatarFile,
            });
          })
          .then(function () {
            pendingRegisterAvatarFile = null;
            navigate("#home");
          })
          .catch(function (err) {
            alert(err && err.message ? err.message : "Registration failed.");
          })
          .finally(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = "Create account";
            }
          });
      };
      var avatarBtn = $("#minAvatarBtn");
      var avatarInput = $("#minAvatarInput");
      if (avatarBtn && avatarInput) {
        avatarBtn.onclick = function () {
          avatarInput.click();
        };
        avatarInput.onchange = function (ev) {
          var file = ev.target.files[0];
          handleAvatarFileSelect(
            file,
            avatarInput,
            $("#minAvatarPreview"),
            function (readyFile) {
              pendingRegisterAvatarFile = readyFile;
            },
            avatarBtn,
          );
        };
      }
    }

    var profileForm = $("#minProfileForm");
    if (profileForm) {
      var profile = getProfile();
      var nameInput = $("#minProfileName");
      var usernameInput = $("#minProfileUsername");
      var bioInput = $("#minProfileBio");
      if (nameInput) nameInput.value = profile.displayName || "";
      if (usernameInput) usernameInput.value = profile.username || "";
      if (bioInput) bioInput.value = profile.bio || "";

      var pendingAvatarFile = null;
      var profileAvatarBtn = $("#minProfileAvatarBtn");
      var profileAvatarInput = $("#minProfileAvatarInput");
      if (profileAvatarBtn && profileAvatarInput) {
        profileAvatarBtn.onclick = function () {
          profileAvatarInput.click();
        };
        profileAvatarInput.onchange = function (ev) {
          var file = ev.target.files[0];
          handleAvatarFileSelect(
            file,
            profileAvatarInput,
            $("#minProfileAvatarPreview"),
            function (readyFile) {
              pendingAvatarFile = readyFile;
            },
            profileAvatarBtn,
          );
        };
      }

      profileForm.onsubmit = function (e) {
        e.preventDefault();
        if (!window.MIN_AUTH || !window.MIN_AUTH.updateProfile) {
          alert("Profile editing is still loading. Wait a moment and try again.");
          return;
        }
        var submitBtn = $("#minProfileSubmit");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Saving…";
        }
        window.MIN_AUTH
          .updateProfile({
            displayName: nameInput && nameInput.value,
            username: usernameInput && usernameInput.value,
            bio: bioInput && bioInput.value,
            avatarFile: pendingAvatarFile,
          })
          .then(function () {
            pendingAvatarFile = null;
            alert("Profile updated.");
            navigate("#home");
          })
          .catch(function (err) {
            alert(err && err.message ? err.message : "Could not update profile.");
          })
          .finally(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = "Save changes";
            }
          });
      };
    }

    var commentsHandle = $("#minCommentsHandle");
    var commentsPreview = $("#minCommentsPreview");
    var commentsSheet = $("#minCommentsSheet");
    function setCommentsExpanded(expanded) {
      if (!commentsSheet) return;
      commentsSheet.classList.toggle("is-expanded", expanded);
      if (commentsPreview) {
        commentsPreview.textContent = expanded
          ? "Tap to close comments"
          : "Tap to open comments";
      }
      if (commentsHandle) {
        commentsHandle.setAttribute(
          "aria-label",
          expanded ? "Collapse comments" : "Expand comments"
        );
      }
    }
    function toggleComments() {
      var willExpand = !(
        commentsSheet && commentsSheet.classList.contains("is-expanded")
      );
      setCommentsExpanded(willExpand);
      if (route.name === "post" && route.id) {
        var hash = willExpand
          ? "#post/" + route.id + "/comments"
          : "#post/" + route.id;
        if (location.hash !== hash) {
          history.replaceState({}, "", location.pathname + hash);
        }
      }
    }
    if (commentsHandle) commentsHandle.onclick = toggleComments;
    if (commentsPreview) commentsPreview.onclick = toggleComments;

    document.querySelectorAll("[data-open-comments]").forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var postId = btn.getAttribute("data-open-comments");
        if (postId) navigate("#post/" + postId + "/comments");
      };
    });

    document.querySelectorAll("[data-expand-comments]").forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        setCommentsExpanded(true);
        if (route.name === "post" && route.id && !route.openComments) {
          history.replaceState({}, "", location.pathname + "#post/" + route.id + "/comments");
        }
      };
    });

    if (route.openComments) {
      setCommentsExpanded(true);
    }

    var deletePostBtn = $("#minDeletePostBtn");
    if (deletePostBtn) {
      deletePostBtn.onclick = function () {
        if (!requireAuthForAction()) return;
        if (!window.MIN_CONTENT || !window.MIN_CONTENT.deletePost) return;
        if (!route.id) return;
        if (!confirm("Delete this post? This cannot be undone.")) return;
        deletePostBtn.disabled = true;
        deletePostBtn.textContent = "Deleting…";
        window.MIN_CONTENT
          .deletePost(route.id)
          .then(function () {
            navigate("#posts");
          })
          .catch(function (err) {
            alert(err && err.message ? err.message : "Could not delete post.");
          })
          .finally(function () {
            deletePostBtn.disabled = false;
            deletePostBtn.textContent = "Delete post";
          });
      };
    }

    var commentPublish = $("#minCommentPublish");
    var commentInput = $("#minCommentInput");
    var commentsPanel = $("#minCommentsPanel");
    function publishComment() {
      if (!commentInput || !commentsPanel || !commentInput.value.trim()) return;
      if (!requireAuthForAction()) return;
      if (!hasCommentAccess()) {
        alert("Bench Player or above is required to comment.");
        navigate("#subscribe");
        return;
      }
      var text = commentInput.value.trim();
      var postId = route.name === "post" ? route.id : null;

      function appendLocalRow() {
        var row = document.createElement("div");
        row.className = "min-comment";
        row.innerHTML =
          '<img src="' +
          A +
          'person.svg" alt=""><div><p class="min-comment-meta">' +
          esc(getDisplayName()) +
          '</p><p style="margin:0">' +
          esc(text) +
          "</p></div>";
        commentsPanel.appendChild(row);
        commentInput.value = "";
        commentsPanel.scrollTop = commentsPanel.scrollHeight;
      }

      if (postId && window.MIN_CONTENT && window.MIN_CONTENT.publishComment) {
        window.MIN_CONTENT
          .publishComment(postId, text)
          .then(function () {
            commentInput.value = "";
            render();
          })
          .catch(function (err) {
            alert(err && err.message ? err.message : "Could not post comment.");
          });
        return;
      }

      appendLocalRow();
    }
    if (commentPublish) commentPublish.onclick = publishComment;
    if (commentInput) {
      commentInput.onkeydown = function (e) {
        if (e.key === "Enter") publishComment();
      };
    }

    var chatSend = $("#minChatSend");
    if (chatSend) {
      chatSend.onclick = sendChatMessage;
      var chatInput = $("#minChatInput");
      if (chatInput) {
        chatInput.onkeydown = function (e) {
          if (e.key === "Enter") sendChatMessage();
        };
      }
    }

    var messages = $("#minMessages");
    if (messages) messages.scrollTop = messages.scrollHeight;

    wirePostLikeButtons();
    refreshVisiblePostLikes(route);
  }

  function sendChatMessage() {
    var input = $("#minChatInput");
    if (!input || !input.value.trim()) return;
    if (!requireAuthForAction()) return;

    var roomId = activeThreadId || parseRoute().id;
    var text = input.value.trim();

    if (window.MIN_CHAT && window.MIN_CHAT.sendMessage && roomId) {
      window.MIN_CHAT
        .sendMessage(roomId, text)
        .then(function () {
          input.value = "";
        })
        .catch(function (err) {
          alert(err && err.message ? err.message : "Could not send message.");
        });
      return;
    }

    var messages = $("#minMessages");
    if (!messages) return;
    var row = document.createElement("div");
    row.className = "min-msg-row is-mine";
    row.innerHTML =
      '<div class="min-bubble min-bubble--mine">' +
      esc(text) +
      '</div><img src="' +
      A +
      'person.svg" alt="">';
    messages.appendChild(row);
    input.value = "";
    messages.scrollTop = messages.scrollHeight;
  }

  function syncLiveListeners(route) {
    if (window.MIN_CONTENT) {
      if (route.name === "post" && route.id && window.MIN_CONTENT.watchComments) {
        window.MIN_CONTENT.watchComments(route.id);
      } else if (window.MIN_CONTENT.stopWatchingComments) {
        window.MIN_CONTENT.stopWatchingComments();
      }
    }

    if (window.MIN_CHAT) {
      if (route.name === "thread" && route.id) {
        activeThreadId = route.id;
        if (window.MIN_CHAT.watchRoom) window.MIN_CHAT.watchRoom(route.id);
      } else {
        activeThreadId = null;
        if (window.MIN_CHAT.stopWatchingRoom) window.MIN_CHAT.stopWatchingRoom();
      }
    }

    if (window.MIN_NOTIFY && window.MIN_NOTIFY.setNotificationRoute) {
      window.MIN_NOTIFY.setNotificationRoute({ name: route.name, id: route.id });
    }
  }

  function handleLiveDataUpdate() {
    var route = parseRoute();
    if (window.MIN_NOTIFY && window.MIN_NOTIFY.checkForUpdates) {
      window.MIN_NOTIFY.checkForUpdates();
    }
    if (
      route.name === "register" ||
      route.name === "login" ||
      route.name === "profile" ||
      route.name === "subscribe"
    ) {
      return;
    }
    render();
  }

  function wireMinAuthListeners() {
    if (wireMinAuthListeners.done || !window.MIN_AUTH || !window.MIN_AUTH.onMinAuthChange) return;
    wireMinAuthListeners.done = true;

    window.MIN_AUTH.onMinAuthChange(function (user) {
      var hash = location.hash || "#register";
      if (
        !user &&
        isAuthReady() &&
        hash !== "#register" &&
        hash !== "#login"
      ) {
        window.location.replace("minoritiesLanding.html");
        return;
      } else if (
        user &&
        isAuthRoute(parseRoute().name) &&
        !(window.MIN_AUTH.isRegistering && window.MIN_AUTH.isRegistering())
      ) {
        navigate("#home");
      }

      if (user && window.MIN_NOTIFY && window.MIN_NOTIFY.resetNotificationSnapshot) {
        window.MIN_NOTIFY.resetNotificationSnapshot();
      }

      if (window.MIN_CHAT) {
        if (user && window.MIN_CHAT.startChatListeners) {
          window.MIN_CHAT.startChatListeners();
        } else if (window.MIN_CHAT.stopChatListeners) {
          window.MIN_CHAT.stopChatListeners();
        }
      }

      render();
    });
  }

  function wireContentListeners() {
    if (wireContentListeners.done) return;
    if (!window.MIN_CONTENT || !window.MIN_CONTENT.onMinContentChange) return;
    wireContentListeners.done = true;

    window.MIN_CONTENT.onMinContentChange(function () {
      handleLiveDataUpdate();
    });

    if (window.MIN_CHAT && window.MIN_CHAT.onMinChatChange) {
      window.MIN_CHAT.onMinChatChange(function () {
        handleLiveDataUpdate();
      });
    }
  }

  window.__minOnBootstrapReady = function () {
    loadPostsFilter();
    wireMinAuthListeners();
    wireContentListeners();
    if (window.MIN_AUTH && window.MIN_AUTH.isSignedIn && window.MIN_AUTH.isSignedIn()) {
      if (window.MIN_CHAT && window.MIN_CHAT.startChatListeners) {
        window.MIN_CHAT.startChatListeners();
      }
    }
    render();
  };

  window.addEventListener("hashchange", function () {
    var route = parseRoute();
    if (route.name !== "learn") learnInClass = false;
    if (route.name !== "post") lastCommentsFetchId = null;
    render();
  });

  function startApp() {
    loadPostsFilter();
    if (!location.hash || location.hash === "#") {
      location.hash = "#register";
    }

    render();
    wireContentListeners();

    if (!window.MIN_AUTH) {
      var attempts = 0;
      var bootstrapPoll = setInterval(function () {
        attempts += 1;
        if (window.MIN_AUTH) {
          clearInterval(bootstrapPoll);
          window.__minOnBootstrapReady();
        } else if (attempts > 200) {
          clearInterval(bootstrapPoll);
        }
      }, 50);
    }
  }

  function renderAuthLoading(message) {
    var app = $("#minApp");
    if (app) {
      app.classList.add("is-sub");
      app.classList.remove("is-locked");
    }
    var header = $("#minHeader");
    if (header) {
      header.className = "min-header min-header--sub";
      header.innerHTML =
        '<div class="min-header-inner"><p class="min-header-title">The Minorities</p></div>';
    }
    var main = $("#minMain");
    if (main) {
      main.classList.remove("has-comments-sheet");
      main.innerHTML =
        '<p class="min-auth-hint" style="text-align:center;margin-top:48px">' +
        esc(message || "Loading…") +
        "</p>";
    }
    var bar = $("#minTabbar");
    if (bar) {
      bar.innerHTML = "";
      bar.style.display = "none";
    }
    var overlays = $("#minOverlays");
    if (overlays) overlays.innerHTML = "";
    document.title = "The Minorities";
  }

  function render() {
    var parsedRoute = parseRoute();

    if (!isAuthReady() && !isAuthRoute(parsedRoute.name) && !isPublicRoute(parsedRoute.name)) {
      renderAuthLoading("Loading your account…");
      return;
    }

    var route = isAuthRoute(parsedRoute.name)
      ? parsedRoute
      : isAuthReady()
        ? enforceRouteAccess(parsedRoute)
        : parsedRoute;

    var app = $("#minApp");
    var isLocked = route.name === "thread" || (route.name === "learn" && learnInClass);
    if (app) {
      app.classList.toggle("is-sub", route.isSub);
      app.classList.toggle("is-locked", isLocked);
    }

    document.querySelectorAll(".min-fab").forEach(function (f) {
      f.remove();
    });

    renderHeader(route);
    renderTabbar(route);

    var main = $("#minMain");
    if (main) {
      main.classList.toggle("has-comments-sheet", route.name === "post");
      main.innerHTML = renderMain(route);
    }

    var overlays = $("#minOverlays");
    if (overlays) overlays.innerHTML = renderOverlays();

    bindEvents(route);
    syncLiveListeners(route);
    document.title =
      route.isSub && route.name === "thread"
        ? "Chat — The Minorities"
        : "The Minorities";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
  } else {
    startApp();
  }
})();
