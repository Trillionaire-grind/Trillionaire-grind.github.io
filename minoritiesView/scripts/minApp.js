(function () {
  "use strict";

  var A = "minoritiesView/assets/";
  var D = window.MIN_DATA;
  var learnInClass = false;

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
      };
    }
    return null;
  }

  function renderCommentsSheet(comments) {
    var html =
      '<div class="min-comments-sheet" id="minCommentsSheet">' +
      '<button type="button" class="min-comments-handle" id="minCommentsHandle" aria-label="Expand comments"></button>' +
      '<p class="min-comments-preview" id="minCommentsPreview">Tap to open comments</p>' +
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
    html +=
      '</div><div class="min-comments-compose" id="minCommentsCompose">' +
      '<input type="text" placeholder="Add a comment…" id="minCommentInput" aria-label="Add a comment">' +
      '<button type="button" class="min-comment-send" id="minCommentPublish" aria-label="Publish comment">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 20.5v-17l15 8.5z"/></svg></button></div></div>';
    return html;
  }

  function getTier() {
    return localStorage.getItem("minMemberTier") || "member";
  }

  function setTier(t) {
    localStorage.setItem("minMemberTier", t);
  }

  function tierLabel(t) {
    if (t === "vip") return "V.I.P.";
    if (t === "member") return "Member";
    return "Free";
  }

  function tierClass(t) {
    if (t === "vip") return "min-tier--vip";
    if (t === "member") return "min-tier--member";
    return "min-tier--free";
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
      if (route.name === "post" && route.id) {
        var postRef = resolvePost(route.id);
        if (postRef && postRef.title) {
          title = postRef.title.length > 42 ? postRef.title.slice(0, 42) + "…" : postRef.title;
        }
      }
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

    var tabTitles = { chat: "Chat", learn: "Learn", shop: "Shop" };
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
    return (
      '<div class="min-upgrade-banner" data-nav="#subscribe" role="button" tabindex="0">' +
      '<img src="' +
      A +
      'lock_open.svg" width="28" height="28" alt="">' +
      "<div><strong>Upgrade for full access</strong><span>Support the vision</span></div>" +
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
    var html =
      '<div class="min-screen">' +
      '<button type="button" class="min-icon-btn" id="minFilterBtn" aria-label="Filter posts" style="margin-bottom:8px">' +
      '<img src="' +
      A +
      'filter.svg" width="28" height="28" alt=""></button>';

    D.posts.forEach(function (post) {
      html +=
        '<article class="min-post min-post--link" data-nav="#post/' +
        esc(post.id) +
        '" role="button" tabindex="0">';
      html +=
        '<div class="min-post-header"><img src="' +
        A +
        'person.svg" alt=""><div><strong>' +
        esc(post.author) +
        "</strong><time>" +
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
    var html = '<div class="min-screen">';
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
    if (learnInClass) {
      return (
        '<div class="min-screen min-screen--full">' +
        '<iframe class="min-class-iframe" title="Live class stream" src="' +
        esc(D.learn.zoomUrl) +
        '" allow="camera; microphone; display-capture"></iframe></div>'
      );
    }
    return (
      '<div class="min-screen" style="display:flex;align-items:center;min-height:60dvh">' +
      '<section class="min-class-card" style="width:100%">' +
      '<p class="eyebrow">Upcoming Live Session</p>' +
      "<h2>" +
      esc(D.learn.nextSession) +
      "</h2>" +
      '<button type="button" class="min-btn min-btn--primary" id="minJoinClass">Join Live Class</button>' +
      '<p style="margin-top:16px;font-size:0.8125rem;color:var(--min-muted)">Mock session — opens embedded Zoom.</p>' +
      "</section></div>"
    );
  }

  function renderShop() {
    var html =
      '<div class="min-screen min-screen--wide"><h2 class="min-page-title">Shop</h2><div class="min-shop-grid">';
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

    var html = '<div class="min-screen min-post-detail min-post-detail--full">';

    if (post.author) {
      html +=
        '<div class="min-post-detail-author"><img src="' +
        A +
        'person.svg" alt=""><div><strong>' +
        esc(post.author) +
        "</strong><time>" +
        esc(post.date) +
        "</time></div></div>";
    }

    html += "<h1>" + esc(post.title) + "</h1>";

    if (post.video) {
      html += postVideoHtml({ video: post.video, headline: post.title, body: post.body });
    } else if (post.image) {
      html += '<img class="hero" src="' + esc(post.image) + '" alt="">';
    }

    if (post.body && !post.video) {
      html += '<p class="body-copy">' + esc(post.body) + "</p>";
    }

    html += "</div>" + renderCommentsSheet(post.comments);
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

  function renderSubscribe() {
    var tier = getTier();
    var html =
      '<div class="min-screen"><h2 class="min-page-title">Subscription Options</h2>';
    D.subscriptions.forEach(function (sub) {
      var isCurrent = sub.id === "starter" && tier === "member";
      html +=
        '<article class="min-tier-card' +
        (isCurrent ? " is-current" : "") +
        '">';
      if (isCurrent) {
        html += '<div class="min-tier-card-header">Current plan</div>';
      }
      html +=
        '<img src="' +
        A +
        'girls.png" alt=""><div class="min-tier-card-body"><h3>' +
        esc(sub.name) +
        '</h3><p class="price">US$' +
        sub.price +
        '<span style="font-size:0.75rem;font-weight:400;color:var(--min-muted)">/month</span></p><p>' +
        esc(sub.perks) +
        '</p><button type="button" class="min-btn min-btn--primary min-btn--block min-tier-select" data-tier="' +
        esc(sub.id) +
        '">' +
        (isCurrent ? "Current" : "Join") +
        "</button></div></article>";
    });
    html += "</div>";
    return html;
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
      '<button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minAvatarBtn" style="margin-top:12px">Change picture</button></div>' +
      '<div class="min-field"><label for="minName">Name</label><input id="minName" type="text" placeholder="Your name"></div>' +
      '<div class="min-field"><label for="minUsername">Username</label><input id="minUsername" type="text" placeholder="Username"></div>' +
      '<div class="min-field"><label for="minBio">Bio</label><input id="minBio" type="text" placeholder="Short bio"></div>' +
      '<div class="min-field"><label for="minEmail">Email</label><input id="minEmail" type="email" placeholder="Email"></div>' +
      '<div class="min-field"><label for="minPassword">Password</label><input id="minPassword" type="password" placeholder="Password"></div>' +
      '<button type="submit" class="min-btn min-btn--accent min-btn--block">Register</button></form></div>'
    );
  }

  function renderSales() {
    return (
      '<div class="min-screen min-sales-hero">' +
      "<h1>At Last…<br>The Minorities App</h1>" +
      '<div class="min-video-placeholder">Press play to learn more</div>' +
      '<p style="font-weight:700;text-align:center">BONUS</p>' +
      '<ul class="min-bonus-list"><li>Get access to content first</li><li>Get discounts on merch</li><li>Member community chat</li><li>Live class access</li></ul>' +
      '<button type="button" class="min-btn min-btn--accent min-btn--block" id="minSalesCta" style="margin-top:24px">Yes — app + bonuses for $1/month</button></div>'
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
    return (
      '<div class="min-overlay min-overlay--center" id="minFilterOverlay">' +
      '<div class="min-dialog" role="dialog" aria-labelledby="minFilterTitle">' +
      '<h2 id="minFilterTitle">Filter posts</h2>' +
      '<label><input type="radio" name="minFilter" value="all" checked> All posts</label><br>' +
      '<label><input type="radio" name="minFilter" value="community"> Community</label><br>' +
      '<label><input type="radio" name="minFilter" value="minorities"> Minorities</label>' +
      '<div class="min-dialog-actions">' +
      '<button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minFilterCancel">Cancel</button>' +
      '<button type="button" class="min-btn min-btn--primary min-btn--sm" id="minFilterDone">Done</button></div></div></div>' +
      '<div class="min-overlay" id="minProfileOverlay">' +
      '<div class="min-sheet min-profile-menu">' +
      '<div class="min-sheet-header"><button type="button" class="min-btn min-btn--ghost min-btn--sm" id="minProfileClose">Close</button></div>' +
      '<img class="avatar" src="' +
      A +
      'person.svg" alt="">' +
      "<h3>" +
      esc(D.profile.name) +
      "</h3>" +
      '<span class="min-tier ' +
      tierClass(tier) +
      '">' +
      esc(tierLabel(tier)) +
      "</span>" +
      '<div style="margin-top:24px;text-align:left">' +
      menuRow("dollar.svg", "Subscriptions", "#subscribe") +
      menuRow("signature.svg", "Personal info", "#register") +
      menuRow("stack.svg", "Social media", null) +
      menuRow("profile.svg", "Log out", null) +
      "</div></div></div>" +
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

  function menuRow(iconFile, label, hash) {
    var attrs = hash ? ' data-nav="' + hash + '"' : "";
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
      closeOverlay("minFilterOverlay");
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

    var salesCta = $("#minSalesCta");
    if (salesCta) salesCta.onclick = function () {
      window.open(D.stripeUrl, "_blank", "noopener");
    };

    document.querySelectorAll(".min-tier-select").forEach(function (btn) {
      btn.onclick = function () {
        var t = btn.getAttribute("data-tier");
        if (t === "vip") setTier("vip");
        else if (t === "starter" || t === "bench") setTier("member");
        else setTier("free");
        render();
      };
    });

    var regForm = $("#minRegisterForm");
    if (regForm) {
      regForm.onsubmit = function (e) {
        e.preventDefault();
        navigate("#home");
      };
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
        esc(D.profile.name) +
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
    var row = document.createElement("div");
    row.className = "min-msg-row is-mine";
    row.innerHTML =
      '<div class="min-bubble min-bubble--mine">' +
      esc(input.value.trim()) +
      '</div><img src="' +
      A +
      'person.svg" alt="">';
    messages.appendChild(row);
    input.value = "";
    messages.scrollTop = messages.scrollHeight;
  }

  function render() {
    var route = parseRoute();
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
