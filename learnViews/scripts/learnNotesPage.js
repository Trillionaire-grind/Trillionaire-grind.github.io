import { STATIC_NOTES, staticNoteUrl } from "./staticNotesCatalog.js";
import {
  createLearnNote,
  deleteLearnNote,
  formatNoteDate,
  noteCreatedMs,
  subscribeDeletedNotes,
  subscribeLearnNotes,
  undoLastNoteDelete,
  updateLearnNote,
} from "./learnNotesService.js";
import { formatNoteBody } from "./learnNoteFormat.js";
import { isLearnDemoMode } from "./learnFirebaseConfig.js";
import { noteHasYoutubeVideo, noteThumbnailUrl } from "./learnNoteThumbnails.js";
import { clearNoteDraft, readNoteDraft, saveNoteDraft } from "./learnNotesDraft.js";
import {
  buildNoteMetaHtml,
  estimateReadMinutes,
  normalizeAuthorType,
  noteAuthorLabel,
} from "./learnNoteReadTime.js";
import { authorTypeFromFormValue, DEFAULT_AUTHOR_TYPE } from "./learnNoteAuthor.js";

const GENRE_CONTAINERS = {
  apps: document.getElementById("appDiv"),
  business: document.getElementById("businessDiv"),
  city: document.getElementById("cityDiv"),
};

const addNoteBtn = document.getElementById("addNoteBtn");
const addNoteModal = document.getElementById("addNoteModal");
const addNoteClose = document.getElementById("addNoteClose");
const addNoteForm = document.getElementById("addNoteForm");
const addNoteError = document.getElementById("addNoteError");
const addNoteTitle = document.getElementById("addNoteTitle");
const addNoteTitleInput = document.getElementById("addNoteTitleInput");
const addNoteSummary = document.getElementById("addNoteSummary");
const addNoteGenre = document.getElementById("addNoteGenre");
const addNoteBody = document.getElementById("addNoteBody");
const addNoteAuthorType = document.getElementById("addNoteAuthorType");
const addNoteThumbnail = document.getElementById("addNoteThumbnail");
const notesLoading = document.getElementById("notesLoading");
const notesAdminHint = document.getElementById("notesAdminHint");
const undoToast = document.getElementById("undoToast");
const undoToastBtn = document.getElementById("undoToastBtn");
const searchInput = document.getElementById("search-input");

const TAB_GENRES = ["apps", "business", "city"];
const GENRE_LABELS = { apps: "Apps", business: "Business", city: "Cities" };
const EMPTY_MESSAGES = {
  apps: "No app notes yet.",
  business: "No business notes yet.",
  city: "No city notes yet.",
};
let firestoreNotes = [];
let deletedNoteIds = new Set();
let isAdmin = false;
let activeTab = 0;
let notesReady = false;
let editingNoteId = null;
let searchQuery = "";
let draftTimer = null;

const LONG_PRESS_MS = 550;
const UNDO_TOAST_MS = 5000;

function cardHtml(note, { featured = false } = {}) {
  const dateLabel = formatNoteDate(noteCreatedMs(note));
  const deletable = isAdmin ? ' data-deletable="1"' : "";
  const hasVideo = noteHasYoutubeVideo(note);
  const thumb = hasVideo ? noteThumbnailUrl(note) : "";
  const readMin = estimateReadMinutes(note);
  const authorType = normalizeAuthorType(note);
  const author = noteAuthorLabel(note);
  const genreLabel = GENRE_LABELS[note.genre] || note.genre;
  const featuredClass = featured ? " noteCard--featured" : "";
  const thumbHtml =
    hasVideo && thumb
      ? `<div class="note-card-thumb"><img src="${escapeHtml(thumb)}" alt="" loading="lazy" /></div>`
      : featured
        ? `<div class="note-card-thumb note-card-thumb--placeholder"></div>`
        : "";
  const editBtn =
    isAdmin && isEditableNote(note)
      ? `<button type="button" class="note-card-edit" data-id="${escapeHtml(note.id)}" aria-label="Edit note" title="Edit">✎</button>`
      : "";
  const actionsHtml = editBtn ? `<div class="note-card-actions">${editBtn}</div>` : "";
  const labelHtml = featured ? `<p class="note-card-label">Latest in ${genreLabel}</p>` : "";

  return `
    <article class="noteCard noteCard--${note.genre}${featuredClass}${hasVideo ? " noteCard--with-video" : ""}" data-note-id="${note.id}"${deletable}>
      ${actionsHtml}
      ${featured ? thumbHtml : hasVideo && thumb ? thumbHtml : ""}
      <div class="note-card-body">
        ${labelHtml}
        <h2>${escapeHtml(note.title)}</h2>
        <p class="note-summary">${escapeHtml(note.summary)}</p>
        <div class="note-card-meta">
          <span class="note-card-meta-genre">${genreLabel}</span>
          <span class="note-card-meta-dot">·</span>
          ${buildNoteMetaHtml({ dateLabel, readMin, author, authorType })}
        </div>
      </div>
    </article>
  `;
}

function showAddButton(show) {
  if (!addNoteBtn) return;
  if (show) addNoteBtn.removeAttribute("hidden");
  else addNoteBtn.setAttribute("hidden", "");
}

function showAddError(message) {
  addNoteError.textContent = message;
  addNoteError.hidden = !message;
}

function isEditableNote(note) {
  return note.source === "firestore" || note.source === "local";
}

function mergeNotes() {
  const combined = [...STATIC_NOTES, ...firestoreNotes].filter(
    (note) => !deletedNoteIds.has(note.id)
  );
  combined.sort((a, b) => noteCreatedMs(b) - noteCreatedMs(a));
  return combined;
}

function filterNotes(notes) {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return notes;
  return notes.filter(
    (note) =>
      note.title.toLowerCase().includes(q) ||
      note.summary.toLowerCase().includes(q) ||
      (note.body && note.body.toLowerCase().includes(q))
  );
}

function notesForGenre(genre) {
  return filterNotes(mergeNotes().filter((note) => note.genre === genre));
}

function openNote(note) {
  if (note.source === "firestore" || note.source === "local") {
    window.open(`./noteView.html?id=${encodeURIComponent(note.id)}`, "_blank").focus();
    return;
  }
  window.open(staticNoteUrl(note), "_blank").focus();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setNotesLoading(loading) {
  if (notesLoading) notesLoading.hidden = !loading;
}

function hideUndoToast() {
  if (!undoToast) return;
  undoToast.classList.remove("is-visible");
  undoToast.hidden = true;
}

function showUndoToast() {
  if (!undoToast) return;
  undoToast.hidden = false;
  undoToast.classList.add("is-visible");
  clearTimeout(showUndoToast._timer);
  showUndoToast._timer = setTimeout(hideUndoToast, UNDO_TOAST_MS);
}

async function promptDeleteNote(note) {
  if (!isAdmin) return;
  const isStatic = note.source === "static";
  const msg = isStatic
    ? 'Hide this built-in note from your library? (The file stays on the site — use Undo to restore.)'
    : "Delete this note?";
  if (!confirm(msg)) return;

  try {
    await deleteLearnNote(
      note.id,
      isStatic
        ? { type: "static", noteId: note.id }
        : isEditableNote(note)
          ? { type: "local-restore", noteId: note.id, note: { ...note } }
          : null
    );
    showUndoToast();
  } catch (error) {
    alert("Could not delete note.");
  }
}

function attachCardInteractions(card, note) {
  let pressTimer = null;
  let longPressHandled = false;

  const clearPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  if (isAdmin) {
    card.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest(".note-card-actions")) return;
      longPressHandled = false;
      clearPress();
      pressTimer = setTimeout(() => {
        pressTimer = null;
        longPressHandled = true;
        promptDeleteNote(note);
      }, LONG_PRESS_MS);
    });
    card.addEventListener("pointerup", clearPress);
    card.addEventListener("pointerleave", clearPress);
    card.addEventListener("pointercancel", clearPress);
    card.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  card.addEventListener("click", (event) => {
    if (event.target.closest(".note-card-actions")) return;
    if (longPressHandled) {
      longPressHandled = false;
      return;
    }
    openNote(note);
  });

  card.querySelector(".note-card-edit")?.addEventListener("click", (event) => {
    event.stopPropagation();
    openEditModal(note);
  });
}

function renderGenreGrid(container, notes, genre) {
  if (!container) return;
  container.innerHTML = "";
  if (!notes.length) {
    const emptyMsg = searchQuery.trim()
      ? "No notes match your search."
      : EMPTY_MESSAGES[genre] || "No notes yet.";
    container.innerHTML = `<div class="notes-empty"><strong>Nothing here yet</strong>${escapeHtml(emptyMsg)}</div>`;
    return;
  }

  const grid = document.createElement("div");
  grid.className = "notes-grid";
  const showFeatured = !searchQuery.trim();

  notes.forEach((note, index) => {
    grid.insertAdjacentHTML("beforeend", cardHtml(note, { featured: showFeatured && index === 0 }));
  });
  container.appendChild(grid);

  container.querySelectorAll(".noteCard").forEach((card) => {
    const note = mergeNotes().find((entry) => entry.id === card.dataset.noteId);
    if (note) attachCardInteractions(card, note);
  });
}

function renderAllNotes() {
  renderGenreGrid(GENRE_CONTAINERS.apps, notesForGenre("apps"), "apps");
  renderGenreGrid(GENRE_CONTAINERS.business, notesForGenre("business"), "business");
  renderGenreGrid(GENRE_CONTAINERS.city, notesForGenre("city"), "city");
  if (notesReady) setNotesLoading(false);
}

function updateAdminUi() {
  showAddButton(isAdmin);
  if (notesAdminHint) notesAdminHint.hidden = !isAdmin;
}

function insertSnippet(snippet) {
  if (!addNoteBody) return;
  const start = addNoteBody.selectionStart;
  const end = addNoteBody.selectionEnd;
  const before = addNoteBody.value.slice(0, start);
  const after = addNoteBody.value.slice(end);
  const needsGap = before.length && !before.endsWith("\n\n");
  addNoteBody.value = before + (needsGap ? "\n\n" : "") + snippet + after;
  addNoteBody.focus();
  updateNotePreview();
  scheduleDraftSave();
}

function updateNotePreview() {
  const preview = document.getElementById("addNotePreview");
  if (!preview || !addNoteBody) return;
  preview.innerHTML = formatNoteBody(addNoteBody.value);
}

function readFormData() {
  return {
    title: addNoteTitleInput.value,
    summary: addNoteSummary.value,
    genre: addNoteGenre.value,
    body: addNoteBody.value,
    authorType: authorTypeFromFormValue(addNoteAuthorType?.value),
    thumbnail: addNoteThumbnail?.value || "",
  };
}

function setAuthorTypeField(authorType) {
  if (!addNoteAuthorType) return;
  addNoteAuthorType.value = authorTypeFromFormValue(authorType);
}

function fillForm(note) {
  addNoteTitleInput.value = note.title || "";
  addNoteSummary.value = note.summary || "";
  addNoteGenre.value = note.genre || "apps";
  addNoteBody.value = note.body || "";
  setAuthorTypeField(normalizeAuthorType(note));
  if (addNoteThumbnail) addNoteThumbnail.value = note.thumbnail || "";
  updateNotePreview();
}

function scheduleDraftSave() {
  if (editingNoteId) return;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    const data = readFormData();
    if (data.title || data.body) saveNoteDraft(data);
  }, 600);
}

function openAddModal() {
  editingNoteId = null;
  showAddError("");
  if (addNoteTitle) addNoteTitle.textContent = "Add a note";
  addNoteModal.classList.add("is-open");
  const genres = ["apps", "business", "city"];
  addNoteGenre.value = genres[activeTab] || "apps";
  const draft = readNoteDraft();
  if (draft?.title || draft?.body) fillForm(draft);
  else {
    addNoteForm.reset();
    setAuthorTypeField(DEFAULT_AUTHOR_TYPE);
  }
  updateNotePreview();
  addNoteTitleInput.focus();
}

function openEditModal(note) {
  editingNoteId = note.id;
  showAddError("");
  if (addNoteTitle) addNoteTitle.textContent = "Edit note";
  addNoteModal.classList.add("is-open");
  fillForm(note);
  addNoteTitleInput.focus();
}

function closeAddModal() {
  addNoteModal.classList.remove("is-open");
  showAddError("");
  editingNoteId = null;
  addNoteForm.reset();
  setAuthorTypeField(DEFAULT_AUTHOR_TYPE);
  if (addNoteTitle) addNoteTitle.textContent = "Add a note";
}

function applyTabAccent(index) {
  const tabsBar = document.getElementById("notesTabs");
  const genre = TAB_GENRES[index] || "apps";
  if (tabsBar) tabsBar.dataset.activeGenre = genre;
}

function selectNotesTab(index) {
  const tabs = document.querySelectorAll(".tab");
  if (!tabs[index]) return;
  activeTab = index;
  tabs.forEach((t, i) => t.classList.toggle("active", i === index));
  applyTabAccent(index);
  showContent(index);
}

function initTabs() {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectNotesTab(index));
  });

  applyTabAccent(activeTab);
}

function showContent(type) {
  GENRE_CONTAINERS.apps.style.display = type === 0 ? "block" : "none";
  GENRE_CONTAINERS.business.style.display = type === 1 ? "block" : "none";
  GENRE_CONTAINERS.city.style.display = type === 2 ? "block" : "none";
}

if (addNoteBtn) addNoteBtn.addEventListener("click", openAddModal);
document.querySelectorAll("[data-insert]").forEach((btn) => {
  btn.addEventListener("click", () => insertSnippet(btn.dataset.insert));
});
if (addNoteBody) {
  addNoteBody.addEventListener("input", () => {
    updateNotePreview();
    scheduleDraftSave();
  });
}
if (addNoteClose) addNoteClose.addEventListener("click", closeAddModal);

if (addNoteForm) {
  addNoteForm.addEventListener("change", scheduleDraftSave);
  addNoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showAddError("");
    const data = readFormData();

    try {
      if (editingNoteId) {
        await updateLearnNote(editingNoteId, data);
      } else {
        await createLearnNote(data);
        clearNoteDraft();
      }
      closeAddModal();
      const genreIndex = { apps: 0, business: 1, city: 2 }[data.genre] ?? 0;
      selectNotesTab(genreIndex);
    } catch (error) {
      showAddError(
        isLearnDemoMode()
          ? "Could not save note in demo mode."
          : "Could not save note. Check Firebase config and sign-in."
      );
    }
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value;
    renderAllNotes();
  });
}

if (undoToast) hideUndoToast();

if (undoToastBtn) {
  undoToastBtn.addEventListener("click", async () => {
    const ok = await undoLastNoteDelete();
    hideUndoToast();
    if (!ok) alert("Undo is not available for this note.");
    else renderAllNotes();
  });
}

function onAdminChanged(event) {
  isAdmin = Boolean(event.detail?.isAdmin);
  updateAdminUi();
  renderAllNotes();
  const submitBtn = document.getElementById("addNoteSubmitBtn");
  if (submitBtn) {
    submitBtn.textContent = event.detail?.demoMode
      ? editingNoteId
        ? "Save changes (demo)"
        : "Save note (demo — this browser only)"
      : editingNoteId
        ? "Save changes"
        : "Publish note";
  }
}

window.addEventListener("learn-admin-changed", onAdminChanged);

if (isLearnDemoMode() && sessionStorage.getItem("learnNotesDemoAdmin") === "1") {
  isAdmin = true;
  updateAdminUi();
}

setNotesLoading(true);

subscribeDeletedNotes((ids) => {
  deletedNoteIds = new Set(ids);
  notesReady = true;
  renderAllNotes();
});

subscribeLearnNotes(
  (notes) => {
    firestoreNotes = notes;
    notesReady = true;
    renderAllNotes();
  },
  () => {
    firestoreNotes = [];
    notesReady = true;
    renderAllNotes();
  }
);

initTabs();

try {
  const genre = sessionStorage.getItem("learnNotesGenre");
  if (genre) {
    const index = { apps: 0, business: 1, city: 2 }[genre];
    if (index !== undefined) selectNotesTab(index);
    sessionStorage.removeItem("learnNotesGenre");
  }
} catch (_) {
  /* ignore */
}

window.addEventListener("message", (event) => {
  if (event.data?.type !== "learn-notes-genre") return;
  const index = { apps: 0, business: 1, city: 2 }[event.data.genre];
  if (index !== undefined) selectNotesTab(index);
});

renderAllNotes();
updateAdminUi();

setTimeout(() => {
  if (!notesReady) {
    notesReady = true;
    setNotesLoading(false);
  }
}, 800);

if (isLearnDemoMode()) {
  const submitBtn = document.getElementById("addNoteSubmitBtn");
  if (submitBtn) submitBtn.textContent = "Save note (demo — this browser only)";
}
