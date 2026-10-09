import {
  GUARANTEE_EMAIL,
  COACHING_IG_URL,
  STRIPE_COACHING_PLANS,
  STRIPE_COACHING_PLAN_LABELS,
} from "./flConfig.js";
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
const submitBtn = document.getElementById("applySubmit");
const statusEl = document.getElementById("applyStatus");

function checkoutUrlForPlan(plan, email) {
  const key = STRIPE_COACHING_PLAN_LABELS[plan];
  const base = key && STRIPE_COACHING_PLANS[key];
  if (!base) return "";
  try {
    const url = new URL(base);
    if (email) url.searchParams.set("prefilled_email", email);
    return url.toString();
  } catch {
    return base;
  }
}

function syncSubmitLabel() {
  if (!submitBtn) return;
  const plan = planField?.value || "";
  submitBtn.textContent = STRIPE_COACHING_PLAN_LABELS[plan]
    ? "Apply and pay"
    : "Apply for coaching";
}

planField?.addEventListener("change", syncSubmitLabel);

document.querySelectorAll("[data-plan]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (planField) planField.value = btn.getAttribute("data-plan") || "";
    syncSubmitLabel();
  });
});

syncSubmitLabel();

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

  const checkoutUrl = checkoutUrlForPlan(plan, email);

  if (statusEl) {
    statusEl.textContent = checkoutUrl
      ? "Your application is opening in email. Checkout loads next."
      : "Your email app should open. I will text you within 24 hours to book the call.";
  }

  if (checkoutUrl) {
    const mailLink = document.createElement("a");
    mailLink.href = mailto;
    mailLink.style.display = "none";
    document.body.appendChild(mailLink);
    mailLink.click();
    mailLink.remove();
    window.setTimeout(() => {
      window.location.assign(checkoutUrl);
    }, 500);
    return;
  }

  window.location.href = mailto;
});
