import { staticNoteUrl } from "./staticNotesCatalog.js";

export function notePublicUrl(note) {
  const origin = window.location.origin;
  const base = new URL(".", window.location.href).href;

  if (note.source === "firestore" || note.source === "local") {
    return new URL(`noteView.html?id=${encodeURIComponent(note.id)}`, base).href;
  }
  return new URL(staticNoteUrl(note).replace(/^\.\//, ""), base).href;
}

export async function copyNoteLink(note) {
  const url = notePublicUrl(note);
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    window.prompt("Copy this link:", url);
    return false;
  }
}
