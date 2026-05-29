const PDFJS_VERSION = "4.10.38";
const PDFJS_BASE = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build`;

const ROLE_DEFINITIONS = [
  { pattern: /^Presiding Officer$/i, fieldId: null, note: "Opening/closing presiding officer is fixed in the app." },
  { pattern: /^Toastmaster Presents Awards$/i, fieldId: null },
  { pattern: /^General Evaluator Meeting Evaluation$/i, fieldId: null },
  { pattern: /^Toastmaster$/i, fieldId: "tmRole", ignoreIf: /CALL FOR TIMERS/i },
  { pattern: /^Grammarian$/i, fieldId: "grammarianRole" },
  { pattern: /^Ah-Counter$/i, fieldId: "ahRole" },
  { pattern: /^Timer$/i, fieldId: "timerRole" },
  { pattern: /^Vote Counter$/i, fieldId: "voteRole" },
  { pattern: /^Speaker #1$/i, fieldId: "firstSpeaker" },
  { pattern: /^Speaker #2$/i, fieldId: "secondSpeaker" },
  { pattern: /^Speaker #3$/i, fieldId: "thirdSpeaker" },
  { pattern: /^Speaker #4$/i, fieldId: "fourthSpeaker" },
  { pattern: /^Table Topics Master$/i, fieldId: "tableRole" },
  { pattern: /^General Evaluator$/i, fieldId: "generalRole" },
  { pattern: /^Evaluator #1$/i, fieldId: "firstEvaluator" },
  { pattern: /^Evaluator #2$/i, fieldId: "secondEvaluator" },
  { pattern: /^Evaluator #3$/i, fieldId: "thirdEvaluator" },
  { pattern: /^Evaluator #4$/i, fieldId: "fourthEvaluator" },
  { pattern: /^Moments of Truth/i, fieldId: "educationRole" },
];

const APP_ROLE_IDS = [
  "tmRole",
  "grammarianRole",
  "ahRole",
  "timerRole",
  "voteRole",
  "firstSpeaker",
  "secondSpeaker",
  "thirdSpeaker",
  "fourthSpeaker",
  "tableRole",
  "generalRole",
  "firstEvaluator",
  "secondEvaluator",
  "thirdEvaluator",
  "fourthEvaluator",
  "educationRole",
];

const ROLE_LABELS = {
  tmRole: "Toastmaster",
  grammarianRole: "Grammarian",
  ahRole: "Ah-Counter",
  timerRole: "Timer",
  voteRole: "Vote Counter",
  firstSpeaker: "Speaker #1",
  secondSpeaker: "Speaker #2",
  thirdSpeaker: "Speaker #3",
  fourthSpeaker: "Speaker #4",
  tableRole: "Table Topics Master",
  generalRole: "General Evaluator",
  firstEvaluator: "Evaluator #1",
  secondEvaluator: "Evaluator #2",
  thirdEvaluator: "Evaluator #3",
  fourthEvaluator: "Evaluator #4",
  educationRole: "Moments of Truth",
};

const NAME_LINE_RE = /^[\s]*([A-Z][A-Za-z''.\-]+(?:\s+[A-Z][A-Za-z''.\-]+)+(?:\s*,?\s*[A-Z]{1,4}\d*)?)\s*$/;
const SKIP_LINE_RE = /^(The |After |At the |CALL FOR|Welcome to|Time Role|https?:|Tuesdays |Location:|We are a|5\/\d+\/|Printed Agenda|mission of)/i;
const TIME_SPLIT_RE = /(?=\d{1,2}:\d{2}(?:AM|PM))/g;

function normalizeSpaces(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeName(value) {
  return normalizeSpaces(value).toLowerCase();
}

function stripCredentials(name) {
  return normalizeSpaces(name.replace(/\s+[A-Z]{1,4}\d*$/i, ""));
}

function parseMeetingDate(text) {
  const match = text.match(/Agenda Item for\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  if (!match) return null;

  const parsed = new Date(`${match[1]} 12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return {
    display: match[1],
    iso: `${yyyy}-${mm}-${dd}`,
  };
}

function extractMemberFromChunk(chunk) {
  const lines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (SKIP_LINE_RE.test(line)) continue;
    if (/^\d{1,2}:\d{2}(?:AM|PM)/i.test(line)) continue;

    const nameMatch = line.match(NAME_LINE_RE);
    if (nameMatch) return normalizeSpaces(nameMatch[1]);
  }

  return "";
}

function resolveRoleDefinition(roleTitle, chunk) {
  return ROLE_DEFINITIONS.find((definition) => {
    if (!definition.pattern.test(roleTitle)) return false;
    if (definition.ignoreIf && definition.ignoreIf.test(chunk)) return false;
    return true;
  });
}

export function parseAgendaText(text) {
  const cleaned = text
    .replace(/\u2026/g, "...")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  const meetingDate = parseMeetingDate(cleaned);
  const assignments = {};
  const warnings = [];
  const parsedRoles = [];

  cleaned.split(TIME_SPLIT_RE).forEach((chunk) => {
    const trimmed = chunk.trim();
    if (!trimmed) return;

    const headerMatch = trimmed.match(/^(\d{1,2}:\d{2}(?:AM|PM))\s+(.+?)(?:\n|$)/i);
    if (!headerMatch) return;

    const time = headerMatch[1].toUpperCase();
    const roleTitle = normalizeSpaces(headerMatch[2]);
    const definition = resolveRoleDefinition(roleTitle, trimmed);
    const member = extractMemberFromChunk(trimmed);

    parsedRoles.push({ time, roleTitle, member });

    if (!definition) return;
    if (definition.warning) warnings.push(definition.warning);
    if (!definition.fieldId) return;
    if (member) assignments[definition.fieldId] = member;
  });

  if (!meetingDate) {
    warnings.push("Could not find the meeting date in the PDF.");
  }

  APP_ROLE_IDS.forEach((fieldId) => {
    if (!assignments[fieldId]) {
      warnings.push(`${ROLE_LABELS[fieldId]} was not found in the PDF.`);
    }
  });

  return {
    meetingDate,
    assignments,
    warnings: [...new Set(warnings)],
    parsedRoles,
  };
}

export function matchMemberToSelect(pdfName, selectEl) {
  if (!pdfName || !selectEl) return { value: "", status: "missing" };

  const target = normalizeName(pdfName);
  const targetNoCred = normalizeName(stripCredentials(pdfName));
  let partialMatch = "";

  for (const option of selectEl.options) {
    if (!option.value) continue;

    const optionNorm = normalizeName(option.value);
    const optionNoCred = normalizeName(stripCredentials(option.value));

    if (optionNorm === target || optionNoCred === targetNoCred) {
      return { value: option.value, status: "matched" };
    }

    if (
      target.startsWith(optionNorm) ||
      optionNorm.startsWith(targetNoCred) ||
      targetNoCred.startsWith(optionNoCred)
    ) {
      partialMatch = option.value;
    }
  }

  if (partialMatch) {
    return { value: partialMatch, status: "fuzzy" };
  }

  return { value: "", status: "unmatched", pdfName };
}

export function applyParsedAgenda(parsed, membersByFieldId = {}) {
  const summary = {
    matched: [],
    fuzzy: [],
    unmatched: [],
    missing: [],
    warnings: parsed.warnings,
  };

  if (parsed.meetingDate?.iso) {
    const dateInput = document.getElementById("meetingDate");
    if (dateInput) dateInput.value = parsed.meetingDate.iso;
  }

  APP_ROLE_IDS.forEach((fieldId) => {
    const select = document.getElementById(fieldId);
    const pdfName = parsed.assignments[fieldId] || "";
    const label = ROLE_LABELS[fieldId];
    const result = matchMemberToSelect(pdfName, select);

    if (select && result.value) {
      select.value = result.value;
      if (fieldId === "tmRole") {
        document.getElementById("tmRoleCopy").textContent = result.value;
      }
      if (fieldId === "generalRole") {
        document.getElementById("generalRoleCopy").textContent = result.value;
      }
    }

    if (!pdfName) {
      summary.missing.push(label);
      return;
    }

    if (result.status === "matched") summary.matched.push(`${label}: ${result.value}`);
    else if (result.status === "fuzzy") summary.fuzzy.push(`${label}: ${pdfName} → ${result.value}`);
    else summary.unmatched.push(`${label}: ${pdfName}`);
  });

  return summary;
}

export function renderImportSummary(container, summary, meetingDate) {
  if (!container) return;

  const parts = [];
  if (meetingDate?.display) {
    parts.push(`<p><strong>Meeting date:</strong> ${meetingDate.display}</p>`);
  }
  if (summary.matched.length) {
    parts.push(`<p><strong>Matched (${summary.matched.length}):</strong> ${summary.matched.join("; ")}</p>`);
  }
  if (summary.fuzzy.length) {
    parts.push(`<p><strong>Review suggested (${summary.fuzzy.length}):</strong> ${summary.fuzzy.join("; ")}</p>`);
  }
  if (summary.unmatched.length) {
    parts.push(`<p><strong>Not matched (${summary.unmatched.length}):</strong> ${summary.unmatched.join("; ")}</p>`);
  }
  if (summary.missing.length) {
    parts.push(`<p><strong>Missing in PDF (${summary.missing.length}):</strong> ${summary.missing.join(", ")}</p>`);
  }
  if (summary.warnings.length) {
    parts.push(`<p><strong>Notes:</strong> ${summary.warnings.join(" ")}</p>`);
  }

  parts.push("<p>Speaker path/title fields still need to be filled in manually.</p>");
  parts.push("<p>Review the assignments below, then click <strong>Publish agenda</strong>.</p>");
  container.innerHTML = parts.join("");
  container.hidden = false;
}

async function loadPdfJs() {
  const pdfjsLib = await import(`${PDFJS_BASE}/pdf.min.mjs`);
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.mjs`;
  return pdfjsLib;
}

function textItemToLineBreak(text, item, lastY) {
  const y = item.transform?.[5] ?? lastY;
  if (lastY !== null && Math.abs(y - lastY) > 4) text += "\n";
  text += item.str;
  if (item.hasEOL) text += "\n";
  return { text, lastY: y };
}

export async function extractPdfText(file) {
  const pdfjsLib = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let text = "";
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let lastY = null;

    content.items.forEach((item) => {
      const result = textItemToLineBreak(text, item, lastY);
      text = result.text;
      lastY = result.lastY;
    });

    text += "\n";
  }

  return text;
}

export async function importAgendaPdf(file) {
  const text = await extractPdfText(file);
  const parsed = parseAgendaText(text);
  const summary = applyParsedAgenda(parsed);
  return { parsed, summary };
}
