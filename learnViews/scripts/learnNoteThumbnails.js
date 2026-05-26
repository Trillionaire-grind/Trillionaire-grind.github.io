import { parseYoutubeId } from "./learnNoteFormat.js";

export function youtubePosterUrl(videoId) {
  if (!videoId) return "";
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** True only when note has an explicit YouTube video reference */
export function noteYoutubeVideoId(note) {
  if (note.youtubeId) return String(note.youtubeId).trim();
  const body = note.body || "";
  const summary = note.summary || "";
  return extractYoutubeIdStrict(body) || extractYoutubeIdStrict(summary) || "";
}

export function noteHasYoutubeVideo(note) {
  return Boolean(noteYoutubeVideoId(note));
}

/** Prefer explicit thumbnail URL, else YouTube poster when a video is present */
export function noteThumbnailUrl(note) {
  if (note.thumbnail?.trim()) return note.thumbnail.trim();
  const id = noteYoutubeVideoId(note);
  return id ? youtubePosterUrl(id) : "";
}

function extractYoutubeIdStrict(text) {
  if (!text) return "";

  const fence = text.match(/```youtube\s*\n([\s\S]*?)```/i);
  if (fence) {
    const id = parseYoutubeId(fence[1].trim());
    if (id) return id;
  }

  const atLine = text.match(/^@?youtube\s*:?\s*(\S+)/im);
  if (atLine) {
    const id = parseYoutubeId(atLine[1]);
    if (id) return id;
  }

  const markdown = text.match(/\[youtube\]\(([^)]+)\)/i);
  if (markdown) {
    const id = parseYoutubeId(markdown[1]);
    if (id) return id;
  }

  const bare = text.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (bare) return bare[1];

  return "";
}
