import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function normalizeClubId(value) {
  return String(value || "").trim();
}

/**
 * Looks up clubs/{clubId} in Firestore.
 * Expected fields: name (string), active (boolean, default true).
 */
export async function validateClubId(db, rawClubId) {
  const clubId = normalizeClubId(rawClubId);

  if (!clubId) {
    return { ok: false, message: "Enter your club ID." };
  }

  if (clubId.length < 3 || clubId.length > 64) {
    return { ok: false, message: "Club ID looks invalid. Check with your club admin." };
  }

  try {
    const snap = await getDoc(doc(db, "clubs", clubId));
    if (!snap.exists()) {
      return {
        ok: false,
        message: "Club ID not found. Double-check the ID from your club admin.",
      };
    }

    const data = snap.data();
    if (data.active === false) {
      return {
        ok: false,
        message: "This club is not active on TM Experience yet.",
      };
    }

    return {
      ok: true,
      clubId,
      clubName: data.name || clubId,
    };
  } catch (error) {
    return {
      ok: false,
      message: "Could not verify club ID. Try again in a moment.",
    };
  }
}
