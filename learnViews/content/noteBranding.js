(function () {
  const script = document.currentScript;
  if (!script?.src) return;

  const cssUrl = new URL("../assets/noteArticle.css", script.src).href;
  const metaUrl = new URL("noteMeta.json", script.src).href;
  const GENRE_LABELS = { apps: "Apps", business: "Business", city: "Cities" };

  if (!document.querySelector('link[href*="noteArticle.css"]')) {
    const fontPre = document.createElement("link");
    fontPre.rel = "preconnect";
    fontPre.href = "https://fonts.googleapis.com";
    document.head.appendChild(fontPre);

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(fontLink);

    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = cssUrl;
    document.head.appendChild(cssLink);
  }

  function learnNotesUrl() {
    const parts = window.location.pathname.split("/");
    const learnIdx = parts.indexOf("learnViews");
    if (learnIdx >= 0) {
      return `${parts.slice(0, learnIdx + 1).join("/")}/learn.html#notes`;
    }
    return "/learnViews/learn.html#notes";
  }

  function slugFromPath() {
    const parts = window.location.pathname.split("/");
    return parts[parts.length - 1]?.replace(/\.html$/i, "") || "";
  }

  const READ_WORDS_PER_MINUTE = 238;
  const AUTHOR_TYPES = {
    kepler: "Képler Siguineau",
    ai: "AI",
    "ai-human": "AI + human",
    team: "The team",
  };

  function normalizeAuthorType(entry) {
    if (entry?.authorType && AUTHOR_TYPES[entry.authorType]) return entry.authorType;
    if (entry?.isAi) return "ai";
    return "kepler";
  }

  function authorLabel(entry) {
    return AUTHOR_TYPES[normalizeAuthorType(entry)];
  }

  function authorClassName(authorType) {
    if (authorType === "ai") return "note-ai-badge";
    if (authorType === "ai-human") return "note-author note-author--collab";
    return "note-author";
  }

  function countWords(text) {
    if (!text) return 0;
    const plain = String(text)
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!plain) return 0;
    return plain.split(/\s+/).filter(Boolean).length;
  }

  function estimateReadMin(entry, container) {
    if (typeof entry?.wordCount === "number" && entry.wordCount > 0) {
      return Math.max(1, Math.round(entry.wordCount / READ_WORDS_PER_MINUTE));
    }
    const text = container ? container.innerText : entry?.title || "";
    return Math.max(1, Math.round(countWords(text) / READ_WORDS_PER_MINUTE));
  }

  function formatMetaDate(ms) {
    if (!ms) return "";
    return new Date(ms).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function wrapYoutubeIframes(root) {
    root.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]').forEach((iframe) => {
      if (iframe.closest(".note-video-embed, .note-video")) return;
      const wrap = document.createElement("div");
      wrap.className = "note-video-embed";
      iframe.parentNode.insertBefore(wrap, iframe);
      wrap.appendChild(iframe);
    });
  }

  function applyReaderLayout(entry) {
    document.body.classList.add("static-note-reader");

    const container = document.querySelector(".blogContainer");
    if (!container) return;

    const genre = entry?.genre || "apps";
    container.classList.add("note-article-shell", `note-article-shell--${genre}`);

    if (document.querySelector(".note-article-toolbar")) return;

    const toolbar = document.createElement("div");
    toolbar.className = "note-article-toolbar";
    toolbar.innerHTML = `<a class="note-back-link" href="${learnNotesUrl()}">← Back to notes</a>`;
    container.insertBefore(toolbar, container.firstChild);

    const oldBrand = container.querySelector(".note-site-brand");
    if (oldBrand) oldBrand.remove();

    const h1 = container.querySelector("h1");
    const header = document.createElement("header");
    header.className = "note-article-header";

    const genreEl = document.createElement("p");
    genreEl.className = "note-genre";
    genreEl.textContent = GENRE_LABELS[genre] || genre;
    header.appendChild(genreEl);

    if (h1) {
      h1.classList.add("note-article-title");
      header.appendChild(h1);
    } else if (entry?.title) {
      const titleEl = document.createElement("h1");
      titleEl.className = "note-article-title";
      titleEl.textContent = entry.title;
      header.appendChild(titleEl);
    }

    const meta = document.createElement("div");
    meta.className = "note-meta";
    const dateLabel = formatMetaDate(entry?.createdAt);
    const readMin = estimateReadMin(entry, container);
    const authorType = normalizeAuthorType(entry);
    const author = authorLabel(entry);
    const parts = [];
    if (dateLabel) parts.push(`<span>${dateLabel}</span>`);
    if (author) {
      if (parts.length) parts.push(`<span class="note-meta-dot">·</span>`);
      parts.push(`<span class="${authorClassName(authorType)}">${author}</span>`);
    }
    if (parts.length) parts.push(`<span class="note-meta-dot">·</span>`);
    parts.push(`<span>${readMin} min read</span>`);
    meta.innerHTML = parts.join("");
    header.appendChild(meta);

    container.insertBefore(header, toolbar.nextSibling);

    const bodyWrap = document.createElement("div");
    bodyWrap.className = "note-article-body note-static-body";
    while (header.nextSibling) {
      bodyWrap.appendChild(header.nextSibling);
    }
    container.appendChild(bodyWrap);

    if (entry?.title) {
      document.title = `${entry.title} — Képler Siguineau`;
    }

    wrapYoutubeIframes(bodyWrap);
  }

  fetch(metaUrl)
    .then((r) => (r.ok ? r.json() : []))
    .then((list) => {
      const slug = slugFromPath();
      const entry = list.find((n) => n.slug === slug);
      applyReaderLayout(entry);
      wrapYoutubeIframes(document.body);
    })
    .catch(() => {
      applyReaderLayout(null);
      wrapYoutubeIframes(document.body);
    });
})();
