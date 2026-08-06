import { useState } from 'react'
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
import { applications, type ApplicationStatus } from '../data/mock'

const statusMeta: Record<ApplicationStatus, { label: string; tone: ChipTone; emoji: string }> = {
  queued: { label: 'Queued', tone: 'white', emoji: '⏳' },
  applied: { label: 'Applied', tone: 'yellow', emoji: '📮' },
  viewed: { label: 'Viewed', tone: 'blue', emoji: '👀' },
  interview: { label: 'Interview', tone: 'mint', emoji: '🎤' },
  rejected: { label: 'Rejected', tone: 'coral', emoji: '💔' },
}

const filters: (ApplicationStatus | 'all')[] = [
  'all',
  'queued',
  'applied',
  'viewed',
  'interview',
  'rejected',
]

export function Applications() {
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all')
  const [q, setQ] = useState('')

  const rows = applications.filter((a) => {
    const okStatus = filter === 'all' || a.status === filter
    const needle = q.trim().toLowerCase()
    const okSearch =
      !needle ||
      a.role.toLowerCase().includes(needle) ||
      a.company.toLowerCase().includes(needle)
    return okStatus && okSearch
  })

  const count = (s: ApplicationStatus) => applications.filter((a) => a.status === s).length

  return (
    <div className="space-y-6">
      <SectionTitle
        emoji="📮"
        title="Applications"
        sub="Everything Hunty sent out, and what came back"
        action={
          <Button size="sm" variant="ghost" icon={<span>⬇️</span>}>
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total sent" value={applications.length} emoji="📤" tone="bg-butter-300" />
        <Stat label="Viewed" value={count('viewed')} hint="recruiter opened it" emoji="👀" />
        <Stat
          label="Interviews"
          value={count('interview')}
          hint="the ones that matter"
          emoji="🎤"
          tone="bg-sky-soft"
        />
        <Stat label="In queue" value={count('queued')} hint="goes out at 06:00" emoji="⏳" />
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

      {rows.length === 0 ? (
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
                      <Chip tone="white">🌐 {a.portal}</Chip>
                      <Chip tone="white">💰 {a.salary}</Chip>
                      <Chip tone="white">✂️ {a.resumeVariant}</Chip>
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
                      <Button size="sm" variant="ghost" className="mt-1.5">
                        Open JD
                      </Button>
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
