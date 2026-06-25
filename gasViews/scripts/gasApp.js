import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCn1HLSz9-TH4rHHnHpWgHavv7wh-Vju4I",
  authDomain: "gas-tracker-91ae5.firebaseapp.com",
  projectId: "gas-tracker-91ae5",
  storageBucket: "gas-tracker-91ae5.firebasestorage.app",
  messagingSenderId: "243507296128",
  appId: "1:243507296128:web:45ea40627a4a81a6127365",
  measurementId: "G-ZVB79HRSV9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (sel) => document.querySelector(sel);

const state = {
  user: null,
  profile: null,
  trips: [],
  authMode: "register",
};

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toast(msg) {
  const el = $("#gasToast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("is-visible");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("is-visible"), 2400);
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

function money(n) {
  return "$" + Number(n).toFixed(2);
}

function calcStats(trips) {
  if (!trips.length) return { mpg: "—", ppg: "—" };

  const sorted = trips.slice().sort((a, b) => Number(a.mileage) - Number(b.mileage));
  const latest = sorted[sorted.length - 1];
  const ppg = latest.gallons > 0 ? Number(latest.cost) / Number(latest.gallons) : null;

  let mpg = null;
  if (sorted.length >= 2) {
    const prev = sorted[sorted.length - 2];
    const miles = Number(latest.mileage) - Number(prev.mileage);
    if (miles > 0 && Number(latest.gallons) > 0) {
      mpg = miles / Number(latest.gallons);
    }
  }

  return {
    mpg: mpg != null ? mpg.toFixed(1) : "—",
    ppg: ppg != null ? ppg.toFixed(2) : "—",
  };
}

function showScreen(name) {
  document.querySelectorAll(".gas-screen").forEach((el) => {
    el.hidden = el.dataset.screen !== name;
  });
  const fab = $("#gasFab");
  const headerAction = $("#gasHeaderAction");
  if (name === "trips") {
    if (fab) fab.hidden = false;
    if (headerAction) {
      headerAction.hidden = false;
      headerAction.textContent = "Sign out";
    }
    $("#gasHeaderTitle").textContent = "My Trips";
  } else if (name === "auth") {
    if (fab) fab.hidden = true;
    if (headerAction) headerAction.hidden = true;
    $("#gasHeaderTitle").textContent = "Gas Tracker";
  }
}

function renderAuth() {
  const isRegister = state.authMode === "register";
  $("#gasAuthRegister").hidden = !isRegister;
  $("#gasAuthLogin").hidden = isRegister;
  $("#gasAuthSwitchLabel").textContent = isRegister
    ? "Already have an account?"
    : "Need an account?";
  $("#gasAuthSwitchBtn").textContent = isRegister ? "Log in" : "Register";
}

function renderCarCard() {
  const car = state.profile && state.profile.car;
  const el = $("#gasCarCard");
  if (!el || !car) return;
  el.innerHTML =
    "<h2>" +
    esc(car.year) +
    " " +
    esc(car.make) +
    " " +
    esc(car.model) +
    "</h2><p>Current odometer: " +
    esc(Number(car.mileage).toLocaleString()) +
    " mi</p>";
}

function renderTrips() {
  const list = $("#gasTripList");
  const stats = calcStats(state.trips);
  $("#gasStatMpg").textContent = stats.mpg;
  $("#gasStatPpg").textContent = stats.ppg === "—" ? "—" : "$" + stats.ppg;

  if (!state.trips.length) {
    list.innerHTML = '<div class="gas-empty"><p>No fill-ups yet.</p><p>Tap + to log your first trip.</p></div>';
    return;
  }

  const sorted = state.trips.slice().sort((a, b) => {
    const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
    const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
    return tb - ta;
  });

  list.innerHTML = sorted
    .map(function (trip) {
      const ppg = trip.gallons > 0 ? money(Number(trip.cost) / Number(trip.gallons)) : "—";
      return (
        '<article class="gas-trip">' +
        '<div class="gas-trip__top"><p class="gas-trip__station">' +
        esc(trip.name) +
        '</p><p class="gas-trip__date">' +
        esc(trip.date) +
        "</p></div>" +
        '<p class="gas-trip__address">' +
        esc(trip.location) +
        '</p><div class="gas-trip__meta">' +
        "<div><span>Gallons</span><strong>" +
        esc(trip.gallons) +
        "</strong></div>" +
        "<div><span>Total cost</span><strong>" +
        money(trip.cost) +
        "</strong></div>" +
        "<div><span>$/gallon</span><strong>" +
        ppg +
        "</strong></div>" +
        "<div><span>Odometer</span><strong>" +
        esc(Number(trip.mileage).toLocaleString()) +
        " mi</strong></div></div></article>"
      );
    })
    .join("");
}

async function loadProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  state.profile = snap.exists() ? snap.data() : null;
  renderCarCard();
}

async function loadTrips(uid) {
  const snap = await getDocs(collection(db, "users", uid, "trips"));
  state.trips = snap.docs.map(function (d) {
    const data = d.data();
    return {
      id: d.id,
      name: data.name || "",
      location: data.location || "",
      date: data.date || "",
      gallons: Number(data.gallons) || 0,
      cost: Number(data.cost) || 0,
      mileage: Number(data.mileage) || 0,
      createdAt: data.createdAt || null,
    };
  });
  renderTrips();
}

async function saveUserProfile(uid, name, email, car) {
  await setDoc(doc(db, "users", uid), {
    name: name,
    email: email,
    car: car,
    updatedAt: new Date().toISOString(),
  });
}

async function handleRegister(e) {
  e.preventDefault();
  const name = $("#regName").value.trim();
  const email = $("#regEmail").value.trim();
  const password = $("#regPassword").value;
  const make = $("#regMake").value;
  const model = $("#regModel").value;
  const year = $("#regYear").value;
  const mileage = Number($("#regMileage").value);

  if (!name || !email || password.length < 8) {
    toast("Enter name, email, and a password (8+ chars).");
    return;
  }
  if (!make || !model || !year || !mileage) {
    toast("Select make, model, year, and enter mileage.");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await saveUserProfile(cred.user.uid, name, email, {
      make: make,
      model: model,
      year: year,
      mileage: mileage,
    });
    toast("Account created!");
  } catch (err) {
    toast(err.message || "Could not register.");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    toast("Welcome back!");
  } catch (err) {
    toast(err.message || "Could not sign in.");
  }
}

function openSheet() {
  $("#gasSheetBackdrop").hidden = false;
  $("#gasSheet").hidden = false;
  const car = state.profile && state.profile.car;
  if (car) $("#entryMileage").placeholder = "e.g. " + (Number(car.mileage) + 100);
}

function closeSheet() {
  $("#gasSheetBackdrop").hidden = true;
  $("#gasSheet").hidden = true;
  $("#gasEntryForm").reset();
}

async function handleSaveTrip(e) {
  e.preventDefault();
  if (!state.user) return;

  const name = $("#entryName").value.trim();
  const location = $("#entryLocation").value.trim();
  const gallons = Number($("#entryGallons").value);
  const cost = Number($("#entryCost").value);
  const mileage = Number($("#entryMileage").value);

  if (!name || !location || !gallons || !cost || !mileage) {
    toast("Fill in all trip fields.");
    return;
  }

  try {
    await addDoc(collection(db, "users", state.user.uid, "trips"), {
      name: name,
      location: location,
      gallons: gallons,
      cost: cost,
      mileage: mileage,
      date: formatDate(new Date()),
      createdAt: new Date(),
    });

    if (state.profile && state.profile.car) {
      const car = Object.assign({}, state.profile.car, { mileage: mileage });
      await saveUserProfile(state.user.uid, state.profile.name, state.profile.email, car);
      state.profile.car = car;
      renderCarCard();
    }

    closeSheet();
    toast("Trip saved!");
    await loadTrips(state.user.uid);
  } catch (err) {
    toast(err.message || "Could not save trip.");
  }
}

function bindEvents() {
  var switchBtn = $("#gasAuthSwitchBtn");
  if (switchBtn) {
    switchBtn.addEventListener("click", function () {
      state.authMode = state.authMode === "register" ? "login" : "register";
      renderAuth();
    });
  }

  var regForm = $("#gasRegisterForm");
  if (regForm) regForm.addEventListener("submit", handleRegister);

  var loginForm = $("#gasLoginForm");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  var fab = $("#gasFab");
  if (fab) fab.addEventListener("click", openSheet);

  var backdrop = $("#gasSheetBackdrop");
  if (backdrop) backdrop.addEventListener("click", closeSheet);

  var cancel = $("#gasEntryCancel");
  if (cancel) cancel.addEventListener("click", closeSheet);

  var entryForm = $("#gasEntryForm");
  if (entryForm) entryForm.addEventListener("submit", handleSaveTrip);

  var headerAction = $("#gasHeaderAction");
  if (headerAction) {
    headerAction.addEventListener("click", async function () {
      await signOut(auth);
      toast("Signed out.");
    });
  }
}

onAuthStateChanged(auth, async function (user) {
  state.user = user;
  if (user) {
    await loadProfile(user.uid);
    await loadTrips(user.uid);
    showScreen("trips");
  } else {
    state.profile = null;
    state.trips = [];
    showScreen("auth");
    renderAuth();
  }
});

bindEvents();
renderAuth();
