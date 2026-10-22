(function () {
  var CATALOG = window.PRINCES_CATALOG;
  var STORE = window.PRINCES_STORE;
  var AUTH = window.PRINCES_AUTH;

  var headerEl = document.getElementById("prHeader");
  var mainEl = document.getElementById("prMain");
  var tabEl = document.getElementById("prTabbar");

  var learnTab = "classes";
  var calCursor = new Date(2026, 9, 1);
  var selectedDay = "2026-10-21";

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
    location.hash = hash;
  }

  function topicColor(topic) {
    return (CATALOG.topics[topic] && CATALOG.topics[topic].color) || "#C9A227";
  }

  function topicLabel(topic) {
    return (CATALOG.topics[topic] && CATALOG.topics[topic].label) || topic;
  }

  var FAT_LOSS_APP = (CATALOG && CATALOG.fatLossApp) || "fatLossViews/app.html";

  var TEST_RANKS = [
    { id: "ticket", label: "Recruit" },
    { id: "private", label: "Private" },
    { id: "specialist", label: "Specialist" },
    { id: "sergeant", label: "Sergeant" },
    { id: "colonel", label: "Colonel" },
    { id: "court", label: "Prince's Court" },
  ];

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
    window.location.href = FAT_LOSS_APP;
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

  function renderHeader() {
    var user = AUTH.currentUser();
    var mode = STORE.getAppMode();
    var modeLabel = mode === "fix" ? "Fix" : mode === "test" ? "Testing" : "";
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
        TEST_RANKS.map(function (item) {
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
      '<div class="pr-head-tools">' + chip + "</div>";
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
      var on = current === tab.id || (tab.id === "home" && current === "post") || (tab.id === "learn" && (current === "course" || current === "upgrade"));
      return '<button type="button" data-go="' + tab.id + '"' + (on ? ' class="is-on"' : "") + ">" + icon(tab.icon) + "<span>" + tab.label + "</span></button>";
    }).join("");
  }

  function lockedCard(title) {
    return '<p class="pr-empty">' + esc(title) + " Private opens this. $14.97 a month.</p><button type=\"button\" class=\"pr-submit\" data-go=\"upgrade\">See the ranks</button>";
  }

  function renderHome() {
    var user = AUTH.currentUser();
    var posts = STORE.getPosts();
    var compose = AUTH.canCreatePost()
      ? '<form id="prNewPost" class="pr-letter" style="margin-bottom:16px"><h3>New post</h3><label class="pr-field"><span>Title</span><input name="title" required></label><label class="pr-field"><span>Body</span><textarea name="body" rows="3" required></textarea></label><button class="pr-submit" type="submit">Publish</button></form>'
      : "";
    mainEl.innerHTML = '<h1 class="pr-section-title">Home</h1>' + compose + posts.map(function (post) {
      var access = post.access || "private";
      var locked = !AUTH.hasTier(access);
      if (locked) {
        return '<article class="pr-course pr-locked" data-go="upgrade">' +
          (post.image ? '<img src="' + esc(post.image) + '" alt="">' : '<div class="pr-lock-ph"></div>') +
          '<div class="pr-lock-badge">🔒 ' + esc(access) + "</div>" +
          '<div class="pr-course-body"><h3>' + esc(post.title) + "</h3><p>Upgrade to open this.</p></div></article>";
      }
      var like = STORE.likeState(post.id, user.id);
      var comments = STORE.commentsFor(post.id);
      var actions = "";
      if (AUTH.canEditOwnPost(post)) actions += '<button type="button" class="pr-tiny" data-edit="' + esc(post.id) + '">Edit</button>';
      if (AUTH.canDeletePost(post)) actions += '<button type="button" class="pr-tiny" data-del="' + esc(post.id) + '">Remove</button>';
      return '<article class="pr-post pr-post--link" data-go="post/' + esc(post.id) + '" id="post-' + esc(post.id) + '"><header><strong>' + esc(post.author) + '</strong><span class="pr-badge pr-badge--' + esc(post.role || "member") + '">' + esc(post.role || "member") + "</span></header>" +
        (post.image ? '<img class="pr-post-img" src="' + esc(post.image) + '" alt="">' : "") +
        "<h3>" + esc(post.title) + "</h3><p>" + esc(postTeaser(post)) + "</p>" +
        '<div class="pr-social">' +
        '<button type="button" class="pr-like pr-like--' + like.kind + '" data-like="' + esc(post.id) + '">Like · ' + STORE.likeCount(post.id) + "</button>" +
        '<button type="button" class="pr-tiny" data-go="post/' + esc(post.id) + '">Comments · ' + comments.length + "</button>" +
        "</div>" +
        (actions ? '<div class="pr-actions">' + actions + "</div>" : "") +
        "</article>";
    }).join("");

    var form = document.getElementById("prNewPost");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = new FormData(form);
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
        render();
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
    mainEl.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        STORE.savePosts(STORE.getPosts().filter(function (post) { return post.id !== btn.dataset.del; }));
        render();
      });
    });
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
    mainEl.innerHTML =
      '<article class="pr-post pr-post-page">' +
      '<button type="button" class="pr-tiny" data-go="home">Back to Home</button>' +
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
    mainEl.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        STORE.savePosts(STORE.getPosts().filter(function (item) { return item.id !== btn.dataset.del; }));
        go("home");
      });
    });
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

  function renderLearnClasses() {
    var classes = CATALOG.classes.map(function (item) {
      return '<article class="pr-class-mini" style="border-left-color:' + topicColor(item.topic) + '"><p>' + esc(item.when) + "</p><h3>" + esc(item.title) + "</h3><p>" + esc(item.sub) + "</p></article>";
    }).join("");
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

  function addToCalendar(event) {
    var start = event.date.replace(/-/g, "") + "T" + (event.time || "12:00").replace(":", "") + "00";
    var url = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
      encodeURIComponent(event.title) +
      "&dates=" + start + "/" + start +
      "&details=" + encodeURIComponent(event.sub || "");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function renderCalendar() {
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
        return '<article class="pr-event"><div class="pr-event-bar" style="background:' + topicColor(event.topic) + '"></div><div class="pr-event-body"><h3>' + esc(event.title) + "</h3><p>" + esc(topicLabel(event.topic)) + " · " + esc(event.time) + "</p><p>" + esc(event.sub) + '</p><button type="button" class="pr-tiny" data-cal="' + esc(event.id) + '">Add to calendar</button></div></article>';
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
        "</select></label><button class='pr-submit' type='submit'>Save event</button></form>";
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
    var form = document.getElementById("prNewEvent");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = new FormData(form);
        var events = STORE.getEvents();
        events.push({
          id: STORE.uid(),
          title: data.get("title"),
          sub: data.get("sub"),
          date: data.get("date"),
          time: data.get("time"),
          topic: data.get("topic"),
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
    if (!AUTH.hasTier("ticket")) {
      mainEl.innerHTML = lockedCard("Pay $1 to open this course.");
      return;
    }
    openFatLossApp();
  }

  function renderUpgrade() {
    var cards = CATALOG.tiers.filter(function (tier) { return tier.id !== "ticket"; }).map(function (tier) {
      return '<article class="pr-offer" style="margin-bottom:12px"><strong>' + esc(tier.name) + " · " + esc(tier.label) + "</strong><span>" + esc(tier.perks) + "</span>" +
        (STORE.isTestMode()
          ? '<button type="button" class="pr-submit" style="margin-top:10px" data-buy="' + esc(tier.id) + '">Enter ' + esc(tier.name) + " (testing)</button>"
          : "") +
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
    mainEl.querySelectorAll("[data-buy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        AUTH.grantTier(btn.dataset.buy);
        go(btn.dataset.buy === "court" ? "chat" : "home");
      });
    });
  }

  function renderPay() {
    mainEl.innerHTML =
      '<article class="pr-letter"><h1>Pay $1</h1>' +
      "<p>Account is created. Next is the ticket. In live mode this becomes a Stripe Checkout session tied to your user id. A payment link alone is easy to skip. We will not use a naked success URL as the lock.</p>" +
      (STORE.isTestMode()
        ? '<button type="button" class="pr-submit" id="prPayTest">Take the $1 ticket (testing)</button>'
        : '<p>Stripe is not live. Use testing mode on the sales page to walk the product.</p>');
    var btn = document.getElementById("prPayTest");
    if (btn) {
      btn.onclick = function () {
        AUTH.grantTier("ticket");
        openFatLossApp();
      };
    }
  }

  function renderChat() {
    if (!AUTH.hasTier("private")) {
      mainEl.innerHTML = '<h1 class="pr-section-title">Chat</h1>' + lockedCard("Chat is for Private and above.");
      return;
    }
    if (AUTH.hasTier("court")) {
      mainEl.innerHTML = '<h1 class="pr-section-title">Prince\'s Court</h1><p>The small table. Princes talking to princes. Seats are few.</p>';
      return;
    }
    if (AUTH.hasTier("colonel")) {
      mainEl.innerHTML = '<h1 class="pr-section-title">Colonel</h1><p>Month-long call with the Princes and the other Colonels. Two paths: take a named seat, like a minister of war or law, or raise your own court.</p>';
      return;
    }
    if (AUTH.hasTier("sergeant")) {
      mainEl.innerHTML = '<h1 class="pr-section-title">Squad chat</h1><p>You plus 8. Open a group. Hold each other to the number.</p>';
      return;
    }
    mainEl.innerHTML = '<h1 class="pr-section-title">Unit chat</h1><p class="pr-empty">Member chat lands here next, same rooms pattern as The Minorities.</p>';
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
    mainEl.innerHTML =
      '<article class="pr-letter"><h1>' + esc(user.displayName) + "</h1>" +
      "<p>" + esc(user.email) + " · " + esc(user.age || "") + " · " + esc(user.gender || "") + "</p>" +
      "<p>Tier: " + esc(user.tier) + " · Role: " + esc(user.teamRole) + "</p>" +
      '<button type="button" class="pr-submit" data-go="upgrade">Subscriptions</button>' +
      '<button type="button" class="pr-ghost" id="prLogout" style="margin-top:10px;width:100%">Log out</button></article>';
    document.getElementById("prLogout").onclick = function () {
      AUTH.logout();
      location.href = "princesLanding.html";
    };
  }

  function render() {
    if (!requireUser()) return;
    var path = route();
    renderHeader();
    bindHeader();
    renderTabs();
    if (path === "home") renderHome();
    else if (path.indexOf("post/") === 0) renderPost(path.split("/")[1]);
    else if (path.indexOf("course/") === 0) renderCourse(path.split("/")[1]);
    else if (path === "upgrade") renderUpgrade();
    else if (path === "pay") renderPay();
    else if (path === "chat") renderChat();
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
  render();
})();
