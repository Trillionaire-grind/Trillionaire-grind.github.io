/**
 * Send India visitors from /fatLoss.html to /fatLoss-in.html.
 * Instant check: Asia/Kolkata timezone.
 * Backup: IP country when timezone is not set to India.
 * Override: ?geo=in or ?geo=us (used by the US / India switch)
 */
(function () {
  var STORAGE_KEY = "flGeo";
  var isIndiaPage = /fatLoss-in\.html$/i.test(location.pathname);
  var isUsPage = /\/fatLoss\.html$/i.test(location.pathname);

  function queryGeo() {
    try {
      return new URLSearchParams(location.search).get("geo");
    } catch (e) {
      return null;
    }
  }

  function remember(value) {
    try {
      sessionStorage.setItem(STORAGE_KEY, value);
    } catch (e) {}
  }

  function remembered() {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function withGeo(path, geo) {
    var url = new URL(path, location.href);
    url.searchParams.set("geo", geo);
    return url.pathname + url.search + (location.hash || "");
  }

  function goIndia() {
    if (isIndiaPage) return;
    location.replace(withGeo("fatLoss-in.html", "in"));
  }

  function goUS() {
    if (isUsPage) return;
    location.replace(withGeo("fatLoss.html", "us"));
  }

  function timezoneIsIndia() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      return tz === "Asia/Kolkata" || tz === "Asia/Calcutta";
    } catch (e) {
      return false;
    }
  }

  var forced = queryGeo();
  if (forced === "us") {
    remember("us");
    goUS();
    return;
  }
  if (forced === "in") {
    remember("in");
    goIndia();
    return;
  }

  if (isIndiaPage) {
    remember("in");
    return;
  }

  var stored = remembered();
  if (stored === "us") return;
  if (stored === "in") {
    goIndia();
    return;
  }

  if (timezoneIsIndia()) {
    remember("in");
    goIndia();
    return;
  }

  fetch("https://ipwho.is/?fields=country_code,success")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (queryGeo() === "us" || remembered() === "us") return;
      if (data && data.success !== false && data.country_code === "IN") {
        remember("in");
        goIndia();
      }
    })
    .catch(function () {});
})();
