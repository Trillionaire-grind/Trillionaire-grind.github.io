/**
 * Arcadia Signature: commission certificate.
 */
(function () {
  const STORAGE = {
    certSeen: "ssArcadiaCertSeen",
    commissionId: "ssArcadiaCommissionId",
    showCert: "ssShowArcadiaCert",
  };

  function isArcadiaUnlocked() {
    try {
      const raw = localStorage.getItem("ssUnlockedThemes");
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) && list.includes("arcadia");
    } catch (_) {
      return false;
    }
  }

  function getCommissionId() {
    let id = localStorage.getItem(STORAGE.commissionId);
    if (!id) {
      const n = Math.floor(1000 + Math.random() * 9000);
      id = `AD-${new Date().getFullYear()}-${n}`;
      localStorage.setItem(STORAGE.commissionId, id);
    }
    return id;
  }

  function formatCommissionDate() {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function closeCertificate() {
    const modal = document.getElementById("ssArcadiaCert");
    modal?.classList.remove("is-open");
    document.body.classList.remove("ss-cert-open");
  }

  function showCertificate({ fromPurchase = false } = {}) {
    if (!isArcadiaUnlocked()) return;
    if (!fromPurchase && localStorage.getItem(STORAGE.certSeen) === "1") return;

    const modal = document.getElementById("ssArcadiaCert");
    const idEl = document.getElementById("ssArcadiaCertId");
    const dateEl = document.getElementById("ssArcadiaCertDate");
    if (!modal) return;

    if (idEl) idEl.textContent = getCommissionId();
    if (dateEl) dateEl.textContent = formatCommissionDate();

    modal.classList.add("is-open");
    document.body.classList.add("ss-cert-open");
  }

  function dismissCertificate() {
    localStorage.setItem(STORAGE.certSeen, "1");
    closeCertificate();

    if (typeof applyTheme === "function") {
      applyTheme("arcadia", { openStoreOnLock: false });
    }
  }

  function initArcadiaExperience() {
    const dismissBtn = document.getElementById("ssArcadiaCertDismiss");
    const certModal = document.getElementById("ssArcadiaCert");

    dismissBtn?.addEventListener("click", dismissCertificate);
    certModal?.addEventListener("click", (event) => {
      if (event.target === certModal) dismissCertificate();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && certModal?.classList.contains("is-open")) {
        dismissCertificate();
      }
    });

    document.addEventListener("ss-show-arcadia-cert", () => {
      showCertificate({ fromPurchase: true });
    });

    if (sessionStorage.getItem(STORAGE.showCert) === "1") {
      sessionStorage.removeItem(STORAGE.showCert);
      window.setTimeout(() => showCertificate({ fromPurchase: true }), 400);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initArcadiaExperience);
  } else {
    initArcadiaExperience();
  }
})();
