import {
  isLearnFirebaseConfigured,
  isLearnDemoMode,
  LEARN_ADMIN_EMAILS,
} from "./learnFirebaseConfig.js";

const DEMO_ADMIN_KEY = "learnNotesDemoAdmin";

const authBtn = document.getElementById("notesAuthBtn");
const loginModal = document.getElementById("notesLoginModal");
const loginClose = document.getElementById("notesLoginClose");
const loginError = document.getElementById("notesLoginError");
const loginForm = document.getElementById("notesLoginForm");
const loginEmail = document.getElementById("notesLoginEmail");
const loginPassword = document.getElementById("notesLoginPassword");
const googleBtn = document.getElementById("notesGoogleBtn");
const setupNotice = document.getElementById("notesLoginSetup");
const demoLoginBtn = document.getElementById("notesDemoLoginBtn");

let auth = null;
let demoAdmin = false;

function isAdminEmail(email) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return LEARN_ADMIN_EMAILS.some((entry) => entry.toLowerCase() === normalized);
}

function notifyAdminState(isAdmin) {
  window.dispatchEvent(
    new CustomEvent("learn-admin-changed", {
      detail: { isAdmin, demoMode: isLearnDemoMode() },
    })
  );
}

function setAuthLabel(signedIn) {
  if (!authBtn) return;
  authBtn.textContent = signedIn ? "Log out" : "Log in";
  authBtn.setAttribute("aria-pressed", signedIn ? "true" : "false");
  document.body.classList.toggle("notes-admin", signedIn);
  notifyAdminState(signedIn);
}

function showError(message) {
  if (!loginError) return;
  loginError.textContent = message;
  loginError.hidden = !message;
}

function openLoginModal() {
  if (!loginModal) return;
  showError("");
  loginModal.classList.add("is-open");
  if (isLearnDemoMode() && demoLoginBtn) {
    demoLoginBtn.focus();
  } else if (loginEmail) {
    loginEmail.focus();
  }
}

function closeLoginModal() {
  if (!loginModal) return;
  loginModal.classList.remove("is-open");
  showError("");
  if (loginForm) loginForm.reset();
}

export function startDemoAdmin() {
  demoAdmin = true;
  sessionStorage.setItem(DEMO_ADMIN_KEY, "1");
  setAuthLabel(true);
  closeLoginModal();
}

function stopDemoAdmin() {
  demoAdmin = false;
  sessionStorage.removeItem(DEMO_ADMIN_KEY);
  setAuthLabel(false);
}

window.startDemoAdmin = startDemoAdmin;

async function enforceAdmin(user) {
  if (!user) {
    setAuthLabel(false);
    return;
  }

  if (isAdminEmail(user.email)) {
    setAuthLabel(true);
    closeLoginModal();
    return;
  }

  const { signOut } = await import(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
  );
  await signOut(auth);
  setAuthLabel(false);
  showError("That account is not authorized for admin access.");
  openLoginModal();
}

async function initConfiguredAuth() {
  const { GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup } =
    await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");
  const { getLearnAuthReady } = await import("./learnFirebase.js");

  sessionStorage.removeItem(DEMO_ADMIN_KEY);
  auth = await getLearnAuthReady();
  if (!auth) return;

  if (setupNotice) setupNotice.hidden = true;
  if (demoLoginBtn) demoLoginBtn.hidden = true;
  if (loginForm) loginForm.hidden = false;
  if (googleBtn) googleBtn.hidden = false;

  onAuthStateChanged(auth, (user) => {
    enforceAdmin(user);
  });

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      showError("");
      try {
        await signInWithEmailAndPassword(
          auth,
          loginEmail.value.trim(),
          loginPassword.value
        );
      } catch (error) {
        showError("Could not sign in. Check your email and password.");
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      showError("");
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (error) {
        if (error.code !== "auth/popup-closed-by-user") {
          showError("Google sign-in failed. Try again.");
        }
      }
    });
  }
}

function initDemoAuth() {
  if (setupNotice) {
    setupNotice.hidden = false;
    setupNotice.textContent =
      "Demo mode — notes save in this browser only. Connect Firebase later for real publishing.";
  }
  if (demoLoginBtn) demoLoginBtn.hidden = false;
  if (loginForm) loginForm.hidden = true;
  if (googleBtn) googleBtn.hidden = true;

  if (sessionStorage.getItem(DEMO_ADMIN_KEY) === "1") {
    demoAdmin = true;
    setAuthLabel(true);
  }
}

function bindUi() {
  if (!authBtn) return;

  authBtn.addEventListener("click", async () => {
    if (isLearnDemoMode()) {
      if (demoAdmin) {
        stopDemoAdmin();
        return;
      }
      openLoginModal();
      return;
    }

    if (!auth) {
      openLoginModal();
      return;
    }

    const { signOut } = await import(
      "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
    );
    if (auth.currentUser) {
      await signOut(auth);
      setAuthLabel(false);
      return;
    }

    openLoginModal();
  });

  if (demoLoginBtn) {
    demoLoginBtn.addEventListener("click", (event) => {
      event.preventDefault();
      startDemoAdmin();
    });
  }

  if (loginClose) loginClose.addEventListener("click", closeLoginModal);
  if (loginModal) {
    loginModal.addEventListener("click", (event) => {
      if (event.target === loginModal) closeLoginModal();
    });
  }
}

bindUi();

if (isLearnFirebaseConfigured()) {
  initConfiguredAuth().then(() => setAuthLabel(false));
} else {
  initDemoAuth();
}
