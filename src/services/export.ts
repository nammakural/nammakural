import type { Complaint } from '@/types'
import { STATUS_LABELS, CATEGORY_LABELS, SITE_NAME, type ComplaintStatus } from '@/constants'
import { formatDateTime } from '@/utils'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { downloadBlob } from '@/utils'

export function downloadComplaintPdf(
  complaint: Complaint,
  villageName: string,
  options?: { includeReporterInfo?: boolean },
) {
  const includeReporterInfo = options?.includeReporterInfo === true
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text(`${SITE_NAME} — Complaint Report`, 14, 20)
  doc.setFontSize(11)
  doc.text(villageName, 14, 28)

  autoTable(doc, {
    startY: 36,
    head: [['Field', 'Value']],
    body: [
      ['Complaint ID', complaint.complaintId],
      ['Status', STATUS_LABELS[complaint.status as ComplaintStatus]],
      ['Category', CATEGORY_LABELS[complaint.category]],
      ['Submitted', formatDateTime(complaint.createdAt)],
      ['Updated', formatDateTime(complaint.updatedAt)],
      ['Location', complaint.location.address || `${complaint.location.lat}, ${complaint.location.lng}`],
      ['Supporters', String(complaint.supporters)],
      ['Reporter', includeReporterInfo ? (complaint.fullName || 'Anonymous') : 'Hidden'],
      ['Mobile', includeReporterInfo ? (complaint.mobile || '—') : 'Hidden'],
      ['Description', complaint.description],
      ['Assigned To', complaint.assignedTo || '—'],
    ],
    styles: { fontSize: 10, cellWidth: 'wrap' },
    columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 135 } },
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  doc.setFontSize(13)
  doc.text('Progress Timeline', 14, finalY)

  autoTable(doc, {
    startY: finalY + 4,
    head: [['When', 'Status', 'Update']],
    body: complaint.timeline.map((t) => [
      formatDateTime(t.createdAt),
      STATUS_LABELS[t.status],
      `${t.title}${t.description ? ` — ${t.description}` : ''}`,
    ]),
  })

  doc.save(`${complaint.complaintId}.pdf`)
}

export function exportComplaintsExcel(complaints: Complaint[], filename = 'nammakural-report.xlsx') {
  const rows = complaints.map((c) => ({
    'Complaint ID': c.complaintId,
    Status: STATUS_LABELS[c.status],
    Category: CATEGORY_LABELS[c.category],
    Description: c.description,
    Location: c.location.address || '',
    Lat: c.location.lat,
    Lng: c.location.lng,
    Supporters: c.supporters,
    Reporter: c.fullName || '',
    Mobile: c.mobile || '',
    Assigned: c.assignedTo || '',
    Submitted: formatDateTime(c.createdAt),
    Updated: formatDateTime(c.updatedAt),
    Resolved: c.resolvedAt ? formatDateTime(c.resolvedAt) : '',
  }))

  const sheet = XLSX.utils.json_to_sheet(rows)
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Complaints')
  const buf = XLSX.write(book, { bookType: 'xlsx', type: 'array' })
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename,
  )
}

export function exportComplaintsCsv(complaints: Complaint[], filename = 'nammakural-report.csv') {
  const headers = [
    'Complaint ID',
    'Status',
    'Category',
    'Description',
    'Location',
    'Supporters',
    'Submitted',
  ]
  const lines = [
    headers.join(','),
    ...complaints.map((c) =>
      [
        c.complaintId,
        STATUS_LABELS[c.status],
        CATEGORY_LABELS[c.category],
        `"${c.description.replace(/"/g, '""')}"`,
        `"${(c.location.address || '').replace(/"/g, '""')}"`,
        c.supporters,
        c.createdAt,
      ].join(','),
    ),
  ]
  downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }), filename)
}
