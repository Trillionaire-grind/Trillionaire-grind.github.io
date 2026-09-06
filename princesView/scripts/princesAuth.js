(function (global) {
  var STORE = global.PRINCES_STORE;
  var TIER_RANK = { none: 0, ticket: 1, household: 2, private: 2, specialist: 3, sergeant: 4, colonel: 5, court: 6 };

  function currentUser() {
    return STORE.getSession();
  }

  function tierOf(user) {
    var tier = (user && user.tier) || "none";
    if (tier === "household") return "private";
    return tier;
  }

  function hasTier(minTier) {
    var user = currentUser();
    return TIER_RANK[tierOf(user)] >= TIER_RANK[minTier];
  }

  function roleOf(user) {
    return (user && user.teamRole) || "member";
  }

  function isLeader() {
    var role = roleOf(currentUser());
    return role === "leader" || role === "staff" || role === "owner";
  }

  function isStaff() {
    var role = roleOf(currentUser());
    return role === "staff" || role === "owner";
  }

  function isOwner() {
    return roleOf(currentUser()) === "owner";
  }

  function canCreatePost() {
    return isLeader();
  }

  function canEditOwnPost(post) {
    var user = currentUser();
    if (!user || !post) return false;
    return post.authorId === user.id && isLeader();
  }

  function canDeletePost(post) {
    if (isStaff()) return true;
    return canEditOwnPost(post);
  }

  function canEditCalendar() {
    return isStaff();
  }

  function hashPass(password) {
    return "p:" + String(password || "").length + ":" + String(password || "").split("").reverse().join("");
  }

  function register(fields) {
    var email = String(fields.email || "").trim().toLowerCase();
    if (!email || !fields.password) throw new Error("Email and password are required.");
    if (STORE.findUserByEmail(email)) throw new Error("That email already has an account.");
    var user = {
      id: STORE.uid(),
      app: "princes",
      firstName: String(fields.firstName || "").trim(),
      lastName: String(fields.lastName || "").trim(),
      displayName: [fields.firstName, fields.lastName].filter(Boolean).join(" ") || "Prince",
      age: Number(fields.age) || null,
      gender: fields.gender || "",
      email: email,
      pass: hashPass(fields.password),
      tier: "none",
      teamRole: "member",
      createdAt: STORE.nowIso(),
    };
    if (STORE.isTestMode() && !STORE.getUsers().some(function (item) { return item.teamRole === "owner"; })) {
      user.teamRole = "owner";
    }
    STORE.upsertUser(user);
    STORE.setSession(user);
    return user;
  }

  function login(email, password) {
    var user = STORE.findUserByEmail(email);
    if (!user || user.pass !== hashPass(password)) throw new Error("Email or password is wrong.");
    STORE.setSession(user);
    return user;
  }

  function logout() {
    STORE.setSession(null);
  }

  function grantTier(tierId) {
    var user = currentUser();
    if (!user) throw new Error("Create an account first.");
    user.tier = tierId;
    user.paidAt = STORE.nowIso();
    STORE.upsertUser(user);
    STORE.setSession(user);
    return user;
  }

  function setRole(userId, teamRole) {
    if (!isStaff()) throw new Error("Staff only.");
    var users = STORE.getUsers();
    var user = users.find(function (item) { return item.id === userId; });
    if (!user) throw new Error("User not found.");
    user.teamRole = teamRole;
    STORE.upsertUser(user);
    return user;
  }

  global.PRINCES_AUTH = {
    currentUser: currentUser,
    hasTier: hasTier,
    roleOf: roleOf,
    isLeader: isLeader,
    isStaff: isStaff,
    isOwner: isOwner,
    canCreatePost: canCreatePost,
    canEditOwnPost: canEditOwnPost,
    canDeletePost: canDeletePost,
    canEditCalendar: canEditCalendar,
    register: register,
    login: login,
    logout: logout,
    grantTier: grantTier,
    setRole: setRole,
    TIER_RANK: TIER_RANK,
  };
})(window);
