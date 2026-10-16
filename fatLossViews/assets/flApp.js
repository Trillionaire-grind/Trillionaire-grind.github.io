import { COACHING_ABSOLUTE_URL, EBOOK_PDF, GUARANTEE_EMAIL, KIT_PDF } from "./flConfig.js";
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
import {
  capturePurchaseFromUrl,
  getSignupWindow,
  hasKibbleKit,
  hasLocalPaidAccess,
} from "./flPurchase.js";

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
const authLead = document.getElementById("authLead");
const authSkip = document.getElementById("authSkip");
const localModeNote = document.getElementById("localModeNote");
const accountBar = document.getElementById("accountBar");
const accountEmail = document.getElementById("accountEmail");
const signOutBtn = document.getElementById("signOutBtn");
const accountBackup = document.getElementById("accountBackup");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
const signupBar = document.getElementById("signupBar");
const signupBarCopy = document.getElementById("signupBarCopy");
const openSignupBtn = document.getElementById("openSignupBtn");
const openSigninBtn = document.getElementById("openSigninBtn");
const topStrip = document.getElementById("topStrip");
const kitBar = document.getElementById("kitBar");
const kitLink = document.getElementById("kitLink");

let deferredInstall = null;
let authMode = "signin";

if (versionEl) versionEl.textContent = flVersionLabel();
if (bookPdfLink) {
  bookPdfLink.href = EBOOK_PDF;
  bookPdfLink.setAttribute("download", "");
}
const coachLink = document.getElementById("coachLink");
if (coachLink) coachLink.href = COACHING_ABSOLUTE_URL;

// The fixed header wraps differently per device, so measure it instead of
// guessing; the book reader sizes its page surface off this value.
function syncHeaderHeight() {
  const header = document.querySelector(".fl-app-header");
  if (!header) return;
  document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`);
}

syncHeaderHeight();
window.addEventListener("resize", syncHeaderHeight);
window.addEventListener("orientationchange", syncHeaderHeight);
if (window.ResizeObserver) {
  const header = document.querySelector(".fl-app-header");
  if (header) new ResizeObserver(syncHeaderHeight).observe(header);
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

function syncKitBar() {
  if (!kitBar || !kitLink) return;
  if (hasKibbleKit()) {
    kitLink.href = KIT_PDF;
    kitLink.setAttribute("download", "");
    kitBar.hidden = false;
  } else {
    kitBar.hidden = true;
  }
}

function syncAuthCopy() {
  const signup = getSignupWindow();
  const paidLocal = hasLocalPaidAccess();
  if (authLead) {
    if (authMode === "signup") {
      authLead.textContent = signup.ok
        ? `You have ${signup.daysLeft} day${signup.daysLeft === 1 ? "" : "s"} left to create this account. Kibble kit stays on the account if you bought it. Meal photos stay on this phone. Weight is typed in by hand.`
        : signup.reason;
    } else if (paidLocal) {
      authLead.textContent =
        "Sign in on any device. Your ledger and kibble kit follow the account. Meal photos stay on each phone.";
    } else {
      authLead.textContent =
        "Sign in if you already created an account after buying. New accounts open for 30 days after you pay, from your thank-you page.";
    }
  }
  if (authToggle) {
    const allowSignup = signup.ok;
    authToggle.hidden = !allowSignup;
    if (allowSignup) {
      authToggle.textContent =
        authMode === "signup" ? "Already have an account? Sign in" : "New here? Create account";
    }
  }
  if (authSkip) {
    authSkip.hidden = !paidLocal;
  }
  if (openSignupBtn) openSignupBtn.hidden = !signup.ok;
}

function openAuthGate(mode) {
  setAuthMode(mode);
  authGate?.classList.remove("is-hidden");
}

function showApp(user, cloudEnabled) {
  capturePurchaseFromUrl(window.location.search);
  const signedIn = !!user;
  const localOnly = !cloudEnabled;
  const paidLocal = hasLocalPaidAccess();
  const signup = getSignupWindow();

  syncKitBar();
  syncAuthCopy();

  if (localOnly) {
    authGate?.classList.add("is-hidden");
    appShell?.classList.remove("is-locked");
    if (topStrip) {
      topStrip.innerHTML =
        "<strong>This phone</strong> · Book + ledger saved here · Create an account after you pay to take them with you";
    }
    if (localModeNote) localModeNote.hidden = false;
    accountBar?.classList.add("is-hidden");
    if (signupBar) signupBar.classList.add("is-hidden");
    readHashTab();
    return;
  }

  if (localModeNote) localModeNote.hidden = true;

  if (signedIn) {
    authGate?.classList.add("is-hidden");
    appShell?.classList.remove("is-locked");
    const kitNote = hasKibbleKit() ? " · Kibble kit saved on this account" : "";
    if (topStrip) {
      topStrip.innerHTML =
        `<strong>Signed in</strong> · Ledger syncs to your account${kitNote} · Photos stay on this phone`;
    }
    if (accountBar) {
      accountBar.classList.remove("is-hidden");
      if (accountEmail) accountEmail.textContent = user.email || "Account";
    }
    if (signupBar) signupBar.classList.add("is-hidden");
    readHashTab();
    return;
  }

  accountBar?.classList.add("is-hidden");

  if (paidLocal) {
    authGate?.classList.add("is-hidden");
    appShell?.classList.remove("is-locked");
    if (signup.ok) {
      if (topStrip) {
        topStrip.innerHTML = `<strong>Paid on this phone</strong> · ${signup.daysLeft} day${signup.daysLeft === 1 ? "" : "s"} left to create an account`;
      }
      if (signupBar) {
        signupBar.classList.remove("is-hidden");
        if (signupBarCopy) {
          signupBarCopy.textContent = `Create an account in the next ${signup.daysLeft} day${signup.daysLeft === 1 ? "" : "s"} so your ledger${hasKibbleKit() ? " and kibble kit" : ""} follow you to a new phone.`;
        }
      }
    } else {
      if (topStrip) {
        topStrip.innerHTML =
          "<strong>This phone</strong> · Account signup window has ended · Sign in if you already made one";
      }
      if (signupBar) {
        signupBar.classList.remove("is-hidden");
        if (signupBarCopy) {
          signupBarCopy.textContent =
            "The 30-day window to create an account has ended. Sign in if you already made one.";
        }
      }
    }
    readHashTab();
    return;
  }

  openAuthGate("signin");
  appShell?.classList.add("is-locked");
  if (signupBar) signupBar.classList.add("is-hidden");
}

function setAuthMode(mode) {
  const signup = getSignupWindow();
  authMode = mode === "signup" && signup.ok ? "signup" : "signin";
  if (authModeLabel) {
    authModeLabel.textContent = authMode === "signup" ? "Create account" : "Sign in";
  }
  if (authSubmit) {
    authSubmit.textContent = authMode === "signup" ? "Create account" : "Sign in";
  }
  if (authPassword) {
    authPassword.setAttribute(
      "autocomplete",
      authMode === "signup" ? "new-password" : "current-password",
    );
  }
  if (authStatus) authStatus.textContent = "";
  syncAuthCopy();
}

authToggle?.addEventListener("click", (e) => {
  e.preventDefault();
  if (authMode === "signup") {
    setAuthMode("signin");
    return;
  }
  if (!getSignupWindow().ok) {
    setAuthMode("signin");
    if (authStatus) authStatus.textContent = getSignupWindow().reason;
    return;
  }
  setAuthMode("signup");
});

openSignupBtn?.addEventListener("click", () => {
  openAuthGate("signup");
});

openSigninBtn?.addEventListener("click", () => {
  openAuthGate("signin");
});

authSkip?.addEventListener("click", (e) => {
  e.preventDefault();
  if (!hasLocalPaidAccess()) return;
  authGate?.classList.add("is-hidden");
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
    "Delete your account? Download a backup first: this removes cloud access. Your local data stays until you clear browser data."
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

capturePurchaseFromUrl(window.location.search);
syncKitBar();

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
