import type { NotificationPayload } from '@/types'
import { SITE_NAME, SITE_URL } from '@/constants'

/**
 * Notification architecture — plug in real providers later:
 * - SMS: Twilio / MSG91 / Fast2SMS
 * - WhatsApp: Meta Cloud API / Twilio
 * - Email: SendGrid / Firebase Extensions
 * - Push: Firebase Cloud Messaging
 *
 * Prefer a Cloud Function trigger on complaint status change
 * that fans out to the selected channels.
 */

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<{ success: boolean; id?: string; error?: string }>
}

class ConsoleSmsProvider implements NotificationProvider {
  async send(payload: NotificationPayload) {
    console.info('[SMS]', payload.to, payload.body)
    return { success: true, id: `sms_${Date.now()}` }
  }
}

class ConsoleWhatsAppProvider implements NotificationProvider {
  async send(payload: NotificationPayload) {
    console.info('[WhatsApp]', payload.to, payload.body)
    return { success: true, id: `wa_${Date.now()}` }
  }
}

class ConsoleEmailProvider implements NotificationProvider {
  async send(payload: NotificationPayload) {
    console.info('[Email]', payload.to, payload.subject, payload.body)
    return { success: true, id: `email_${Date.now()}` }
  }
}

class ConsolePushProvider implements NotificationProvider {
  async send(payload: NotificationPayload) {
    console.info('[Push]', payload.to, payload.body)
    return { success: true, id: `push_${Date.now()}` }
  }
}

const providers: Record<NotificationPayload['channel'], NotificationProvider> = {
  sms: new ConsoleSmsProvider(),
  whatsapp: new ConsoleWhatsAppProvider(),
  email: new ConsoleEmailProvider(),
  push: new ConsolePushProvider(),
}

export async function sendNotification(payload: NotificationPayload) {
  return providers[payload.channel].send(payload)
}

export async function notifyComplaintStatus(
  mobile: string | undefined,
  email: string | undefined,
  complaintId: string,
  statusLabel: string,
) {
  const body = `${SITE_NAME}: Complaint ${complaintId} is now "${statusLabel}". Track at ${SITE_URL}/track?id=${complaintId}`
  const results = []

  if (mobile) {
    results.push(await sendNotification({ channel: 'sms', to: mobile, body, complaintId }))
    results.push(await sendNotification({ channel: 'whatsapp', to: mobile, body, complaintId }))
  }
  if (email) {
    results.push(
      await sendNotification({
        channel: 'email',
        to: email,
        subject: `Complaint ${complaintId} update`,
        body,
        complaintId,
      }),
    )
  }
  results.push(
    await sendNotification({
      channel: 'push',
      to: `complaint_${complaintId}`,
      body,
      complaintId,
    }),
  )

  return results
}

export const notificationTemplates = {
  submitted: (id: string) => `Your complaint ${id} has been submitted successfully.`,
  verified: (id: string) => `Complaint ${id} has been verified by the Panchayat.`,
  assigned: (id: string) => `Complaint ${id} has been assigned to a team.`,
  in_progress: (id: string) => `Work has started on complaint ${id}.`,
  resolved: (id: string) => `Complaint ${id} has been marked as resolved.`,
  closed: (id: string) => `Complaint ${id} is now closed. Thank you.`,
}
