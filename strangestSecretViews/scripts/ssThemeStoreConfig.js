/**
 * Theme catalog + Stripe Payment Link URLs for The Strangest Secret.
 *
 * STRIPE SETUP (Payment Links — no backend required)
 * ───────────────────────────────────────────────────
 * 1. Stripe Dashboard → Product catalog → Add product (one per theme + one bundle).
 * 2. For each product → Create payment link (e.g. $0.99).
 * 3. Payment link → After payment → Redirect to a custom URL:
 *
 *    Single theme (use the theme id from THEMES in ssApp.js):
 *    https://keplersiguineau.com/strangestSecretViews/themeUnlocked.html?unlock=cream
 *    https://keplersiguineau.com/strangestSecretViews/themeUnlocked.html?unlock=sakura
 *    … etc. (cream, cherryblossom, burgundy, sakura, fastred, purplefever, starrynights, arcadia)
 *
 *    Bundle (all premium themes):
 *    https://keplersiguineau.com/strangestSecretViews/themeUnlocked.html?unlock=bundle
 *
 * 4. Copy each buy.stripe.com/… URL into stripeUrl below.
 * 5. Deploy/push so themeUnlocked.html and this file are live on GitHub Pages.
 *
 * After checkout, themeUnlocked.html saves the unlock in localStorage (ssUnlockedThemes)
 * and redirects to strangestSecret.html. Unlocks stay on that browser/device.
 */
window.SS_THEME_CATALOG = {
  previewSeconds: 8,
  themes: {
    gold: { name: "Gold", free: true },
    black: { name: "Black", free: true },
    blue: { name: "Ocean Blue", free: true },
    cream: {
      name: "Cream",
      priceLabel: "$0.99",
      stripeUrl: "https://buy.stripe.com/5kQ4gybmj1cFgMGbHq6Ri0w",
    },
    cherryblossom: {
      name: "Cherry Blossom",
      priceLabel: "$0.99",
      stripeUrl: "https://buy.stripe.com/eVq9AS61Zg7z3ZUaDm6Ri0y",
    },
    burgundy: {
      name: "Burgundy",
      priceLabel: "$0.99",
      stripeUrl: "https://buy.stripe.com/bJe9AScqn08B9ke4eY6Ri0z",
    },
    sakura: {
      name: "Sakura",
      priceLabel: "$0.99",
      stripeUrl: "https://buy.stripe.com/cNi8wO3TR5sVcwq9zi6Ri0A",
    },
    fastred: {
      name: "Fast Red",
      priceLabel: "$0.99",
      stripeUrl: "https://buy.stripe.com/9B6aEWgGD7B3fIC3aU6Ri0B",
    },
    purplefever: {
      name: "Purple Fever",
      priceLabel: "$0.99",
      stripeUrl: "https://buy.stripe.com/28EcN4dur1cFaoih1K6Ri0C",
    },
    starrynights: {
      name: "Starry Nights",
      priceLabel: "$0.99",
      stripeUrl: "https://buy.stripe.com/28E7sKeyvcVnbsm6n66Ri0D",
    },
    arcadia: {
      name: "Arcadia Droptail",
      priceLabel: "$2.99",
      premium: true,
      stripeUrl: "https://buy.stripe.com/14A28qaifg7z9ke5j26Ri0x",
    },
  },
  bundle: {
    name: "All themes",
    priceLabel: "$6.99",
    includes: [
      "cream", "cherryblossom", "burgundy",
      "sakura", "fastred", "purplefever", "starrynights", "arcadia",
    ],
    stripeUrl: "https://buy.stripe.com/fZu3cufCz5sV6826n66Ri0E",
  },
};
