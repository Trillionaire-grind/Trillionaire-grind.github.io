const DRAFT_KEY = "learnNoteDraft";

export function readNoteDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveNoteDraft(draft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
}

export function clearNoteDraft() {
  localStorage.removeItem(DRAFT_KEY);
}
