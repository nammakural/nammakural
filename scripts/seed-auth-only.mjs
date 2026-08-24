/**
 * Seed Auth users only (works before Firestore is ready).
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const sa = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json', 'utf8'))
if (!getApps().length) initializeApp({ credential: cert(sa), projectId: sa.project_id })

const auth = getAuth()
const ADMINS = [
  { email: 'admin@nammakural.in', password: 'admin123', displayName: 'Admin' },
  { email: 'president@nammakural.in', password: 'president123', displayName: 'Village President' },
  { email: 'staff1@nammakural.in', password: 'staff123', displayName: 'Staff 1' },
  { email: 'staff2@nammakural.in', password: 'staff123', displayName: 'Staff 2' },
  { email: 'staff3@nammakural.in', password: 'staff123', displayName: 'Staff 3' },
  { email: 'staff4@nammakural.in', password: 'staff123', displayName: 'Staff 4' },
]

for (const entry of ADMINS) {
  try {
    const existing = await auth.getUserByEmail(entry.email)
    await auth.updateUser(existing.uid, { password: entry.password, displayName: entry.displayName })
    console.log(`updated ${entry.email} uid=${existing.uid}`)
  } catch {
    const user = await auth.createUser({
      email: entry.email,
      password: entry.password,
      displayName: entry.displayName,
      emailVerified: true,
    })
    console.log(`created ${entry.email} uid=${user.uid}`)
  }
}
console.log('Auth users ready. Next: enable Firestore, then seed admin docs.')
