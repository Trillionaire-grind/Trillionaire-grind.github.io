import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import {
  AMAZON_URL,
  INSTAGRAM_PROFILE_URL,
  TESTIMONIAL_PHOTOS,
} from "./saConfig.js";
import { saVersionLabel } from "./saVersion.js";

const firebaseConfig = {
  apiKey: "AIzaSyCvdbEnz-WTuJdH4sF3lV3Y-wgOZurHHqM",
  authDomain: "secret-attraction-3eff4.firebaseapp.com",
  projectId: "secret-attraction-3eff4",
  storageBucket: "secret-attraction-3eff4.firebasestorage.app",
  messagingSenderId: "12436460437",
  appId: "1:12436460437:web:8c6dc8e083635481055c9c",
  measurementId: "G-GT9YFDM1RT",
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
const db = getFirestore(app);

const versionEl = document.getElementById("saVersion");
if (versionEl) versionEl.textContent = saVersionLabel();

function highlightOptin() {
  const box = document.getElementById("optin");
  if (!box) return;
  box.classList.remove("is-highlighted");
  void box.offsetWidth;
  box.classList.add("is-highlighted");
  const firstInput = box.querySelector('input[name="name"], input[name="email"]');
  firstInput?.focus({ preventScroll: true });
  window.setTimeout(() => box.classList.remove("is-highlighted"), 2800);
}

function scrollToOptin() {
  const box = document.getElementById("optin");
  box?.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(highlightOptin, 350);
}

document.querySelectorAll("[data-scroll-optin]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    scrollToOptin();
  });
});

function initStickyCta() {
  const sticky = document.getElementById("stickyCta");
  const firstPage = document.getElementById("firstPage");
  if (!sticky || !firstPage) return;

  function sync() {
    const pastFirst = window.scrollY > firstPage.offsetTop + firstPage.offsetHeight - 48;
    sticky.classList.toggle("visible", pastFirst);
    sticky.setAttribute("aria-hidden", pastFirst ? "false" : "true");
    document.documentElement.style.setProperty(
      "--sa-sticky-h",
      pastFirst ? `${sticky.offsetHeight}px` : "0px"
    );
  }

  window.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  sync();
}

function initReaderCarousel(slides) {
  const slideEl = document.getElementById("carouselSlide");
  const captionEl = document.getElementById("carouselCaption");
  const counterEl = document.getElementById("carouselCounter");
  const dotsEl = document.getElementById("carouselDots");
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");
  const profileLinks = document.querySelectorAll(".js-ig-profile");
  profileLinks.forEach((link) => { link.href = INSTAGRAM_PROFILE_URL; });

  if (!slideEl || slides.length === 0) return;

  let index = 0;

  function renderPlaceholder(caption) {
    return `
      <div class="reader-carousel__slide--placeholder">
        <span class="ph-tag">Book Lovers 📚</span>
        <span class="ph-icon" aria-hidden="true">📖</span>
        <span class="ph-label">${caption}</span>
      </div>
    `;
  }

  function renderSlide(i) {
    const slide = slides[i];
    slideEl.innerHTML = "";

    if (slide.hasImage) {
      const img = document.createElement("img");
      img.src = slide.src;
      img.alt = slide.caption || "Reader holding A Secret Attraction";
      img.loading = i === 0 ? "eager" : "lazy";
      img.addEventListener("error", () => {
        slide.hasImage = false;
        renderSlide(i);
      });
      slideEl.appendChild(img);
    } else {
      slideEl.innerHTML = renderPlaceholder(slide.caption);
    }

    if (captionEl) captionEl.textContent = slide.caption;
    if (counterEl) counterEl.textContent = `${i + 1} / ${slides.length}`;

    dotsEl?.querySelectorAll(".reader-carousel__dot").forEach((dot, di) => {
      dot.classList.toggle("is-active", di === i);
      dot.setAttribute("aria-selected", di === i ? "true" : "false");
    });
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    renderSlide(index);
  }

  dotsEl.innerHTML = "";
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "reader-carousel__dot" + (i === 0 ? " is-active" : "");
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Photo ${i + 1}`);
    dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
    dot.addEventListener("click", () => goTo(i));
    dotsEl.appendChild(dot);
  });

  prevBtn?.addEventListener("click", () => goTo(index - 1));
  nextBtn?.addEventListener("click", () => goTo(index + 1));

  document.addEventListener("keydown", (e) => {
    if (!document.getElementById("readerCarousel")) return;
    if (e.key === "ArrowLeft") goTo(index - 1);
    if (e.key === "ArrowRight") goTo(index + 1);
  });

  let touchStartX = 0;
  slideEl.parentElement?.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  slideEl.parentElement?.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? index - 1 : index + 1);
  }, { passive: true });

  renderSlide(0);
}

async function photoExists(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function initTestimonials() {
  const slides = [];
  for (const photo of TESTIMONIAL_PHOTOS) {
    const hasImage = await photoExists(photo.src);
    slides.push({ ...photo, hasImage });
  }
  initReaderCarousel(slides);
}

async function addLead(name, email) {
  await addDoc(collection(db, "leads"), {
    lead: { name, email },
  });
}

function wireForm(form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = form.querySelector('[name="name"]');
    const emailInput = form.querySelector('[name="email"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !email) {
      alert("Please enter your name and email.");
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.textContent = "Sending…";

    try {
      await addLead(name, email);
      if (typeof fbq === "function") fbq("track", "Lead");
      window.location.href = "secretAttractionViews/downloadPreview.html";
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

document.querySelectorAll(".optin-form").forEach(wireForm);
initStickyCta();
initTestimonials();

export { AMAZON_URL, scrollToOptin };
