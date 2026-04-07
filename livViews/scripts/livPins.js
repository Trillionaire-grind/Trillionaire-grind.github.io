const PIN_KEY = "livPinnedBooks";
const MAX_PINS = 24;

export function getPinnedBookIds() {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.filter((x) => typeof x === "string" && x.trim())
      : [];
  } catch {
    return [];
  }
}

export function setPinnedBookIds(ids) {
  const next = ids.slice(0, MAX_PINS);
  localStorage.setItem(PIN_KEY, JSON.stringify(next));
}

export function isBookPinned(id) {
  return getPinnedBookIds().indexOf(id) >= 0;
}

export function togglePinnedBook(id) {
  let ids = getPinnedBookIds();
  const i = ids.indexOf(id);
  if (i >= 0) {
    ids.splice(i, 1);
  } else if (ids.length < MAX_PINS) {
    ids.push(id);
  }
  setPinnedBookIds(ids);
  return i < 0;
}

/** Remove one book from the home pinned list (no-op if not pinned). */
export function removePinnedBook(id) {
  const ids = getPinnedBookIds().filter((x) => x !== id);
  setPinnedBookIds(ids);
}
