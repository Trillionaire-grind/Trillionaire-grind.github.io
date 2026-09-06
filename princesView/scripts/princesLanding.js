(function () {
  var CATALOG = window.PRINCES_CATALOG;
  var STORE = window.PRINCES_STORE;
  var AUTH = window.PRINCES_AUTH;

  var accountModal = document.getElementById("prAccountModal");
  var loginModal = document.getElementById("prLoginModal");
  var accountForm = document.getElementById("prAccountForm");
  var loginForm = document.getElementById("prLoginForm");
  var accountError = document.getElementById("prAccountError");
  var loginError = document.getElementById("prLoginError");
  var testBtn = document.getElementById("prTestModeBtn");
  var testPanel = document.getElementById("prTestPanel");
  var cta = document.getElementById("prCta");

  function openModal(el) {
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
  }

  function closeModal(el) {
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
  }

  function syncBrand() {
    var name = STORE.getBrandName();
    var logo = STORE.getLogo();
    document.querySelectorAll("[data-pr-brand]").forEach(function (el) {
      el.textContent = name;
    });
    document.querySelectorAll("[data-pr-logo]").forEach(function (el) {
      el.src = logo;
    });
    document.title = name + " · Your first kingdom";
  }

  function renderTestPanel() {
    var on = STORE.isTestMode();
    testBtn.textContent = on ? "Testing mode is on" : "Testing mode";
    testPanel.hidden = !on;
    if (!on) return;

    var names = document.getElementById("prNameChoices");
    names.innerHTML = CATALOG.names.map(function (item) {
      var active = STORE.getBrandName() === item.name ? " is-on" : "";
      return '<button type="button" class="pr-choice' + active + '" data-name="' + item.name + '"><strong>' + item.name + "</strong><span>" + item.note + "</span></button>";
    }).join("");

    var logos = document.getElementById("prLogoChoices");
    var files = [
      "princesView/assets/logos/princes-logo-shield.png",
      "princesView/assets/logos/princes-logo-ten.png",
      "princesView/assets/logos/princes-logo-lion.png",
      "princesView/assets/logos/princes-logo-p.png",
    ];
    logos.innerHTML = files.map(function (src) {
      var active = STORE.getLogo() === src ? " is-on" : "";
      return '<button type="button" class="pr-choice' + active + '" data-logo="' + src + '"><img src="' + src + '" alt="Logo option"></button>';
    }).join("");

    var offers = document.getElementById("prMidOffers");
    offers.innerHTML = CATALOG.tiers.map(function (item) {
      return '<div class="pr-offer"><strong>' + item.name + " · " + item.label + "</strong><span>" + item.perks + "</span></div>";
    }).join("");

    var manual = CATALOG.ranksManual;
    var manualEl = document.getElementById("prRankManual");
    manualEl.innerHTML =
      "<p>" + manual.intro + "</p>" +
      manual.layers.map(function (layer) {
        return '<div class="pr-offer"><strong>' + layer.name + "</strong><span>" + layer.ranks + "</span><span>" + layer.job + "</span></div>";
      }).join("") +
      "<h3>Seats and ministers</h3>" +
      "<ul>" + manual.seats.map(function (line) { return "<li>" + line + "</li>"; }).join("") + "</ul>" +
      "<h3>Read these</h3>" +
      "<ul>" + manual.reading.map(function (book) {
        return "<li><strong>" + book.title + "</strong>. " + book.note + "</li>";
      }).join("") + "</ul>";

    names.querySelectorAll("[data-name]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        STORE.setBrandName(btn.dataset.name);
        syncBrand();
        renderTestPanel();
      });
    });
    logos.querySelectorAll("[data-logo]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        STORE.setLogo(btn.dataset.logo);
        syncBrand();
        renderTestPanel();
      });
    });
  }

  function afterAccount() {
    if (STORE.isTestMode()) {
      AUTH.grantTier("ticket");
      window.location.href = "princes.html#learn";
      return;
    }
    window.location.href = "princes.html#pay";
  }

  cta.addEventListener("click", function () {
    openModal(accountModal);
    accountModal.querySelector("input")?.focus();
  });

  document.getElementById("prOpenLogin").addEventListener("click", function () {
    openModal(loginModal);
  });

  document.querySelectorAll("[data-pr-close]").forEach(function (el) {
    el.addEventListener("click", function () {
      closeModal(el.closest(".pr-modal"));
    });
  });

  testBtn.addEventListener("click", function () {
    STORE.setTestMode(!STORE.isTestMode());
    renderTestPanel();
  });

  accountForm.addEventListener("submit", function (event) {
    event.preventDefault();
    accountError.textContent = "";
    var data = new FormData(accountForm);
    try {
      AUTH.register({
        firstName: data.get("firstName"),
        lastName: data.get("lastName"),
        age: data.get("age"),
        gender: data.get("gender"),
        email: data.get("email"),
        password: data.get("password"),
      });
      afterAccount();
    } catch (err) {
      accountError.textContent = err.message || "Could not create the account.";
    }
  });

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    loginError.textContent = "";
    var data = new FormData(loginForm);
    try {
      AUTH.login(data.get("email"), data.get("password"));
      window.location.href = "princes.html#learn";
    } catch (err) {
      loginError.textContent = err.message || "Could not sign in.";
    }
  });

  syncBrand();
  renderTestPanel();
})();
