import { GUARANTEE_EMAIL, COACHING_IG_URL, STRIPE_COACHING_PLANS } from "./flConfig.js";
import { flVersionLabel } from "./flVersion.js";

console.log("[Fat Loss coaching] working version:", flVersionLabel());

const versionEl = document.getElementById("flcVersion");
if (versionEl) versionEl.textContent = flVersionLabel();

const ig = document.getElementById("flcIg");
if (ig) {
  ig.href = COACHING_IG_URL;
}

const form = document.getElementById("applyForm");
const planField = document.getElementById("plan");
const statusEl = document.getElementById("applyStatus");

document.querySelectorAll("[data-plan]").forEach((btn) => {
  const stripeKey = btn.getAttribute("data-stripe");
  if (stripeKey && STRIPE_COACHING_PLANS[stripeKey]) {
    btn.href = STRIPE_COACHING_PLANS[stripeKey];
  }
  btn.addEventListener("click", () => {
    if (planField) planField.value = btn.getAttribute("data-plan") || "";
  });
});

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
    "Fat Loss Coaching application",
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

  const mailto =
    "mailto:" +
    encodeURIComponent(GUARANTEE_EMAIL) +
    "?subject=" +
    encodeURIComponent("Coaching application: " + name) +
    "&body=" +
    encodeURIComponent(body);

  window.location.href = mailto;
  if (statusEl) {
    statusEl.textContent = "Your email app should open. I will text you within 24 hours to book the call.";
  }
});
