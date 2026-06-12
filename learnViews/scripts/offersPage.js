import { OFFERS, OFFER_LANES, OFFER_SECTIONS } from "./offersCatalog.js";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderVisual(visual) {
  if (!visual) return "";

  if (visual.kind === "funnel") {
    return `
      <div class="offer-visual offer-visual--funnel" aria-hidden="true">
        <img src="${escapeHtml(visual.src)}" alt="">
        <span>${escapeHtml(visual.caption || "")}</span>
      </div>`;
  }

  if (visual.kind === "cover") {
    return `
      <div class="offer-visual offer-visual--cover">
        <img src="${escapeHtml(visual.src)}" alt="${escapeHtml(visual.alt || "")}">
      </div>`;
  }

  if (visual.kind === "photo") {
    return `
      <div class="offer-visual offer-visual--photo">
        <img src="${escapeHtml(visual.src)}" alt="${escapeHtml(visual.alt || "")}">
      </div>`;
  }

  return `
    <div class="offer-visual offer-visual--icon">
      <img src="${escapeHtml(visual.src)}" alt="${escapeHtml(visual.alt || "")}">
    </div>`;
}

function renderSplit(split) {
  if (!split?.length) return "";
  return `
    <div class="offer-split">
      ${split
        .map(
          (box) => `
        <div class="offer-split-box">
          <h4>${escapeHtml(box.title)}</h4>
          <p>${escapeHtml(box.body)}</p>
        </div>`
        )
        .join("")}
    </div>`;
}

function renderActions(actions) {
  return actions
    .map((action) => {
      const cls = action.primary ? "btn-primary-offer" : "btn-secondary-offer";
      if (action.nav) {
        return `<a class="${cls}" href="learn.html#${escapeHtml(action.nav)}" data-offers-nav="${escapeHtml(action.nav)}">${escapeHtml(action.label)}</a>`;
      }
      const external = action.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a class="${cls}" href="${escapeHtml(action.href)}"${external}>${escapeHtml(action.label)}</a>`;
    })
    .join("");
}

function renderOfferCard(offer) {
  const leads = (offer.leads || [])
    .map((p) => `<p class="offer-lead">${escapeHtml(p)}</p>`)
    .join("");
  const bullets = (offer.bullets || []).length
    ? `<ul class="offer-list">${offer.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
    : "";
  const note = offer.note ? `<span class="offer-note">${escapeHtml(offer.note)}</span>` : "";

  return `
    <article class="offer-card offer-card--${escapeHtml(offer.lane)}" data-offer-id="${escapeHtml(offer.id)}">
      <div class="offer-hero">
        <div class="offer-copy">
          <p class="offer-type">${escapeHtml(offer.type)}</p>
          <h3>${escapeHtml(offer.title)}</h3>
          <p class="offer-subtitle">${escapeHtml(offer.subtitle)}</p>
          ${leads}
          ${renderSplit(offer.split)}
          ${bullets}
          <div class="offer-actions">
            ${renderActions(offer.actions || [])}
            ${note}
          </div>
        </div>
        ${renderVisual(offer.visual)}
      </div>
    </article>`;
}

function renderSection(lane) {
  const meta = OFFER_SECTIONS[lane];
  const cards = OFFERS.filter((o) => o.lane === lane).map(renderOfferCard).join("\n");
  if (!cards) return "";

  return `
    <section class="offers-section offers-section--${lane}" aria-labelledby="${lane}-heading">
      <div class="offers-section-head">
        <h2 id="${lane}-heading">${escapeHtml(meta.heading)}</h2>
        <p>${escapeHtml(meta.description)}</p>
      </div>
      <div class="offers-stack">${cards}</div>
    </section>`;
}

export function renderOffersPage(root) {
  if (!root) return;

  const laneTabs = OFFER_LANES.map((lane, i) => {
    const dot = lane.dotClass
      ? `<span class="offers-lane-dot ${lane.dotClass}" aria-hidden="true"></span>`
      : "";
    return `
      <button type="button" class="offers-lane-pill ${lane.pillClass}${i === 0 ? " is-active" : ""}" role="tab" aria-selected="${i === 0 ? "true" : "false"}" data-lane="${lane.id}">
        ${dot}${escapeHtml(lane.label)}
      </button>`;
  }).join("");

  root.innerHTML = `
    <p class="offers-intro">
      This site is mostly about <strong>education</strong> — notes on apps, business, and cities. Offers are different:
      some help you <strong>earn</strong>, others are purely for <strong>enjoyment</strong>. Use the tabs below to focus on one lane.
    </p>

    <div class="offers-lanes" role="tablist" aria-label="Offer types">
      ${laneTabs}
    </div>

    ${renderSection("earn")}
    ${renderSection("fun")}

    <nav class="offers-links" aria-label="Related pages">
      <a href="learn.html#notes" data-offers-nav="notes">Free education — notes</a>
      <a href="learn.html#speak" data-offers-nav="speak">Talk to me</a>
      <a href="learn.html#kotfe" data-offers-nav="kotfe">Mangé Lakay project</a>
    </nav>`;
}

export function wireOffersPage(root, { goToPage }) {
  const laneTabs = root.querySelectorAll("[data-lane]");

  laneTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const lane = tab.dataset.lane;
      root.dataset.filter = lane;

      laneTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
    });
  });

  root.querySelectorAll("[data-offers-nav]").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      goToPage(el.dataset.offersNav);
    });
  });
}
