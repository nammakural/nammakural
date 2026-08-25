/**
 * Direct Firestore REST access used when the Firebase SDK is not initialized
 * (typical Vercel build missing VITE_FIREBASE_* keys). Rules currently allow
 * public read/create/update on complaints.
 */
import type { ActivityLogEntry, Complaint } from '@/types'

const PROJECT_ID =
  (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || 'nammakural-b1878'

function documentsUrl(...segments: string[]) {
  const path = segments.filter(Boolean).join('/')
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`
}

type RestValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { arrayValue: { values?: RestValue[] } }
  | { mapValue: { fields?: Record<string, RestValue> } }

function decodeValue(value: RestValue | undefined): unknown {
  if (!value) return undefined
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('booleanValue' in value) return value.booleanValue
  if ('nullValue' in value) return null
  if ('arrayValue' in value) return (value.arrayValue.values || []).map((item) => decodeValue(item))
  if ('mapValue' in value) return decodeFields(value.mapValue.fields)
  return undefined
}

function decodeFields(fields?: Record<string, RestValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!fields) return out
  for (const [key, value] of Object.entries(fields)) {
    const decoded = decodeValue(value)
    if (decoded !== undefined) out[key] = decoded
  }
  return out
}

function encodeValue(value: unknown): RestValue | undefined {
  if (value === undefined) return undefined
  if (value === null) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }
  if (Array.isArray(value)) {
    const values = value.map(encodeValue).filter((item): item is RestValue => item !== undefined)
    return { arrayValue: { values } }
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: encodeFields(value as Record<string, unknown>) } }
  }
  return { stringValue: String(value) }
}

function toComplaint(id: string, data: Record<string, unknown>): Complaint {
  return {
    id,
    complaintId: String(data.complaintId || id),
    villageId: String(data.villageId || ''),
    fullName: data.fullName as string | undefined,
    mobile: data.mobile as string | undefined,
    category: data.category as Complaint['category'],
    description: String(data.description || ''),
    photos: (data.photos as string[]) ?? [],
    voiceUrl: data.voiceUrl as string | undefined,
    location: (data.location as Complaint['location']) || { lat: 0, lng: 0 },
    status: data.status as Complaint['status'],
    supporters: Number(data.supporters ?? 1),
    supporterIds: (data.supporterIds as string[]) ?? [],
    comments: (data.comments as Complaint['comments']) ?? [],
    timeline: (data.timeline as Complaint['timeline']) ?? [],
    adminNotes: (data.adminNotes as Complaint['adminNotes']) ?? [],
    beforePhotos: (data.beforePhotos as string[]) ?? [],
    afterPhotos: (data.afterPhotos as string[]) ?? [],
    assignedTo: data.assignedTo as string | undefined,
    createdAt: String(data.createdAt || ''),
    updatedAt: String(data.updatedAt || ''),
    resolvedAt: data.resolvedAt as string | undefined,
    purged: Boolean(data.purged),
  }
}

function encodeFields(data: Record<string, unknown>): Record<string, RestValue> {
  const fields: Record<string, RestValue> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    const encoded = encodeValue(value)
    if (encoded) fields[key] = encoded
  }
  return fields
}

async function restGet(url: string): Promise<Response> {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Firestore REST ${res.status}: ${text.slice(0, 180)}`)
  }
  return res
}

export async function restListComplaints(villageId: string): Promise<Complaint[]> {
  const res = await restGet(`${documentsUrl('villages', villageId, 'complaints')}?pageSize=200`)
  const json = (await res.json()) as { documents?: { name: string; fields?: Record<string, RestValue> }[] }
  return (json.documents || [])
    .map((doc) => {
      const id = doc.name.split('/').pop() || ''
      return toComplaint(id, decodeFields(doc.fields))
    })
    .filter((c) => !c.purged)
}

export async function restGetComplaint(villageId: string, docId: string): Promise<Complaint | null> {
  const res = await fetch(documentsUrl('villages', villageId, 'complaints', docId))
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Firestore REST ${res.status}: ${text.slice(0, 180)}`)
  }
  const json = (await res.json()) as { name: string; fields?: Record<string, RestValue> }
  const id = json.name.split('/').pop() || docId
  const complaint = toComplaint(id, decodeFields(json.fields))
  return complaint.purged ? null : complaint
}

export async function restFindComplaint(villageId: string, idOrComplaintId: string): Promise<Complaint | null> {
  const byDoc = await restGetComplaint(villageId, idOrComplaintId)
  if (byDoc) return byDoc
  const all = await restListComplaints(villageId)
  const needle = idOrComplaintId.toLowerCase()
  return (
    all.find((c) => c.complaintId.toLowerCase() === needle || c.id.toLowerCase() === needle) ?? null
  )
}

export async function restSetComplaint(villageId: string, complaint: Complaint): Promise<void> {
  const url = documentsUrl('villages', villageId, 'complaints', complaint.id)
  const write = async (payload: Complaint) => {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: encodeFields({ ...payload }) }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Firestore REST write ${res.status}: ${text.slice(0, 180)}`)
    }
  }

  try {
    await write(complaint)
  } catch (err) {
    if (complaint.photos.length === 0 && !complaint.voiceUrl) throw err
    await write({ ...complaint, photos: [], voiceUrl: undefined })
  }
}

export async function restDeleteComplaint(villageId: string, docId: string): Promise<void> {
  const res = await fetch(documentsUrl('villages', villageId, 'complaints', docId), { method: 'DELETE' })
  if (!res.ok && res.status !== 404) {
    const text = await res.text()
    throw new Error(`Firestore REST delete ${res.status}: ${text.slice(0, 180)}`)
  }
}

export async function restListActivity(villageId: string): Promise<ActivityLogEntry[]> {
  const res = await restGet(`${documentsUrl('villages', villageId, 'activityLog')}?pageSize=100`)
  const json = (await res.json()) as { documents?: { name: string; fields?: Record<string, RestValue> }[] }
  return (json.documents || [])
    .map((doc) => {
      const data = decodeFields(doc.fields)
      return {
        id: (data.id as string) || doc.name.split('/').pop() || '',
        action: String(data.action || ''),
        details: String(data.details || ''),
        actor: String(data.actor || ''),
        createdAt: String(data.createdAt || ''),
        complaintId: data.complaintId as string | undefined,
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function restSetActivity(villageId: string, entry: ActivityLogEntry): Promise<void> {
  const url = documentsUrl('villages', villageId, 'activityLog', entry.id)
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFields({ ...entry }) }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Firestore REST activity ${res.status}: ${text.slice(0, 180)}`)
  }
}

export async function restSetCounter(villageId: string, seq: number): Promise<void> {
  const url = documentsUrl('villages', villageId, 'meta', 'counters')
  await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFields({ complaintSeq: seq }) }),
  })
}

export const firestoreProjectId = PROJECT_ID
