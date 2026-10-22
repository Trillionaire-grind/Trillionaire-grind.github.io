export const STORAGE_KEY = "fl-ledger-v1";
export const BACKUP_VERSION = 1;

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function defaultState() {
  return {
    startDate: todayISO(),
    calorieTarget: 2000,
    stepTarget: 10000,
    days: {},
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeState(raw) {
  if (!raw || typeof raw !== "object") return defaultState();
  return {
    ...defaultState(),
    ...raw,
    days: raw.days && typeof raw.days === "object" ? raw.days : {},
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveLocalState(state) {
  const payload = normalizeState({
    ...state,
    updatedAt: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function mergeLedgerStates(local, cloud) {
  const a = normalizeState(local);
  const b = normalizeState(cloud);
  const localDays = Object.keys(a.days || {}).length;
  const cloudDays = Object.keys(b.days || {}).length;

  if (!cloudDays) return a;
  if (!localDays) return b;

  const newer = (a.updatedAt || "") >= (b.updatedAt || "") ? a : b;
  const older = newer === a ? b : a;
  const days = { ...(older.days || {}), ...(newer.days || {}) };

  return normalizeState({
    startDate: newer.startDate || older.startDate,
    calorieTarget: newer.calorieTarget || older.calorieTarget,
    stepTarget: newer.stepTarget || older.stepTarget,
    days,
    updatedAt: new Date().toISOString(),
  });
}

export function buildBackupPayload(state, email) {
  return {
    backupVersion: BACKUP_VERSION,
    product: "fat-loss-ledger",
    exportedAt: new Date().toISOString(),
    email: email || null,
    ledger: normalizeState(state),
  };
}

export function parseBackupPayload(raw) {
  let parsed = raw;
  if (typeof raw === "string") {
    parsed = JSON.parse(raw);
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid backup file.");
  }
  const ledger = parsed.ledger || parsed;
  return normalizeState(ledger);
}

export function downloadBackupFile(state, email) {
  const payload = buildBackupPayload(state, email);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const stamp = todayISO();
  const a = document.createElement("a");
  a.href = url;
  a.download = `fat-loss-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readBackupFile(file) {
  const text = await file.text();
  return parseBackupPayload(text);
}

let state = loadLocalState();
const listeners = new Set();

export function getLedgerState() {
  return state;
}

export function replaceLedgerState(next) {
  state = saveLocalState(normalizeState(next));
  listeners.forEach((fn) => fn(state));
  return state;
}

export function updateLedgerState(updater) {
  const next = typeof updater === "function" ? updater(state) : updater;
  return replaceLedgerState(next);
}

export function subscribeLedger(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}
