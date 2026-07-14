/**
 * Shared login / password-reset wiring for Tech Academy sales pages.
 * Expects standard modal IDs: logInBtn, myModal, emailET, passwordET, etc.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import {
  friendlyAuthError,
  friendlyResetError,
  validateEmail,
} from "./techAuthUi.js";

const firebaseConfig = {
  apiKey: "AIzaSyAw_s-SsnRQp44GoR7_PZjzocHCTaansfY",
  authDomain: "tech-mastery-academy.firebaseapp.com",
  projectId: "tech-mastery-academy",
  storageBucket: "tech-mastery-academy.firebasestorage.app",
  messagingSenderId: "205345673412",
  appId: "1:205345673412:web:d8970165489c414745b991",
  measurementId: "G-KLKCTD047P",
};

let appInitialized = false;
let auth = null;

function ensureAuth() {
  if (!appInitialized) {
    const app = initializeApp(firebaseConfig);
    try {
      getAnalytics(app);
    } catch (_) {
      /* analytics optional on some hosts */
    }
    auth = getAuth(app);
    appInitialized = true;
  }
  return auth;
}

/**
 * @param {{ mainViewPath?: string }} options
 */
export function wireLandingAuth(options = {}) {
  const mainViewPath = options.mainViewPath || "mainView.html";
  const authInstance = ensureAuth();

  const logInBtn = document.getElementById("logInBtn");
  const myModal = document.getElementById("myModal");
  const emailET = document.getElementById("emailET");
  const passwordET = document.getElementById("passwordET");
  const signInBtn = document.getElementById("signInBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  const resetModal = document.getElementById("resetModal");
  const forgotBtn = document.getElementById("forgotBtn");
  const resetEmailET = document.getElementById("resetEmailET");
  const resetCancelBtn = document.getElementById("resetCancelBtn");
  const resetSendBtn = document.getElementById("resetSendBtn");

  if (!logInBtn || !myModal || !signInBtn) return authInstance;

  logInBtn.onclick = () => {
    myModal.style.display = "inline";
  };

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      myModal.style.display = "none";
    };
  }

  signInBtn.onclick = () => {
    const email = emailET?.value;
    const password = passwordET?.value;
    if (!validateEmail(email) || !password) {
      alert("Please enter your email and password.");
      return;
    }
    signInWithEmailAndPassword(authInstance, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        myModal.style.display = "none";
        localStorage.setItem("userUID", user.uid);
        localStorage.setItem("userEmail", user.email);
        window.location.replace(mainViewPath);
      })
      .catch((error) => {
        alert(friendlyAuthError(error));
      });
  };

  if (forgotBtn && resetModal) {
    forgotBtn.onclick = () => {
      myModal.style.display = "none";
      resetModal.style.display = "inline";
    };
  }

  if (resetCancelBtn && resetModal) {
    resetCancelBtn.onclick = () => {
      resetModal.style.display = "none";
    };
  }

  if (resetSendBtn) {
    resetSendBtn.onclick = () => {
      const email = resetEmailET?.value;
      if (!validateEmail(email)) {
        alert("Please enter a valid email address.");
        return;
      }
      sendPasswordResetEmail(authInstance, email)
        .then(() => {
          alert(
            "If an account exists for that email, you will receive a reset link shortly."
          );
          if (resetModal) resetModal.style.display = "none";
        })
        .catch((error) => {
          alert(friendlyResetError(error));
        });
    };
  }

  return authInstance;
}
