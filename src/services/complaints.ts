import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  deleteDoc,
  type DocumentData,
} from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  CATEGORY_LABELS,
  DEFAULT_VILLAGE,
  type ComplaintCategory,
  type ComplaintStatus,
  STATUS_LABELS,
} from '@/constants'
import type {
  ActivityLogEntry,
  Announcement,
  Complaint,
  DashboardStats,
  ReportIssueForm,
} from '@/types'
import {
  DEMO_ADMINS,
  mockActivityLog,
  mockAnnouncements,
  mockComplaints,
} from '@/data/mockData'
import {
  avgResolutionDays,
  generateComplaintId,
  isPendingStatus,
  parseComplaintSequence,
  compareComplaintIdDesc,
} from '@/utils'
import { canAssignComplaints, canDeleteComplaints, canEditComplaint, canSetStatus } from '@/utils/roles'
import { auth, db, useMockData } from '@/lib/firebase'
import { notifyComplaintStatus } from '@/services/notifications'
import { uploadComplaintMedia } from '@/services/mediaUpload'
import {
  restDeleteComplaint,
  restFindComplaint,
  restListActivity,
  restListComplaints,
  restSetActivity,
  restSetComplaint,
  restSetCounter,
} from '@/services/firestoreRest'
import type { AdminUser } from '@/types'

/** In-memory store for mock mode (mutates safely for demo) */
let complaintsStore: Complaint[] = structuredClone(mockComplaints)
let activityStore: ActivityLogEntry[] = structuredClone(mockActivityLog)
let sequence = complaintsStore.length + 1

/** Live Vercel builds must never "succeed" by saving only in this browser. */
const useBrowserMemory = useMockData && !import.meta.env.PROD

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

async function appendActivityRest(
  villageId: string,
  entry: Omit<ActivityLogEntry, 'id'> & { id?: string },
) {
  const id = entry.id || `al_${Date.now()}`
  await restSetActivity(villageId, {
    id,
    action: entry.action,
    details: entry.details,
    actor: entry.actor,
    createdAt: entry.createdAt,
    complaintId: entry.complaintId,
  })
}

function requireDb() {
  if (!db) {
    throw new Error(
      'Firebase is not connected. Copy .env.example → .env, fill Firebase keys, set VITE_USE_MOCK_DATA=false, then restart the app.',
    )
  }
  return db
}

function requireAuth() {
  if (!auth) {
    throw new Error(
      'Firebase Auth is not connected. Copy .env.example → .env, fill Firebase keys, set VITE_USE_MOCK_DATA=false, then restart the app.',
    )
  }
  return auth
}

/** Firestore rejects `undefined` field values (including nested). */
function stripUndefined(value: unknown): unknown {
  if (value === undefined) return undefined
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)).filter((item) => item !== undefined)
  }
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v === undefined) continue
    const cleaned = stripUndefined(v)
    if (cleaned !== undefined) out[k] = cleaned
  }
  return out
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  return stripUndefined(obj) as T
}

function complaintsCol(villageId: string) {
  return collection(requireDb(), 'villages', villageId, 'complaints')
}

function activityCol(villageId: string) {
  return collection(requireDb(), 'villages', villageId, 'activityLog')
}

function docToComplaint(id: string, data: DocumentData): Complaint {
  return {
    id,
    complaintId: data.complaintId,
    villageId: data.villageId,
    fullName: data.fullName,
    mobile: data.mobile,
    category: data.category,
    description: data.description,
    photos: data.photos ?? [],
    voiceUrl: data.voiceUrl,
    location: data.location,
    status: data.status,
    supporters: data.supporters ?? 1,
    supporterIds: data.supporterIds ?? [],
    comments: data.comments ?? [],
    timeline: data.timeline ?? [],
    adminNotes: data.adminNotes ?? [],
    beforePhotos: data.beforePhotos ?? [],
    afterPhotos: data.afterPhotos ?? [],
    assignedTo: data.assignedTo,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    resolvedAt: data.resolvedAt,
    purged: Boolean(data.purged),
  }
}

async function findComplaintLive(
  idOrComplaintId: string,
  villageId: string = DEFAULT_VILLAGE.id,
): Promise<{ ref: ReturnType<typeof doc>; complaint: Complaint } | null> {
  const firestore = requireDb()
  const byIdRef = doc(firestore, 'villages', villageId, 'complaints', idOrComplaintId)
  const byIdSnap = await getDoc(byIdRef)
  if (byIdSnap.exists()) {
    return { ref: byIdRef, complaint: docToComplaint(byIdSnap.id, byIdSnap.data()) }
  }

  const q = query(
    complaintsCol(villageId),
    where('complaintId', '==', idOrComplaintId.toUpperCase()),
    limit(1),
  )
  const snap = await getDocs(q)
  if (!snap.empty) {
    const d = snap.docs[0]
    return { ref: d.ref, complaint: docToComplaint(d.id, d.data()) }
  }

  // Case-insensitive fallback for older docs
  const all = await getDocs(query(complaintsCol(villageId), orderBy('createdAt', 'desc')))
  const match = all.docs.find((d) => {
    const cid = String(d.data().complaintId || '')
    return cid.toLowerCase() === idOrComplaintId.toLowerCase() || d.id === idOrComplaintId
  })
  if (!match) return null
  return { ref: match.ref, complaint: docToComplaint(match.id, match.data()) }
}

async function nextComplaintSequence(villageId: string, floor = 0): Promise<number> {
  const firestore = requireDb()
  const counterRef = doc(firestore, 'villages', villageId, 'meta', 'counters')
  return runTransaction(firestore, async (tx) => {
    const snap = await tx.get(counterRef)
    const stored = (snap.data()?.complaintSeq as number | undefined) ?? 0
    const value = Math.max(stored, floor) + 1
    tx.set(counterRef, { complaintSeq: value }, { merge: true })
    return value
  })
}

/** Highest numeric ID already stored (so new IDs continue in order: 1,2,3…) */
async function maxExistingComplaintSeq(villageId: string): Promise<number> {
  const snap = await getDocs(complaintsCol(villageId))
  let max = 0
  snap.docs.forEach((d) => {
    if (d.data().purged) return
    const n = parseComplaintSequence(String(d.data().complaintId || ''))
    if (n > max) max = n
  })
  return max
}

async function appendActivityLive(
  villageId: string,
  entry: Omit<ActivityLogEntry, 'id'> & { id?: string },
) {
  const id = entry.id || `al_${Date.now()}`
  const ref = doc(activityCol(villageId), id)
  await setDoc(
    ref,
    omitUndefined({
      id,
      action: entry.action,
      details: entry.details,
      actor: entry.actor,
      createdAt: entry.createdAt,
      complaintId: entry.complaintId,
    }),
  )
}

function filterComplaints(
  list: Complaint[],
  params: {
    complaintId?: string
    mobile?: string
    category?: ComplaintCategory | ''
    status?: ComplaintStatus | ''
    query?: string
  },
): Complaint[] {
  let result = [...list]
  if (params.complaintId) {
    const q = params.complaintId.toLowerCase()
    result = result.filter((c) => c.complaintId.toLowerCase().includes(q))
  }
  if (params.mobile) {
    result = result.filter((c) => c.mobile?.includes(params.mobile!))
  }
  if (params.category) {
    result = result.filter((c) => c.category === params.category)
  }
  if (params.status) {
    result = result.filter((c) => c.status === params.status)
  }
  if (params.query) {
    const q = params.query.toLowerCase()
    result = result.filter(
      (c) =>
        c.description.toLowerCase().includes(q) ||
        c.complaintId.toLowerCase().includes(q) ||
        c.location.address?.toLowerCase().includes(q) ||
        CATEGORY_LABELS[c.category].toLowerCase().includes(q),
    )
  }
  return result.sort((a, b) => compareComplaintIdDesc(a.complaintId, b.complaintId))
}

function buildDashboardStats(list: Complaint[]): DashboardStats {
  const today = new Date().toDateString()
  const pending = list.filter((c) => isPendingStatus(c.status)).length
  const inProgress = list.filter((c) => c.status === 'in_progress').length
  const resolved = list.filter((c) => c.status === 'resolved').length
  const closed = list.filter((c) => c.status === 'closed').length

  const byCat = new Map<string, number>()
  list.forEach((c) => byCat.set(c.category, (byCat.get(c.category) || 0) + 1))
  let mostReportedCategory: ComplaintCategory | null = null
  let max = 0
  byCat.forEach((count, cat) => {
    if (count > max) {
      max = count
      mostReportedCategory = cat as ComplaintCategory
    }
  })

  const trendMap = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    trendMap.set(d.toISOString().slice(0, 10), 0)
  }
  list.forEach((c) => {
    const key = c.createdAt.slice(0, 10)
    if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) || 0) + 1)
  })

  return {
    total: list.length,
    today: list.filter((c) => new Date(c.createdAt).toDateString() === today).length,
    pending,
    inProgress,
    resolved,
    closed,
    avgResolutionDays: avgResolutionDays(list),
    mostReportedCategory,
    trend: [...trendMap.entries()].map(([date, count]) => ({ date, count })),
    byCategory: [...byCat.entries()].map(([category, count]) => ({
      category: CATEGORY_LABELS[category as ComplaintCategory] || category,
      count,
    })),
    byStatus: Object.entries(
      list.reduce<Record<string, number>>((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1
        return acc
      }, {}),
    ).map(([status, count]) => ({
      status: STATUS_LABELS[status as ComplaintStatus] || status,
      count,
    })),
  }
}

export async function getComplaints(villageId: string = DEFAULT_VILLAGE.id): Promise<Complaint[]> {
  if (useMockData) {
    try {
      const live = await restListComplaints(villageId)
      return live.sort((a, b) => compareComplaintIdDesc(a.complaintId, b.complaintId))
    } catch (err) {
      if (!useBrowserMemory) throw err
    }
    await delay()
    return complaintsStore
      .filter((c) => c.villageId === villageId && !c.purged)
      .sort((a, b) => compareComplaintIdDesc(a.complaintId, b.complaintId))
  }

  const snap = await getDocs(query(complaintsCol(villageId), orderBy('createdAt', 'desc')))
  return snap.docs
    .map((d) => docToComplaint(d.id, d.data()))
    .filter((c) => !c.purged)
    .sort((a, b) => compareComplaintIdDesc(a.complaintId, b.complaintId))
}

export async function getComplaintById(
  complaintId: string,
  villageId: string = DEFAULT_VILLAGE.id,
): Promise<Complaint | null> {
  if (useMockData) {
    try {
      const found = await restFindComplaint(villageId, complaintId)
      if (found) return found
    } catch {
      // fall through to in-memory demo data
    }
    await delay()
    return (
      complaintsStore.find(
        (c) => c.complaintId.toLowerCase() === complaintId.toLowerCase() || c.id === complaintId,
      ) ?? null
    )
  }

  const found = await findComplaintLive(complaintId, villageId)
  return found?.complaint ?? null
}

export async function searchComplaints(params: {
  complaintId?: string
  mobile?: string
  category?: ComplaintCategory | ''
  status?: ComplaintStatus | ''
  query?: string
  villageId?: string
}): Promise<Complaint[]> {
  const villageId = params.villageId ?? DEFAULT_VILLAGE.id
  const list = await getComplaints(villageId)
  return filterComplaints(list, params)
}

export async function createComplaint(form: ReportIssueForm, villageId: string = DEFAULT_VILLAGE.id) {
  const now = new Date().toISOString()

  if (useMockData) {
    try {
      const liveList = await restListComplaints(villageId)
      let photoUrls: string[] = []
      let voiceUrl: string | undefined
      const docId = `c_${Date.now()}`
      try {
        const media = await uploadComplaintMedia(villageId, docId, form.photos, form.voiceFile)
        photoUrls = media.photoUrls
        voiceUrl = media.voiceUrl
      } catch {
        photoUrls = []
      }
      const maxSeq = liveList.reduce((max, c) => Math.max(max, parseComplaintSequence(c.complaintId)), 0)
      const seq = maxSeq + 1
      const complaintId = generateComplaintId(DEFAULT_VILLAGE.code, seq)
      const complaint: Complaint = {
        id: docId,
        complaintId,
        villageId,
        fullName: form.fullName,
        mobile: form.mobile,
        category: form.category,
        description: form.description,
        photos: photoUrls,
        voiceUrl,
        location: form.location,
        status: 'submitted',
        supporters: 1,
        supporterIds: ['self'],
        comments: [],
        timeline: [
          {
            id: `t_${Date.now()}`,
            status: 'submitted',
            title: 'Complaint submitted',
            createdAt: now,
            createdBy: form.fullName || 'Citizen',
          },
        ],
        adminNotes: [],
        beforePhotos: [],
        afterPhotos: [],
        createdAt: now,
        updatedAt: now,
      }
      await restSetComplaint(villageId, complaint)
      await appendActivityRest(villageId, {
        action: 'create',
        details: `${complaintId} created (${CATEGORY_LABELS[form.category]})`,
        actor: form.fullName || 'Citizen',
        createdAt: now,
        complaintId,
      })
      await restSetCounter(villageId, seq)
      if (form.mobile) {
        await notifyComplaintStatus(form.mobile, undefined, complaintId, STATUS_LABELS.submitted)
      }
      return complaint
    } catch (err) {
      if (!useBrowserMemory) {
        throw err instanceof Error ? err : new Error('Could not save complaint to the database')
      }
    }

    await delay(400)
    const complaintId = generateComplaintId(DEFAULT_VILLAGE.code, sequence++)
    const photoUrls = form.photos.map((f) => URL.createObjectURL(f))
    const voiceUrl = form.voiceFile ? URL.createObjectURL(form.voiceFile) : undefined

    const complaint: Complaint = {
      id: `c_${Date.now()}`,
      complaintId,
      villageId,
      fullName: form.fullName,
      mobile: form.mobile,
      category: form.category,
      description: form.description,
      photos: photoUrls,
      voiceUrl,
      location: form.location,
      status: 'submitted',
      supporters: 1,
      supporterIds: ['self'],
      comments: [],
      timeline: [
        {
          id: `t_${Date.now()}`,
          status: 'submitted',
          title: 'Complaint submitted',
          createdAt: now,
          createdBy: form.fullName || 'Citizen',
        },
      ],
      adminNotes: [],
      beforePhotos: [],
      afterPhotos: [],
      createdAt: now,
      updatedAt: now,
    }

    complaintsStore = [complaint, ...complaintsStore]
    activityStore = [
      {
        id: `al_${Date.now()}`,
        action: 'create',
        details: `${complaintId} created (${CATEGORY_LABELS[form.category]})`,
        actor: form.fullName || 'Citizen',
        createdAt: now,
        complaintId,
      },
      ...activityStore,
    ]

    if (form.mobile) {
      await notifyComplaintStatus(form.mobile, undefined, complaintId, STATUS_LABELS.submitted)
    }

    return complaint
  }

  // Media must never block complaint creation
  const docRef = doc(complaintsCol(villageId))
  let photoUrls: string[] = []
  let voiceUrl: string | undefined
  let mediaWarning: string | undefined
  try {
    const media = await uploadComplaintMedia(villageId, docRef.id, form.photos, form.voiceFile)
    photoUrls = media.photoUrls
    voiceUrl = media.voiceUrl
    mediaWarning = media.mediaWarning
  } catch {
    mediaWarning = 'Could not attach media — complaint was still submitted.'
  }

  const floor = await maxExistingComplaintSeq(villageId)
  const seq = await nextComplaintSequence(villageId, floor)
  const complaintId = generateComplaintId(DEFAULT_VILLAGE.code, seq)

  const complaint: Complaint = {
    id: docRef.id,
    complaintId,
    villageId,
    fullName: form.fullName,
    mobile: form.mobile,
    category: form.category,
    description: form.description,
    photos: photoUrls,
    voiceUrl,
    location: form.location,
    status: 'submitted',
    supporters: 1,
    supporterIds: ['self'],
    comments: [],
    timeline: [
      {
        id: `t_${Date.now()}`,
        status: 'submitted',
        title: 'Complaint submitted',
        createdAt: now,
        createdBy: form.fullName || 'Citizen',
      },
    ],
    adminNotes: [],
    beforePhotos: [],
    afterPhotos: [],
    createdAt: now,
    updatedAt: now,
  }

  await setDoc(
    docRef,
    omitUndefined({
      ...complaint,
      id: docRef.id,
    } as unknown as Record<string, unknown>),
  )

  await appendActivityLive(villageId, {
    action: 'create',
    details: `${complaintId} created (${CATEGORY_LABELS[form.category]})`,
    actor: form.fullName || 'Citizen',
    createdAt: now,
    complaintId,
  })

  if (form.mobile) {
    await notifyComplaintStatus(form.mobile, undefined, complaintId, STATUS_LABELS.submitted)
  }

  return { ...complaint, mediaWarning } as Complaint & { mediaWarning?: string }
}

export async function upvoteComplaint(id: string, voterKey: string) {
  if (useMockData) {
    try {
      const c = await restFindComplaint(DEFAULT_VILLAGE.id, id)
      if (c) {
        if (c.supporterIds.includes(voterKey)) return c
        const updated: Complaint = {
          ...c,
          supporterIds: [...c.supporterIds, voterKey],
          supporters: c.supporters + 1,
          updatedAt: new Date().toISOString(),
        }
        await restSetComplaint(c.villageId, updated)
        return updated
      }
    } catch {
      // fall through
    }
    await delay()
    const c = complaintsStore.find((x) => x.id === id || x.complaintId === id)
    if (!c) return null
    if (c.supporterIds.includes(voterKey)) return c
    c.supporterIds.push(voterKey)
    c.supporters += 1
    c.updatedAt = new Date().toISOString()
    return { ...c }
  }

  const found = await findComplaintLive(id)
  if (!found) return null
  if (found.complaint.supporterIds.includes(voterKey)) return found.complaint

  const updated: Complaint = {
    ...found.complaint,
    supporterIds: [...found.complaint.supporterIds, voterKey],
    supporters: found.complaint.supporters + 1,
    updatedAt: new Date().toISOString(),
  }
  await updateDoc(found.ref, {
    supporterIds: updated.supporterIds,
    supporters: updated.supporters,
    updatedAt: updated.updatedAt,
  })
  return updated
}

export async function addComment(id: string, authorName: string, text: string) {
  if (useMockData) {
    try {
      const c = await restFindComplaint(DEFAULT_VILLAGE.id, id)
      if (c) {
        const comment = {
          id: `cm_${Date.now()}`,
          authorName,
          text,
          createdAt: new Date().toISOString(),
        }
        const updated: Complaint = {
          ...c,
          comments: [...c.comments, comment],
          updatedAt: comment.createdAt,
        }
        await restSetComplaint(c.villageId, updated)
        return updated
      }
    } catch {
      // fall through
    }
    await delay()
    const c = complaintsStore.find((x) => x.id === id || x.complaintId === id)
    if (!c) return null
    c.comments.push({
      id: `cm_${Date.now()}`,
      authorName,
      text,
      createdAt: new Date().toISOString(),
    })
    c.updatedAt = new Date().toISOString()
    return { ...c }
  }

  const found = await findComplaintLive(id)
  if (!found) return null
  const comment = {
    id: `cm_${Date.now()}`,
    authorName,
    text,
    createdAt: new Date().toISOString(),
  }
  const updated: Complaint = {
    ...found.complaint,
    comments: [...found.complaint.comments, comment],
    updatedAt: comment.createdAt,
  }
  await updateDoc(found.ref, {
    comments: updated.comments,
    updatedAt: updated.updatedAt,
  })
  return updated
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  actor: string,
  note?: string,
  assignedTo?: string,
  role?: AdminUser['role'],
  editor?: Pick<AdminUser, 'role' | 'displayName'> | null,
) {
  if (role && !canSetStatus(role, status)) {
    throw new Error(`Your role cannot set status to "${STATUS_LABELS[status]}"`)
  }
  if (assignedTo !== undefined && assignedTo !== '' && role && !canAssignComplaints(role)) {
    throw new Error('Only the Village President can assign complaints')
  }

  if (useMockData) {
    try {
      const c = await restFindComplaint(DEFAULT_VILLAGE.id, id)
      if (c) {
        if (editor && !canEditComplaint(editor, c)) {
          throw new Error(
            c.assignedTo
              ? `Only ${c.assignedTo} (or the President) can edit this complaint`
              : 'This complaint is not assigned to you',
          )
        }
        const now = new Date().toISOString()
        const updated: Complaint = {
          ...c,
          status,
          updatedAt: now,
          assignedTo:
            canAssignComplaints(role) && assignedTo !== undefined ? assignedTo || undefined : c.assignedTo,
          resolvedAt: status === 'resolved' ? now : c.resolvedAt,
          timeline: [
            ...c.timeline,
            {
              id: `t_${Date.now()}`,
              status,
              title: `Status updated to ${STATUS_LABELS[status]}`,
              ...(note ? { description: note } : {}),
              createdAt: now,
              createdBy: actor,
            },
          ],
          adminNotes: note
            ? [
                ...c.adminNotes,
                {
                  id: `n_${Date.now()}`,
                  text: note,
                  createdAt: now,
                  createdBy: actor,
                  isInternal: false,
                },
              ]
            : c.adminNotes,
        }
        await restSetComplaint(c.villageId, updated)
        await appendActivityRest(c.villageId, {
          action: 'status_update',
          details: `${c.complaintId} → ${STATUS_LABELS[status]}`,
          actor,
          createdAt: now,
          complaintId: c.complaintId,
        })
        await notifyComplaintStatus(c.mobile, undefined, c.complaintId, STATUS_LABELS[status])
        return updated
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Only')) throw err
    }
    await delay()
    const c = complaintsStore.find((x) => x.id === id || x.complaintId === id)
    if (!c) return null
    if (editor && !canEditComplaint(editor, c)) {
      throw new Error(
        c.assignedTo
          ? `Only ${c.assignedTo} (or the President) can edit this complaint`
          : 'This complaint is not assigned to you',
      )
    }
    const now = new Date().toISOString()
    c.status = status
    c.updatedAt = now
    if (canAssignComplaints(role) && assignedTo !== undefined) {
      c.assignedTo = assignedTo || undefined
    }
    if (status === 'resolved') c.resolvedAt = now
    c.timeline.push({
      id: `t_${Date.now()}`,
      status,
      title: `Status updated to ${STATUS_LABELS[status]}`,
      ...(note ? { description: note } : {}),
      createdAt: now,
      createdBy: actor,
    })
    if (note) {
      c.adminNotes.push({
        id: `n_${Date.now()}`,
        text: note,
        createdAt: now,
        createdBy: actor,
        isInternal: false,
      })
    }
    activityStore = [
      {
        id: `al_${Date.now()}`,
        action: 'status_update',
        details: `${c.complaintId} → ${STATUS_LABELS[status]}`,
        actor,
        createdAt: now,
        complaintId: c.complaintId,
      },
      ...activityStore,
    ]
    await notifyComplaintStatus(c.mobile, undefined, c.complaintId, STATUS_LABELS[status])
    return { ...c }
  }

  const found = await findComplaintLive(id)
  if (!found) return null
  const c = found.complaint
  if (editor && !canEditComplaint(editor, c)) {
    throw new Error(
      c.assignedTo
        ? `Only ${c.assignedTo} (or the President) can edit this complaint`
        : 'This complaint is not assigned to you',
    )
  }

  const now = new Date().toISOString()
  const timelineEvent = {
    id: `t_${Date.now()}`,
    status,
    title: `Status updated to ${STATUS_LABELS[status]}`,
    ...(note ? { description: note } : {}),
    createdAt: now,
    createdBy: actor,
  }
  const timeline = [...c.timeline, timelineEvent]
  const adminNotes = note
    ? [
        ...c.adminNotes,
        {
          id: `n_${Date.now()}`,
          text: note,
          createdAt: now,
          createdBy: actor,
          isInternal: false,
        },
      ]
    : c.adminNotes

  const patch: Record<string, unknown> = {
    status,
    updatedAt: now,
    timeline,
    adminNotes,
  }
  if (canAssignComplaints(role) && assignedTo !== undefined) {
    patch.assignedTo = assignedTo || null
  }
  if (status === 'resolved') patch.resolvedAt = now

  await updateDoc(found.ref, omitUndefined(patch))
  await appendActivityLive(c.villageId, {
    action: 'status_update',
    details: `${c.complaintId} → ${STATUS_LABELS[status]}`,
    actor,
    createdAt: now,
    complaintId: c.complaintId,
  })
  await notifyComplaintStatus(c.mobile, undefined, c.complaintId, STATUS_LABELS[status])

  return {
    ...c,
    status,
    updatedAt: now,
    timeline,
    adminNotes,
    assignedTo:
      canAssignComplaints(role) && assignedTo !== undefined
        ? assignedTo || undefined
        : c.assignedTo,
    resolvedAt: status === 'resolved' ? now : c.resolvedAt,
  }
}

export async function deleteComplaint(
  id: string,
  actor: string,
  role?: AdminUser['role'],
) {
  if (!canDeleteComplaints(role)) {
    throw new Error('Only Admin can delete complaints')
  }

  if (useMockData) {
    try {
      const found = await restFindComplaint(DEFAULT_VILLAGE.id, id)
      if (found) {
        await restDeleteComplaint(found.villageId, found.id)
        await appendActivityRest(found.villageId, {
          action: 'delete',
          details: `${found.complaintId} permanently deleted`,
          actor,
          createdAt: new Date().toISOString(),
          complaintId: found.complaintId,
        })
        return true
      }
    } catch {
      // fall through
    }
    await delay()
    const index = complaintsStore.findIndex((x) => x.id === id || x.complaintId === id)
    if (index < 0) return false
    const removed = complaintsStore[index]
    complaintsStore = complaintsStore.filter((_, i) => i !== index)
    activityStore = [
      {
        id: `al_${Date.now()}`,
        action: 'delete',
        details: `${removed.complaintId} permanently deleted`,
        actor,
        createdAt: new Date().toISOString(),
        complaintId: removed.complaintId,
      },
      ...activityStore,
    ]
    return true
  }

  const found = await findComplaintLive(id)
  if (!found) return false
  await deleteDoc(found.ref)
  await appendActivityLive(found.complaint.villageId, {
    action: 'delete',
    details: `${found.complaint.complaintId} permanently deleted`,
    actor,
    createdAt: new Date().toISOString(),
    complaintId: found.complaint.complaintId,
  })
  return true
}

export async function addInternalNote(
  id: string,
  text: string,
  actor: string,
  editor?: Pick<AdminUser, 'role' | 'displayName'> | null,
) {
  if (useMockData) {
    try {
      const c = await restFindComplaint(DEFAULT_VILLAGE.id, id)
      if (c) {
        if (editor && !canEditComplaint(editor, c)) {
          throw new Error(
            c.assignedTo
              ? `Only ${c.assignedTo} (or the President) can add notes`
              : 'This complaint is not assigned to you',
          )
        }
        const note = {
          id: `n_${Date.now()}`,
          text,
          createdAt: new Date().toISOString(),
          createdBy: actor,
          isInternal: true,
        }
        const updated: Complaint = {
          ...c,
          adminNotes: [...c.adminNotes, note],
          updatedAt: note.createdAt,
        }
        await restSetComplaint(c.villageId, updated)
        return updated
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Only')) throw err
    }
    await delay()
    const c = complaintsStore.find((x) => x.id === id || x.complaintId === id)
    if (!c) return null
    if (editor && !canEditComplaint(editor, c)) {
      throw new Error(
        c.assignedTo
          ? `Only ${c.assignedTo} (or the President) can add notes`
          : 'This complaint is not assigned to you',
      )
    }
    c.adminNotes.push({
      id: `n_${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      createdBy: actor,
      isInternal: true,
    })
    return { ...c }
  }

  const found = await findComplaintLive(id)
  if (!found) return null
  if (editor && !canEditComplaint(editor, found.complaint)) {
    throw new Error(
      found.complaint.assignedTo
        ? `Only ${found.complaint.assignedTo} (or the President) can add notes`
        : 'This complaint is not assigned to you',
    )
  }

  const note = {
    id: `n_${Date.now()}`,
    text,
    createdAt: new Date().toISOString(),
    createdBy: actor,
    isInternal: true,
  }
  const adminNotes = [...found.complaint.adminNotes, note]
  await updateDoc(found.ref, { adminNotes, updatedAt: note.createdAt })
  return { ...found.complaint, adminNotes, updatedAt: note.createdAt }
}

export async function getAnnouncements(): Promise<Announcement[]> {
  await delay()
  return mockAnnouncements
}

export async function getActivityLog(villageId: string = DEFAULT_VILLAGE.id): Promise<ActivityLogEntry[]> {
  if (useMockData) {
    try {
      return await restListActivity(villageId)
    } catch {
      await delay()
      return activityStore
    }
  }

  const snap = await getDocs(query(activityCol(villageId), orderBy('createdAt', 'desc'), limit(100)))
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      action: data.action,
      details: data.details,
      actor: data.actor,
      createdAt: data.createdAt,
      complaintId: data.complaintId,
    }
  })
}

export async function getDashboardStats(villageId: string = DEFAULT_VILLAGE.id): Promise<DashboardStats> {
  const list = await getComplaints(villageId)
  return buildDashboardStats(list)
}

export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  if (useMockData) {
    await delay(300)
    const match = DEMO_ADMINS.find((a) => a.email === email && a.password === password)
    if (match) {
      return {
        uid: `demo-${match.email}`,
        email: match.email,
        displayName: match.displayName,
        role: match.role,
        villageId: DEFAULT_VILLAGE.id,
      }
    }
    throw new Error('Invalid email or password')
  }

  const firebaseAuth = requireAuth()
  const firestore = requireDb()
  const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password)
  const adminSnap = await getDoc(doc(firestore, 'admins', cred.user.uid))

  if (!adminSnap.exists()) {
    await signOut(firebaseAuth)
    throw new Error(
      'Signed in, but no admin profile found. Create Firestore doc admins/{uid} with role, villageId, displayName, email.',
    )
  }

  const data = adminSnap.data()
  let displayName = (data.displayName as string) || cred.user.displayName || 'Admin'
  if (displayName === 'Main Admin' || displayName === 'Super Admin') {
    displayName = 'Admin'
  }
  return {
    uid: cred.user.uid,
    email: cred.user.email || email,
    displayName,
    role: (data.role as AdminUser['role']) || 'staff',
    villageId: (data.villageId as string) || DEFAULT_VILLAGE.id,
  }
}

export async function logoutAdminSession() {
  if (useMockData || !auth) return
  await signOut(auth)
}
