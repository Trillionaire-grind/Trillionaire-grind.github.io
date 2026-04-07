import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/**
 * IDs in users/{uid}.books (Firestore).
 */
export async function loadUserBookIds(db, uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return new Set();
  const b = snap.data().books;
  return Array.isArray(b) ? new Set(b.filter((x) => typeof x === "string")) : new Set();
}

/** Add or remove one book ID; returns true if book is now in the list. */
export async function toggleUserBookInFirestore(db, uid, bookId) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { books: [bookId], updatedAt: serverTimestamp() }, { merge: true });
    return true;
  }

  const list = Array.isArray(snap.data().books) ? snap.data().books : [];
  const has = list.indexOf(bookId) >= 0;

  if (has) {
    await updateDoc(ref, { books: arrayRemove(bookId), updatedAt: serverTimestamp() });
    return false;
  }
  await updateDoc(ref, { books: arrayUnion(bookId), updatedAt: serverTimestamp() });
  return true;
}

export async function removeUserBookFromFirestore(db, uid, bookId) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, { books: arrayRemove(bookId), updatedAt: serverTimestamp() });
}
