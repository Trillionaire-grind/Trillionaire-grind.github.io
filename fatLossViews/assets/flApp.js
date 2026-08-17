import { EBOOK_PDF, GUARANTEE_EMAIL, KIT_PDF } from "./flConfig.js";
import { flVersionLabel } from "./flVersion.js";
import "./flLedger.js";

console.log("[Fat Loss app] working version:", flVersionLabel());

const panels = {
  book: document.getElementById("panel-book"),
  ledger: document.getElementById("panel-ledger"),
};

const tabs = Array.from(document.querySelectorAll(".fl-tab"));
const installBanner = document.getElementById("installBanner");
const installBtn = document.getElementById("installBtn");
const dismissInstall = document.getElementById("dismissInstall");
const versionEl = document.getElementById("flAppVersion");
const bookFrame = document.getElementById("bookFrame");
const bookPdfLink = document.getElementById("bookPdfLink");
const bookOpenLink = document.getElementById("bookOpenLink");

let deferredInstall = null;

if (versionEl) versionEl.textContent = flVersionLabel();
if (bookFrame) bookFrame.src = EBOOK_PDF;
if (bookPdfLink) {
  bookPdfLink.href = EBOOK_PDF;
  bookPdfLink.setAttribute("download", "");
}
if (bookOpenLink) {
  bookOpenLink.href = EBOOK_PDF;
  bookOpenLink.target = "_blank";
  bookOpenLink.rel = "noopener";
}

function setTab(name) {
  const tab = name === "ledger" ? "ledger" : "book";
  tabs.forEach((btn) => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
  panels.book.hidden = tab !== "book";
  panels.ledger.hidden = tab !== "ledger";
  location.hash = tab;
}

tabs.forEach((btn) => {
  btn.addEventListener("click", () => setTab(btn.dataset.tab));
});

function readHashTab() {
  const hash = (location.hash || "").replace("#", "").toLowerCase();
  setTab(hash === "ledger" ? "ledger" : "book");
}

window.addEventListener("hashchange", readHashTab);
readHashTab();

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstall = e;
  if (installBanner) installBanner.classList.add("is-visible");
});

installBtn?.addEventListener("click", async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  installBanner?.classList.remove("is-visible");
});

dismissInstall?.addEventListener("click", () => {
  installBanner?.classList.remove("is-visible");
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./fl-sw.js").catch(() => {});
}

/** Kit PDF download when buyer arrived from bundle thank-you redirect. */
(() => {
  const params = new URLSearchParams(window.location.search);
  const hasKit =
    params.get("kit") === "1" ||
    params.get("kit") === "true" ||
    params.get("bundle") === "1";
  const kitBar = document.getElementById("kitBar");
  const kitLink = document.getElementById("kitLink");
  if (hasKit && kitBar && kitLink) {
    kitLink.href = KIT_PDF;
    kitLink.setAttribute("download", "");
    kitBar.hidden = false;
  }
})();

export { GUARANTEE_EMAIL };
