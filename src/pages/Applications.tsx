import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Chip,
  Empty,
  Input,
  SectionTitle,
  Stat,
  type ChipTone,
} from '../components/ui'
import { api, downloadFile } from '../lib/api'
import type { Application, ApplicationCounts, ApplicationStatus } from '../lib/types'

const statusMeta: Record<ApplicationStatus, { label: string; tone: ChipTone; emoji: string }> = {
  queued: { label: 'Queued', tone: 'white', emoji: '⏳' },
  applied: { label: 'Applied', tone: 'yellow', emoji: '📮' },
  viewed: { label: 'Viewed', tone: 'blue', emoji: '👀' },
  interview: { label: 'Interview', tone: 'mint', emoji: '🎤' },
  rejected: { label: 'Rejected', tone: 'coral', emoji: '💔' },
  needs_review: { label: 'Needs review', tone: 'grape', emoji: '⚠️' },
  failed: { label: 'Failed', tone: 'coral', emoji: '×' },
  closed: { label: 'Closed', tone: 'ink', emoji: '−' },
}

const filters: (ApplicationStatus | 'all')[] = [
  'all',
  'queued',
  'needs_review',
  'applied',
  'viewed',
  'interview',
  'rejected',
  'failed',
  'closed',
]

const EMPTY_COUNTS: ApplicationCounts = {
  all: 0,
  queued: 0,
  applied: 0,
  viewed: 0,
  interview: 0,
  rejected: 0,
  needs_review: 0,
  failed: 0,
  closed: 0,
}

export function Applications() {
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Application[]>([])
  const [counts, setCounts] = useState<ApplicationCounts>(EMPTY_COUNTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    // The search box hits the server; give the user a beat to finish typing.
    const timer = setTimeout(
      () => {
        const params = new URLSearchParams({ status: filter, limit: '100' })
        if (q.trim()) params.set('q', q.trim())
        api
          .get<Application[]>(`/applications?${params}`)
          .then(({ data, meta }) => {
            if (cancelled) return
            setRows(data)
            setCounts((meta?.counts as ApplicationCounts | undefined) ?? EMPTY_COUNTS)
            setError('')
          })
          .catch((err) => {
            if (!cancelled)
              setError(err instanceof Error ? err.message : 'Could not load applications.')
          })
          .finally(() => {
            if (!cancelled) setLoading(false)
          })
      },
      q ? 250 : 0,
    )
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [filter, q])

  async function exportCsv() {
    setExporting(true)
    try {
      await downloadFile('/applications/export/csv', 'job-hunters-applications.csv')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The export failed.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        emoji="📮"
        title="Applications"
        sub="Everything Hunty sent out, and what came back"
        action={
          <Button size="sm" variant="ghost" onClick={exportCsv} disabled={exporting} icon={<span>⬇️</span>}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        }
      />

      {error && (
        <Card className="bg-coral/15!">
          <p className="text-sm font-semibold">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total sent" value={counts.all} emoji="📤" tone="bg-butter-300" />
        <Stat label="Viewed" value={counts.viewed} hint="recruiter opened it" emoji="👀" />
        <Stat
          label="Interviews"
          value={counts.interview}
          hint="the ones that matter"
          emoji="🎤"
          tone="bg-sky-soft"
        />
        <Stat label="In queue" value={counts.queued} hint="goes out at 06:00" emoji="⏳" />
      </div>

      {/* filter bar */}
      <Card className="flex flex-wrap items-center gap-2.5 p-3.5">
        <div className="min-w-52 flex-1">
          <Input
            placeholder="Search role or company…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)}>
              <Chip tone={filter === f ? 'ink' : 'white'} className="cursor-pointer capitalize">
                {f === 'all' ? '✨ all' : `${statusMeta[f].emoji} ${statusMeta[f].label}`}
              </Chip>
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <Card>
          <Empty emoji="📡" title="Asking the API…" />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <Empty
            emoji="🫙"
            title="Nothing here"
            sub="No application matches that filter. Try a different one."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => {
            const meta = statusMeta[a.status]
            return (
              <Card key={a.id} className="toon-lift p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="toon-sm flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-butter-200 text-3xl">
                    {a.logo}
                  </div>

                  <div className="min-w-52 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg leading-tight">{a.role}</h3>
                      <Chip tone={meta.tone}>
                        {meta.emoji} {meta.label}
                      </Chip>
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-ink-soft">
                      {a.company} · {a.location}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {a.portal && <Chip tone="white">🌐 {a.portal}</Chip>}
                      {a.salary && <Chip tone="white">💰 {a.salary}</Chip>}
                      {a.resumeVariant && <Chip tone="white">✂️ {a.resumeVariant}</Chip>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-display text-3xl leading-none font-bold">
                        {a.matchScore}
                        <span className="text-base">%</span>
                      </div>
                      <div className="text-[11px] font-semibold text-ink-soft">match</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-ink-soft">{a.appliedAt}</div>
                      {a.jobUrl && (
                        <a href={a.jobUrl} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost" className="mt-1.5">
                            Open JD
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
