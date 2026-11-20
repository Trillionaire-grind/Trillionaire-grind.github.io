(function () {
  var CATALOG = window.PRINCES_CATALOG;
  var STORE = window.PRINCES_STORE;
  var AUTH = window.PRINCES_AUTH;
  var STRIPE = window.PRINCES_STRIPE || {};

  var headerEl = document.getElementById("prHeader");
  var mainEl = document.getElementById("prMain");
  var tabEl = document.getElementById("prTabbar");

  var learnTab = "classes";
  var calCursor = new Date();
  var selectedDay = null;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function route() {
    return (location.hash || "#learn").replace("#", "");
  }

  function go(hash) {
    var next = String(hash || "").replace(/^#/, "");
    if (route() === next) {
      window.scrollTo(0, 0);
      return;
    }
    location.hash = next;
  }

  var lastPath = null;
  var pendingDeleteId = null;
  var pendingDeleteLeave = false;
  var pendingJoinEventId = null;
  var composeModal = document.getElementById("prComposeModal");
  var confirmModal = document.getElementById("prConfirmModal");
  var joinModal = document.getElementById("prJoinModal");

  function openModal(el) {
    if (!el) return;
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
  }

  function closeModal(el) {
    if (!el) return;
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
  }

  function closeAppModals() {
    closeModal(composeModal);
    closeModal(confirmModal);
    closeModal(joinModal);
    pendingDeleteId = null;
    pendingDeleteLeave = false;
    pendingJoinEventId = null;
  }

  function scrollPageTop() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  var FAT_LOSS_APP = (CATALOG && CATALOG.fatLossApp) || "fatLossViews/app.html";

  function fatLossHref() {
    var base = FAT_LOSS_APP;
    if (base.indexOf("from=princes") >= 0) return base;
    return base + (base.indexOf("?") >= 0 ? "&" : "?") + "from=princes";
  }

  function topicColor(topic) {
    return (CATALOG.topics[topic] && CATALOG.topics[topic].color) || "#C9A227";
  }

  function topicLabel(topic) {
    return (CATALOG.topics[topic] && CATALOG.topics[topic].label) || topic;
  }

  function testRanks() {
    return (CATALOG.tiers || []).map(function (tier) {
      return { id: tier.id, label: tier.name };
    });
  }

  function entryTier() {
    return AUTH.entryTier ? AUTH.entryTier() : "ticket";
  }

  function memberTier() {
    return AUTH.memberTier ? AUTH.memberTier() : "private";
  }

  function applyOwnerTheme() {
    var colors = CATALOG.brandColors || {};
    var root = document.documentElement;
    if (colors.navy) root.style.setProperty("--pr-navy", colors.navy);
    if (colors.gold) root.style.setProperty("--pr-gold", colors.gold);
    if (colors.cream) root.style.setProperty("--pr-cream", colors.cream);
    var icon = document.querySelector('link[rel="icon"]');
    if (icon && (CATALOG.favicon || CATALOG.workingLogo)) {
      icon.href = CATALOG.favicon || CATALOG.workingLogo;
    }
    document.title = CATALOG.brand || "Network";
  }

  function claimPaidFromStripe() {
    if (!STRIPE.paidTierFromUrl) return false;
    var paid = STRIPE.paidTierFromUrl();
    if (!paid || !AUTH.currentUser()) return false;
    AUTH.grantTier(paid);
    if (STRIPE.clearPayQuery) STRIPE.clearPayQuery();
    return paid;
  }

  var TEST_ADMINS = [
    { id: "member", label: "Off" },
    { id: "leader", label: "Leader" },
    { id: "staff", label: "Staff" },
    { id: "owner", label: "Owner" },
  ];

  function requireUser() {
    var user = AUTH.currentUser();
    if (!user) {
      location.href = "princesLanding.html";
      return null;
    }
    return user;
  }

  function openFatLossApp() {
    window.location.href = fatLossHref();
  }

  function tierName(tierId) {
    var tier = (CATALOG.tiers || []).find(function (item) { return item.id === tierId; });
    return tier ? tier.name : (tierId || "Recruit");
  }

  function articleFromHeadline(title, fallback) {
    var key = String(title || "").trim().toLowerCase();
    var articles = {
      "the 10% law": "Every man in this court starts at 10% body fat. That is the first law. Soft where a prince should be hard is how a unit dies in public.\n\nYou already know the number. The scale talks. The waist talks. The shirt talks when you sit down. 10% is the line where the sweater becomes optional.\n\nThis is not a hobby cut. This is the door. Finish the fat course. Hit the number. Then the rest of the climb can start.\n\nPost your waist. Come to class. The law does not move for mood.",
      "fix the prince in the mirror first": "If you do not like the man in the mirror, change him first. A weak prince trains a weak unit.\n\nThe room will copy the body you walk in with. Get to 10% body fat. Take the shirt test in private. Then take it in public.\n\nThe course is open. The ledger is waiting. Start today.",
      "private is open": "Recruits who finish the fat course can step into Private. Classes, posts, and chat start there.\n\nPrivate is the unit. You show up. You post the number. You sit in class.\n\nThe $1 ticket opened the course. Private opens the men.",
      "the $1 law": "Pay the dollar. Open the fat course. That is the first order a recruit gives himself.\n\nThe dollar is not for us. It is for you. A man who will not invest one dollar will not invest the sweat.\n\nTake the ticket. Start the course. Come back with a number.",
      "shirt off friday": "Waist is posted. Shirt comes off at the pool this weekend. No sweater. No story.\n\nIf the number is not there yet, stay on the course and take the next Friday. The date is a promise, not a costume.",
      "stopped tugging the shirt": "Three weeks in. The gut is leaving. The shirt stays tucked.\n\nThat tug was a tell. When it stops, the room reads you differently. Keep the protein. Keep the walk. Keep the law.",
      "specialist tape: protein week": "Every course is open at Specialist. This tape is the protein week recap.\n\nHit the grams. Sleep. Walk. The specialist room is for men who already keep a number.",
      "squad check": "Eight men posted numbers. Two missed. They hear about it on the call.\n\nA squad of nine holds the line. Sergeant is the room where other men become your job.",
      "colonel call is live": "Month-long room with the Princes. Two paths: take a seat or raise your own command.\n\nColonel is the last rank before the table. Show up with a clean waist and a real offer.",
      "prince's court notes": "The small table. Seats are few. This post stays locked until you are on the court.\n\nA chair opens when a man leaves. You do not add a tenth seat. You take the one that is empty.",
    };
    if (articles[key]) return articles[key];
    var lead = fallback || title;
    return String(title || "Post") + ".\n\n" + String(lead) + "\n\nRead it again. Then do the work today. The unit will see the result, not the speech.";
  }

  function postTeaser(post) {
    var text = String(post.body || articleFromHeadline(post.title, "")).replace(/\s+/g, " ").trim();
    if (text.length <= 140) return text;
    return text.slice(0, 137) + "...";
  }

  function postParagraphs(text) {
    return String(text || "").split(/\n\n+/).map(function (part) {
      return "<p>" + esc(part.replace(/\n/g, " ")) + "</p>";
    }).join("");
  }

  function icon(name) {
    var paths = {
      home: '<path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z"/>',
      learn: '<path d="M3 8.5 12 4l9 4.5-9 4.5L3 8.5zm0 4.5 9 4.5 9-4.5M3 17l9 4.5L21 17"/>',
      chat: '<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>',
      admin: '<path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-4zm-1 13-3.2-3.2 1.4-1.4L11 12.2l4.8-4.8 1.4 1.4L11 15z"/>',
    };
    return '<svg class="pr-tab-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">' + (paths[name] || "") + "</svg>";
  }

  function adminRoleLabel(role) {
    var row = TEST_ADMINS.find(function (item) { return item.id === role; });
    return row ? row.label : "Off";
  }

  function initials(name) {
    var parts = String(name || "P").trim().split(/\s+/).filter(Boolean);
    var letters = (parts[0] && parts[0].charAt(0)) || "P";
    if (parts[1]) letters += parts[1].charAt(0);
    return letters.toUpperCase();
  }

  function prettyLine(value, emptyText) {
    var text = String(value == null ? "" : value).trim();
    if (!text) return emptyText || "Not set";
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function renderHeader() {
    var user = AUTH.currentUser();
    var mode = STORE.getAppMode();
    var modeLabel = mode === "fix" ? "Fix" : mode === "test" ? "Testing" : "";
    var onProfile = route().split("/")[0] === "profile";
    var avatar =
      '<button type="button" class="pr-avatar-btn' + (onProfile ? " is-on" : "") + '" data-go="profile" aria-label="Profile">' +
      esc(initials(user && user.displayName)) +
      "</button>";
    var chip = "";
    if (modeLabel) {
      var rankId = (user && user.tier) || "ticket";
      var adminId = (user && user.teamRole) || "member";
      chip =
        '<div class="pr-test-wrap">' +
        '<button type="button" class="pr-badge pr-test-chip" id="prTestChip" aria-expanded="false" aria-haspopup="true">' +
        '<span class="pr-test-chip__mode">' + esc(modeLabel) + "</span>" +
        '<span class="pr-test-chip__row">Rank: ' + esc(tierName(rankId)) + "</span>" +
        '<span class="pr-test-chip__row">Admin: ' + esc(adminRoleLabel(adminId)) + "</span>" +
        "</button>" +
        '<div class="pr-test-menu" id="prTestMenu" hidden>' +
        '<p class="pr-test-menu__label">Rank</p>' +
        testRanks().map(function (item) {
          return '<button type="button" class="pr-test-menu__item' + (item.id === rankId ? " is-on" : "") + '" data-test-rank="' + esc(item.id) + '">' + esc(item.label) + "</button>";
        }).join("") +
        '<p class="pr-test-menu__label pr-test-menu__label--next">Admin</p>' +
        TEST_ADMINS.map(function (item) {
          return '<button type="button" class="pr-test-menu__item' + (item.id === adminId ? " is-on" : "") + '" data-test-admin="' + esc(item.id) + '">' + esc(item.label) + "</button>";
        }).join("") +
        "</div></div>";
    }
    headerEl.innerHTML =
      '<a class="pr-brand" href="#home"><img src="' + esc(STORE.getLogo()) + '" alt=""><span>' + esc(STORE.getBrandName()) + "</span></a>" +
      '<div class="pr-head-tools">' + chip + avatar + "</div>";
  }

  function bindHeader() {
    var chip = document.getElementById("prTestChip");
    var menu = document.getElementById("prTestMenu");
    if (!chip || !menu) return;
    chip.addEventListener("click", function (event) {
      event.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      chip.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.querySelectorAll("[data-test-rank]").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        AUTH.applyTestRank(btn.dataset.testRank);
        render();
      });
    });
    menu.querySelectorAll("[data-test-admin]").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        AUTH.applyTestAdmin(btn.dataset.testAdmin);
        if (!AUTH.isStaff() && route().split("/")[0] === "admin") {
          go("home");
          return;
        }
        render();
      });
    });
  }

  function renderTabs() {
    var current = route().split("/")[0];
    var tabs = [
      { id: "home", label: "Home", icon: "home" },
      { id: "learn", label: "Learn", icon: "learn" },
      { id: "chat", label: "Chat", icon: "chat" },
    ];
    if (AUTH.isStaff() && (STORE.getAppMode() === "fix" || STORE.isAdminOn())) {
      tabs.push({ id: "admin", label: "Admin", icon: "admin" });
    }
    tabEl.innerHTML = tabs.map(function (tab) {
      var on = current === tab.id || (tab.id === "home" && current === "post") || (tab.id === "learn" && (current === "course" || current === "upgrade")) || (tab.id === "chat" && current === "thread");
      return '<button type="button" data-go="' + tab.id + '"' + (on ? ' class="is-on"' : "") + ">" + icon(tab.icon) + "<span>" + tab.label + "</span></button>";
    }).join("");
  }

  function lockedCard(title) {
    return '<p class="pr-empty">' + esc(title) + " Private opens this. $14.97 a month.</p><button type=\"button\" class=\"pr-submit\" data-go=\"upgrade\">See the ranks</button>";
  }

  function bindDeleteButtons(leaveAfter) {
    mainEl.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        event.preventDefault();
        pendingDeleteId = btn.dataset.del;
        pendingDeleteLeave = !!leaveAfter;
        openModal(confirmModal);
      });
    });
  }

  function bindPersistentUi() {
    document.querySelectorAll("[data-pr-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        closeModal(el.closest(".pr-modal"));
        if (el.closest("#prConfirmModal")) {
          pendingDeleteId = null;
          pendingDeleteLeave = false;
        }
      });
    });
    var composeForm = document.getElementById("prNewPost");
    if (composeForm) {
      composeForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var user = AUTH.currentUser();
        if (!user || !AUTH.canCreatePost()) return;
        var data = new FormData(composeForm);
        var postsNow = STORE.getPosts();
        postsNow.unshift({
          id: STORE.uid(),
          author: user.displayName,
          authorId: user.id,
          role: user.teamRole,
          title: data.get("title"),
          body: data.get("body"),
          access: "private",
          createdAt: STORE.nowIso(),
        });
        STORE.savePosts(postsNow);
        composeForm.reset();
        closeModal(composeModal);
        go("home");
        render();
        scrollPageTop();
      });
    }
    var joinAction = document.getElementById("prJoinAction");
    if (joinAction) {
      joinAction.addEventListener("click", function () {
        var event = STORE.getEvents().find(function (item) { return item.id === pendingJoinEventId; });
        var user = AUTH.currentUser();
        var errorEl = document.getElementById("prJoinError");
        if (!event || !user) return;
        if (STORE.hasEventRsvp(event.id, user.id)) {
          if (eventJoinUrl(event)) openZoom(eventJoinUrl(event));
          closeModal(joinModal);
          return;
        }
        var state = eventSeatState(event);
        if (!state.unlimited && state.left <= 0) {
          if (errorEl) errorEl.textContent = "No seats left.";
          return;
        }
        STORE.addEventRsvp(event.id, user.id);
        if (eventJoinUrl(event)) openZoom(eventJoinUrl(event));
        closeModal(joinModal);
        pendingJoinEventId = null;
        render();
      });
    }
    var confirmBtn = document.getElementById("prConfirmDelete");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        if (!pendingDeleteId) {
          closeModal(confirmModal);
          return;
        }
        var id = pendingDeleteId;
        var leave = pendingDeleteLeave;
        pendingDeleteId = null;
        pendingDeleteLeave = false;
        STORE.savePosts(STORE.getPosts().filter(function (post) { return post.id !== id; }));
        closeModal(confirmModal);
        if (leave) go("home");
        else render();
      });
    }
  }

  function renderHome() {
    var user = AUTH.currentUser();
    var posts = STORE.feedPosts(user.id);
    var compose = AUTH.canCreatePost()
      ? '<button type="button" class="pr-compose-launch" id="prOpenCompose">Write something</button>'
      : "";
    mainEl.innerHTML = '<h1 class="pr-section-title">Home</h1>' + compose + posts.map(function (post) {
      var access = post.access || "private";
      var locked = !AUTH.hasTier(access);
      var pinned = isPinnedForUser(post, user);
      if (locked) {
        return '<article class="pr-course pr-locked' + (pinned ? " pr-post--pinned" : "") + '" data-go="upgrade">' +
          pinBar(post, user) +
          (post.image ? '<img src="' + esc(post.image) + '" alt="">' : '<div class="pr-lock-ph"></div>') +
          '<div class="pr-lock-badge">🔒 ' + esc(access) + "</div>" +
          '<div class="pr-course-body"><h3>' + esc(post.title) + "</h3><p>Upgrade to open this.</p></div></article>";
      }
      var like = STORE.likeState(post.id, user.id);
      var comments = STORE.commentsFor(post.id);
      var actions = "";
      if (AUTH.canEditOwnPost(post)) actions += '<button type="button" class="pr-tiny" data-edit="' + esc(post.id) + '">Edit</button>';
      if (AUTH.canDeletePost(post)) actions += '<button type="button" class="pr-tiny" data-del="' + esc(post.id) + '">Remove</button>';
      return '<article class="pr-post pr-post--link' + (pinned ? " pr-post--pinned" : "") + '" data-go="post/' + esc(post.id) + '" id="post-' + esc(post.id) + '">' +
        pinBar(post, user) +
        "<header><strong>" + esc(post.author) + '</strong><span class="pr-badge pr-badge--' + esc(post.role || "member") + '">' + esc(post.role || "member") + "</span></header>" +
        (post.image ? '<img class="pr-post-img" src="' + esc(post.image) + '" alt="">' : "") +
        "<h3>" + esc(post.title) + "</h3><p>" + esc(postTeaser(post)) + "</p>" +
        '<div class="pr-social">' +
        '<button type="button" class="pr-like pr-like--' + like.kind + '" data-like="' + esc(post.id) + '">Like · ' + STORE.likeCount(post.id) + "</button>" +
        '<button type="button" class="pr-tiny" data-go="post/' + esc(post.id) + '">Comments · ' + comments.length + "</button>" +
        "</div>" +
        (actions ? '<div class="pr-actions">' + actions + "</div>" : "") +
        "</article>";
    }).join("");

    var openCompose = document.getElementById("prOpenCompose");
    if (openCompose) {
      openCompose.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        openModal(composeModal);
        var titleInput = composeModal && composeModal.querySelector('input[name="title"]');
        if (titleInput) titleInput.focus();
      });
    }
    mainEl.querySelectorAll("[data-like]").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        event.preventDefault();
        STORE.addLike(btn.dataset.like, user.id);
        render();
      });
    });
    bindDeleteButtons(false);
    bindUnpin(user);
    mainEl.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        var postsNow = STORE.getPosts();
        var post = postsNow.find(function (item) { return item.id === btn.dataset.edit; });
        if (!post) return;
        var next = prompt("Edit the post", post.body);
        if (next == null) return;
        post.body = next;
        STORE.savePosts(postsNow);
        render();
      });
    });
  }

  function bindCommentForm(user) {
    mainEl.querySelectorAll("[data-comment]").forEach(function (formEl) {
      formEl.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = new FormData(formEl);
        STORE.addComment(formEl.dataset.comment, {
          id: STORE.uid(),
          author: user.displayName,
          authorId: user.id,
          body: data.get("body"),
          createdAt: STORE.nowIso(),
        });
        render();
      });
    });
  }

  function renderPost(id) {
    var user = AUTH.currentUser();
    var post = STORE.getPost(id);
    if (!post) {
      mainEl.innerHTML = '<p class="pr-empty">That post is gone.</p><button type="button" class="pr-submit" data-go="home">Back to Home</button>';
      return;
    }
    var access = post.access || "private";
    if (!AUTH.hasTier(access)) {
      mainEl.innerHTML = lockedCard("Upgrade to open this post.");
      return;
    }
    var like = STORE.likeState(post.id, user.id);
    var comments = STORE.commentsFor(post.id);
    var article = articleFromHeadline(post.title, post.body);
    var actions = "";
    if (AUTH.canEditOwnPost(post)) actions += '<button type="button" class="pr-tiny" data-edit="' + esc(post.id) + '">Edit</button>';
    if (AUTH.canDeletePost(post)) actions += '<button type="button" class="pr-tiny" data-del="' + esc(post.id) + '">Remove</button>';
    var pinned = isPinnedForUser(post, user);
    mainEl.innerHTML =
      '<article class="pr-post pr-post-page' + (pinned ? " pr-post--pinned" : "") + '">' +
      '<button type="button" class="pr-tiny" data-go="home">Back to Home</button>' +
      pinBar(post, user) +
      "<header><strong>" + esc(post.author) + '</strong><span class="pr-badge pr-badge--' + esc(post.role || "member") + '">' + esc(post.role || "member") + "</span></header>" +
      (post.image ? '<img class="pr-post-img" src="' + esc(post.image) + '" alt="">' : "") +
      "<h1>" + esc(post.title) + "</h1>" +
      postParagraphs(article) +
      '<div class="pr-social">' +
      '<button type="button" class="pr-like pr-like--' + like.kind + '" data-like="' + esc(post.id) + '">Like · ' + STORE.likeCount(post.id) + "</button>" +
      "<span class=\"pr-tiny\">Comments · " + comments.length + "</span>" +
      "</div>" +
      '<div class="pr-comments">' +
      (comments.length
        ? comments.map(function (item) {
          return '<p class="pr-comment"><strong>' + esc(item.author) + "</strong> " + esc(item.body) + "</p>";
        }).join("")
        : '<p class="pr-empty">No comments yet. Be the first.</p>') +
      '<form class="pr-comment-form" data-comment="' + esc(post.id) + '"><input name="body" placeholder="Add a comment" required><button type="submit">Send</button></form>' +
      "</div>" +
      (actions ? '<div class="pr-actions">' + actions + "</div>" : "") +
      "</article>";

    mainEl.querySelectorAll("[data-like]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        STORE.addLike(btn.dataset.like, user.id);
        render();
      });
    });
    bindCommentForm(user);
    bindDeleteButtons(true);
    bindUnpin(user);
    mainEl.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var postsNow = STORE.getPosts();
        var item = postsNow.find(function (row) { return row.id === btn.dataset.edit; });
        if (!item) return;
        var next = prompt("Edit the post", item.body);
        if (next == null) return;
        item.body = next;
        STORE.savePosts(postsNow);
        render();
      });
    });
  }

  function classZoomUrl(item) {
    return (item && item.zoomUrl) || (CATALOG && CATALOG.zoomUrl) || "https://zoom.us/join";
  }

  function canJoinClass() {
    return AUTH.hasTier(memberTier());
  }

  function canUnpinPinned() {
    return AUTH.hasTier(memberTier());
  }

  function isPinnedForUser(post, user) {
    if (!post || !post.pinned || !user) return false;
    return !STORE.isPostUnpinned(user.id, post.id);
  }

  function pinBar(post, user) {
    if (!isPinnedForUser(post, user)) return "";
    var unpin = canUnpinPinned()
      ? '<button type="button" class="pr-tiny" data-unpin="' + esc(post.id) + '">Unpin</button>'
      : "";
    return '<div class="pr-pin"><span class="pr-pin-badge">Pinned</span>' + unpin + "</div>";
  }

  function bindUnpin(user) {
    mainEl.querySelectorAll("[data-unpin]").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (!canUnpinPinned()) return;
        STORE.unpinPostForUser(user.id, btn.dataset.unpin);
        render();
      });
    });
  }

  function todayYmd() {
    var now = new Date();
    return ymd(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function openZoom(url) {
    window.open(classZoomUrl({ zoomUrl: url }), "_blank", "noopener,noreferrer");
  }

  function renderLearnClasses() {
    var today = todayYmd();
    var upcoming = (CATALOG.classes || []).filter(function (item) {
      return !item.date || item.date >= today;
    });
    var canJoin = canJoinClass();
    var classes = upcoming.length
      ? upcoming.map(function (item) {
        return '<button type="button" class="pr-class-mini" style="border-left-color:' + topicColor(item.topic) + '" ' +
          (canJoin
            ? 'data-zoom="' + esc(classZoomUrl(item)) + '"'
            : 'data-go="upgrade"') +
          "><p>" + esc(item.when) + "</p><h3>" + esc(item.title) + "</h3><p>" + esc(item.sub) + "</p>" +
          '<span class="pr-class-join">' + (canJoin ? "Join class" : "Private opens live class") + "</span></button>";
      }).join("")
      : '<p class="pr-empty">No upcoming classes on the board yet.</p>';
    var courses = CATALOG.courses.map(function (course) {
      var locked = !AUTH.hasTier(course.access);
      return '<article class="pr-course' + (locked ? " pr-locked" : "") + '" ' + (locked ? 'data-go="upgrade"' : 'data-open-url="' + esc(course.href || FAT_LOSS_APP) + '"') + '>' +
        (locked ? '<div class="pr-lock-badge">Private</div>' : "") +
        '<img src="' + esc(course.image) + '" alt="">' +
        '<div class="pr-course-body"><h3>' + esc(course.title) + "</h3><p>" + esc(course.meta) + "</p></div></article>";
    }).join("");
    mainEl.innerHTML =
      subTabs("classes") +
      '<h2 class="pr-section-title">Upcoming classes</h2>' +
      '<div class="pr-carousel">' + classes + "</div>" +
      '<h2 class="pr-section-title">Courses</h2>' +
      courses;
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function ymd(year, month, day) {
    return year + "-" + pad(month + 1) + "-" + pad(day);
  }

  function eventsOn(date) {
    return STORE.getEvents().filter(function (event) { return event.date === date; });
  }

  function eventHasJoin(event) {
    return !!(event && (event.joinType === "link" || event.joinType === "register"));
  }

  function eventJoinUrl(event) {
    return String((event && event.joinUrl) || "").trim();
  }

  function eventSeatState(event) {
    if (!event || event.unlimited || event.seats == null || event.seats === "") {
      return { unlimited: true, left: null, total: null };
    }
    var total = Number(event.seats) || 0;
    var taken = (Number(event.seatsTaken) || 0) + STORE.eventRsvpCount(event.id);
    return { unlimited: false, total: total, left: Math.max(0, total - taken) };
  }

  function seatsLabel(state) {
    if (!state || state.unlimited) return "Unlimited seats";
    if (state.left <= 0) return "No seats left";
    return state.left === 1 ? "1 seat left" : state.left + " seats left";
  }

  function addToCalendar(event) {
    var start = event.date.replace(/-/g, "") + "T" + (event.time || "12:00").replace(":", "") + "00";
    var details = event.sub || "";
    var joinUrl = eventJoinUrl(event);
    if (joinUrl) details += (details ? "\n" : "") + "Join: " + joinUrl;
    var url = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
      encodeURIComponent(event.title) +
      "&dates=" + start + "/" + start +
      "&details=" + encodeURIComponent(details);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openEventJoin(event) {
    if (!event || !eventHasJoin(event)) return;
    if (event.joinType === "link") {
      openZoom(eventJoinUrl(event) || classZoomUrl(event));
      return;
    }
    pendingJoinEventId = event.id;
    fillJoinModal(event);
    openModal(joinModal);
  }

  function fillJoinModal(event) {
    var user = AUTH.currentUser();
    var state = eventSeatState(event);
    var inAlready = user && STORE.hasEventRsvp(event.id, user.id);
    var titleEl = document.getElementById("prJoinTitle");
    var metaEl = document.getElementById("prJoinMeta");
    var seatsEl = document.getElementById("prJoinSeats");
    var errorEl = document.getElementById("prJoinError");
    var actionEl = document.getElementById("prJoinAction");
    if (titleEl) titleEl.textContent = event.title;
    if (metaEl) metaEl.textContent = topicLabel(event.topic) + " · " + (event.time || "");
    if (seatsEl) seatsEl.textContent = seatsLabel(state);
    if (errorEl) errorEl.textContent = "";
    if (!actionEl) return;
    if (inAlready) {
      actionEl.textContent = eventJoinUrl(event) ? "Join now" : "You are in";
      actionEl.disabled = !eventJoinUrl(event);
      return;
    }
    if (!state.unlimited && state.left <= 0) {
      actionEl.textContent = "No seats left";
      actionEl.disabled = true;
      return;
    }
    actionEl.textContent = "Register";
    actionEl.disabled = false;
  }

  function renderCalendar() {
    if (!selectedDay) {
      selectedDay = todayYmd();
      var upcoming = STORE.getEvents().filter(function (event) {
        return event.date && event.date >= selectedDay;
      }).sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0];
      if (upcoming && !eventsOn(selectedDay).length) {
        selectedDay = upcoming.date;
        var parts = selectedDay.split("-");
        calCursor = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      }
    }
    var year = calCursor.getFullYear();
    var month = calCursor.getMonth();
    var first = new Date(year, month, 1);
    var start = first.getDay();
    var days = new Date(year, month + 1, 0).getDate();
    var label = calCursor.toLocaleString("en-US", { month: "long", year: "numeric" });
    var cells = "";
    ["S", "M", "T", "W", "T", "F", "S"].forEach(function (d) {
      cells += '<div class="pr-cal-dow">' + d + "</div>";
    });
    var i;
    for (i = 0; i < start; i += 1) cells += '<div class="pr-cal-day is-mute"></div>';
    for (i = 1; i <= days; i += 1) {
      var date = ymd(year, month, i);
      var evs = eventsOn(date);
      var dots = evs.slice(0, 3).map(function (event) {
        return '<span class="pr-dot" style="background:' + topicColor(event.topic) + '"></span>';
      }).join("");
      if (evs.length > 3) dots += '<span class="pr-more">3+</span>';
      cells += '<button type="button" class="pr-cal-day' + (date === selectedDay ? " is-on" : "") + '" data-day="' + date + '"><div class="pr-cal-num">' + i + '</div><div class="pr-dots">' + dots + "</div></button>";
    }
    var list = eventsOn(selectedDay);
    var listHtml = list.length
      ? list.map(function (event) {
        var join = eventHasJoin(event)
          ? '<button type="button" class="pr-tiny" data-join="' + esc(event.id) + '">Join now</button>'
          : "";
        return '<article class="pr-event"><div class="pr-event-bar" style="background:' + topicColor(event.topic) + '"></div><div class="pr-event-body"><h3>' + esc(event.title) + "</h3><p>" + esc(topicLabel(event.topic)) + " · " + esc(event.time) + "</p><p>" + esc(event.sub) + '</p><div class="pr-event-actions">' + join + '<button type="button" class="pr-tiny" data-cal="' + esc(event.id) + '">Add to calendar</button></div></div></article>';
      }).join("")
      : '<p class="pr-empty">No events on this day.</p>';

    var editor = "";
    if (AUTH.canEditCalendar()) {
      editor = '<form id="prNewEvent" class="pr-letter" style="margin-top:16px"><h3>Add event</h3>' +
        '<label class="pr-field"><span>Title</span><input name="title" required></label>' +
        '<label class="pr-field"><span>Subheadline</span><input name="sub" required></label>' +
        '<div class="pr-row"><label class="pr-field"><span>Date</span><input name="date" type="date" value="' + selectedDay + '" required></label>' +
        '<label class="pr-field"><span>Time</span><input name="time" type="time" value="19:00" required></label></div>' +
        '<label class="pr-field"><span>Topic</span><select name="topic">' +
        Object.keys(CATALOG.topics).map(function (key) {
          return '<option value="' + key + '">' + CATALOG.topics[key].label + "</option>";
        }).join("") +
        "</select></label>" +
        '<label class="pr-field"><span>Join now</span><select name="joinType">' +
        '<option value="">No Join now</option>' +
        '<option value="link">Open a Zoom link</option>' +
        '<option value="register">Register first</option>' +
        "</select></label>" +
        '<label class="pr-field"><span>Join link</span><input name="joinUrl" type="url" placeholder="https://zoom.us/j/..."></label>' +
        '<label class="pr-field"><span>Seats</span><input name="seats" type="number" min="1" value="20"></label>' +
        '<label class="pr-field" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" name="unlimited" value="1" checked> Unlimited seats</label>' +
        "<button class='pr-submit' type='submit'>Save event</button></form>";
    }

    mainEl.innerHTML =
      subTabs("calendar") +
      '<div class="pr-cal-head"><button type="button" id="prCalPrev" aria-label="Previous month">&lt;</button><h2>' + esc(label) + '</h2><button type="button" id="prCalNext" aria-label="Next month">&gt;</button></div>' +
      '<div class="pr-cal-grid">' + cells + "</div>" +
      '<h2 class="pr-section-title">Events</h2>' + listHtml + editor;

    document.getElementById("prCalPrev").onclick = function () {
      calCursor = new Date(year, month - 1, 1);
      render();
    };
    document.getElementById("prCalNext").onclick = function () {
      calCursor = new Date(year, month + 1, 1);
      render();
    };
    mainEl.querySelectorAll("[data-day]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectedDay = btn.dataset.day;
        render();
      });
    });
    mainEl.querySelectorAll("[data-cal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var event = STORE.getEvents().find(function (item) { return item.id === btn.dataset.cal; });
        if (event) addToCalendar(event);
      });
    });
    mainEl.querySelectorAll("[data-join]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var event = STORE.getEvents().find(function (item) { return item.id === btn.dataset.join; });
        if (event) openEventJoin(event);
      });
    });
    var form = document.getElementById("prNewEvent");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = new FormData(form);
        var joinType = String(data.get("joinType") || "").trim();
        var unlimited = data.get("unlimited") === "1";
        var events = STORE.getEvents();
        events.push({
          id: STORE.uid(),
          title: data.get("title"),
          sub: data.get("sub"),
          date: data.get("date"),
          time: data.get("time"),
          topic: data.get("topic"),
          joinType: joinType || "",
          joinUrl: String(data.get("joinUrl") || "").trim(),
          unlimited: joinType === "register" ? unlimited : true,
          seats: unlimited ? null : Number(data.get("seats") || 0) || null,
          seatsTaken: 0,
        });
        STORE.saveEvents(events);
        selectedDay = data.get("date");
        render();
      });
    }
  }

  function subTabs(active) {
    return '<div class="pr-subtabs">' +
      '<button type="button" data-learn="classes"' + (active === "classes" ? ' class="is-on"' : "") + ">Learn</button>" +
      '<button type="button" data-learn="calendar"' + (active === "calendar" ? ' class="is-on"' : "") + ">Calendar</button>" +
      "</div>";
  }

  function renderLearn() {
    if (learnTab === "calendar") renderCalendar();
    else renderLearnClasses();
    mainEl.querySelectorAll("[data-learn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        learnTab = btn.dataset.learn;
        render();
      });
    });
  }

  function renderCourse(id) {
    if (!AUTH.hasTier(entryTier())) {
      var entry = (CATALOG.tiers || [])[0];
      mainEl.innerHTML = lockedCard("Pay " + ((entry && entry.label) || "$1") + " to open this course.");
      return;
    }
    openFatLossApp();
  }

  function renderUpgrade() {
    var cards = CATALOG.tiers.filter(function (tier) { return tier.id !== entryTier(); }).map(function (tier) {
      return '<article class="pr-offer" style="margin-bottom:12px"><strong>' + esc(tier.name) + " · " + esc(tier.label) + "</strong><span>" + esc(tier.perks) + "</span>" +
        payButtonsHtml(tier) +
        "</article>";
    }).join("");
    var manual = CATALOG.ranksManual;
    mainEl.innerHTML =
      '<article class="pr-letter"><p class="pr-kicker" style="color:#111">Ranks</p>' +
      "<h1>From Recruit to Prince's Court</h1>" +
      "<p>The $1 ticket made you a Recruit. The rooms above that use Army titles. The product is still Princes. The top table is still Prince's Court.</p>" +
      "<p>Colonel is the last room before that table. A month-long call with the Princes. Two ways through: take a seat that already exists, like a minister of X, or raise your own command.</p>" +
      cards +
      "<h2>How an army is stacked</h2><p>" + esc(manual.intro) + "</p>" +
      manual.layers.map(function (layer) {
        return "<p><strong>" + esc(layer.name) + ".</strong> " + esc(layer.ranks) + " " + esc(layer.job) + "</p>";
      }).join("") +
      "<h2>Seats</h2><ul>" + manual.seats.map(function (line) { return "<li>" + esc(line) + "</li>"; }).join("") + "</ul>" +
      "<h2>Read these</h2><ul>" + manual.reading.map(function (book) {
        return "<li><strong>" + esc(book.title) + "</strong>. " + esc(book.note) + "</li>";
      }).join("") + "</ul></article>";
    bindPayButtons();
  }

  function applePaySvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.365 1.43c0 1.14-.467 2.223-1.177 3.08-.788.94-2.066 1.66-3.276 1.56-.14-1.09.404-2.243 1.07-3.01.82-.94 2.24-1.64 3.383-1.73.12 1.04-.04 2.01.001 3.1zm1.117 4.51c-1.89-.114-3.488 1.077-4.388 1.077-.93 0-2.352-1.02-3.867-1.01-1.993.03-3.826 1.16-4.857 2.953-2.077 3.59-.537 8.903 1.491 11.823 1.005 1.444 2.195 3.063 3.764 3.005 1.515-.06 2.085-.977 3.915-.977 1.83 0 2.325.977 3.915.947 1.62-.03 2.646-1.474 3.642-2.923 1.147-1.674 1.618-3.295 1.645-3.378-.036-.016-3.158-1.212-3.19-4.815-.028-3.015 2.465-4.457 2.577-4.534-1.403-2.055-3.585-2.3-4.352-2.34z"/></svg>';
  }

  function googlePaySvg() {
    return '<svg viewBox="0 0 41 17" aria-hidden="true"><path fill="#5F6368" d="M19.2 8.4v4.8h-1.5V.9h4c1.1 0 2 .4 2.7 1.1.7.7 1.1 1.6 1.1 2.7 0 1.1-.4 2-1.1 2.7-.7.7-1.6 1.1-2.7 1.1h-2.5zm0-6.2v4.7h2.6c.6 0 1.1-.2 1.5-.6.4-.4.6-.9.6-1.5 0-.6-.2-1.1-.6-1.5-.4-.4-.9-.6-1.5-.6h-2.6z"/><path fill="#4285F4" d="M28.8 3.3c1 0 1.8.3 2.4.9.6.6.9 1.4.9 2.4 0 1-.3 1.8-.9 2.4-.6.6-1.4.9-2.4.9h-1.9v1.5h-1.5V.9h3.4zm-1.9 4.2h1.9c.6 0 1.1-.2 1.5-.5.4-.4.6-.8.6-1.4 0-.6-.2-1-.6-1.4-.4-.4-.9-.5-1.5-.5h-1.9v3.8z"/><path fill="#34A853" d="M38.1 6.1l1.2 1.2c-.5.7-1.1 1.2-1.8 1.6-.7.4-1.5.6-2.4.6-1.3 0-2.4-.4-3.3-1.3-.9-.9-1.3-2-1.3-3.3 0-1.3.4-2.4 1.3-3.3.9-.9 2-1.3 3.3-1.3.9 0 1.7.2 2.4.6.7.4 1.3.9 1.8 1.6l-1.2 1.2c-.7-.8-1.6-1.2-2.7-1.2-1 0-1.8.3-2.5 1-.7.7-1 1.5-1 2.5s.3 1.8 1 2.5c.7.7 1.5 1 2.5 1 1.1 0 2-.4 2.7-1.2z"/></svg>';
  }

  function payButtonsHtml(tier) {
    var stripeOn = STRIPE.isReady && STRIPE.isReady(tier.id);
    return '<div class="pr-pay-wallets">' +
      '<button type="button" class="pr-wallet pr-wallet--apple" data-pay="' + esc(tier.id) + '" data-wallet="apple">' + applePaySvg() + "<span>Pay</span></button>" +
      '<button type="button" class="pr-wallet pr-wallet--google" data-pay="' + esc(tier.id) + '" data-wallet="google">' + googlePaySvg() + "<span>Pay</span></button>" +
      '<button type="button" class="pr-wallet pr-wallet--card" data-pay="' + esc(tier.id) + '" data-wallet="card">Pay with card · ' + esc(tier.label) + "</button>" +
      (stripeOn
        ? '<p class="pr-pay-note">Stripe test checkout. Apple Pay and Google Pay open on Stripe when the device supports them.</p>'
        : '<p class="pr-pay-note">Paste a Stripe test Payment Link in princesStripeConfig.js to charge a real test card. Until then this grants the rank on this browser so you can walk the product.</p>') +
      '<button type="button" class="pr-ghost" data-pay-local="' + esc(tier.id) + '">Complete locally (this device)</button>' +
      "</div>";
  }

  function finishPaidTier(tierId) {
    AUTH.grantTier(tierId);
    if (tierId === entryTier()) openFatLossApp();
    else go(tierId === "court" ? "chat" : "home");
  }

  function startPaidTier(tierId) {
    if (STRIPE.isReady && STRIPE.isReady(tierId) && STRIPE.startCheckout) {
      var result = STRIPE.startCheckout(tierId);
      if (result && result.ok) return;
    }
    finishPaidTier(tierId);
  }

  function bindPayButtons() {
    mainEl.querySelectorAll("[data-pay]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        startPaidTier(btn.dataset.pay);
      });
    });
    mainEl.querySelectorAll("[data-pay-local]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        finishPaidTier(btn.dataset.payLocal);
      });
    });
  }

  function renderPay() {
    var tier = (CATALOG.tiers || []).find(function (item) { return item.id === entryTier(); }) || { id: "ticket", name: "Recruit", label: "$1 ticket" };
    mainEl.innerHTML =
      '<article class="pr-letter"><p class="pr-kicker" style="color:#111">Payment</p>' +
      "<h1>Pay " + esc(tier.label) + "</h1>" +
      "<p>Account is created. Next is " + esc(tier.name) + ". Apple Pay, Google Pay, and card all go through Stripe when a test Payment Link is set. Until Firestore is live, a returned payment unlocks this browser.</p>" +
      payButtonsHtml(tier) +
      "</article>";
    bindPayButtons();
  }

  function chatRooms() {
    return STORE.chatRooms ? STORE.chatRooms() : (CATALOG.chatRooms || []);
  }

  function chatUnlockPath(room) {
    var access = (room && room.access) || entryTier();
    if (access === "none" || access === entryTier()) return "pay";
    return "upgrade";
  }

  function renderChatButton(room, kind) {
    var open = AUTH.hasTier(room.access || entryTier());
    var hero = kind === "hero";
    var preview = open
      ? STORE.roomPreview(room.id, room.sub)
      : ("Locked · " + (room.lockHint || tierName(room.access)));
    var end = open
      ? '<span class="pr-chat-chevron" aria-hidden="true">›</span>'
      : '<span class="pr-chat-unlock">Unlock</span>';
    var title = hero
      ? "<h2>" + esc(room.name) + "</h2><p>" + esc(preview) + "</p>"
      : "<p class=\"name\">" + esc(room.name) + "</p><p class=\"preview\">" + esc(preview) + "</p>";
    return '<button type="button" class="' + (hero ? "pr-chat-hero" : "pr-chat-row") + (open ? "" : " is-locked") + '" data-go="' +
      esc(open ? "thread/" + room.id : chatUnlockPath(room)) +
      '">' +
      '<span class="pr-chat-mark' + (open ? "" : " is-locked") + '" aria-hidden="true">' +
      (open ? esc(room.mark || initials(room.name)) : "🔒") +
      "</span><div>" + title + "</div>" + end + "</button>";
  }

  function renderChat() {
    var rooms = chatRooms();
    var court = rooms.find(function (room) { return room.vip; });
    var globalRoom = rooms.find(function (room) { return room.global; });
    var list = rooms.filter(function (room) { return !room.vip && !room.global; });

    var html = '<div class="pr-chat">';
    if (court) html += renderChatButton(court, "hero");
    if (globalRoom) html += renderChatButton(globalRoom, "hero");
    html += '<p class="pr-chat-label">Chats</p>';
    list.forEach(function (room) {
      html += renderChatButton(room, "row");
    });
    html += "</div>";
    mainEl.innerHTML = html;
  }

  function renderThread(id) {
    var room = STORE.chatRoom ? STORE.chatRoom(id) : chatRooms().find(function (item) { return item.id === id; });
    if (!room) {
      mainEl.innerHTML = '<div class="pr-thread-empty"><p>That room is gone.</p><button type="button" class="pr-submit" data-go="chat">Back to Chat</button></div>';
      return;
    }
    if (!AUTH.hasTier(room.access)) {
      mainEl.innerHTML =
        '<div class="pr-thread-empty">' +
        "<p>" + esc(room.name) + " is locked. " + esc(room.lockHint || tierName(room.access)) + " opens this room.</p>" +
        '<button type="button" class="pr-submit" data-go="' + esc(chatUnlockPath(room)) + '">Unlock</button>' +
        '<button type="button" class="pr-ghost" data-go="chat" style="margin-top:10px;width:100%">Back to Chat</button></div>';
      return;
    }

    var user = AUTH.currentUser();
    var msgs = STORE.messagesFor(room.id);
    var body = msgs.map(function (msg) {
      var mine = msg.authorId === user.id;
      return '<div class="pr-msg' + (mine ? " is-mine" : "") + '">' +
        (mine ? "" : '<span class="pr-msg-mark" aria-hidden="true">' + esc(initials(msg.author)) + "</span>") +
        '<div class="pr-bubble' + (mine ? " pr-bubble--mine" : " pr-bubble--them") + '">' +
        (mine ? "" : '<p class="pr-msg-author">' + esc(msg.author) + "</p>") +
        "<p>" + esc(msg.text) + "</p></div>" +
        (mine ? '<span class="pr-msg-mark" aria-hidden="true">' + esc(initials(user.displayName)) + "</span>" : "") +
        "</div>";
    }).join("");

    if (!msgs.length) {
      body = '<p class="pr-chat-empty">No messages yet. Write something to start the room.</p>';
    }

    mainEl.innerHTML =
      '<div class="pr-thread">' +
      '<header class="pr-thread-head"><button type="button" class="pr-tiny" data-go="chat">Back</button><h1>' + esc(room.name) + "</h1></header>" +
      '<div class="pr-messages" id="prMessages">' + body + "</div>" +
      '<form class="pr-chat-bar" id="prChatForm">' +
      '<input type="text" name="text" id="prChatInput" placeholder="Type a message" maxlength="500" autocomplete="off" aria-label="Message">' +
      '<button type="submit" class="pr-submit pr-chat-send">Send</button></form></div>';

    var box = document.getElementById("prMessages");
    if (box) box.scrollTop = box.scrollHeight;
    var form = document.getElementById("prChatForm");
    var input = document.getElementById("prChatInput");
    if (input) input.focus();
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var text = (input && input.value || "").trim();
        if (!text) return;
        STORE.addChatMessage(room.id, {
          authorId: user.id,
          author: user.displayName,
          text: text,
        });
        render();
      });
    }
  }

  function renderAdmin() {
    if (!AUTH.isStaff() || !(STORE.getAppMode() === "fix" || STORE.isAdminOn())) {
      mainEl.innerHTML = '<p class="pr-empty">Turn on Administrator in the Testing chip to use admin tools.</p>';
      return;
    }
    if (!STORE.isAdminOn()) {
      mainEl.innerHTML =
        '<article class="pr-letter"><h1>Admin mode is off</h1>' +
        "<p>Tools stay locked until you turn admin mode on. That keeps Testing clean and Fix explicit.</p>" +
        '<button type="button" class="pr-submit" id="prAdminOn">Enter admin mode</button></article>';
      document.getElementById("prAdminOn").onclick = function () {
        STORE.setAdminOn(true);
        render();
      };
      return;
    }
    var users = STORE.getUsers();
    var addForm = AUTH.isOwner()
      ? '<form id="prAddPerson" class="pr-letter" style="margin-bottom:16px"><h3>Add a person</h3>' +
        '<label class="pr-field"><span>Name</span><input name="name" required></label>' +
        '<label class="pr-field"><span>Email</span><input name="email" type="email" required></label>' +
        '<label class="pr-field"><span>Role</span><select name="teamRole"><option value="member">Member</option><option value="leader">Leader</option><option value="staff">Staff</option></select></label>' +
        '<button class="pr-submit" type="submit">Add to the unit</button></form>'
      : "";
    mainEl.innerHTML =
      '<h1 class="pr-section-title">Admin</h1>' +
      '<p><button type="button" class="pr-tiny" id="prAdminOff">Turn admin mode off</button></p>' +
      addForm +
      users.map(function (item) {
        var staffTools = "";
        if (AUTH.isOwner() && item.teamRole === "staff") {
          staffTools += '<button type="button" class="pr-tiny" data-drop="' + esc(item.id) + '">Remove staff</button>';
        }
        return '<article class="pr-post"><strong>' + esc(item.displayName) + "</strong> · " + esc(item.email) +
          "<p>Tier: " + esc(item.tier) + " · Role: " + esc(item.teamRole) + "</p>" +
          '<div class="pr-actions">' +
          '<button type="button" class="pr-tiny" data-role="' + esc(item.id) + ':leader">Leader</button>' +
          '<button type="button" class="pr-tiny" data-role="' + esc(item.id) + ':staff">Add staff</button>' +
          '<button type="button" class="pr-tiny" data-role="' + esc(item.id) + ':member">Member</button>' +
          staffTools +
          "</div></article>";
      }).join("");
    document.getElementById("prAdminOff").onclick = function () {
      STORE.setAdminOn(false);
      render();
    };
    var add = document.getElementById("prAddPerson");
    if (add) {
      add.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = new FormData(add);
        try {
          STORE.addPerson({
            name: data.get("name"),
            email: data.get("email"),
            teamRole: data.get("teamRole"),
            tier: "private",
          });
          render();
        } catch (err) {
          alert(err.message || "Could not add that person.");
        }
      });
    }
    mainEl.querySelectorAll("[data-role]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var parts = btn.dataset.role.split(":");
        AUTH.setRole(parts[0], parts[1]);
        if (AUTH.currentUser() && AUTH.currentUser().id === parts[0]) {
          STORE.setSession(STORE.getUsers().find(function (item) { return item.id === parts[0]; }));
        }
        render();
      });
    });
    mainEl.querySelectorAll("[data-drop]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          STORE.removePerson(btn.dataset.drop);
          render();
        } catch (err) {
          alert(err.message || "Could not remove.");
        }
      });
    });
  }

  function renderProfile() {
    var user = AUTH.currentUser();
    var rank = tierName(user.tier || "ticket");
    mainEl.innerHTML =
      '<article class="pr-profile">' +
      '<div class="pr-profile-hero">' +
      '<div class="pr-avatar pr-avatar--lg" aria-hidden="true">' + esc(initials(user.displayName)) + "</div>" +
      "<h1>" + esc(user.displayName || "Prince") + "</h1>" +
      '<p class="pr-profile-rank">' + esc(rank) + "</p>" +
      "</div>" +
      '<dl class="pr-profile-facts">' +
      "<div><dt>Email</dt><dd>" + esc(user.email || "Not set") + "</dd></div>" +
      "<div><dt>Age</dt><dd>" + esc(user.age ? String(user.age) : "Not set") + "</dd></div>" +
      "<div><dt>Gender</dt><dd>" + esc(prettyLine(user.gender)) + "</dd></div>" +
      "</dl>" +
      '<button type="button" class="pr-submit" data-go="upgrade">Subscriptions</button>' +
      '<button type="button" class="pr-ghost pr-profile-logout" id="prLogout">Log out</button>' +
      "</article>";
    document.getElementById("prLogout").onclick = function () {
      AUTH.logout();
      location.href = "princesLanding.html";
    };
  }

  function render() {
    if (!requireUser()) return;
    applyOwnerTheme();
    var claimed = claimPaidFromStripe();
    if (claimed) {
      if (claimed === entryTier()) {
        openFatLossApp();
        return;
      }
      location.hash = claimed === "court" ? "chat" : "home";
      return;
    }
    var path = route();
    var pathChanged = path !== lastPath;
    lastPath = path;
    if (pathChanged) {
      closeAppModals();
      scrollPageTop();
    }
    renderHeader();
    bindHeader();
    renderTabs();
    document.body.classList.toggle("pr-thread-open", path.indexOf("thread/") === 0);
    if (path === "home") renderHome();
    else if (path.indexOf("post/") === 0) renderPost(path.split("/")[1]);
    else if (path.indexOf("course/") === 0) renderCourse(path.split("/")[1]);
    else if (path === "upgrade") renderUpgrade();
    else if (path === "pay") renderPay();
    else if (path === "chat") renderChat();
    else if (path.indexOf("thread/") === 0) renderThread(path.split("/")[1]);
    else if (path === "admin") renderAdmin();
    else if (path === "profile") renderProfile();
    else renderLearn();
  }

  document.addEventListener("click", function (event) {
    var menu = document.getElementById("prTestMenu");
    var chip = document.getElementById("prTestChip");
    if (menu && chip && !menu.hidden && !event.target.closest(".pr-test-wrap")) {
      menu.hidden = true;
      chip.setAttribute("aria-expanded", "false");
    }
    var zoom = event.target.closest("[data-zoom]");
    if (zoom) {
      event.preventDefault();
      event.stopPropagation();
      openZoom(zoom.getAttribute("data-zoom"));
      return;
    }
    var openUrl = event.target.closest("[data-open-url]");
    if (openUrl) {
      event.preventDefault();
      window.location.href = openUrl.getAttribute("data-open-url");
      return;
    }
    var goTo = event.target.closest("[data-go]");
    if (!goTo) return;
    event.preventDefault();
    go(goTo.getAttribute("data-go"));
  });

  window.addEventListener("hashchange", render);
  bindPersistentUi();
  render();
})();
