import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { Confetti } from '../components/Confetti'
import { Button, Card, Chip, Field, Input, Progress, Toggle } from '../components/ui'
import { useAuth, type KitDraft } from '../auth/context'
import { portals as allPortals } from '../data/mock'

const TOTAL = 6

const parsedSkills = [
  'React',
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'AWS',
  'Docker',
  'GraphQL',
  'Redis',
]

export function Onboarding() {
  const { user, completeOnboarding, signOut } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<KitDraft>({
    roles: '',
    locations: '',
    companies: '',
    dailyTarget: 50,
    portals: ['linkedin', 'remoteok', 'wellfound'],
    phone: '',
    city: '',
    noticePeriod: '30 days',
    resumeName: '',
  })

  const set = <K extends keyof KitDraft>(key: K, value: KitDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const next = () => setStep((s) => Math.min(TOTAL, s + 1))
  const back = () => setStep((s) => Math.max(1, s - 1))

  function finish() {
    completeOnboarding(draft)
    navigate('/app', { replace: true })
  }

  return (
    <div className="min-h-screen">
      {step === TOTAL && <Confetti />}

      <header className="border-b-[3px] border-ink bg-butter-200">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="toon-sm flex h-10 w-10 items-center justify-center rounded-2xl bg-butter-400 text-xl">
            🪤
          </div>
          <span className="mr-auto font-display text-lg leading-none font-bold">
            Setting up your den
          </span>
          <Chip tone="white">
            step {step} of {TOTAL}
          </Chip>
          <Button size="sm" variant="ghost" onClick={signOut}>
            Exit
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Progress value={step} max={TOTAL} />
        </div>

        <div key={step} className="animate-pop-in">
          {step === 1 && <StepWelcome name={user?.name ?? 'Hunter'} onNext={next} />}
          {step === 2 && (
            <StepResume value={draft.resumeName} onPick={(n) => set('resumeName', n)} />
          )}
          {step === 3 && <StepSpec draft={draft} set={set} />}
          {step === 4 && (
            <StepPortals
              picked={draft.portals}
              toggle={(id) =>
                set(
                  'portals',
                  draft.portals.includes(id)
                    ? draft.portals.filter((p) => p !== id)
                    : [...draft.portals, id],
                )
              }
            />
          )}
          {step === 5 && <StepKit draft={draft} set={set} />}
          {step === 6 && <StepDone draft={draft} name={user?.name ?? 'Hunter'} />}
        </div>

        {/* footer controls — step 1 and 6 carry their own buttons */}
        {step > 1 && step < TOTAL && (
          <div className="mt-6 flex items-center gap-3">
            <Button variant="ghost" onClick={back}>
              ← Back
            </Button>
            <button
              onClick={next}
              className="ml-auto font-display text-sm font-semibold text-ink-soft underline underline-offset-4"
            >
              skip for now
            </button>
            <Button size="lg" onClick={next}>
              Next →
            </Button>
          </div>
        )}

        {step === TOTAL && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="ghost" onClick={back}>
              ← Back
            </Button>
            <Button size="lg" variant="blue" onClick={finish} icon={<span>🚀</span>}>
              Take me to my den
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ steps */

function StepWelcome({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <Card className="bg-butter-300! text-center">
      <div className="flex justify-center">
        <Mascot mood="happy" size={140} />
      </div>
      <h1 className="mt-3 text-4xl leading-tight">Hi {name}. I am Hunty.</h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] font-semibold text-ink-soft">
        Four minutes of setup and I will start applying to jobs for you every
        morning. Resume first, then what you want, then the boring form answers.
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {[
          ['📄', 'Your resume'],
          ['🎯', 'What you want'],
          ['🧳', 'Form answers'],
        ].map(([e, t]) => (
          <div key={t} className="toon-sm rounded-2xl bg-white p-3">
            <div className="text-2xl">{e}</div>
            <div className="mt-1 font-display text-sm font-bold">{t}</div>
          </div>
        ))}
      </div>
      <Button size="lg" className="mt-6" onClick={onNext} icon={<span>👋</span>}>
        Nice to meet you
      </Button>
    </Card>
  )
}

function StepResume({ value, onPick }: { value: string; onPick: (name: string) => void }) {
  const [parsing, setParsing] = useState(false)

  function fakeUpload() {
    setParsing(true)
    setTimeout(() => {
      setParsing(false)
      onPick('ayan—resume—2026.pdf')
    }, 1300)
  }

  return (
    <Card>
      <h1 className="text-3xl">Drop your resume in</h1>
      <p className="mt-1.5 font-semibold text-ink-soft">
        I read it once, then rewrite it for every job I find.
      </p>

      {!value ? (
        <button
          onClick={fakeUpload}
          disabled={parsing}
          className="toon-sm mt-5 w-full rounded-blob border-dashed! bg-butter-50 py-12 text-center"
        >
          <div className={parsing ? 'animate-wiggle text-5xl' : 'animate-bob text-5xl'}>
            {parsing ? '🔍' : '📄'}
          </div>
          <div className="mt-3 font-display text-lg font-bold">
            {parsing ? 'Reading your resume…' : 'Click to pick a PDF'}
          </div>
          <div className="text-sm text-ink-soft">
            {parsing ? 'pulling out skills, titles and years' : 'PDF or DOCX, up to 5 MB'}
          </div>
        </button>
      ) : (
        <div className="animate-pop-in mt-5">
          <div className="toon-sm flex items-center gap-3 rounded-blob bg-mint/25 p-4">
            <span className="text-3xl">✅</span>
            <div className="min-w-0 flex-1">
              <div className="font-display font-bold">{value}</div>
              <div className="text-sm text-ink-soft">
                parsed · 8 skills, 2 roles, 4 years found
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onPick('')}>
              Replace
            </Button>
          </div>

          <div className="mt-4">
            <div className="mb-2 font-display text-sm font-bold">Skills I picked up</div>
            <div className="flex flex-wrap gap-2">
              {parsedSkills.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

function StepSpec({
  draft,
  set,
}: {
  draft: KitDraft
  set: <K extends keyof KitDraft>(k: K, v: KitDraft[K]) => void
}) {
  return (
    <Card className="space-y-4">
      <div>
        <h1 className="text-3xl">What counts as a good job?</h1>
        <p className="mt-1.5 font-semibold text-ink-soft">
          Be picky. I would rather send 40 good ones than 200 bad ones.
        </p>
      </div>

      <Field label="Roles you want" hint="most wanted first">
        <Input
          value={draft.roles}
          onChange={(e) => set('roles', e.target.value)}
          placeholder="Senior Frontend Engineer, Full-stack Engineer"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Locations">
          <Input
            value={draft.locations}
            onChange={(e) => set('locations', e.target.value)}
            placeholder="Remote, Bengaluru, Pune"
          />
        </Field>
        <Field label="Dream companies" hint="I will try these first">
          <Input
            value={draft.companies}
            onChange={(e) => set('companies', e.target.value)}
            placeholder="Stripe, Linear, Razorpay"
          />
        </Field>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="font-display text-sm font-semibold">Applications per day</span>
          <span className="font-display text-2xl leading-none font-bold">
            {draft.dailyTarget}
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={150}
          step={10}
          value={draft.dailyTarget}
          onChange={(e) => set('dailyTarget', Number(e.target.value))}
          className="toon-range mt-1"
        />
        <div className="mt-1 text-xs font-semibold text-ink-soft">
          {draft.dailyTarget <= 30
            ? 'Careful and slow. Good for senior roles.'
            : draft.dailyTarget <= 90
              ? 'A steady grind. Most people sit here.'
              : 'Full blast. Watch out for portal rate limits.'}
        </div>
      </div>
    </Card>
  )
}

function StepPortals({ picked, toggle }: { picked: string[]; toggle: (id: string) => void }) {
  return (
    <Card>
      <h1 className="text-3xl">Where should I hunt?</h1>
      <p className="mt-1.5 font-semibold text-ink-soft">
        Pick the portals you already have accounts on. You can connect the rest later.
      </p>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {allPortals.map((p) => {
          const on = picked.includes(p.id)
          return (
            <div
              key={p.id}
              className={[
                'toon-sm flex items-center gap-3 rounded-2xl px-3 py-2.5',
                on ? 'bg-butter-300' : 'bg-butter-50',
              ].join(' ')}
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="flex-1 font-display text-sm font-semibold">{p.name}</span>
              <Toggle on={on} onClick={() => toggle(p.id)} label={p.name} />
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-xs font-semibold text-ink-soft">
        {picked.length} picked · connecting the accounts themselves comes later
      </p>
    </Card>
  )
}

function StepKit({
  draft,
  set,
}: {
  draft: KitDraft
  set: <K extends keyof KitDraft>(k: K, v: KitDraft[K]) => void
}) {
  return (
    <Card className="space-y-4">
      <div>
        <h1 className="text-3xl">The stuff every form asks</h1>
        <p className="mt-1.5 font-semibold text-ink-soft">
          Answer once here and I will never bother you about it again.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone">
          <Input
            value={draft.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+91 98765 43210"
          />
        </Field>
        <Field label="City">
          <Input
            value={draft.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Pune"
          />
        </Field>
      </div>

      <Field label="Notice period" hint="the question that ends every screening call">
        <Input
          value={draft.noticePeriod}
          onChange={(e) => set('noticePeriod', e.target.value)}
          placeholder="30 days"
        />
      </Field>

      <div className="toon-sm rounded-2xl bg-sky-soft p-3.5 text-sm font-semibold">
        🔒 The rest — address, CTC, work authorization — lives in <b>My Kit</b> inside the
        app. Fill it whenever you feel like it.
      </div>
    </Card>
  )
}

function StepDone({ draft, name }: { draft: KitDraft; name: string }) {
  const [count, setCount] = useState(0)

  // Little counter roll-up, so the finish line feels like something happened.
  useEffect(() => {
    const target = 1110
    const id = setInterval(() => {
      setCount((c) => {
        const nextValue = c + Math.ceil((target - c) / 8)
        return nextValue >= target ? target : nextValue
      })
    }, 45)
    return () => clearInterval(id)
  }, [])

  return (
    <Card className="bg-butter-300! text-center">
      <div className="flex justify-center">
        <Mascot mood="proud" size={140} />
      </div>
      <h1 className="mt-3 text-4xl leading-tight">All set, {name}.</h1>
      <p className="mx-auto mt-2 max-w-md font-semibold text-ink-soft">
        I already found <b>{count.toLocaleString()}</b> open jobs across your portals.
        First batch goes out tomorrow at 06:00.
      </p>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <div className="toon-sm rounded-2xl bg-white p-3">
          <div className="font-display text-2xl leading-none font-bold">
            {draft.dailyTarget}
          </div>
          <div className="text-xs font-semibold text-ink-soft">applies per day</div>
        </div>
        <div className="toon-sm rounded-2xl bg-white p-3">
          <div className="font-display text-2xl leading-none font-bold">
            {draft.portals.length}
          </div>
          <div className="text-xs font-semibold text-ink-soft">portals watched</div>
        </div>
        <div className="toon-sm rounded-2xl bg-white p-3">
          <div className="font-display text-2xl leading-none font-bold">06:00</div>
          <div className="text-xs font-semibold text-ink-soft">first run</div>
        </div>
      </div>
    </Card>
  )
}
