#!/usr/bin/env node
/**
 * One-time TM Experience launch reset (naples-sunrise-bay).
 *
 * - Deletes all Firebase Auth users (paginated)
 * - Deletes Firestore: users/*, votes/*, test/date, club agendas
 * - Does NOT delete clubs/{clubId} registry docs or accessCodes (Liv)
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"
 *   node scripts/tm-launch-reset.mjs --dry-run
 *   node scripts/tm-launch-reset.mjs --confirm
 *
 * After reset: publish a fresh agenda from Admin and re-register members.
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const PROJECT_ID = "naples-sunrise-bay";
const CLUB_ID = "naples-sunrise-bay";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const confirm = args.has("--confirm");

if (!dryRun && !confirm) {
  console.error("Pass --dry-run to preview or --confirm to execute.");
  process.exit(1);
}

function initAdmin() {
  if (getApps().length) return;
  initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    projectId: PROJECT_ID,
    storageBucket: `${PROJECT_ID}.appspot.com`,
  });
}

async function deleteCollection(db, collectionPath, batchSize = 200) {
  const col = db.collection(collectionPath);
  let total = 0;

  while (true) {
    const snap = await col.limit(batchSize).get();
    if (snap.empty) break;

    total += snap.size;
    if (!dryRun) {
      const batch = db.batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  }

  return total;
}

async function deleteSubcollectionsForUsers(db) {
  const usersSnap = await db.collection("users").get();
  let feedbackCount = 0;
  let speechCount = 0;

  for (const userDoc of usersSnap.docs) {
    const speechesSnap = await userDoc.ref.collection("speeches").get();
    for (const speechDoc of speechesSnap.docs) {
      speechCount += 1;
      const feedbackSnap = await speechDoc.ref.collection("feedback").get();
      feedbackCount += feedbackSnap.size;

      if (!dryRun) {
        const batch = db.batch();
        feedbackSnap.docs.forEach((d) => batch.delete(d.ref));
        batch.delete(speechDoc.ref);
        await batch.commit();
      }
    }
    if (!dryRun) {
      await userDoc.ref.delete();
    }
  }

  return { users: usersSnap.size, speeches: speechCount, feedback: feedbackCount };
}

async function deleteAuthUsers() {
  const auth = getAuth();
  let deleted = 0;
  let pageToken;

  do {
    const list = await auth.listUsers(1000, pageToken);
    for (const user of list.users) {
      deleted += 1;
      if (!dryRun) {
        await auth.deleteUser(user.uid);
      }
    }
    pageToken = list.pageToken;
  } while (pageToken);

  return deleted;
}

async function deleteStorageProfiles() {
  const bucket = getStorage().bucket();
  const [files] = await bucket.getFiles({ prefix: "users/" });
  if (!dryRun && files.length) {
    await Promise.all(files.map((f) => f.delete()));
  }
  return files.length;
}

async function clearAgendas(db) {
  const agendaCol = db.collection("clubs").doc(CLUB_ID).collection("agendas");
  const snap = await agendaCol.get();
  if (!dryRun) {
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    if (snap.size) await batch.commit();
    await db.doc("test/date").delete().catch(() => {});
  }
  return snap.size + 1;
}

async function main() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error("Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON path.");
    process.exit(1);
  }

  initAdmin();
  const db = getFirestore();

  console.log(dryRun ? "DRY RUN — no changes will be made\n" : "CONFIRMED — deleting data\n");

  const authUsers = await deleteAuthUsers();
  console.log(`Auth users to delete: ${authUsers}`);

  const userTree = await deleteSubcollectionsForUsers(db);
  console.log(`Firestore users: ${userTree.users}, speeches: ${userTree.speeches}, feedback: ${userTree.feedback}`);

  const votes = await deleteCollection(db, "votes");
  console.log(`votes documents: ${votes}`);

  const agendas = await clearAgendas(db);
  console.log(`agenda docs cleared (incl. test/date): ~${agendas}`);

  const storageFiles = await deleteStorageProfiles();
  console.log(`storage files under users/: ${storageFiles}`);

  console.log("\nDone.");
  if (dryRun) {
    console.log("Re-run with --confirm to apply.");
  } else {
    console.log("Next steps:");
    console.log("  1. firebase deploy --only firestore:rules,storage");
    console.log("  2. Register admin account in the app");
    console.log("  3. In Firestore Console set users/{uid}.role = \"admin\"");
    console.log("  4. Publish fresh agenda from Admin tab");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
