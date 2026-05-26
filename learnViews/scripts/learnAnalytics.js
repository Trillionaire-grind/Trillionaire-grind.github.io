/** Optional GA4 — set window.LEARN_GA_MEASUREMENT_ID before loading this script */
export function initLearnAnalytics() {
  const id = window.LEARN_GA_MEASUREMENT_ID;
  if (!id || window.__learnGaLoaded) return;
  window.__learnGaLoaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id, { send_page_view: false });
}

export function trackLearnEvent(name, params = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

export function trackLearnPageView(path, title) {
  trackLearnEvent("page_view", { page_path: path, page_title: title });
}
