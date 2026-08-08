import { useEffect, useState } from 'react'
import { Button, Card, Chip, Input, SectionTitle } from '../components/ui'
import { api } from '../lib/api'
import { JOB_STATUS_META, JOB_STATUS_ORDER } from '../lib/jobStatus'
import type {
  HuntRun,
  ScrapedJobDashboardItem,
  ScrapedJobDetail,
  ScrapedJobsDashboard,
  ScrapedJobStatus,
} from '../lib/types'

const SELECT_CLASS =
  'toon-sm w-full rounded-2xl bg-white px-3.5 py-2.5 font-sans text-sm font-semibold focus:outline-none'

export function ScrapedJobs() {
  const [dashboard, setDashboard] = useState<ScrapedJobsDashboard | null>(null)
  const [runs, setRuns] = useState<HuntRun[]>([])
  const [selectedRunId, setSelectedRunId] = useState('')
  const [status, setStatus] = useState<ScrapedJobStatus | 'all'>('all')
  const [portal, setPortal] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [minScore, setMinScore] = useState('')
  const [remote, setRemote] = useState('all')
  const [foundOn, setFoundOn] = useState('')
  const [postedOn, setPostedOn] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<20 | 50>(20)
  const [selected, setSelected] = useState<string[]>([])
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [detail, setDetail] = useState<ScrapedJobDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .get<HuntRun[]>('/hunt/runs')
      .then(({ data }) => {
        if (cancelled) return
        setRuns(data)
        setSelectedRunId(data[0]?.id ?? 'latest')
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load hunt runs.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1)
      setQuery(searchInput.trim())
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    if (!selectedRunId) return
    let cancelled = false
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (selectedRunId !== 'latest') params.set('runId', selectedRunId)
    if (status !== 'all') params.set('status', status)
    if (portal !== 'all') params.set('portal', portal)
    if (query) params.set('query', query)
    if (minScore) params.set('minScore', minScore)
    if (remote !== 'all') params.set('remote', remote)
    if (foundOn) params.set('foundOn', foundOn)
    if (postedOn) params.set('postedOn', postedOn)

    setLoading(true)
    setError('')
    api
      .get<ScrapedJobsDashboard>(`/dashboard/jobs?${params.toString()}`)
      .then(({ data }) => {
        if (cancelled) return
        setDashboard(data)
        if (selectedRunId === 'latest' && data.run) setSelectedRunId(data.run.id)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load scraped jobs.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [foundOn, minScore, page, pageSize, portal, postedOn, query, reloadKey, remote, selectedRunId, status])

  useEffect(() => {
    if (!modalOpen) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setModalOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [modalOpen])

  function resetFilters() {
    setStatus('all')
    setPortal('all')
    setSearchInput('')
    setQuery('')
    setMinScore('')
    setRemote('all')
    setFoundOn('')
    setPostedOn('')
    setPage(1)
    setSelected([])
  }

  async function openDetails(job: ScrapedJobDashboardItem) {
    if (!dashboard?.run) return
    setModalOpen(true)
    setDetail(null)
    setDetailError('')
    setDetailLoading(true)
    try {
      const { data } = await api.get<ScrapedJobDetail>(
        `/dashboard/jobs/${job.jobId}?runId=${dashboard.run.id}`,
      )
      setDetail(data)
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Could not load job details.')
    } finally {
      setDetailLoading(false)
    }
  }

  async function rescoreCurrentRun() {
    const runId = dashboard?.run?.id
    if (!runId) return
    setBusy(true)
    setError('')
    try {
      await api.post(`/hunt/runs/${runId}/rescore`, {})
      setSelected([])
      setPage(1)
      setReloadKey((value) => value + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not re-score this hunt.')
    } finally {
      setBusy(false)
    }
  }

  async function approveSelected() {
    const runId = dashboard?.run?.id
    if (!runId || selected.length === 0) return
    setBusy(true)
    setError('')
    try {
      await api.post(`/hunt/runs/${runId}/approve`, { candidateIds: selected })
      setSelected([])
      setReloadKey((value) => value + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve selected jobs.')
    } finally {
      setBusy(false)
    }
  }

  const canApprove = dashboard?.run?.status === 'awaiting_approval'
  const pagination = dashboard?.pagination

  return (
    <div className="space-y-5">
      <SectionTitle
        emoji=""
        title="Scraped jobs"
        sub={
          dashboard?.run
            ? `${pagination?.total ?? 0} matching · hunt from ${new Date(dashboard.run.createdAt).toLocaleDateString()}`
            : 'Browse jobs found by each hunt'
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={busy || !canApprove || dashboard?.historical}
              onClick={() => void rescoreCurrentRun()}
            >
              Re-score
            </Button>
            <Button
              size="sm"
              variant="blue"
              disabled={busy || selected.length === 0 || !canApprove}
              onClick={() => void approveSelected()}
            >
              Approve {selected.length}
            </Button>
          </div>
        }
      />

      {error && (
        <Card className="bg-coral/15! py-3!">
          <p className="text-sm font-semibold">{error}</p>
        </Card>
      )}

      <Card className="space-y-4 p-4!">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">Hunt date</span>
            <select
              aria-label="Hunt date"
              value={selectedRunId}
              onChange={(event) => {
                setSelectedRunId(event.target.value)
                setPage(1)
                setSelected([])
              }}
              className={SELECT_CLASS}
            >
              {runs.map((run) => (
                <option key={run.id} value={run.id}>
                  {new Date(run.createdAt).toLocaleDateString()} · {new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {run.status}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">Found on</span>
            <Input
              aria-label="Found on"
              type="date"
              value={foundOn}
              onChange={(event) => {
                setFoundOn(event.target.value)
                setPage(1)
              }}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">Posted on</span>
            <Input
              aria-label="Posted on"
              type="date"
              value={postedOn}
              onChange={(event) => {
                setPostedOn(event.target.value)
                setPage(1)
              }}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">Minimum match</span>
            <select
              aria-label="Minimum match"
              value={minScore}
              onChange={(event) => {
                setMinScore(event.target.value)
                setPage(1)
              }}
              className={SELECT_CLASS}
            >
              <option value="">Any score</option>
              <option value="50">50% and up</option>
              <option value="60">60% and up</option>
              <option value="70">70% and up</option>
              <option value="80">80% and up</option>
              <option value="90">90% and up</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_180px_200px_auto]">
          <Input
            aria-label="Search jobs"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search role, company, or skill"
          />
          <select
            aria-label="Remote type"
            value={remote}
            onChange={(event) => {
              setRemote(event.target.value)
              setPage(1)
            }}
            className={SELECT_CLASS}
          >
            <option value="all">Any workplace</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
            <option value="unknown">Not specified</option>
          </select>
          <select
            aria-label="Job source"
            value={portal}
            onChange={(event) => {
              setPortal(event.target.value)
              setPage(1)
            }}
            className={SELECT_CLASS}
          >
            <option value="all">All sources</option>
            {Object.entries(dashboard?.portals ?? {})
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([name, total]) => (
                <option key={name} value={name}>
                  {name} ({total})
                </option>
              ))}
          </select>
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Clear filters
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 border-t-2 border-dashed border-butter-300 pt-3">
          <button
            type="button"
            onClick={() => {
              setStatus('all')
              setPage(1)
            }}
          >
            <Chip tone={status === 'all' ? 'blue' : 'white'}>
              All {dashboard?.counts.all ?? 0}
            </Chip>
          </button>
          {JOB_STATUS_ORDER.filter((value) => (dashboard?.counts[value] ?? 0) > 0).map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => {
                setStatus(value)
                setPage(1)
              }}
            >
              <Chip tone={status === value ? 'blue' : JOB_STATUS_META[value].tone}>
                {JOB_STATUS_META[value].label} {dashboard?.counts[value]}
              </Chip>
            </button>
          ))}
        </div>
      </Card>

      {dashboard?.historical && (
        <p className="rounded-2xl border-2 border-ink bg-butter-200 px-4 py-2 text-sm font-semibold">
          Older hunt: exact scores and decisions were not stored yet.
        </p>
      )}

      {!dashboard && loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl border-[3px] border-ink bg-butter-100" />
          ))}
        </div>
      ) : dashboard?.items.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <h3 className="text-xl">No matching jobs</h3>
            <p className="mt-1 text-sm text-ink-soft">Try another hunt date or loosen filters.</p>
          </div>
        </Card>
      ) : (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-start justify-center rounded-2xl bg-butter-50/70 pt-10 backdrop-blur-[1px]">
              <Chip tone="white">Updating results…</Chip>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dashboard?.items.map((job) => {
              const meta = JOB_STATUS_META[job.status]
              const location =
                job.locations.map((item) => item.raw).filter(Boolean).join('; ') ||
                (job.remote === 'unknown' ? 'Location not listed' : job.remote)
              const selectable = canApprove && job.status === 'eligible' && Boolean(job.candidateId)
              const checked = job.candidateId ? selected.includes(job.candidateId) : false
              return (
                <article
                  key={job.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => void openDetails(job)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') void openDetails(job)
                  }}
                  className={[
                    'toon-sm toon-lift cursor-pointer rounded-2xl border-[3px] border-ink p-4',
                    'flex min-h-44 flex-col bg-white focus:outline-none focus:ring-4 focus:ring-sky-soft',
                    checked ? 'bg-mint/15!' : '',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-2">
                    {selectable && (
                      <input
                        type="checkbox"
                        aria-label={`Select ${job.title} at ${job.company}`}
                        checked={checked}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => {
                          const candidateId = job.candidateId
                          if (!candidateId) return
                          setSelected((current) =>
                            current.includes(candidateId)
                              ? current.filter((id) => id !== candidateId)
                              : current.length < 100
                                ? [...current, candidateId]
                                : current,
                          )
                        }}
                        className="mt-1 h-4 w-4 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {job.score !== null && (
                          <Chip tone={job.score >= 80 ? 'mint' : 'yellow'}>{job.score}% match</Chip>
                        )}
                        <Chip tone={meta.tone}>{meta.label}</Chip>
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-lg leading-tight">{job.title}</h3>
                      <p className="mt-0.5 truncate text-sm font-bold text-ink-soft">{job.company}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-xs font-semibold text-ink-soft">
                    <p className="truncate">{location} · {job.remote}</p>
                    {job.salary && <p className="text-ink">Pay: {job.salary}</p>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {job.skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="rounded-lg bg-butter-200 px-2 py-0.5 text-[11px] font-bold">
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 4 && (
                      <span className="px-1 text-[11px] font-bold text-ink-soft">+{job.skills.length - 4}</span>
                    )}
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-3 text-[11px] font-semibold text-ink-soft">
                    <span>Found {new Date(job.discoveredAt).toLocaleDateString()}</span>
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="font-bold text-ink underline underline-offset-2"
                    >
                      Source ↗
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {pagination && pagination.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[3px] border-ink bg-white p-3">
          <p className="text-sm font-semibold text-ink-soft">
            {(pagination.page - 1) * pagination.pageSize + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <select
              aria-label="Jobs per page"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value) as 20 | 50)
                setPage(1)
              }}
              className="rounded-xl border-2 border-ink bg-white px-2 py-1 text-sm font-bold"
            >
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
            <Button size="sm" variant="ghost" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <span className="min-w-20 text-center text-sm font-bold">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Job details"
            className="toon max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-blob bg-white p-5 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">Job details</p>
                <h2 className="mt-1 text-2xl">{detail?.title ?? 'Loading job…'}</h2>
                {detail && <p className="font-semibold text-ink-soft">{detail.company}</p>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => setModalOpen(false)}>
                Close
              </Button>
            </div>

            {detailLoading ? (
              <div className="py-16 text-center font-semibold text-ink-soft">Loading full details…</div>
            ) : detailError ? (
              <p className="my-8 rounded-2xl bg-coral/15 p-4 font-semibold">{detailError}</p>
            ) : detail ? (
              <div className="mt-5 space-y-5">
                <div className="flex flex-wrap gap-2">
                  {detail.score !== null && <Chip tone="mint">{detail.score}% match</Chip>}
                  <Chip tone={JOB_STATUS_META[detail.status].tone}>{JOB_STATUS_META[detail.status].label}</Chip>
                  <Chip tone="white">{detail.sourcePortal}</Chip>
                  <Chip tone="white">{detail.remote}</Chip>
                  {detail.salary && <Chip tone="yellow">{detail.salary}</Chip>}
                </div>
                <div className="grid gap-3 rounded-2xl bg-butter-100 p-4 text-sm sm:grid-cols-2">
                  <p><b>Posted:</b> {new Date(detail.postedAt).toLocaleString()}</p>
                  <p><b>Found:</b> {new Date(detail.discoveredAt).toLocaleString()}</p>
                  <p className="sm:col-span-2"><b>Location:</b> {detail.locations.map((item) => item.raw).filter(Boolean).join('; ') || 'Not listed'}</p>
                </div>
                {detail.reasons.length > 0 && (
                  <section>
                    <h3 className="text-lg">Match notes</h3>
                    <ul className="mt-2 space-y-1 text-sm font-semibold text-ink-soft">
                      {detail.reasons.map((reason) => <li key={reason}>— {reason}</li>)}
                    </ul>
                  </section>
                )}
                {detail.skills.length > 0 && (
                  <section>
                    <h3 className="text-lg">Skills</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {detail.skills.map((skill) => <Chip key={skill} tone="white">{skill}</Chip>)}
                    </div>
                  </section>
                )}
                <section>
                  <h3 className="text-lg">Description</h3>
                  <div className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-2xl border-2 border-ink bg-butter-50 p-4 text-sm leading-relaxed">
                    {detail.description || 'No description was provided by the source.'}
                  </div>
                </section>
                <div className="flex flex-wrap gap-2">
                  <a href={detail.applyUrl ?? detail.jobUrl} target="_blank" rel="noreferrer">
                    <Button variant="blue">Open application</Button>
                  </a>
                  {detail.applyUrl && detail.applyUrl !== detail.jobUrl && (
                    <a href={detail.jobUrl} target="_blank" rel="noreferrer">
                      <Button variant="ghost">View source</Button>
                    </a>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
