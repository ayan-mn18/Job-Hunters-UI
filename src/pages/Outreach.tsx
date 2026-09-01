import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Chip, Empty, Input, SectionTitle, Toggle } from '../components/ui'
import { api } from '../lib/api'

interface Health {
  enabled: boolean
  timezone: string | null
  invitesToday: number
  invitesThisWeek: number
  challenges30d: number
  acceptance: { invited: number; accepted: number; rate: number | null }
  paused: boolean
  pausedUntil: string | null
  status: string
  limits: {
    invitesPerDay: number
    invitesPerWeek: number
    perCompanyPerDay: number
    sendWindow: { startHour: number; endHour: number }
    withdrawAfterDays: number
  }
  neverAutomated: string[]
}

interface TargetSummary {
  id: string
  company: string
  targetRole: string | null
  status: string
  prospects: number
  waiting: number
}

interface Message {
  id: string
  kind: string
  body: string
  approved: boolean
  sentAt: string | null
}

interface Prospect {
  id: string
  name: string
  title: string | null
  profileUrl: string
  degree: number
  score: number
  signals: { relationship?: string; reasons?: string[] }
  state: string
  messages: Message[]
}

export function Outreach() {
  const [health, setHealth] = useState<Health | null>(null)
  const [targets, setTargets] = useState<TargetSummary[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [h, t] = await Promise.all([
        api.get<Health>('/outreach/health'),
        api.get<TargetSummary[]>('/outreach/targets'),
      ])
      setHealth(h.data)
      setTargets(t.data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load outreach.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function openTarget(id: string) {
    setOpenId(id)
    setProspects([])
    const { data } = await api.get<{ prospects: Prospect[] }>(`/outreach/targets/${id}/prospects`)
    setProspects(data.prospects)
  }

  async function addTarget() {
    if (!company.trim()) return
    await api.post('/outreach/targets', { company: company.trim(), targetRole: role.trim() || undefined })
    setCompany('')
    setRole('')
    await load()
  }

  async function approve(messageIds: string[]) {
    if (messageIds.length === 0) return
    await api.post('/outreach/messages/approve', { messageIds })
    if (openId) await openTarget(openId)
    await load()
  }

  async function setEnabled(enabled: boolean) {
    await api.put('/outreach/settings', { enabled })
    await load()
  }

  const pendingApproval = prospects.flatMap((prospect) =>
    prospect.messages.filter((message) => !message.approved && !message.sentAt).map((message) => message.id),
  )

  return (
    <div className="space-y-5">
      <SectionTitle emoji="🎯" title="Get referred" />

      {error && <Card className="bg-coral/15!">{error}</Card>}

      {/*
        The health strip leads, not the feature. If this engine is ever quietly
        damaging someone's LinkedIn account, this is where it shows first — so
        it is the first thing on the screen rather than a settings sub-page.
      */}
      {health && (
        <Card className={health.paused ? 'bg-coral/15!' : undefined}>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="font-display text-lg font-bold">
                {health.paused ? 'Paused' : health.enabled ? 'Running' : 'Switched off'}
              </div>
              <div className="text-sm font-semibold text-ink-soft">{health.status}</div>
            </div>
            <div className="ml-auto">
              <Toggle
                on={health.enabled}
                onClick={() => void setEnabled(!health.enabled)}
                label="Send invitations for me"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <Stat label="today" value={`${health.invitesToday}/${health.limits.invitesPerDay}`} />
            <Stat label="this week" value={`${health.invitesThisWeek}/${health.limits.invitesPerWeek}`} />
            <Stat
              label="accepted"
              value={
                health.acceptance.rate === null
                  ? '—'
                  : `${Math.round(health.acceptance.rate * 100)}%`
              }
            />
            <Stat label="checkpoints" value={String(health.challenges30d)} />
          </div>

          <p className="mt-3 text-[13px] font-semibold text-ink-soft">
            Invitations go out between {health.limits.sendWindow.startHour}:00 and{' '}
            {health.limits.sendWindow.endHour}:00 your time, at most{' '}
            {health.limits.perCompanyPerDay} per company a day, and unaccepted ones are withdrawn
            after {health.limits.withdrawAfterDays} days. Nothing sends until you approve it.
          </p>
          <p className="mt-1 text-[13px] font-semibold text-ink-soft">
            Never automated: {health.neverAutomated.join(', ')}.
          </p>
        </Card>
      )}

      <Card>
        <h3 className="text-xl">Add a company</h3>
        <p className="mt-1 text-[15px] font-semibold text-ink-soft">
          Hunty finds people there at your level or one above, ranks them, and writes the ask.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Stripe"
            className="max-w-56"
          />
          <Input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Backend Engineer (optional)"
            className="max-w-64"
          />
          <Button onClick={() => void addTarget()} disabled={!company.trim()}>
            Add
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card>Loading…</Card>
      ) : targets.length === 0 ? (
        <Empty emoji="🏢" title="No companies yet" sub="Name one above and Hunty will start looking." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {targets.map((target) => (
            <Card key={target.id} className={openId === target.id ? 'bg-butter-200!' : undefined}>
              <button type="button" className="block w-full text-left" onClick={() => void openTarget(target.id)}>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold">{target.company}</span>
                  {target.waiting > 0 && <Chip tone="coral">{target.waiting} to approve</Chip>}
                </div>
                <div className="mt-1 text-sm font-semibold text-ink-soft">
                  {target.targetRole ?? 'any role'} · {target.prospects} people found
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}

      {openId && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl">Who could refer you</h3>
            {pendingApproval.length > 0 && (
              <Button size="sm" className="ml-auto" onClick={() => void approve(pendingApproval)}>
                Approve all {pendingApproval.length}
              </Button>
            )}
          </div>

          {prospects.length === 0 ? (
            <Empty
              emoji="🔍"
              title="Nobody found yet"
              sub="Hunty looks during the next LinkedIn sweep. Connect LinkedIn in My Kit if you have not."
            />
          ) : (
            prospects.map((prospect) => (
              <Card key={prospect.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={prospect.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-display font-bold underline"
                  >
                    {prospect.name}
                  </a>
                  <span className="text-sm font-semibold text-ink-soft">{prospect.title}</span>
                  <Chip tone="white">{prospect.degree === 1 ? 'connected' : `${prospect.degree}nd degree`}</Chip>
                  <Chip tone="yellow">{prospect.score}</Chip>
                  <Chip tone={prospect.state === 'accepted' ? 'mint' : 'white'}>{prospect.state}</Chip>
                </div>

                {(prospect.signals.reasons ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(prospect.signals.reasons ?? []).map((reason) => (
                      <Chip key={reason} tone="white">
                        {reason}
                      </Chip>
                    ))}
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  {prospect.messages.map((message) => (
                    <div key={message.id} className="toon-sm rounded-2xl bg-white p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xs font-bold uppercase text-ink-soft">
                          {message.kind}
                        </span>
                        {message.sentAt ? (
                          <Chip tone="mint">sent</Chip>
                        ) : message.approved ? (
                          <Chip tone="yellow">approved</Chip>
                        ) : (
                          <Chip tone="white">waiting for you</Chip>
                        )}
                        {!message.approved && !message.sentAt && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-auto"
                            onClick={() => void approve([message.id])}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                      <p className="mt-1.5 text-[15px] font-semibold whitespace-pre-wrap">{message.body}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="toon-sm rounded-2xl bg-white p-2.5 text-center">
      <div className="font-display text-xl leading-none font-bold">{value}</div>
      <div className="text-[11px] font-semibold text-ink-soft">{label}</div>
    </div>
  )
}
