import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAgendaMeta, buildRolesMap } from "./tmAgendaData.js?v=3";

/** Single-club app: all agendas live under this club id. */
export const TM_CLUB_ID = "naples-sunrise-bay";

export const CURRENT_AGENDA_ID = "current";

export function getTmClubId() {
  return TM_CLUB_ID;
}

/**
 * Firestore layout:
 *
 * clubs/{TM_CLUB_ID}/agendas/current
 * clubs/{TM_CLUB_ID}/agendas/{meetingDate}
 *
 * Legacy fallback: test/date
 */
export function getClubAgendaRef(db, clubId = TM_CLUB_ID, agendaId = CURRENT_AGENDA_ID) {
  return doc(db, "clubs", clubId, "agendas", agendaId);
}

export function getLegacyAgendaRef(db) {
  return doc(db, "test", "date");
}

export function packAgendaDocument(assignments, { uid, isLive }) {
  const meta = getAgendaMeta(assignments);
  return {
    meetingDate: meta.date,
    isLive: Boolean(isLive),
    publishedAt: serverTimestamp(),
    publishedBy: uid || null,
    version: 2,
    data: assignments,
    roles: buildRolesMap(assignments),
  };
}

export function unpackAgendaDocument(docData) {
  if (!docData) return null;
  if (Array.isArray(docData.data)) {
    return docData;
  }
  return null;
}

/** Reads meeting live status from Firestore agenda doc (`isLive` field, legacy `editable` fallback). */
export function isMeetingLive(docPayload) {
  if (!docPayload) return false;
  if (typeof docPayload.isLive === "boolean") {
    return docPayload.isLive;
  }
  if (Array.isArray(docPayload.data)) {
    return Boolean(getAgendaMeta(docPayload.data).editable);
  }
  return false;
}

export async function loadAgendaDoc(db, { getDocFn, setDocFn, loadAndMigrateAgendaDoc, clubId = TM_CLUB_ID }) {
  const clubRef = getClubAgendaRef(db, clubId);
  const clubSnap = await getDocFn(clubRef);
  if (clubSnap.exists()) {
    const unpacked = unpackAgendaDocument(clubSnap.data());
    if (unpacked) {
      return { ref: clubRef, data: unpacked, source: "club" };
    }
  }

  const legacyRef = getLegacyAgendaRef(db);
  const legacyData = await loadAndMigrateAgendaDoc(getDocFn, setDocFn, legacyRef);
  if (legacyData) {
    return { ref: legacyRef, data: legacyData, source: "legacy" };
  }

  return null;
}

export async function saveAgendaDoc(db, assignments, { uid, isLive, clubId = TM_CLUB_ID }) {
  const payload = packAgendaDocument(assignments, { uid, isLive });

  const clubCurrentRef = getClubAgendaRef(db, clubId, CURRENT_AGENDA_ID);
  const writes = [setDoc(clubCurrentRef, payload)];

  if (payload.meetingDate) {
    writes.push(setDoc(getClubAgendaRef(db, clubId, payload.meetingDate), payload));
  }

  writes.push(
    setDoc(getLegacyAgendaRef(db), {
      meetingDate: payload.meetingDate,
      isLive: payload.isLive,
      data: assignments,
    })
  );

  await Promise.all(writes);
}

/** Fast live toggle — updates isLive only on agenda docs that already exist. */
export async function patchAgendaLiveStatus(db, isLive, { clubId = TM_CLUB_ID, meetingDate = null } = {}) {
  const live = Boolean(isLive);
  const patch = { isLive: live };
  const writes = [];

  const currentRef = getClubAgendaRef(db, clubId, CURRENT_AGENDA_ID);
  if ((await getDoc(currentRef)).exists()) {
    writes.push(updateDoc(currentRef, patch));
  }

  if (meetingDate) {
    const datedRef = getClubAgendaRef(db, clubId, meetingDate);
    if ((await getDoc(datedRef)).exists()) {
      writes.push(updateDoc(datedRef, patch));
    }
  }

  const legacyRef = getLegacyAgendaRef(db);
  if ((await getDoc(legacyRef)).exists()) {
    writes.push(updateDoc(legacyRef, patch));
  }

  if (!writes.length) {
    throw new Error("No published agenda found to update.");
  }

  await Promise.all(writes);
}

/**
 * Real-time agenda updates. Listens to club current doc and legacy test/date.
 * Club data takes priority when both exist.
 */
export function subscribeAgendaDoc(db, { onData, onError, clubId = TM_CLUB_ID }) {
  const clubRef = getClubAgendaRef(db, clubId);
  const legacyRef = getLegacyAgendaRef(db);
  let clubPayload = null;
  let legacyPayload = null;

  function notify() {
    onData(clubPayload || legacyPayload);
  }

  function readSnap(snap, source) {
    if (!snap.exists()) return null;
    const raw = snap.data();
    const unpacked = unpackAgendaDocument(raw);
    if (!unpacked) return null;
    return { data: unpacked, source, isLive: isMeetingLive(unpacked) };
  }

  const unsubClub = onSnapshot(
    clubRef,
    (snap) => {
      clubPayload = readSnap(snap, "club");
      notify();
    },
    onError
  );

  const unsubLegacy = onSnapshot(
    legacyRef,
    (snap) => {
      legacyPayload = readSnap(snap, "legacy");
      if (!clubPayload) {
        notify();
      }
    },
    onError
  );

  return () => {
    unsubClub();
    unsubLegacy();
  };
}
