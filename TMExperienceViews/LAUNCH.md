# TM Experience — launch checklist

Firebase project: **naples-sunrise-bay**  
Club ID: **naples-sunrise-bay**

## 1. Deploy security rules

Point Firebase CLI at the correct project (update `.firebaserc` if needed):

```bash
firebase use naples-sunrise-bay
firebase deploy --only firestore:rules,storage
```

**Firestore** (`firestore.rules`):

- Members read/write only their club’s data
- Agendas: members read; **admins** publish/update
- Votes: one doc per user while meeting is **live**; vote counter + admins can read all votes for reveal
- Users cannot set `role: admin` from the client (promote in Console)

**Storage** (`storage.rules`):

- Signed-in users can **read** profile photos (speaker carousel)
- Only the owner can **upload** their `users/{uid}/profile.jpg` (max 5 MB, images only)

## 2. Reset test data (optional)

Removes all Auth users, `users`, `votes`, agendas, and profile uploads. Keeps `clubs/naples-sunrise-bay` and Liv `accessCodes`.

1. Firebase Console → Project settings → Service accounts → Generate new private key
2. Run:

```bash
cd scripts && npm install
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"
node tm-launch-reset.mjs --dry-run   # preview counts
node tm-launch-reset.mjs --confirm   # execute
```

## 3. Club document

Ensure this exists (Console → Firestore):

`clubs/naples-sunrise-bay`

```json
{
  "name": "Naples Sunrise Bay Toastmasters",
  "active": true
}
```

## 4. First admin

1. Register in the app with club ID `naples-sunrise-bay`
2. Firestore → `users/{your-uid}` → add field: `role` = `admin` (string)
3. Sign out and back in — **Admin** tab appears
4. Assign roles and **Publish agenda**

## 5. Smoke test

- [ ] New member can register with club ID
- [ ] Member sees agenda on Meeting tab
- [ ] Admin can publish / edit agenda (live state preserved on republish)
- [ ] Go live → Speeches: feedback + vote
- [ ] Vote Counter can reveal votes while live
- [ ] Profile photo upload + visible on Speeches tab

## Notes

- Legacy path `test/date` is still updated on publish for older clients; rules allow admin write only.
- Stripe / Pro checkout is not enabled yet (`TM_PRO_CHECKOUT_ENABLED = false`).
