/** Minimal GA for themeUnlocked.html (post-checkout). */
(function (global) {
  var DEFAULT_ID = "G-L0QCNW7C6W";

  function isLocalDev() {
    var host = global.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  }

  function init() {
    if (global.__ssGaLoaded || isLocalDev()) return;
    var id = (global.SS_GA_MEASUREMENT_ID || DEFAULT_ID).trim();
    if (!id) return;

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
  }

  global.ssTrackUnlock = function (unlockId, applied) {
    if (typeof global.gtag !== "function") return;
    global.gtag("event", "theme_unlocked", {
      unlock_id: unlockId || "",
      applied: applied ? "yes" : "no",
      page_path: "/strangestSecretViews/themeUnlocked.html",
    });
  };

  init();
})();
