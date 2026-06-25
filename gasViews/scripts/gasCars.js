(function () {
  var CAR_MAKES_MODELS = {
    Acura: ["ILX", "Integra", "MDX", "RDX", "TLX"],
    BMW: ["3 Series", "5 Series", "X1", "X3", "X5", "X7"],
    Chevrolet: ["Blazer", "Camaro", "Colorado", "Equinox", "Malibu", "Silverado", "Suburban", "Tahoe", "Traverse"],
    Dodge: ["Challenger", "Charger", "Durango", "Grand Caravan", "Ram 1500"],
    Ford: ["Bronco", "Edge", "Escape", "Explorer", "F-150", "Focus", "Fusion", "Mustang", "Ranger"],
    GMC: ["Acadia", "Canyon", "Sierra", "Terrain", "Yukon"],
    Honda: ["Accord", "Civic", "CR-V", "HR-V", "Odyssey", "Pilot", "Ridgeline"],
    Hyundai: ["Elantra", "Kona", "Palisade", "Santa Fe", "Sonata", "Tucson"],
    Jeep: ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Renegade", "Wrangler"],
    Kia: ["Forte", "K5", "Seltos", "Sorento", "Soul", "Sportage", "Telluride"],
    Lexus: ["ES", "GX", "IS", "NX", "RX", "UX"],
    Mazda: ["CX-5", "CX-30", "CX-50", "CX-90", "Mazda3", "Mazda6"],
    "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE", "GLS", "Sprinter"],
    Nissan: ["Altima", "Armada", "Frontier", "Kicks", "Maxima", "Murano", "Pathfinder", "Rogue", "Sentra", "Titan"],
    Ram: ["1500", "2500", "3500", "ProMaster"],
    Subaru: ["Ascent", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "WRX"],
    Tesla: ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
    Toyota: ["4Runner", "Camry", "Corolla", "Highlander", "Prius", "RAV4", "Sequoia", "Sienna", "Tacoma", "Tundra"],
    Volkswagen: ["Atlas", "Golf", "Jetta", "Passat", "Taos", "Tiguan"],
    Volvo: ["S60", "S90", "V60", "XC40", "XC60", "XC90"],
    Other: ["Other"],
  };

  var makes = Object.keys(CAR_MAKES_MODELS).sort(function (a, b) {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  function carYears(firstYear) {
    var start = firstYear || 1990;
    var end = new Date().getFullYear() + 1;
    var years = [];
    for (var y = end; y >= start; y--) years.push(String(y));
    return years;
  }

  function fillSelect(select, options, placeholder) {
    if (!select) return;
    select.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = "";
    ph.disabled = true;
    ph.selected = true;
    ph.textContent = placeholder;
    select.appendChild(ph);
    options.forEach(function (opt) {
      var o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    });
  }

  function updateModelSelect(make) {
    var modelSelect = document.getElementById("regModel");
    if (!modelSelect) return;

    if (!make || !CAR_MAKES_MODELS[make]) {
      modelSelect.disabled = true;
      fillSelect(modelSelect, [], "Select make first");
      return;
    }

    var models = CAR_MAKES_MODELS[make].slice();
    if (make !== "Other" && models.indexOf("Other") === -1) {
      models.push("Other");
    }

    modelSelect.disabled = false;
    fillSelect(modelSelect, models, "Select model");
  }

  function initCarSelects() {
    var makeSelect = document.getElementById("regMake");
    var yearSelect = document.getElementById("regYear");
    if (!makeSelect || !yearSelect) return;

    fillSelect(makeSelect, makes, "Select make");
    fillSelect(yearSelect, carYears(), "Year");

    makeSelect.addEventListener("change", function () {
      updateModelSelect(makeSelect.value);
    });
  }

  window.GAS_CAR_DATA = {
    CAR_MAKES_MODELS: CAR_MAKES_MODELS,
    CAR_MAKES: makes,
    carYears: carYears,
    initCarSelects: initCarSelects,
    updateModelSelect: updateModelSelect,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCarSelects);
  } else {
    initCarSelects();
  }
})();
