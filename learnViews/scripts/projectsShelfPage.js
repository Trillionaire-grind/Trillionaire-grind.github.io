import { goToPage } from "./learnNav.js";
import { PROJECT_LANES, PROJECTS } from "./projectsShelfCatalog.js";

const LANE_LABELS = {
  product: "Product",
  client: "Client",
  haiti: "Haiti",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function openProject(href) {
  if (!href) return;
  if (href.includes("learn.html#")) {
    goToPage(href.split("#")[1]);
    return;
  }
  if (/^https?:/i.test(href)) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  window.top.location.href = href;
}

export function initProjectsShelf(root) {
  if (!root) return;

  let activeLane = "all";
  let lastTrigger = null;

  root.innerHTML = `
    <p class="shelf-lead">
      Work I have shipped: products, client sites, and Haiti projects. Read more for what it does and the tech behind it. Open a project to use it.
    </p>
    <div class="shelf-filters" id="shelfFilters" role="tablist" aria-label="Project type"></div>
    <div class="shelf-grid" id="shelfGrid"></div>
    <div class="shelf-modal" id="shelfModal" aria-hidden="true">
      <div class="shelf-modal-backdrop" data-shelf-close></div>
      <div class="shelf-modal-panel" role="dialog" aria-modal="true" aria-labelledby="shelfModalTitle">
        <button type="button" class="shelf-modal-close" aria-label="Close" data-shelf-close>&times;</button>
        <h2 id="shelfModalTitle"></h2>
        <p class="shelf-modal-more" id="shelfModalMore"></p>
        <h3>Tech stack</h3>
        <ul class="shelf-stack" id="shelfModalStack"></ul>
        <button type="button" class="shelf-modal-cta" id="shelfModalOpen">Open project</button>
      </div>
    </div>`;

  const filtersEl = root.querySelector("#shelfFilters");
  const gridEl = root.querySelector("#shelfGrid");
  const modal = root.querySelector("#shelfModal");
  const titleEl = root.querySelector("#shelfModalTitle");
  const moreEl = root.querySelector("#shelfModalMore");
  const stackEl = root.querySelector("#shelfModalStack");
  const openEl = root.querySelector("#shelfModalOpen");

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-shelf-modal-open");
    lastTrigger?.focus();
  }

  function openModal(project, trigger) {
    lastTrigger = trigger || null;
    titleEl.textContent = project.name;
    moreEl.textContent = project.more || project.blurb;
    stackEl.innerHTML = (project.stack || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    openEl.onclick = () => {
      closeModal();
      openProject(project.href);
    };
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-shelf-modal-open");
    modal.querySelector(".shelf-modal-close")?.focus();
  }

  function renderFilters() {
    filtersEl.innerHTML = PROJECT_LANES.map((lane) => `
      <button type="button" class="shelf-filter${lane.id === activeLane ? " is-active" : ""}" data-lane="${lane.id}">
        ${escapeHtml(lane.label)}
      </button>
    `).join("");

    filtersEl.querySelectorAll("[data-lane]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeLane = btn.dataset.lane;
        renderFilters();
        renderCards();
      });
    });
  }

  function renderCards() {
    const list = activeLane === "all"
      ? PROJECTS
      : PROJECTS.filter((item) => item.lane === activeLane);

    if (!list.length) {
      gridEl.innerHTML = `<p class="shelf-empty">Nothing in this lane yet.</p>`;
      return;
    }

    gridEl.innerHTML = list.map((item) => `
      <article class="shelf-card">
        <div class="shelf-card-top">
          <h2>${escapeHtml(item.name)}</h2>
          <span class="shelf-pill shelf-pill--${escapeHtml(item.lane)}">${escapeHtml(LANE_LABELS[item.lane])}</span>
        </div>
        <p>${escapeHtml(item.blurb)}</p>
        <div class="shelf-card-actions">
          <button type="button" class="shelf-more" data-more="${escapeHtml(item.id)}">Read more</button>
          <button type="button" class="shelf-open" data-open="${escapeHtml(item.id)}">Open</button>
        </div>
      </article>
    `).join("");

    gridEl.querySelectorAll("[data-more]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const project = PROJECTS.find((item) => item.id === btn.dataset.more);
        if (project) openModal(project, btn);
      });
    });

    gridEl.querySelectorAll("[data-open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const project = PROJECTS.find((item) => item.id === btn.dataset.open);
        if (project) openProject(project.href);
      });
    });
  }

  modal.querySelectorAll("[data-shelf-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  renderFilters();
  renderCards();
}
