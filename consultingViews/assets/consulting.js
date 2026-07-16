const CALENDLY_URL =
  "https://calendly.com/buildingwithkepler?hide_gdpr_banner=1&background_color=ffffff";

function buildBookingModal() {
  const modal = document.createElement("div");
  modal.className = "consult-modal";
  modal.id = "consultBookingModal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="consult-modal__backdrop" data-consult-close></div>
    <section class="consult-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="consultModalTitle">
      <div class="consult-modal__header">
        <h2 id="consultModalTitle">Pick a time to talk with Képler</h2>
        <button class="consult-modal__close" type="button" aria-label="Close booking calendar" data-consult-close>&times;</button>
      </div>
      <iframe
        class="consult-modal__frame"
        title="Book a call with Képler"
        data-src="${CALENDLY_URL}"
        loading="lazy"
      ></iframe>
    </section>
  `;
  document.body.appendChild(modal);
  return modal;
}

function buildStickyCta() {
  const sticky = document.createElement("div");
  sticky.className = "consult-sticky-cta";
  sticky.setAttribute("aria-hidden", "true");
  sticky.innerHTML = `
    <a class="consult-cta" href="${CALENDLY_URL}" data-consult-book>
      Book your free call
      <span>Pick a time without leaving this page</span>
    </a>
  `;
  document.body.appendChild(sticky);
  return sticky;
}

function initStickyCta(sticky) {
  const showAfter = Math.max(520, window.innerHeight * 0.8);

  function updateStickyCta() {
    const visible = window.scrollY > showAfter;
    sticky.classList.toggle("is-visible", visible);
    sticky.setAttribute("aria-hidden", visible ? "false" : "true");
  }

  window.addEventListener("scroll", updateStickyCta, { passive: true });
  updateStickyCta();
}

function initBooking() {
  const modal = buildBookingModal();
  const frame = modal.querySelector(".consult-modal__frame");
  const closeButton = modal.querySelector(".consult-modal__close");
  let lastTrigger = null;

  function openModal(trigger) {
    lastTrigger = trigger || null;
    if (!frame.src) frame.src = frame.dataset.src;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("consult-modal-open");
    closeButton.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("consult-modal-open");
    lastTrigger?.focus();
  }

  document.querySelectorAll("[data-consult-book]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(trigger);
    });
  });

  modal.querySelectorAll("[data-consult-close]").forEach((control) => {
    control.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
}

if (!document.body.hasAttribute("data-consult-no-sticky")) {
  const stickyCta = buildStickyCta();
  initStickyCta(stickyCta);
}
initBooking();
