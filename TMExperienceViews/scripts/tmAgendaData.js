export const AGENDA_ROLE_COUNT = 16;

export const SPEAKER_ROLE_IDS = [
  "firstSpeaker",
  "secondSpeaker",
  "thirdSpeaker",
  "fourthSpeaker",
];

export const EVALUATOR_ROLE_IDS = [
  "firstEvaluator",
  "secondEvaluator",
  "thirdEvaluator",
  "fourthEvaluator",
];

export const AGENDA_ROLE_INDEX = {
  tmRole: 0,
  grammarianRole: 1,
  ahRole: 2,
  timerRole: 3,
  voteRole: 4,
  firstSpeaker: 5,
  secondSpeaker: 6,
  thirdSpeaker: 7,
  fourthSpeaker: 8,
  tableRole: 9,
  generalRole: 10,
  firstEvaluator: 11,
  secondEvaluator: 12,
  thirdEvaluator: 13,
  fourthEvaluator: 14,
  educationRole: 15,
};

export const AGENDA_ROLE_IDS = Object.entries(AGENDA_ROLE_INDEX)
  .sort((left, right) => left[1] - right[1])
  .map(([roleId]) => roleId);

/** Closing rows that reuse Toastmaster / General Evaluator assignments. */
export const DERIVED_AGENDA_MEMBER_BY_COPY_ID = {
  generalRoleCopy: "generalRole",
  tmRoleCopy: "tmRole",
};

const LEGACY_ROLE_COUNT = 14;

export function readAgendaMemberElement(element) {
  if (!element) return "";
  if (element.tagName === "SELECT") return String(element.value || "").trim();
  return String(element.textContent || "").trim();
}

export function resolveAgendaMemberCell(memberCell) {
  if (!memberCell) return "";

  const sourceId = DERIVED_AGENDA_MEMBER_BY_COPY_ID[memberCell.id];
  if (sourceId) {
    return readAgendaMemberElement(document.getElementById(sourceId));
  }

  return readAgendaMemberElement(memberCell);
}

export function refreshLinkedMemberSelects() {
  if (typeof document === "undefined") return;

  document.querySelectorAll("select[data-linked-to]").forEach((linked) => {
    const source = document.getElementById(linked.dataset.linkedTo);
    if (!source) return;

    if (linked.options.length !== source.options.length) {
      linked.innerHTML = source.innerHTML;
    }

    linked.value = source.value;
    linked.disabled = source.disabled;
  });
}

export function syncDerivedAgendaMemberCopies() {
  if (typeof document === "undefined") return;

  Object.entries(DERIVED_AGENDA_MEMBER_BY_COPY_ID).forEach(([copyId, sourceId]) => {
    const copy = document.getElementById(copyId);
    const source = document.getElementById(sourceId);
    if (!copy || !source) return;

    const name = readAgendaMemberElement(source);
    copy.textContent = name;

    const display = document.getElementById(`${copyId}Display`);
    if (display) display.textContent = name;
  });

  refreshLinkedMemberSelects();
}

export function isLegacyAgendaData(dataArray) {
  if (!Array.isArray(dataArray)) return false;
  if (dataArray[AGENDA_ROLE_COUNT]?.date !== undefined) return false;
  if (dataArray[8]?.id === "fourthSpeaker") return false;
  if (dataArray[8]?.id === "tableRole") return true;
  return dataArray[LEGACY_ROLE_COUNT]?.date !== undefined;
}

function emptySpeakerRole(id) {
  return { id, member: "", path: "", title: "", userId: "" };
}

function emptyMemberRole(id) {
  return { id, member: "" };
}

export function migrateAgendaData(dataArray) {
  if (!Array.isArray(dataArray) || !isLegacyAgendaData(dataArray)) {
    return Array.isArray(dataArray) ? [...dataArray] : [];
  }

  const legacyRoles = dataArray.slice(0, LEGACY_ROLE_COUNT);
  const dateEntry = dataArray[LEGACY_ROLE_COUNT] || { date: "" };
  const editableEntry = dataArray[LEGACY_ROLE_COUNT + 1] || { editable: false };

  return [
    ...legacyRoles.slice(0, 8),
    emptySpeakerRole("fourthSpeaker"),
    legacyRoles[8],
    legacyRoles[9],
    legacyRoles[10],
    legacyRoles[11],
    legacyRoles[12],
    emptyMemberRole("fourthEvaluator"),
    legacyRoles[13],
    dateEntry,
    editableEntry,
  ];
}

export function normalizeAgendaDoc(docData) {
  if (!docData?.data) return { data: [] };
  return { data: migrateAgendaData(docData.data) };
}

export function getAgendaMeta(dataArray) {
  return {
    date: dataArray[AGENDA_ROLE_COUNT]?.date || "",
    editable: Boolean(dataArray[AGENDA_ROLE_COUNT + 1]?.editable),
  };
}

/** Meeting date from published agenda doc (top-level field or legacy array slot). */
export function resolveMeetingDateFromAgenda(docPayload, dataArray = null) {
  const fromDoc = String(docPayload?.meetingDate || "").trim();
  if (fromDoc) return fromDoc;

  const arr = dataArray
    || (Array.isArray(docPayload?.data) ? migrateAgendaData(docPayload.data) : null);
  if (!arr) return "";

  return String(getAgendaMeta(arr).date || "").trim();
}

export function formatMeetingDate(dateValue) {
  const raw = String(dateValue || "").trim();
  if (!raw) return "Date TBD";

  const parsed = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return raw;

  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function findRoleAssignment(dataArray, roleId) {
  if (!Array.isArray(dataArray) || !roleId) return null;

  const byId = dataArray.find((entry) => entry?.id === roleId);
  if (byId) return byId;

  const index = AGENDA_ROLE_INDEX[roleId];
  if (index === undefined) return null;

  const entry = dataArray[index];
  if (!entry || entry.date !== undefined || entry.editable !== undefined) return null;
  if (!entry.member && !entry.userId && !entry.path && !entry.title) return null;

  return { ...entry, id: roleId };
}

export function buildRolesMap(assignments) {
  const roles = {};

  assignments.forEach((entry) => {
    if (!entry?.id || entry.date !== undefined || entry.editable !== undefined) return;

    roles[entry.id] = {
      member: entry.member || "",
    };

    if (entry.path) roles[entry.id].path = entry.path;
    if (entry.title) {
      roles[entry.id].title = entry.title;
      roles[entry.id].speechTitle = entry.title;
    }
    if (entry.userId) roles[entry.id].userId = entry.userId;
    if (entry.imageUrl) roles[entry.id].imageUrl = entry.imageUrl;
    if (entry.bio) roles[entry.id].bio = entry.bio;
  });

  return roles;
}

export function getSpeakerAssignments(dataArray) {
  if (!Array.isArray(dataArray)) return [];

  return SPEAKER_ROLE_IDS.map((roleId) => findRoleAssignment(dataArray, roleId)).filter((assignment) => {
    const member = String(assignment?.member || "").trim();
    return Boolean(member || assignment?.userId);
  });
}

/** Merge published role metadata (userId, bio, image) from agenda.roles onto a row assignment. */
export function mergeAssignmentWithRoleMeta(assignment, roles = {}) {
  if (!assignment?.id) return assignment;

  const role = roles[assignment.id];
  if (!role) return assignment;

  return {
    ...assignment,
    userId: assignment.userId || role.userId || "",
    imageUrl: assignment.imageUrl || role.imageUrl || "",
    bio: assignment.bio || role.bio || "",
    path: assignment.path || role.path || "",
    title: assignment.title || role.title || role.speechTitle || "",
  };
}

/** True when the signed-in user is assigned Vote Counter on the published agenda. */
export function isUserVoteCounterForAgenda(agendaDoc, userId, userName = "") {
  if (!userId || !agendaDoc) return false;

  const vote = findRoleAssignment(normalizeAgendaDoc(agendaDoc).data, "voteRole");
  if (!vote) return false;

  const assignedUid = String(vote.userId || "").trim();
  if (assignedUid && assignedUid === userId) return true;

  const assignedName = String(vote.member || "").trim();
  const name = String(userName || "").trim();
  return Boolean(assignedName && name && assignedName === name);
}

export function attachMemberUserIds(assignments, members = []) {
  if (!Array.isArray(assignments)) return assignments;

  return assignments.map((assignment) => {
    if (!assignment?.member || assignment.date !== undefined || assignment.editable !== undefined) {
      return assignment;
    }

    const memberName = String(assignment.member || "").trim();
    const entry = members.find((m) => String(m?.name || "").trim() === memberName);
    if (!entry?.id || assignment.userId) return assignment;

    return { ...assignment, userId: entry.id };
  });
}

export async function loadAndMigrateAgendaDoc(getDoc, setDoc, docRef) {
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const raw = docSnap.data();
  if (!isLegacyAgendaData(raw.data)) {
    return raw;
  }

  const migrated = { data: migrateAgendaData(raw.data) };
  await setDoc(docRef, migrated);
  return migrated;
}
