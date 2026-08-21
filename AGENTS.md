# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is
A collection of independent **static web apps** (plain HTML/CSS/JS, no bundler, no build step)
deployed to GitHub Pages (`keplersiguineau.com`, see `CNAME`) and, for a couple of apps, Firebase
Hosting. The hub page listing every app is `/pages.html`. Per-app status/URLs are in
`PRODUCT_LEDGER.md`.

There is **no build and no framework** — do not look for a `build`/`dev` npm script at the repo
root (there is no root `package.json`). "Running the app" means serving the repo directory over
HTTP and opening the relevant `*.html`.

### Running the static site (primary dev workflow)
Serve the repo root with any static server and open a page, e.g.:

```
python3 -m http.server 8000
# then open http://localhost:8000/pages.html (hub) or any app, e.g. /michaelCrm.html
```

- Most apps are self-contained client-side (state in `localStorage`). Example fully-local app:
  `michaelCrm.html`.
- Some apps (Gas Tracker, Liv Lakay, Green Books, The Minorities, Secret Attraction, Beach
  Delivery, etc.) talk to **live Firebase projects** and/or Stripe. Their config lives in
  `*/scripts/*FirebaseConfig.js` / `*StripeConfig.js`. Those flows need real network access and
  external credentials and cannot be fully exercised locally without them.
- Per-app version bump rules live in `.cursor/rules/app-version-bump.mdc` — follow them when
  shipping user-facing changes to an app that has a `*Version.js` module.

### Firebase Cloud Functions (backend, optional)
Two Node 20 Cloud Functions codebases: `functions/` (Liv Lakay Stripe pass) and
`minoritiesFunctions/` (The Minorities: Stripe subscriptions, Mux, FCM push). `scripts/` holds a
`firebase-admin` maintenance script. Their npm dependencies are installed by the update script.

- These are **deploy targets**, not part of the local static dev loop. Running/emulating or
  deploying them requires the Firebase CLI (`npm i -g firebase-tools`), `firebase login`, and
  Stripe/Mux secrets — none of which are configured in this environment. See `functions/README.txt`
  and `minoritiesFunctions/README.txt` for the full deploy/secrets procedure.
- `npm run lint` in `functions/` is intentionally best-effort: it runs `eslint . || true` and
  `eslint` is **not** a dependency, so it is effectively a no-op. Use `node --check <file>` for a
  quick syntax sanity check.
