import { isLoginFirebaseConfigured } from "./loginFirebaseConfig.js";
import { resolveDemoMode, reloadWithMode } from "./loginMode.js";
import { loginVersionLabel } from "./loginVersion.js";
import {
  getLoginProfile,
  getLoginUser,
  initLoginAuth as bootAuth,
  loginAccount as firebaseLogin,
  logoutAccount as firebaseLogout,
  onLoginAuthChange as onFirebaseAuthChange,
  registerAccount as firebaseRegister,
  resetLoginPassword,
  saveMemberProfile as firebaseSaveProfile,
  uploadProfilePhoto as firebaseUploadPhoto,
  waitForLoginAuthReady as waitFirebaseAuth,
} from "./loginAuth.js";
import {
  demoLoadAdminData,
  demoLoadMembers,
  demoLoadMyCheckins,
  demoQuickLogin,
  demoRecordCheckIn,
  demoResetAll,
  getLoginProfile as getDemoProfile,
  getLoginUser as getDemoUser,
  initLoginDemo,
  loginAccount as demoLogin,
  logoutAccount as demoLogout,
  onLoginAuthChange as onDemoAuthChange,
  registerAccount as demoRegister,
  saveMemberProfile as demoSaveProfile,
  uploadProfilePhoto as demoUploadPhoto,
  waitForLoginAuthReady as waitDemoAuth,
} from "./loginDemo.js";
import { getLoginDb } from "./loginFirebase.js";
import {
  CHECKINS_COLLECTION,
  MEMBERS_COLLECTION,
  dateKeyFromDate,
  displayName,
  formatDateTime,
  memberMatchesQuery,
  normalizeMember,
} from "./loginSchema.js";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const wantsCheckIn = params.get("checkin") === "1" || params.get("from") === "qr";
const firebaseReady = isLoginFirebaseConfigured();
const demoMode = resolveDemoMode(params, firebaseReady);

const authApi = demoMode
  ? {
      boot: initLoginDemo,
      onChange: onDemoAuthChange,
      wait: waitDemoAuth,
      getUser: getDemoUser,
      getProfile: getDemoProfile,
      login: demoLogin,
      register: demoRegister,
      logout: demoLogout,
      saveProfile: demoSaveProfile,
      uploadPhoto: demoUploadPhoto,
    }
  : {
      boot: bootAuth,
      onChange: onFirebaseAuthChange,
      wait: waitFirebaseAuth,
      getUser: getLoginUser,
      getProfile: getLoginProfile,
      login: firebaseLogin,
      register: firebaseRegister,
      logout: firebaseLogout,
      saveProfile: firebaseSaveProfile,
      uploadPhoto: firebaseUploadPhoto,
    };

const els = {
  demoBanner: document.getElementById("demoBanner"),
  demoQuickRow: document.getElementById("demoQuickRow"),
  demoAsGuestBtn: document.getElementById("demoAsGuestBtn"),
  demoResetBtn: document.getElementById("demoResetBtn"),
  netHeader: document.getElementById("netHeader"),
  headerProfileBtn: document.getElementById("headerProfileBtn"),
  headerAvatarImg: document.getElementById("headerAvatarImg"),
  headerAvatarPh: document.getElementById("headerAvatarPh"),
  loginTopMeta: document.getElementById("loginTopMeta"),
  setupView: document.getElementById("setupView"),
  authView: document.getElementById("authView"),
  appView: document.getElementById("appView"),
  checkinGate: document.getElementById("checkinGate"),
  profileModal: document.getElementById("profileModal"),
  adminView: document.getElementById("adminView"),
  version: document.getElementById("loginVersion"),
  authTabs: document.querySelectorAll("[data-auth-tab]"),
  loginPanel: document.getElementById("loginPanel"),
  registerPanel: document.getElementById("registerPanel"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  resetBtn: document.getElementById("resetPasswordBtn"),
  authMsg: document.getElementById("authMsg"),
  checkinBtn: document.getElementById("checkinBtn"),
  checkinGateMsg: document.getElementById("checkinGateMsg"),
  footerNav: document.getElementById("footerNav"),
  footerMembersBtn: document.getElementById("footerMembersBtn"),
  footerCheckinsBtn: document.getElementById("footerCheckinsBtn"),
  footerCheckinBtn: document.getElementById("footerCheckinBtn"),
  footerAdminBtn: document.getElementById("footerAdminBtn"),
  footerSignOutBtn: document.getElementById("footerSignOutBtn"),
  modeDemoBtn: document.getElementById("modeDemoBtn"),
  modeLiveBtn: document.getElementById("modeLiveBtn"),
  memberSearch: document.getElementById("memberSearch"),
  memberGrid: document.getElementById("memberGrid"),
  myCheckinsList: document.getElementById("myCheckinsList"),
  directorySection: document.getElementById("directorySection"),
  directoryLocked: document.getElementById("directoryLocked"),
  directoryBrowse: document.getElementById("directoryBrowse"),
  directoryMissedCount: document.getElementById("directoryMissedCount"),
  directoryMissedLabel: document.getElementById("directoryMissedLabel"),
  directoryOpenSwitch: document.getElementById("directoryOpenSwitch"),
  checkinsSection: document.getElementById("checkinsSection"),
  profileForm: document.getElementById("profileForm"),
  profilePhotoInput: document.getElementById("profilePhotoInput"),
  profileOpenSwitch: document.getElementById("profileOpenSwitch"),
  profileSheetName: document.getElementById("profileSheetName"),
  profileSheetBusiness: document.getElementById("profileSheetBusiness"),
  profileSheetImg: document.getElementById("profileSheetImg"),
  profileSheetPh: document.getElementById("profileSheetPh"),
  closeProfileModal: document.getElementById("closeProfileModal"),
  profileMsg: document.getElementById("profileMsg"),
  adminBackBtn: document.getElementById("adminBackBtn"),
  adminPrintBtn: document.getElementById("adminPrintBtn"),
  adminExportBtn: document.getElementById("adminExportBtn"),
  adminStatMembers: document.getElementById("adminStatMembers"),
  adminStatCheckedToday: document.getElementById("adminStatCheckedToday"),
  adminStatNever: document.getElementById("adminStatNever"),
  adminMembersTable: document.getElementById("adminMembersTable"),
  adminCheckinsTable: document.getElementById("adminCheckinsTable"),
};

let membersCache = [];
let myCheckinsCache = [];
let adminMembers = [];
let adminCheckinsToday = [];

function show(el) {
  if (el) el.classList.remove("login-hidden");
}

function hide(el) {
  if (el) el.classList.add("login-hidden");
}

function setMsg(el, text, kind) {
  if (!el) return;
  el.textContent = text || "";
  el.classList.remove("is-error", "is-ok");
  if (kind) el.classList.add(`is-${kind}`);
}

function checkinMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  return new Date(value).getTime() || 0;
}

function initials(profile) {
  const name = displayName(profile);
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

function renderAvatarPair(imgEl, phEl, profile) {
  const url = profile?.photoUrl;
  if (url && imgEl && phEl) {
    imgEl.src = url;
    imgEl.alt = displayName(profile);
    show(imgEl);
    hide(phEl);
  } else if (imgEl && phEl) {
    imgEl.removeAttribute("src");
    imgEl.alt = "";
    hide(imgEl);
    phEl.textContent = initials(profile);
    show(phEl);
  }
}

function updateModeFooter() {
  els.modeDemoBtn?.classList.toggle("is-active-demo", demoMode);
  els.modeDemoBtn?.classList.toggle("is-active", demoMode);
  els.modeLiveBtn?.classList.toggle("is-active", !demoMode);
}

if (els.version) {
  els.version.textContent = loginVersionLabel() + (demoMode ? " · demo" : " · live");
}
updateModeFooter();

if (demoMode) {
  show(els.demoBanner);
  show(els.demoQuickRow);
} else {
  hide(els.demoBanner);
  hide(els.demoQuickRow);
}

function showAuthTab(tab) {
  els.authTabs.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.authTab === tab);
  });
  if (tab === "login") {
    show(els.loginPanel);
    hide(els.registerPanel);
  } else {
    hide(els.loginPanel);
    show(els.registerPanel);
  }
  setMsg(els.authMsg, "");
}

els.authTabs.forEach((btn) => {
  btn.addEventListener("click", () => showAuthTab(btn.dataset.authTab));
});

function setAppTab(tab) {
  if (tab === "checkins") {
    hide(els.directorySection);
    show(els.checkinsSection);
  } else {
    show(els.directorySection);
    hide(els.checkinsSection);
  }
  els.footerMembersBtn?.classList.toggle("is-active", tab === "members");
  els.footerCheckinsBtn?.classList.toggle("is-active", tab === "checkins");
}

async function recordCheckIn() {
  if (demoMode) {
    await demoRecordCheckIn();
    return;
  }
  const user = authApi.getUser();
  const profile = authApi.getProfile();
  const db = getLoginDb();
  if (!user || !profile || !db) throw new Error("Sign in to check in.");
  const now = new Date();
  await addDoc(collection(db, CHECKINS_COLLECTION), {
    uid: user.uid,
    memberName: displayName(profile),
    businessName: profile.businessName || "",
    checkedInAt: serverTimestamp(),
    dateKey: dateKeyFromDate(now),
  });
}

async function loadMembers() {
  if (demoMode) {
    membersCache = await demoLoadMembers();
    return membersCache;
  }
  const db = getLoginDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, MEMBERS_COLLECTION));
  membersCache = snap.docs
    .map((d) => normalizeMember(d.id, d.data()))
    .sort((a, b) => displayName(a).localeCompare(displayName(b)));
  return membersCache;
}

async function loadMyCheckins() {
  if (demoMode) {
    myCheckinsCache = await demoLoadMyCheckins();
    return myCheckinsCache;
  }
  const user = authApi.getUser();
  const db = getLoginDb();
  if (!user || !db) return [];
  const q = query(
    collection(db, CHECKINS_COLLECTION),
    where("uid", "==", user.uid),
    orderBy("checkedInAt", "desc"),
  );
  const snap = await getDocs(q);
  myCheckinsCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return myCheckinsCache;
}

function countOpenContacts(excludeUid) {
  return membersCache.filter(
    (m) => m.uid !== excludeUid && m.profileOpen !== false,
  ).length;
}

function syncProfileOpenSwitches(profile) {
  const open = profile?.profileOpen !== false;
  if (els.profileOpenSwitch) els.profileOpenSwitch.checked = open;
  if (els.directoryOpenSwitch) els.directoryOpenSwitch.checked = open;
}

function renderDirectoryAccess(profile) {
  if (!profile) return;
  const open = profile.profileOpen !== false;
  const missed = countOpenContacts(profile.uid);

  if (els.directoryMissedCount) els.directoryMissedCount.textContent = String(missed);
  if (els.directoryMissedLabel) {
    els.directoryMissedLabel.textContent = missed === 1 ? "contact" : "contacts";
  }

  syncProfileOpenSwitches(profile);

  if (open) {
    hide(els.directoryLocked);
    show(els.directoryBrowse);
  } else {
    show(els.directoryLocked);
    hide(els.directoryBrowse);
  }
}

async function updateProfileOpen(isOpen) {
  const profile = await authApi.saveProfile({ profileOpen: isOpen });
  renderAppChrome(profile);
  renderDirectoryAccess(profile);
  if (isOpen) {
    renderMemberGrid(els.memberSearch?.value || "");
  }
  return profile;
}

function renderMemberGrid(filterText) {
  if (!els.memberGrid) return;
  const profile = authApi.getProfile();
  if (profile?.profileOpen === false) return;

  const user = authApi.getUser();
  const list = membersCache.filter(
    (m) =>
      m.uid !== user?.uid &&
      m.profileOpen !== false &&
      memberMatchesQuery(m, filterText),
  );
  els.memberGrid.innerHTML = "";
  if (!list.length) {
    els.memberGrid.innerHTML = `<p class="login-lead">No open profiles match that search yet.</p>`;
    return;
  }
  list.forEach((m) => {
    const card = document.createElement("article");
    card.className = "member-card";
    const img = m.photoUrl
      ? `<img src="${escapeAttr(m.photoUrl)}" alt="">`
      : `<div class="net-header__avatar" style="width:56px;height:56px;font-size:16px;margin-bottom:10px;">${escapeHtml(initials(m))}</div>`;
    card.innerHTML = `
      ${img}
      <h3>${escapeHtml(displayName(m))}</h3>
      <p class="biz">${escapeHtml(m.businessName || "—")}</p>
      <p class="help">${escapeHtml(m.helpDescription || "")}</p>
    `;
    els.memberGrid.appendChild(card);
  });
}

function renderMyCheckins() {
  if (!els.myCheckinsList) return;
  els.myCheckinsList.innerHTML = "";
  if (!myCheckinsCache.length) {
    els.myCheckinsList.innerHTML = `<li><span>No check-ins yet.</span></li>`;
    return;
  }
  myCheckinsCache.forEach((row) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${escapeHtml(formatDateTime(row.checkedInAt))}</span><span>${escapeHtml(row.dateKey || "")}</span>`;
    els.myCheckinsList.appendChild(li);
  });
}

function fillProfileForm(profile) {
  if (!els.profileForm || !profile) return;
  const f = els.profileForm.elements;
  f.name.value = profile.name || "";
  f.preferredName.value = profile.preferredName || "";
  f.phone.value = profile.phone || "";
  f.businessName.value = profile.businessName || "";
  f.helpDescription.value = profile.helpDescription || "";
  f.email.value = profile.email || "";
  syncProfileOpenSwitches(profile);
}

function renderAppChrome(profile) {
  if (!profile) return;
  renderAvatarPair(els.headerAvatarImg, els.headerAvatarPh, profile);
  renderAvatarPair(els.profileSheetImg, els.profileSheetPh, profile);
  if (els.profileSheetName) els.profileSheetName.textContent = displayName(profile);
  if (els.profileSheetBusiness) els.profileSheetBusiness.textContent = profile.businessName || "—";
  if (profile.admin) show(els.footerAdminBtn);
  else hide(els.footerAdminBtn);
}

async function refreshAppData() {
  await loadMembers();
  await loadMyCheckins();
  const profile = authApi.getProfile();
  renderDirectoryAccess(profile);
  renderMemberGrid(els.memberSearch?.value || "");
  renderMyCheckins();
}

function showAppChrome() {
  show(els.netHeader);
  show(els.footerNav);
  hide(els.loginTopMeta);
}

function hideAppChrome() {
  hide(els.netHeader);
  hide(els.footerNav);
  show(els.loginTopMeta);
}

function showApp(profile) {
  hide(els.setupView);
  hide(els.authView);
  hide(els.adminView);
  show(els.appView);
  showAppChrome();
  renderAppChrome(profile);
  renderDirectoryAccess(profile);
  setAppTab("members");
  refreshAppData().catch((err) => console.error(err));
}

function showAuth() {
  hide(els.setupView);
  hide(els.appView);
  hide(els.adminView);
  hide(els.checkinGate);
  hideAppChrome();
  show(els.authView);
  showAuthTab(wantsCheckIn ? "register" : "login");
}

function showSetup() {
  hide(els.authView);
  hide(els.appView);
  hide(els.adminView);
  hide(els.checkinGate);
  hideAppChrome();
  show(els.setupView);
}

async function maybeShowCheckinGate(profile) {
  showApp(profile);
  if (wantsCheckIn) {
    show(els.checkinGate);
    setMsg(els.checkinGateMsg, "");
  }
}

async function handleAuthFlow(user, profile) {
  if (!user) {
    showAuth();
    return;
  }
  if (!profile?.name || !profile?.businessName) {
    showAuth();
    showAuthTab("register");
    setMsg(els.authMsg, "Finish your profile to join the group.", "error");
    return;
  }
  await maybeShowCheckinGate(profile);
}

els.checkinBtn?.addEventListener("click", async () => {
  els.checkinBtn.disabled = true;
  setMsg(els.checkinGateMsg, "Checking you in…");
  try {
    await recordCheckIn();
    hide(els.checkinGate);
    await refreshAppData();
  } catch (err) {
    setMsg(els.checkinGateMsg, err.message || "Check-in failed.", "error");
  } finally {
    els.checkinBtn.disabled = false;
  }
});

els.footerCheckinBtn?.addEventListener("click", async () => {
  els.footerCheckinBtn.disabled = true;
  try {
    await recordCheckIn();
    await refreshAppData();
    alert("Checked in.");
  } catch (err) {
    alert(err.message || "Check-in failed.");
  } finally {
    els.footerCheckinBtn.disabled = false;
  }
});

els.loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(els.authMsg, "Signing in…");
  try {
    await authApi.login(
      els.loginForm.elements.email.value,
      els.loginForm.elements.password.value,
    );
    setMsg(els.authMsg, "");
  } catch (err) {
    setMsg(els.authMsg, err.message, "error");
  }
});

els.registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(els.authMsg, "Creating your account…");
  const f = els.registerForm.elements;
  try {
    await authApi.register({
      name: f.name.value,
      phone: f.phone.value,
      preferredName: f.preferredName.value,
      businessName: f.businessName.value,
      helpDescription: f.helpDescription.value,
      email: f.email.value,
      password: f.password.value,
    });
    setMsg(els.authMsg, "Welcome — you're in.", "ok");
  } catch (err) {
    setMsg(els.authMsg, err.message, "error");
  }
});

els.resetBtn?.addEventListener("click", async () => {
  if (demoMode) {
    setMsg(els.authMsg, "Demo mode — use any registered email.", "ok");
    return;
  }
  const email = els.loginForm?.elements?.email?.value || prompt("Enter your email:");
  if (!email) return;
  try {
    await resetLoginPassword(email);
    setMsg(els.authMsg, "Password reset email sent.", "ok");
  } catch (err) {
    setMsg(els.authMsg, err.message, "error");
  }
});

els.footerSignOutBtn?.addEventListener("click", async () => {
  await authApi.logout();
});

els.demoAsGuestBtn?.addEventListener("click", async () => {
  try {
    await demoQuickLogin("guest");
    setMsg(els.authMsg, "Guest account ready.", "ok");
  } catch (err) {
    setMsg(els.authMsg, err.message, "error");
  }
});

els.demoResetBtn?.addEventListener("click", () => {
  if (confirm("Reset all demo data on this device?")) {
    demoResetAll();
    location.reload();
  }
});

function openProfile() {
  fillProfileForm(authApi.getProfile());
  renderAppChrome(authApi.getProfile());
  setMsg(els.profileMsg, "");
  show(els.profileModal);
}

els.headerProfileBtn?.addEventListener("click", openProfile);
els.closeProfileModal?.addEventListener("click", () => hide(els.profileModal));
els.profileModal?.addEventListener("click", (e) => {
  if (e.target === els.profileModal) hide(els.profileModal);
});

els.profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(els.profileMsg, "Saving…");
  const f = els.profileForm.elements;
  try {
    const profile = await authApi.saveProfile({
      name: f.name.value,
      preferredName: f.preferredName.value,
      phone: f.phone.value,
      businessName: f.businessName.value,
      helpDescription: f.helpDescription.value,
      email: f.email.value,
      profileOpen: !!els.profileOpenSwitch?.checked,
    });
    renderAppChrome(profile);
    await refreshAppData();
    setMsg(els.profileMsg, "Profile saved.", "ok");
  } catch (err) {
    setMsg(els.profileMsg, err.message, "error");
  }
});

els.profileOpenSwitch?.addEventListener("change", async () => {
  try {
    await updateProfileOpen(!!els.profileOpenSwitch.checked);
    setMsg(els.profileMsg, els.profileOpenSwitch.checked ? "Profile is open." : "Profile closed.", "ok");
  } catch (err) {
    setMsg(els.profileMsg, err.message, "error");
    syncProfileOpenSwitches(authApi.getProfile());
  }
});

els.directoryOpenSwitch?.addEventListener("change", async () => {
  if (!els.directoryOpenSwitch.checked) return;
  try {
    await updateProfileOpen(true);
  } catch (err) {
    alert(err.message || "Could not open profile.");
    syncProfileOpenSwitches(authApi.getProfile());
  }
});

els.profilePhotoInput?.addEventListener("change", async () => {
  const file = els.profilePhotoInput.files?.[0];
  if (!file) return;
  setMsg(els.profileMsg, demoMode ? "Saving photo…" : "Uploading photo…");
  try {
    const profile = await authApi.uploadPhoto(file);
    renderAppChrome(profile);
    setMsg(els.profileMsg, "Photo updated.", "ok");
  } catch (err) {
    setMsg(els.profileMsg, err.message, "error");
  } finally {
    els.profilePhotoInput.value = "";
  }
});

els.footerMembersBtn?.addEventListener("click", () => setAppTab("members"));
els.footerCheckinsBtn?.addEventListener("click", () => setAppTab("checkins"));
els.memberSearch?.addEventListener("input", () => renderMemberGrid(els.memberSearch.value));

els.modeDemoBtn?.addEventListener("click", () => {
  if (!demoMode) reloadWithMode("demo");
});
els.modeLiveBtn?.addEventListener("click", () => {
  if (demoMode) reloadWithMode("live");
});

async function loadAdminData() {
  if (demoMode) {
    const data = await demoLoadAdminData();
    adminMembers = data.members;
    adminCheckinsToday = data.todayCheckins;
    renderAdminStats(adminMembers, adminCheckinsToday, data.neverChecked);
    return;
  }
  const db = getLoginDb();
  if (!db) return;
  const [membersSnap, checkinsSnap] = await Promise.all([
    getDocs(collection(db, MEMBERS_COLLECTION)),
    getDocs(
      query(
        collection(db, CHECKINS_COLLECTION),
        where("dateKey", "==", dateKeyFromDate(new Date())),
      ),
    ),
  ]);
  adminMembers = membersSnap.docs.map((d) => normalizeMember(d.id, d.data()));
  adminCheckinsToday = checkinsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const checkedUids = new Set(adminCheckinsToday.map((c) => c.uid));
  const neverChecked = adminMembers.filter((m) => !checkedUids.has(m.uid));
  renderAdminStats(adminMembers, adminCheckinsToday, neverChecked);
}

function renderAdminStats(members, todayCheckins, neverChecked) {
  const checkedUids = new Set(todayCheckins.map((c) => c.uid));
  if (els.adminStatMembers) els.adminStatMembers.textContent = String(members.length);
  if (els.adminStatCheckedToday) els.adminStatCheckedToday.textContent = String(checkedUids.size);
  if (els.adminStatNever) els.adminStatNever.textContent = String(neverChecked.length);
  renderAdminTables(members, todayCheckins, neverChecked);
}

function renderAdminTables(members, todayCheckins, neverChecked) {
  if (els.adminMembersTable) {
    els.adminMembersTable.innerHTML = members
      .map(
        (m) => `<tr>
          <td>${escapeHtml(displayName(m))}</td>
          <td>${escapeHtml(m.businessName || "")}</td>
          <td>${escapeHtml(m.phone || "")}</td>
          <td>${escapeHtml(m.email || "")}</td>
          <td>${m.profileOpen !== false ? "Yes" : "No"}</td>
        </tr>`,
      )
      .join("");
  }
  if (els.adminCheckinsTable) {
    const rows = todayCheckins
      .slice()
      .sort((a, b) => checkinMillis(b.checkedInAt) - checkinMillis(a.checkedInAt))
      .map(
        (c) => `<tr>
          <td>${escapeHtml(c.memberName || "")}</td>
          <td>${escapeHtml(c.businessName || "")}</td>
          <td>${escapeHtml(formatDateTime(c.checkedInAt))}</td>
        </tr>`,
      )
      .join("");
    const missing = neverChecked
      .map(
        (m) => `<tr class="missing">
          <td>${escapeHtml(displayName(m))}</td>
          <td>${escapeHtml(m.businessName || "")}</td>
          <td><em>Not checked in today</em></td>
        </tr>`,
      )
      .join("");
    els.adminCheckinsTable.innerHTML = rows + missing;
  }
}

els.footerAdminBtn?.addEventListener("click", async () => {
  hide(els.appView);
  hide(els.netHeader);
  show(els.adminView);
  await loadAdminData();
});

els.adminBackBtn?.addEventListener("click", () => {
  hide(els.adminView);
  show(els.appView);
  show(els.netHeader);
});

els.adminPrintBtn?.addEventListener("click", () => window.print());
els.adminExportBtn?.addEventListener("click", () => {
  const lines = ["Name,Business,Phone,Email,Profile Open,Checked In Today"];
  const checked = new Set(adminCheckinsToday.map((c) => c.uid));
  adminMembers.forEach((m) => {
    lines.push(
      [
        csvCell(displayName(m)),
        csvCell(m.businessName),
        csvCell(m.phone),
        csvCell(m.email),
        m.profileOpen !== false ? "Yes" : "No",
        checked.has(m.uid) ? "Yes" : "No",
      ].join(","),
    );
  });
  downloadText("network-checkin-report.csv", lines.join("\n"));
});

function csvCell(value) {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

async function boot() {
  if (demoMode) {
    console.log("[Network Login] demo mode");
    authApi.boot();
    authApi.onChange(handleAuthFlow);
    await authApi.wait();
    return;
  }
  if (!firebaseReady) {
    showSetup();
    return;
  }
  const ok = await authApi.boot();
  if (!ok) {
    showSetup();
    return;
  }
  authApi.onChange(handleAuthFlow);
  await authApi.wait();
}

boot().catch((err) => {
  console.error(err);
  if (!demoMode) showSetup();
});
