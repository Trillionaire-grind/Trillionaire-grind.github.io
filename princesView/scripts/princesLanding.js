(function () {
  var CATALOG = window.PRINCES_CATALOG;
  var STORE = window.PRINCES_STORE;
  var AUTH = window.PRINCES_AUTH;
  var sales = CATALOG.sales || {};
  var brand = CATALOG.brand || "Princes";

  var accountModal = document.getElementById("prAccountModal");
  var loginModal = document.getElementById("prLoginModal");
  var accountForm = document.getElementById("prAccountForm");
  var loginForm = document.getElementById("prLoginForm");
  var accountError = document.getElementById("prAccountError");
  var loginError = document.getElementById("prLoginError");
  var testBtn = document.getElementById("prTestModeBtn");
  var ageSelect = document.getElementById("prAgeSelect");

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openModal(el) {
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
  }

  function closeModal(el) {
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
  }

  function applyOwnerTheme() {
    var colors = CATALOG.brandColors || {};
    var root = document.documentElement;
    if (colors.navy) root.style.setProperty("--pr-navy", colors.navy);
    if (colors.gold) root.style.setProperty("--pr-gold", colors.gold);
    if (colors.cream) root.style.setProperty("--pr-cream", colors.cream);
    var icon = document.querySelector('link[rel="icon"]');
    if (icon && (CATALOG.favicon || CATALOG.workingLogo)) {
      icon.href = CATALOG.favicon || CATALOG.workingLogo;
    }
    if (colors.navy) {
      var theme = document.querySelector('meta[name="theme-color"]');
      if (theme) theme.setAttribute("content", colors.navy);
    }
  }

  function vslHtml() {
    var vsl = CATALOG.vsl || {};
    var url = String(vsl.url || "").trim();
    if (!url) {
      return '<div class="pr-vsl" role="region" aria-label="Video sales letter">' +
        esc(vsl.placeholder || "VSL goes here.") + "</div>";
    }
    var yt = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/);
    if (yt) {
      return '<div class="pr-vsl pr-vsl--frame" role="region" aria-label="Video sales letter">' +
        '<iframe src="https://www.youtube.com/embed/' + esc(yt[1]) + '" title="VSL" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
    }
    if (/\.mp4(\?|$)/i.test(url)) {
      return '<div class="pr-vsl pr-vsl--frame" role="region" aria-label="Video sales letter">' +
        '<video src="' + esc(url) + '" controls playsinline></video></div>';
    }
    return '<div class="pr-vsl pr-vsl--frame" role="region" aria-label="Video sales letter">' +
      '<iframe src="' + esc(url) + '" title="VSL" allowfullscreen></iframe></div>';
  }

  function renderSales() {
    var hero = document.getElementById("prHero");
    if (!hero) return;
    var questions = (sales.questions || []).map(function (line) {
      return "<li>" + esc(line) + "</li>";
    }).join("");
    var follow = (sales.followUp || []).map(function (line) {
      return "<span>" + esc(line) + "</span>";
    }).join(" ");
    var cta = esc(sales.cta || "Get in");
    var letter = (sales.letter || []).map(function (block) {
      return "<h2>" + esc(block.heading) + "</h2>" +
        (block.paragraphs || []).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
        '<button type="button" class="pr-cta" data-open-account>' + cta + "</button>";
    }).join("");
    hero.innerHTML =
      '<p class="pr-kicker">' + esc(sales.kicker || CATALOG.tagline || "") + "</p>" +
      '<h1 class="pr-vsl-ask">' + esc(sales.headline || "") + "</h1>" +
      '<ol class="pr-yes">' + questions + "</ol>" +
      '<p class="pr-vsl-follow">' + follow + "</p>" +
      vslHtml() +
      '<button type="button" class="pr-cta" data-open-account>' + cta + "</button>" +
      '<p class="pr-dollar">' + esc(sales.ticketNote || "") + "</p>";
    var letterEl = document.querySelector(".pr-letter-sales");
    if (letterEl) letterEl.innerHTML = letter;
    document.querySelectorAll("[data-open-account]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal(accountModal);
        var first = accountModal.querySelector("input");
        if (first) first.focus();
      });
    });
  }

  function fillAges() {
    var html = "";
    var age;
    for (age = 18; age <= 55; age += 1) {
      html += '<option value="' + age + '"' + (age === 22 ? " selected" : "") + ">" + age + "</option>";
    }
    ageSelect.innerHTML = html;
  }

  function syncBrand() {
    document.querySelectorAll("[data-pr-brand]").forEach(function (el) {
      el.textContent = brand;
    });
    document.querySelectorAll("[data-pr-logo]").forEach(function (el) {
      el.src = CATALOG.workingLogo;
      el.alt = brand;
    });
    document.title = brand + " · " + (sales.title || brand);
    var desc = document.querySelector('meta[name="description"]');
    if (desc && sales.description) desc.setAttribute("content", sales.description);
  }

  applyOwnerTheme();
  renderSales();

  document.getElementById("prOpenLogin").addEventListener("click", function () {
    openModal(loginModal);
  });

  document.querySelectorAll("[data-pr-close]").forEach(function (el) {
    el.addEventListener("click", function () {
      closeModal(el.closest(".pr-modal"));
    });
  });

  testBtn.addEventListener("click", function () {
    AUTH.enterTest();
    window.location.href = "princes.html#home";
  });

  accountForm.addEventListener("submit", function (event) {
    event.preventDefault();
    accountError.textContent = "";
    var data = new FormData(accountForm);
    try {
      AUTH.register({
        name: data.get("name"),
        age: data.get("age"),
        gender: data.get("gender"),
        email: data.get("email"),
        password: data.get("password"),
      });
      window.location.href = "princes.html#pay";
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

  fillAges();
  syncBrand();
})();
