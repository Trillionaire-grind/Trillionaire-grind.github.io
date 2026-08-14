import { isLoginFirebaseConfigured } from "./loginFirebaseConfig.js";
import { loginVersionLabel } from "./loginVersion.js";
import {
  getLoginProfile,
  getLoginUser,
  initLoginAuth as bootAuth,
  loginAccount,
  logoutAccount,
  onLoginAuthChange,
  registerAccount,
  resetLoginPassword,
  saveMemberProfile,
  uploadProfilePhoto,
  waitForLoginAuthReady,
} from "./loginAuth.js";
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

const els = {
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
  appName: document.getElementById("appName"),
  appBusiness: document.getElementById("appBusiness"),
  appAvatar: document.getElementById("appAvatar"),
  openProfileBtn: document.getElementById("openProfileBtn"),
  directoryBtn: document.getElementById("directoryBtn"),
  myCheckinsBtn: document.getElementById("myCheckinsBtn"),
  adminBtn: document.getElementById("adminBtn"),
  signOutBtn: document.getElementById("signOutBtn"),
  manualCheckinBtn: document.getElementById("manualCheckinBtn"),
  memberSearch: document.getElementById("memberSearch"),
  memberGrid: document.getElementById("memberGrid"),
  myCheckinsList: document.getElementById("myCheckinsList"),
  directorySection: document.getElementById("directorySection"),
  checkinsSection: document.getElementById("checkinsSection"),
  profileForm: document.getElementById("profileForm"),
  profilePhotoInput: document.getElementById("profilePhotoInput"),
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

if (els.version) els.version.textContent = loginVersionLabel();

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

function initials(profile) {
  const name = displayName(profile);
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

function renderAvatar(imgEl, profile) {
  if (!imgEl) return;
  const url = profile?.photoUrl;
  if (url) {
    imgEl.src = url;
    imgEl.alt = displayName(profile);
    imgEl.classList.remove("app-avatar--placeholder");
    imgEl.textContent = "";
  } else {
    imgEl.removeAttribute("src");
    imgEl.alt = "";
    imgEl.classList.add("app-avatar--placeholder");
    imgEl.textContent = initials(profile);
  }
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

async function recordCheckIn() {
  const user = getLoginUser();
  const profile = getLoginProfile();
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
  const db = getLoginDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, MEMBERS_COLLECTION));
  membersCache = snap.docs
    .map((d) => normalizeMember(d.id, d.data()))
    .sort((a, b) => displayName(a).localeCompare(displayName(b)));
  return membersCache;
}

async function loadMyCheckins() {
  const user = getLoginUser();
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

function renderMemberGrid(filterText) {
  if (!els.memberGrid) return;
  const user = getLoginUser();
  const list = membersCache.filter((m) => m.uid !== user?.uid && memberMatchesQuery(m, filterText));
  els.memberGrid.innerHTML = "";
  if (!list.length) {
    els.memberGrid.innerHTML = `<p class="login-lead">No members match that search yet.</p>`;
    return;
  }
  list.forEach((m) => {
    const card = document.createElement("article");
    card.className = "member-card";
    const img = m.photoUrl
      ? `<img src="${escapeAttr(m.photoUrl)}" alt="">`
      : `<div class="app-avatar app-avatar--placeholder" style="width:56px;height:56px;font-size:16px;">${escapeHtml(initials(m))}</div>`;
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
}

function renderAppHeader(profile) {
  if (!profile) return;
  if (els.appName) els.appName.textContent = displayName(profile);
  if (els.appBusiness) els.appBusiness.textContent = profile.businessName || "Networking member";
  renderAvatar(els.appAvatar, profile);
  if (els.adminBtn) {
    profile.admin ? show(els.adminBtn) : hide(els.adminBtn);
  }
}

async function refreshAppData() {
  await loadMembers();
  await loadMyCheckins();
  renderMemberGrid(els.memberSearch?.value || "");
  renderMyCheckins();
}

function showApp(profile) {
  hide(els.setupView);
  hide(els.authView);
  hide(els.adminView);
  show(els.appView);
  renderAppHeader(profile);
  refreshAppData().catch((err) => console.error(err));
}

function showAuth() {
  hide(els.setupView);
  hide(els.appView);
  hide(els.adminView);
  hide(els.checkinGate);
  show(els.authView);
  showAuthTab(wantsCheckIn ? "register" : "login");
}

function showSetup() {
  hide(els.authView);
  hide(els.appView);
  hide(els.adminView);
  hide(els.checkinGate);
  show(els.setupView);
}

async function maybeShowCheckinGate(profile) {
  if (!wantsCheckIn) {
    showApp(profile);
    return;
  }
  showApp(profile);
  show(els.checkinGate);
  setMsg(els.checkinGateMsg, "");
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
    setMsg(els.checkinGateMsg, "");
  } catch (err) {
    setMsg(els.checkinGateMsg, err.message || "Check-in failed.", "error");
  } finally {
    els.checkinBtn.disabled = false;
  }
});

els.manualCheckinBtn?.addEventListener("click", async () => {
  els.manualCheckinBtn.disabled = true;
  try {
    await recordCheckIn();
    await refreshAppData();
    alert("Checked in.");
  } catch (err) {
    alert(err.message || "Check-in failed.");
  } finally {
    els.manualCheckinBtn.disabled = false;
  }
});

els.loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(els.authMsg, "Signing in…");
  try {
    await loginAccount(
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
    await registerAccount({
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
  const email = els.loginForm?.elements?.email?.value || prompt("Enter your email for password reset:");
  if (!email) return;
  try {
    await resetLoginPassword(email);
    setMsg(els.authMsg, "Password reset email sent.", "ok");
  } catch (err) {
    setMsg(els.authMsg, err.message, "error");
  }
});

els.signOutBtn?.addEventListener("click", async () => {
  await logoutAccount();
});

els.openProfileBtn?.addEventListener("click", () => {
  fillProfileForm(getLoginProfile());
  setMsg(els.profileMsg, "");
  show(els.profileModal);
});
els.appAvatar?.addEventListener("click", () => els.openProfileBtn?.click());

els.closeProfileModal?.addEventListener("click", () => hide(els.profileModal));
els.profileModal?.addEventListener("click", (e) => {
  if (e.target === els.profileModal) hide(els.profileModal);
});

els.profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(els.profileMsg, "Saving…");
  const f = els.profileForm.elements;
  try {
    const profile = await saveMemberProfile({
      name: f.name.value,
      preferredName: f.preferredName.value,
      phone: f.phone.value,
      businessName: f.businessName.value,
      helpDescription: f.helpDescription.value,
      email: f.email.value,
    });
    renderAppHeader(profile);
    await refreshAppData();
    setMsg(els.profileMsg, "Profile saved.", "ok");
  } catch (err) {
    setMsg(els.profileMsg, err.message, "error");
  }
});

els.profilePhotoInput?.addEventListener("change", async () => {
  const file = els.profilePhotoInput.files?.[0];
  if (!file) return;
  setMsg(els.profileMsg, "Uploading photo…");
  try {
    const profile = await uploadProfilePhoto(file);
    renderAppHeader(profile);
    setMsg(els.profileMsg, "Photo updated.", "ok");
  } catch (err) {
    setMsg(els.profileMsg, err.message, "error");
  } finally {
    els.profilePhotoInput.value = "";
  }
});

els.directoryBtn?.addEventListener("click", () => {
  show(els.directorySection);
  hide(els.checkinsSection);
});
els.myCheckinsBtn?.addEventListener("click", () => {
  hide(els.directorySection);
  show(els.checkinsSection);
});
els.memberSearch?.addEventListener("input", () => {
  renderMemberGrid(els.memberSearch.value);
});

/* Admin */
async function loadAdminData() {
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

  if (els.adminStatMembers) els.adminStatMembers.textContent = String(adminMembers.length);
  if (els.adminStatCheckedToday) els.adminStatCheckedToday.textContent = String(checkedUids.size);
  if (els.adminStatNever) els.adminStatNever.textContent = String(neverChecked.length);

  renderAdminTables(adminMembers, adminCheckinsToday, neverChecked);
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
          <td>${m.admin ? "Yes" : ""}</td>
        </tr>`,
      )
      .join("");
  }
  if (els.adminCheckinsTable) {
    const rows = todayCheckins
      .slice()
      .sort((a, b) => {
        const ta = a.checkedInAt?.toMillis?.() || 0;
        const tb = b.checkedInAt?.toMillis?.() || 0;
        return tb - ta;
      })
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

els.adminBtn?.addEventListener("click", async () => {
  hide(els.appView);
  show(els.adminView);
  await loadAdminData();
});

els.adminBackBtn?.addEventListener("click", () => {
  hide(els.adminView);
  show(els.appView);
});

els.adminPrintBtn?.addEventListener("click", () => window.print());

els.adminExportBtn?.addEventListener("click", () => {
  const lines = ["Name,Business,Phone,Email,Checked In Today"];
  const checked = new Set(adminCheckinsToday.map((c) => c.uid));
  adminMembers.forEach((m) => {
    lines.push(
      [
        csvCell(displayName(m)),
        csvCell(m.businessName),
        csvCell(m.phone),
        csvCell(m.email),
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
  if (!isLoginFirebaseConfigured()) {
    showSetup();
    return;
  }
  const ok = await bootAuth();
  if (!ok) {
    showSetup();
    return;
  }
  onLoginAuthChange(handleAuthFlow);
  await waitForLoginAuthReady();
}

boot().catch((err) => {
  console.error(err);
  showSetup();
});
