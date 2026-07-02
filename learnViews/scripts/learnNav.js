export const LEARN_APP_VERSION = "0.2.9.5";

export const PAGE_INDEX = {
  home: 0,
  notes: 1,
  speak: 2,
  offers: 3,
  kotfe: 4,
  projects: 5,
};

export const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "notes", label: "Notes" },
  { id: "speak", label: "Talk to me" },
  { id: "offers", label: "Offers" },
  { id: "kotfe", label: "Mangé Lakay" },
  { id: "projects", label: "Projects" },
];

export const EXTERNAL_NAV_ITEMS = [
  {
    href: "/strangestSecret.html",
    label: "Strangest Secret",
    external: true,
  },
];

export const LEARN_NAV_LOGO_SRC = "../generalAssets/logo_ks.png";
export const LEARN_NAV_BRAND_LABEL = "Képler Siguineau";

const MOBILE_NAV_BREAKPOINT = 768;

export function goToPage(pageId) {
  if (!Object.prototype.hasOwnProperty.call(PAGE_INDEX, pageId)) return;

  if (window.parent !== window && typeof window.parent.changeTo === "function") {
    window.parent.changeTo(pageId);
    return;
  }

  window.location.href = `learn.html#${pageId}`;
}

const NOTES_GENRES = ["apps", "business", "city"];

export function goToNotesGenre(genre) {
  if (!NOTES_GENRES.includes(genre)) return;
  try {
    sessionStorage.setItem("learnNotesGenre", genre);
  } catch (_) {
    /* ignore */
  }
  goToPage("notes");
}

export function wireLearnAppNav(nav) {
  if (!nav) return { closeMenu() {} };

  const toggle = nav.querySelector(".learn-app-nav__toggle");
  const backdrop = nav.querySelector(".learn-app-nav__backdrop");
  const links = nav.querySelectorAll(".learn-app-nav__links a");

  function closeMenu() {
    nav.classList.remove("learn-app-nav--open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Open menu");
    backdrop?.setAttribute("hidden", "");
  }

  function openMenu() {
    nav.classList.add("learn-app-nav--open");
    toggle?.setAttribute("aria-expanded", "true");
    toggle?.setAttribute("aria-label", "Close menu");
    backdrop?.removeAttribute("hidden");
  }

  toggle?.addEventListener("click", () => {
    if (nav.classList.contains("learn-app-nav--open")) closeMenu();
    else openMenu();
  });

  backdrop?.addEventListener("click", closeMenu);

  links.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > MOBILE_NAV_BREAKPOINT) closeMenu();
  });

  return { closeMenu };
}

export function initLearnNav(activeId) {
  if (window.parent !== window && typeof window.parent.changeTo === "function") {
    return;
  }

  if (document.getElementById("learnAppNav")) return;

  if (!document.querySelector('link[href="assets/learnNav.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "assets/learnNav.css";
    document.head.appendChild(link);
  }

  const nav = document.createElement("nav");
  nav.id = "learnAppNav";
  nav.className = "learn-app-nav";
  nav.setAttribute("aria-label", "Main");

  const inner = document.createElement("div");
  inner.className = "learn-app-nav__inner";

  const brand = document.createElement("a");
  brand.className = "learn-app-nav__brand";
  brand.href = "learn.html#home";
  brand.innerHTML = `
    <img class="learn-app-nav__logo" src="${LEARN_NAV_LOGO_SRC}" alt="" width="32" height="32" />
    <span class="learn-app-nav__brand-text">${LEARN_NAV_BRAND_LABEL}</span>
  `;
  brand.addEventListener("click", (event) => {
    event.preventDefault();
    goToPage("home");
  });

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "learn-app-nav__toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "learnAppNavMenu");
  toggle.setAttribute("aria-label", "Open menu");
  toggle.innerHTML = `<span class="learn-app-nav__toggle-bars" aria-hidden="true"></span>`;

  const links = document.createElement("div");
  links.id = "learnAppNavMenu";
  links.className = "learn-app-nav__links";

  NAV_ITEMS.forEach((item) => {
    const a = document.createElement("a");
    a.href = `learn.html#${item.id}`;
    a.dataset.page = item.id;
    a.textContent = item.label;
    if (item.id === activeId) a.classList.add("is-active");
    a.addEventListener("click", (event) => {
      event.preventDefault();
      goToPage(item.id);
    });
    links.appendChild(a);
  });

  EXTERNAL_NAV_ITEMS.forEach((item) => {
    const a = document.createElement("a");
    a.href = item.href;
    a.textContent = item.label;
    if (item.external) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    links.appendChild(a);
  });

  const backdrop = document.createElement("div");
  backdrop.className = "learn-app-nav__backdrop";
  backdrop.hidden = true;

  inner.appendChild(brand);
  inner.appendChild(toggle);
  inner.appendChild(links);
  nav.appendChild(inner);
  nav.appendChild(backdrop);
  document.body.prepend(nav);
  document.body.classList.add("learn-nav-active");
  wireLearnAppNav(nav);
}
