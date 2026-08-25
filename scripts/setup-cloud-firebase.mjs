/**
 * One-time cloud setup using serviceAccount.json:
 * - enable Email/Password Auth
 * - seed admin users + admins/{uid} docs
 *
 * Usage:
 *   set GOOGLE_APPLICATION_CREDENTIALS=.\serviceAccount.json
 *   node scripts/setup-cloud-firebase.mjs
 */
import { readFileSync } from 'node:fs'
import { GoogleAuth } from 'google-auth-library'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json'
const sa = JSON.parse(readFileSync(saPath, 'utf8'))
const projectId = sa.project_id

const authClient = new GoogleAuth({
  credentials: sa,
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/firebase',
    'https://www.googleapis.com/auth/identitytoolkit',
    'https://www.googleapis.com/auth/datastore',
  ],
})

const client = await authClient.getClient()
const { token } = await client.getAccessToken()
if (!token) throw new Error('Failed to get access token from service account')

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text }
  }
  return { ok: res.ok, status: res.status, json }
}

console.log(`Project: ${projectId}`)

// Enable Identity Toolkit API
{
  const r = await api(
    'POST',
    `https://serviceusage.googleapis.com/v1/projects/${projectId}/services/identitytoolkit.googleapis.com:enable`,
  )
  console.log(`Enable Identity Toolkit: ${r.status}`, r.ok ? 'OK' : JSON.stringify(r.json))
}

// Try initialize Identity Platform / Auth config
{
  const r = await api(
    'POST',
    `https://identitytoolkit.googleapis.com/v2/projects/${projectId}/identityPlatform:initializeAuth`,
  )
  console.log(`Initialize Auth: ${r.status}`, r.ok || r.status === 409 ? 'OK' : JSON.stringify(r.json))
}

// Enable email/password
{
  const r = await api(
    'PATCH',
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=signIn.email`,
    {
      signIn: {
        email: {
          enabled: true,
          passwordRequired: true,
        },
      },
    },
  )
  console.log(`Enable Email/Password: ${r.status}`, r.ok ? 'OK' : JSON.stringify(r.json))
}

// Enable Firestore API
{
  const r = await api(
    'POST',
    `https://serviceusage.googleapis.com/v1/projects/${projectId}/services/firestore.googleapis.com:enable`,
  )
  console.log(`Enable Firestore API: ${r.status}`, r.ok ? 'OK' : JSON.stringify(r.json))
}

if (!getApps().length) {
  initializeApp({ credential: cert(sa), projectId })
}

const auth = getAuth()
const db = getFirestore()

const ADMINS = [
  {
    email: 'admin@nammakural.online',
    password: 'admin123',
    displayName: 'Admin',
    role: 'super_admin',
    villageId: 'thiruppair',
  },
  {
    email: 'president@nammakural.online',
    password: 'president123',
    displayName: 'Village President',
    role: 'president',
    villageId: 'thiruppair',
  },
  {
    email: 'staff1@nammakural.online',
    password: 'staff123',
    displayName: 'Staff 1',
    role: 'staff',
    villageId: 'thiruppair',
  },
  {
    email: 'staff2@nammakural.online',
    password: 'staff123',
    displayName: 'Staff 2',
    role: 'staff',
    villageId: 'thiruppair',
  },
]

for (const entry of ADMINS) {
  let user
  try {
    user = await auth.getUserByEmail(entry.email)
    await auth.updateUser(user.uid, { password: entry.password, displayName: entry.displayName })
  } catch {
    user = await auth.createUser({
      email: entry.email,
      password: entry.password,
      displayName: entry.displayName,
      emailVerified: true,
    })
  }
  await db.collection('admins').doc(user.uid).set(
    {
      email: entry.email,
      displayName: entry.displayName,
      role: entry.role,
      villageId: entry.villageId,
    },
    { merge: true },
  )
  console.log(`✓ ${entry.role} ${entry.email} uid=${user.uid}`)
}

await db.collection('villages').doc('thiruppair').set(
  {
    id: 'thiruppair',
    name: 'Thiruppair',
    updatedAt: new Date().toISOString(),
  },
  { merge: true },
)

console.log('Cloud setup complete.')
console.log('Admin:      admin@nammakural.online / admin123')
console.log('President:  president@nammakural.online / president123')
console.log('View data: https://console.firebase.google.com/project/nammakural-b1878/firestore')
