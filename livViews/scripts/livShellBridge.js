/**
 * When Liv tabs load inside primaryView iframes, report content height so the
 * outer shell can scroll once (no nested iframe scrollbar).
 */
(function () {
  if (window.parent === window) return;

  document.documentElement.classList.add("liv-in-shell");

  var modalDepth = 0;

  function measureHeight() {
    var doc = document.documentElement;
    var body = document.body;
    if (!body) return 0;
    return Math.ceil(
      Math.max(
        doc.scrollHeight,
        doc.offsetHeight,
        body.scrollHeight,
        body.offsetHeight
      )
    );
  }

  function reportHeight() {
    if (modalDepth > 0) return;
    try {
      window.parent.postMessage(
        { type: "liv-frame-height", height: measureHeight() },
        "*"
      );
    } catch (e) {}
  }

  function reportFab(visible) {
    try {
      window.parent.postMessage(
        { type: "liv-library-fab", visible: !!visible },
        "*"
      );
    } catch (e) {}
  }

  function setModalOpen(open) {
    if (open) {
      modalDepth += 1;
      if (modalDepth === 1) {
        document.documentElement.classList.add("liv-viewport-lock");
        try {
          window.parent.postMessage({ type: "liv-shell-modal", open: true }, "*");
        } catch (e) {}
      }
    } else {
      modalDepth = Math.max(0, modalDepth - 1);
      if (modalDepth === 0) {
        document.documentElement.classList.remove("liv-viewport-lock");
        try {
          window.parent.postMessage({ type: "liv-shell-modal", open: false }, "*");
        } catch (e) {}
        reportHeight();
      }
    }
  }

  window.livReportShellHeight = reportHeight;
  window.livReportShellFab = reportFab;
  window.livShellModalOpen = function () {
    setModalOpen(true);
  };
  window.livShellModalClose = function () {
    setModalOpen(false);
  };

  function start() {
    reportHeight();
    if (typeof ResizeObserver !== "undefined" && document.body) {
      var ro = new ResizeObserver(function () {
        reportHeight();
      });
      ro.observe(document.body);
    }
    window.addEventListener("load", reportHeight);
    window.addEventListener("resize", reportHeight);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
