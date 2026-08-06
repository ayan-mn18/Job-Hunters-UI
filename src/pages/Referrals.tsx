import { useState } from 'react'
import { Button, Card, Chip, Empty, SectionTitle, Stat } from '../components/ui'
import { referralDays, referrals as seed, type Referral } from '../data/mock'

function SourceChip({ source }: { source: Referral['source'] }) {
  return source === 'linkedin' ? (
    <Chip tone="blue">💼 LinkedIn DM</Chip>
  ) : (
    <Chip tone="yellow">✉️ Email</Chip>
  )
}

export function Referrals() {
  const [dayIndex, setDayIndex] = useState(0)
  const [list, setList] = useState(seed)
  const [openId, setOpenId] = useState<string | null>(seed[0]?.id ?? null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const day = referralDays[dayIndex]
  const pending = list.filter((r) => !r.handled)
  const done = list.filter((r) => r.handled)

  function toggleHandled(id: string) {
    setList((rs) => rs.map((r) => (r.id === id ? { ...r, handled: !r.handled } : r)))
  }

  async function copyDraft(r: Referral) {
    await navigator.clipboard.writeText(r.draft)
    setCopiedId(r.id)
    setTimeout(() => setCopiedId((c) => (c === r.id ? null : c)), 1600)
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        emoji="🤝"
        title="Referrals"
        sub="Every DM and email asking for a referral, gathered in one pile"
      />

      {/* day picker */}
      <Card className="p-3.5">
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {referralDays.map((d, i) => {
            const total = d.linkedin + d.email
            const active = i === dayIndex
            return (
              <button
                key={d.date}
                onClick={() => setDayIndex(i)}
                className={[
                  'toon-sm toon-lift min-w-28 shrink-0 rounded-2xl px-3.5 py-2.5 text-left',
                  active ? 'bg-butter-400' : 'bg-white',
                ].join(' ')}
              >
                <div className="font-display text-sm font-bold">{d.label}</div>
                <div className="font-display text-2xl leading-none font-bold">{total}</div>
                <div className="text-[11px] font-semibold text-ink-soft">
                  {d.linkedin} DM · {d.email} mail
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Asked today"
          value={day.linkedin + day.email}
          hint={day.label.toLowerCase()}
          emoji="📥"
          tone="bg-butter-300"
        />
        <Stat label="LinkedIn DMs" value={day.linkedin} emoji="💼" tone="bg-sky-soft" />
        <Stat label="Emails" value={day.email} emoji="✉️" />
        <Stat label="Still waiting" value={pending.length} hint="drafts ready" emoji="⏰" />
      </div>

      {/* pending */}
      <section>
        <SectionTitle
          emoji="📥"
          title="Waiting on you"
          sub="Hunty already wrote the recommendation. Read, then send."
          action={
            <Button size="sm" variant="blue" icon={<span>⚡</span>}>
              Send all drafts
            </Button>
          }
        />

        {pending.length === 0 ? (
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
                        <Chip tone="white">🎯 {r.targetRole}</Chip>
                        <Chip tone="white">🆔 {r.jobId}</Chip>
                        <Chip tone="white">📄 {r.resumeName}</Chip>
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
                      <div className="mb-3 rounded-2xl bg-butter-50 p-3 text-sm italic">
                        “{r.note}”
                      </div>

                      <div className="mb-1.5 flex items-center gap-2">
                        <Chip tone="grape">✨ auto-written</Chip>
                        <span className="text-xs font-semibold text-ink-soft">
                          from their resume + the JD
                        </span>
                      </div>
                      <div className="toon-sm rounded-2xl bg-white p-3.5 text-sm leading-relaxed">
                        {r.draft}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="blue" onClick={() => copyDraft(r)}>
                          {copiedId === r.id ? '✅ Copied' : '📋 Copy message'}
                        </Button>
                        <Button size="sm" icon={<span>📄</span>}>
                          Download resume
                        </Button>
                        <Button size="sm" variant="ghost">
                          ✏️ Rewrite
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto"
                          onClick={() => toggleHandled(r.id)}
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
                  onClick={() => toggleHandled(r.id)}
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
