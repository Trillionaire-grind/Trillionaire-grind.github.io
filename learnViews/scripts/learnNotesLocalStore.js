const STORAGE_KEY = "learnNotesDemo";
const listeners = new Set();

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  listeners.forEach((listener) => listener(readAll()));
}

export function subscribeLocalNotes(onChange) {
  onChange(readAll());
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export async function createLocalNote({ title, summary, genre, body, authorType, isAi, thumbnail }) {
  const normalizedAuthorType = authorType || (isAi ? "ai" : "kepler");
  const note = {
    id: `local-${Date.now()}`,
    source: "local",
    title: title.trim(),
    summary: summary.trim(),
    genre,
    body: body.trim(),
    authorType: normalizedAuthorType,
    isAi: normalizedAuthorType === "ai",
    thumbnail: thumbnail?.trim() || "",
    createdAt: Date.now(),
  };
  writeAll([note, ...readAll()]);
  return note.id;
}

export async function updateLocalNote(noteId, data) {
  const notes = readAll().map((note) => {
    if (note.id !== noteId) return note;
    const nextAuthorType =
      data.authorType !== undefined
        ? data.authorType
        : data.isAi !== undefined
          ? data.isAi
            ? "ai"
            : note.authorType || "kepler"
          : note.authorType || (note.isAi ? "ai" : "kepler");
    return {
      ...note,
      title: data.title?.trim() ?? note.title,
      summary: data.summary?.trim() ?? note.summary,
      genre: data.genre ?? note.genre,
      body: data.body?.trim() ?? note.body,
      authorType: nextAuthorType,
      isAi: nextAuthorType === "ai",
      thumbnail: data.thumbnail !== undefined ? String(data.thumbnail).trim() : note.thumbnail,
      updatedAt: Date.now(),
    };
  });
  writeAll(notes);
}

export async function deleteLocalNote(noteId) {
  writeAll(readAll().filter((note) => note.id !== noteId));
}

export function fetchLocalNote(noteId) {
  return readAll().find((note) => note.id === noteId) || null;
}

export function restoreLocalNote(note) {
  if (!note?.id) return;
  const notes = readAll().filter((entry) => entry.id !== note.id);
  writeAll([note, ...notes]);
}
