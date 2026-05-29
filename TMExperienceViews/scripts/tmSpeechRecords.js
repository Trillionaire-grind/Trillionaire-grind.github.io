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

export function getLegacyFeedbackSpeechIds(speechId) {
  const ids = [speechId];
  const today = new Date().toISOString().slice(0, 10);
  if (today && today !== speechId) ids.push(today);
  return ids;
}
