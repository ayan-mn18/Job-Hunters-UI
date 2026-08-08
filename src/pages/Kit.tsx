import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Chip, Empty, SectionTitle, Stat } from '../components/ui'
import { api } from '../lib/api'
import type {
  LinkedInReferralConnection,
  LinkedInReferralSyncResult,
  Referral,
  ReferralDay,
} from '../lib/types'

function SourceChip({ source }: { source: Referral['source'] }) {
  return source === 'linkedin' ? (
    <Chip tone="blue">💼 LinkedIn DM</Chip>
  ) : (
    <Chip tone="yellow">✉️ Email</Chip>
  )
}

export function Referrals() {
  const [days, setDays] = useState<ReferralDay[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [list, setList] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [rewritingId, setRewritingId] = useState<string | null>(null)
  const [sendingAll, setSendingAll] = useState(false)
  const [linkedin, setLinkedin] = useState<LinkedInReferralConnection | null>(null)
  const [syncingLinkedin, setSyncingLinkedin] = useState(false)
  const [syncNotice, setSyncNotice] = useState('')

  const loadDays = useCallback(async () => {
    const { data } = await api.get<ReferralDay[]>('/referrals/days?limit=14')
    setDays(data)
    return data
  }, [])

  const loadList = useCallback(async (date: string | null) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (date) params.set('date', date)
      const { data } = await api.get<Referral[]>(`/referrals?${params}`)
      setList(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load referrals.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      loadDays(),
      api.get<LinkedInReferralConnection>('/referrals/linkedin/status'),
    ])
      .then(([loadedDays, linkedinResponse]) => {
        if (cancelled) return
        setLinkedin(linkedinResponse.data)
        const first = loadedDays[0]?.date ?? null
        setSelectedDate(first)
        return loadList(first)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load referrals.')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [loadDays, loadList])

  function pickDay(date: string) {
    setSelectedDate(date)
    setOpenId(null)
    void loadList(date)
  }

  const day = days.find((d) => d.date === selectedDate) ?? null
  const pending = list.filter((r) => !r.handled)
  const done = list.filter((r) => r.handled)

  function patchIn(updated: Referral) {
    setList((rs) => rs.map((r) => (r.id === updated.id ? updated : r)))
  }

  async function toggleHandled(r: Referral) {
    try {
      const { data } = await api.patch<Referral>(`/referrals/${r.id}`, { handled: !r.handled })
      patchIn(data)
      void loadDays()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update that referral.')
    }
  }

  async function copyDraft(r: Referral) {
    await navigator.clipboard.writeText(r.draft)
    setCopiedId(r.id)
    setTimeout(() => setCopiedId((c) => (c === r.id ? null : c)), 1600)
  }

  async function rewrite(r: Referral) {
    setRewritingId(r.id)
    try {
      const { data } = await api.post<Referral>(`/referrals/${r.id}/draft`, {})
      patchIn(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The rewrite failed.')
    } finally {
      setRewritingId(null)
    }
  }

  async function downloadResume(r: Referral) {
    try {
      const { data } = await api.get<{ url: string }>(`/referrals/${r.id}/resume`)
      window.open(data.url, '_blank', 'noopener')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No resume to open.')
    }
  }

  async function sendAll() {
    setSendingAll(true)
    try {
      await Promise.all(
        pending.map((r) => api.patch<Referral>(`/referrals/${r.id}`, { handled: true })),
      )
      await loadList(selectedDate)
      await loadDays()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send every draft.')
    } finally {
      setSendingAll(false)
    }
  }
  async function syncLinkedIn() {
    setSyncingLinkedin(true)
    setError('')
    setSyncNotice('')
    try {
      const { data } = await api.post<LinkedInReferralSyncResult>('/referrals/linkedin/sync', {
        days: 7,
      })
      setSyncNotice(
        `Checked ${data.inboxesScanned.join(' + ') || 'LinkedIn'}: found ${data.visibleConversations} conversations, opened ${data.scannedThreads}, read ${data.recentInboundMessages} incoming messages from the last 7 days, matched ${data.matchedMessages}, imported ${data.imported}, and skipped ${data.duplicates} duplicates.`,
      )
      const loadedDays = await loadDays()
      const first = loadedDays[0]?.date ?? null
      setSelectedDate(first)
      await loadList(first)
      const { data: status } = await api.get<LinkedInReferralConnection>('/referrals/linkedin/status')
      setLinkedin(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sync LinkedIn referrals.')
    } finally {
      setSyncingLinkedin(false)
    }
  }


  return (
    <div className="space-y-6">
      <SectionTitle
        emoji="🤝"
        title="Referrals"
        sub="LinkedIn referral requests, grouped by day"
        action={
          linkedin?.connected ? (
            <Button size="sm" variant="blue" onClick={syncLinkedIn} disabled={syncingLinkedin}>
              {syncingLinkedin ? 'Scanning LinkedIn…' : 'Scan last 7 days'}
            </Button>
          ) : undefined
        }
      />
      {linkedin && !linkedin.connected && (
        <Card className="flex flex-wrap items-center gap-3 bg-sky-soft/35! py-3!">
          <div className="min-w-52 flex-1">
            <p className="font-display text-sm font-bold">Connect LinkedIn in My Kit</p>
            <p className="text-xs text-ink-soft">Then Hunty can check referral DMs every 24 hours.</p>
          </div>
          <Link to="/app/profile">
            <Button size="sm" variant="ghost">Open My Kit</Button>
          </Link>
        </Card>
      )}
      {syncNotice && (
        <Card className="bg-mint/15! py-3!">
          <p className="text-sm font-semibold">{syncNotice}</p>
        </Card>
      )}

      {error && (
        <Card className="bg-coral/15!">
          <p className="text-sm font-semibold">{error}</p>
        </Card>
      )}

      {/* day picker */}
      <Card className="p-3.5">
        {days.length === 0 ? (
          <p className="p-2 text-sm font-semibold text-ink-soft">
            No referral requests yet — when they land, they pile up here by day.
          </p>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {days.map((d) => {
              const active = d.date === selectedDate
              return (
                <button
                  key={d.date}
                  onClick={() => pickDay(d.date)}
                  className={[
                    'toon-sm toon-lift min-w-28 shrink-0 rounded-2xl px-3.5 py-2.5 text-left',
                    active ? 'bg-butter-400' : 'bg-white',
                  ].join(' ')}
                >
                  <div className="font-display text-sm font-bold">{d.label}</div>
                  <div className="font-display text-2xl leading-none font-bold">{d.total}</div>
                  <div className="text-[11px] font-semibold text-ink-soft">
                    {d.linkedin} DM · {d.email} mail
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Asked"
          value={day ? day.total : list.length}
          hint={day ? day.label.toLowerCase() : 'this page'}
          emoji="📥"
          tone="bg-butter-300"
        />
        <Stat label="LinkedIn DMs" value={day?.linkedin ?? 0} emoji="💼" tone="bg-sky-soft" />
        <Stat label="Emails" value={day?.email ?? 0} emoji="✉️" />
        <Stat label="Still waiting" value={pending.length} hint="drafts ready" emoji="⏰" />
      </div>

      {/* pending */}
      <section>
        <SectionTitle
          emoji="📥"
          title="Waiting on you"
          sub="Hunty already wrote the recommendation. Read, then send."
          action={
            pending.length > 0 ? (
              <Button size="sm" variant="blue" onClick={sendAll} disabled={sendingAll} icon={<span>⚡</span>}>
                {sendingAll ? 'Sending…' : 'Send all drafts'}
              </Button>
            ) : undefined
          }
        />

        {loading ? (
          <Card>
            <Empty emoji="📡" title="Asking the API…" />
          </Card>
        ) : pending.length === 0 ? (
          <Card>
            <Empty emoji="🎉" title="Pile is empty" sub="Everyone got their referral today." />
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => {
              const open = openId === r.id
              return (
                <Card key={r.id} className="p-0!">
                  <button
                    onClick={() => setOpenId(open ? null : r.id)}
                    className="flex w-full items-start gap-3.5 p-4 text-left"
                  >
                    <div className="toon-sm flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-butter-200 text-2xl">
                      {r.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-lg leading-tight font-semibold">
                          {r.name}
                        </span>
                        <SourceChip source={r.source} />
                        <Chip tone="white">🕘 {r.receivedAt}</Chip>
                      </div>
                      <div className="mt-0.5 text-sm text-ink-soft">{r.headline}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.targetRole && <Chip tone="white">🎯 {r.targetRole}</Chip>}
                        {r.jobId && <Chip tone="white">🆔 {r.jobId}</Chip>}
                        {r.resumeName && <Chip tone="white">📄 {r.resumeName}</Chip>}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-display text-2xl leading-none font-bold">
                        {r.matchScore}
                        <span className="text-sm">%</span>
                      </div>
                      <div className="text-[11px] font-semibold text-ink-soft">fit</div>
                    </div>
                  </button>

                  {open && (
                    <div className="animate-pop-in border-t-[3px] border-dashed border-butter-300 p-4">
                      {r.note && (
                        <div className="mb-3 rounded-2xl bg-butter-50 p-3 text-sm italic">
                          “{r.note}”
                        </div>
                      )}

                      <div className="mb-1.5 flex items-center gap-2">
                        <Chip tone="grape">✨ auto-written</Chip>
                        <span className="text-xs font-semibold text-ink-soft">
                          from their resume + the JD
                        </span>
                      </div>
                      <div className="toon-sm rounded-2xl bg-white p-3.5 text-sm leading-relaxed">
                        {r.draft || 'No draft yet — hit Rewrite and Hunty will write one.'}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="blue" onClick={() => copyDraft(r)}>
                          {copiedId === r.id ? '✅ Copied' : '📋 Copy message'}
                        </Button>
                        {(r.hasResumeFile || r.resumeName) && (
                          <Button size="sm" icon={<span>📄</span>} onClick={() => downloadResume(r)}>
                            Download resume
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => rewrite(r)} disabled={rewritingId === r.id}>
                          {rewritingId === r.id ? '✏️ Writing…' : '✏️ Rewrite'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto"
                          onClick={() => toggleHandled(r)}
                        >
                          ✅ Mark referred
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* done */}
      {done.length > 0 && (
        <section>
          <SectionTitle emoji="✅" title="Already referred" sub={`${done.length} done`} />
          <div className="space-y-2.5">
            {done.map((r) => (
              <Card key={r.id} className="flex items-center gap-3 bg-butter-50! p-3.5 opacity-80">
                <span className="text-xl">{r.avatar}</span>
                <span className="font-display text-sm font-semibold">{r.name}</span>
                <span className="truncate text-sm text-ink-soft">{r.targetRole}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => toggleHandled(r)}
                >
                  Undo
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
