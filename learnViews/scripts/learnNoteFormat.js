/** Escape text for safe HTML output */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHref(url) {
  return String(url).trim().replace(/"/g, "%22");
}

function normalizeHref(url) {
  const href = String(url).trim();
  if (!href) return "";

  if (/^(https?:|mailto:|tel:|#)/i.test(href)) {
    return escapeHref(href);
  }
  if (href.startsWith("//")) {
    return escapeHref(`https:${href}`);
  }
  if (/^(\/|\.\/|\.\.\/)/.test(href)) {
    return escapeHref(href);
  }
  if (/^www\./i.test(href)) {
    return escapeHref(`https://${href}`);
  }
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(href)) {
    return escapeHref(`https://${href}`);
  }
  return escapeHref(href);
}

function linkHtml(label, url) {
  const href = normalizeHref(url);
  if (!href) return escapeHtml(label);
  const safeLabel = escapeHtml(label);
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
}

const CODE_PLACEHOLDER = "\uE000CODE";
const LINK_PLACEHOLDER = "\uE000LINK";
const YOUTUBE_PLACEHOLDER = "\uE000YT";

/** Extract YouTube video id from url or raw id */
export function parseYoutubeId(input) {
  const raw = String(input).trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (url.hostname === "youtu.be" || url.hostname.endsWith(".youtu.be")) {
      return url.pathname.replace(/^\//, "").split("/")[0] || null;
    }
    const fromQuery = url.searchParams.get("v");
    if (fromQuery) return fromQuery;
    const embed = url.pathname.match(/\/embed\/([^/?]+)/);
    if (embed) return embed[1];
    const shorts = url.pathname.match(/\/shorts\/([^/?]+)/);
    if (shorts) return shorts[1];
  } catch {
    return null;
  }
  return null;
}

export function youtubeEmbedHtml(input) {
  const id = parseYoutubeId(input);
  if (!id) {
    return '<p class="note-video-error">Could not embed this YouTube link.</p>';
  }
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return `<div class="note-video"><iframe src="https://www.youtube-nocookie.com/embed/${safeId}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
}

function extractYoutubeLine(trimmed) {
  const match = trimmed.match(/^@?youtube\s*:?\s*(.+)$/i);
  return match ? match[1].trim() : null;
}

/** Temporarily replace `inline code` so markdown links inside are not parsed */
function shieldInlineCode(text) {
  const codes = [];
  const shielded = text.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return `${CODE_PLACEHOLDER}${codes.length - 1}\uE001`;
  });
  return { shielded, codes };
}

function restoreInlineCode(html, codes) {
  return html.replace(
    new RegExp(`${CODE_PLACEHOLDER}(\\d+)\uE001`, "g"),
    (_, index) => `<code>${escapeHtml(codes[Number(index)] || "")}</code>`
  );
}

/** Parse [label](url) including URLs that contain parentheses */
function parseMarkdownLinksWithStore(text) {
  const links = [];
  let result = "";
  let i = 0;

  while (i < text.length) {
    const start = text.indexOf("[", i);
    if (start === -1) {
      result += text.slice(i);
      break;
    }

    result += text.slice(i, start);
    const labelEnd = text.indexOf("]", start + 1);
    if (labelEnd === -1 || text[labelEnd + 1] !== "(") {
      result += text[start];
      i = start + 1;
      continue;
    }

    let depth = 0;
    let close = -1;
    for (let j = labelEnd + 2; j < text.length; j += 1) {
      const ch = text[j];
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        if (depth === 0) {
          close = j;
          break;
        }
        depth -= 1;
      }
    }

    if (close === -1) {
      result += text[start];
      i = start + 1;
      continue;
    }

    const label = text.slice(start + 1, labelEnd).trim();
    const url = text.slice(labelEnd + 2, close).trim();
    const id = links.length;
    if (label.toLowerCase() === "youtube") {
      links.push({ type: "youtube", url });
      result += `${YOUTUBE_PLACEHOLDER}${id}\uE001`;
    } else {
      links.push({ type: "link", label, url });
      result += `${LINK_PLACEHOLDER}${id}\uE001`;
    }
    i = close + 1;
  }

  return { text: result, links };
}

function applyInlinePlaceholders(html, links) {
  let out = html.replace(
    new RegExp(`${LINK_PLACEHOLDER}(\\d+)\uE001`, "g"),
    (_, id) => {
      const entry = links[Number(id)];
      if (!entry || entry.type !== "link") return "";
      return linkHtml(entry.label, entry.url);
    }
  );
  out = out.replace(
    new RegExp(`${YOUTUBE_PLACEHOLDER}(\\d+)\uE001`, "g"),
    (_, id) => {
      const entry = links[Number(id)];
      if (!entry || entry.type !== "youtube") return "";
      return youtubeEmbedHtml(entry.url);
    }
  );
  return out;
}

const PROT_PLACEHOLDER = "\uE000PROT";

function autolinkBareUrls(html) {
  const protectedBlocks = [];
  let safe = html.replace(/<div class="note-video">[\s\S]*?<\/div>/gi, (block) => {
    protectedBlocks.push(block);
    return `${PROT_PLACEHOLDER}${protectedBlocks.length - 1}\uE001`;
  });
  safe = safe.replace(/<(code|pre)\b[^>]*>[\s\S]*?<\/\1>/gi, (block) => {
    protectedBlocks.push(block);
    return `${PROT_PLACEHOLDER}${protectedBlocks.length - 1}\uE001`;
  });

  const anchorPattern = /(<a\b[^>]*>[\s\S]*?<\/a>)/gi;
  const parts = safe.split(anchorPattern);

  safe = parts
    .map((part, index) => {
      if (index % 2 === 1) return part;

      return part
        .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]]*)/gi, (match) => {
          const trimmed = match.replace(/[.,;:!?)]+$/, "");
          const suffix = match.slice(trimmed.length);
          return linkHtml(trimmed, trimmed) + suffix;
        })
        .replace(
          /(^|[\s(])((?:www\.)[^\s<]+[^\s<.,;:!?)\]]*)/gi,
          (full, before, url) => {
            const trimmed = url.replace(/[.,;:!?)]+$/, "");
            const suffix = url.slice(trimmed.length);
            return before + linkHtml(trimmed, trimmed) + suffix;
          }
        );
    })
    .join("");

  return safe.replace(
    new RegExp(`${PROT_PLACEHOLDER}(\\d+)\uE001`, "g"),
    (_, index) => protectedBlocks[Number(index)] || ""
  );
}

/** Inline: `code`, [label](url), **bold**, autolink URLs */
function formatInline(text) {
  const { shielded, codes } = shieldInlineCode(String(text));
  const { text: withMarkers, links } = parseMarkdownLinksWithStore(shielded);
  let out = escapeHtml(withMarkers);
  out = applyInlinePlaceholders(out, links);
  out = restoreInlineCode(out, codes);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = autolinkBareUrls(out);
  return out;
}

/**
 * Lightweight note markup (no external library).
 *
 * ## Section (h2)
 * ### Subsection (h3)
 * > Quote block
 * ``` code fence ```
 * @youtube https://youtu.be/VIDEO_ID  (or youtube:URL)
 * ```youtube
 * https://www.youtube.com/watch?v=VIDEO_ID
 * ```
 * [youtube](https://youtu.be/VIDEO_ID)
 * - list item
 * Plain paragraphs (blank line between)
 */
export function formatNoteBody(text) {
  if (!text || !text.trim()) return "";

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const parts = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const fenceLang = trimmed.slice(3).trim().toLowerCase();
      i += 1;
      const blockLines = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        blockLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      if (fenceLang === "youtube") {
        parts.push(youtubeEmbedHtml(blockLines.join("\n").trim()));
      } else {
        parts.push(`<pre><code>${escapeHtml(blockLines.join("\n"))}</code></pre>`);
      }
      continue;
    }

    const youtubeTarget = extractYoutubeLine(trimmed);
    if (youtubeTarget) {
      parts.push(youtubeEmbedHtml(youtubeTarget));
      i += 1;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      parts.push(`<h3>${formatInline(trimmed.slice(4))}</h3>`);
      i += 1;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      parts.push(`<h2>${formatInline(trimmed.slice(3))}</h2>`);
      i += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      parts.push(
        `<blockquote>${quoteLines.map((q) => formatInline(q)).join("<br>")}</blockquote>`
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(formatInline(lines[i].trim().replace(/^[-*]\s+/, "")));
        i += 1;
      }
      parts.push(`<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`);
      continue;
    }

    const paraLines = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (
        !t ||
        t.startsWith("```") ||
        t.startsWith("## ") ||
        t.startsWith("### ") ||
        t.startsWith(">") ||
        /^[-*]\s+/.test(t) ||
        extractYoutubeLine(t)
      ) {
        break;
      }
      paraLines.push(lines[i]);
      i += 1;
    }
    if (paraLines.length) {
      const paraText = paraLines.join(" ").trim();
      const youtubeOnly = paraText.match(/^\[youtube\]\(([^)]+)\)$/i);
      if (youtubeOnly) {
        parts.push(youtubeEmbedHtml(youtubeOnly[1]));
      } else {
        parts.push(`<p>${formatInline(paraText)}</p>`);
      }
    }
  }

  return parts.join("\n");
}

/** @deprecated use formatNoteBody */
export function bodyToHtml(text) {
  return formatNoteBody(text);
}

export const NOTE_FORMAT_HELP = `## Section title
### Smaller heading

Regular paragraph. Use **bold** and \`inline code\`.

> Quote block line one

\`\`\`
npm install express
\`\`\`

- List item one

[VS Code](https://code.visualstudio.com/)
https://example.com

@youtube https://www.youtube.com/watch?v=VIDEO_ID`;
