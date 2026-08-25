/** Complaint status workflow */
export const COMPLAINT_STATUSES = [
  'submitted',
  'verified',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
] as const

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number]

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  submitted: 'Submitted',
  verified: 'Verified',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const STATUS_COLORS: Record<ComplaintStatus, string> = {
  submitted: '#ef4444',
  verified: '#f97316',
  assigned: '#eab308',
  in_progress: '#eab308',
  resolved: '#22c55e',
  closed: '#22c55e',
}

/** Map marker colors */
export const MAP_MARKER_COLORS = {
  pending: '#ef4444',
  in_progress: '#eab308',
  resolved: '#22c55e',
} as const

export const COMPLAINT_CATEGORIES = [
  'street_light',
  'water_supply',
  'water_leakage',
  'road_damage',
  'drainage',
  'garbage_collection',
  'electricity',
  'public_toilet',
  'school',
  'hospital',
  'tree_fallen',
  'stray_animals',
  'other',
] as const

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  street_light: 'Street Light',
  water_supply: 'Water Supply',
  water_leakage: 'Water Leakage',
  road_damage: 'Road Damage',
  drainage: 'Drainage',
  garbage_collection: 'Garbage Collection',
  electricity: 'Electricity',
  public_toilet: 'Public Toilet',
  school: 'School',
  hospital: 'Hospital',
  tree_fallen: 'Tree Fallen',
  stray_animals: 'Stray Animals',
  other: 'Other',
}

export const CATEGORY_LABELS_TA: Record<ComplaintCategory, string> = {
  street_light: 'தெரு விளக்கு',
  water_supply: 'நீர் விநியோகம்',
  water_leakage: 'நீர் கசிவு',
  road_damage: 'சாலை சேதம்',
  drainage: 'வடிகால்',
  garbage_collection: 'குப்பை சேகரிப்பு',
  electricity: 'மின்சாரம்',
  public_toilet: 'பொது கழிப்பறை',
  school: 'பள்ளி',
  hospital: 'மருத்துவமனை',
  tree_fallen: 'மரம் விழுதல்',
  stray_animals: 'அலைந்து திரியும் விலங்குகள்',
  other: 'மற்றவை',
}

/** Habitations under Thiruppair Village Panchayat (Poondi Block) */
export const VILLAGE_AREAS = [
  {
    id: 'thiruppair',
    name: 'Thiruppair',
    nameTa: 'திருப்பேர்',
    lat: 13.2094057,
    lng: 79.8342263,
  },
  {
    id: 'thiruppair-colony',
    name: 'Thiruppair Colony',
    nameTa: 'திருப்பேர் காலனி',
    lat: 13.2112,
    lng: 79.8358,
  },
  {
    id: 'thiruppair-st-colony',
    name: 'Thiruppair ST Colony',
    nameTa: 'திருப்பேர் எஸ்.டி. காலனி (பழங்குடியினர் காலனி)',
    lat: 13.2104,
    lng: 79.8364,
  },
  {
    id: 'bangarampettai',
    name: 'Bangarampettai',
    nameTa: 'பங்காரம்பேட்டை',
    lat: 13.2078,
    lng: 79.8315,
  },
  {
    id: 'arumbakkam',
    name: 'Arumbakkam',
    nameTa: 'அரும்பாக்கம்',
    lat: 13.2065,
    lng: 79.8365,
  },
  {
    id: 'arumbakkam-colony',
    name: 'Arumbakkam Colony',
    nameTa: 'அரும்பாக்கம் காலனி',
    lat: 13.2058,
    lng: 79.8372,
  },
  {
    id: 'arumbakkam-st-colony',
    name: 'Arumbakkam ST Colony',
    nameTa: 'அரும்பாக்கம் எஸ்.டி. காலனி (பழங்குடியினர் காலனி)',
    lat: 13.2052,
    lng: 79.8378,
  },
  {
    id: 'parigulam',
    name: 'Parigulam',
    nameTa: 'பரிகுளம்',
    lat: 13.2125,
    lng: 79.8322,
  },
] as const

/** Staff accounts the president can assign complaints to */
export const ASSIGNABLE_STAFF = ['Staff 1', 'Staff 2', 'Staff 3', 'Staff 4'] as const

export type AssignableStaff = (typeof ASSIGNABLE_STAFF)[number]

/** Live site domain */
export const SITE_NAME = 'nammakural'
export const SITE_DOMAIN = 'nammakural.online'
export const SITE_URL = 'https://nammakural.online'

/** Thiruppair Village Panchayat — Poondi Block, Thiruvallur */
export const DEFAULT_VILLAGE = {
  id: 'thiruppair',
  name: 'Thiruppair',
  nameTa: 'திருப்பேர்',
  panchayat: 'Thiruppair Village Panchayat',
  panchayatTa: 'திருப்பேர் ஊராட்சி',
  block: 'Poondi',
  blockTa: 'பூண்டி ஊராட்சி ஒன்றியம்',
  taluk: 'Thiruvallur',
  talukTa: 'திருவள்ளூர்',
  code: 'TP',
  logo: '/favicon.svg',
  state: 'Tamil Nadu',
  district: 'Thiruvallur',
  pincode: '602023',
  center: { lat: 13.2094057, lng: 79.8342263 },
  mapsUrl:
    'https://www.google.com/maps/place/Thiruppair,+Tamil+Nadu+602023/@13.2107665,79.833251,600m/data=!3m1!1e3!4m14!1m7!3m6!1s0x3a529b00425da67f:0xb9bde9e26a7135f0!2sFSC+ground!8m2!3d13.2085071!4d79.8372395!16s%2Fg%2F11x6qhhs94!3m5!1s0x3a529bd6c5f17d1b:0x50df45e5891cae4d!8m2!3d13.2094057!4d79.8342263!16s%2Fg%2F1v8g9fwb',
  mapsEmbedUrl:
    'https://maps.google.com/maps?q=Thiruppair,+Tamil+Nadu+602023&ll=13.2094057,79.8342263&z=16&t=k&output=embed',
  contact: {
    phone: '+91 8973697348',
    email: 'panchayat@thiruppair.gov.in',
    address:
      'Panchayat Office, Thiruppair Village Panchayat, Poondi Block, Thiruvallur Taluk, Thiruvallur District - 602023',
    president: 'Shri. J.Prasanth',
    hours: 'Mon–Sat 9:00 AM – 5:00 PM',
  },
} as const
