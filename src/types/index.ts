import type { ComplaintCategory, ComplaintStatus } from '@/constants'

export interface GeoLocation {
  lat: number
  lng: number
  address?: string
  areaId?: string
}

export interface TimelineEvent {
  id: string
  status: ComplaintStatus
  title: string
  description?: string
  createdAt: string
  createdBy?: string
  isInternal?: boolean
}

export interface AdminNote {
  id: string
  text: string
  createdAt: string
  createdBy: string
  isInternal: boolean
}

export interface Complaint {
  id: string
  complaintId: string
  villageId: string
  fullName?: string
  mobile?: string
  category: ComplaintCategory
  description: string
  photos: string[]
  voiceUrl?: string
  location: GeoLocation
  status: ComplaintStatus
  supporters: number
  supporterIds: string[]
  comments: Comment[]
  timeline: TimelineEvent[]
  adminNotes: AdminNote[]
  beforePhotos: string[]
  afterPhotos: string[]
  assignedTo?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  /** Hidden from lists after a live reset; kept in Firestore. */
  purged?: boolean
}

export interface Comment {
  id: string
  authorName: string
  text: string
  createdAt: string
}

export interface Announcement {
  id: string
  title: string
  titleTa?: string
  body: string
  bodyTa?: string
  createdAt: string
  priority: 'normal' | 'high'
}

export interface Testimonial {
  id: string
  name: string
  area: string
  quote: string
  quoteTa?: string
  rating: number
}

export interface VillageConfig {
  id: string
  name: string
  nameTa: string
  panchayat?: string
  panchayatTa?: string
  block?: string
  blockTa?: string
  taluk?: string
  talukTa?: string
  code: string
  logo: string
  state: string
  district: string
  pincode: string
  center: { lat: number; lng: number }
  mapsUrl?: string
  mapsEmbedUrl?: string
  contact: {
    phone: string
    email: string
    address: string
    president: string
    hours: string
  }
}

export interface DashboardStats {
  total: number
  today: number
  pending: number
  inProgress: number
  resolved: number
  closed: number
  avgResolutionDays: number
  mostReportedCategory: ComplaintCategory | null
  trend: { date: string; count: number }[]
  byCategory: { category: string; count: number }[]
  byStatus: { status: string; count: number }[]
}

export interface ActivityLogEntry {
  id: string
  action: string
  details: string
  actor: string
  createdAt: string
  complaintId?: string
}

export interface AdminUser {
  uid: string
  email: string
  displayName: string
  role: 'president' | 'staff' | 'super_admin'
  villageId: string
}

/** Citizen session (mobile OTP + profile) */
export interface CitizenUser {
  fullName: string
  mobile: string
  areaId?: string
  areaName?: string
  loggedInAt: string
}

export interface ReportIssueForm {
  fullName?: string
  mobile?: string
  category: ComplaintCategory
  description: string
  areaId?: string
  location: GeoLocation
  photos: File[]
  voiceFile?: File | null
}

export type NotificationChannel = 'sms' | 'whatsapp' | 'email' | 'push'

export interface NotificationPayload {
  channel: NotificationChannel
  to: string
  subject?: string
  body: string
  complaintId?: string
  templateId?: string
  metadata?: Record<string, string>
}
