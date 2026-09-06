import { useEffect, useRef, useState } from 'react'
import { LiveView } from '../components/LiveView'
import { Mascot } from '../components/Mascot'
import {
  Button,
  Card,
  Chip,
  Field,
  Input,
  Progress,
  SectionTitle,
  Toggle,
} from '../components/ui'
import { api, BASE_URL } from '../lib/api'
import type { HuntCandidate, HuntSpec, HuntStartResult, HuntStatus, Portal, PortalAccount, Resume, ApplyFieldsState } from '../lib/types'

const steps = [
  { n: 1, emoji: '📄', title: 'Read resume', note: 'pull skills, years, titles' },
  { n: 2, emoji: '🔎', title: 'Scrape portals', note: 'every morning at 06:00' },
  { n: 3, emoji: '🧮', title: 'Score match', note: 'JD vs your profile' },
  { n: 4, emoji: '✂️', title: 'Tailor resume', note: 'one variant per JD' },
  { n: 5, emoji: '📮', title: 'Apply', note: 'forms filled from My Kit' },
]

const ACCOUNT_PORTALS: Record<string, true> = { wellfound: true, instahyre: true }

type SpecForm = {
  roles: string
  dreamCompanies: string
  locations: string
  dealBreakers: string
  minMatchScore: number
  dailyTarget: number
}

function toForm(spec: HuntSpec): SpecForm {
  return {
    roles: spec.rolesText,
    dreamCompanies: spec.dreamCompaniesText,
    locations: spec.locationsText,
    dealBreakers: spec.dealBreakersText,
    minMatchScore: spec.minMatchScore,
    dailyTarget: spec.dailyTarget,
  }
}

export function Hunt() {
  const [form, setForm] = useState<SpecForm | null>(null)
  const [status, setStatus] = useState<HuntStatus | null>(null)
  const [portals, setPortals] = useState<Portal[]>([])
  const [baseResume, setBaseResume] = useState<Resume | null>(null)
  const [portalAccounts, setPortalAccounts] = useState<PortalAccount[]>([])
  const [accountBusy, setAccountBusy] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [candidates, setCandidates] = useState<HuntCandidate[]>([])
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [applyFields, setApplyFields] = useState<ApplyFieldsState | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get<HuntSpec>('/hunt/spec'),
      api.get<HuntStatus>('/hunt/status'),
      api.get<Portal[]>('/portals'),
      api.get<Resume | null>('/resumes/base'),
      api.get<PortalAccount[]>('/portal-accounts'),
    ])
      .then(([specRes, statusRes, portalsRes, resumeRes, accountsRes]) => {
        if (cancelled) return
        setForm(toForm(specRes.data))
        setStatus(statusRes.data)
        setPortals(portalsRes.data)
        setBaseResume(resumeRes.data)
        setPortalAccounts(accountsRes.data)
        const runId = statusRes.data.currentRun?.id
        if (statusRes.data.awaitingApproval && runId) void loadCandidates(runId)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the hunt.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const running = status?.running ?? false
  const applying = status?.applying ?? false
  const awaitingApproval = status?.awaitingApproval ?? false
  const active = running || applying
  const [watchingAttemptId, setWatchingAttemptId] = useState<string | null>(null)
  const liveAttemptId = status?.liveAttemptId ?? null

  // The attempt in front of a browser changes between polls; drop a stale
  // watch rather than showing a panel connected to an attempt that finished.
  useEffect(() => {
    if (watchingAttemptId && watchingAttemptId !== liveAttemptId) setWatchingAttemptId(null)
  }, [liveAttemptId, watchingAttemptId])

  // While a hunt is out, poll for it to come back. Stops as soon as the run
  // leaves a running state, and cleans up if the page is left mid-hunt.
  useEffect(() => {
    if (!active) return
    let cancelled = false
    const timer = window.setInterval(() => {
      api
        .get<HuntStatus>('/hunt/status')
        .then(({ data }) => {
          if (cancelled) return
          setStatus(data)
          const runId = data.currentRun?.id
          if (data.awaitingApproval && runId) void loadCandidates(runId)
          if (data.currentRun?.error) setError(data.currentRun.error)
        })
        .catch(() => {
          // A dropped poll is not worth an error banner; the next tick retries.
        })
    }, 3000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  async function loadCandidates(runId: string): Promise<void> {
    try {
      const { data } = await api.get<HuntCandidate[]>(`/hunt/runs/${runId}/candidates`)
      setCandidates(data)
      setSelectedCandidates(data.slice(0, 100).map((candidate) => candidate.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the candidate list.')
    }
  }
  const connected = portals.filter((p) => p.connected).length
  const submitted = status?.currentRun?.applicationsSubmitted ?? 0
  const target = status?.currentRun?.targetApplications ?? form?.dailyTarget ?? 50

  async function startHunt() {
    setBusy(true)
    setError('')
    setWarnings([])
    setCandidates([])
    try {
      // The server now answers as soon as the run exists and scrapes in the
      // background, so the button stops being a twenty-second freeze; the
      // polling effect below takes it from here.
      const { data } = await api.post<HuntStartResult>('/hunt/start', {})
      setStatus((current) =>
        current
          ? { ...current, running: true, applying: false, awaitingApproval: false, currentRun: data, candidateCount: 0 }
          : current,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the hunt.')
    } finally {
      setBusy(false)
    }
  }

  async function stopHunt() {
    setBusy(true)
    setError('')
    try {
      await api.post('/hunt/stop')
      const { data: fresh } = await api.get<HuntStatus>('/hunt/status')
      setStatus(fresh)
      setWarnings([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not stop the hunt.')
    } finally {
      setBusy(false)
    }
  }

  async function approveBatch() {
    const runId = status?.currentRun?.id
    if (!runId || selectedCandidates.length === 0) return

    // Ask for the form answers *before* queueing rather than letting the run
    // start and fail one application at a time on a missing phone number.
    try {
      const { data: fields } = await api.get<ApplyFieldsState>('/intake/apply-fields')
      if (!fields.canApply) {
        setApplyFields(fields)
        return
      }
    } catch {
      // If the check itself fails, let the approval through — the server
      // gates it too, and blocking on a failed precheck would be worse.
    }

    setBusy(true)
    setError('')
    try {
      await api.post(`/hunt/runs/${runId}/approve`, { candidateIds: selectedCandidates })
      const { data: fresh } = await api.get<HuntStatus>('/hunt/status')
      setStatus(fresh)
      setCandidates([])
      setSelectedCandidates([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve this batch.')
    } finally {
      setBusy(false)
    }
  }

  /** Collects the missing form answers, then continues the approval. */
  async function saveApplyFields(answers: Record<string, string>) {
    setBusy(true)
    setError('')
    try {
      const { data: fields } = await api.post<ApplyFieldsState>('/intake/apply-fields', answers)
      if (!fields.canApply) {
        setApplyFields(fields)
        return
      }
      setApplyFields(null)
      await approveBatch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save those details.')
    } finally {
      setBusy(false)
    }
  }

  async function saveSpec() {
    if (!form) return
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const { data } = await api.put<HuntSpec>('/hunt/spec', form)
      setForm(toForm(data))
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the spec.')
    } finally {
      setSaving(false)
    }
  }

  async function togglePortal(portal: Portal) {
    // Flip it on screen now; roll back if the server says no.
    setPortals((list) =>
      list.map((p) => (p.id === portal.id ? { ...p, connected: !p.connected } : p)),
    )
    try {
      const { data } = await api.put<Portal>(`/portals/${portal.id}`, {
        connected: !portal.connected,
      })
      setPortals((list) => list.map((p) => (p.id === data.id ? data : p)))
    } catch (err) {
      setPortals((list) =>
        list.map((p) => (p.id === portal.id ? { ...p, connected: portal.connected } : p)),
      )
      setError(err instanceof Error ? err.message : 'Could not update that portal.')
    }
  }

  async function provisionAccount(portalId: string) {
    setAccountBusy(portalId)
    setError('')
    try {
      const { data } = await api.post<PortalAccount>(`/portal-accounts/${portalId}/provision`, {})
      setPortalAccounts((current) => [...current.filter((account) => account.portalId !== portalId), data])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create portal account.')
    } finally {
      setAccountBusy(null)
    }
  }

  async function syncAccount(portalId: string) {
    setAccountBusy(portalId)
    setError('')
    try {
      const { data } = await api.post<PortalAccount>(`/portal-accounts/${portalId}/sync`, {})
      setPortalAccounts((current) => [...current.filter((account) => account.portalId !== portalId), data])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sync portal profile.')
    } finally {
      setAccountBusy(null)
    }
  }

  async function uploadResume(file: File) {
    setError('')
    const body = new FormData()
    body.append('file', file)
    body.append('isBase', 'true')
    try {
      const { data } = await api.upload<Resume>('/resumes', body)
      setBaseResume(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The upload failed.')
    }
  }

  async function previewResume() {
    if (!baseResume) return
    try {
      const { data } = await api.get<{ url: string }>(`/resumes/${baseResume.id}/download`)
      window.open(data.url, '_blank', 'noopener')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the resume.')
    }
  }

  async function confirmResumeFacts() {
    if (!baseResume) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.get<{ document: unknown; version: number }>(`/resumes/${baseResume.id}/document`)
      const accepted = window.confirm(
        `Confirm parsed resume facts?\n\nTitles: ${baseResume.parsedTitles.join(', ')}\nSkills: ${baseResume.parsedSkills.join(', ')}`,
      )
      if (!accepted) return
      const result = await api.put<{ confirmedAt: string }>(`/resumes/${baseResume.id}/document`, {
        document: data.document,
        confirm: true,
      })
      setBaseResume((current) => current ? { ...current, structuredConfirmedAt: result.data.confirmedAt } : current)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm parsed resume facts.')
    } finally {
      setBusy(false)
    }
  }

  if (!form || !status) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <Mascot mood="sleepy" size={110} />
        <p className="font-display font-semibold text-ink-soft">
          {error || 'sharpening the spears…'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <SectionTitle
        emoji="🎯"
        title="The Hunt"
        sub="Tell Hunty what you want. Hunty does the boring part."
      />

      {error && (
        <Card className="bg-coral/15!">
          <p className="text-sm font-semibold">{error}</p>
        </Card>
      )}

      {/* control panel */}
      <Card className={active ? 'bg-mint/25!' : awaitingApproval ? 'bg-blue-100!' : 'bg-butter-300!'}>
        <div className="flex flex-wrap items-center gap-5">
          <Mascot mood={active ? 'hunting' : 'happy'} size={110} />
          <div className="min-w-56 flex-1">
            <Chip tone={active ? 'mint' : awaitingApproval ? 'blue' : 'white'}>
              {running ? '● hunting right now' : applying ? '● applying approved jobs' : awaitingApproval ? 'review needed' : '○ idle'}
            </Chip>
            <h3 className="mt-2 text-3xl">
              {running
                ? 'Out in the wild.'
                : applying
                  ? 'Finishing approved applications.'
                : awaitingApproval
                  ? `${status?.candidateCount ?? candidates.length} jobs await approval.`
                  : 'Ready when you are.'}
            </h3>
            <p className="mt-1 text-sm font-semibold text-ink-soft">
              {connected} sources enabled · target {form.dailyTarget} applications daily
            </p>
            <div className="mt-3 max-w-sm">
              <Progress value={submitted} max={target} />
            </div>
            {warnings.length > 0 && (
              <ul className="mt-3 space-y-1">
                {warnings.map((warning) => (
                  <li key={warning} className="text-xs font-semibold text-ink-soft">{warning}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {liveAttemptId && (
              <Button size="sm" variant="blue" onClick={() => setWatchingAttemptId(liveAttemptId)}>
                👀 Watch live
              </Button>
            )}
            <Button
              size="lg"
              variant={active || awaitingApproval ? 'danger' : 'blue'}
              disabled={busy}
              onClick={active || awaitingApproval ? stopHunt : startHunt}
            >
              {busy ? 'Working…' : active || awaitingApproval ? 'Stop hunt' : 'Find today’s jobs'}
            </Button>
          </div>
        </div>
      </Card>

      {watchingAttemptId && (
        <LiveView
          attemptId={watchingAttemptId}
          liveUrl={status?.liveUrl ?? null}
          onClose={() => setWatchingAttemptId(null)}
        />
      )}

      {awaitingApproval && candidates.length > 0 && (
        <section>
          <SectionTitle
            emoji="✅"
            title="Approve today’s batch"
            sub={`${selectedCandidates.length} selected · maximum 100`}
            action={
              <Button size="sm" variant="blue" disabled={busy || selectedCandidates.length === 0} onClick={() => void approveBatch()}>
                Approve and apply
              </Button>
            }
          />
          <div className="space-y-3">
            {candidates.map((candidate) => {
              const selected = selectedCandidates.includes(candidate.id)
              return (
                <Card key={candidate.id} className={selected ? 'bg-mint/15!' : 'opacity-70'}>
                  <label className="flex cursor-pointer gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => setSelectedCandidates((current) =>
                        current.includes(candidate.id)
                          ? current.filter((id) => id !== candidate.id)
                          : current.length < 100 ? [...current, candidate.id] : current,
                      )}
                      className="mt-1 h-5 w-5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg">{candidate.title}</h3>
                        <Chip tone={candidate.score >= 80 ? 'mint' : 'yellow'}>{candidate.score}% match</Chip>
                        <Chip tone="white">{candidate.sourcePortal}</Chip>
                      </div>
                      <p className="font-semibold">{candidate.company} · {candidate.location || candidate.remote}</p>
                      <p className="mt-1 text-sm text-ink-soft">{candidate.reasons.join(' · ')}</p>
                      <a href={candidate.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold underline">
                        Open job
                      </a>
                    </div>
                  </label>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* pipeline */}
      <section>
        <SectionTitle emoji="⚙️" title="How a hunt runs" sub="five steps, no clicking" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {steps.map((s, i) => (
            <Card key={s.n} className="p-4" tilt={i % 2 ? 1 : -1}>
              <div className="text-2xl">{s.emoji}</div>
              <div className="mt-1.5 font-display text-sm font-bold">
                {s.n}. {s.title}
              </div>
              <div className="mt-0.5 text-xs text-ink-soft">{s.note}</div>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* spec */}
        <section>
          <SectionTitle
            emoji="📝"
            title="Your spec"
            sub="what counts as a good job"
            action={
              <Button size="sm" onClick={saveSpec} disabled={saving} icon={<span>💾</span>}>
                {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save spec'}
              </Button>
            }
          />
          <Card className="space-y-4">
            <Field label="Roles you want" hint="comma separated, most wanted first">
              <Input
                value={form.roles}
                onChange={(e) => setForm({ ...form, roles: e.target.value })}
                placeholder="Senior Frontend Engineer, Full-stack Engineer"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preferred companies">
                <Input
                  value={form.dreamCompanies}
                  onChange={(e) => setForm({ ...form, dreamCompanies: e.target.value })}
                  placeholder="Stripe, Linear, Vercel, Razorpay"
                />
              </Field>
              <Field label="Locations">
                <Input
                  value={form.locations}
                  onChange={(e) => setForm({ ...form, locations: e.target.value })}
                  placeholder="Remote, Bengaluru, Pune"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Minimum match score" hint="skip anything weaker">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.minMatchScore}
                  onChange={(e) =>
                    setForm({ ...form, minMatchScore: Number(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="Applications per day">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.dailyTarget}
                  onChange={(e) => setForm({ ...form, dailyTarget: Number(e.target.value) || 1 })}
                />
              </Field>
            </div>
            <Field label="Deal breakers" hint="Hunty walks away from these">
              <Input
                value={form.dealBreakers}
                onChange={(e) => setForm({ ...form, dealBreakers: e.target.value })}
                placeholder="on-site only, unpaid, <2 yrs experience required"
              />
            </Field>
          </Card>
        </section>

        {/* resume + portals */}
        <section className="space-y-6">
          <div>
            <SectionTitle emoji="📄" title="Base resume" sub="every variant starts here" />
            <Card className="border-dashed! bg-butter-50! text-center">
              <div className="animate-bob text-4xl">📄</div>
              {baseResume ? (
                <>
                  <div className="mt-2 font-display font-bold">{baseResume.fileName}</div>
                  <div className="text-xs text-ink-soft">
                    {baseResume.parsedSkills.length > 0
                      ? `${baseResume.parsedSkills.length} skills found`
                      : 'stored'}{' '}
                    ·{' '}
                    {baseResume.parsedAt
                      ? `parsed ${new Date(baseResume.parsedAt).toLocaleDateString()}`
                      : 'parse pending'}
                  </div>
                  {baseResume.parsedTitles.length > 0 && (
                    <p className="mt-2 text-xs font-semibold text-ink-soft">
                      {baseResume.parsedTitles.join(' · ')}
                    </p>
                  )}
                  {baseResume.structuredConfirmedAt ? (
                    <Chip tone="mint" className="mt-2">facts confirmed</Chip>
                  ) : (
                    <Chip tone="yellow" className="mt-2">confirmation required for tailoring</Chip>
                  )}
                </>
              ) : (
                <>
                  <div className="mt-2 font-display font-bold">No resume yet</div>
                  <div className="text-xs text-ink-soft">
                    Hunty needs one before it can tailor variants
                  </div>
                </>
              )}
              <div className="mt-3 flex justify-center gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void uploadResume(file)
                    e.target.value = ''
                  }}
                />
                <Button size="sm" onClick={() => fileInput.current?.click()}>
                  {baseResume ? 'Replace' : 'Upload'}
                </Button>
                {baseResume && (
                  <Button size="sm" variant="ghost" onClick={previewResume}>
                    Preview
                  </Button>
                )}
                {baseResume && !baseResume.structuredConfirmedAt && (
                  <Button size="sm" variant="blue" disabled={busy} onClick={() => void confirmResumeFacts()}>
                    Confirm facts
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle
              emoji="🌐"
              title="Job portals"
              sub={`${connected} of ${portals.length} connected`}
            />
            <Card className="space-y-2.5">
              {portals.map((portal) => {
                const account = portalAccounts.find((value) => value.portalId === portal.id)
                return (
                  <div key={portal.id} className="rounded-2xl bg-butter-50 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{portal.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-display text-sm font-semibold">{portal.name}</div>
                        <div className="text-xs text-ink-soft">
                          {account ? `account: ${account.status}` : portal.connected ? `${portal.jobsFound} jobs found` : 'not connected'}
                        </div>
                      </div>
                      {ACCOUNT_PORTALS[portal.id] === true && !account && (
                        <Button size="sm" variant="ghost" disabled={accountBusy === portal.id} onClick={() => void provisionAccount(portal.id)}>
                          {accountBusy === portal.id ? 'Creating…' : 'Create account'}
                        </Button>
                      )}
                      {account && account.portalId === 'wellfound' && !account.profileSyncedAt && (
                        <Button size="sm" variant="ghost" disabled={accountBusy === portal.id} onClick={() => void syncAccount(portal.id)}>
                          Verify and sync
                        </Button>
                      )}
                      <Toggle label={portal.name} on={portal.connected} onClick={() => void togglePortal(portal)} />
                    </div>
                    {account?.actionRequired && (
                      <p className="mt-2 text-xs font-semibold text-coral">{account.actionRequired}</p>
                    )}
                  </div>
                )
              })}
              <p className="pt-1 text-center text-xs font-semibold text-ink-soft">
                Toggles save straight to the API at {BASE_URL}
              </p>
            </Card>
          </div>
        </section>
      </div>

      {applyFields && (
        <ApplyFieldsPrompt
          state={applyFields}
          busy={busy}
          onCancel={() => setApplyFields(null)}
          onSave={(answers) => void saveApplyFields(answers)}
        />
      )}
    </div>
  )
}

/**
 * Asked once, at the first application that needs these.
 *
 * Intake never asks for a phone number because it cannot change which jobs you
 * see. It can stop every one of them being submitted, though, so this is the
 * moment it earns the interruption.
 */
function ApplyFieldsPrompt({
  state,
  busy,
  onCancel,
  onSave,
}: {
  state: ApplyFieldsState
  busy: boolean
  onCancel: () => void
  onSave: (answers: Record<string, string>) => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(state.fields.map((field) => [field.id, field.value ?? ''])),
  )

  const missingRequired = state.fields.filter(
    (field) => field.required && !(answers[field.id] ?? '').trim(),
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="toon max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-butter-100 p-6">
        <h2 className="text-2xl">One thing before Hunty applies</h2>
        <p className="mt-2 text-sm font-semibold text-ink-soft">
          {state.hasBaseResume
            ? 'Every application form asks for these. Answer once and Hunty reuses them.'
            : 'Upload a resume in My Kit first — every application needs one attached.'}
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {state.fields
            .filter((field) => field.required || !field.value)
            .map((field) => (
              <label key={field.id} className="block">
                <span className="font-display text-sm font-bold">
                  {field.label}
                  {field.required && <span className="text-coral"> *</span>}
                </span>
                {field.help && (
                  <span className="mt-0.5 block text-xs font-semibold text-ink-soft">{field.help}</span>
                )}
                <Input
                  className="mt-1"
                  value={answers[field.id] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setAnswers((current) => ({ ...current, [field.id]: event.target.value }))
                  }
                />
              </label>
            ))}
        </div>

        <p className="mt-4 text-xs font-semibold text-ink-soft">
          Blank optional answers are fine — Hunty will pause on any form that insists, rather than
          guessing on your behalf.
        </p>

        <div className="mt-5 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
            Not now
          </Button>
          <div className="ml-auto">
            <Button
              size="sm"
              variant="blue"
              disabled={busy || missingRequired.length > 0 || !state.hasBaseResume}
              onClick={() => onSave(answers)}
            >
              {busy ? 'Saving…' : 'Save and apply'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
