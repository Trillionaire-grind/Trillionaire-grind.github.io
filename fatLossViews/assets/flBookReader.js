import { FL_BOOK, FL_BOOK_PAGE_COUNT } from "./flBookPages.js";
import { flVersionLabel } from "./flVersion.js";

const STORAGE_KEY = "fl-book-pos-v2";

const chapters = FL_BOOK.chapters || [];

let chapterIndex = 0;
let pageIndex = 0;

const els = {};

export function initBookReader() {
  els.root = document.getElementById("panel-book");
  if (!els.root || !chapters.length) return;

  els.contents = document.getElementById("bookContents");
  els.reader = document.getElementById("flBookReader");
  els.cover = document.getElementById("bookCover");
  els.title = document.getElementById("bookTitle");
  els.author = document.getElementById("bookAuthor");
  els.chapterCount = document.getElementById("bookChapterCount");
  els.pageTotal = document.getElementById("bookPageTotal");
  els.chapterList = document.getElementById("bookChapters");
  els.resume = document.getElementById("bookResume");
  els.back = document.getElementById("bookBack");
  els.sectionTitle = document.getElementById("bookSectionTitle");
  els.surface = document.getElementById("bookSurface");
  els.counter = document.getElementById("bookPageCounter");
  els.prev = document.getElementById("bookPrev");
  els.next = document.getElementById("bookNext");

  if (!els.contents || !els.reader || !els.surface) return;

  console.log("[Fat Loss book reader] working version:", flVersionLabel());

  renderContents();
  restorePosition();

  els.resume.addEventListener("click", () => openChapter(chapterIndex, pageIndex));
  els.back.addEventListener("click", showContents);
  els.prev.addEventListener("click", goPrev);
  els.next.addEventListener("click", goNext);

  els.reader.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") showContents();
    },
    true,
  );

  window.addEventListener("resize", sizeReadingPanel);
  window.addEventListener("orientationchange", sizeReadingPanel);

  let touchStartX = 0;
  els.reader.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0]?.clientX || 0;
    },
    { passive: true },
  );
  els.reader.addEventListener(
    "touchend",
    (e) => {
      const dx = (e.changedTouches[0]?.clientX || 0) - touchStartX;
      if (Math.abs(dx) < 48) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    { passive: true },
  );
}

function renderContents() {
  if (els.cover && FL_BOOK.cover) {
    els.cover.src = FL_BOOK.cover;
    els.cover.alt = `${FL_BOOK.title} cover`;
    els.cover.addEventListener("load", () => els.cover.classList.add("is-loaded"), {
      once: true,
    });
  }
  if (els.title) els.title.textContent = FL_BOOK.title || "";
  if (els.author) els.author.textContent = FL_BOOK.author || "—";
  if (els.chapterCount) els.chapterCount.textContent = String(chapters.length);
  if (els.pageTotal) els.pageTotal.textContent = String(FL_BOOK_PAGE_COUNT);

  els.chapterList.innerHTML = "";
  chapters.forEach((chapter, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "fl-chapter-item";
    const count = chapter.pages.length;
    item.innerHTML =
      `<span class="fl-chapter-name"></span>` +
      `<span class="fl-chapter-pages">${count} ${count === 1 ? "page" : "pages"}</span>`;
    item.querySelector(".fl-chapter-name").textContent = chapter.title;
    item.addEventListener("click", () => openChapter(index, 0));
    els.chapterList.appendChild(item);
  });
}

function restorePosition() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    saved = null;
  }
  if (!saved || !chapters[saved.chapter]) return;

  chapterIndex = saved.chapter;
  pageIndex = Math.min(saved.page || 0, chapters[chapterIndex].pages.length - 1);
  syncResume();
}

function syncResume() {
  if (!els.resume) return;
  const started = localStorage.getItem(STORAGE_KEY) !== null;
  els.resume.hidden = !started;
  if (started) {
    els.resume.textContent = `Continue — ${chapters[chapterIndex].title}, page ${pageIndex + 1}`;
  }
}

function savePosition() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ chapter: chapterIndex, page: pageIndex }),
  );
}

function showContents() {
  els.reader.hidden = true;
  els.contents.hidden = false;
  els.root.classList.remove("is-reading");
  els.root.style.removeProperty("--fl-book-panel-h");
  syncResume();
}

function sizeReadingPanel() {
  if (!els.root || !els.root.classList.contains("is-reading")) return;
  const top = els.root.getBoundingClientRect().top;
  const available = Math.max(320, window.innerHeight - top);
  els.root.style.setProperty("--fl-book-panel-h", `${available}px`);
}

function openChapter(index, page) {
  const chapter = chapters[index];
  if (!chapter) return;

  chapterIndex = index;
  pageIndex = Math.min(Math.max(page, 0), chapter.pages.length - 1);

  els.contents.hidden = true;
  els.reader.hidden = false;
  els.root.classList.add("is-reading");
  window.scrollTo(0, 0);
  sizeReadingPanel();
  els.reader.focus({ preventScroll: true });

  showPage();
}

function showPage() {
  const chapter = chapters[chapterIndex];
  const page = chapter.pages[pageIndex];
  if (!page) return;

  savePosition();

  els.sectionTitle.textContent = chapter.title;
  els.counter.textContent = `Page ${pageIndex + 1} of ${chapter.pages.length}`;
  els.surface.scrollTop = 0;
  els.surface.innerHTML = "";

  const images = page.images || [];
  if (images.length) {
    const figure = document.createElement("div");
    figure.className =
      images.length > 1 ? "fl-reader-photos fl-reader-photos--pair" : "fl-reader-photos";
    images.forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = chapter.title;
      img.loading = "lazy";
      figure.appendChild(img);
    });
    els.surface.appendChild(figure);
  }

  (page.blocks || []).forEach((block) => {
    const tag = block.t === "h" ? "h3" : "p";
    const node = document.createElement(tag);
    node.className = `fl-block fl-block-${block.t}`;
    node.textContent = block.x;
    els.surface.appendChild(node);
  });

  const firstPage = pageIndex === 0;
  const lastPage = pageIndex === chapter.pages.length - 1;
  setArrow(els.prev, !firstPage || chapterIndex > 0, firstPage && chapterIndex > 0);
  setArrow(
    els.next,
    !lastPage || chapterIndex < chapters.length - 1,
    lastPage && chapterIndex < chapters.length - 1,
  );
}

function setArrow(btn, enabled, isChapterJump) {
  btn.disabled = !enabled;
  btn.classList.toggle("fl-reader-arrow--off", !enabled);
  btn.classList.toggle("fl-reader-arrow--chapter", Boolean(enabled && isChapterJump));
}

function goPrev() {
  if (pageIndex > 0) {
    pageIndex -= 1;
    showPage();
    return;
  }
  if (chapterIndex > 0) {
    const prev = chapters[chapterIndex - 1];
    openChapter(chapterIndex - 1, prev.pages.length - 1);
  }
}

function goNext() {
  const chapter = chapters[chapterIndex];
  if (pageIndex < chapter.pages.length - 1) {
    pageIndex += 1;
    showPage();
    return;
  }
  if (chapterIndex < chapters.length - 1) openChapter(chapterIndex + 1, 0);
}

export function refreshBookReaderLayout() {
  if (els.reader && !els.reader.hidden) showPage();
}
