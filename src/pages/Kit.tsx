import { useAuth } from '../auth/context'
import { Button, Card, Chip, Field, Input, SectionTitle } from '../components/ui'

/**
 * "My Kit" — the bag of answers Hunty carries to every application form.
 * Anything a job portal ever asks for lives here once.
 */

const experience = [
  {
    emoji: '🌩️',
    role: 'Software Engineer',
    company: 'Nimbus Labs',
    period: 'Jan 2024 — now',
    blurb: 'React + Node platform work. Owned the billing rewrite.',
  },
  {
    emoji: '🍭',
    role: 'Junior Developer',
    company: 'Pastel Pay',
    period: 'Jun 2022 — Dec 2023',
    blurb: 'Payments dashboard, internal tooling, on-call rotation.',
  },
]

const skills = [
  'React',
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'AWS',
  'Docker',
  'GraphQL',
  'Redis',
  'CI/CD',
]

export function Kit() {
  const { user } = useAuth()
  const kit = user?.kit ?? {}

  return (
    <div className="space-y-7">
      <SectionTitle
        emoji="🧳"
        title="My Kit"
        sub="Fill it once. Hunty answers every form with it."
        action={<Button size="sm" icon={<span>💾</span>}>Save kit</Button>}
      />

      <Card className="flex flex-wrap items-center gap-4 bg-butter-300!">
        <div className="toon-sm flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl">
          {user?.avatar ?? '🧑‍🚀'}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl">{user?.name ?? 'Ayan Mansoori'}</h3>
          <p className="text-sm font-semibold text-ink-soft">
            Full-stack Engineer · 4 years · open to remote
          </p>
        </div>
        <div className="flex gap-2">
          <Chip tone="white">📄 resume on file</Chip>
          <Chip tone="mint">92% complete</Chip>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle emoji="🙋" title="Personal" />
          <Card className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input key={user?.name} defaultValue={user?.name ?? 'Ayan Mansoori'} />
              </Field>
              <Field label="Pronouns" hint="optional, shown on some forms">
                <Input placeholder="e.g. they/them" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <Input
                  key={user?.email}
                  type="email"
                  defaultValue={user?.email ?? 'you@example.com'}
                />
              </Field>
              <Field label="Phone">
                <Input key={kit.phone} defaultValue={kit.phone || '+91 98765 43210'} />
              </Field>
            </div>
            <Field label="Address">
              <Input defaultValue="221B Marigold Lane" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City">
                <Input key={kit.city} defaultValue={kit.city || 'Pune'} />
              </Field>
              <Field label="State">
                <Input defaultValue="Maharashtra" />
              </Field>
              <Field label="PIN / ZIP">
                <Input defaultValue="411001" />
              </Field>
            </div>
            <Field label="Country">
              <Input defaultValue="India" />
            </Field>
          </Card>
        </section>

        <section className="space-y-6">
          <div>
            <SectionTitle emoji="🔗" title="Links" />
            <Card className="space-y-4">
              <Field label="LinkedIn">
                <Input defaultValue="linkedin.com/in/ayan-mn18" />
              </Field>
              <Field label="GitHub">
                <Input defaultValue="github.com/ayan-mn18" />
              </Field>
              <Field label="Portfolio">
                <Input placeholder="yoursite.com" />
              </Field>
            </Card>
          </div>

          <div>
            <SectionTitle emoji="📋" title="The awkward questions" sub="asked by almost every portal" />
            <Card className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Notice period">
                  <Input key={kit.noticePeriod} defaultValue={kit.noticePeriod || '30 days'} />
                </Field>
                <Field label="Total experience">
                  <Input defaultValue="4 years" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Current CTC">
                  <Input defaultValue="₹24,00,000" />
                </Field>
                <Field label="Expected CTC">
                  <Input defaultValue="₹36,00,000" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Work authorization">
                  <Input defaultValue="Indian citizen — no sponsorship needed" />
                </Field>
                <Field label="Willing to relocate">
                  <Input defaultValue="Yes, for the right team" />
                </Field>
              </div>
            </Card>
          </div>
        </section>
      </div>

      <section>
        <SectionTitle
          emoji="💼"
          title="Employment history"
          action={
            <Button size="sm" variant="ghost">
              + Add role
            </Button>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {experience.map((e, i) => (
            <Card key={e.company} className="p-4" tilt={i % 2 ? 0.8 : -0.8}>
              <div className="flex items-start gap-3">
                <div className="toon-sm flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-butter-200 text-xl">
                  {e.emoji}
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold">{e.role}</div>
                  <div className="text-sm text-ink-soft">
                    {e.company} · {e.period}
                  </div>
                  <p className="mt-1.5 text-sm">{e.blurb}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle emoji="🛠️" title="Skills" sub="pulled from your resume, edit freely" />
        <Card className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <Chip key={s} tone="yellow">
              {s} ✕
            </Chip>
          ))}
          <Chip tone="white">+ add skill</Chip>
        </Card>
      </section>
    </div>
  )
}
