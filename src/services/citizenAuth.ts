import { sendNotification } from '@/services/notifications'
import type { CitizenUser } from '@/types'
import { SITE_NAME } from '@/constants'

const OTP_STORAGE_KEY = 'vc-citizen-otp'
const PROFILES_KEY = 'vc-citizen-profiles'
const OTP_TTL_MS = 5 * 60 * 1000
const OTP_LENGTH = 6

export interface CitizenProfile {
  fullName: string
  mobile: string
  areaId?: string
  areaName?: string
  createdAt: string
  updatedAt: string
}

interface PendingOtp {
  mobile: string
  code: string
  expiresAt: number
  attempts: number
}

function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10)
}

function isValidMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeMobile(mobile))
}

function readProfiles(): Record<string, CitizenProfile> {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CitizenProfile>) : {}
  } catch {
    return {}
  }
}

function writeProfiles(profiles: Record<string, CitizenProfile>) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

export function getCitizenProfile(mobile: string): CitizenProfile | null {
  const key = normalizeMobile(mobile)
  if (!key) return null
  return readProfiles()[key] ?? null
}

export function hasCitizenProfile(mobile: string): boolean {
  const profile = getCitizenProfile(mobile)
  return Boolean(profile?.fullName?.trim())
}

export function saveCitizenProfile(input: {
  fullName: string
  mobile: string
  areaId?: string
  areaName?: string
}): CitizenProfile {
  const mobile = normalizeMobile(input.mobile)
  const now = new Date().toISOString()
  const existing = getCitizenProfile(mobile)
  const profile: CitizenProfile = {
    fullName: input.fullName.trim(),
    mobile,
    areaId: input.areaId || existing?.areaId,
    areaName: input.areaName || existing?.areaName,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }
  const profiles = readProfiles()
  profiles[mobile] = profile
  writeProfiles(profiles)
  return profile
}

function readPendingOtp(): PendingOtp | null {
  try {
    const raw = sessionStorage.getItem(OTP_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PendingOtp) : null
  } catch {
    return null
  }
}

function writePendingOtp(pending: PendingOtp | null) {
  if (!pending) {
    sessionStorage.removeItem(OTP_STORAGE_KEY)
    return
  }
  sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(pending))
}

function generateOtp(): string {
  const n = Math.floor(Math.random() * 10 ** OTP_LENGTH)
  return String(n).padStart(OTP_LENGTH, '0')
}

export interface SendOtpResult {
  mobile: string
  expiresInSec: number
  /** Shown in UI while SMS/WhatsApp providers are stubs */
  demoCode: string
}

export async function sendCitizenOtp(mobileInput: string): Promise<SendOtpResult> {
  const mobile = normalizeMobile(mobileInput)
  if (!isValidMobile(mobile)) {
    throw new Error('INVALID_MOBILE')
  }

  const code = generateOtp()
  const expiresAt = Date.now() + OTP_TTL_MS
  writePendingOtp({ mobile, code, expiresAt, attempts: 0 })

  const body = `${SITE_NAME} OTP: ${code}. Valid for 5 minutes. Do not share.`
  await Promise.all([
    sendNotification({ channel: 'sms', to: mobile, body }),
    sendNotification({ channel: 'whatsapp', to: mobile, body }),
  ])

  return {
    mobile,
    expiresInSec: Math.floor(OTP_TTL_MS / 1000),
    demoCode: code,
  }
}

export interface VerifyOtpResult {
  mobile: string
  isNewUser: boolean
  profile: CitizenProfile | null
}

export function verifyCitizenOtp(mobileInput: string, otpInput: string): VerifyOtpResult {
  const mobile = normalizeMobile(mobileInput)
  const code = otpInput.replace(/\D/g, '').slice(0, OTP_LENGTH)
  const pending = readPendingOtp()

  if (!pending || pending.mobile !== mobile) {
    throw new Error('OTP_NOT_FOUND')
  }
  if (Date.now() > pending.expiresAt) {
    writePendingOtp(null)
    throw new Error('OTP_EXPIRED')
  }
  if (pending.attempts >= 5) {
    writePendingOtp(null)
    throw new Error('OTP_TOO_MANY')
  }
  if (pending.code !== code) {
    writePendingOtp({ ...pending, attempts: pending.attempts + 1 })
    throw new Error('OTP_INVALID')
  }

  writePendingOtp(null)
  const profile = getCitizenProfile(mobile)
  return {
    mobile,
    isNewUser: !profile?.fullName?.trim() || !profile?.areaId,
    profile,
  }
}

export function clearCitizenOtp() {
  writePendingOtp(null)
}

export function profileToCitizenUser(profile: CitizenProfile): CitizenUser {
  return {
    fullName: profile.fullName,
    mobile: profile.mobile,
    areaId: profile.areaId,
    areaName: profile.areaName,
    loggedInAt: new Date().toISOString(),
  }
}

export { normalizeMobile, isValidMobile }
