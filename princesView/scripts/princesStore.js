(function (global) {
  var KEY_USER = "princes.user";
  var KEY_USERS = "princes.users";
  var KEY_POSTS = "princes.posts";
  var KEY_EVENTS = "princes.events";
  var KEY_TEST = "princes.testMode";
  var KEY_BRAND = "princes.brandName";
  var KEY_LOGO = "princes.logo";

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid() {
    return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function getUsers() {
    return read(KEY_USERS, []);
  }

  function saveUsers(users) {
    write(KEY_USERS, users);
  }

  function getSession() {
    return read(KEY_USER, null);
  }

  function setSession(user) {
    if (!user) {
      localStorage.removeItem(KEY_USER);
      return;
    }
    write(KEY_USER, user);
  }

  function upsertUser(user) {
    var users = getUsers();
    var index = users.findIndex(function (item) {
      return item.id === user.id || item.email === user.email;
    });
    if (index >= 0) users[index] = user;
    else users.push(user);
    saveUsers(users);
    var session = getSession();
    if (session && session.id === user.id) setSession(user);
    return user;
  }

  function findUserByEmail(email) {
    var needle = String(email || "").trim().toLowerCase();
    return getUsers().find(function (item) {
      return item.email === needle;
    }) || null;
  }

  function getPosts() {
    var posts = read(KEY_POSTS, null);
    if (posts) return posts;
    posts = (global.PRINCES_CATALOG.seedPosts || []).map(function (post) {
      return Object.assign({ createdAt: nowIso(), authorId: "seed" }, post);
    });
    write(KEY_POSTS, posts);
    return posts;
  }

  function savePosts(posts) {
    write(KEY_POSTS, posts);
  }

  function getEvents() {
    var events = read(KEY_EVENTS, null);
    if (events) return events;
    events = (global.PRINCES_CATALOG.events || []).slice();
    write(KEY_EVENTS, events);
    return events;
  }

  function saveEvents(events) {
    write(KEY_EVENTS, events);
  }

  function isTestMode() {
    return localStorage.getItem(KEY_TEST) === "1";
  }

  function setTestMode(on) {
    if (on) localStorage.setItem(KEY_TEST, "1");
    else localStorage.removeItem(KEY_TEST);
  }

  function getBrandName() {
    return localStorage.getItem(KEY_BRAND) || global.PRINCES_CATALOG.brand;
  }

  function setBrandName(name) {
    localStorage.setItem(KEY_BRAND, name);
  }

  function getLogo() {
    var saved = localStorage.getItem(KEY_LOGO);
    if (!saved || saved.indexOf("crown") !== -1) return global.PRINCES_CATALOG.workingLogo;
    return saved;
  }

  function setLogo(src) {
    localStorage.setItem(KEY_LOGO, src);
  }

  global.PRINCES_STORE = {
    uid: uid,
    nowIso: nowIso,
    getSession: getSession,
    setSession: setSession,
    upsertUser: upsertUser,
    findUserByEmail: findUserByEmail,
    getUsers: getUsers,
    getPosts: getPosts,
    savePosts: savePosts,
    getEvents: getEvents,
    saveEvents: saveEvents,
    isTestMode: isTestMode,
    setTestMode: setTestMode,
    getBrandName: getBrandName,
    setBrandName: setBrandName,
    getLogo: getLogo,
    setLogo: setLogo,
    KEY_TEST: KEY_TEST,
  };
})(window);
