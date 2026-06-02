import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { buildVoteResultsSummary, renderVoteResultsHtml } from "./tmVoteTally.js";

export async function loadVoteResultsInto(container, db) {
  if (!container) return;

  container.innerHTML = `<p class="tm-vote-results__loading">Loading votes…</p>`;

  const snapshot = await getDocs(collection(db, "votes"));
  const voteDocs = [];
  snapshot.forEach((voteDoc) => {
    voteDocs.push({ id: voteDoc.id, data: voteDoc.data() });
  });

  if (!voteDocs.length) {
    container.innerHTML = `<p class="tm-vote-results__empty">No votes have been cast yet.</p>`;
    return;
  }

  const summary = buildVoteResultsSummary(voteDocs);
  container.innerHTML = renderVoteResultsHtml(summary);
}
