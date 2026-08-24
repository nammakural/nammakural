# Daily GitHub workflow

Your code lives on GitHub: https://github.com/nammakural/nammakural  
Laptop folder and GitHub stay in sync with **pull** (start) and **push** (finish).  
Vercel updates automatically after every successful push to `main`.

---

## Start work (before coding)

In the project folder:

```powershell
cd "e:\my village smart project\village project"
npm run sync
npm run dev
```

| Step | What it does |
|------|----------------|
| `npm run sync` | `git pull origin main` — download latest from GitHub |
| `npm run dev` | Open local app at http://localhost:5173 |

If `sync` says conflicts, stop and fix them (or ask for help) before editing.

---

## Finish work (when done)

```powershell
git status
git add .
git commit -m "Short description of what you changed"
git push origin main
```

| Step | What it does |
|------|----------------|
| `git status` | See which files changed |
| `git add .` | Stage all changes |
| `git commit -m "..."` | Save a snapshot locally |
| `git push origin main` | Upload to GitHub → Vercel redeploys |

Or use the helper (still needs a commit message):

```powershell
npm run finish -- "Short description of what you changed"
```

---

## New computer / fresh folder

```powershell
git clone https://github.com/nammakural/nammakural.git
cd nammakural
npm install
npm run sync
npm run dev
```

---

## Quick reference

| Goal | Command |
|------|---------|
| Get latest from GitHub | `npm run sync` |
| Run locally | `npm run dev` |
| Save + upload to GitHub | `npm run finish -- "your message"` |
| Live site | https://nammakural.in |
| Admin login (hidden from public) | `/admin/login` |

**Rule:** Always `npm run sync` before you start. Always `push` when you finish — or GitHub/Vercel will stay old.
