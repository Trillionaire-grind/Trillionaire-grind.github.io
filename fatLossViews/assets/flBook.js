import {
  STRIPE_PAYMENT_URL,
  GUARANTEE_EMAIL,
  PRODUCT_PRICE_LABEL,
} from "./flConfig.js";
import { flVersionLabel } from "./flVersion.js";

const versionEl = document.getElementById("flVersion");
if (versionEl) versionEl.textContent = flVersionLabel();

function highlightBuy() {
  const box = document.getElementById("buy");
  if (!box) return;
  box.classList.remove("is-highlighted");
  void box.offsetWidth;
  box.classList.add("is-highlighted");
  window.setTimeout(() => box.classList.remove("is-highlighted"), 2800);
}

function scrollToBuy() {
  const box = document.getElementById("buy");
  box?.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(highlightBuy, 350);
}

document.querySelectorAll("[data-scroll-buy]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    scrollToBuy();
  });
});

function startCheckout(e) {
  if (!STRIPE_PAYMENT_URL) {
    e.preventDefault();
    alert(
      "Checkout is being wired up. Email " +
        GUARANTEE_EMAIL +
        " to get the book at " +
        PRODUCT_PRICE_LABEL +
        " while we finish the link."
    );
    return;
  }
  if (typeof fbq === "function") {
    fbq("track", "InitiateCheckout", { value: 29, currency: "USD" });
  }
}

document.querySelectorAll(".js-buy-btn").forEach((btn) => {
  if (STRIPE_PAYMENT_URL) {
    btn.href = STRIPE_PAYMENT_URL;
    btn.target = "_blank";
    btn.rel = "noopener";
  }
  btn.addEventListener("click", startCheckout);
});

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

initStickyCta();
initPhotos();
