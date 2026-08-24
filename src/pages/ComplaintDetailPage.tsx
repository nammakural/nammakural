import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { Download, ThumbsUp, MessageSquare, MapPin } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageTitle,
  Spinner,
  Textarea,
} from '@/components/ui'
import { StatusTimeline } from '@/components/complaints/StatusTimeline'
import {
  addComment,
  getComplaintById,
  upvoteComplaint,
} from '@/services/complaints'
import { downloadComplaintPdf } from '@/services/export'
import { CATEGORY_LABELS, SITE_URL } from '@/constants'
import { useApp } from '@/contexts/AppContext'
import type { Complaint } from '@/types'
import { formatDateTime, getStatusBadgeClass, statusLabel } from '@/utils'
import { isLeadership } from '@/utils/roles'

export function ComplaintDetailPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const { t } = useTranslation()
  const { village, voterKey, admin } = useApp()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentName, setCommentName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [msg, setMsg] = useState('')
  const justSubmitted = Boolean((location.state as { justSubmitted?: boolean } | null)?.justSubmitted)

  const load = async () => {
    setLoading(true)
    const c = await getComplaintById(id)
    setComplaint(c)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <EmptyState message="Complaint not found" />
        <div className="text-center">
          <Link to="/track" className="text-sky-400 text-sm underline">
            Back to track
          </Link>
        </div>
      </div>
    )
  }

  const shareUrl =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? `${window.location.origin}/complaints/${complaint.complaintId}`
      : `${SITE_URL}/complaints/${complaint.complaintId}`
  const canViewReporterInfo = isLeadership(admin?.role)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      {justSubmitted ? (
        <Card className="border-vc-teal/40 bg-vc-teal/10">
          <p className="font-semibold text-vc-teal">{t('report.success')}</p>
          <p className="text-sm text-vc-muted mt-1">
            Save your Complaint ID: <strong className="text-white">{complaint.complaintId}</strong>
          </p>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageTitle title={complaint.complaintId} />
          <div className="flex flex-wrap gap-2 -mt-4 mb-2">
            <Badge className={getStatusBadgeClass(complaint.status)}>{statusLabel(complaint.status)}</Badge>
            <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/30">
              {CATEGORY_LABELS[complaint.category]}
            </Badge>
          </div>
          <p className="text-sm text-vc-muted">
            Submitted {formatDateTime(complaint.createdAt)}
            {canViewReporterInfo && complaint.fullName ? ` · ${complaint.fullName}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadComplaintPdf(complaint, village.name, {
                includeReporterInfo: canViewReporterInfo,
              })
            }
          >
            <Download className="h-4 w-4" /> {t('detail.downloadPdf')}
          </Button>
          {admin ? (
            <Link to={`/admin/complaints/${complaint.complaintId}`}>
              <Button size="sm" variant="secondary">
                Manage
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <Card>
        <h2 className="label-caps mb-4">{t('detail.timeline')}</h2>
        <StatusTimeline current={complaint.status} />
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 space-y-4">
          <div>
            <h3 className="label-caps mb-2">Description</h3>
            <p className="dark:text-slate-200 text-slate-700 leading-relaxed">{complaint.description}</p>
          </div>
          <div className="flex items-start gap-2 text-sm text-vc-muted">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {complaint.location.address || 'Pinned location'}
              <br />
              <span className="text-xs">
                {complaint.location.lat.toFixed(5)}, {complaint.location.lng.toFixed(5)}
              </span>
            </span>
          </div>
          {complaint.photos.length > 0 ? (
            <div>
              <h3 className="label-caps mb-2">Photos</h3>
              <div className="flex flex-wrap gap-2">
                {complaint.photos.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt="" className="h-28 w-36 object-cover rounded-xl border border-vc-border" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
          {complaint.voiceUrl ? (
            <div>
              <h3 className="label-caps mb-2">Voice Recording</h3>
              <audio controls src={complaint.voiceUrl} className="w-full" />
            </div>
          ) : null}
          {(complaint.beforePhotos.length > 0 || complaint.afterPhotos.length > 0) ? (
            <div>
              <h3 className="label-caps mb-2">{t('detail.beforeAfter')}</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-vc-muted mb-1">Before</p>
                  <div className="flex flex-wrap gap-2">
                    {complaint.beforePhotos.map((src) => (
                      <img key={src} src={src} alt="Before" className="h-24 w-32 object-cover rounded-lg" />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-vc-muted mb-1">After</p>
                  <div className="flex flex-wrap gap-2">
                    {complaint.afterPhotos.map((src) => (
                      <img key={src} src={src} alt="After" className="h-24 w-32 object-cover rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="label-caps mb-3">{t('detail.supporters')}</h3>
            <p className="font-display text-3xl font-bold mb-3">{complaint.supporters}</p>
            <Button
              className="w-full"
              variant="secondary"
              onClick={async () => {
                const updated = await upvoteComplaint(complaint.id, voterKey)
                if (updated) {
                  setComplaint(updated)
                  setMsg(updated.supporterIds.includes(voterKey) ? 'Thanks for your support!' : msg)
                }
              }}
            >
              <ThumbsUp className="h-4 w-4" /> {t('detail.support')}
            </Button>
            {msg ? <p className="text-xs text-vc-teal mt-2">{msg}</p> : null}
          </Card>

          <Card className="flex flex-col items-center">
            <h3 className="label-caps mb-3 self-start">{t('detail.qr')}</h3>
            <div className="bg-white p-3 rounded-xl">
              <QRCodeSVG value={shareUrl} size={140} />
            </div>
            <p className="text-[10px] text-vc-muted mt-2 text-center break-all">{shareUrl}</p>
          </Card>
        </div>
      </div>

      <Card>
        <h3 className="label-caps mb-4">{t('detail.adminUpdates')}</h3>
        <ol className="space-y-3 border-l border-vc-border ml-2 pl-4">
          {[...complaint.timeline].reverse().map((ev) => (
            <li key={ev.id}>
              <p className="text-sm font-medium dark:text-white text-light-text">{ev.title}</p>
              {ev.description ? <p className="text-sm text-vc-muted">{ev.description}</p> : null}
              <p className="text-xs text-vc-muted mt-0.5">
                {formatDateTime(ev.createdAt)}
                {ev.createdBy ? ` · ${ev.createdBy}` : ''}
              </p>
            </li>
          ))}
        </ol>
        {complaint.adminNotes.filter((n) => !n.isInternal).length > 0 ? (
          <div className="mt-4 pt-4 border-t border-vc-border space-y-2">
            {complaint.adminNotes
              .filter((n) => !n.isInternal)
              .map((n) => (
                <p key={n.id} className="text-sm text-vc-muted">
                  {n.text} <span className="text-xs">({formatDateTime(n.createdAt)})</span>
                </p>
              ))}
          </div>
        ) : null}
      </Card>

      <Card>
        <h3 className="label-caps mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> {t('detail.comments')}
        </h3>
        <div className="space-y-3 mb-4">
          {complaint.comments.length === 0 ? (
            <p className="text-sm text-vc-muted">No comments yet.</p>
          ) : (
            complaint.comments.map((c) => (
              <div key={c.id} className="rounded-xl bg-black/20 border border-vc-border p-3">
                <p className="text-sm font-medium">{c.authorName}</p>
                <p className="text-sm text-vc-muted">{c.text}</p>
                <p className="text-[10px] text-vc-muted mt-1">{formatDateTime(c.createdAt)}</p>
              </div>
            ))
          )}
        </div>
        <div className="grid sm:grid-cols-3 gap-2">
          <Input placeholder="Your name" value={commentName} onChange={(e) => setCommentName(e.target.value)} />
          <Textarea
            className="sm:col-span-2 min-h-[44px]"
            placeholder="Add a comment (optional)"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </div>
        <Button
          className="mt-3"
          size="sm"
          disabled={!commentText.trim()}
          onClick={async () => {
            const updated = await addComment(complaint.id, commentName || 'Anonymous', commentText.trim())
            if (updated) {
              setComplaint(updated)
              setCommentText('')
            }
          }}
        >
          Post comment
        </Button>
      </Card>
    </div>
  )
}
