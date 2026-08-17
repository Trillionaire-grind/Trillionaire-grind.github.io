import { EBOOK_PDF } from "./flConfig.js";
import { flVersionLabel } from "./flVersion.js";

const STORAGE_KEY = "fl-book-page-v1";
const PDFJS_VERSION = "4.10.38";
const PDFJS_BASE = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build`;

let pdfDoc = null;
let pageNum = 1;
let pageCount = 0;
let rendering = false;

const els = {
  canvas: null,
  loading: null,
  counter: null,
  prev: null,
  next: null,
  surface: null,
};

export async function initBookReader() {
  const root = document.getElementById("flBookReader");
  if (!root) return;

  els.canvas = document.getElementById("bookCanvas");
  els.loading = document.getElementById("bookLoading");
  els.counter = document.getElementById("bookPageCounter");
  els.prev = document.getElementById("bookPrev");
  els.next = document.getElementById("bookNext");
  els.surface = document.querySelector(".fl-book-surface");

  if (!els.canvas || !els.prev || !els.next) return;

  console.log("[Fat Loss book reader] working version:", flVersionLabel());

  els.prev.addEventListener("click", () => goPrev());
  els.next.addEventListener("click", () => goNext());

  root.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    },
    true,
  );

  let touchStartX = 0;
  root.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0]?.clientX || 0;
    },
    { passive: true },
  );
  root.addEventListener(
    "touchend",
    (e) => {
      const dx = (e.changedTouches[0]?.clientX || 0) - touchStartX;
      if (Math.abs(dx) < 48) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    { passive: true },
  );

  setLoading(true, "Loading book…");

  try {
    const pdfjsLib = await import(`${PDFJS_BASE}/pdf.mjs`);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.mjs`;

    const task = pdfjsLib.getDocument(EBOOK_PDF);
    pdfDoc = await task.promise;
    pageCount = pdfDoc.numPages;

    const saved = Number(localStorage.getItem(STORAGE_KEY));
    pageNum = Number.isFinite(saved) && saved >= 1 && saved <= pageCount ? saved : 1;

    await renderPage(pageNum);
  } catch (err) {
    console.error("[Fat Loss book reader]", err);
    setLoading(true, "Could not load the book. Use Save PDF offline below.");
    setArrows(false, false);
  }
}

function setLoading(show, message) {
  if (els.loading) {
    els.loading.hidden = !show;
    if (message) els.loading.textContent = message;
  }
  if (els.canvas) els.canvas.hidden = show;
}

function setArrows(canPrev, canNext) {
  els.prev.disabled = !canPrev;
  els.next.disabled = !canNext;
  els.prev.classList.toggle("fl-reader-arrow--off", !canPrev);
  els.next.classList.toggle("fl-reader-arrow--off", !canNext);
  els.prev.setAttribute("aria-disabled", canPrev ? "false" : "true");
  els.next.setAttribute("aria-disabled", canNext ? "false" : "true");
}

function updateCounter() {
  if (els.counter) {
    els.counter.textContent = `Page ${pageNum} of ${pageCount}`;
  }
}

async function renderPage(num) {
  if (!pdfDoc || rendering) return;
  rendering = true;
  setLoading(true, "Loading page…");

  try {
    const page = await pdfDoc.getPage(num);
    const canvas = els.canvas;
    const ctx = canvas.getContext("2d");

    const surfaceWidth = els.surface?.clientWidth || window.innerWidth - 140;
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2, Math.max(0.5, (surfaceWidth - 24) / viewport.width));
    const scaled = page.getViewport({ scale });

    canvas.width = Math.floor(scaled.width);
    canvas.height = Math.floor(scaled.height);
    canvas.style.width = `${Math.floor(scaled.width)}px`;
    canvas.style.height = `${Math.floor(scaled.height)}px`;

    await page.render({ canvasContext: ctx, viewport: scaled }).promise;

    pageNum = num;
    localStorage.setItem(STORAGE_KEY, String(pageNum));
    updateCounter();
    setArrows(pageNum > 1, pageNum < pageCount);
    setLoading(false);
  } catch (err) {
    console.error("[Fat Loss book reader] render", err);
    setLoading(true, "Could not render this page.");
  } finally {
    rendering = false;
  }
}

function goPrev() {
  if (pageNum <= 1) return;
  renderPage(pageNum - 1);
}

function goNext() {
  if (pageNum >= pageCount) return;
  renderPage(pageNum + 1);
}

export function refreshBookReaderLayout() {
  if (pdfDoc && pageNum) renderPage(pageNum);
}
