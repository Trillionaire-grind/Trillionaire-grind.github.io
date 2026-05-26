export const NOTE_AUTHOR = "Képler Siguineau";

export const NOTE_AUTHOR_TYPES = {
  kepler: "Képler Siguineau",
  ai: "AI",
  "ai-human": "AI + human",
  team: "The team",
};

export const NOTE_AUTHOR_TYPE_ORDER = ["kepler", "ai", "ai-human", "team"];

export const DEFAULT_AUTHOR_TYPE = "kepler";

export function normalizeAuthorType(note) {
  if (note?.authorType && NOTE_AUTHOR_TYPES[note.authorType]) {
    return note.authorType;
  }
  if (note?.isAi) return "ai";
  return DEFAULT_AUTHOR_TYPE;
}

export function noteAuthorLabel(note) {
  return NOTE_AUTHOR_TYPES[normalizeAuthorType(note)] || NOTE_AUTHOR_TYPES.kepler;
}

export function authorTypeFromFormValue(value) {
  return NOTE_AUTHOR_TYPES[value] ? value : DEFAULT_AUTHOR_TYPE;
}
