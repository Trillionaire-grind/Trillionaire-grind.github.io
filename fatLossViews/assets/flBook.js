import {
  STRIPE_BOOK_ONLY_URL,
  STRIPE_BOOK_PLUS_KIT_URL,
} from "./flConfig.js";
import { flVersionLabel } from "./flVersion.js";

const versionEl = document.getElementById("flVersion");
if (versionEl) versionEl.textContent = flVersionLabel();

function trackCheckout(value) {
  if (typeof fbq === "function") {
    fbq("track", "InitiateCheckout", { value: value, currency: "USD" });
  }
  if (typeof gtag === "function") {
    gtag("event", "begin_checkout", { currency: "USD", value: value });
  }
}

function initBumpModal() {
  const overlay = document.getElementById("kbOverlay");
  const yes = document.getElementById("kbYes");
  const no = document.getElementById("kbNo");
  const close = document.getElementById("kbClose");
  if (!overlay || !yes || !no || !close) return;

  yes.href = STRIPE_BOOK_PLUS_KIT_URL;
  no.href = STRIPE_BOOK_ONLY_URL;
  yes.target = "_blank";
  yes.rel = "noopener";
  no.target = "_blank";
  no.rel = "noopener";

  let lastFocus = null;

  function open(e) {
    if (e) e.preventDefault();
    lastFocus = document.activeElement;
    overlay.classList.add("kbOpen");
    yes.focus();
  }

  function shut() {
    overlay.classList.remove("kbOpen");
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll(".openBump").forEach((btn) => {
    btn.addEventListener("click", open);
  });

  yes.addEventListener("click", () => trackCheckout(38));
  no.addEventListener("click", () => trackCheckout(29));
  close.addEventListener("click", shut);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) shut();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") shut();
  });
}

function initOrderBump() {
  const box = document.getElementById("bumpKit");
  const btn = document.getElementById("buyBtn");
  if (!box || !btn) return;

  function sync() {
    btn.href = box.checked ? STRIPE_BOOK_PLUS_KIT_URL : STRIPE_BOOK_ONLY_URL;
  }

  box.addEventListener("change", sync);
  sync();
  btn.target = "_blank";
  btn.rel = "noopener";
  btn.addEventListener("click", () => {
    trackCheckout(box.checked ? 38 : 29);
  });
}

function initStickyCta() {
  const sticky = document.getElementById("stickyCta");
  const firstPage = document.getElementById("firstPage");
  if (!sticky || !firstPage) return;

  function sync() {
    const pastFirst =
      window.scrollY > firstPage.offsetTop + firstPage.offsetHeight - 48;
    sticky.classList.toggle("visible", pastFirst);
    sticky.setAttribute("aria-hidden", pastFirst ? "false" : "true");
    document.documentElement.style.setProperty(
      "--fl-sticky-h",
      pastFirst ? `${sticky.offsetHeight}px` : "0px"
    );
  }

  window.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  sync();
}

async function photoExists(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function initPhotos() {
  document.querySelectorAll("[data-photo]").forEach(async (el) => {
    const src = el.getAttribute("data-photo");
    if (!src) return;
    const ok = await photoExists(src);
    if (ok) {
      el.classList.remove("is-placeholder");
      const img = document.createElement("img");
      img.src = src;
      img.alt = el.getAttribute("data-photo-alt") || "";
      el.appendChild(img);
    }
  });
}

initBumpModal();
initOrderBump();
initStickyCta();
initPhotos();
