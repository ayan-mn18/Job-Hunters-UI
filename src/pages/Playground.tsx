import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AgentChat, type QuickAction } from '../components/playground/AgentChat'
import { BrowserStage } from '../components/playground/BrowserStage'
import { EmailReceipt } from '../components/playground/EmailReceipt'
import {
  AUTO_FIELD_IDS,
  BEST,
  FORM,
  POSTINGS,
  SUGGESTED_PROMPTS,
  say,
  type ChatMessage,
  type FormField,
  type Phase,
} from '../components/playground/script'
import { Button, Card, Chip, Input, SectionTitle } from '../components/ui'

/**
 * The playground.
 *
 * A single job, start to finish, with the browser visible the whole way and a
 * person able to cut in at any point. It exists because the product's current
 * output is a list of rows that either worked or did not, which tells you
 * nothing about *why* — and the parts most likely to go wrong (a login wall, a
 * question nobody can answer from the résumé) are exactly the parts that
 * disappear into a status column.
 *
 * Nothing here is wired to anything. Every step is on a timer and the postings
 * are a fixed list, so the flow can be argued about before any of it is built.
 */

/**
 * On a wide screen the stage is pinned to the viewport so the page itself never
 * scrolls: the browser stays put and the conversation scrolls inside its own
 * panel. Without this the chat grows past the fold, and the moment the run gets
 * stuck — the one moment somebody needs to see — happens off screen.
 *
 * Stacked on a narrow screen, where a fixed height would squash both panels.
 */
const STAGE_HEIGHT = 'lg:h-[calc(100vh-16rem)] lg:min-h-[32rem]'

export function Playground() {
  const [prompt, setPrompt] = useState(SUGGESTED_PROMPTS[0] as string)
  const [phase, setPhase] = useState<Phase>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [revealed, setRevealed] = useState(0)
  const [fields, setFields] = useState<FormField[]>(FORM)
  const [thinking, setThinking] = useState(false)
  const [driving, setDriving] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [emailed, setEmailed] = useState(false)
  const [applyOffered, setApplyOffered] = useState(false)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const after = useCallback((ms: number, run: () => void) => {
    timers.current.push(setTimeout(run, ms))
  }, [])

  const push = useCallback((...next: ChatMessage[]) => {
    setMessages((current) => [...current, ...next])
  }, [])

  const setFieldState = useCallback((id: string, state: FormField['state']) => {
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, state } : field)),
    )
  }, [])

  // Every phase clears the timers of the one before it. Without this a reset
  // mid-run leaves the old script still firing into the new one.
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'launching') {
      after(1500, () => {
        push(
          say('agent', 'Browser ready. Signed in as you where I have a profile.'),
          say('agent', 'Opening workatastartup.com/jobs'),
        )
        setPhase('searching')
      })
    }

    if (phase === 'searching') {
      POSTINGS.forEach((_, index) => after(320 * (index + 1), () => setRevealed(index + 1)))
      after(1700, () => push(say('agent', 'Read 40 postings across 3 pages.')))
      after(2000, () => setThinking(true))
      after(3200, () => {
        setThinking(false)
        push(
          say('llm', `Best match is ${BEST.title} at ${BEST.company} — ${BEST.score}/100.`),
          say('llm', BEST.reasons.map((reason) => `· ${reason}`).join('\n')),
        )
        setApplyOffered(true)
        setPhase('shortlisted')
      })
    }

    if (phase === 'opening') {
      after(1600, () => {
        push(
          say(
            'agent',
            'Stuck. The apply link went to a Y Combinator sign-in and I am not signed in on this browser.',
            'stuck',
          ),
        )
        setThinking(true)
      })
      after(2900, () => {
        setThinking(false)
        push(
          say(
            'llm',
            'You connected a YC account to Huntly, so there is a saved profile with those cookies in it. I can reload the browser with that profile — or hand you the browser and you sign in yourself. I will not type a password.',
          ),
        )
        setPhase('login_blocked')
      })
    }

    if (phase === 'signing_in') {
      after(1600, () => {
        push(say('agent', 'Signed in. Back on the application form.'))
        setPhase('filling')
      })
    }

    if (phase === 'filling') {
      AUTO_FIELD_IDS.forEach((id, index) => {
        after(700 * index + 400, () => setFieldState(id, 'filling'))
        after(700 * index + 1000, () => {
          setFieldState(id, 'filled')
          const field = FORM.find((item) => item.id === id)
          if (field && id !== 'message') push(say('agent', `Filled ${field.label.toLowerCase()}.`))
        })
      })
      const messageStart = 700 * (AUTO_FIELD_IDS.length - 1)
      after(messageStart - 200, () =>
        push(say('llm', 'Writing the note to the founders — this board is the note, not a form.')),
      )
      after(700 * AUTO_FIELD_IDS.length + 1200, () => {
        setFieldState('ctc', 'blocked')
        setFieldState('visa', 'refused')
        push(
          say(
            'agent',
            'Stuck. Two required questions left and I cannot answer either from your Kit.',
            'stuck',
          ),
          say(
            'llm',
            'Visa sponsorship: left blank on purpose. Huntly never answers visa, demographic or disability questions on your behalf — a plausible guess on someone’s application is not a mistake you can apologise for later.',
            'refused',
          ),
          say(
            'llm',
            'Expected annual compensation is required and your Kit has no number in it. What should I put? Type it below, or tell me to leave it blank.',
            'stuck',
          ),
        )
        setPhase('field_blocked')
      })
    }

    if (phase === 'submitting') {
      after(1800, () => {
        push(say('agent', 'Submitted.', 'success'))
        setPhase('submitted')
      })
    }

    if (phase === 'submitted') {
      after(1300, () => {
        setEmailed(true)
        push(say('huntly', 'Confirmation email sent to ada@example.com.', 'success'))
      })
    }
  }, [phase, after, push, setFieldState])

  const start = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setMessages([
      say('user', prompt),
      say('huntly', 'On it. Starting a browser and opening Work at a Startup.'),
    ])
    setRevealed(0)
    setFields(FORM)
    setThinking(false)
    setDriving(false)
    setEmailed(false)
    setApplyOffered(false)
    setPhase('launching')
  }, [prompt])

  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase('idle')
    setMessages([])
    setRevealed(0)
    setFields(FORM)
    setThinking(false)
    setDriving(false)
    setEmailed(false)
    setApplyOffered(false)
  }, [])

  const onSend = useCallback(
    (text: string) => {
      push(say('user', text))

      // While a required field is open, anything typed is taken as the answer
      // to it. That is the whole point of the panel being here.
      if (phase === 'field_blocked') {
        setFields((current) =>
          current.map((field) =>
            field.id === 'ctc' ? { ...field, value: text, state: 'filled' } : field,
          ),
        )
        setThinking(true)
        after(900, () => {
          setThinking(false)
          push(say('agent', `Put "${text}" in expected compensation. Submitting.`))
          setPhase('submitting')
        })
        return
      }

      setThinking(true)
      after(1100, () => {
        setThinking(false)
        push(
          say(
            'llm',
            phase === 'idle'
              ? 'Nothing is running yet — start a hunt above and I will pick this up.'
              : 'Noted. I will factor that in on the next step.',
          ),
        )
      })
    },
    [phase, push, after],
  )

  const actions = useMemo<QuickAction[]>(() => {
    if (phase === 'login_blocked' && !driving) {
      return [
        {
          label: 'Use my connected YC account',
          variant: 'blue',
          onClick: () => {
            push(say('user', 'Use my connected YC account.'), say('agent', 'Loading your YC profile…'))
            setPhase('signing_in')
          },
        },
        {
          label: 'I will sign in myself',
          onClick: () => {
            setDriving(true)
            push(
              say('user', 'I will sign in myself.'),
              say('system', 'You are driving. Click straight into the browser on the left.'),
            )
          },
        },
      ]
    }

    if (phase === 'login_blocked' && driving) {
      return [
        {
          label: 'Done — carry on',
          variant: 'blue',
          onClick: () => {
            setDriving(false)
            push(say('user', 'Done, carry on.'))
            setPhase('signing_in')
          },
        },
      ]
    }

    if (phase === 'field_blocked') {
      return [
        {
          label: 'Leave it blank and submit',
          onClick: () => {
            setFieldState('ctc', 'refused')
            push(
              say('user', 'Leave it blank and submit.'),
              say('agent', 'Left blank. Submitting.'),
            )
            setPhase('submitting')
          },
        },
        {
          label: 'Skip this job',
          onClick: () => {
            push(say('user', 'Skip this job.'), say('huntly', 'Dropped. Nothing was submitted.'))
            setPhase('idle')
          },
        },
      ]
    }

    return []
  }, [phase, driving, push, setFieldState])

  const running = phase !== 'idle'

  const stage = (
    <div
      className={`grid gap-3 ${
        fullscreen ? 'h-full grid-cols-[2.1fr_1fr]' : `lg:grid-cols-[1.9fr_1fr] ${STAGE_HEIGHT}`
      }`}
    >
      <div className="relative flex min-h-[26rem] flex-col lg:min-h-0">
        <BrowserStage phase={phase} revealed={revealed} fields={fields} driving={driving} />

        {/* The Apply button waits for a person. Nothing is applied to until
            somebody looks at the match and agrees with it. */}
        {applyOffered && phase === 'shortlisted' && (
          <div className="absolute right-4 bottom-4 animate-bob">
            <Card className="flex items-center gap-3 p-3">
              <div>
                <p className="font-display text-sm font-bold">{BEST.title}</p>
                <p className="text-xs text-ink-soft">
                  {BEST.company} · {BEST.score}/100 match
                </p>
              </div>
              <Button
                variant="blue"
                onClick={() => {
                  setApplyOffered(false)
                  push(
                    say('user', 'Apply to this one.'),
                    say('agent', 'Opening the posting and following the apply link.'),
                  )
                  setPhase('opening')
                }}
              >
                Apply →
              </Button>
            </Card>
          </div>
        )}

        {driving && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2">
            <Chip tone="blue">you are driving — the agent is waiting</Chip>
          </div>
        )}

        {emailed && <EmailReceipt fields={fields} onDismiss={() => setEmailed(false)} />}
      </div>

      <div className="flex min-h-[24rem] flex-col gap-3 lg:min-h-0">
        <div className="min-h-0 flex-1">
          <AgentChat messages={messages} actions={actions} thinking={thinking} onSend={onSend} />
        </div>
      </div>
    </div>
  )

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col gap-2 bg-butter-100 p-3">
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-display text-lg font-bold">Playground</span>
          <Chip tone="white">{prompt}</Chip>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setFullscreen(false)}>
            Exit full screen (Esc)
          </Button>
        </div>
        <div className="min-h-0 flex-1">{stage}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle
        emoji="🎮"
        title="Playground"
        sub="Ask for one job, watch it happen, and step in when it gets stuck."
      />

      <Card className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={prompt}
            placeholder="search the best suitable job on workatastartup.com"
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !running) start()
            }}
          />
          {running ? (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={reset}>
                Reset
              </Button>
              <Button variant="ghost" onClick={() => setFullscreen(true)}>
                ⛶ Full screen
              </Button>
            </div>
          ) : (
            <Button variant="blue" onClick={start} className="shrink-0">
              Run it →
            </Button>
          )}
        </div>

        {!running && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setPrompt(suggestion)}>
                <Chip tone={suggestion === prompt ? 'blue' : 'white'}>{suggestion}</Chip>
              </button>
            ))}
          </div>
        )}
      </Card>

      {stage}

      <p className="text-center text-xs text-ink-soft">
        Nothing here is connected yet — every step is on a timer. This is for arguing about the flow.
      </p>
    </div>
  )
}
