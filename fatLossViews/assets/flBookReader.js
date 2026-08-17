import { FL_BOOK_PAGES, FL_BOOK_PAGE_COUNT } from "./flBookPages.js";
import { flVersionLabel } from "./flVersion.js";

const STORAGE_KEY = "fl-book-page-v1";

let pagePosition = 0;
let pages = FL_BOOK_PAGES;

const els = {
  root: null,
  title: null,
  text: null,
  image: null,
  counter: null,
  prev: null,
  next: null,
};

export function initBookReader() {
  els.root = document.getElementById("flBookReader");
  if (!els.root || !FL_BOOK_PAGE_COUNT) return;

  els.title = document.getElementById("bookSectionTitle");
  els.text = document.getElementById("bookPageText");
  els.image = document.getElementById("bookPageImage");
  els.counter = document.getElementById("bookPageCounter");
  els.prev = document.getElementById("bookPrev");
  els.next = document.getElementById("bookNext");

  if (!els.text || !els.prev || !els.next) return;

  console.log("[Fat Loss book reader] working version:", flVersionLabel());

  pages = FL_BOOK_PAGES;
  const saved = Number(localStorage.getItem(STORAGE_KEY));
  pagePosition =
    Number.isFinite(saved) && saved >= 0 && saved < pages.length ? saved : 0;

  els.prev.addEventListener("click", () => goPrev());
  els.next.addEventListener("click", () => goNext());

  els.root.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    },
    true,
  );

  let touchStartX = 0;
  els.root.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0]?.clientX || 0;
    },
    { passive: true },
  );
  els.root.addEventListener(
    "touchend",
    (e) => {
      const dx = (e.changedTouches[0]?.clientX || 0) - touchStartX;
      if (Math.abs(dx) < 48) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    { passive: true },
  );

  showPage(pagePosition);
}

function setArrows(canPrev, canNext) {
  els.prev.disabled = !canPrev;
  els.next.disabled = !canNext;
  els.prev.classList.toggle("fl-reader-arrow--off", !canPrev);
  els.next.classList.toggle("fl-reader-arrow--off", !canNext);
}

function showPage(position) {
  const page = pages[position];
  if (!page) return;

  pagePosition = position;
  localStorage.setItem(STORAGE_KEY, String(pagePosition));

  if (els.title) els.title.textContent = page.title || "How to Lose Fat as Fast as Possible";
  if (els.counter) els.counter.textContent = `Page ${position + 1} of ${pages.length}`;

  const textValue = typeof page.text === "string" ? page.text : "";
  const imageUrl = typeof page.imageUrl === "string" ? page.imageUrl.trim() : "";

  els.text.hidden = false;
  els.text.textContent = textValue;

  if (imageUrl && els.image) {
    els.image.src = imageUrl;
    els.image.alt = page.title || "Book illustration";
    els.image.hidden = false;
  } else if (els.image) {
    els.image.hidden = true;
    els.image.removeAttribute("src");
  }

  setArrows(position > 0, position < pages.length - 1);
}

function goPrev() {
  if (pagePosition <= 0) return;
  showPage(pagePosition - 1);
}

function goNext() {
  if (pagePosition >= pages.length - 1) return;
  showPage(pagePosition + 1);
}

export function refreshBookReaderLayout() {
  if (pages.length) showPage(pagePosition);
}
