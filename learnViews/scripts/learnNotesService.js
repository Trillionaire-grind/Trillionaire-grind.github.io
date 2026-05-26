import { isLearnFirebaseConfigured } from "./learnFirebaseConfig.js";
import {
  createLocalNote,
  deleteLocalNote,
  fetchLocalNote,
  subscribeLocalNotes,
  updateLocalNote,
} from "./learnNotesLocalStore.js";
import {
  clearLastUndo,
  getLastUndo,
  isNoteDeleted,
  markNoteDeleted,
  setUndoAction,
  unmarkNoteDeleted,
} from "./learnNotesDeleted.js";

const COLLECTION = "learnNotes";

export function noteCreatedMs(note) {
  if (!note.createdAt) return 0;
  if (note.createdAt?.toMillis) return note.createdAt.toMillis();
  if (typeof note.createdAt === "number") return note.createdAt;
  return 0;
}

export function formatNoteDate(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function subscribeLearnNotes(onChange, onError) {
  if (!isLearnFirebaseConfigured()) {
    return subscribeLocalNotes(onChange);
  }

  let unsubscribe = () => {};

  (async () => {
    try {
      const { collection, onSnapshot, orderBy, query } = await import(
        "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"
      );
      const { initLearnFirebase } = await import("./learnFirebase.js");
      const firebase = initLearnFirebase();
      const db = firebase?.db;
      if (!db) {
        onChange([]);
        return;
      }

      const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          onChange(
            snapshot.docs.map((entry) => ({
              id: entry.id,
              source: "firestore",
              ...entry.data(),
            }))
          );
        },
        onError
      );
    } catch (error) {
      if (onError) onError(error);
      onChange([]);
    }
  })();

  return () => unsubscribe();
}

export async function createLearnNote({ title, summary, genre, body, authorType, isAi, thumbnail }) {
  const normalizedAuthorType = authorType || (isAi ? "ai" : "kepler");
  const payload = {
    title: title.trim(),
    summary: summary.trim(),
    genre,
    body: body.trim(),
    authorType: normalizedAuthorType,
    isAi: normalizedAuthorType === "ai",
    thumbnail: thumbnail?.trim() || "",
  };

  if (!isLearnFirebaseConfigured()) {
    return createLocalNote(payload);
  }

  const { addDoc, collection, serverTimestamp } = await import(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"
  );
  const { initLearnFirebase } = await import("./learnFirebase.js");
  const db = initLearnFirebase()?.db;
  if (!db) throw new Error("Firebase is not configured");

  const docRef = await addDoc(collection(db, COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateLearnNote(noteId, data) {
  if (!isLearnFirebaseConfigured()) {
    const local = fetchLocalNote(noteId);
    if (!local) throw new Error("Note not found");
    await updateLocalNote(noteId, data);
    return;
  }

  const { doc, updateDoc, serverTimestamp } = await import(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"
  );
  const { initLearnFirebase } = await import("./learnFirebase.js");
  const db = initLearnFirebase()?.db;
  if (!db) throw new Error("Firebase is not configured");

  const normalizedAuthorType =
    data.authorType || (data.isAi ? "ai" : undefined);

  const patch = {
    title: data.title?.trim(),
    summary: data.summary?.trim(),
    genre: data.genre,
    body: data.body?.trim(),
    authorType: normalizedAuthorType || "kepler",
    isAi: (normalizedAuthorType || "kepler") === "ai",
    thumbnail: data.thumbnail?.trim() || "",
    updatedAt: serverTimestamp(),
  };
  await updateDoc(doc(db, COLLECTION, noteId), patch);
}

export async function deleteLearnNote(noteId, undoPayload = null) {
  if (noteId.startsWith("static-")) {
    markNoteDeleted(noteId, undoPayload);
    return;
  }

  if (!isLearnFirebaseConfigured()) {
    const local = fetchLocalNote(noteId);
    if (local) {
      await deleteLocalNote(noteId);
      if (undoPayload?.note) {
        setUndoAction({ type: "local-restore", note: undoPayload.note, noteId });
      }
      return;
    }
    markNoteDeleted(noteId, undoPayload);
    return;
  }

  const { deleteDoc, doc } = await import(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"
  );
  const { initLearnFirebase } = await import("./learnFirebase.js");
  const db = initLearnFirebase()?.db;
  if (!db) throw new Error("Firebase is not configured");
  await deleteDoc(doc(db, COLLECTION, noteId));
}

export async function undoLastNoteDelete() {
  const undo = getLastUndo();
  if (!undo) return false;

  if (undo.type === "static") {
    unmarkNoteDeleted(undo.noteId);
    clearLastUndo();
    return true;
  }

  if (undo.type === "local-restore" && undo.note) {
    const { restoreLocalNote } = await import("./learnNotesLocalStore.js");
    restoreLocalNote(undo.note);
    clearLastUndo();
    return true;
  }

  return false;
}

export {
  clearLastUndo,
  getLastUndo,
  isNoteDeleted,
  markNoteDeleted,
  readDeletedNoteIds,
  setUndoAction,
  subscribeDeletedNotes,
  unmarkNoteDeleted,
} from "./learnNotesDeleted.js";

export async function fetchLearnNote(noteId) {
  if (isNoteDeleted(noteId)) return null;

  if (!isLearnFirebaseConfigured()) {
    return fetchLocalNote(noteId);
  }

  const { getDoc, doc } = await import(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"
  );
  const { initLearnFirebase } = await import("./learnFirebase.js");
  const db = initLearnFirebase()?.db;
  if (!db) throw new Error("Firebase is not configured");

  const snap = await getDoc(doc(db, COLLECTION, noteId));
  if (!snap.exists()) return null;
  return { id: snap.id, source: "firestore", ...snap.data() };
}

export { formatNoteBody, bodyToHtml, NOTE_FORMAT_HELP } from "./learnNoteFormat.js";
