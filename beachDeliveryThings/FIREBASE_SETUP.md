# Firebase setup — Beach Delivery

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project (e.g. `beach-delivery`)
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Enable **Firestore Database** → Start in **test mode** (then deploy rules below)

## 2. Register the web app

1. Project settings → **Your apps** → Web (`</>`)
2. Copy the `firebaseConfig` object
3. Paste into `firebase-config.js` as **`window.FIREBASE_CONFIG = { ... }`** (see example — not `const firebaseConfig`)
4. Set staff emails in **`window.STAFF_EMAILS`**

## 3. Deploy Firestore rules

```bash
firebase init firestore   # select existing project, use firestore.rules
firebase deploy --only firestore:rules
```

Or paste `firestore.rules` into Firebase Console → Firestore → Rules → Publish.

## 4. Create staff config (first run)

The app auto-creates `config/staff` with emails from `STAFF_EMAILS` in `firebase-config.js`.

Add staff emails there, or edit the document in Firestore Console:

```
config/staff
  emails: ["you@yourdomain.com"]
  uids: []
```

Staff users can open **Restaurant admin** without the demo PIN when signed in with a staff email.

## 5. Firestore indexes

Deploy the composite index (required for order history):

```bash
firebase deploy --only firestore:indexes
```

Or create manually in Firebase Console when prompted:

- Collection: `orders`
- Fields: `customerUid` Asc, `createdAt` Desc

The repo includes `firestore.indexes.json` for this query.

## 6. Run the app

Layout on your server (or locally):

```
your_folder/
  beachDelivery.html          ← open this in the browser
  beachDeliveryThings/        ← JS, config, menu data (do not omit)
    firebase-config.js
    menu-data.js
    …
```

From the **parent folder** (the one that contains `beachDelivery.html`):

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/beachDelivery.html` — use the **same URL** in all tabs.

**Do not upload `node_modules`** — that folder is only for local menu scraping on your computer, not for running the app on a server.

Without valid `window.FIREBASE_CONFIG`, the app falls back to **localStorage** (demo mode).

## Collections (single source of truth)

Orders live in one **`orders/{orderId}`** document — not duplicated under each user. Both the customer app and restaurant admin read the same collection; status updates from admin sync to the customer in real time.

| Path | Purpose |
|------|---------|
| `users/{uid}` | Profile: name, phone, preferredDropoffId, theme |
| `orders/{id}` | Shared order: `customerUid`, status, items, ETA, totals |
| `counters/orders` | Auto-increment order numbers |
| `config/staff` | Admin email/uid allowlist |

Customer history: query `orders` where `customerUid == uid`.  
Restaurant board: staff reads all `orders` (see `firestore.rules`).
