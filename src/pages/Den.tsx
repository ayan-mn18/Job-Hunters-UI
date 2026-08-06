import { Link } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { Button, Card, Chip, Progress, SectionTitle, Stat } from '../components/ui'
import { activity, applications, HUNTER, portals, referrals } from '../data/mock'

export function Den() {
  const pending = referrals.filter((r) => !r.handled).length
  const live = portals.filter((p) => p.connected)
  const scraped = live.reduce((sum, p) => sum + p.jobsFound, 0)

  return (
    <div className="space-y-7">
      {/* hero */}
      <Card className="relative overflow-hidden bg-butter-300!">
        <div className="pointer-events-none absolute -top-10 -right-10 h-44 w-44 rounded-full bg-butter-200" />
        <div className="relative flex flex-wrap items-center gap-6">
          <Mascot mood="hunting" size={132} />
          <div className="min-w-56 flex-1">
            <Chip tone="white">good morning, hunter</Chip>
            <h1 className="mt-2 text-4xl leading-tight">
              Hey {HUNTER.name} — Hunty bagged{' '}
              <span className="underline decoration-sky-pop decoration-[5px] underline-offset-4">
                {HUNTER.appliedToday} jobs
              </span>{' '}
              already.
            </h1>
            <p className="mt-2 max-w-lg text-[15px] font-semibold text-ink-soft">
              {HUNTER.dailyTarget - HUNTER.appliedToday} to go before the daily target.
              You have {pending} people waiting on a referral.
            </p>

            <div className="mt-4 max-w-md">
              <Progress value={HUNTER.appliedToday} max={HUNTER.dailyTarget} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link to="/hunt">
                <Button size="lg" icon={<span>🎯</span>}>
                  Send Hunty out
                </Button>
              </Link>
              <Link to="/referrals">
                <Button size="lg" variant="ghost" icon={<span>🤝</span>}>
                  {pending} referrals waiting
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
          value={HUNTER.appliedToday}
          hint="+22 since breakfast"
          emoji="📮"
          tone="bg-butter-300"
        />
        <Stat label="Jobs scraped" value={scraped} hint={`${live.length} portals live`} emoji="🔎" />
        <Stat label="Interviews" value={3} hint="1 this week" emoji="🎤" />
        <Stat
          label="Referrals waiting"
          value={pending}
          hint="drafts ready to send"
          emoji="🤝"
          tone="bg-sky-soft"
        />
      </div>

      {/* two columns */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionTitle
            emoji="📮"
            title="Freshly applied"
            sub="Hunty tailored a resume for each one"
            action={
              <Link to="/jobs">
                <Button size="sm" variant="ghost">
                  See all
                </Button>
              </Link>
            }
          />
          <div className="space-y-3">
            {applications.slice(0, 4).map((a) => (
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
        </section>

        <section>
          <SectionTitle emoji="🐾" title="Hunty's trail" sub="what happened recently" />
          <Card className="p-0!">
            <ul>
              {activity.map((a, i) => (
                <li
                  key={a.text}
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
