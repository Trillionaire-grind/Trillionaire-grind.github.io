const STORAGE = {
  goal: "userValue",
  start: "ssChallengeStart",
  lastMarked: "ssLastMarkedDay",
  completedDays: "ssCompletedDays",
  playbackSec: "ssPlaybackSec",
  audioPos: "ssAudioPosition",
  playbackSpeed: "ssPlaybackSpeed",
  theme: "ssTheme",
  unlockedThemes: "ssUnlockedThemes",
};

const THEMES = [
  "gold", "blue", "cream", "cherryblossom", "burgundy", "black",
  "sakura", "fastred", "purplefever", "starrynights", "arcadia",
];
const THEME_META = {
  gold: "#0a0a0a",
  blue: "#080f1a",
  cream: "#f4efe4",
  cherryblossom: "#e4e9ef",
  burgundy: "#160c10",
  black: "#000000",
  sakura: "#064e56",
  fastred: "#0a0a0a",
  purplefever: "#12081f",
  starrynights: "#0a1628",
  arcadia: "#f0ece6",
};
const LEGACY_THEMES = {
  midnight: "blue",
  paper: "cream",
  meadow: "cherryblossom",
  mint: "cherryblossom",
  mintchip: "cherryblossom",
  forest: "cherryblossom",
  crimson: "burgundy",
  grey: "black",
};

const CHALLENGE_DAYS = 30;
const SS_APP_VERSION = "0.0.0.4";
const LISTEN_THRESHOLD = 0.9;
const PLAYBACK_MIN_SECONDS = 30;
const RING_CIRC = 100.53;
const SAVE_POS_INTERVAL_MS = 4000;

const audio = document.getElementById("ssAudio");
const playBtn = document.getElementById("ssPlayBtn");
const seeker = document.getElementById("ssSeeker");
const curTime = document.getElementById("ssCurTime");
const durTime = document.getElementById("ssDurTime");
const speed = document.getElementById("ssSpeed");
const cardFlipper = document.getElementById("ssCardFlipper");
const flipHintBtn = document.getElementById("ssFlipHintBtn");
const flipHintSuffix = document.getElementById("ssFlipHintSuffix");
const flipLive = document.getElementById("ssFlipLive");
const goalTV = document.getElementById("goalTV");
const editBtn = document.getElementById("editBtn");
const modal = document.getElementById("editModal");
const editInput = document.getElementById("editInput");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const dayLabel = document.getElementById("ssDayLabel");
const progressFill = document.getElementById("ssProgressFill");
const progressListened = document.getElementById("ssProgressListened");
const progressRemaining = document.getElementById("ssProgressRemaining");
const completeBanner = document.getElementById("ssComplete");
const headerRingFill = document.querySelector(".ss-header__ring-fill");
const markBtn = document.getElementById("ssMarkBtn");
const restartBtn = document.getElementById("ssRestartBtn");
const listenHint = document.getElementById("ssListenHint");
const audioOffline = document.getElementById("ssAudioOffline");
const stepsMore = document.getElementById("ssStepsMore");
const stepsToggle = document.getElementById("ssStepsToggle");

let modalFocusReturn = null;
let lastPosSave = 0;
let positionRestored = false;
let lastAudioTime = 0;
let playbackDayLoaded = 0;

function formatTime(t) {
  if (!Number.isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDaysLeft(day) {
  const left = Math.max(CHALLENGE_DAYS - day, 0);
  if (left === 0) return "Final day";
  if (left === 1) return "1 day left";
  return `${left} days left`;
}

function updateHeaderRing(day) {
  if (!headerRingFill) return;
  const listenCount = getCompletedDays().length;
  const pct = listenCount / CHALLENGE_DAYS;
  headerRingFill.style.strokeDashoffset = String(RING_CIRC * (1 - pct));
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getChallengeDay() {
  const raw = localStorage.getItem(STORAGE.start);
  if (!raw) return 0;
  const start = startOfDay(raw);
  const today = startOfDay(new Date());
  const diff = Math.floor((today - start) / 86400000) + 1;
  return Math.min(Math.max(diff, 1), CHALLENGE_DAYS);
}

function getCompletedDays() {
  try {
    const days = JSON.parse(localStorage.getItem(STORAGE.completedDays) || "[]");
    return Array.isArray(days) ? days.filter((d) => d >= 1 && d <= CHALLENGE_DAYS) : [];
  } catch {
    return [];
  }
}

function migrateCompletedDays() {
  if (localStorage.getItem(STORAGE.completedDays)) return;
  const last = parseInt(localStorage.getItem(STORAGE.lastMarked) || "", 10);
  if (last >= 1 && last <= CHALLENGE_DAYS) {
    localStorage.setItem(STORAGE.completedDays, JSON.stringify([last]));
  } else {
    localStorage.setItem(STORAGE.completedDays, "[]");
  }
}

function addCompletedDay(day) {
  const days = getCompletedDays();
  if (!days.includes(day)) {
    days.push(day);
    days.sort((a, b) => a - b);
    localStorage.setItem(STORAGE.completedDays, JSON.stringify(days));
  }
  localStorage.setItem(STORAGE.lastMarked, String(day));
}

function isTodayMarked() {
  const day = getChallengeDay();
  return day > 0 && getCompletedDays().includes(day);
}

function isChallengeComplete() {
  return getCompletedDays().length >= CHALLENGE_DAYS;
}

function playbackKey(day) {
  return `${STORAGE.playbackSec}_${day}`;
}

function getPlaybackSeconds(day) {
  const raw = parseFloat(localStorage.getItem(playbackKey(day)) || "0");
  return Number.isFinite(raw) ? raw : 0;
}

function setPlaybackSeconds(day, seconds) {
  localStorage.setItem(playbackKey(day), String(seconds));
}

function clearPlaybackSeconds() {
  for (let d = 1; d <= CHALLENGE_DAYS; d++) {
    localStorage.removeItem(playbackKey(d));
  }
}

function syncPlaybackDay() {
  const day = getChallengeDay();
  if (day !== playbackDayLoaded) {
    playbackDayLoaded = day;
    lastAudioTime = audio?.currentTime || 0;
  }
}

function trackPlaybackTime() {
  if (!audio || audio.paused || !audio.duration) return;
  const day = getChallengeDay();
  if (!day || isTodayMarked()) return;
  syncPlaybackDay();
  const delta = audio.currentTime - lastAudioTime;
  lastAudioTime = audio.currentTime;
  if (delta <= 0 || delta > 2.5) return;
  const next = getPlaybackSeconds(day) + delta;
  setPlaybackSeconds(day, next);
}

function canAutoCompleteListen() {
  if (!audio?.duration) return false;
  const day = getChallengeDay();
  const ratio = audio.currentTime / audio.duration;
  return ratio >= LISTEN_THRESHOLD && getPlaybackSeconds(day) >= PLAYBACK_MIN_SECONDS;
}

function ensureChallengeStart() {
  if (!localStorage.getItem(STORAGE.start)) {
    localStorage.setItem(STORAGE.start, new Date().toISOString());
  }
}

function markTodayComplete(source) {
  const day = getChallengeDay();
  if (!day || isTodayMarked()) return false;
  addCompletedDay(day);
  updateProgressUI(source);
  return true;
}

function updateProgressUI(listenSource) {
  const day = getChallengeDay();
  const listenCount = getCompletedDays().length;
  const complete = isChallengeComplete();

  if (!day) {
    dayLabel.innerHTML = 'Set your goal to begin <span>Day 1</span>';
    progressFill.style.width = "0%";
    if (progressListened) {
      progressListened.hidden = true;
      progressListened.textContent = `0 of ${CHALLENGE_DAYS} listened`;
    }
    if (progressRemaining) progressRemaining.textContent = `${CHALLENGE_DAYS} days left`;
    updateHeaderRing(0);
    markBtn.hidden = true;
    listenHint.hidden = true;
    if (restartBtn) restartBtn.hidden = true;
    if (completeBanner) completeBanner.hidden = true;
    return;
  }

  if (restartBtn) restartBtn.hidden = false;
  if (completeBanner) completeBanner.hidden = !complete;

  markBtn.hidden = complete;
  listenHint.hidden = complete;

  dayLabel.innerHTML = `Day <span>${day}</span> of ${CHALLENGE_DAYS}`;
  progressFill.style.width = `${Math.round((listenCount / CHALLENGE_DAYS) * 100)}%`;
  if (progressListened) {
    progressListened.hidden = false;
    progressListened.textContent = `${listenCount} of ${CHALLENGE_DAYS} listened`;
  }
  if (progressRemaining) progressRemaining.textContent = formatDaysLeft(day);
  updateHeaderRing(day);

  if (complete) {
    listenHint.hidden = true;
    return;
  }

  const marked = isTodayMarked();
  if (marked) {
    markBtn.textContent = listenSource === "listen" ? "✓ Listened today — well done" : "✓ I listened today";
    listenHint.hidden = true;
  } else {
    markBtn.textContent = "I listened today";
    listenHint.hidden = false;
    listenHint.textContent =
      "Press play below — listen to at least 90% of today's recording (30+ seconds of playback).";
    listenHint.classList.remove("is-ready");
  }

  markBtn.classList.toggle("is-done", marked);
  markBtn.disabled = marked;
}

function restartChallenge() {
  const ok = window.confirm(
    "Start the 30 days over? Your goal and theme stay on this device — listening progress resets."
  );
  if (!ok) return;

  localStorage.setItem(STORAGE.start, new Date().toISOString());
  localStorage.removeItem(STORAGE.lastMarked);
  localStorage.setItem(STORAGE.completedDays, "[]");
  clearPlaybackSeconds();
  clearSavedAudioPosition();
  playbackDayLoaded = 0;
  lastAudioTime = audio?.currentTime || 0;

  if (audio && !audio.paused) audio.pause();
  renderGoal();
}

function renderGoal() {
  const goal = localStorage.getItem(STORAGE.goal) || "";
  if (goal.trim()) {
    goalTV.textContent = goal;
    goalTV.classList.remove("ss-goal-placeholder");
    ensureChallengeStart();
  } else {
    goalTV.textContent = "Tap edit to write your goal";
    goalTV.classList.add("ss-goal-placeholder");
  }
  updateProgressUI();
}

function getModalFocusables() {
  return [...modal.querySelectorAll("button, textarea, [href], input, select")].filter(
    (el) => !el.disabled
  );
}

function onModalKeydown(e) {
  if (e.key === "Escape") {
    closeModal();
    return;
  }
  if (e.key !== "Tab" || !modal.classList.contains("is-open")) return;
  const focusables = getModalFocusables();
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function openModal() {
  modalFocusReturn = document.activeElement;
  editInput.value = localStorage.getItem(STORAGE.goal) || "";
  modal.classList.add("is-open");
  editInput.focus();
}

function closeModal() {
  modal.classList.remove("is-open");
  const target = modalFocusReturn?.focus ? modalFocusReturn : editBtn;
  modalFocusReturn = null;
  target.focus();
}

function saveGoal() {
  const value = editInput.value.trim();
  if (!value) return;
  const hadGoal = Boolean(localStorage.getItem(STORAGE.goal)?.trim());
  localStorage.setItem(STORAGE.goal, value);
  if (!hadGoal) ensureChallengeStart();
  closeModal();
  renderGoal();
}

function updateFlipHint() {
  const flipped = cardFlipper.classList.contains("is-flipped");
  flipHintBtn.textContent = "Flip card";
  flipHintSuffix.textContent = flipped ? " to show my goal" : " to read Matthew 7:7–8";
  cardFlipper.setAttribute(
    "aria-label",
    flipped
      ? "Goal card showing Matthew 7:7–8. Tap to flip."
      : "Goal card showing your goal. Tap to flip."
  );
  if (flipLive) {
    flipLive.textContent = flipped
      ? "Now showing Matthew chapter 7, verses 7 and 8."
      : "Now showing your clearly defined goal.";
  }
}

function toggleFlip() {
  cardFlipper.classList.toggle("is-flipped");
  updateFlipHint();
}

function toggleStepsMore() {
  const open = stepsMore.hidden;
  stepsMore.hidden = !open;
  stepsToggle.setAttribute("aria-expanded", open ? "true" : "false");
  stepsToggle.textContent = open ? "Hide steps 3–8" : "Show steps 3–8";
}

function checkListenProgress() {
  if (!audio?.duration || isTodayMarked()) return;
  const ratio = audio.currentTime / audio.duration;
  const played = getPlaybackSeconds(getChallengeDay());
  if (canAutoCompleteListen()) {
    markTodayComplete("listen");
  } else if (ratio >= 0.05 && listenHint && !listenHint.hidden) {
    const need = Math.max(0, PLAYBACK_MIN_SECONDS - Math.floor(played));
    listenHint.textContent = `Keep listening… ${Math.round(ratio * 100)}% — ${need}s more playback needed`;
    listenHint.classList.add("is-ready");
  }
}

function updateSeekerUI() {
  if (!audio?.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  seeker.value = pct;
  seeker.style.setProperty("--value", `${pct}%`);
  curTime.textContent = formatTime(audio.currentTime);
}

function saveAudioPosition() {
  if (!audio || !Number.isFinite(audio.currentTime)) return;
  localStorage.setItem(STORAGE.audioPos, String(audio.currentTime));
}

function maybeSaveAudioPosition() {
  const now = Date.now();
  if (now - lastPosSave >= SAVE_POS_INTERVAL_MS) {
    lastPosSave = now;
    saveAudioPosition();
  }
}

function restoreAudioPosition() {
  if (!audio?.duration || positionRestored) return;
  const raw = localStorage.getItem(STORAGE.audioPos);
  if (!raw) return;
  const t = parseFloat(raw);
  if (!Number.isFinite(t) || t <= 0) return;
  audio.currentTime = Math.min(t, Math.max(0, audio.duration - 0.25));
  positionRestored = true;
  lastAudioTime = audio.currentTime;
  updateSeekerUI();
}

function clearSavedAudioPosition() {
  localStorage.removeItem(STORAGE.audioPos);
}

function showAudioOfflineHint() {
  if (audioOffline) audioOffline.hidden = false;
}

function hideAudioOfflineHint() {
  if (audioOffline) audioOffline.hidden = true;
}

function restorePlaybackSpeed() {
  if (!speed || !audio) return;
  const saved = localStorage.getItem(STORAGE.playbackSpeed);
  if (saved && [...speed.options].some((o) => o.value === saved)) {
    speed.value = saved;
    audio.playbackRate = parseFloat(saved);
  }
}

function onAudioReady() {
  durTime.textContent = formatTime(audio.duration);
  restoreAudioPosition();
  hideAudioOfflineHint();
}

function initAudio() {
  if (!audio) return;

  restorePlaybackSpeed();

  audio.addEventListener("loadedmetadata", onAudioReady);
  if (audio.readyState >= 1) onAudioReady();

  audio.addEventListener("error", showAudioOfflineHint);

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    updateSeekerUI();
    trackPlaybackTime();
    checkListenProgress();
    maybeSaveAudioPosition();
  });

  seeker.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (seeker.value / 100) * audio.duration;
    lastAudioTime = audio.currentTime;
    saveAudioPosition();
  });

  playBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(showAudioOfflineHint);
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => {
    playBtn.classList.add("is-playing");
    lastAudioTime = audio.currentTime;
  });
  audio.addEventListener("pause", () => {
    playBtn.classList.remove("is-playing");
    saveAudioPosition();
  });
  audio.addEventListener("ended", () => {
    playBtn.classList.remove("is-playing");
    clearSavedAudioPosition();
    if (canAutoCompleteListen()) markTodayComplete("listen");
  });

  speed.addEventListener("change", () => {
    audio.playbackRate = parseFloat(speed.value);
    localStorage.setItem(STORAGE.playbackSpeed, speed.value);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveAudioPosition();
  });
  window.addEventListener("pagehide", saveAudioPosition);
}

function initGoal() {
  migrateCompletedDays();

  cardFlipper.setAttribute("role", "button");
  cardFlipper.setAttribute("tabindex", "0");
  updateFlipHint();

  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openModal();
  });

  saveBtn.addEventListener("click", saveGoal);
  cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("keydown", onModalKeydown);

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveGoal();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  cardFlipper.addEventListener("click", (e) => {
    if (e.target.closest(".ss-edit-btn")) return;
    toggleFlip();
  });

  cardFlipper.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFlip();
    }
  });

  flipHintBtn.addEventListener("click", toggleFlip);

  markBtn.addEventListener("click", () => {
    if (!getChallengeDay() || isTodayMarked()) return;
    markTodayComplete("manual");
  });

  restartBtn?.addEventListener("click", restartChallenge);
  stepsToggle.addEventListener("click", toggleStepsMore);

  renderGoal();

  if (!localStorage.getItem(STORAGE.goal)?.trim()) {
    openModal();
  }
}

initAudio();
initGoal();
initPwa();

function getThemeCatalog() {
  return window.SS_THEME_CATALOG || { themes: {}, bundle: {}, previewSeconds: 8 };
}

function getUnlockedThemes() {
  try {
    const raw = localStorage.getItem(STORAGE.unlockedThemes);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}

function isThemeFree(id) {
  return Boolean(getThemeCatalog().themes[id]?.free);
}

function isThemeUnlocked(id) {
  return THEMES.includes(id) && (isThemeFree(id) || getUnlockedThemes().includes(id));
}

let previewTimer = null;
let themeBeforePreview = null;
let previewBanner = null;

function ensurePreviewBanner() {
  if (previewBanner) return previewBanner;
  previewBanner = document.createElement("p");
  previewBanner.className = "ss-theme-preview-banner";
  previewBanner.hidden = true;
  document.body.appendChild(previewBanner);
  return previewBanner;
}

function clearThemePreview() {
  if (previewTimer) {
    clearTimeout(previewTimer);
    previewTimer = null;
  }
  if (previewBanner) previewBanner.hidden = true;
  themeBeforePreview = null;
  document.body.classList.remove("ss-theme-previewing");
}

function syncThemeStoreSelection(theme) {
  const store = document.getElementById("ssThemeStore");
  if (!store?.classList.contains("is-open")) return;

  store.querySelectorAll(".ss-theme-item").forEach((row) => {
    const id = row.getAttribute("data-theme");
    const isActive = id === theme;
    row.classList.toggle("is-active", isActive);
    const useBtn = row.querySelector("[data-use-theme]");
    if (useBtn) {
      useBtn.textContent = isActive ? "Selected" : "Use";
      useBtn.setAttribute("aria-pressed", isActive ? "true" : "false");
    }
  });
}

function refreshThemeStoreUI() {
  const store = document.getElementById("ssThemeStore");
  if (!store?.classList.contains("is-open")) return;
  const active = localStorage.getItem(STORAGE.theme) || "gold";
  renderThemeStore();
  store.classList.add("is-open");
  syncThemeStoreSelection(active);
}

function paintTheme(theme) {
  document.documentElement.setAttribute("data-ss-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = THEME_META[theme] || THEME_META.gold;
  document.querySelectorAll(".ss-theme-swatch").forEach((btn) => {
    const active = btn.getAttribute("data-theme") === theme;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function applyTheme(id, { persist = true, openStoreOnLock = true } = {}) {
  const theme = THEMES.includes(id) ? id : "gold";
  if (persist && !isThemeUnlocked(theme)) {
    if (openStoreOnLock) openThemeStore(theme);
    return false;
  }

  paintTheme(theme);
  if (persist) {
    localStorage.setItem(STORAGE.theme, theme);
    clearThemePreview();
  }
  syncThemeStoreSelection(theme);
  return true;
}

function previewTheme(id) {
  const themeId = String(id || "").trim();
  if (!THEMES.includes(themeId)) return;

  if (isThemeUnlocked(themeId)) {
    applyTheme(themeId);
    refreshThemeStoreUI();
    return;
  }

  const seconds = getThemeCatalog().previewSeconds || 8;
  const revertTo = localStorage.getItem(STORAGE.theme) || "gold";

  clearThemePreview();
  themeBeforePreview = revertTo;

  closeThemeStore();

  paintTheme(themeId);

  const banner = ensurePreviewBanner();
  const name = getThemeCatalog().themes[themeId]?.name || themeId;
  banner.textContent = `Previewing ${name} — reverting in ${seconds}s`;
  banner.hidden = false;
  document.body.classList.add("ss-theme-previewing");

  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    applyTheme(themeBeforePreview || "gold", { openStoreOnLock: false });
    clearThemePreview();
  }, seconds * 1000);
}

function openThemeStore(highlightId) {
  const store = document.getElementById("ssThemeStore");
  if (!store) return;
  renderThemeStore();
  store.classList.add("is-open");
  document.getElementById("ssThemeOpenBtn")?.setAttribute("aria-expanded", "true");
  if (highlightId) {
    const row = store.querySelector(`.ss-theme-item[data-theme="${highlightId}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }
}

function closeThemeStore() {
  const store = document.getElementById("ssThemeStore");
  store?.classList.remove("is-open");
  document.getElementById("ssThemeOpenBtn")?.setAttribute("aria-expanded", "false");
}

function purchaseTheme(stripeUrl) {
  if (!stripeUrl) return;
  window.open(stripeUrl, "_blank", "noopener,noreferrer");
}

function renderThemeStore() {
  const catalog = getThemeCatalog();
  const listEl = document.getElementById("ssThemeList");
  const bundleEl = document.getElementById("ssThemeBundle");
  if (!listEl || !bundleEl) return;

  const active = localStorage.getItem(STORAGE.theme) || "gold";
  const bundle = catalog.bundle || {};
  const bundleOwned = (bundle.includes || []).every((id) => isThemeUnlocked(id));
  const bundleReady = Boolean(bundle.stripeUrl);

  bundleEl.innerHTML = `
    <h4>${bundle.name || "All premium themes"}</h4>
    <p>${(bundle.includes || []).map((id) => catalog.themes[id]?.name || id).join(" · ")}</p>
    ${
      bundleOwned
        ? `<span class="ss-theme-item__status">Bundle owned — all premium themes unlocked</span>`
        : `<button type="button" class="ss-btn ss-btn--gold" data-buy-bundle ${bundleReady ? "" : "disabled"}>
            ${bundleReady ? `Unlock bundle · ${bundle.priceLabel || ""}` : "Bundle link pending"}
          </button>`
    }
  `;

  listEl.innerHTML = THEMES.map((id) => {
    const info = catalog.themes[id] || { name: id };
    const unlocked = isThemeUnlocked(id);
    const isActive = active === id;
    const buyReady = Boolean(info.stripeUrl);
    const status = info.free
      ? "Included free"
      : unlocked
        ? "Unlocked on this device"
        : info.premium
          ? `Signature · ${info.priceLabel || "Paid"}`
          : `Premium · ${info.priceLabel || "Paid"}`;

    let actions = "";
    if (unlocked) {
      actions = `<button type="button" class="ss-btn ss-btn--gold" data-use-theme="${id}">${isActive ? "Selected" : "Use"}</button>`;
    } else {
      actions = `
        <button type="button" class="ss-btn ss-btn--ghost" data-preview-theme="${id}">Preview</button>
        <button type="button" class="ss-btn ss-btn--gold" data-buy-theme="${id}" ${buyReady ? "" : "disabled"}>
          ${buyReady ? `Buy ${info.priceLabel || ""}` : "Link pending"}
        </button>`;
    }

    return `
      <li class="ss-theme-item${isActive ? " is-active" : ""}" data-theme="${id}">
        <button type="button" class="ss-theme-swatch ss-theme-swatch--lg${unlocked ? "" : " is-locked"}"
          data-theme="${id}" title="${info.name}" aria-label="${info.name}"></button>
        <div class="ss-theme-item__meta">
          <p class="ss-theme-item__name">${info.name}</p>
          <p class="ss-theme-item__status">${status}</p>
        </div>
        <div class="ss-theme-item__actions">${actions}</div>
      </li>`;
  }).join("");

  wireThemeStoreActions();
}

function wireThemeStoreActions() {
  const store = document.getElementById("ssThemeStore");
  if (!store) return;

  store.querySelectorAll("[data-preview-theme]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      previewTheme(btn.getAttribute("data-preview-theme"));
    });
  });

  store.querySelectorAll("[data-use-theme]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const themeId = btn.getAttribute("data-use-theme");
      if (applyTheme(themeId)) refreshThemeStoreUI();
    });
  });

  store.querySelectorAll("[data-buy-theme]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const themeId = btn.getAttribute("data-buy-theme");
      purchaseTheme(getThemeCatalog().themes[themeId]?.stripeUrl);
    });
  });

  store.querySelectorAll("[data-buy-bundle]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      if (!btn.disabled) purchaseTheme(getThemeCatalog().bundle?.stripeUrl);
    });
  });

  store.querySelectorAll(".ss-theme-swatch").forEach((swatch) => {
    swatch.addEventListener("click", (event) => {
      event.preventDefault();
      const themeId = swatch.getAttribute("data-theme");
      if (isThemeUnlocked(themeId)) {
        if (applyTheme(themeId)) refreshThemeStoreUI();
      } else {
        previewTheme(themeId);
      }
    });
  });
}

function initTheme() {
  const openBtn = document.getElementById("ssThemeOpenBtn");
  const store = document.getElementById("ssThemeStore");
  const closeBtn = document.getElementById("ssThemeStoreClose");

  openBtn?.addEventListener("click", () => openThemeStore());
  closeBtn?.addEventListener("click", closeThemeStore);
  store?.addEventListener("click", (event) => {
    if (event.target === store) closeThemeStore();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && store?.classList.contains("is-open")) {
      closeThemeStore();
    }
  });

  const params = new URLSearchParams(window.location.search);
  const fromPurchase = params.get("theme");
  if (fromPurchase && isThemeUnlocked(fromPurchase)) {
    applyTheme(fromPurchase);
    params.delete("theme");
    const next = params.toString();
    history.replaceState(null, "", window.location.pathname + (next ? `?${next}` : "") + window.location.hash);
  } else {
    const saved = localStorage.getItem(STORAGE.theme);
    const initial = LEGACY_THEMES[saved] || saved;
    const pick = initial || document.documentElement.dataset.ssTheme || "gold";
    if (isThemeUnlocked(pick)) {
      applyTheme(pick, { openStoreOnLock: false });
    } else {
      applyTheme("gold", { persist: true, openStoreOnLock: false });
    }
  }
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIosSafari() {
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && !window.MSStream;
}

function isLocalDevHost() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

function clearStrangestSecretCaches() {
  if (!("caches" in window)) return Promise.resolve();
  return caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("ss-app-")).map((k) => caches.delete(k))));
}

function initPwa() {
  const installBanner = document.getElementById("ssInstall");
  const installBtn = document.getElementById("ssInstallBtn");
  const installDismiss = document.getElementById("ssInstallDismiss");
  const installText = document.getElementById("ssInstallText");
  const installDismissKey = "ssInstallDismissed";

  if ("serviceWorker" in navigator) {
    if (isLocalDevHost()) {
      navigator.serviceWorker.getRegistrations().then((regs) => Promise.all(regs.map((r) => r.unregister())));
      clearStrangestSecretCaches();
    } else {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/strangestSecret-sw.js?v=10").catch(() => {});
      });
    }
  }

  if (!installBanner || isStandalone() || localStorage.getItem(installDismissKey)) return;

  let deferredPrompt = null;

  function hideInstallBanner() {
    installBanner.hidden = true;
  }

  function showInstallBanner(message) {
    if (installText && message) installText.textContent = message;
    installBanner.hidden = false;
  }

  installDismiss?.addEventListener("click", () => {
    localStorage.setItem(installDismissKey, "1");
    hideInstallBanner();
  });

  installBtn?.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
    localStorage.setItem(installDismissKey, "1");
    hideInstallBanner();
  });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner("Install for quick daily access — works offline after your first visit.");
  });

  if (isIosSafari()) {
    showInstallBanner("On iPhone: tap Share, then Add to Home Screen for daily access.");
    if (installBtn) installBtn.textContent = "Got it";
  }
}

initTheme();

const versionEl = document.getElementById("ssVersion");
if (versionEl) versionEl.textContent = `v${SS_APP_VERSION}`;
