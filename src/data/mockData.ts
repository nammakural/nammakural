import type { ActivityLogEntry, Announcement, Complaint, Testimonial } from '@/types'
import { DEFAULT_VILLAGE } from '@/constants'

const villageId = DEFAULT_VILLAGE.id

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const mockComplaints: Complaint[] = [
  {
    id: 'c1',
    complaintId: 'TP-2026-00001',
    villageId,
    fullName: 'Lakshmi Devi',
    mobile: '9876543210',
    category: 'street_light',
    description:
      'Street light near Temple Street junction has been non-functional for 2 weeks. Area becomes very dark after 7 PM, unsafe for school children and elders.',
    photos: [
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&q=80',
    ],
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
    adminNotes: [{ id: 'n1', text: 'Schedule extra pickup tomorrow', createdAt: daysAgo(3), createdBy: 'President', isInternal: true }],
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
    voiceUrl: undefined,
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
    location: { lat: 13.2115, lng: 79.8360, address: 'Thiruppair Colony', areaId: 'thiruppair-colony' },
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
    location: { lat: 13.2080, lng: 79.8318, address: 'Bangarampettai East', areaId: 'bangarampettai' },
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

export const mockAnnouncements: Announcement[] = [
  {
    id: 'a1',
    title: 'Special Gram Sabha Meeting',
    titleTa: 'சிறப்பு கிராம சபை கூட்டம்',
    body: 'Gram Sabha on 5th August 2026 at 10 AM in Panchayat Hall. All residents welcome.',
    bodyTa: 'ஆகஸ்ட் 5, 2026 காலை 10 மணிக்கு பஞ்சாயத்து மண்டபத்தில் கிராம சபை. அனைவரும் வரவேற்கப்படுகிறீர்கள்.',
    createdAt: daysAgo(1),
    priority: 'high',
  },
  {
    id: 'a2',
    title: 'Water Supply Schedule Update',
    titleTa: 'நீர் விநியோக அட்டவணை புதுப்பிப்பு',
    body: 'From next week, water supply will be on alternate days: Odd house numbers Mon/Wed/Fri.',
    bodyTa: 'அடுத்த வாரம் முதல் மாற்று நாட்களில் நீர் விநியோகம்: ஒற்றை வீட்டு எண்கள் திங்கள்/புதன்/வெள்ளி.',
    createdAt: daysAgo(3),
    priority: 'normal',
  },
  {
    id: 'a3',
    title: 'Free Health Camp',
    titleTa: 'இலவச சுகாதார முகாம்',
    body: 'PHC health camp this Sunday 9 AM–1 PM. Bring Aadhaar card.',
    bodyTa: 'இந்த ஞாயிறு காலை 9–1 மணி வரை ஆரம்ப சுகாதார நிலையத்தில் இலவச முகாம். ஆதார் அட்டை கொண்டு வாருங்கள்.',
    createdAt: daysAgo(5),
    priority: 'normal',
  },
]

export const mockTestimonials: Testimonial[] = [
  {
    id: 'tm1',
    name: 'Lakshmi Devi',
    area: 'Temple Street',
    quote: 'I reported a street light issue and could track every update. Very transparent!',
    quoteTa: 'தெரு விளக்கு பிரச்சினையை புகாரளித்தேன். ஒவ்வொரு நிலையையும் பார்க்க முடிந்தது.',
    rating: 5,
  },
  {
    id: 'tm2',
    name: 'Murugan S',
    area: 'Bus Stand',
    quote: 'Easy to use even for elders. The voice recording option helped my father a lot.',
    quoteTa: 'முதியவர்களுக்கும் எளிது. குரல் பதிவு என் தந்தைக்கு மிகவும் உதவியது.',
    rating: 5,
  },
  {
    id: 'tm3',
    name: 'Anitha R',
    area: 'School Area',
    quote: 'Water supply was restored within a week after we supported the complaint together.',
    quoteTa: 'ஒன்றாக ஆதரித்த பிறகு ஒரு வாரத்தில் நீர் விநியோகம் சீர் செய்யப்பட்டது.',
    rating: 4,
  },
]

export const mockActivityLog: ActivityLogEntry[] = [
  {
    id: 'al1',
    action: 'status_update',
    details: 'TP-2026-00001 moved to In Progress',
    actor: 'staff@thiruporur.gov.in',
    createdAt: daysAgo(2),
    complaintId: 'TP-2026-00001',
  },
  {
    id: 'al2',
    action: 'assign',
    details: 'TP-2026-00004 assigned to Sanitation Team',
    actor: 'president@thiruporur.gov.in',
    createdAt: daysAgo(3),
    complaintId: 'TP-2026-00004',
  },
  {
    id: 'al3',
    action: 'resolve',
    details: 'TP-2026-00003 marked Resolved',
    actor: 'staff@thiruporur.gov.in',
    createdAt: daysAgo(4),
    complaintId: 'TP-2026-00003',
  },
  {
    id: 'al4',
    action: 'login',
    details: 'Admin signed in',
    actor: 'president@thiruporur.gov.in',
    createdAt: daysAgo(0),
  },
]

/** Admin — full access (super_admin) */
export const DEMO_ADMIN = {
  email: 'admin@nammakural.in',
  password: 'admin123',
  displayName: 'Admin',
  role: 'super_admin' as const,
}

/** Village president account (full leadership access) */
export const DEMO_PRESIDENT = {
  email: 'president@nammakural.in',
  password: 'president123',
  displayName: 'Village President',
  role: 'president' as const,
}

/** Individual staff logins — displayName must match Assign To (Staff 1…4) */
export const DEMO_STAFF_MEMBERS = [
  {
    email: 'staff1@nammakural.in',
    password: 'staff123',
    displayName: 'Staff 1',
    role: 'staff' as const,
  },
  {
    email: 'staff2@nammakural.in',
    password: 'staff123',
    displayName: 'Staff 2',
    role: 'staff' as const,
  },
  {
    email: 'staff3@nammakural.in',
    password: 'staff123',
    displayName: 'Staff 3',
    role: 'staff' as const,
  },
  {
    email: 'staff4@nammakural.in',
    password: 'staff123',
    displayName: 'Staff 4',
    role: 'staff' as const,
  },
] as const

/** @deprecated use DEMO_STAFF_MEMBERS[0] */
export const DEMO_STAFF = DEMO_STAFF_MEMBERS[0]

export const DEMO_ADMINS = [DEMO_ADMIN, DEMO_PRESIDENT, ...DEMO_STAFF_MEMBERS] as const
