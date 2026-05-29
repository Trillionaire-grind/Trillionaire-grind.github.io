import {
  getAgendaMeta,
  getSpeakerAssignments,
  normalizeAgendaDoc,
} from "./tmAgendaData.js?v=3";

export function readSpeechTitle(data) {
  return String(data?.title || data?.speechTitle || data?.projectTitle || "").trim();
}

export function readSpeechPath(data) {
  return String(data?.path || "").trim();
}

export function buildSpeechDocPayload({ path, title }) {
  const payload = {};
  const cleanPath = readSpeechPath({ path });
  const cleanTitle = readSpeechTitle({ title });
  if (cleanPath) payload.path = cleanPath;
  if (cleanTitle) payload.title = cleanTitle;
  return payload;
}

export function resolveSpeechDisplay(speechId, userId, speechData, agendaDoc) {
  let title = readSpeechTitle(speechData);
  let path = readSpeechPath(speechData);

  if (!agendaDoc?.data) {
    return { title: title || "Untitled speech", path };
  }

  const meetingDate = String(agendaDoc.meetingDate || getAgendaMeta(normalizeAgendaDoc(agendaDoc).data).date || "").trim();
  if (meetingDate && meetingDate !== speechId) {
    return { title: title || "Untitled speech", path };
  }

  const assignment = getSpeakerAssignments(normalizeAgendaDoc(agendaDoc).data).find(
    (entry) => entry?.userId === userId
  );

  if (assignment) {
    const agendaTitle = readSpeechTitle(assignment);
    const agendaPath = readSpeechPath(assignment);
    if (agendaTitle) title = agendaTitle;
    if (agendaPath) path = agendaPath;
  }

  return {
    title: title || "Untitled speech",
    path,
  };
}

export function collectFeedbackEntries(snapshot) {
  const entries = [];
  snapshot.forEach((feedbackDoc) => {
    const text = String(feedbackDoc.data().feedback || "").trim();
    if (text) entries.push({ id: feedbackDoc.id, text });
  });
  return entries;
}

/**
 * Firestore paths to read feedback from for a speech (document id = meeting date).
 * Legacy: feedback was sometimes saved under today's date instead of the meeting date —
 * only merge that for the current agenda meeting, not every past speech.
 */
export function getFeedbackSpeechIds(speechId, agendaMeetingDate = "") {
  const ids = [speechId];
  const today = new Date().toISOString().slice(0, 10);
  const meetingDate = String(agendaMeetingDate || "").trim();

  if (today && today !== speechId && meetingDate && speechId === meetingDate) {
    ids.push(today);
  }

  return [...new Set(ids)];
}

/** @deprecated Use getFeedbackSpeechIds */
export function getLegacyFeedbackSpeechIds(speechId) {
  return getFeedbackSpeechIds(speechId);
}
