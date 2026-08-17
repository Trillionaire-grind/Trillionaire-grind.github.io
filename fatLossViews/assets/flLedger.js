import { GUARANTEE_EMAIL } from "./flConfig.js";
import { flVersionLabel } from "./flVersion.js";

const STORAGE_KEY = "fl-ledger-v1";
const TOTAL_DAYS = 90;
const WORKOUTS_PER_WEEK = 3;

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultState() {
  return {
    startDate: todayISO(),
    calorieTarget: 2000,
    stepTarget: 10000,
    days: {},
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed,
      days: parsed.days && typeof parsed.days === "object" ? parsed.days : {},
    };
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dayNumber(state, iso) {
  const start = parseISO(state.startDate);
  const cur = parseISO(iso);
  return Math.round((cur - start) / 86400000) + 1;
}

function isoForDayNumber(state, n) {
  return addDays(state.startDate, n - 1);
}

function emptyDay() {
  return {
    calories: "",
    steps: "",
    workout: false,
    workoutNote: "",
    weight: "",
    mealsLogged: false,
    notes: "",
  };
}

function pillarHits(state, entry) {
  if (!entry) return { cal: false, steps: false, workout: false, count: 0 };
  const cal =
    entry.calories !== "" &&
    entry.calories != null &&
    Number(entry.calories) > 0 &&
    Number(entry.calories) <= Number(state.calorieTarget);
  const steps =
    entry.steps !== "" &&
    entry.steps != null &&
    Number(entry.steps) >= Number(state.stepTarget);
  const workout = !!entry.workout;
  return {
    cal,
    steps,
    workout,
    count: Number(cal) + Number(steps) + Number(workout),
  };
}

function weekBounds(state, iso) {
  const n = dayNumber(state, iso);
  if (n < 1 || n > TOTAL_DAYS) return null;
  const weekIndex = Math.floor((n - 1) / 7);
  const startN = weekIndex * 7 + 1;
  const endN = Math.min(startN + 6, TOTAL_DAYS);
  return { startN, endN, weekIndex: weekIndex + 1 };
}

function summarize(state) {
  let daysLogged = 0;
  let fullDays = 0;
  for (let n = 1; n <= TOTAL_DAYS; n++) {
    const iso = isoForDayNumber(state, n);
    const entry = state.days[iso];
    if (!entry) continue;
    const hits = pillarHits(state, entry);
    if (hits.count > 0 || entry.calories !== "" || entry.steps !== "" || entry.notes) {
      daysLogged += 1;
    }
    if (hits.count === 3) fullDays += 1;
  }

  const today = todayISO();
  const week = weekBounds(state, today) || weekBounds(state, state.startDate);
  let weekWorkouts = 0;
  let weekFull = 0;
  if (week) {
    for (let n = week.startN; n <= week.endN; n++) {
      const iso = isoForDayNumber(state, n);
      const entry = state.days[iso];
      if (!entry) continue;
      if (entry.workout) weekWorkouts += 1;
      if (pillarHits(state, entry).count === 3) weekFull += 1;
    }
  }

  return { daysLogged, fullDays, weekWorkouts, weekFull, week };
}

function initLedger() {
  const dayGrid = document.getElementById("dayGrid");
  if (!dayGrid) return;

  console.log("[Fat Loss ledger] working version:", flVersionLabel());

  const els = {
    version: document.getElementById("flVersion"),
    startDate: document.getElementById("startDate"),
    calorieTarget: document.getElementById("calorieTarget"),
    stepTarget: document.getElementById("stepTarget"),
    saveSetup: document.getElementById("saveSetup"),
    setupStatus: document.getElementById("setupStatus"),
    dayLabel: document.getElementById("dayLabel"),
    entryDate: document.getElementById("entryDate"),
    calories: document.getElementById("calories"),
    steps: document.getElementById("steps"),
    workout: document.getElementById("workout"),
    workoutNote: document.getElementById("workoutNote"),
    weight: document.getElementById("weight"),
    mealsLogged: document.getElementById("mealsLogged"),
    notes: document.getElementById("notes"),
    saveDay: document.getElementById("saveDay"),
    clearDay: document.getElementById("clearDay"),
    dayStatus: document.getElementById("dayStatus"),
    statLogged: document.getElementById("statLogged"),
    statFull: document.getElementById("statFull"),
    statWorkouts: document.getElementById("statWorkouts"),
    weekCopy: document.getElementById("weekCopy"),
    dayGrid,
    history: document.getElementById("history"),
    exportWeek: document.getElementById("exportWeek"),
    emailWeek: document.getElementById("emailWeek"),
    supportEmail: document.getElementById("supportEmail"),
  };

  let state = loadState();
  let selectedDate = todayISO();

  if (els.version) els.version.textContent = flVersionLabel();
  if (els.supportEmail) {
    els.supportEmail.href = "mailto:" + GUARANTEE_EMAIL;
    els.supportEmail.textContent = GUARANTEE_EMAIL;
  }

  function fillSetup() {
    els.startDate.value = state.startDate;
    els.calorieTarget.value = state.calorieTarget;
    els.stepTarget.value = state.stepTarget;
  }

  function fillEntry(iso) {
    selectedDate = iso;
    const entry = state.days[iso] || emptyDay();
    const n = dayNumber(state, iso);
    els.entryDate.value = iso;
    if (n >= 1 && n <= TOTAL_DAYS) {
      els.dayLabel.textContent = `Day ${n} of ${TOTAL_DAYS}`;
    } else if (n < 1) {
      els.dayLabel.textContent = `Before Day 1 (${Math.abs(n) + 1} day${n === 0 ? "" : "s"} early)`;
    } else {
      els.dayLabel.textContent = `After Day ${TOTAL_DAYS}`;
    }
    els.calories.value = entry.calories === "" || entry.calories == null ? "" : entry.calories;
    els.steps.value = entry.steps === "" || entry.steps == null ? "" : entry.steps;
    els.workout.checked = !!entry.workout;
    els.workoutNote.value = entry.workoutNote || "";
    els.weight.value = entry.weight === "" || entry.weight == null ? "" : entry.weight;
    els.mealsLogged.checked = !!entry.mealsLogged;
    els.notes.value = entry.notes || "";
    els.dayStatus.textContent = "";
    els.dayStatus.classList.remove("is-ok");
    renderGrid();
  }

  function renderStats() {
    const s = summarize(state);
    els.statLogged.textContent = String(s.daysLogged);
    els.statFull.textContent = String(s.fullDays);
    els.statWorkouts.textContent = `${s.weekWorkouts}/${WORKOUTS_PER_WEEK}`;
    if (s.week) {
      els.weekCopy.textContent = `Week ${s.week.weekIndex}: ${s.weekFull} full day${s.weekFull === 1 ? "" : "s"} · ${s.weekWorkouts} of ${WORKOUTS_PER_WEEK} workouts`;
    } else {
      els.weekCopy.textContent = "Set your start date to begin the 90-day clock.";
    }
  }

  function renderGrid() {
    els.dayGrid.innerHTML = "";
    for (let n = 1; n <= TOTAL_DAYS; n++) {
      const iso = isoForDayNumber(state, n);
      const hits = pillarHits(state, state.days[iso]);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fl-day-dot";
      btn.textContent = String(n);
      btn.title = `Day ${n} · ${iso}`;
      btn.setAttribute("aria-label", `Day ${n}`);
      if (hits.count === 3) btn.classList.add("is-full");
      else if (hits.count > 0) btn.classList.add("is-partial");
      if (iso === todayISO()) btn.classList.add("is-today");
      if (iso === selectedDate) btn.classList.add("is-selected");
      btn.addEventListener("click", () => fillEntry(iso));
      els.dayGrid.appendChild(btn);
    }
  }

  function renderHistory() {
    const rows = [];
    for (let n = TOTAL_DAYS; n >= 1; n--) {
      const iso = isoForDayNumber(state, n);
      const entry = state.days[iso];
      if (!entry) continue;
      const hits = pillarHits(state, entry);
      if (
        hits.count === 0 &&
        !entry.notes &&
        entry.calories === "" &&
        entry.steps === "" &&
        !entry.mealsLogged
      ) {
        continue;
      }
      rows.push({ n, iso, entry, hits });
      if (rows.length >= 14) break;
    }

    els.history.innerHTML = "";
    if (!rows.length) {
      const li = document.createElement("li");
      li.innerHTML = `<span class="day-label">—</span><span>No days logged yet. Save today to start.</span>`;
      els.history.appendChild(li);
      return;
    }

    rows.forEach(({ n, iso, entry, hits }) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="day-label">Day ${n}</span>
        <span>
          <div class="pillars-mini">
            <span class="fl-chip ${hits.cal ? "on" : ""}">Calories${entry.calories !== "" ? `: ${entry.calories}` : ""}</span>
            <span class="fl-chip ${hits.steps ? "on" : ""}">Steps${entry.steps !== "" ? `: ${entry.steps}` : ""}</span>
            <span class="fl-chip ${hits.workout ? "on" : ""}">Workout</span>
          </div>
        </span>
      `;
      const open = document.createElement("button");
      open.type = "button";
      open.className = "fl-btn fl-btn--ghost open-day";
      open.style.padding = "8px 12px";
      open.style.fontSize = "12px";
      open.textContent = "Edit";
      open.addEventListener("click", () => {
        fillEntry(iso);
        els.entryDate.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      li.appendChild(open);
      els.history.appendChild(li);
    });
  }

  function renderAll() {
    fillSetup();
    fillEntry(selectedDate);
    renderStats();
    renderHistory();
  }

  els.saveSetup.addEventListener("click", () => {
    const startDate = els.startDate.value || todayISO();
    state.startDate = startDate;
    state.calorieTarget = Math.max(800, Number(els.calorieTarget.value) || 2000);
    state.stepTarget = Math.max(1000, Number(els.stepTarget.value) || 10000);
    saveState(state);
    els.setupStatus.textContent = "Targets saved on this device.";
    els.setupStatus.classList.add("is-ok");
    renderAll();
  });

  els.entryDate.addEventListener("change", () => {
    if (els.entryDate.value) fillEntry(els.entryDate.value);
  });

  els.saveDay.addEventListener("click", () => {
    const iso = els.entryDate.value || todayISO();
    const entry = {
      calories: els.calories.value === "" ? "" : Number(els.calories.value),
      steps: els.steps.value === "" ? "" : Number(els.steps.value),
      workout: !!els.workout.checked,
      workoutNote: els.workoutNote.value.trim(),
      weight: els.weight.value === "" ? "" : Number(els.weight.value),
      mealsLogged: !!els.mealsLogged.checked,
      notes: els.notes.value.trim(),
    };
    state.days[iso] = entry;
    saveState(state);
    selectedDate = iso;
    const hits = pillarHits(state, entry);
    els.dayStatus.textContent =
      hits.count === 3
        ? "Saved. All three pillars hit for this day."
        : `Saved. ${hits.count} of 3 pillars hit for this day.`;
    els.dayStatus.classList.add("is-ok");
    renderStats();
    renderGrid();
    renderHistory();
  });

  els.clearDay.addEventListener("click", () => {
    const iso = els.entryDate.value || selectedDate;
    delete state.days[iso];
    saveState(state);
    fillEntry(iso);
    els.dayStatus.textContent = "Day cleared.";
    renderStats();
    renderHistory();
  });

  function weekExportText() {
    const today = todayISO();
    const week = weekBounds(state, today) || weekBounds(state, state.startDate);
    if (!week) return "No week in range.";
    const lines = [
      `Fat Loss Ledger — Week ${week.weekIndex}`,
      `Start date: ${state.startDate}`,
      `Targets: ${state.calorieTarget} cal · ${state.stepTarget} steps · ${WORKOUTS_PER_WEEK} workouts/week`,
      "",
    ];
    for (let n = week.startN; n <= week.endN; n++) {
      const iso = isoForDayNumber(state, n);
      const entry = state.days[iso];
      if (!entry) {
        lines.push(`Day ${n} (${iso}): —`);
        continue;
      }
      const hits = pillarHits(state, entry);
      lines.push(
        `Day ${n} (${iso}): cal ${entry.calories === "" ? "—" : entry.calories}` +
          ` · steps ${entry.steps === "" ? "—" : entry.steps}` +
          ` · workout ${entry.workout ? "YES" : "no"}` +
          ` · weight ${entry.weight === "" ? "—" : entry.weight}` +
          ` · meals logged ${entry.mealsLogged ? "YES" : "no"}` +
          ` · pillars ${hits.count}/3`
      );
      if (entry.workoutNote) lines.push(`  workout note: ${entry.workoutNote}`);
      if (entry.notes) lines.push(`  notes: ${entry.notes}`);
    }
    return lines.join("\n");
  }

  els.exportWeek.addEventListener("click", async () => {
    const text = weekExportText();
    try {
      await navigator.clipboard.writeText(text);
      els.dayStatus.textContent = "This week copied to clipboard.";
      els.dayStatus.classList.add("is-ok");
    } catch {
      window.prompt("Copy your week:", text);
    }
  });

  els.emailWeek.addEventListener("click", () => {
    const text = weekExportText();
    const subject = encodeURIComponent("Fat Loss weekly check-in");
    const body = encodeURIComponent(text);
    window.location.href = `mailto:${GUARANTEE_EMAIL}?subject=${subject}&body=${body}`;
  });

  const n = dayNumber(state, todayISO());
  if (n >= 1 && n <= TOTAL_DAYS) selectedDate = todayISO();
  else selectedDate = state.startDate;
  renderAll();
}

initLedger();
