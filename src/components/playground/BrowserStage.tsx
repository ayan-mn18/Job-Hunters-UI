import { useEffect, useRef } from 'react'
import { Chip } from '../ui'
import { BEST, POSTINGS, type FormField, type Phase, type Posting } from './script'

/**
 * The browser, faked.
 *
 * Deliberately a real-looking browser rather than a grey placeholder: the
 * question this playground exists to answer is whether watching an agent work
 * is legible, and that cannot be judged against an empty box. When the backend
 * lands, everything inside the chrome is replaced by the hosted session's live
 * URL in an iframe and the chrome itself stays as it is.
 */

function Chrome({
  url,
  live,
  driving,
  children,
}: {
  url: string
  live: boolean
  driving: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b-[3px] border-ink bg-butter-200 px-3 py-2">
        <span className="flex gap-1.5">
          <span className="size-3 rounded-full border-2 border-ink bg-coral" />
          <span className="size-3 rounded-full border-2 border-ink bg-butter-400" />
          <span className="size-3 rounded-full border-2 border-ink bg-mint" />
        </span>
        <div className="ml-1 flex-1 truncate rounded-lg border-[2.5px] border-ink bg-white px-2.5 py-1 font-mono text-xs">
          {url}
        </div>
        {live && <Chip tone={driving ? 'blue' : 'mint'}>{driving ? 'you are driving' : 'agent is driving'}</Chip>}
      </div>
      <div
        data-browser-viewport
        className={`relative flex-1 overflow-y-auto bg-white ${driving ? 'cursor-crosshair ring-4 ring-inset ring-sky-pop' : ''}`}
      >
        {children}
      </div>
    </div>
  )
}

function Booting() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="animate-bob text-5xl">🖥️</div>
      <p className="font-display text-lg font-bold">Starting a browser…</p>
      <p className="text-sm text-ink-soft">A stealth Chromium, somewhere else, with your logins in it.</p>
    </div>
  )
}

function JobCard({ posting, chosen, dim }: { posting: Posting; chosen: boolean; dim: boolean }) {
  return (
    <div
      className={`rounded-xl border-[3px] p-3 transition-all duration-500 ${
        chosen
          ? 'border-ink bg-butter-100 shadow-[4px_4px_0_var(--color-ink)]'
          : 'border-ink/25 bg-white'
      } ${dim ? 'opacity-40' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-[15px] font-bold">{posting.title}</span>
        <Chip tone="white">
          {posting.company} · {posting.batch}
        </Chip>
        {chosen && <Chip tone="mint">best match · {posting.score}</Chip>}
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        {posting.location} · {posting.experience}
        {posting.salary !== '—' && ` · ${posting.salary}`}
      </p>
    </div>
  )
}

function Listing({ revealed, chosen }: { revealed: number; chosen: boolean }) {
  return (
    <div className="p-4">
      <h2 className="font-display text-xl font-bold">Software Engineer jobs at Y Combinator startups</h2>
      <p className="mb-3 text-xs text-ink-soft">workatastartup.com · 1,000+ vetted, funded startups</p>
      <div className="flex flex-col gap-2">
        {POSTINGS.slice(0, revealed).map((posting) => (
          <JobCard
            key={posting.id}
            posting={posting}
            chosen={chosen && posting.id === BEST.id}
            dim={chosen && posting.id !== BEST.id}
          />
        ))}
      </div>
    </div>
  )
}

function Detail() {
  return (
    <div className="p-5">
      <h2 className="font-display text-2xl font-bold">
        {BEST.title} at {BEST.company}
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        {BEST.batch} · {BEST.location} · {BEST.experience} · Full-time
      </p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed">
        Noora Health turns hospital waiting rooms into classrooms, training family caregivers before a
        patient is discharged. The engineering team owns the record systems behind that — intake,
        curriculum delivery and outcome tracking across several hundred hospitals.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
        You would lead the backend group: Postgres, a Node service layer, and the integrations that make
        a hospital's existing records usable without asking anyone to change how they work.
      </p>
    </div>
  )
}

function LoginWall() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-butter-50 p-6 text-center">
      <div className="text-4xl">🔒</div>
      <p className="font-display text-lg font-bold">Sign in to Y Combinator</p>
      <p className="max-w-sm text-sm text-ink-soft">
        You need a YC account to apply to companies on Work at a Startup.
      </p>
      <div className="mt-1 flex w-64 flex-col gap-2">
        <div className="rounded-xl border-[3px] border-ink/30 bg-white px-3 py-2 text-left text-sm text-ink-soft">
          Email
        </div>
        <div className="rounded-xl border-[3px] border-ink/30 bg-white px-3 py-2 text-left text-sm text-ink-soft">
          Password
        </div>
        <div className="rounded-xl border-[3px] border-ink bg-sky-pop px-3 py-2 font-display text-sm font-bold text-white">
          Log in
        </div>
      </div>
    </div>
  )
}

const STATE_RING: Record<FormField['state'], string> = {
  pending: 'border-ink/25',
  filling: 'border-sky-pop ring-4 ring-sky-pop/25',
  filled: 'border-ink',
  blocked: 'border-coral ring-4 ring-coral/20',
  refused: 'border-ink/40 border-dashed',
}

function ApplyForm({ fields }: { fields: FormField[] }) {
  const activeRef = useRef<HTMLLabelElement>(null)
  const active = fields.find(
    (field) => field.state === 'filling' || field.state === 'blocked',
  )

  // Follow the field being worked on. Without this the interesting half of a
  // long form — the questions it got stuck on — happens below the fold, which
  // defeats the point of watching at all. Scrolls the browser's own viewport,
  // never the page.
  useEffect(() => {
    // After paint, and instantly. Fields change state faster than a smooth
    // scroll finishes, so each one restarts the animation and the form creeps
    // a few pixels instead of following along.
    const frame = requestAnimationFrame(() => {
      const element = activeRef.current
      const viewport = element?.closest('[data-browser-viewport]') as HTMLElement | null
      if (!element || !viewport) return
      viewport.scrollTop = Math.max(0, element.offsetTop - 72)
    })
    return () => cancelAnimationFrame(frame)
  }, [active?.id, active?.state])

  return (
    <div className="p-5">
      <h2 className="font-display text-xl font-bold">Apply to {BEST.company}</h2>
      <p className="mb-4 text-xs text-ink-soft">
        Your message goes straight to the founders. Keep it short and specific.
      </p>
      <div className="flex max-w-2xl flex-col gap-3">
        {fields.map((field) => (
          <label
            key={field.id}
            ref={field.id === active?.id ? activeRef : undefined}
            className="block"
          >
            <span className="mb-1 block font-display text-xs font-semibold">{field.label}</span>
            <div
              className={`rounded-xl border-[3px] bg-white px-3 py-2 text-sm transition-all ${STATE_RING[field.state]} ${
                field.long ? 'min-h-24' : ''
              }`}
            >
              {field.state === 'pending' && <span className="text-ink-soft/50">—</span>}
              {field.state === 'refused' && <span className="text-ink-soft/60">left blank</span>}
              {field.state === 'blocked' && <span className="text-coral">needs an answer</span>}
              {(field.state === 'filling' || field.state === 'filled') && (
                <span className={field.state === 'filling' ? 'opacity-60' : ''}>
                  {field.id === 'resume' ? `📎 ${field.value}` : field.value}
                  {field.state === 'filling' && <span className="animate-pulse">▌</span>}
                </span>
              )}
            </div>
            {field.note && (field.state === 'blocked' || field.state === 'refused') && (
              <span className="mt-1 block text-[11px] text-ink-soft">{field.note}</span>
            )}
          </label>
        ))}
      </div>
    </div>
  )
}

function Submitted() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="animate-bob text-5xl">🎉</div>
      <p className="font-display text-xl font-bold">Application sent</p>
      <p className="max-w-sm text-sm text-ink-soft">
        {BEST.title} at {BEST.company}. The founders have your message.
      </p>
    </div>
  )
}

const URLS: Record<Phase, string> = {
  idle: 'about:blank',
  launching: 'about:blank',
  searching: 'https://www.workatastartup.com/jobs',
  shortlisted: 'https://www.workatastartup.com/jobs',
  opening: `https://www.workatastartup.com/jobs/${BEST.id}`,
  login_blocked: 'https://account.ycombinator.com/authenticate',
  signing_in: 'https://account.ycombinator.com/authenticate',
  filling: `https://www.workatastartup.com/application?job=${BEST.id}`,
  field_blocked: `https://www.workatastartup.com/application?job=${BEST.id}`,
  submitting: `https://www.workatastartup.com/application?job=${BEST.id}`,
  submitted: `https://www.workatastartup.com/application/${BEST.id}/sent`,
}

export function BrowserStage({
  phase,
  revealed,
  fields,
  driving,
}: {
  phase: Phase
  revealed: number
  fields: FormField[]
  driving: boolean
}) {
  return (
    <Chrome url={URLS[phase]} live={phase !== 'idle'} driving={driving}>
      {phase === 'idle' && (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <div className="text-5xl">🎮</div>
          <p className="font-display text-lg font-bold">Nothing running yet</p>
          <p className="max-w-xs text-sm text-ink-soft">
            Ask for something above and a browser opens right here.
          </p>
        </div>
      )}
      {phase === 'launching' && <Booting />}
      {(phase === 'searching' || phase === 'shortlisted') && (
        <Listing revealed={revealed} chosen={phase === 'shortlisted'} />
      )}
      {phase === 'opening' && <Detail />}
      {(phase === 'login_blocked' || phase === 'signing_in') && <LoginWall />}
      {(phase === 'filling' || phase === 'field_blocked' || phase === 'submitting') && (
        <ApplyForm fields={fields} />
      )}
      {phase === 'submitted' && <Submitted />}
    </Chrome>
  )
}
