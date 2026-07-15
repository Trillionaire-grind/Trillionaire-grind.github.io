(function () {
  "use strict";

  var A = "minoritiesView/assets/";
  var D = window.MIN_DATA;
  var learnInClass = false;
  var postFilter = "all";

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

  function isCommunityPostId(id) {
    return D.posts.some(function (p) {
      return p.id === id;
    });
  }

  function resolvePost(id) {
    var community = null;
    var i;
    for (i = 0; i < D.posts.length; i++) {
      if (D.posts[i].id === id) {
        community = D.posts[i];
        break;
      }
    }
    if (community) {
      return {
        kind: "community",
        title: community.headline || community.body || "Post",
        author: community.author,
        date: community.date,
        body: community.body || "",
        image: community.image,
        video: community.video,
        comments: community.threadComments || [],
        official: isOfficialAuthor(community.author),
      };
    }
    var content = D.postDetail[id];
    if (content) {
      return {
        kind: "content",
        title: content.title,
        body: content.body || "",
        image: content.image,
        video: content.video,
        comments: content.comments || [],
        official: true,
      };
    }
    return null;
  }

  function renderCommentsSheet(comments) {
    var list = comments || [];
    var html =
      '<div class="min-comments-sheet" id="minCommentsSheet">' +
      '<button type="button" class="min-comments-handle" id="minCommentsHandle" aria-label="Expand comments"></button>' +
      '<p class="min-comments-preview" id="minCommentsPreview">Tap to open comments' +
      (list.length ? " · " + list.length : "") +
      "</p>" +
      '<div class="min-comments-panel" id="minCommentsPanel">';
    if (!list.length) {
      html += '<p class="min-comments-empty">No comments yet. Be the first.</p>';
    }
    list.forEach(function (c) {
      html +=
        '<div class="min-comment"><img src="' +
        A +
        'person.svg" alt=""><div><p class="min-comment-meta">' +
        renderCommentMeta(c.author, !!c.isYou) +
        "</p><p style=\"margin:0\">" +
        esc(c.text) +
        "</p></div></div>";
    });
    html +=
      '</div><div class="min-comments-compose" id="minCommentsCompose">' +
      '<input type="text" placeholder="Add a comment…" id="minCommentInput" aria-label="Add a comment">' +
      '<button type="button" class="min-comment-send" id="minCommentPublish" aria-label="Publish comment">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 20.5v-17l15 8.5z"/></svg></button></div></div>';
    return html;
  }

  function getProfile() {
    try {
      var saved = JSON.parse(localStorage.getItem("minProfile") || "null");
      if (saved && saved.name) return saved;
    } catch (e) {}
    return { name: D.profile.name, avatar: D.profile.avatar };
  }

  function saveProfile(data) {
    localStorage.setItem("minProfile", JSON.stringify(data));
  }

  function getTier() {
    return localStorage.getItem("minMemberTier") || "free";
  }

  function setTier(t) {
    localStorage.setItem("minMemberTier", t);
  }

  function tierRank(t) {
    if (t === "vip") return 4;
    if (t === "starter") return 3;
    if (t === "bench") return 2;
    if (t === "waterboy") return 1;
    return 0;
  }

  function hasContentAccess() {
    return tierRank(getTier()) >= 2;
  }

  function tierLabel(t) {
    if (t === "vip") return "V.I.P.";
    if (t === "starter") return "Starter";
    if (t === "bench") return "Bench Player";
    if (t === "waterboy") return "Waterboy";
    return "Free";
  }

  function tierClass(t) {
    if (t === "vip") return "min-tier--vip";
    if (t === "starter" || t === "bench") return "min-tier--member";
    if (t === "waterboy") return "min-tier--waterboy";
    return "min-tier--free";
  }

  function showToast(message) {
    var existing = document.getElementById("minToast");
    if (existing) existing.remove();
    var el = document.createElement("div");
    el.id = "minToast";
    el.className = "min-toast";
    el.setAttribute("role", "status");
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      el.classList.add("is-visible");
    });
    setTimeout(function () {
      el.classList.remove("is-visible");
      setTimeout(function () {
        if (el.parentNode) el.remove();
      }, 300);
    }, 2800);
  }

  function screenTitle(label) {
    return '<h2 class="min-page-title min-page-title--screen">' + esc(label) + "</h2>";
  }

  function isOfficialAuthor(author) {
    return author === "The Minorities";
  }

  function officialBadge() {
    return '<span class="min-official-badge">Official</span>';
  }

  function renderMessageRow(m) {
    var bubble =
      '<div class="min-bubble ' +
      (m.mine ? "min-bubble--mine" : "min-bubble--them") +
      '">' +
      esc(m.text) +
      "</div>";
    var avatar = '<img src="' + A + 'person.svg" alt="">';
    return (
      '<div class="min-msg-row' +
      (m.mine ? " is-mine" : "") +
      '">' +
      bubble +
      avatar +
      "</div>"
    );
  }

  function renderCommentMeta(author, isYou) {
    var html = esc(author);
    if (isYou) {
      html += ' <span class="min-comment-you">(you)</span>';
    }
    return html;
  }

  function parseRoute() {
    var raw = (location.hash || "#home").slice(1);
    var parts = raw.split("/");
    var name = parts[0] || "home";
    var id = parts[1] || null;
    var mainTabs = ["home", "posts", "chat", "learn", "shop"];
    var isSub = ["post", "thread", "subscribe", "register", "sales"].indexOf(name) >= 0;
    var tab = name === "posts" ? "home" : mainTabs.indexOf(name) >= 0 ? name : "home";
    if (isSub) tab = null;
    return { name: name, id: id, tab: tab, isSub: isSub };
  }

  function navigate(hash) {
    if (hash.charAt(0) !== "#") hash = "#" + hash;
    location.hash = hash;
  }

  function icon(name, active) {
    var suffix = active ? "_b" : "";
    if (name === "house") return A + "house" + suffix + ".svg";
    if (name === "message") return A + "message" + suffix + ".svg";
    if (name === "graduation") return A + "graduation" + suffix + ".svg";
    if (name === "basket") return A + "basket" + suffix + ".svg";
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
        sales: "The Minorities",
      };
      var title = titles[route.name] || "The Minorities";
      if (route.name === "thread" && route.id) {
        var chat = D.chats.find(function (c) {
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

    header.className = "min-header min-header--hidden";
    header.innerHTML = "";
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
      { id: "shop", label: "Shop", icon: "basket" },
    ];
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
    if (tierRank(getTier()) >= 3) return "";
    return (
      '<div class="min-upgrade-banner" data-nav="#subscribe" role="button" tabindex="0">' +
      '<img src="' +
      A +
      'lock_open.svg" width="28" height="28" alt="">' +
      "<div><strong>Upgrade for full access</strong><span>Content, chat, classes &amp; more</span></div>" +
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
      'message_r.svg" width="14" height="11" alt=""></p>'
    );
  }

  function renderHomeFeed() {
    var html =
      '<div class="min-screen">' +
      upgradeBanner() +
      '<p class="min-section-label">Content</p>';

    D.contentCards.forEach(function (card) {
      var dest = card.locked ? "#subscribe" : "#post/" + card.id;
      html += '<article class="min-content-card" data-nav="' + dest + '">';
      if (card.image) {
        if (card.locked) {
          html +=
            '<div class="min-locked-wrap"><img class="hero" src="' +
            esc(card.image) +
            '" alt="">' +
            '<div class="min-locked-badge"><span>🔒 Upgrade to unlock</span></div></div>';
        } else {
          html += '<img class="hero" src="' + esc(card.image) + '" alt="">';
        }
      } else {
        if (card.locked) {
          html +=
            '<div class="min-locked-wrap"><div class="min-card-placeholder min-card-placeholder--locked"><img src="' +
            A +
            'logo_site.png" alt=""></div>' +
            '<div class="min-locked-badge"><span>🔒 Upgrade to unlock</span></div></div>';
        } else {
          html +=
            '<div class="min-card-placeholder"><img src="' +
            A +
            'logo_site.png" alt=""></div>';
        }
      }
      html +=
        '<div class="min-card-body"><h3>' +
        esc(card.title) +
        "</h3>" +
        metaLine(card.date, card.comments) +
        "</div></article>";
    });

    html +=
      '<div class="min-promo">' +
      '<div class="min-promo-text"><div><h4>Sale</h4><p>Get your new "University" Hoodie</p></div>' +
      '<button type="button" class="min-promo-cta" data-nav="#shop">Yes — shop the University collection ›</button></div>' +
      '<div class="min-promo-img"><img src="' +
      A +
      'shop/uni_hd.webp" alt="University hoodie"></div></div>';

    html += "</div>";
    return html;
  }

  function renderPosts() {
    var filtered = D.posts.filter(function (post) {
      if (postFilter === "community") return post.author !== "The Minorities";
      if (postFilter === "minorities") return post.author === "The Minorities";
      return true;
    });

    var html = '<div class="min-screen min-screen--posts">';

    html +=
      '<div class="min-posts-toolbar">' +
      '<button type="button" class="min-icon-btn" id="minFilterBtn" aria-label="Filter posts">' +
      '<img src="' +
      A +
      'filter.svg" width="28" height="28" alt=""></button>' +
      '<span class="min-filter-label">' +
      (postFilter === "all"
        ? "All posts"
        : postFilter === "community"
          ? "Community"
          : "The Minorities") +
      "</span></div>";

    if (!filtered.length) {
      html +=
        '<div class="min-empty"><p>No posts in this filter yet.</p>' +
        '<button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minFilterReset">Show all</button></div>';
      html += "</div>";
      return html;
    }

    filtered.forEach(function (post) {
      var official = isOfficialAuthor(post.author);
      html +=
        '<article class="min-post min-post--link' +
        (official ? " min-post--official" : "") +
        '" data-nav="#post/' +
        esc(post.id) +
        '" role="button" tabindex="0">';
      html +=
        '<div class="min-post-header"><img src="' +
        A +
        (official ? "logo_site.png" : "person.svg") +
        '" alt="" class="' +
        (official ? "min-post-avatar--official" : "") +
        '"><div><div class="min-post-author-row"><strong>' +
        esc(post.author) +
        "</strong>" +
        (official ? officialBadge() : "") +
        "</div><time>" +
        esc(post.date) +
        "</time></div></div>";
      if (post.video) {
        if (post.headline) {
          html += '<h3 class="min-post-headline">' + esc(post.headline) + "</h3>";
        }
        html += postVideoHtml(post);
      } else {
        html += '<p class="min-post-body">' + esc(post.body) + "</p>";
        if (post.image) {
          html += '<img class="content" src="' + esc(post.image) + '" alt="">';
        }
      }
      html +=
        '<div class="min-post-actions">' +
        '<span><img src="' +
        A +
        'heart.fill.svg" width="16" height="12" alt=""> ' +
        post.likes +
        "</span>" +
        '<span><img src="' +
        A +
        'message_r.svg" width="16" height="12" alt=""> ' +
        post.comments +
        "</span></div></article>";
    });

    html += "</div>";
    return html;
  }

  function renderChat() {
    var tier = getTier();
    var html = '<div class="min-screen">' + screenTitle("Chat");
    var vipLocked = tier !== "vip";

    html +=
      '<div class="min-chat-hero" data-nav="' +
      (vipLocked ? "#subscribe" : "#thread/vip") +
      '" role="button" tabindex="0">' +
      '<img src="' +
      A +
      'message_b.svg" width="28" height="44" alt="">' +
      "<div><h3>Join The<br>V.I.P. Group Chat</h3>" +
      (vipLocked
        ? '<span class="min-tier min-tier--vip">V.I.P. only</span>'
        : "") +
      "</div>" +
      '<span class="min-chevron" style="margin-left:auto;font-size:1.75rem">›</span></div>';

    html += '<p class="min-section-label">Chats</p>';
    html +=
      '<div class="min-group-card" data-nav="#thread/general">General Community Group Chat</div>';
    html +=
      '<button type="button" class="min-btn min-btn--ghost min-btn--block" id="minNewChatBtn" style="margin-bottom:16px">+ New Chatroom</button>';

    D.chats
      .filter(function (c) {
        return !c.vip && c.id !== "general";
      })
      .forEach(function (chat) {
        html +=
          '<div class="min-chat-row" data-nav="#thread/' +
          esc(chat.id) +
          '" role="button" tabindex="0">' +
          '<img src="' +
          A +
          'person.svg" alt=""><div><p class="name">' +
          esc(chat.name) +
          '</p><p class="preview">' +
          esc(chat.preview) +
          "</p></div></div>";
      });

    html += "</div>";
    return html;
  }

  function renderLearn() {
    var tier = getTier();
    var canJoin = tierRank(tier) >= 3;

    if (learnInClass) {
      return (
        '<div class="min-screen min-screen--full min-learn-live">' +
        '<div class="min-learn-live-msg">' +
        "<h2>Live session</h2>" +
        "<p>Your class link will appear here when the session starts. Starter and V.I.P. members receive the link 15 minutes before go-live.</p>" +
        '<button type="button" class="min-btn min-btn--ghost" id="minLeaveClass">Back</button></div></div>'
      );
    }

    return (
      '<div class="min-screen min-learn-screen">' +
      screenTitle("Learn") +
      '<section class="min-class-card">' +
      '<div class="min-class-icon"><img src="' +
      A +
      'graduation_b.svg" width="40" height="40" alt=""></div>' +
      '<p class="eyebrow">Upcoming live session</p>' +
      "<h2>" +
      esc(D.learn.nextSession) +
      "</h2>" +
      "<p class=\"min-class-note\">" +
      esc(D.learn.memberNote) +
      "</p>" +
      (canJoin
        ? '<button type="button" class="min-btn min-btn--primary" id="minJoinClass">Enter waiting room</button>'
        : '<button type="button" class="min-btn min-btn--primary" data-nav="#subscribe">Upgrade to join classes</button>') +
      "</section></div>"
    );
  }

  function renderShop() {
    var html =
      '<div class="min-screen min-screen--wide">' + screenTitle("Shop") + '<div class="min-shop-grid">';
    D.products.forEach(function (p) {
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

  function renderPostDetail(id) {
    var post = resolvePost(id);
    if (!post) {
      return (
        '<div class="min-screen min-empty"><p>Post not found.</p><button type="button" class="min-btn min-btn--primary" data-nav="#posts">Back to posts</button></div>'
      );
    }

    var isOfficial = post.author ? isOfficialAuthor(post.author) : post.kind === "content";
    var html =
      '<div class="min-screen min-post-detail min-post-detail--full">';

    if (post.author) {
      html +=
        '<div class="min-post-detail-author"><img src="' +
        A +
        (isOfficial ? "logo_site.png" : "person.svg") +
        '" alt="" class="' +
        (isOfficial ? "min-post-avatar--official" : "") +
        '"><div><div class="min-post-author-row"><strong>' +
        esc(post.author) +
        "</strong>" +
        (isOfficial ? officialBadge() : "") +
        "</div><time>" +
        esc(post.date) +
        "</time></div></div>";
    } else if (isOfficial) {
      html += '<div class="min-post-detail-author">' + officialBadge() + "</div>";
    }

    html += '<div class="min-post-detail-content">';
    html += "<h1>" + esc(post.title) + "</h1>";

    if (post.video) {
      html += postVideoHtml({ video: post.video, headline: post.title, body: post.body });
    } else if (post.image) {
      html += '<img class="hero" src="' + esc(post.image) + '" alt="">';
    }

    if (post.body && !post.video) {
      html += '<p class="body-copy">' + esc(post.body) + "</p>";
    }

    html += "</div></div>" + renderCommentsSheet(post.comments);
    return html;
  }

  function renderThread(id) {
    var chat = D.chats.find(function (c) {
      return c.id === id;
    });
    var msgs = D.threadMessages[id] || D.threadMessages.general || [];
    var html = '<div class="min-screen min-screen--full">';
    html += '<div class="min-messages" id="minMessages">';
    msgs.forEach(function (m) {
      html += renderMessageRow(m);
    });
    html += "</div>";
    html +=
      '<div class="min-chat-input-bar"><input type="text" id="minChatInput" placeholder="Type a message…" aria-label="Message">' +
      '<button type="button" class="min-btn min-btn--primary min-btn--sm" id="minChatSend">Send</button></div></div>';
    return html;
  }

  function renderSubscribe() {
    var tier = getTier();
    var html =
      '<div class="min-screen"><h2 class="min-page-title">Choose your plan</h2>' +
      '<p class="min-page-sub">Support the movement and unlock member features.</p>';
    D.subscriptions.forEach(function (sub) {
      var isCurrent = sub.id === tier;
      html +=
        '<article class="min-tier-card' +
        (isCurrent ? " is-current" : "") +
        ' min-tier-card--' +
        esc(sub.id) +
        '">';
      if (isCurrent) {
        html += '<div class="min-tier-card-header">Current plan</div>';
      }
      html +=
        '<div class="min-tier-card-visual"><img src="' +
        A +
        'logo_site.png" alt=""></div><div class="min-tier-card-body"><h3>' +
        esc(sub.name) +
        '</h3><p class="price">US$' +
        sub.price +
        '<span>/month</span></p><p>' +
        esc(sub.perks) +
        '</p><button type="button" class="min-btn min-btn--primary min-btn--block min-tier-select" data-tier="' +
        esc(sub.id) +
        '">' +
        (isCurrent ? "Current plan" : "Join — US$" + sub.price + "/mo") +
        "</button></div></article>";
    });
    html += "</div>";
    return html;
  }

  function renderRegister() {
    var profile = getProfile();
    var username = profile.username || "member";
    return (
      '<div class="min-screen">' +
      '<h2 class="min-page-title min-page-title--left">Your profile</h2>' +
      '<p class="min-page-sub min-page-sub--left">Set up how you appear in the community.</p>' +
      '<form class="min-form" id="minRegisterForm">' +
      '<div class="min-avatar-upload"><input type="file" id="minAvatarInput" accept="image/*" hidden>' +
      '<img id="minAvatarPreview" src="' +
      esc(profile.avatar) +
      '" alt="Profile"><br>' +
      '<button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minAvatarBtn" style="margin-top:12px">Change photo</button></div>' +
      '<div class="min-field"><label for="minName">Display name</label><input id="minName" type="text" placeholder="Your name" value="' +
      esc(profile.name === "Member" ? "" : profile.name) +
      '"></div>' +
      '<div class="min-field"><label for="minUsername">Username</label><input id="minUsername" type="text" class="min-input--readonly" value="@' +
      esc(username.replace(/^@/, "")) +
      '" readonly disabled aria-describedby="minUsernameHint">' +
      '<p class="min-field-hint" id="minUsernameHint">Usernames are assigned and cannot be changed.</p></div>' +
      '<div class="min-field"><label for="minBio">Bio</label><textarea id="minBio" rows="4" maxlength="160" placeholder="Short bio">' +
      esc(profile.bio || "") +
      '</textarea><p class="min-field-hint min-char-count"><span id="minBioCount">' +
      (profile.bio || "").length +
      '</span>/160</p></div>' +
      '<div class="min-field"><label for="minEmail">Email</label><input id="minEmail" type="email" placeholder="Email" autocomplete="email"></div>' +
      '<button type="submit" class="min-btn min-btn--accent min-btn--block">Save profile</button></form></div>'
    );
  }

  function renderSales() {
    var videoHtml = D.promoVideo
      ? postVideoHtml({ video: D.promoVideo, headline: "The Minorities App" })
      : '<div class="min-video-placeholder">Promo video coming soon</div>';
    return (
      '<div class="min-screen min-sales-hero">' +
      "<h1>At Last…<br>The Minorities App</h1>" +
      videoHtml +
      '<p class="min-sales-bonus-label">Member bonuses</p>' +
      '<ul class="min-bonus-list"><li>Early access to drops &amp; content</li><li>Member pricing on merch</li><li>Community chat &amp; VIP rooms</li><li>Live classes &amp; replays</li></ul>' +
      '<button type="button" class="min-btn min-btn--accent min-btn--block" id="minSalesCta">Start with Starter — US$10/mo</button>' +
      '<button type="button" class="min-btn min-btn--ghost min-btn--block" data-nav="#subscribe" style="margin-top:12px">Compare all plans</button></div>'
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
      case "post":
        return renderPostDetail(route.id);
      case "thread":
        return renderThread(route.id);
      case "subscribe":
        return renderSubscribe();
      case "register":
        return renderRegister();
      case "sales":
        return renderSales();
      default:
        return renderHomeFeed();
    }
  }

  function renderOverlays() {
    var tier = getTier();
    var profile = getProfile();
    return (
      '<div class="min-overlay min-overlay--center" id="minFilterOverlay">' +
      '<div class="min-dialog" role="dialog" aria-labelledby="minFilterTitle">' +
      '<h2 id="minFilterTitle">Filter posts</h2>' +
      '<label class="min-radio"><input type="radio" name="minFilter" value="all"' +
      (postFilter === "all" ? " checked" : "") +
      '> All posts</label>' +
      '<label class="min-radio"><input type="radio" name="minFilter" value="community"' +
      (postFilter === "community" ? " checked" : "") +
      '> Community</label>' +
      '<label class="min-radio"><input type="radio" name="minFilter" value="minorities"' +
      (postFilter === "minorities" ? " checked" : "") +
      '> The Minorities</label>' +
      '<div class="min-dialog-actions">' +
      '<button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minFilterCancel">Cancel</button>' +
      '<button type="button" class="min-btn min-btn--primary min-btn--sm" id="minFilterDone">Done</button></div></div></div>' +
      '<div class="min-overlay" id="minProfileOverlay">' +
      '<div class="min-sheet min-profile-sheet">' +
      '<button type="button" class="min-profile-close" id="minProfileClose" aria-label="Close profile">×</button>' +
      '<div class="min-profile-hero">' +
      '<img class="min-profile-avatar" src="' +
      esc(profile.avatar) +
      '" alt="">' +
      "<h3>" +
      esc(profile.name) +
      "</h3>" +
      '<p class="min-profile-handle">@' +
      esc((profile.username || "member").replace(/^@/, "")) +
      "</p>" +
      '<span class="min-tier ' +
      tierClass(tier) +
      '">' +
      esc(tierLabel(tier)) +
      "</span></div>" +
      '<nav class="min-menu-list" aria-label="Profile settings">' +
      menuRow("dollar.svg", "Subscriptions", "Manage your plan", "#subscribe") +
      menuRow("signature.svg", "Personal info", "Name, bio & photo", "#register") +
      menuRow("stack.svg", "Social media", "Coming soon", null) +
      menuRow("profile.svg", "Log out", "Sign out of this device", "logout") +
      "</nav></div></div>" +
      '<div class="min-overlay" id="minCreatePostOverlay">' +
      '<div class="min-sheet">' +
      '<div class="min-sheet-header"><button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minCreateClose">Cancel</button>' +
      '<h2>Create post</h2><button type="button" class="min-btn min-btn--ghost min-btn--sm" style="color:var(--min-primary)">Done</button></div>' +
      '<div class="min-field"><input type="text" placeholder="Title"></div>' +
      '<button type="button" class="min-btn min-btn--ghost min-btn--sm">+ Add picture</button>' +
      '<div class="min-field" style="margin-top:16px"><textarea rows="6" placeholder="What\'s on your mind?" style="width:100%;padding:10px;border-radius:12px;border:1px solid var(--min-outline);resize:none"></textarea></div></div></div>' +
      '<div class="min-overlay" id="minChatroomOverlay">' +
      '<div class="min-sheet">' +
      '<div class="min-sheet-header"><button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minChatroomClose">Cancel</button>' +
      '<h2>New chatroom</h2><button type="button" class="min-btn min-btn--ghost min-btn--sm" style="color:var(--min-primary)">Done</button></div>' +
      '<div class="min-field"><input type="text" placeholder="Chatroom name"></div>' +
      "<p style=\"font-weight:700;margin:16px 0 8px\">People</p>" +
      '<div class="min-chips">' +
      D.chatroomPeople
        .map(function (name) {
          return (
            '<span class="min-chip">' +
            esc(name) +
            '<button type="button" aria-label="Remove">&times;</button></span>'
          );
        })
        .join("") +
      '<button type="button" class="min-btn min-btn--ghost min-btn--sm">+ Add person</button></div></div></div>'
    );
  }

  function menuRow(iconFile, label, subtitle, hash) {
    var attrs = "";
    if (hash === "logout") attrs = ' data-action="logout"';
    else if (hash) attrs = ' data-nav="' + hash + '"';
    else attrs = ' data-action="soon"';
    var sub = subtitle
      ? '<span class="min-menu-sub">' + esc(subtitle) + "</span>"
      : "";
    return (
      '<button type="button" class="min-menu-row"' +
      attrs +
      '><span class="min-menu-icon"><img src="' +
      A +
      iconFile +
      '" alt=""></span><span class="min-menu-text"><span class="min-menu-label">' +
      esc(label) +
      "</span>" +
      sub +
      '</span><span class="chev" aria-hidden="true">›</span></button>'
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
        else if (route.name === "register" || route.name === "sales") navigate("#subscribe");
        else navigate("#home");
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

    document.querySelectorAll(".min-menu-row[data-nav]").forEach(function (el) {
      el.onkeydown = function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          el.click();
        }
      };
    });

    document.querySelectorAll('[data-action="logout"]').forEach(function (el) {
      el.onclick = function () {
        closeAllOverlays();
        showToast("Signed out");
      };
    });

    document.querySelectorAll('[data-action="soon"]').forEach(function (el) {
      el.onclick = function () {
        showToast("Coming soon");
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
      var picked = document.querySelector('input[name="minFilter"]:checked');
      postFilter = picked ? picked.value : "all";
      closeOverlay("minFilterOverlay");
      render();
    };

    var filterReset = $("#minFilterReset");
    if (filterReset) filterReset.onclick = function () {
      postFilter = "all";
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
    if (createClose) createClose.onclick = function () {
      closeOverlay("minCreatePostOverlay");
    };

    if (route.name === "posts") {
      var fab = document.createElement("button");
      fab.className = "min-fab";
      fab.type = "button";
      fab.setAttribute("aria-label", "Create post");
      fab.textContent = "+";
      fab.onclick = function () {
        openOverlay("minCreatePostOverlay");
      };
      document.body.appendChild(fab);
    }

    var joinClass = $("#minJoinClass");
    if (joinClass) joinClass.onclick = function () {
      learnInClass = true;
      render();
    };

    var leaveClass = $("#minLeaveClass");
    if (leaveClass) leaveClass.onclick = function () {
      learnInClass = false;
      render();
    };

    var salesCta = $("#minSalesCta");
    if (salesCta) salesCta.onclick = function () {
      navigate("#subscribe");
    };

    document.querySelectorAll(".min-tier-select").forEach(function (btn) {
      btn.onclick = function () {
        var t = btn.getAttribute("data-tier");
        if (t === getTier()) return;
        setTier(t);
        showToast("Plan updated to " + tierLabel(t));
        render();
      };
    });

    var regForm = $("#minRegisterForm");
    if (regForm) {
      regForm.onsubmit = function (e) {
        e.preventDefault();
        var nameEl = $("#minName");
        var name = nameEl && nameEl.value.trim() ? nameEl.value.trim() : "Member";
        var data = {
          name: name,
          username: ($("#minUsername") && $("#minUsername").value.replace(/^@/, "")) || "member",
          bio: ($("#minBio") && $("#minBio").value.trim()) || "",
          avatar: ($("#minAvatarPreview") && $("#minAvatarPreview").src) || A + "person.svg",
        };
        saveProfile(data);
        showToast("Profile saved");
        navigate("#home");
      };
      var bioEl = $("#minBio");
      var bioCount = $("#minBioCount");
      if (bioEl && bioCount) {
        bioEl.oninput = function () {
          bioCount.textContent = String(bioEl.value.length);
        };
      }
      var avatarBtn = $("#minAvatarBtn");
      var avatarInput = $("#minAvatarInput");
      if (avatarBtn && avatarInput) {
        avatarBtn.onclick = function () {
          avatarInput.click();
        };
        avatarInput.onchange = function (ev) {
          var file = ev.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function () {
            $("#minAvatarPreview").src = reader.result;
          };
          reader.readAsDataURL(file);
        };
      }
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
      setCommentsExpanded(
        !(commentsSheet && commentsSheet.classList.contains("is-expanded"))
      );
    }
    if (commentsHandle) commentsHandle.onclick = toggleComments;
    if (commentsPreview) commentsPreview.onclick = toggleComments;

    var commentPublish = $("#minCommentPublish");
    var commentInput = $("#minCommentInput");
    var commentsPanel = $("#minCommentsPanel");
    function publishComment() {
      if (!commentInput || !commentsPanel || !commentInput.value.trim()) return;
      var row = document.createElement("div");
      row.className = "min-comment";
      row.innerHTML =
        '<img src="' +
        A +
        'person.svg" alt=""><div><p class="min-comment-meta">' +
        renderCommentMeta(getProfile().name, true) +
        '</p><p style="margin:0">' +
        esc(commentInput.value.trim()) +
        "</p></div>";
      commentsPanel.appendChild(row);
      commentInput.value = "";
      commentsPanel.scrollTop = commentsPanel.scrollHeight;
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
  }

  function sendChatMessage() {
    var input = $("#minChatInput");
    var messages = $("#minMessages");
    if (!input || !messages || !input.value.trim()) return;
    var wrap = document.createElement("div");
    wrap.innerHTML = renderMessageRow({ mine: true, text: input.value.trim() });
    messages.appendChild(wrap.firstChild);
    input.value = "";
    messages.scrollTop = messages.scrollHeight;
  }

  function render() {
    var route = parseRoute();
    var app = $("#minApp");
    var isLocked =
      route.name === "thread" ||
      (route.name === "learn" && learnInClass);
    if (app) {
      app.classList.toggle("is-sub", route.isSub);
      app.classList.toggle("is-locked", isLocked);
      app.classList.toggle(
        "is-headerless",
        !route.isSub && route.tab !== "home"
      );
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
    document.title =
      route.isSub && route.name === "thread"
        ? "Chat — The Minorities"
        : "The Minorities";
  }

  window.addEventListener("hashchange", function () {
    var route = parseRoute();
    if (route.name !== "learn") learnInClass = false;
    render();
  });
  document.addEventListener("DOMContentLoaded", function () {
    if (!location.hash) location.hash = "#home";
    render();
  });
})();
