export const MEMBERS_COLLECTION = "networkMembers";
export const CHECKINS_COLLECTION = "networkCheckIns";

export const DEFAULT_MEMBER_FIELDS = {
  preferredName: "",
  phone: "",
  businessName: "",
  helpDescription: "",
  photoUrl: "",
  profileOpen: true,
  admin: false,
};

export function displayName(profile) {
  if (!profile) return "Member";
  const pref = String(profile.preferredName || "").trim();
  const legal = String(profile.name || "").trim();
  return pref || legal || "Member";
}

export function normalizeMember(uid, data) {
  const raw = data && typeof data === "object" ? data : {};
  return {
    uid,
    name: String(raw.name || "").trim(),
    preferredName: String(raw.preferredName || "").trim(),
    phone: String(raw.phone || "").trim(),
    businessName: String(raw.businessName || "").trim(),
    helpDescription: String(raw.helpDescription || "").trim(),
    email: String(raw.email || "").trim(),
    photoUrl: String(raw.photoUrl || "").trim(),
    profileOpen: raw.profileOpen !== false,
    admin: raw.admin === true,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
}

export function memberMatchesQuery(profile, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  const hay = [
    profile.name,
    profile.preferredName,
    profile.businessName,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function dateKeyFromDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateTime(value) {
  if (!value) return "—";
  let d;
  if (typeof value?.toDate === "function") d = value.toDate();
  else if (value instanceof Date) d = value;
  else d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
