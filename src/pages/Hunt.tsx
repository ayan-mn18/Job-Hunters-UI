import { useState } from 'react'
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
import { useAuth } from '../auth/context'
import { portals as seedPortals } from '../data/mock'

const steps = [
  { n: 1, emoji: '📄', title: 'Read resume', note: 'pull skills, years, titles' },
  { n: 2, emoji: '🔎', title: 'Scrape portals', note: 'every morning at 06:00' },
  { n: 3, emoji: '🧮', title: 'Score match', note: 'JD vs your profile' },
  { n: 4, emoji: '✂️', title: 'Tailor resume', note: 'one variant per JD' },
  { n: 5, emoji: '📮', title: 'Apply', note: 'forms filled from My Kit' },
]

export function Hunt() {
  const { user } = useAuth()
  const kit = user?.kit ?? {}

  const [running, setRunning] = useState(false)
  // Onboarding picks win over the seed data, when they exist.
  const [portals, setPortals] = useState(() =>
    kit.portals
      ? seedPortals.map((p) => ({ ...p, connected: kit.portals!.includes(p.id) }))
      : seedPortals,
  )
  const [target, setTarget] = useState(kit.dailyTarget ?? 100)

  const connected = portals.filter((p) => p.connected).length

  return (
    <div className="space-y-7">
      <SectionTitle
        emoji="🎯"
        title="The Hunt"
        sub="Tell Hunty what you want. Hunty does the boring part."
      />

      {/* control panel */}
      <Card className={running ? 'bg-mint/25!' : 'bg-butter-300!'}>
        <div className="flex flex-wrap items-center gap-5">
          <Mascot mood={running ? 'hunting' : 'happy'} size={110} />
          <div className="min-w-56 flex-1">
            <Chip tone={running ? 'mint' : 'white'}>
              {running ? '● hunting right now' : '○ idle'}
            </Chip>
            <h3 className="mt-2 text-3xl">
              {running ? 'Out in the wild.' : 'Ready when you are.'}
            </h3>
            <p className="mt-1 text-sm font-semibold text-ink-soft">
              {connected} portals connected · target {target} applications a day
            </p>
            <div className="mt-3 max-w-sm">
              <Progress value={running ? 68 : 0} max={target} />
            </div>
          </div>
          <Button
            size="lg"
            variant={running ? 'danger' : 'blue'}
            onClick={() => setRunning((r) => !r)}
            icon={<span>{running ? '🛑' : '🚀'}</span>}
          >
            {running ? 'Call Hunty back' : 'Start the hunt'}
          </Button>
        </div>
      </Card>

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
          <SectionTitle emoji="📝" title="Your spec" sub="what counts as a good job" />
          <Card className="space-y-4">
            <Field label="Roles you want" hint="comma separated, most wanted first">
              <Input
                key={kit.roles}
                defaultValue={
                  kit.roles || 'Senior Frontend Engineer, Full-stack Engineer, Product Engineer'
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preferred companies">
                <Input
                  key={kit.companies}
                  defaultValue={kit.companies || 'Stripe, Linear, Vercel, Razorpay'}
                />
              </Field>
              <Field label="Locations">
                <Input
                  key={kit.locations}
                  defaultValue={kit.locations || 'Remote, Bengaluru, Pune'}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Minimum match score" hint="skip anything weaker">
                <Input type="number" defaultValue={70} />
              </Field>
              <Field label="Applications per day">
                <Input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value) || 0)}
                />
              </Field>
            </div>
            <Field label="Deal breakers" hint="Hunty walks away from these">
              <Input defaultValue="on-site only, unpaid, <2 yrs experience required" />
            </Field>
          </Card>
        </section>

        {/* resume + portals */}
        <section className="space-y-6">
          <div>
            <SectionTitle emoji="📄" title="Base resume" sub="every variant starts here" />
            <Card className="border-dashed! bg-butter-50! text-center">
              <div className="animate-bob text-4xl">📄</div>
              <div className="mt-2 font-display font-bold">
                {kit.resumeName || 'ayan—resume—2026.pdf'}
              </div>
              <div className="text-xs text-ink-soft">last parsed 2 days ago · 34 skills found</div>
              <div className="mt-3 flex justify-center gap-2">
                <Button size="sm">Replace</Button>
                <Button size="sm" variant="ghost">
                  Preview
                </Button>
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
              {portals.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl bg-butter-50 px-3 py-2"
                >
                  <span className="text-xl">{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-ink-soft">
                      {p.connected ? `${p.jobsFound} jobs found` : 'not connected'}
                    </div>
                  </div>
                  <Toggle
                    label={p.name}
                    on={p.connected}
                    onClick={() =>
                      setPortals((list) =>
                        list.map((x) =>
                          x.id === p.id ? { ...x, connected: !x.connected } : x,
                        ),
                      )
                    }
                  />
                </div>
              ))}
              <Button size="sm" variant="ghost" className="w-full">
                + Add another portal
              </Button>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
