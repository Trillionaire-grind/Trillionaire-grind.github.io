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

  function requireUser() {
    var user = AUTH.currentUser();
    if (!user) {
      location.href = "princesLanding.html";
      return null;
    }
    return user;
  }

  function renderHeader() {
    var user = AUTH.currentUser();
    var role = user ? user.teamRole : "member";
    var badge = "";
    if (role === "owner") badge = '<span class="pr-badge pr-badge--owner">Owner</span>';
    else if (role === "staff") badge = '<span class="pr-badge pr-badge--staff">Staff</span>';
    else if (role === "leader") badge = '<span class="pr-badge pr-badge--leader">Leader</span>';
    headerEl.innerHTML =
      '<a class="pr-brand" href="#learn"><img src="' + esc(STORE.getLogo()) + '" alt=""><span>' + esc(STORE.getBrandName()) + "</span></a>" +
      '<div style="display:flex;align-items:center;gap:8px">' + badge +
      '<button type="button" class="pr-login" data-go="profile">You</button></div>';
  }

  function renderTabs() {
    var current = route().split("/")[0];
    var tabs = [
      { id: "home", label: "Home" },
      { id: "learn", label: "Learn" },
      { id: "chat", label: "Chat" },
    ];
    if (AUTH.isStaff()) tabs.push({ id: "admin", label: "Admin" });
    tabEl.innerHTML = tabs.map(function (tab) {
      var on = current === tab.id || (tab.id === "learn" && (current === "course" || current === "upgrade"));
      return '<button type="button" data-go="' + tab.id + '"' + (on ? ' class="is-on"' : "") + ">" + tab.label + "</button>";
    }).join("");
  }

  function lockedCard(title) {
    return '<p class="pr-empty">' + esc(title) + ' The Household opens this. $14.97 a month.</p><button type="button" class="pr-submit" data-go="upgrade">See The Household</button>';
  }

  function renderHome() {
    if (!AUTH.hasTier("household")) {
      mainEl.innerHTML = '<h1 class="pr-section-title">Home</h1>' + lockedCard("Posts are for The Household.");
      return;
    }
    var posts = STORE.getPosts();
    var compose = AUTH.canCreatePost()
      ? '<form id="prNewPost" class="pr-letter" style="margin-bottom:16px"><h3>New post</h3><label class="pr-field"><span>Title</span><input name="title" required></label><label class="pr-field"><span>Body</span><textarea name="body" rows="3" required></textarea></label><button class="pr-submit" type="submit">Publish</button></form>'
      : "";
    mainEl.innerHTML = '<h1 class="pr-section-title">Home</h1>' + compose + posts.map(function (post) {
      var actions = "";
      if (AUTH.canEditOwnPost(post)) actions += '<button type="button" class="pr-tiny" data-edit="' + esc(post.id) + '">Edit</button>';
      if (AUTH.canDeletePost(post)) actions += '<button type="button" class="pr-tiny" data-del="' + esc(post.id) + '">Remove</button>';
      return '<article class="pr-post"><header><strong>' + esc(post.author) + '</strong><span class="pr-badge pr-badge--' + esc(post.role || "member") + '">' + esc(post.role || "member") + "</span></header>" +
        "<h3>" + esc(post.title) + "</h3><p>" + esc(post.body) + "</p>" +
        (actions ? '<div class="pr-actions">' + actions + "</div>" : "") +
        "</article>";
    }).join("");

    var form = document.getElementById("prNewPost");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var user = AUTH.currentUser();
        var data = new FormData(form);
        var postsNow = STORE.getPosts();
        postsNow.unshift({
          id: STORE.uid(),
          author: user.displayName,
          authorId: user.id,
          role: user.teamRole,
          title: data.get("title"),
          body: data.get("body"),
          createdAt: STORE.nowIso(),
        });
        STORE.savePosts(postsNow);
        render();
      });
    }
    mainEl.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var postsNow = STORE.getPosts().filter(function (post) { return post.id !== btn.dataset.del; });
        STORE.savePosts(postsNow);
        render();
      });
    });
    mainEl.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
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

  function renderLearnClasses() {
    var classes = CATALOG.classes.map(function (item) {
      return '<article class="pr-class-mini" style="border-left-color:' + topicColor(item.topic) + '"><p>' + esc(item.when) + "</p><h3>" + esc(item.title) + "</h3><p>" + esc(item.sub) + "</p></article>";
    }).join("");
    var courses = CATALOG.courses.map(function (course) {
      var locked = !AUTH.hasTier(course.access);
      return '<article class="pr-course' + (locked ? " pr-locked" : "") + '" data-go="' + (locked ? "upgrade" : "course/" + course.id) + '">' +
        (locked ? '<div class="pr-lock-badge">Household</div>' : "") +
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
    mainEl.innerHTML =
      '<article class="pr-course-read"><p class="pr-kicker" style="color:#111">Course</p>' +
      "<h1>How to lose fat as fast as humanly possible</h1>" +
      "<p>Your body is your first kingdom. Every man here is aiming at 10% body fat. This is the first course. The Household is the next room.</p>" +
      "<p>Open the fat-loss system. Use the ledger. Come back for class.</p>" +
      '<a class="pr-upgrade" href="/fatLoss.html" target="_blank" rel="noopener noreferrer">Open the fat-loss book and ledger</a>' +
      '<button type="button" class="pr-upgrade" data-go="upgrade" style="border:none;width:100%;cursor:pointer">Read the Household letter</button>' +
      "</article>";
  }

  function renderUpgrade() {
    mainEl.innerHTML =
      '<article class="pr-letter"><p class="pr-kicker" style="color:#111">The next room</p>' +
      "<h1>The Household · $14.97 a month</h1>" +
      "<p>The $1 ticket got you the first course. The Household is where aspiring princes meet: live classes, the calendar, posts, and chat.</p>" +
      "<p>Squires stay with the fat course. Household members walk the rest of the court.</p>" +
      "<p>Prince's Court sits above this. One million a year. Princes talking to princes. That room is not this page.</p>" +
      '<button type="button" class="pr-submit" id="prBuyHousehold">Enter The Household</button></article>';
    document.getElementById("prBuyHousehold").onclick = function () {
      if (STORE.isTestMode()) {
        AUTH.grantTier("household");
        go("home");
        return;
      }
      alert("Live Stripe for The Household is not wired yet. Turn on testing mode on the sales page to preview access.");
    };
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
        go("course/body");
      };
    }
  }

  function renderChat() {
    if (!AUTH.hasTier("household")) {
      mainEl.innerHTML = '<h1 class="pr-section-title">Chat</h1>' + lockedCard("Chat is for The Household.");
      return;
    }
    if (AUTH.hasTier("court")) {
      mainEl.innerHTML = '<h1 class="pr-section-title">Prince\'s Court</h1><p>Private mastermind. This room is for princes only.</p>';
      return;
    }
    mainEl.innerHTML = '<h1 class="pr-section-title">Household chat</h1><p class="pr-empty">Member chat lands here next, same rooms pattern as The Minorities.</p>';
  }

  function renderAdmin() {
    if (!AUTH.isStaff()) {
      mainEl.innerHTML = '<p class="pr-empty">Staff only.</p>';
      return;
    }
    var users = STORE.getUsers();
    mainEl.innerHTML =
      '<h1 class="pr-section-title">Admin</h1>' +
      "<p>Staff can remove posts and edit the calendar. Owner has the same doors, with an Owner badge. Leader can publish and edit or remove their own posts.</p>" +
      users.map(function (user) {
        return '<article class="pr-post"><strong>' + esc(user.displayName) + "</strong> · " + esc(user.email) +
          "<p>Tier: " + esc(user.tier) + " · Role: " + esc(user.teamRole) + "</p>" +
          '<div class="pr-actions">' +
          '<button type="button" class="pr-tiny" data-role="' + esc(user.id) + ':leader">Leader</button>' +
          '<button type="button" class="pr-tiny" data-role="' + esc(user.id) + ':staff">Staff</button>' +
          '<button type="button" class="pr-tiny" data-role="' + esc(user.id) + ':owner">Owner</button>' +
          '<button type="button" class="pr-tiny" data-role="' + esc(user.id) + ':member">Member</button>' +
          "</div></article>";
      }).join("") || '<p class="pr-empty">No members yet.</p>';
    mainEl.querySelectorAll("[data-role]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var parts = btn.dataset.role.split(":");
        AUTH.setRole(parts[0], parts[1]);
        if (AUTH.currentUser() && AUTH.currentUser().id === parts[0]) {
          var me = STORE.getUsers().find(function (item) { return item.id === parts[0]; });
          STORE.setSession(me);
        }
        render();
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
    renderTabs();
    if (path === "home") renderHome();
    else if (path.indexOf("course/") === 0) renderCourse(path.split("/")[1]);
    else if (path === "upgrade") renderUpgrade();
    else if (path === "pay") renderPay();
    else if (path === "chat") renderChat();
    else if (path === "admin") renderAdmin();
    else if (path === "profile") renderProfile();
    else renderLearn();
  }

  document.addEventListener("click", function (event) {
    var goTo = event.target.closest("[data-go]");
    if (!goTo) return;
    event.preventDefault();
    go(goTo.getAttribute("data-go"));
  });

  window.addEventListener("hashchange", render);
  render();
})();
