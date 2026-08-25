/**
 * Seed sample complaints + activity log into Firestore so the live site
 * is not empty. Skips IDs that already exist (safe to re-run).
 *
 * Cloud (service account):
 *   set GOOGLE_APPLICATION_CREDENTIALS=.\serviceAccount.json
 *   set SEED_TARGET=cloud
 *   npm run seed:complaints
 *
 * Cloud (web keys in .env — uses public create rules):
 *   set SEED_TARGET=cloud
 *   npm run seed:complaints
 *
 * Emulator:
 *   npm run emulators
 *   npm run seed:complaints
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const villageId = process.env.VITE_VILLAGE_ID || 'thiruppair'
const env = loadEnv()
const saFile = resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json')
const hasWebKeys =
  Boolean(env.VITE_FIREBASE_API_KEY) &&
  env.VITE_FIREBASE_API_KEY !== 'your_api_key' &&
  env.VITE_FIREBASE_API_KEY !== 'demo-api-key' &&
  env.VITE_USE_FIREBASE_EMULATOR !== 'true'
const useCloud =
  process.env.SEED_TARGET === 'emulator'
    ? false
    : process.env.SEED_TARGET === 'cloud' || existsSync(saFile) || hasWebKeys

function loadEnv() {
  const out = { ...process.env }
  const path = resolve('.env')
  if (!existsSync(path)) return out
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const key = t.slice(0, i).trim()
    let value = t.slice(i + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (out[key] == null || out[key] === '') out[key] = value
  }
  return out
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function omitUndefined(value) {
  if (value === undefined) return undefined
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(omitUndefined).filter((item) => item !== undefined)
  const out = {}
  for (const [k, v] of Object.entries(value)) {
    if (v === undefined) continue
    const cleaned = omitUndefined(v)
    if (cleaned !== undefined) out[k] = cleaned
  }
  return out
}

function sampleComplaints() {
  return [
    {
      id: 'c1',
      complaintId: 'TP-2026-00001',
      villageId,
      fullName: 'Lakshmi Devi',
      mobile: '9876543210',
      category: 'street_light',
      description:
        'Street light near Temple Street junction has been non-functional for 2 weeks. Area becomes very dark after 7 PM, unsafe for school children and elders.',
      photos: ['https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&q=80'],
      location: { lat: 13.2094057, lng: 79.8342263, address: 'Thiruppair', areaId: 'thiruppair' },
      status: 'in_progress',
      supporters: 24,
      supporterIds: [],
      comments: [
        {
          id: 'cm1',
          authorName: 'Ravi K',
          text: 'Same issue near my house. Please fix soon.',
          createdAt: daysAgo(3),
        },
      ],
      timeline: [
        { id: 't1', status: 'submitted', title: 'Complaint submitted', createdAt: daysAgo(8), createdBy: 'Citizen' },
        { id: 't2', status: 'verified', title: 'Verified by staff', description: 'Site visit completed', createdAt: daysAgo(7), createdBy: 'Admin' },
        { id: 't3', status: 'assigned', title: 'Assigned to Electrical Wing', createdAt: daysAgo(6), createdBy: 'President' },
        { id: 't4', status: 'in_progress', title: 'Work started', description: 'New LED fixture ordered', createdAt: daysAgo(2), createdBy: 'Staff' },
      ],
      adminNotes: [
        { id: 'n1', text: 'Need 1 LED street light unit from stock', createdAt: daysAgo(5), createdBy: 'Staff', isInternal: true },
      ],
      beforePhotos: ['https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&q=80'],
      afterPhotos: [],
      assignedTo: 'Staff 1',
      createdAt: daysAgo(8),
      updatedAt: daysAgo(2),
    },
    {
      id: 'c2',
      complaintId: 'TP-2026-00002',
      villageId,
      fullName: 'Murugan S',
      mobile: '9123456780',
      category: 'road_damage',
      description:
        'Large pothole on Main Road near Bus Stand causing vehicle damage. Water stagnates during rain.',
      photos: ['https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=600&q=80'],
      location: { lat: 13.2112, lng: 79.8358, address: 'Thiruppair Colony', areaId: 'thiruppair-colony' },
      status: 'submitted',
      supporters: 41,
      supporterIds: [],
      comments: [],
      timeline: [
        { id: 't1', status: 'submitted', title: 'Complaint submitted', createdAt: daysAgo(1), createdBy: 'Citizen' },
      ],
      adminNotes: [],
      beforePhotos: [],
      afterPhotos: [],
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: 'c3',
      complaintId: 'TP-2026-00003',
      villageId,
      fullName: 'Anitha R',
      mobile: '9988776655',
      category: 'water_supply',
      description: 'No water supply in School Area for 3 days. Tanker requested.',
      photos: [],
      location: { lat: 13.2078, lng: 79.8315, address: 'Bangarampettai', areaId: 'bangarampettai' },
      status: 'resolved',
      supporters: 18,
      supporterIds: [],
      comments: [],
      timeline: [
        { id: 't1', status: 'submitted', title: 'Complaint submitted', createdAt: daysAgo(10), createdBy: 'Citizen' },
        { id: 't2', status: 'verified', title: 'Verified', createdAt: daysAgo(9), createdBy: 'Admin' },
        { id: 't3', status: 'assigned', title: 'Assigned to Water Board', createdAt: daysAgo(9), createdBy: 'Admin' },
        { id: 't4', status: 'in_progress', title: 'Pipeline repair underway', createdAt: daysAgo(7), createdBy: 'Staff' },
        { id: 't5', status: 'resolved', title: 'Supply restored', description: 'Leak fixed, pressure normalized', createdAt: daysAgo(4), createdBy: 'Staff' },
      ],
      adminNotes: [],
      beforePhotos: [],
      afterPhotos: ['https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80'],
      assignedTo: 'Staff 2',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(4),
      resolvedAt: daysAgo(4),
    },
    {
      id: 'c4',
      complaintId: 'TP-2026-00004',
      villageId,
      fullName: 'Karthik M',
      mobile: '9001122334',
      category: 'garbage_collection',
      description: 'Garbage not collected near Market for a week. Foul smell affecting shops.',
      photos: ['https://images.unsplash.com/photo-1532996122724-e3c354a0b4da?w=600&q=80'],
      location: { lat: 13.2125, lng: 79.8322, address: 'Parigulam', areaId: 'parigulam' },
      status: 'assigned',
      supporters: 33,
      supporterIds: [],
      comments: [],
      timeline: [
        { id: 't1', status: 'submitted', title: 'Complaint submitted', createdAt: daysAgo(5), createdBy: 'Citizen' },
        { id: 't2', status: 'verified', title: 'Verified', createdAt: daysAgo(4), createdBy: 'Admin' },
        { id: 't3', status: 'assigned', title: 'Assigned to Sanitation Team', createdAt: daysAgo(3), createdBy: 'President' },
      ],
      adminNotes: [
        { id: 'n1', text: 'Schedule extra pickup tomorrow', createdAt: daysAgo(3), createdBy: 'President', isInternal: true },
      ],
      beforePhotos: [],
      afterPhotos: [],
      assignedTo: 'Staff 3',
      createdAt: daysAgo(5),
      updatedAt: daysAgo(3),
    },
    {
      id: 'c5',
      complaintId: 'TP-2026-00005',
      villageId,
      fullName: 'Selvi P',
      mobile: '9556677889',
      category: 'drainage',
      description: 'Blocked drainage near Arumbakkam causing flooding of nearby homes during rain.',
      photos: [],
      location: { lat: 13.2065, lng: 79.8365, address: 'Arumbakkam', areaId: 'arumbakkam' },
      status: 'verified',
      supporters: 12,
      supporterIds: [],
      comments: [],
      timeline: [
        { id: 't1', status: 'submitted', title: 'Complaint submitted', createdAt: daysAgo(2), createdBy: 'Citizen' },
        { id: 't2', status: 'verified', title: 'Verified by field officer', createdAt: daysAgo(1), createdBy: 'Staff' },
      ],
      adminNotes: [],
      beforePhotos: [],
      afterPhotos: [],
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'c6',
      complaintId: 'TP-2026-00006',
      villageId,
      fullName: 'John A',
      mobile: '9887766554',
      category: 'tree_fallen',
      description: 'Fallen tree blocking Hospital Road after last night storm. Needs urgent clearance.',
      photos: ['https://images.unsplash.com/photo-1440340219424-576a03425d95?w=600&q=80'],
      location: { lat: 13.2098, lng: 79.8345, address: 'Thiruppair Main', areaId: 'thiruppair' },
      status: 'closed',
      supporters: 9,
      supporterIds: [],
      comments: [],
      timeline: [
        { id: 't1', status: 'submitted', title: 'Complaint submitted', createdAt: daysAgo(15), createdBy: 'Citizen' },
        { id: 't2', status: 'verified', title: 'Verified', createdAt: daysAgo(15), createdBy: 'Admin' },
        { id: 't3', status: 'assigned', title: 'Assigned to Horticulture', createdAt: daysAgo(14), createdBy: 'Admin' },
        { id: 't4', status: 'in_progress', title: 'Clearance in progress', createdAt: daysAgo(14), createdBy: 'Staff' },
        { id: 't5', status: 'resolved', title: 'Road cleared', createdAt: daysAgo(13), createdBy: 'Staff' },
        { id: 't6', status: 'closed', title: 'Complaint closed', createdAt: daysAgo(12), createdBy: 'President' },
      ],
      adminNotes: [],
      beforePhotos: [],
      afterPhotos: [],
      assignedTo: 'Staff 4',
      createdAt: daysAgo(15),
      updatedAt: daysAgo(12),
      resolvedAt: daysAgo(13),
    },
    {
      id: 'c7',
      complaintId: 'TP-2026-00007',
      villageId,
      category: 'electricity',
      description: 'Frequent power cuts near Panchayat Office between 6–8 PM.',
      photos: [],
      location: { lat: 13.2115, lng: 79.836, address: 'Thiruppair Colony', areaId: 'thiruppair-colony' },
      status: 'in_progress',
      supporters: 15,
      supporterIds: [],
      comments: [],
      timeline: [
        { id: 't1', status: 'submitted', title: 'Complaint submitted', createdAt: daysAgo(4), createdBy: 'Citizen' },
        { id: 't2', status: 'verified', title: 'Verified', createdAt: daysAgo(3), createdBy: 'Admin' },
        { id: 't3', status: 'assigned', title: 'Escalated to TNEB', createdAt: daysAgo(3), createdBy: 'Admin' },
        { id: 't4', status: 'in_progress', title: 'Transformer inspection scheduled', createdAt: daysAgo(1), createdBy: 'Staff' },
      ],
      adminNotes: [],
      beforePhotos: [],
      afterPhotos: [],
      assignedTo: 'Staff 4',
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
    },
    {
      id: 'c8',
      complaintId: 'TP-2026-00008',
      villageId,
      fullName: 'Meena V',
      mobile: '9776655443',
      category: 'stray_animals',
      description: 'Pack of stray dogs near Bus Stand. Children afraid to walk to school.',
      photos: [],
      location: { lat: 13.208, lng: 79.8318, address: 'Bangarampettai East', areaId: 'bangarampettai' },
      status: 'submitted',
      supporters: 27,
      supporterIds: [],
      comments: [],
      timeline: [
        { id: 't1', status: 'submitted', title: 'Complaint submitted', createdAt: daysAgo(0), createdBy: 'Citizen' },
      ],
      adminNotes: [],
      beforePhotos: [],
      afterPhotos: [],
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
  ]
}

const sampleActivity = () => [
  {
    id: 'al1',
    action: 'status_update',
    details: 'TP-2026-00001 moved to In Progress',
    actor: 'staff1@nammakural.online',
    createdAt: daysAgo(2),
    complaintId: 'TP-2026-00001',
  },
  {
    id: 'al2',
    action: 'assign',
    details: 'TP-2026-00004 assigned to Sanitation Team',
    actor: 'president@nammakural.online',
    createdAt: daysAgo(3),
    complaintId: 'TP-2026-00004',
  },
  {
    id: 'al3',
    action: 'resolve',
    details: 'TP-2026-00003 marked Resolved',
    actor: 'staff2@nammakural.online',
    createdAt: daysAgo(4),
    complaintId: 'TP-2026-00003',
  },
]

async function seedWithAdmin() {
  const { initializeApp, getApps, cert, applicationDefault } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json'
  const projectId = env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID
  if (!getApps().length) {
    if (existsSync(resolve(saPath))) {
      const sa = JSON.parse(readFileSync(saPath, 'utf8'))
      initializeApp({ credential: cert(sa), projectId: projectId || sa.project_id })
    } else {
      initializeApp({ credential: applicationDefault(), projectId })
    }
  }
  return getFirestore()
}

async function seedWithClient() {
  const { initializeApp, getApps } = await import('firebase/app')
  const firestore = await import('firebase/firestore')
  const apiKey = env.VITE_FIREBASE_API_KEY
  const projectId = env.VITE_FIREBASE_PROJECT_ID
  if (!apiKey || !projectId || apiKey === 'your_api_key' || apiKey === 'demo-api-key') {
    throw new Error(
      'No Firebase credentials. Add serviceAccount.json or fill VITE_FIREBASE_* in .env, then set SEED_TARGET=cloud.',
    )
  }
  if (!getApps().length) {
    initializeApp({
      apiKey,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    })
  }
  const db = firestore.getFirestore()
  return {
    async getByComplaintId(complaintId) {
      const q = firestore.query(
        firestore.collection(db, 'villages', villageId, 'complaints'),
        firestore.where('complaintId', '==', complaintId),
        firestore.limit(1),
      )
      const snap = await firestore.getDocs(q)
      return snap.empty ? null : snap.docs[0]
    },
    async setComplaint(id, data) {
      await firestore.setDoc(firestore.doc(db, 'villages', villageId, 'complaints', id), data)
    },
    async setActivity(id, data) {
      await firestore.setDoc(firestore.doc(db, 'villages', villageId, 'activityLog', id), data)
    },
    async setVillage() {
      await firestore.setDoc(
        firestore.doc(db, 'villages', villageId),
        { id: villageId, name: 'Thiruppair', updatedAt: new Date().toISOString() },
        { merge: true },
      )
    },
    async setCounters(seq) {
      await firestore.setDoc(
        firestore.doc(db, 'villages', villageId, 'meta', 'counters'),
        { complaintSeq: seq },
        { merge: true },
      )
    },
    async getActivity(id) {
      const snap = await firestore.getDoc(firestore.doc(db, 'villages', villageId, 'activityLog', id))
      return snap.exists() ? snap : null
    },
  }
}

async function adminApi(db) {
  const col = db.collection('villages').doc(villageId)
  return {
    async getByComplaintId(complaintId) {
      const snap = await col.collection('complaints').where('complaintId', '==', complaintId).limit(1).get()
      return snap.empty ? null : snap.docs[0]
    },
    async setComplaint(id, data) {
      await col.collection('complaints').doc(id).set(data)
    },
    async setActivity(id, data) {
      await col.collection('activityLog').doc(id).set(data)
    },
    async setVillage() {
      await col.set({ id: villageId, name: 'Thiruppair', updatedAt: new Date().toISOString() }, { merge: true })
    },
    async setCounters(seq) {
      await col.collection('meta').doc('counters').set({ complaintSeq: seq }, { merge: true })
    },
    async getActivity(id) {
      const snap = await col.collection('activityLog').doc(id).get()
      return snap.exists ? snap : null
    },
  }
}

let api
let target = 'emulator'

if (useCloud && existsSync(saFile)) {
  target = 'cloud-admin'
  api = await adminApi(await seedWithAdmin())
} else if (useCloud) {
  target = 'cloud-client'
  api = await seedWithClient()
} else {
  process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'
  const { initializeApp, getApps } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')
  const projectId = env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || 'demo-mylocalvoice'
  if (!getApps().length) initializeApp({ projectId })
  target = 'emulator'
  api = await adminApi(getFirestore())
}

console.log(`Seeding complaints → village=${villageId} target=${target}`)

await api.setVillage()

let created = 0
let skipped = 0
const complaints = sampleComplaints()
for (const complaint of complaints) {
  const existing = await api.getByComplaintId(complaint.complaintId)
  if (existing) {
    console.log(`skip ${complaint.complaintId}`)
    skipped += 1
    continue
  }
  const payload = omitUndefined({ ...complaint, id: complaint.id })
  await api.setComplaint(complaint.id, payload)
  console.log(`✓ ${complaint.complaintId}  ${complaint.status}`)
  created += 1
}

for (const entry of sampleActivity()) {
  const existing = await api.getActivity(entry.id)
  if (existing) continue
  await api.setActivity(entry.id, omitUndefined(entry))
}

const maxSeq = complaints.reduce((max, c) => {
  const n = Number.parseInt(String(c.complaintId).split('-').pop() || '0', 10)
  return Number.isFinite(n) ? Math.max(max, n) : max
}, 0)
await api.setCounters(maxSeq)

console.log(`Done. created=${created} skipped=${skipped} nextSeq=${maxSeq + 1}`)
console.log('Refresh Admin → Complaints on the live site.')
process.exit(0)
