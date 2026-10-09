import { COACHING_IG_URL, STRIPE_COACHING_PLANS } from "./flConfig.js";
import { flVersionLabel } from "./flVersion.js";

console.log("[Fat Loss coaching] working version:", flVersionLabel());

const versionEl = document.getElementById("flcVersion");
if (versionEl) versionEl.textContent = flVersionLabel();

const ig = document.getElementById("flcIg");
if (ig) {
  ig.href = COACHING_IG_URL;
}

document.querySelectorAll("[data-stripe]").forEach((btn) => {
  const key = btn.getAttribute("data-stripe");
  if (key && STRIPE_COACHING_PLANS[key]) {
    btn.href = STRIPE_COACHING_PLANS[key];
  }
});
