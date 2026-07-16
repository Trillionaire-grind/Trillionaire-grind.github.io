# Product ledger & launch checklist

Check off items as you go (`[x]`). Ordered **most done → least done**.

**Legend**
- **Ship-ready** — OK to promote
- **Mostly done** — Real product; finish gaps before big push
- **Prototype** — Demo / test payments only
- **Shell** — Landing only

**Live site:** https://keplersiguineau.com  
**Hub:** `/pages.html`

---

## Tier 1 — Ship-ready

### The Strangest Secret
**URL:** `/strangestSecret.html` · **Money:** Live Stripe themes ($0.99–$6.99)

- [x] Theme store + 11 themes
- [x] Stripe Payment Links wired
- [x] `themeUnlocked.html` live
- [x] Support email (`buildingwithkepler@gmail.com`)
- [x] Certificate flow removed
- [ ] Stripe: all 9 success URLs verified
- [ ] Stripe: bundle price $6.99 in Dashboard matches app
- [ ] One full purchase test on phone (Instagram browser)
- [ ] Earl Nightingale / Nightingale-Conant licensing (optional, for scale)

---

### Danny's Delights
**URL:** `/danny.html` · **Money:** Lead gen (orders)

- [x] Polished bakery landing
- [x] Real phone in config
- [x] No “coming soon” social stubs in page
- [ ] Ready to promote locally

---

### Joshua Williams Real Estate
**URL:** `/josh.html` · **Money:** Lead gen (listings)

- [x] Agent site + themes
- [x] Contact form → email
- [ ] Listing photos / copy current
- [ ] Ready for client or portfolio demo

---

### Current Flow Plumbing
**URL:** `/plumbing.html` · **Money:** Lead gen (quotes)

- [x] Demo-labeled professional site
- [x] Quote contact flow
- [ ] Static HTML phone matches JS config (optional SEO fix)
- [ ] Ready for portfolio demo

---

### Arcadia
**URL:** `/arcadia.html` · **Money:** None (experience)

- [x] Gallery + autoplay
- [x] Image assets committed
- [ ] Share link tested on mobile

---

## Tier 2 — Mostly done

### Gas Tracker
**URL:** `/gas.html` · **Money:** None

- [x] Firebase auth + fill-ups + MPG
- [ ] Smoke test signup / add car / log fill-up
- [ ] Confirm old `/gasViews/homeView.html` links redirected (if any)
- [ ] Promote or keep personal tool

---

### A Secret Attraction (Site)
**URL:** `/secretAttraction.html` · **Money:** Leads + premium path

- [x] Email capture + Firestore
- [x] Chapter download funnel
- [ ] Premium upsell / Stripe path tested
- [ ] Funnel copy final for ads/reels
- [ ] Book Amazon link in bio matches live listing

---

### A Secret Attraction (Book)
**URL:** [Amazon](https://www.amazon.com/Secret-Attraction-Between-Mentor-Mentee/dp/B0DH2ZJ57H) · **Money:** Book sales

- [ ] Listing copy / categories optimized
- [ ] Site funnel points to Amazon after chapter read

---

### Képler Siguineau (Learn)
**URL:** `/learnViews/learn.html` · **Money:** Offers outbound links

- [x] Notes (Firebase), content library, projects tab
- [ ] Broken asset refs after local cleanup checked
- [ ] Offers catalog links all valid
- [ ] Version bump on hub if needed

---

### Liv Lakay
**URL:** `/liv.html` · **Money:** Stripe pass

- [x] Firebase + reader shell
- [ ] **Do not push asset deletions** until icons/covers fixed
- [ ] Stripe pass flow tested live
- [ ] Signup + library smoke test
- [ ] Ready to promote to Creole learners

---

### TM Experience
**URL:** `/TMExperience.html` · **Money:** None (club)

- [x] Multi-tab Toastmasters app
- [ ] Smoke test: Meeting, Speeches, Admin, Calendar
- [ ] Run `LAUNCH.md` checklist if club launch
- [ ] Asset deletions reviewed before push (many deleted locally — review before commit)

---

### Beach Delivery
**URL:** `/beachDelivery.html` · **Money:** Demo payment

- [x] Firebase wired
- [x] Labeled demo in UI (banner + title + register copy)
- [ ] Firebase rules reviewed
- [ ] Payment flow tested

---

### Win Friends
**URL:** `/winFriends.html` · **Money:** None

- [x] Auth + interaction log
- [ ] Smoke test add friend + log interaction
- [ ] Legacy view paths dead — confirm no broken links

---

### Green Books
**URL:** [green-books-app.web.app](https://green-books-app.web.app/) · **Money:** Separate deploy

- [x] Live on Firebase (not main Pages site)
- [ ] Repo vs hosted app in sync (if you deploy from here)
- [ ] Promote only if Firebase app is current

---

## Tier 3 — Functional prototype

### Tech Academy
**URL:** `/techAcademy.html` · **Money:** Stripe **test** only

- [x] Education / login shell
- [ ] Replace test Stripe links with live
- [ ] Remove debug `alert()`s in auth flows
- [ ] Mock assets / broken pages fixed
- [ ] **Not for public sale until above done**

---

### The Minorities
**URL:** `/minorities.html` · **Money:** Test Stripe stub (live Checkout planned)

- [x] SPA UI (feed, chat, shop, learn)
- [x] Backend scaffolding in repo (`functions-minorities/`, `firebase.minorities.json`, Firestore + Storage rules)
- [x] Setup guide (`minoritiesView/MIN_SERVER_SETUP.txt`)
- [ ] Firebase project `the-minorities` created + config in `minFirebaseConfig.js`
- [ ] Functions + rules deployed; Stripe prices + webhook live
- [ ] Client wired to Firestore/Auth (still on mock `minData.js`)
- [ ] Replace client test Stripe link with live Checkout via Cloud Functions
- [ ] Treat as portfolio demo until client ↔ server wiring is done

---

## Tier 4 — Shell / demo

### Church Network
**URL:** `/churchNetwork.html` · **Money:** None

- [x] Waitlist landing
- [ ] Waitlist capture wired (Formspree / Firebase / email)
- [ ] Full app not built — don’t sell as product yet
- [ ] Old `churchViews.html` bookmarks — redirect or 404 note

---

### Michael CRM
**URL:** `/michaelCrm.html` · **Money:** None · **Hub:** not listed yet

- [x] Local demo CRM UI (people, companies, notes, reports)
- [ ] Real backend / auth if it becomes a product
- [ ] Add to `/pages.html` when ready to show

---

## Finish order (suggested)

1. [ ] **Strangest Secret** — Stripe verify + phone purchase → promote
2. [ ] **Secret Attraction** — funnel + Amazon
3. [ ] **Liv Lakay** — assets + live pass test
4. [ ] **Gas / Win Friends / Beach / TM** — smoke tests (TM: careful with deletions)
5. [ ] **Tech Academy** — live Stripe + remove alerts
6. [ ] **The Minorities** — deploy Firebase, wire client off mocks
7. [ ] **Church Network / Michael CRM** — only if those are next products

---

## Repo hygiene (before big pushes)

- [ ] **Strangest Secret** — safe to push anytime
- [ ] **Static sites** (Danny, Josh, Plumbing, Arcadia) — safe
- [ ] **Gas** (`/gas.html`) — safe; replaces old gasViews entry
- [ ] **Beach Delivery** — demo label landed; safe for portfolio show
- [ ] **Liv / TM / Tech Academy** — review local **deletions** before push
- [ ] **The Minorities** — do not commit `functions-minorities/node_modules`
- [ ] **Secret Attraction** — keep PDF + cover; OK to delete legacy pages if unlinked

---

## Reel / promo priority (suggested)

1. [ ] **Strangest Secret** — live now
2. [ ] **Secret Attraction** — book + site
3. [ ] **Danny / Josh / Plumbing** — portfolio / local business demos
4. [ ] **Liv / Tech Academy** — after checklist gaps closed

---

*Last updated: 2026-07-15 · Edit checkboxes as you ship.*
