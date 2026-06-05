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

export function readFeedbackAuthorName(data) {
  return String(data?.authorName || data?.name || data?.submittedBy || "").trim();
}

export function buildFeedbackDocPayload({ feedback, authorName, fromUid }) {
  return {
    feedback: String(feedback || "").trim(),
    authorName: String(authorName || "").trim(),
    fromUid: String(fromUid || "").trim(),
  };
}

export function readFeedbackFromUid(data) {
  return String(data?.fromUid || data?.uid || "").trim();
}

export function collectFeedbackEntries(snapshot) {
  const entries = [];
  snapshot.forEach((feedbackDoc) => {
    const data = feedbackDoc.data();
    const text = String(data.feedback || "").trim();
    if (!text) return;
    entries.push({
      id: feedbackDoc.id,
      text,
      name: readFeedbackAuthorName(data),
      fromUid: readFeedbackFromUid(data),
    });
  });
  return entries;
}

export async function enrichFeedbackAuthorNames(db, entries, { doc, getDoc }) {
  if (!entries.length) return [];

  const profileNames = new Map();
  const uidsToLoad = [
    ...new Set(
      entries
        .filter((entry) => !entry.name && entry.fromUid)
        .map((entry) => entry.fromUid)
    ),
  ];

  await Promise.all(
    uidsToLoad.map(async (uid) => {
      try {
        const profileSnap = await getDoc(doc(db, "users", uid));
        const profileName = profileSnap.exists()
          ? String(profileSnap.data().name || "").trim()
          : "";
        profileNames.set(uid, profileName);
      } catch (error) {
        console.warn("Could not load feedback author profile:", uid, error);
        profileNames.set(uid, "");
      }
    })
  );

  return entries.map((entry) => {
    const storedName = String(entry.name || "").trim();
    const fromUid = String(entry.fromUid || "").trim();
    const resolvedName = storedName || (fromUid ? profileNames.get(fromUid) || "" : "");
    const displayName = resolvedName || (fromUid ? "Club member" : "");

    return {
      ...entry,
      name: displayName,
    };
  });
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
