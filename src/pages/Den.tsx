import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { Mascot } from '../components/Mascot'
import { Button, Card, Chip, Empty, Input, Progress, SectionTitle, Stat, type ChipTone } from '../components/ui'
import { api } from '../lib/api'
import type { Dashboard, HuntRun, ScrapedJobsDashboard, ScrapedJobStatus } from '../lib/types'

const BANNER_KEY = 'jobhunters.demo.firstRunBannerDismissed'

const JOB_STATUS_META: Record<ScrapedJobStatus, { label: string; tone: ChipTone }> = {
  scraped: { label: 'Scraped', tone: 'white' },
  eligible: { label: 'Eligible', tone: 'mint' },
  below_threshold: { label: 'Below threshold', tone: 'yellow' },
  deal_breaker: { label: 'Deal breaker', tone: 'coral' },
  approved: { label: 'Approved', tone: 'blue' },
  rejected: { label: 'Not selected', tone: 'coral' },
  queued: { label: 'Queued', tone: 'grape' },
  tailored: { label: 'Resume ready', tone: 'blue' },
  applying: { label: 'Applying', tone: 'yellow' },
  applied: { label: 'Applied', tone: 'mint' },
  needs_review: { label: 'Needs review', tone: 'grape' },
  failed: { label: 'Failed', tone: 'coral' },
  closed: { label: 'Closed', tone: 'ink' },
}

const JOB_STATUS_ORDER: ScrapedJobStatus[] = [
  'eligible',
  'scraped',
  'below_threshold',
  'deal_breaker',
  'approved',
  'queued',
  'tailored',
  'applying',
  'applied',
  'needs_review',
  'rejected',
  'failed',
  'closed',
]

export function Den() {
  const { user } = useAuth()
  const [dash, setDash] = useState<Dashboard | null>(null)
  const [scrapedJobs, setScrapedJobs] = useState<ScrapedJobsDashboard | null>(null)
  const [huntRuns, setHuntRuns] = useState<HuntRun[]>([])
  const [selectedRunId, setSelectedRunId] = useState('')
  const [jobStatus, setJobStatus] = useState<ScrapedJobStatus | 'all'>('all')
  const [jobPortal, setJobPortal] = useState('all')
  const [jobQuery, setJobQuery] = useState('')
  const [error, setError] = useState('')

  const firstName = (user?.name ?? 'Hunter').split(' ')[0]
  const [showBanner, setShowBanner] = useState(
    () => localStorage.getItem(BANNER_KEY) !== '1',
  )

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get<Dashboard>('/dashboard'),
      api.get<ScrapedJobsDashboard>('/dashboard/jobs?limit=500'),
      api.get<HuntRun[]>('/hunt/runs'),
    ])
      .then(([dashboardResponse, jobsResponse, runsResponse]) => {
        if (!cancelled) {
          setDash(dashboardResponse.data)
          setScrapedJobs(jobsResponse.data)
          setHuntRuns(runsResponse.data)
          setSelectedRunId(jobsResponse.data.run?.id ?? '')
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the den.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function dismissBanner() {
    localStorage.setItem(BANNER_KEY, '1')
    setShowBanner(false)
  }

  async function selectHuntRun(runId: string) {
    setSelectedRunId(runId)
    setJobStatus('all')
    setJobPortal('all')
    setJobQuery('')
    try {
      const { data } = await api.get<ScrapedJobsDashboard>(`/dashboard/jobs?runId=${runId}&limit=500`)
      setScrapedJobs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load that hunt run.')
    }
  }

  if (error) {
    return (
      <Card>
        <Empty emoji="😵" title="The den did not load" sub={error} />
      </Card>
    )
  }

  if (!dash || !scrapedJobs) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <Mascot mood="sleepy" size={110} />
        <p className="font-display font-semibold text-ink-soft">counting today&apos;s pelts…</p>
      </div>
    )
  }

  const { hunter, stats, recentApplications, activity } = dash
  const normalizedQuery = jobQuery.trim().toLowerCase()
  const filteredJobs = scrapedJobs.items.filter((job) => {
    if (jobStatus !== 'all' && job.status !== jobStatus) return false
    if (jobPortal !== 'all' && job.sourcePortal !== jobPortal) return false
    if (!normalizedQuery) return true
    return `${job.title} ${job.company} ${job.skills.join(' ')}`.toLowerCase().includes(normalizedQuery)
  })
  const visibleJobs = filteredJobs.slice(0, 40)

  return (
    <div className="space-y-7">
      {showBanner && (
        <Card className="animate-pop-in flex flex-wrap items-center gap-4 bg-mint/25!">
          <span className="text-3xl">🎉</span>
          <div className="min-w-56 flex-1">
            <h3 className="text-xl">Your den is ready, {firstName}.</h3>
            <p className="text-sm font-semibold text-ink-soft">
              Your first real hunt runs tomorrow at 06:00. Until then, everything below
              is sample data so you can see what a busy week looks like.
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={dismissBanner}>
            Got it
          </Button>
        </Card>
      )}

      {/* hero */}
      <Card className="relative overflow-hidden bg-butter-300!">
        <div className="pointer-events-none absolute -top-10 -right-10 h-44 w-44 rounded-full bg-butter-200" />
        <div className="relative flex flex-wrap items-center gap-6">
          <Mascot mood="hunting" size={132} />
          <div className="min-w-56 flex-1">
            <Chip tone="white">good morning, hunter</Chip>
            <h1 className="mt-2 text-4xl leading-tight">
              Hey {firstName} — Hunty bagged{' '}
              <span className="underline decoration-sky-pop decoration-[5px] underline-offset-4">
                {hunter.appliedToday} jobs
              </span>{' '}
              already.
            </h1>
            <p className="mt-2 max-w-lg text-[15px] font-semibold text-ink-soft">
              {hunter.remainingToday} to go before the daily target. You have{' '}
              {stats.referralsWaiting} people waiting on a referral.
            </p>

            <div className="mt-4 max-w-md">
              <Progress value={hunter.appliedToday} max={hunter.dailyTarget} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link to="/app/hunt">
                <Button size="lg" icon={<span>🎯</span>}>
                  Send Hunty out
                </Button>
              </Link>
              <Link to="/app/referrals">
                <Button size="lg" variant="ghost" icon={<span>🤝</span>}>
                  {stats.referralsWaiting} referrals waiting
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Applied today"
          value={stats.appliedToday}
          hint={`of ${hunter.dailyTarget} daily target`}
          emoji="📮"
          tone="bg-butter-300"
        />
        <Stat
          label="Jobs scraped"
          value={stats.jobsScraped}
          hint={`${stats.portalsConnected} portals live`}
          emoji="🔎"
        />
        <Stat label="Interviews" value={stats.interviews} hint="the ones that matter" emoji="🎤" />
        <Stat
          label="Referrals waiting"
          value={stats.referralsWaiting}
          hint="drafts ready to send"
          emoji="🤝"
          tone="bg-sky-soft"
        />
      </div>

      <section>
        <SectionTitle
          emoji=""
          title="Scraped jobs"
          sub={scrapedJobs.run
            ? `${scrapedJobs.run.jobsScraped} fetched · ${scrapedJobs.run.jobsScored} scored · run ${scrapedJobs.run.status}`
            : 'No hunt data yet'}
        />
        <Card className="space-y-4">
          {scrapedJobs.historical && (
            <p className="rounded-xl bg-butter-200 px-3 py-2 text-xs font-semibold text-ink-soft">
              Historical run: exact decision statuses start with the next hunt.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setJobStatus('all')}>
              <Chip tone={jobStatus === 'all' ? 'blue' : 'white'}>All {scrapedJobs.counts.all ?? 0}</Chip>
            </button>
            {JOB_STATUS_ORDER.filter((status) => (scrapedJobs.counts[status] ?? 0) > 0).map((status) => (
              <button type="button" key={status} onClick={() => setJobStatus(status)}>
                <Chip tone={jobStatus === status ? 'blue' : JOB_STATUS_META[status].tone}>
                  {JOB_STATUS_META[status].label} {scrapedJobs.counts[status]}
                </Chip>
              </button>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_260px]">
            <Input
              value={jobQuery}
              onChange={(event) => setJobQuery(event.target.value)}
              placeholder="Search title, company, or skill"
            />
            <select
              aria-label="Job source"
              value={jobPortal}
              onChange={(event) => setJobPortal(event.target.value)}
              className="toon-sm rounded-2xl bg-white px-3.5 py-2.5 font-sans text-[15px] font-semibold"
            >
              <option value="all">All sources</option>
              {Object.entries(scrapedJobs.portals)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([portal, total]) => (
                  <option key={portal} value={portal}>{portal} ({total})</option>
                ))}
            </select>
            <select
              value={selectedRunId}
              onChange={(event) => void selectHuntRun(event.target.value)}
              aria-label="Hunt run"
              className="toon-sm rounded-2xl bg-white px-3.5 py-2.5 font-sans text-[15px] font-semibold"
            >
              {huntRuns.map((run) => (
                <option key={run.id} value={run.id}>
                  {new Date(run.createdAt).toLocaleString()} · {run.status}
                </option>
              ))}
            </select>
          </div>

          {visibleJobs.length === 0 ? (
            <Empty emoji="" title="No matching scraped jobs" sub="Change filters or run another hunt." />
          ) : (
            <div className="grid max-h-[960px] gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
              {visibleJobs.map((job) => {
                const meta = JOB_STATUS_META[job.status]
                const location = job.locations.map((item) => item.raw).filter(Boolean).join('; ') || job.remote
                return (
                  <article key={job.id} className="rounded-2xl border-[3px] border-ink bg-butter-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone={meta.tone}>{meta.label}</Chip>
                      <Chip tone="white">{job.sourcePortal}</Chip>
                      {job.score !== null && <Chip tone="yellow">{job.score}% match</Chip>}
                    </div>
                    <h3 className="mt-3 text-lg">{job.title}</h3>
                    <p className="text-sm font-semibold text-ink-soft">{job.company} · {location}</p>
                    {job.reasons.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs font-semibold text-ink-soft">
                        {job.reasons.slice(0, 3).map((reason) => <li key={reason}>— {reason}</li>)}
                      </ul>
                    )}
                    {job.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.skills.slice(0, 6).map((skill) => <Chip key={skill} tone="white">{skill}</Chip>)}
                      </div>
                    )}
                    <a href={job.jobUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold underline">
                      Open job
                    </a>
                  </article>
                )
              })}
            </div>
          )}
          {filteredJobs.length > visibleJobs.length && (
            <p className="text-center text-xs font-semibold text-ink-soft">
              Showing 40 of {filteredJobs.length}. Narrow filters to see others.
            </p>
          )}
        </Card>
      </section>

      {/* two columns */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionTitle
            emoji="📮"
            title="Freshly applied"
            sub="Hunty tailored a resume for each one"
            action={
              <Link to="/app/jobs">
                <Button size="sm" variant="ghost">
                  See all
                </Button>
              </Link>
            }
          />
          {recentApplications.length === 0 ? (
            <Card>
              <Empty
                emoji="🫙"
                title="Nothing sent yet"
                sub="Start a hunt and the latest applications land here."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((a) => (
                <Card key={a.id} className="toon-lift flex items-center gap-3.5 p-4">
                  <div className="toon-sm flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-butter-200 text-2xl">
                    {a.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display font-semibold">{a.role}</div>
                    <div className="truncate text-sm text-ink-soft">
                      {a.company} · {a.location}
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="font-display text-lg leading-none font-bold">
                      {a.matchScore}%
                    </div>
                    <div className="text-[11px] font-semibold text-ink-soft">match</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle emoji="🐾" title="Hunty's trail" sub="what happened recently" />
          <Card className="p-0!">
            {activity.length === 0 ? (
              <Empty emoji="🐾" title="No tracks yet" sub="Hunty's doings will show up here." />
            ) : (
              <ul>
                {activity.map((a, i) => (
                  <li
                    key={a.id}
                    className={[
                      'flex items-start gap-3 p-4',
                      i < activity.length - 1 ? 'border-b-[3px] border-dashed border-butter-300' : '',
                    ].join(' ')}
                  >
                    <span className="text-xl leading-none">{a.emoji}</span>
                    <span className="flex-1 text-sm font-semibold">{a.text}</span>
                    <span className="text-xs whitespace-nowrap text-ink-soft">{a.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="mt-4 bg-butter-200!" tilt={-1}>
            <div className="flex items-center gap-3">
              <Mascot mood="sleepy" size={64} />
              <p className="text-sm font-semibold">
                Hunty naps between 02:00 and 06:00. Everything queued now goes out at
                sunrise.
              </p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}
