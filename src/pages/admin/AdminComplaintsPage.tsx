import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge, Card, Input, Label, PageTitle, Select, Spinner, EmptyState } from '@/components/ui'
import {
  CATEGORY_LABELS,
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  STATUS_LABELS,
  type ComplaintCategory,
  type ComplaintStatus,
} from '@/constants'
import { searchComplaints } from '@/services/complaints'
import { useApp } from '@/contexts/AppContext'
import type { Complaint } from '@/types'
import { formatDate, getStatusBadgeClass, statusLabel } from '@/utils'
import { isLeadership } from '@/utils/roles'

export function AdminComplaintsPage() {
  const { t } = useTranslation()
  const { admin } = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ComplaintCategory | ''>('')
  const [status, setStatus] = useState<ComplaintStatus | ''>('')
  const [list, setList] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    void searchComplaints({ query, category, status })
      .then((r) => {
        if (!cancelled) {
          setList(r)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load complaints')
          setList([])
          setLoading(false)
        }
      })
    const onFocus = () => {
      void searchComplaints({ query, category, status }).then((r) => {
        if (!cancelled) setList(r)
      })
    }
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [query, category, status])

  return (
    <div>
      <PageTitle title={t('admin.complaints')} />
      {error ? (
        <p className="text-sm text-red-400 mb-4">
          Could not load live complaints. Refresh the page. {error}
        </p>
      ) : null}
      {!isLeadership(admin?.role) ? (
        <p className="text-sm text-vc-muted mb-4 -mt-2">
          You can view all complaints. Only complaints assigned to{' '}
          <strong className="text-white">{admin?.displayName}</strong> can be edited.
        </p>
      ) : null}
      <Card className="mb-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label>Search</Label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ID or text…" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value as ComplaintCategory | '')}>
              <option value="">All</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as ComplaintStatus | '')}>
              <option value="">All</option>
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <EmptyState message="No complaints" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left label-caps border-b border-vc-border">
                <th className="p-4">ID</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned</th>
                <th className="p-4">Access</th>
                <th className="p-4">Supporters</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const mine = isLeadership(admin?.role) || c.assignedTo === admin?.displayName
                return (
                <tr key={c.id} className="border-b border-vc-border/50 hover:bg-white/[0.02]">
                  <td className="p-4">
                    <Link
                      className="text-sky-400 hover:underline font-medium"
                      to={`/admin/complaints/${c.complaintId}`}
                    >
                      {c.complaintId}
                    </Link>
                    <p className="text-xs text-vc-muted line-clamp-1 max-w-[200px]">{c.description}</p>
                  </td>
                  <td className="p-4 text-vc-muted">{CATEGORY_LABELS[c.category]}</td>
                  <td className="p-4">
                    <Badge className={getStatusBadgeClass(c.status)}>{statusLabel(c.status)}</Badge>
                  </td>
                  <td className="p-4 text-vc-muted">{c.assignedTo || '—'}</td>
                  <td className="p-4">
                    {mine ? (
                      <span className="text-xs text-emerald-400">Can edit</span>
                    ) : (
                      <span className="text-xs text-vc-muted">View only</span>
                    )}
                  </td>
                  <td className="p-4">{c.supporters}</td>
                  <td className="p-4 text-vc-muted">{formatDate(c.createdAt)}</td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
