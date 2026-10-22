import { GUARANTEE_EMAIL, COACHING_IG_URL, STRIPE_COACHING_PLANS } from "./flConfig.js";
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

const form = document.getElementById("applyForm");
const statusEl = document.getElementById("applyStatus");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const weight = String(data.get("weight") || "").trim();
  const goal = String(data.get("goal") || "").trim();
  const days = String(data.get("days") || "").trim();
  const plan = String(data.get("plan") || "").trim();
  const notes = String(data.get("notes") || "").trim();

  if (!name || !email || !phone) {
    if (statusEl) statusEl.textContent = "Name, email, and phone are required.";
    return;
  }

  const body = [
    "Fat Loss Coaching call request",
    "",
    "Name: " + name,
    "Email: " + email,
    "Phone: " + phone,
    "Current weight: " + (weight || "n/a"),
    "Goal: " + (goal || "n/a"),
    "Days I can train: " + (days || "n/a"),
    "Plan: " + (plan || "n/a"),
    "Notes: " + (notes || "n/a"),
  ].join("\n");

  window.location.href =
    "mailto:" +
    encodeURIComponent(GUARANTEE_EMAIL) +
    "?subject=" +
    encodeURIComponent("Coaching call request: " + name) +
    "&body=" +
    encodeURIComponent(body);

  if (statusEl) {
    statusEl.textContent = "Your email app should open. I will text you within 24 hours to book the call.";
  }
});
