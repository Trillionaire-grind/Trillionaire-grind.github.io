(function (global) {
  var KEY_USER = "princes.user";
  var KEY_USERS = "princes.users";
  var KEY_POSTS = "princes.posts";
  var KEY_EVENTS = "princes.events";
  var KEY_TEST = "princes.testMode";
  var KEY_MODE = "princes.appMode";
  var KEY_ADMIN = "princes.adminOn";
  var KEY_LIKES = "princes.likes";
  var KEY_COMMENTS = "princes.comments";
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
    return getAppMode() === "test" || localStorage.getItem(KEY_TEST) === "1";
  }

  function setTestMode(on) {
    if (on) localStorage.setItem(KEY_TEST, "1");
    else localStorage.removeItem(KEY_TEST);
  }

  function getAppMode() {
    return localStorage.getItem(KEY_MODE) || "";
  }

  function setAppMode(mode) {
    localStorage.setItem(KEY_MODE, mode);
    setTestMode(mode === "test" || mode === "fix");
  }

  function isAdminOn() {
    return localStorage.getItem(KEY_ADMIN) === "1";
  }

  function setAdminOn(on) {
    if (on) localStorage.setItem(KEY_ADMIN, "1");
    else localStorage.removeItem(KEY_ADMIN);
  }

  function likeSession() {
    try {
      var id = sessionStorage.getItem("princes.likeSession");
      if (!id) {
        id = uid();
        sessionStorage.setItem("princes.likeSession", id);
      }
      return id;
    } catch (_) {
      return "session";
    }
  }

  function getLikes() {
    return read(KEY_LIKES, {});
  }

  function likeState(postId, userId) {
    var row = (getLikes()[postId] || {})[userId];
    if (!row) return { count: 0, kind: "none" };
    return {
      count: row.count || 1,
      kind: row.session === likeSession() ? "now" : "prior",
    };
  }

  function likeCount(postId) {
    var map = getLikes()[postId] || {};
    return Object.keys(map).reduce(function (sum, key) {
      return sum + (map[key].count || 1);
    }, 0);
  }

  function addLike(postId, userId) {
    var all = getLikes();
    if (!all[postId]) all[postId] = {};
    var row = all[postId][userId] || { count: 0, session: "" };
    row.count += 1;
    row.session = likeSession();
    all[postId][userId] = row;
    write(KEY_LIKES, all);
    return likeState(postId, userId);
  }

  function getComments() {
    return read(KEY_COMMENTS, {});
  }

  function commentsFor(postId) {
    return getComments()[postId] || [];
  }

  function addComment(postId, comment) {
    var all = getComments();
    if (!all[postId]) all[postId] = [];
    all[postId].push(comment);
    write(KEY_COMMENTS, all);
    return all[postId];
  }

  function addPerson(fields) {
    var email = String(fields.email || "").trim().toLowerCase();
    if (!email) throw new Error("Email is required.");
    if (findUserByEmail(email)) throw new Error("That email is already in the unit.");
    var user = {
      id: uid(),
      app: "princes",
      displayName: String(fields.name || "Recruit").trim(),
      firstName: String(fields.name || "Recruit").trim(),
      lastName: "",
      email: email,
      age: 22,
      gender: "male",
      pass: "demo",
      tier: fields.tier || "private",
      teamRole: fields.teamRole || "member",
      demo: true,
      createdAt: nowIso(),
    };
    upsertUser(user);
    return user;
  }

  function removePerson(userId) {
    var session = getSession();
    if (session && session.id === userId) throw new Error("You cannot remove yourself.");
    saveUsers(getUsers().filter(function (item) { return item.id !== userId; }));
  }

  function getBrandName() {
    return localStorage.getItem(KEY_BRAND) || global.PRINCES_CATALOG.brand;
  }

  function setBrandName(name) {
    localStorage.setItem(KEY_BRAND, name);
  }

  function getLogo() {
    return global.PRINCES_CATALOG.workingLogo;
  }

  function seedUnit() {
    var owner = {
      id: "demo_marcus",
      app: "princes",
      firstName: "Marcus",
      lastName: "Vale",
      displayName: "Marcus Vale",
      age: 22,
      gender: "male",
      email: "marcus@princes.demo",
      pass: "demo",
      tier: "colonel",
      teamRole: "owner",
      demo: true,
      createdAt: nowIso(),
    };
    var recruit = {
      id: "demo_recruit",
      app: "princes",
      firstName: "Recruit",
      lastName: "Tester",
      displayName: "Recruit Tester",
      age: 22,
      gender: "male",
      email: "recruit@princes.demo",
      pass: "demo",
      tier: "ticket",
      teamRole: "member",
      demo: true,
      createdAt: nowIso(),
    };
    var squad = [
      { id: "demo_cole", displayName: "Cole Hart", email: "cole@princes.demo", tier: "sergeant", teamRole: "leader", age: 24 },
      { id: "demo_diaz", displayName: "Diaz Reed", email: "diaz@princes.demo", tier: "specialist", teamRole: "member", age: 22 },
      { id: "demo_hale", displayName: "Hale Orth", email: "hale@princes.demo", tier: "private", teamRole: "member", age: 21 },
      { id: "demo_kim", displayName: "Kim Sato", email: "kim@princes.demo", tier: "sergeant", teamRole: "leader", age: 27 },
      { id: "demo_ross", displayName: "Ross Quinn", email: "ross@princes.demo", tier: "specialist", teamRole: "member", age: 23 },
      { id: "demo_wade", displayName: "Wade Pell", email: "wade@princes.demo", tier: "private", teamRole: "member", age: 22 },
      { id: "demo_nash", displayName: "Nash Iver", email: "nash@princes.demo", tier: "colonel", teamRole: "staff", age: 29 },
      { id: "demo_beck", displayName: "Beck Lang", email: "beck@princes.demo", tier: "specialist", teamRole: "member", age: 25 },
    ];
    var users = [owner, recruit].concat(squad.map(function (item) {
      return Object.assign({
        app: "princes",
        firstName: item.displayName.split(" ")[0],
        lastName: item.displayName.split(" ")[1] || "",
        pass: "demo",
        demo: true,
        gender: "male",
        createdAt: nowIso(),
      }, item);
    }));
    write(KEY_USERS, users);

    write(KEY_POSTS, [
      { id: "d1", author: "Marcus Vale", authorId: "demo_marcus", role: "owner", title: "The $1 law", body: "Pay the dollar. Open the fat course. That is the first order a recruit gives himself.", topic: "body", access: "ticket", image: "princesView/assets/courses/body.png", createdAt: nowIso() },
      { id: "d2", author: "Cole Hart", authorId: "demo_cole", role: "leader", title: "Shirt off Friday", body: "Waist is 31. Shirt comes off at the pool this weekend. No sweater. No story.", topic: "body", access: "private", createdAt: nowIso() },
      { id: "d3", author: "Diaz Reed", authorId: "demo_diaz", role: "member", title: "Stopped tugging the shirt", body: "Three weeks in. The gut is leaving. I tucked the shirt in today.", topic: "body", access: "private", createdAt: nowIso() },
      { id: "d4", author: "Kim Sato", authorId: "demo_kim", role: "leader", title: "Specialist tape: protein week", body: "Every course is open at Specialist. This tape is the protein week recap.", topic: "body", access: "specialist", createdAt: nowIso() },
      { id: "d5", author: "Cole Hart", authorId: "demo_cole", role: "leader", title: "Squad check", body: "Eight men posted numbers. Two missed. They hear about it on the call.", topic: "mindset", access: "sergeant", createdAt: nowIso() },
      { id: "d6", author: "Nash Iver", authorId: "demo_nash", role: "staff", title: "Colonel call is live", body: "Month-long room with the Princes. Two paths: take a seat or raise your own command.", topic: "business", access: "colonel", createdAt: nowIso() },
      { id: "d7", author: "Marcus Vale", authorId: "demo_marcus", role: "owner", title: "Prince's Court notes", body: "The small table. Seats are few. This post stays locked until you are on the court.", topic: "city", access: "court", createdAt: nowIso() },
    ]);

    write(KEY_COMMENTS, {
      d1: [{ id: "c1", author: "Cole Hart", authorId: "demo_cole", body: "Paid it. Course is open.", createdAt: nowIso() }],
      d2: [{ id: "c2", author: "Diaz Reed", authorId: "demo_diaz", body: "I am in. No sweater this week.", createdAt: nowIso() }],
    });
    write(KEY_LIKES, {
      d1: { demo_cole: { count: 2, session: "prior-seed" }, demo_diaz: { count: 1, session: "prior-seed" } },
      d2: { demo_hale: { count: 3, session: "prior-seed" } },
    });
    write(KEY_EVENTS, (global.PRINCES_CATALOG.events || []).slice());
    return { owner: owner, recruit: recruit };
  }

  function seedDemo() {
    return seedUnit().owner;
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
    getAppMode: getAppMode,
    setAppMode: setAppMode,
    isAdminOn: isAdminOn,
    setAdminOn: setAdminOn,
    likeState: likeState,
    likeCount: likeCount,
    addLike: addLike,
    commentsFor: commentsFor,
    addComment: addComment,
    addPerson: addPerson,
    removePerson: removePerson,
    seedUnit: seedUnit,
    getBrandName: getBrandName,
    setBrandName: setBrandName,
    getLogo: getLogo,
    setLogo: setLogo,
    seedDemo: seedDemo,
    KEY_TEST: KEY_TEST,
  };
})(window);
