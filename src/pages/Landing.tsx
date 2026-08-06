import { Link } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { Button, Card, Chip } from '../components/ui'

const steps = [
  { emoji: '📄', title: 'Drop your resume', body: 'Hunty reads it once and remembers every skill, title and year.' },
  { emoji: '🎯', title: 'Say what you want', body: 'Roles, companies, locations, salary floor, and your deal breakers.' },
  { emoji: '🔎', title: 'Hunty scrapes daily', body: 'Eight portals swept every morning while you are still asleep.' },
  { emoji: '✂️', title: 'Resume gets tailored', body: 'One variant per job description. Never the same PDF twice.' },
  { emoji: '📮', title: 'Applications go out', body: 'Forms filled from your kit. Up to a hundred a day.' },
]

const features = [
  {
    emoji: '🤖',
    title: 'Apply while you sleep',
    body: 'You wrote the resume once. Why are you still filling the same form for the four hundredth time?',
    tone: 'bg-butter-300',
  },
  {
    emoji: '🤝',
    title: 'Referrals, in one pile',
    body: 'Every DM and email asking you for a referral, gathered by day, each with a recommendation already written.',
    tone: 'bg-sky-soft',
  },
  {
    emoji: '📊',
    title: 'Know what is working',
    body: 'Which portal replies. Which resume gets viewed. Which role you keep getting ghosted on.',
    tone: 'bg-white',
  },
]

const portals = ['💼 LinkedIn', '🚀 Wellfound', '🌍 RemoteOK', '🏝️ We Work Remotely', '🧡 YC', '🇮🇳 Naukri', '⚡ Instahyre', '🔎 Indeed']

export function Landing() {
  return (
    <div className="min-h-screen">
      {/* nav */}
      <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-butter-200/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="toon-sm flex h-11 w-11 items-center justify-center rounded-2xl bg-butter-400 text-2xl">
            🪤
          </div>
          <div className="mr-auto font-display text-xl leading-none font-bold">Job Hunters</div>
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-pop-in">
            <Chip tone="white">🔥 job hunting, but the boring half is gone</Chip>
            <h1 className="mt-4 text-5xl leading-[1.05] sm:text-6xl">
              You hunt jobs.
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">Hunty applies</span>
                <span className="absolute inset-x-0 bottom-0 z-0 h-3 -rotate-1 bg-sky-soft" />
              </span>{' '}
              to them.
            </h1>
            <p className="mt-5 max-w-lg text-lg font-semibold text-ink-soft">
              Give it your resume and what you actually want. It scrapes eight job
              portals every morning, rewrites your resume for each posting, and applies
              — up to a hundred a day.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup">
                <Button size="lg" icon={<span>🚀</span>}>
                  Let Hunty loose
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="ghost">
                  I already have an account
                </Button>
              </Link>
            </div>

            <p className="mt-3 text-sm font-semibold text-ink-soft">
              Demo build — any email and password will let you in.
            </p>
          </div>

          <div className="relative flex justify-center">
            <div className="toon rounded-blob w-full max-w-sm bg-butter-300 p-6">
              <div className="flex justify-center">
                <Mascot mood="hunting" size={150} />
              </div>
              <div className="toon-sm mt-4 rounded-2xl bg-white p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-bold">Today's haul</span>
                  <Chip tone="mint">live</Chip>
                </div>
                <div className="mt-2 font-display text-5xl leading-none font-bold">68</div>
                <div className="text-xs font-semibold text-ink-soft">
                  applications sent · 3 interviews booked
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <div className="toon-sm flex-1 rounded-2xl bg-white p-2.5 text-center">
                  <div className="font-display text-xl leading-none font-bold">11</div>
                  <div className="text-[11px] font-semibold text-ink-soft">referrals</div>
                </div>
                <div className="toon-sm flex-1 rounded-2xl bg-white p-2.5 text-center">
                  <div className="font-display text-xl leading-none font-bold">1110</div>
                  <div className="text-[11px] font-semibold text-ink-soft">jobs scraped</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* portal strip */}
      <section className="border-y-[3px] border-ink bg-butter-400 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-2 px-4">
          {portals.map((p) => (
            <Chip key={p} tone="white">
              {p}
            </Chip>
          ))}
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-4xl">Two chores. Both handled.</h2>
        <p className="mx-auto mt-2 max-w-xl text-center font-semibold text-ink-soft">
          Applying is the grind. Referrals are the mess. Job Hunters takes both.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {features.map((f, i) => (
            <Card key={f.title} className={`${f.tone}! toon-lift`} tilt={i === 1 ? 0 : i ? 1 : -1}>
              <div className="text-4xl">{f.emoji}</div>
              <h3 className="mt-2 text-2xl">{f.title}</h3>
              <p className="mt-1.5 text-[15px] font-semibold text-ink-soft">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="border-y-[3px] border-ink bg-butter-200 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-4xl">How a hunt runs</h2>
          <p className="mt-2 text-center font-semibold text-ink-soft">
            Five steps. You do the first two, once.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((s, i) => (
              <Card key={s.title} className="relative p-4" tilt={i % 2 ? 1 : -1}>
                <div className="toon-sm absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-sky-pop font-display text-sm font-bold text-white">
                  {i + 1}
                </div>
                <div className="text-3xl">{s.emoji}</div>
                <h3 className="mt-1.5 font-display text-base font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{s.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* referral spotlight */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <Chip tone="blue">🤝 the other half</Chip>
            <h2 className="mt-3 text-4xl">Eleven people asked you for a referral today.</h2>
            <p className="mt-3 text-lg font-semibold text-ink-soft">
              Seven on LinkedIn, four by email, scattered across two inboxes. Job Hunters
              sweeps both every day, pulls out the resume, the role and the job ID, and
              writes the recommendation for you.
            </p>
            <p className="mt-3 font-semibold text-ink-soft">
              You open one page, read, and hit copy.
            </p>
            <Link to="/signup" className="mt-6 inline-block">
              <Button size="lg" variant="blue" icon={<span>🤝</span>}>
                See the referral desk
              </Button>
            </Link>
          </div>

          <Card className="space-y-3">
            {[
              { a: '🦊', n: 'Meera Iyer', s: '💼 LinkedIn DM', r: 'Senior Frontend Engineer' },
              { a: '🐨', n: 'Rahul Deshmukh', s: '✉️ Email', r: 'Platform Engineer' },
              { a: '🦉', n: 'Devansh Kapoor', s: '✉️ Email', r: 'Senior Data Engineer' },
            ].map((p) => (
              <div key={p.n} className="toon-sm flex items-center gap-3 rounded-2xl bg-butter-50 p-3">
                <span className="text-2xl">{p.a}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-bold">{p.n}</div>
                  <div className="truncate text-xs text-ink-soft">{p.r}</div>
                </div>
                <Chip tone="white">{p.s}</Chip>
              </div>
            ))}
            <div className="toon-sm rounded-2xl bg-white p-3 text-sm">
              <Chip tone="grape">✨ auto-written</Chip>
              <p className="mt-2 leading-relaxed">
                “Happy to refer Meera Iyer for JR-48210. She owned the React migration end
                to end and cut first-paint by 40%…”
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* closing CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <Card className="bg-butter-300! text-center">
          <div className="flex justify-center">
            <Mascot mood="proud" size={110} />
          </div>
          <h2 className="mt-2 text-4xl">Stop filling forms. Start getting calls.</h2>
          <p className="mx-auto mt-2 max-w-md font-semibold text-ink-soft">
            Set it up in four minutes. Hunty takes the next morning shift.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" icon={<span>🪤</span>}>
                Create my account
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="ghost">
                Log in
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      <footer className="border-t-[3px] border-ink bg-butter-200 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm font-semibold text-ink-soft">
          <span>🪤 Job Hunters — demo build, no backend yet.</span>
          <span>Made with too much yellow.</span>
        </div>
      </footer>
    </div>
  )
}
