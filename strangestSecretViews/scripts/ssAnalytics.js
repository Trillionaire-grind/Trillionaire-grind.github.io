/**
 * GA4 for The Strangest Secret — page views + theme-store funnel events.
 * Set window.SS_GA_MEASUREMENT_ID to override (default: naples-sunrise-bay web stream).
 */
(function (global) {
  var DEFAULT_ID = "G-L0QCNW7C6W";

  function isLocalDev() {
    var host = global.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  }

  function measurementId() {
    return (global.SS_GA_MEASUREMENT_ID || DEFAULT_ID).trim();
  }

  function initSsAnalytics() {
    if (global.__ssGaLoaded || isLocalDev()) return false;
    var id = measurementId();
    if (!id) return false;

    global.__ssGaLoaded = true;
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(script);

    global.dataLayer = global.dataLayer || [];
    function gtag() {
      global.dataLayer.push(arguments);
    }
    global.gtag = gtag;
    gtag("js", new Date());
    gtag("config", id, { send_page_view: false });
    return true;
  }

  function trackSsEvent(name, params) {
    if (typeof global.gtag !== "function") return;
    global.gtag("event", name, params || {});
  }

  function trackSsPageView(path, title) {
    trackSsEvent("page_view", {
      page_path: path,
      page_title: title || document.title,
    });
  }

  global.ssAnalytics = {
    init: initSsAnalytics,
    track: trackSsEvent,
    pageView: trackSsPageView,
  };

  initSsAnalytics();
})();
