(function (global) {
  const STORAGE_KEYS = {
    ahCounter: "tmExperience_ahCounter",
    timer: "tmExperience_timer",
  };

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function confirmClear() {
    return global.confirm("Do you want to clear your data?");
  }

  function collectAhCounterRows(tbody) {
    return Array.from(tbody.querySelectorAll("tr")).map((row) => {
      const nameInput = row.querySelector("th input");
      const counters = row.querySelectorAll("td .tm-tool-stepper input");
      return {
        name: nameInput?.value || "",
        ah: parseInt(counters[0]?.value, 10) || 0,
        um: parseInt(counters[1]?.value, 10) || 0,
        like: parseInt(counters[2]?.value, 10) || 0,
        x2: parseInt(counters[3]?.value, 10) || 0,
      };
    });
  }

  function applyAhCounterRows(tbody, rows) {
    const tableRows = tbody.querySelectorAll("tr");
    tableRows.forEach((row, index) => {
      const data = rows[index] || { name: "", ah: 0, um: 0, like: 0, x2: 0 };
      const nameInput = row.querySelector("th input");
      const counters = row.querySelectorAll("td .tm-tool-stepper input");

      if (nameInput) nameInput.value = data.name || "";
      if (counters[0]) counters[0].value = data.ah || 0;
      if (counters[1]) counters[1].value = data.um || 0;
      if (counters[2]) counters[2].value = data.like || 0;
      if (counters[3]) counters[3].value = data.x2 || 0;
    });
  }

  function saveAhCounter(tbody) {
    writeJson(STORAGE_KEYS.ahCounter, collectAhCounterRows(tbody));
    showSavedHint();
  }

  function loadAhCounter(tbody) {
    const rows = readJson(STORAGE_KEYS.ahCounter);
    if (Array.isArray(rows)) applyAhCounterRows(tbody, rows);
  }

  function clearAhCounter(tbody, options) {
    if (!options?.skipConfirm && !confirmClear()) return false;

    localStorage.removeItem(STORAGE_KEYS.ahCounter);
    applyAhCounterRows(tbody, []);
    return true;
  }

  function collectTimerEntries(tbody) {
    return Array.from(tbody.querySelectorAll("tr")).map((row) => {
      const inputs = row.querySelectorAll("td input");
      return {
        name: inputs[0]?.value || "",
        time: inputs[1]?.value || "",
      };
    });
  }

  function applyTimerEntries(tbody, entries) {
    const tableRows = tbody.querySelectorAll("tr");
    tableRows.forEach((row, index) => {
      const data = entries[index] || { name: "", time: "" };
      const inputs = row.querySelectorAll("td input");
      if (inputs[0]) inputs[0].value = data.name || "";
      if (inputs[1]) inputs[1].value = data.time || "";
    });
  }

  function saveTimer(tbody) {
    writeJson(STORAGE_KEYS.timer, collectTimerEntries(tbody));
    showSavedHint();
  }

  function loadTimer(tbody) {
    const entries = readJson(STORAGE_KEYS.timer);
    if (Array.isArray(entries)) applyTimerEntries(tbody, entries);
  }

  function clearTimer(tbody, options) {
    if (!options?.skipConfirm && !confirmClear()) return false;

    localStorage.removeItem(STORAGE_KEYS.timer);
    applyTimerEntries(tbody, []);
    return true;
  }

  function bindAutoSave(root, saveFn) {
    root.addEventListener("input", saveFn);
    root.addEventListener("change", saveFn);
  }

  let savedHintTimer;

  function showSavedHint() {
    const hint = document.getElementById("toolSavedHint");
    if (!hint) return;

    clearTimeout(savedHintTimer);
    hint.hidden = false;
    hint.classList.remove("is-breathing");
    void hint.offsetWidth;
    hint.classList.add("is-breathing");

    savedHintTimer = setTimeout(() => {
      hint.hidden = true;
      hint.classList.remove("is-breathing");
    }, 2000);
  }

  function initAhCounter() {
    const tbody = document.getElementById("ahCounterBody");
    if (!tbody) return;

    const save = () => saveAhCounter(tbody);
    loadAhCounter(tbody);
    bindAutoSave(tbody, save);

    global.increment = function increment(button) {
      const input = button.previousElementSibling;
      input.value = parseInt(input.value, 10) + 1;
      save();
    };

    global.decrement = function decrement(button) {
      const input = button.nextElementSibling;
      const value = parseInt(input.value, 10);
      if (value > 0) {
        input.value = value - 1;
        save();
      }
    };

    const clearBtn = document.getElementById("clearDataBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => clearAhCounter(tbody));
    }
  }

  function initTimer() {
    const tbody = document.getElementById("timerEntriesBody");
    if (!tbody) return;

    const save = () => saveTimer(tbody);
    loadTimer(tbody);
    bindAutoSave(tbody, save);

    const clearBtn = document.getElementById("clearDataBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => clearTimer(tbody));
    }
  }

  global.TmToolsStorage = {
    saveAhCounter,
    loadAhCounter,
    clearAhCounter,
    saveTimer,
    loadTimer,
    clearTimer,
    bindAutoSave,
    initAhCounter,
    initTimer,
  };
})(window);
