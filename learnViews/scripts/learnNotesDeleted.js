const STORAGE_KEY = "learnNotesDeleted";
const listeners = new Set();
let lastUndo = null;

export function readDeletedNoteIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function isNoteDeleted(noteId) {
  return readDeletedNoteIds().includes(noteId);
}

export function markNoteDeleted(noteId, undoPayload = null) {
  const ids = new Set(readDeletedNoteIds());
  ids.add(noteId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  if (undoPayload) {
    lastUndo = { noteId, ...undoPayload };
  }
  listeners.forEach((listener) => listener(readDeletedNoteIds()));
}

export function unmarkNoteDeleted(noteId) {
  const ids = readDeletedNoteIds().filter((id) => id !== noteId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  lastUndo = null;
  listeners.forEach((listener) => listener(readDeletedNoteIds()));
}

export function getLastUndo() {
  return lastUndo;
}

export function clearLastUndo() {
  lastUndo = null;
}

export function setUndoAction(payload) {
  lastUndo = payload;
}

export function subscribeDeletedNotes(onChange) {
  onChange(readDeletedNoteIds());
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}
