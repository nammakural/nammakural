# Firebase setup — nammakural

## Local (emulators) — works without a cloud project

```bash
npm install
npm run emulators          # terminal 1 — Auth :9099, Firestore :8080, Storage :9199, UI :4000
npm run seed:admin         # terminal 2 — creates admin@nammakural.in / admin123
npm run dev                # terminal 2 — http://localhost:5173
```

Or one command after install:

```bash
npm run dev:firebase
```

Then in another terminal: `npm run seed:admin`

Confirm **Admin → Settings → Data mode: Firebase live**.

Emulator UI: http://127.0.0.1:4000

### Demo logins (seeded)

| Role        | Email                      | Password      |
|-------------|----------------------------|---------------|
| Admin       | admin@nammakural.in      | admin123      |
| President   | president@nammakural.in  | president123  |
| Staff 1–4   | staff1…staff4@nammakural.in | staff123   |

## Production cloud project (`mylocalvoice-a73f4`)

Local `.env` is already pointed at this project (not committed). Complete these Console steps once:

1. Open https://console.firebase.google.com/project/mylocalvoice-a73f4
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable**
3. **Build → Firestore Database → Create database** (start in production mode; we deploy rules)
4. **Build → Storage → Get started**
5. Then run:

```bash
set GOOGLE_APPLICATION_CREDENTIALS=.\serviceAccount.json
node scripts/setup-cloud-firebase.mjs
npx firebase deploy --only firestore:rules,storage --project mylocalvoice-a73f4
```

6. Restart `npm run dev` — Admin → Settings should show **Firebase live (cloud)**
7. View data: https://console.firebase.google.com/project/mylocalvoice-a73f4/firestore

### Vercel env vars

Set the same `VITE_FIREBASE_*` values from local `.env`, plus:

```
VITE_USE_MOCK_DATA=false
VITE_USE_FIREBASE_EMULATOR=false
```

Never upload `serviceAccount.json` to Vercel or GitHub.

## Data model

```
villages/{villageId}/complaints/{id}
villages/{villageId}/activityLog/{id}
villages/{villageId}/meta/counters
admins/{uid}
```
