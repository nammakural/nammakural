# nammakural

Modern, responsive village issue-tracking platform for citizens and Panchayat administrators.

**Stack:** React · Vite · TypeScript · Tailwind CSS · React Router · React Hook Form · Firebase-ready · Recharts · Framer Motion · Lucide · i18n (English / Tamil) · PWA

## Quick start

```bash
cd "e:\my village smart project\nammakural\nammakural"
npm install
npm run dev
```

Open https://nammakural.online (or http://localhost:5173 in development)

### Daily workflow (laptop ↔ GitHub ↔ Vercel)

See **[WORKFLOW.md](./WORKFLOW.md)** for the start / finish checklist.

```bash
npm run sync          # start: pull latest from GitHub
npm run finish -- "…" # finish: commit + push (Vercel updates)
```

### Demo admin login (full access)

- Email: `admin@nammakural.online`
- Password: `admin123`

## Features

### Public

- Home with hero, stats, announcements, recent complaints, map, testimonials
- Report issue (photos, voice record/upload, category, map/area pin)
- Duplicate detection with upvote / support existing complaints
- Track by Complaint ID, phone, or category
- Complaint details with workflow timeline, QR code, PDF download, comments
- Interactive village map (Google Maps when API key set; demo map otherwise)
- English / Tamil language toggle · Dark / light theme · PWA offline shell

### Admin

- Secure login · Dashboard charts · Statistics (screenshot-style UI)
- Filter / assign / update status · Internal notes · Activity log
- Excel / CSV export · Multi-village-ready data model

### Complaint workflow

`Submitted → Verified → Assigned → In Progress → Resolved → Closed`

IDs look like `TP-2026-00001`.

## Firebase setup (required for live complaints)

See **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** for emulator (local) and cloud steps.

Quick local start:

```bash
npm run emulators      # terminal 1
npm run seed:admin     # terminal 2
npm run dev            # terminal 2
```

Without Firebase, the app can still run in mock mode (`VITE_USE_MOCK_DATA=true`) — data stays in browser memory only.

Firestore layout:

```
villages/{villageId}/complaints/{id}
villages/{villageId}/activityLog/{id}
villages/{villageId}/meta/counters
admins/{uid} → { villageId, role, displayName, email }
```
## Notifications architecture

`src/services/notifications.ts` defines SMS, WhatsApp, Email, and Push providers (console stubs). Swap in Twilio / MSG91 / Meta / SendGrid / FCM and trigger from Cloud Functions on status change.

## Scripts

| Command        | Description        |
| -------------- | ------------------ |
| `npm run sync` | Pull latest from GitHub (`main`) |
| `npm run finish -- "msg"` | Commit all changes and push to GitHub |
| `npm run dev`  | Development server |
| `npm run build`| Production build   |
| `npm run preview` | Preview build   |

## Folder structure

```
src/
  components/   # UI, layout, map, complaint widgets
  constants/    # Categories, statuses, village config
  contexts/     # Theme, auth, village
  data/         # Mock seed data
  i18n/         # EN / TA translations
  lib/          # Firebase init
  pages/        # Public + admin routes
  services/     # Complaints, export, notifications
  types/        # Shared TypeScript types
  utils/        # Helpers (duplicates, markers, etc.)
```
