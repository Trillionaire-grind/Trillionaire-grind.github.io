/** Normalize free-text or dropdown names for vote counting. */
export function normalizeVoteName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[,.'"]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b(pm\d+|ac\d+|cc\d+|cl\d+|dtm|ip\d+|d\d+)\b/gi, "")
    .trim();
}

function namesAreSamePerson(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;

  const minLen = 3;
  if (a.length >= minLen && b.length >= minLen && (a.includes(b) || b.includes(a))) {
    return true;
  }

  const aParts = a.split(" ").filter(Boolean);
  const bParts = b.split(" ").filter(Boolean);
  if (aParts.length >= 2 && bParts.length >= 2) {
    const aFirst = aParts[0];
    const bFirst = bParts[0];
    const aLast = aParts[aParts.length - 1];
    const bLast = bParts[bParts.length - 1];
    if (aLast === bLast && aLast.length > 2) {
      if (aFirst === bFirst) return true;
      if (aFirst[0] && bFirst[0] && aFirst[0] === bFirst[0]) return true;
    }
  }

  return false;
}

function tallyCategory(voteDocs, field) {
  const counts = new Map();
  const displayNames = new Map();

  voteDocs.forEach(({ data }) => {
    const raw = String(data[field] || "").trim();
    if (!raw) return;

    const key = normalizeVoteName(raw);
    if (!key) return;

    counts.set(key, (counts.get(key) || 0) + 1);
    const current = displayNames.get(key);
    if (!current || raw.length > current.length) {
      displayNames.set(key, raw);
    }
  });

  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => ({
      name: displayNames.get(key) || key,
      count,
    }));

  const topCount = sorted[0]?.count || 0;
  const winners = sorted.filter((entry) => entry.count === topCount && topCount > 0);

  return { sorted, winners };
}

export function groupTableTopicVotes(voteDocs) {
  const groups = [];

  voteDocs.forEach(({ data }) => {
    const raw = String(data.bestTable || "").trim();
    if (!raw) return;

    const normalized = normalizeVoteName(raw);
    let matched = null;

    for (const group of groups) {
      if (namesAreSamePerson(normalized, group.normalized)) {
        matched = group;
        break;
      }
    }

    if (matched) {
      matched.count += 1;
      if (!matched.variants.includes(raw)) matched.variants.push(raw);
      if (raw.length > matched.name.length) matched.name = raw;
    } else {
      groups.push({
        name: raw,
        normalized,
        count: 1,
        variants: [raw],
      });
    }
  });

  groups.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return groups;
}

export function buildVoteResultsSummary(voteDocs) {
  const speaker = tallyCategory(voteDocs, "bestSpeaker");
  const evaluator = tallyCategory(voteDocs, "bestEvaluator");
  const tableTopics = groupTableTopicVotes(voteDocs);

  return {
    ballotCount: voteDocs.length,
    speaker,
    evaluator,
    tableTopics,
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWinners(winners) {
  if (!winners.length) return "No votes yet";
  if (winners.length === 1) return escapeHtml(winners[0].name);
  return winners.map((entry) => escapeHtml(entry.name)).join(", ") + " (tie)";
}

function renderTallyList(entries) {
  if (!entries.length) {
    return `<p class="tm-vote-results__empty">No votes recorded.</p>`;
  }

  return `<ul class="tm-vote-results__list">
    ${entries
      .map(
        (entry) =>
          `<li><span class="tm-vote-results__name">${escapeHtml(entry.name)}</span><span class="tm-vote-results__count">${entry.count} vote${entry.count === 1 ? "" : "s"}</span></li>`
      )
      .join("")}
  </ul>`;
}

function renderTableTopics(groups) {
  if (!groups.length) {
    return `<p class="tm-vote-results__empty">No table topics votes recorded.</p>`;
  }

  return `<ul class="tm-vote-results__list tm-vote-results__list--table">
    ${groups
      .map((group) => {
        const variantNote =
          group.variants.length > 1
            ? `<span class="tm-vote-results__variants">Also written as: ${group.variants.map(escapeHtml).join(", ")}</span>`
            : "";
        return `<li>
          <div class="tm-vote-results__table-row">
            <span class="tm-vote-results__name">${escapeHtml(group.name)}</span>
            <span class="tm-vote-results__count">${group.count} vote${group.count === 1 ? "" : "s"}</span>
          </div>
          ${variantNote}
        </li>`;
      })
      .join("")}
  </ul>`;
}

export function renderVoteResultsHtml(summary) {
  const ballotLabel = summary.ballotCount === 1 ? "1 ballot" : `${summary.ballotCount} ballots`;

  return `
    <p class="tm-vote-results__intro">${ballotLabel} counted.</p>

    <section class="tm-vote-results__section">
      <h4>Best speaker</h4>
      <p class="tm-vote-results__winner">${formatWinners(summary.speaker.winners)}</p>
      ${renderTallyList(summary.speaker.sorted)}
    </section>

    <section class="tm-vote-results__section">
      <h4>Best evaluator</h4>
      <p class="tm-vote-results__winner">${formatWinners(summary.evaluator.winners)}</p>
      ${renderTallyList(summary.evaluator.sorted)}
    </section>

    <section class="tm-vote-results__section">
      <h4>Table topics</h4>
      <p class="tm-vote-results__copy">Grouped similar spellings when possible.</p>
      ${renderTableTopics(summary.tableTopics)}
    </section>
  `;
}
