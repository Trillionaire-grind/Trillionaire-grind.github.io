import { ICONS_APP_VERSION, iconsVersionLabel } from "./iconsVersion.js";
import { ICONS_LECTURES, getIconsLecture } from "./iconsLectures.js";

const STORAGE = {
  goal: "iconsGoal",
  start: "iconsChallengeStart",
  lastMarked: "iconsLastMarkedDay",
  completedDays: "iconsCompletedDays",
  playbackSec: "iconsPlaybackSec",
  audioPos: "iconsAudioPosition",
  playbackSpeed: "iconsPlaybackSpeed",
  lecture: "iconsLecture",
};

const CHALLENGE_DAYS = 30;
const LISTEN_THRESHOLD = 0.9;
const PLAYBACK_MIN_SECONDS = 30;
const RING_CIRC = 100.53;
const SAVE_POS_INTERVAL_MS = 4000;

const audio = document.getElementById("icAudio");
const playBtn = document.getElementById("icPlayBtn");
const seeker = document.getElementById("icSeeker");
const curTime = document.getElementById("icCurTime");
const durTime = document.getElementById("icDurTime");
const speed = document.getElementById("icSpeed");
const cardFlipper = document.getElementById("icCardFlipper");
const flipHintBtn = document.getElementById("icFlipHintBtn");
const flipHintSuffix = document.getElementById("icFlipHintSuffix");
const flipLive = document.getElementById("icFlipLive");
const goalTV = document.getElementById("icGoalTV");
const editBtn = document.getElementById("icEditBtn");
const modal = document.getElementById("icEditModal");
const editInput = document.getElementById("icEditInput");
const saveBtn = document.getElementById("icSaveBtn");
const cancelBtn = document.getElementById("icCancelBtn");
const dayLabel = document.getElementById("icDayLabel");
const progressFill = document.getElementById("icProgressFill");
const progressListened = document.getElementById("icProgressListened");
const progressRemaining = document.getElementById("icProgressRemaining");
const completeBanner = document.getElementById("icComplete");
const headerRingFill = document.querySelector(".ss-header__ring-fill");
const markBtn = document.getElementById("icMarkBtn");
const restartBtn = document.getElementById("icRestartBtn");
const listenHint = document.getElementById("icListenHint");
const audioOffline = document.getElementById("icAudioOffline");
const stepsFirst = document.getElementById("icStepsFirst");
const stepsMore = document.getElementById("icStepsMore");
const stepsMoreList = document.getElementById("icStepsMoreList");
const stepsToggle = document.getElementById("icStepsToggle");
const lectureList = document.getElementById("icLectureList");
const headerSub = document.getElementById("icHeaderSub");
const playerLabel = document.getElementById("icPlayerLabel");
const playerCredit = document.getElementById("icPlayerCredit");
const challengeTitle = document.getElementById("icChallengeTitle");
const challengeTagline = document.getElementById("icChallengeTagline");
const cardBack = document.getElementById("icCardBack");
const modalIntro = document.getElementById("icModalIntro");
const versionEl = document.getElementById("icVersion");

function lectureFromQuery() {
  const id = new URLSearchParams(window.location.search).get("lecture");
  if (id && ICONS_LECTURES.some((lecture) => lecture.id === id)) return id;
  return "";
}

let currentLectureId =
  lectureFromQuery() || localStorage.getItem(STORAGE.lecture) || ICONS_LECTURES[0].id;
let modalFocusReturn = null;
let lastPosSave = 0;
let positionRestored = false;
let lastAudioTime = 0;
let playbackDayLoaded = 0;

function getLecture() {
  return getIconsLecture(currentLectureId);
}

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

function updateHeaderRing() {
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
  return `${STORAGE.playbackSec}_${currentLectureId}_${day}`;
}

function getPlaybackSeconds(day) {
  const raw = parseFloat(localStorage.getItem(playbackKey(day)) || "0");
  return Number.isFinite(raw) ? raw : 0;
}

function setPlaybackSeconds(day, seconds) {
  localStorage.setItem(playbackKey(day), String(seconds));
}

function clearPlaybackSeconds() {
  for (const lecture of ICONS_LECTURES) {
    for (let d = 1; d <= CHALLENGE_DAYS; d++) {
      localStorage.removeItem(`${STORAGE.playbackSec}_${lecture.id}_${d}`);
    }
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
  const lecture = getLecture();

  if (completeBanner) {
    completeBanner.querySelector("p").textContent = lecture.completeText;
  }

  if (!day) {
    dayLabel.innerHTML = 'Set your goal to begin <span>Day 1</span>';
    progressFill.style.width = "0%";
    if (progressListened) {
      progressListened.hidden = true;
      progressListened.textContent = `0 of ${CHALLENGE_DAYS} listened`;
    }
    if (progressRemaining) progressRemaining.textContent = `${CHALLENGE_DAYS} days left`;
    updateHeaderRing();
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
  updateHeaderRing();

  if (complete) {
    listenHint.hidden = true;
    return;
  }

  const marked = isTodayMarked();
  if (marked) {
    markBtn.textContent = listenSource === "listen" ? "Listened today. Well done." : "I listened today";
    listenHint.hidden = true;
  } else {
    markBtn.textContent = "I listened today";
    listenHint.hidden = false;
    listenHint.textContent =
      "Press play below. Listen to at least 90% of today's recording (30+ seconds of playback).";
    listenHint.classList.remove("is-ready");
  }

  markBtn.classList.toggle("is-done", marked);
  markBtn.disabled = marked;
}

function restartChallenge() {
  const ok = window.confirm(
    "Start the 30 days over? Your goal and lecture stay on this device. Listening progress resets."
  );
  if (!ok) return;

  localStorage.setItem(STORAGE.start, new Date().toISOString());
  localStorage.removeItem(STORAGE.lastMarked);
  localStorage.setItem(STORAGE.completedDays, "[]");
  clearPlaybackSeconds();
  clearAllSavedAudioPositions();
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
  const lecture = getLecture();
  const flipped = cardFlipper.classList.contains("is-flipped");
  flipHintBtn.textContent = "Flip card";
  flipHintSuffix.textContent = flipped ? " to show my goal" : lecture.flipHint;
  cardFlipper.setAttribute(
    "aria-label",
    flipped
      ? `Goal card showing ${lecture.back.ref}. Tap to flip.`
      : "Goal card showing your goal. Tap to flip."
  );
  if (flipLive) {
    flipLive.textContent = flipped ? lecture.flipLive : "Now showing your clearly defined goal.";
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
  stepsToggle.textContent = open ? "Hide steps 3-8" : "Show steps 3-8";
}

function checkListenProgress() {
  if (!audio?.duration || isTodayMarked()) return;
  const ratio = audio.currentTime / audio.duration;
  const played = getPlaybackSeconds(getChallengeDay());
  if (canAutoCompleteListen()) {
    markTodayComplete("listen");
  } else if (ratio >= 0.05 && listenHint && !listenHint.hidden) {
    const need = Math.max(0, PLAYBACK_MIN_SECONDS - Math.floor(played));
    listenHint.textContent = `Keep listening. ${Math.round(ratio * 100)}% done. ${need}s more playback needed.`;
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

function audioPosKey() {
  return `${STORAGE.audioPos}_${currentLectureId}`;
}

function saveAudioPosition() {
  if (!audio || !Number.isFinite(audio.currentTime)) return;
  localStorage.setItem(audioPosKey(), String(audio.currentTime));
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
  const raw = localStorage.getItem(audioPosKey());
  if (!raw) return;
  const t = parseFloat(raw);
  if (!Number.isFinite(t) || t <= 0) return;
  audio.currentTime = Math.min(t, Math.max(0, audio.duration - 0.25));
  positionRestored = true;
  lastAudioTime = audio.currentTime;
  updateSeekerUI();
}

function clearSavedAudioPosition() {
  localStorage.removeItem(audioPosKey());
}

function clearAllSavedAudioPositions() {
  for (const lecture of ICONS_LECTURES) {
    localStorage.removeItem(`${STORAGE.audioPos}_${lecture.id}`);
  }
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

function stepItem(index, text) {
  return `
    <li class="ss-step" value="${index}">
      <span class="ss-step__num">${index}</span>
      <p class="ss-step__text">${text}</p>
    </li>
  `;
}

function renderSteps(lecture) {
  const [first, second, ...rest] = lecture.steps;
  stepsFirst.innerHTML = stepItem(1, first) + stepItem(2, second);
  stepsMoreList.innerHTML = rest.map((text, i) => stepItem(i + 3, text)).join("");
  stepsMore.hidden = true;
  stepsToggle.setAttribute("aria-expanded", "false");
  stepsToggle.textContent = "Show steps 3-8";
}

function renderCardBack(lecture) {
  const verses = lecture.back.verses
    .map((verse) => {
      const num = verse.num
        ? `<span class="ss-card-back__vnum">${verse.num}</span>`
        : "";
      return `<p class="ss-card-back__verse ic-card-back__quote">${num}${verse.text}</p>`;
    })
    .join("");
  const image = lecture.back.image
    ? `<img class="ss-card-back__img" src="${lecture.back.image}" alt="${lecture.back.imageAlt || ""}" width="90">`
    : "";
  cardBack.innerHTML = `
    <div class="ss-card-blossoms" aria-hidden="true"></div>
    <span class="ss-card-flip-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
    </span>
    <p class="ss-card-back__ref">${lecture.back.ref}</p>
    <div class="ss-card-back__body">
      <div class="ss-card-back__text">${verses}</div>
      ${image}
    </div>
  `;
}

function renderLecturePicker() {
  lectureList.innerHTML = ICONS_LECTURES.map((lecture) => {
    const active = lecture.id === currentLectureId;
    return `
      <button type="button" class="ic-lecture${active ? " is-active" : ""}" role="option"
        aria-selected="${active ? "true" : "false"}" data-lecture="${lecture.id}">
        <span class="ic-lecture__speaker">${lecture.speaker}</span>
        <span class="ic-lecture__title">${lecture.title}</span>
        <span class="ic-lecture__meta">${lecture.durationLabel}</span>
      </button>
    `;
  }).join("");
}

function applyLecture({ resetAudio = false } = {}) {
  const lecture = getLecture();
  localStorage.setItem(STORAGE.lecture, lecture.id);

  if (headerSub) headerSub.textContent = `${lecture.speaker} · 30 Day Challenge`;
  if (playerLabel) playerLabel.textContent = lecture.playerLabel;
  if (playerCredit) playerCredit.textContent = lecture.credit;
  if (challengeTitle) challengeTitle.textContent = lecture.challengeTitle;
  if (challengeTagline) challengeTagline.textContent = lecture.tagline;
  if (modalIntro) modalIntro.textContent = lecture.modalIntro;

  renderLecturePicker();
  renderSteps(lecture);
  renderCardBack(lecture);
  updateFlipHint();
  updateProgressUI();

  if (!audio) return;

  const nextSrc = new URL(lecture.audioSrc, window.location.href).href;
  const sameSrc = audio.currentSrc === nextSrc || audio.getAttribute("src") === lecture.audioSrc;
  if (resetAudio || !sameSrc) {
    const wasPlaying = !audio.paused;
    if (wasPlaying) audio.pause();
    positionRestored = false;
    lastAudioTime = 0;
    audio.src = lecture.audioSrc;
    audio.load();
    restorePlaybackSpeed();
    curTime.textContent = "0:00";
    durTime.textContent = "0:00";
    seeker.value = 0;
    seeker.style.setProperty("--value", "0%");
  }
}

function selectLecture(id) {
  if (id === currentLectureId) return;
  if (audio && !audio.paused) audio.pause();
  saveAudioPosition();
  currentLectureId = id;
  applyLecture({ resetAudio: true });
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
  cardFlipper.setAttribute("role", "button");
  cardFlipper.setAttribute("tabindex", "0");

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

  lectureList.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-lecture]");
    if (!btn) return;
    selectLecture(btn.getAttribute("data-lecture"));
  });

  applyLecture();
  renderGoal();
}

if (versionEl) versionEl.textContent = iconsVersionLabel();

initAudio();
initGoal();
