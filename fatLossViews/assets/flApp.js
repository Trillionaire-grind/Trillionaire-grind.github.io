import { EBOOK_PDF, GUARANTEE_EMAIL, KIT_PDF } from "./flConfig.js";
import { initBookReader, refreshBookReaderLayout } from "./flBookReader.js";
import {
  authErrorMessage,
  deleteAccount,
  initFlAuth,
  isCloudSyncEnabled,
  onFlAuthChange,
  resetPassword,
  signIn,
  signOutUser,
  signUp,
  waitForFlAuthReady,
} from "./flAuth.js";
import { flVersionLabel } from "./flVersion.js";
import { downloadBackupFile, getLedgerState } from "./flLedgerStore.js";
import { initLedger } from "./flLedger.js";

console.log("[Fat Loss app] working version:", flVersionLabel());

const panels = {
  book: document.getElementById("panel-book"),
  ledger: document.getElementById("panel-ledger"),
};

const tabs = Array.from(document.querySelectorAll(".fl-tab"));
const installBanner = document.getElementById("installBanner");
const installBtn = document.getElementById("installBtn");
const dismissInstall = document.getElementById("dismissInstall");
const versionEl = document.getElementById("flAppVersion");
const bookPdfLink = document.getElementById("bookPdfLink");
const authGate = document.getElementById("authGate");
const appShell = document.getElementById("appShell");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");
const authToggle = document.getElementById("authToggle");
const authReset = document.getElementById("authReset");
const authStatus = document.getElementById("authStatus");
const authModeLabel = document.getElementById("authModeLabel");
const localModeNote = document.getElementById("localModeNote");
const accountBar = document.getElementById("accountBar");
const accountEmail = document.getElementById("accountEmail");
const signOutBtn = document.getElementById("signOutBtn");
const accountBackup = document.getElementById("accountBackup");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
const topStrip = document.getElementById("topStrip");

let deferredInstall = null;
let authMode = "signin";

if (versionEl) versionEl.textContent = flVersionLabel();
if (bookPdfLink) {
  bookPdfLink.href = EBOOK_PDF;
  bookPdfLink.setAttribute("download", "");
}

function setTab(name) {
  const tab = name === "ledger" ? "ledger" : "book";
  tabs.forEach((btn) => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
  panels.book.hidden = tab !== "book";
  panels.ledger.hidden = tab !== "ledger";
  location.hash = tab;
  if (tab === "book") refreshBookReaderLayout();
}

tabs.forEach((btn) => {
  btn.addEventListener("click", () => setTab(btn.dataset.tab));
});

function readHashTab() {
  const hash = (location.hash || "").replace("#", "").toLowerCase();
  if (hash === "ledger" || hash === "book") setTab(hash);
  else setTab("book");
}

window.addEventListener("hashchange", readHashTab);

function showApp(user, cloudEnabled) {
  const signedIn = !!user;
  const localOnly = !cloudEnabled;

  if (localOnly) {
    authGate?.classList.add("is-hidden");
    appShell?.classList.remove("is-locked");
    if (topStrip) {
      topStrip.innerHTML =
        "<strong>Local mode</strong> · Export backups often · Cloud login activates when Firebase is configured";
    }
    if (localModeNote) localModeNote.hidden = false;
    accountBar?.classList.add("is-hidden");
    readHashTab();
    return;
  }

  if (localModeNote) localModeNote.hidden = true;

  if (signedIn) {
    authGate?.classList.add("is-hidden");
    appShell?.classList.remove("is-locked");
    if (topStrip) {
      topStrip.innerHTML =
        "<strong>Signed in</strong> · Ledger syncs to your account · Export backups anytime";
    }
    if (accountBar) {
      accountBar.classList.remove("is-hidden");
      if (accountEmail) accountEmail.textContent = user.email || "Account";
    }
    readHashTab();
  } else {
    authGate?.classList.remove("is-hidden");
    appShell?.classList.add("is-locked");
    accountBar?.classList.add("is-hidden");
  }
}

function setAuthMode(mode) {
  authMode = mode === "signup" ? "signup" : "signin";
  if (authModeLabel) {
    authModeLabel.textContent = authMode === "signup" ? "Create account" : "Sign in";
  }
  if (authSubmit) {
    authSubmit.textContent = authMode === "signup" ? "Create account" : "Sign in";
  }
  if (authToggle) {
    authToggle.textContent =
      authMode === "signup" ? "Already have an account? Sign in" : "New here? Create account";
  }
  if (authStatus) authStatus.textContent = "";
}

authToggle?.addEventListener("click", (e) => {
  e.preventDefault();
  setAuthMode(authMode === "signup" ? "signin" : "signup");
});

authReset?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = authEmail?.value?.trim();
  if (!email) {
    if (authStatus) authStatus.textContent = "Enter your email first.";
    return;
  }
  try {
    await resetPassword(email);
    if (authStatus) {
      authStatus.textContent = "Password reset email sent.";
      authStatus.classList.add("is-ok");
    }
  } catch (err) {
    if (authStatus) authStatus.textContent = authErrorMessage(err);
  }
});

authForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = authEmail?.value?.trim();
  const password = authPassword?.value || "";
  if (!email || !password) {
    if (authStatus) authStatus.textContent = "Enter email and password.";
    return;
  }
  if (authSubmit) authSubmit.disabled = true;
  if (authStatus) authStatus.textContent = "Working…";
  try {
    if (authMode === "signup") await signUp(email, password);
    else await signIn(email, password);
    if (authStatus) authStatus.textContent = "";
  } catch (err) {
    if (authStatus) authStatus.textContent = authErrorMessage(err);
  } finally {
    if (authSubmit) authSubmit.disabled = false;
  }
});

signOutBtn?.addEventListener("click", async () => {
  await signOutUser();
});

accountBackup?.addEventListener("click", () => {
  downloadBackupFile(getLedgerState(), accountEmail?.textContent);
});

deleteAccountBtn?.addEventListener("click", async () => {
  const ok = window.confirm(
    "Delete your account? Download a backup first — this removes cloud access. Your local data stays until you clear browser data."
  );
  if (!ok) return;
  try {
    downloadBackupFile(getLedgerState(), accountEmail?.textContent);
    await deleteAccount();
  } catch (err) {
    window.alert(authErrorMessage(err));
  }
});

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstall = e;
  if (installBanner) installBanner.classList.add("is-visible");
});

installBtn?.addEventListener("click", async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  installBanner?.classList.remove("is-visible");
});

dismissInstall?.addEventListener("click", () => {
  installBanner?.classList.remove("is-visible");
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./fl-sw.js").catch(() => {});
}

(() => {
  const params = new URLSearchParams(window.location.search);
  const hasKit =
    params.get("kit") === "1" ||
    params.get("kit") === "true" ||
    params.get("bundle") === "1";
  const kitBar = document.getElementById("kitBar");
  const kitLink = document.getElementById("kitLink");
  if (hasKit && kitBar && kitLink) {
    kitLink.href = KIT_PDF;
    kitLink.setAttribute("download", "");
    kitBar.hidden = false;
  }
})();

window.addEventListener("resize", () => {
  refreshBookReaderLayout();
});

(async () => {
  setAuthMode("signin");
  await initFlAuth();
  initLedger();
  initBookReader();
  onFlAuthChange(showApp);
  const { user } = await waitForFlAuthReady();
  showApp(user, isCloudSyncEnabled());
})();

export { GUARANTEE_EMAIL };
