/** Adult non-fiction reading speed (words per minute). */
export const READ_WORDS_PER_MINUTE = 238;

export {
  DEFAULT_AUTHOR_TYPE,
  NOTE_AUTHOR,
  normalizeAuthorType,
  noteAuthorLabel,
} from "./learnNoteAuthor.js";

export function countWords(text) {
  if (!text) return 0;
  const plain = String(text)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

export function estimateReadMinutes(note, plainText) {
  let words = 0;

  if (typeof note?.wordCount === "number" && note.wordCount > 0) {
    words = note.wordCount;
  } else if (typeof plainText === "string" && plainText.trim()) {
    words = countWords(plainText);
  } else {
    words = countWords([note?.title, note?.summary, note?.body].filter(Boolean).join(" "));
  }

  return Math.max(1, Math.round(words / READ_WORDS_PER_MINUTE));
}

export function escapeMetaHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildNoteMetaHtml({ dateLabel = "", readMin, author = "", authorType = "kepler" }) {
  const parts = [];

  if (dateLabel) {
    parts.push(`<span>${escapeMetaHtml(dateLabel)}</span>`);
  }

  if (author) {
    if (parts.length) parts.push(`<span class="note-meta-dot">·</span>`);
    const authorClass =
      authorType === "ai"
        ? "note-ai-badge"
        : authorType === "ai-human"
          ? "note-author note-author--collab"
          : "note-author";
    parts.push(`<span class="${authorClass}">${escapeMetaHtml(author)}</span>`);
  }

  if (readMin) {
    if (parts.length) parts.push(`<span class="note-meta-dot">·</span>`);
    parts.push(`<span>${readMin} min read</span>`);
  }

  return parts.join("");
}
