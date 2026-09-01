import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { Confetti } from '../components/Confetti'
import { Button, Card, Chip, Input, Progress } from '../components/ui'
import { useAuth } from '../auth/context'
import { api } from '../lib/api'
import type { Resume, ResumeAutofillResult } from '../lib/types'

/**
 * Onboarding, driven by the server.
 *
 * The old wizard asked the same six steps of everyone, including things the
 * resume had just told us and things — phone number, notice period — that
 * change nothing about which jobs get found. Now the server picks each
 * question from what it still does not know *and* what would actually change
 * the results, and this screen renders whatever it is handed.
 *
 * Which means there is no question list in this file, and that is the point.
 */

type QuestionKind = 'chips' | 'choice' | 'text'

interface IntakeQuestion {
  kind: QuestionKind
  prompt: string
  help?: string
  options?: Array<{ value: string; label: string }>
  max?: number
}

interface IntakeStep {
  done: boolean
  asked: number
  cap: number
  slotId?: string
  question?: IntakeQuestion
  current?: unknown
  because?: string
}

interface PairwiseSide {
  jobId: string
  title: string
  company: string
  location: string
  skills: string[]
}

interface PairwiseCard {
  left: PairwiseSide
  right: PairwiseSide
  round: number
  rounds: number
}

type Phase = 'welcome' | 'resume' | 'questions' | 'pairwise' | 'done'

export function Onboarding() {
  const { user, completeOnboarding, signOut } = useAuth()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('welcome')
  const [step, setStep] = useState<IntakeStep | null>(null)
  const [pair, setPair] = useState<PairwiseCard | null>(null)
  const [busy, setBusy] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState('')
  const [uploadedResume, setUploadedResume] = useState<Resume | null>(null)
  const [autofillNotice, setAutofillNotice] = useState('')

  const loadQuestion = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const { data } = await api.get<IntakeStep>('/intake/next')
      setStep(data)
      if (data.done) await startPairwise()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the next question.')
    } finally {
      setBusy(false)
    }
  }, [])

  async function startPairwise() {
    try {
      const { data } = await api.get<PairwiseCard | null>('/intake/pairwise?round=1')
      // No postings scraped yet means no meaningful comparison to offer.
      if (data) {
        setPair(data)
        setPhase('pairwise')
        return
      }
    } catch {
      // The cards are a bonus, never a gate on finishing setup.
    }
    setPhase('done')
  }

  async function answer(value: unknown) {
    if (!step?.slotId) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post<IntakeStep>('/intake/answer', {
        slotId: step.slotId,
        value,
      })
      setStep(data)
      if (data.done) await startPairwise()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that answer.')
    } finally {
      setBusy(false)
    }
  }

  async function choosePair(chosen: PairwiseSide, rejected: PairwiseSide) {
    if (!pair) return
    setBusy(true)
    try {
      await api.post('/intake/pairwise', {
        chosenJobId: chosen.jobId,
        rejectedJobId: rejected.jobId,
      })
      const next = pair.round + 1
      if (next > pair.rounds) {
        setPhase('done')
      } else {
        const { data } = await api.get<PairwiseCard | null>(`/intake/pairwise?round=${next}`)
        if (data) setPair(data)
        else setPhase('done')
      }
    } catch {
      setPhase('done')
    } finally {
      setBusy(false)
    }
  }

  function skipPairwise() {
    setPhase('done')
  }

  async function finish() {
    setFinishing(true)
    setError('')
    try {
      await api.post('/intake/complete')
      // The persona now carries roles and locations; this only marks the
      // account onboarded and keeps the daily target.
      await completeOnboarding({
        roles: '',
        locations: '',
        companies: '',
        dailyTarget: 100,
        portals: [],
        phone: '',
        city: '',
        noticePeriod: '',
        maxYearsExperience: 5,
        resumeName: uploadedResume?.fileName ?? '',
      })
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your setup.')
      setFinishing(false)
    }
  }

  const progressMax = (step?.cap ?? 7) + 2
  const progressValue =
    phase === 'welcome' ? 0 : phase === 'resume' ? 1 : phase === 'done' ? progressMax : (step?.asked ?? 0) + 2

  return (
    <div className="min-h-screen">
      {phase === 'done' && <Confetti />}

      <header className="border-b-[3px] border-ink bg-butter-200">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="toon-sm flex h-10 w-10 items-center justify-center rounded-2xl bg-butter-400 text-xl">
            🪤
          </div>
          <span className="mr-auto font-display text-lg leading-none font-bold">
            Setting up your den
          </span>
          {phase === 'questions' && step && !step.done && (
            <Chip tone="white">
              question {step.asked + 1}
            </Chip>
          )}
          <Button size="sm" variant="ghost" onClick={signOut}>
            Exit
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Progress value={progressValue} max={progressMax} />
        </div>

        {error && (
          <Card className="mb-4 bg-coral/15!">
            <p className="text-sm font-semibold">{error}</p>
          </Card>
        )}

        <div key={`${phase}-${step?.slotId ?? ''}-${pair?.round ?? ''}`} className="animate-pop-in">
          {phase === 'welcome' && (
            <Welcome name={user?.name ?? 'Hunter'} onNext={() => setPhase('resume')} />
          )}

          {phase === 'resume' && (
            <ResumeStep
              resume={uploadedResume}
              notice={autofillNotice}
              onPick={(resume) => {
                setUploadedResume(resume)
                setAutofillNotice('')
              }}
              onAutofill={(result) => {
                const count =
                  result.applied.fields.length + result.applied.skills + result.applied.employments
                setAutofillNotice(
                  count > 0
                    ? `Read ${count} detail${count === 1 ? '' : 's'} off your resume. That is ${count === 1 ? 'one question' : 'several questions'} I will not have to ask.`
                    : 'Your kit already matches this resume.',
                )
              }}
              onNext={() => {
                setPhase('questions')
                void loadQuestion()
              }}
            />
          )}

          {phase === 'questions' && step && !step.done && step.question && (
            <QuestionCard
              question={step.question}
              current={step.current}
              because={step.because}
              busy={busy}
              onAnswer={answer}
            />
          )}

          {phase === 'questions' && busy && !step && (
            <Card>
              <p className="font-semibold text-ink-soft">Working out what to ask…</p>
            </Card>
          )}

          {phase === 'pairwise' && pair && (
            <PairwiseCards pair={pair} busy={busy} onChoose={choosePair} onSkip={skipPairwise} />
          )}

          {phase === 'done' && (
            <DoneStep
              name={user?.name ?? 'Hunter'}
              asked={step?.asked ?? 0}
              readResume={Boolean(uploadedResume)}
              finishing={finishing}
              onFinish={finish}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- welcome */

function Welcome({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <Card className="bg-butter-300! text-center">
      <div className="flex justify-center">
        <Mascot mood="happy" size={140} />
      </div>
      <h1 className="mt-3 text-4xl leading-tight">Hi {name}. I am Hunty.</h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] font-semibold text-ink-soft">
        Drop your resume and I will read most of this off it myself. Then a
        handful of questions — only the ones that change which jobs I find you.
      </p>
      <div className="mt-6 flex justify-center">
        <Button size="lg" onClick={onNext} icon={<span>📄</span>}>
          Start with my resume
        </Button>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ resume */

function ResumeStep({
  resume,
  notice,
  onPick,
  onAutofill,
  onNext,
}: {
  resume: Resume | null
  notice: string
  onPick: (resume: Resume) => void
  onAutofill: (result: ResumeAutofillResult) => void
  onNext: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [autofilling, setAutofilling] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setUploading(true)
    setError('')
    const body = new FormData()
    body.append('file', file)
    body.append('isBase', 'true')
    try {
      const { data } = await api.upload<Resume>('/resumes', body)
      onPick(data)
      if (data.parseStatus === 'failed') {
        setError(data.parseError || 'I could not read this resume. Try a PDF or DOCX.')
        return
      }
      // Autofill immediately: the whole point is that reading the resume
      // removes questions, and making that a second click hides the payoff.
      setAutofilling(true)
      const filled = await api.post<ResumeAutofillResult>(`/resumes/${data.id}/autofill`)
      onAutofill(filled.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The upload failed. Try again.')
    } finally {
      setUploading(false)
      setAutofilling(false)
    }
  }

  return (
    <Card>
      <h1 className="text-3xl">Drop your resume in</h1>
      <p className="mt-1.5 font-semibold text-ink-soft">
        Upload once. Everything I can read off it is a question I will not ask.
      </p>

      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void upload(file)
          e.target.value = ''
        }}
      />

      {error && <p className="mt-3 text-sm font-semibold text-coral">{error}</p>}

      {!resume ? (
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="toon-sm mt-5 flex w-full flex-col items-center gap-2 rounded-2xl bg-butter-100 p-8 disabled:opacity-60"
        >
          <span className="text-4xl">{uploading ? '⏳' : '📄'}</span>
          <span className="font-display text-lg font-bold">
            {uploading ? 'Reading it…' : 'Choose a PDF or DOCX'}
          </span>
        </button>
      ) : (
        <div className="toon-sm mt-5 rounded-2xl bg-mint/20 p-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <div className="font-display text-lg font-bold">{resume.fileName}</div>
              <div className="text-sm font-semibold text-ink-soft">
                {autofilling ? 'Reading it…' : notice || 'Ready.'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onNext}
          className="font-display text-sm font-semibold text-ink-soft underline underline-offset-4"
        >
          skip for now
        </button>
        <Button size="lg" className="ml-auto" onClick={onNext} disabled={uploading || autofilling}>
          Next →
        </Button>
      </div>
    </Card>
  )
}

/* ---------------------------------------------------------------- question */

function QuestionCard({
  question,
  current,
  because,
  busy,
  onAnswer,
}: {
  question: IntakeQuestion
  current: unknown
  because?: string
  busy: boolean
  onAnswer: (value: unknown) => void
}) {
  const [picked, setPicked] = useState<string[]>(() =>
    Array.isArray(current) ? (current as string[]) : typeof current === 'string' ? [current] : [],
  )
  const [text, setText] = useState(typeof current === 'string' ? current : '')

  // A new question means a fresh answer, not the previous one carried over.
  useEffect(() => {
    setPicked(Array.isArray(current) ? (current as string[]) : typeof current === 'string' ? [current] : [])
    setText(typeof current === 'string' ? current : '')
  }, [question.prompt, current])

  const toggle = (value: string) => {
    setPicked((previous) =>
      previous.includes(value)
        ? previous.filter((entry) => entry !== value)
        : previous.length >= (question.max ?? 99)
          ? previous
          : [...previous, value],
    )
  }

  return (
    <Card>
      <h1 className="text-3xl">{question.prompt}</h1>
      {question.help && (
        <p className="mt-1.5 font-semibold text-ink-soft">{question.help}</p>
      )}

      {question.kind === 'chips' && (
        <div className="mt-5 flex flex-wrap gap-2">
          {(question.options ?? []).map((option) => (
            <button key={option.value} onClick={() => toggle(option.value)}>
              <Chip tone={picked.includes(option.value) ? 'mint' : 'white'}>{option.label}</Chip>
            </button>
          ))}
          {(question.options ?? []).length === 0 && (
            <p className="text-sm font-semibold text-ink-soft">
              Nothing to pick from yet — skip this one.
            </p>
          )}
        </div>
      )}

      {question.kind === 'choice' && (
        <div className="mt-5 grid gap-2">
          {(question.options ?? []).map((option) => (
            <button
              key={option.value}
              onClick={() => onAnswer(option.value)}
              disabled={busy}
              className="toon-sm rounded-2xl bg-butter-100 p-4 text-left font-display text-lg font-bold disabled:opacity-60"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {question.kind === 'text' && (
        <div className="mt-5">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Agencies, unpaid trials, on-call…"
          />
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        {because && (
          <span className="text-xs font-semibold text-ink-soft">{because}</span>
        )}
        <button
          onClick={() => onAnswer(question.kind === 'chips' ? [] : '')}
          disabled={busy}
          className="ml-auto font-display text-sm font-semibold text-ink-soft underline underline-offset-4"
        >
          skip
        </button>
        {question.kind !== 'choice' && (
          <Button
            size="lg"
            onClick={() => onAnswer(question.kind === 'chips' ? picked : text)}
            disabled={busy}
          >
            Next →
          </Button>
        )}
      </div>
    </Card>
  )
}

/* ---------------------------------------------------------------- pairwise */

function JobSide({
  side,
  busy,
  onPick,
}: {
  side: PairwiseSide
  busy: boolean
  onPick: () => void
}) {
  return (
    <button
      onClick={onPick}
      disabled={busy}
      className="toon-sm flex-1 rounded-2xl bg-butter-100 p-5 text-left transition hover:bg-butter-200 disabled:opacity-60"
    >
      <div className="font-display text-lg leading-tight font-bold">{side.title}</div>
      <div className="mt-1 text-sm font-semibold text-ink-soft">{side.company}</div>
      <div className="mt-0.5 text-xs font-semibold text-ink-soft">{side.location}</div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {side.skills.map((skill) => (
          <Chip key={skill} tone="white">
            {skill}
          </Chip>
        ))}
      </div>
    </button>
  )
}

function PairwiseCards({
  pair,
  busy,
  onChoose,
  onSkip,
}: {
  pair: PairwiseCard
  busy: boolean
  onChoose: (chosen: PairwiseSide, rejected: PairwiseSide) => void
  onSkip: () => void
}) {
  return (
    <Card>
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl">Which would you take?</h1>
        <Chip tone="white">
          {pair.round} of {pair.rounds}
        </Chip>
      </div>
      <p className="mt-1.5 font-semibold text-ink-soft">
        Two real postings. Picking teaches me what you trade off — which is
        something no form can ask.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <JobSide side={pair.left} busy={busy} onPick={() => onChoose(pair.left, pair.right)} />
        <JobSide side={pair.right} busy={busy} onPick={() => onChoose(pair.right, pair.left)} />
      </div>

      <div className="mt-5 flex">
        <button
          onClick={onSkip}
          className="ml-auto font-display text-sm font-semibold text-ink-soft underline underline-offset-4"
        >
          neither / skip these
        </button>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------- done */

function DoneStep({
  name,
  asked,
  readResume,
  finishing,
  onFinish,
}: {
  name: string
  asked: number
  readResume: boolean
  finishing: boolean
  onFinish: () => void
}) {
  return (
    <Card className="bg-butter-300! text-center">
      <div className="flex justify-center">
        <Mascot mood="proud" size={140} />
      </div>
      <h1 className="mt-3 text-4xl leading-tight">That is everything, {name}.</h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] font-semibold text-ink-soft">
        {/* Only claim to have read the resume when one was actually uploaded —
            this said "I read the rest off your resume" to people who skipped it. */}
        {asked === 0 && readResume
          ? 'Your resume told me everything I needed — no questions required.'
          : readResume
            ? `${asked} question${asked === 1 ? '' : 's'}. I read the rest off your resume.`
            : `${asked} question${asked === 1 ? '' : 's'}, and that is all I need for now.`}{' '}
        I will search every morning and line up what is worth applying to.
      </p>
      <div className="mt-6 flex justify-center">
        <Button
          size="lg"
          variant="blue"
          onClick={onFinish}
          disabled={finishing}
          icon={<span>🚀</span>}
        >
          {finishing ? 'Saving your den…' : 'Take me to my den'}
        </Button>
      </div>
    </Card>
  )
}
