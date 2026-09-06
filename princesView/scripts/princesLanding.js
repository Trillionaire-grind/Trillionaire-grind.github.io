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
  var fixBtn = document.getElementById("prFixModeBtn");
  var ageSelect = document.getElementById("prAgeSelect");

  function openModal(el) {
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
  }

  function closeModal(el) {
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
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
      el.textContent = "Princes";
    });
    document.querySelectorAll("[data-pr-logo]").forEach(function (el) {
      el.src = CATALOG.workingLogo;
    });
    document.title = "Princes · Yes, I want to fix it";
  }

  document.querySelectorAll("[data-open-account]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openModal(accountModal);
      accountModal.querySelector("input")?.focus();
    });
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
    AUTH.enterTest();
    window.location.href = "princes.html#home";
  });

  fixBtn.addEventListener("click", function () {
    AUTH.enterFix();
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
