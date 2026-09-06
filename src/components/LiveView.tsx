import { useCallback, useEffect, useRef, useState } from 'react'
import { BASE_URL, getAccessToken } from '../lib/api'
import { Button, Card, Chip } from './ui'

/**
 * Watching an application happen, and taking it over when it gets stuck.
 *
 * The point is not a video. When the runner blocks on a question it cannot
 * answer, it holds the same browser open for a few minutes and forwards your
 * clicks and keystrokes to it — so you finish the application that is already
 * in progress, rather than being handed a broken one afterwards.
 */

interface StateEvent {
  type: 'state'
  attemptId: string
  state: string
  reason: string | null
  detail: Record<string, unknown> | null
  at: string
}

interface FrameEvent {
  type: 'frame'
  attemptId: string
  seq: number
  data: string
}

interface FieldEvent {
  type: 'field'
  attemptId: string
  label: string
  via: string
  filled: boolean
}

interface ReadyEvent {
  type: 'ready'
  attemptId: string
  takeoverWindowMs: number
}

type LiveEvent = StateEvent | FrameEvent | FieldEvent | ReadyEvent

const STATE_LABEL: Record<string, string> = {
  queued: 'Waiting its turn',
  opening: 'Opening the form',
  filling: 'Filling it in',
  blocked: 'Stuck — needs you',
  submitting: 'Submitting',
  submitted: 'Submitted',
  failed: 'Failed',
  skipped: 'Filled, not submitted',
}

const BLOCKED_LABEL: Record<string, string> = {
  needs_input: 'a question it could not answer',
  captcha: 'a CAPTCHA',
  login_required: 'a login',
  unknown_field: 'a field it did not recognise',
  sensitive_field: 'a question it will not answer for you',
}

export function LiveView({
  attemptId,
  liveUrl,
  onClose,
}: {
  attemptId: string
  /**
   * A hosted browser, embeddable directly. When this is set the panel shows
   * the real browser rather than a stream of frames, and taking over is just
   * clicking in it — there is nothing to forward and no scaling to get wrong.
   */
  liveUrl: string | null
  onClose: () => void
}) {
  const [frame, setFrame] = useState<string | null>(null)
  const [states, setStates] = useState<StateEvent[]>([])
  const [fields, setFields] = useState<FieldEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [takingOver, setTakingOver] = useState(false)
  const [soundArmed, setSoundArmed] = useState(false)
  const [deadline, setDeadline] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(0)

  const socketRef = useRef<WebSocket | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const audioRef = useRef<AudioContext | null>(null)

  const current = states[states.length - 1] ?? null
  const blocked = current?.state === 'blocked'

  /**
   * Browsers refuse to play audio until the user has interacted with the page,
   * so the alert is armed on the first click and the UI says whether it is.
   * An alert someone believes is armed but is not is worse than none.
   */
  const armSound = useCallback(() => {
    if (soundArmed) return
    try {
      const Ctx = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      audioRef.current = new Ctx()
      void audioRef.current.resume()
      setSoundArmed(true)
    } catch {
      // No audio available; the visual alert still fires.
    }
  }, [soundArmed])

  const chime = useCallback(() => {
    const ctx = audioRef.current
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 660
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) return

    const url = `${BASE_URL.replace(/^http/, 'ws')}/live/${attemptId}?token=${encodeURIComponent(token)}`
    const socket = new WebSocket(url)
    socketRef.current = socket

    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)
    socket.onerror = () => setConnected(false)

    socket.onmessage = (message) => {
      let event: LiveEvent
      try {
        event = JSON.parse(String(message.data)) as LiveEvent
      } catch {
        return
      }

      if (event.type === 'frame') {
        setFrame(event.data)
      } else if (event.type === 'field') {
        setFields((previous) => [...previous.slice(-40), event])
      } else if (event.type === 'state') {
        setStates((previous) => [...previous, event])
        if (event.state === 'blocked') {
          chime()
          const window = Number(event.detail?.takeoverWindowMs ?? 0)
          if (window > 0) setDeadline(Date.now() + window)
        }
      } else if (event.type === 'ready') {
        setConnected(true)
      }
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [attemptId, chime])

  // Countdown on the takeover window, so the pressure is visible.
  useEffect(() => {
    if (!deadline) return
    const timer = setInterval(() => {
      const left = Math.max(0, deadline - Date.now())
      setRemaining(left)
      if (left === 0) setDeadline(null)
    }, 500)
    return () => clearInterval(timer)
  }, [deadline])

  function send(payload: Record<string, unknown>) {
    const socket = socketRef.current
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload))
  }

  function onFrameClick(event: React.MouseEvent<HTMLImageElement>) {
    armSound()
    if (!takingOver) return
    const image = imageRef.current
    if (!image) return
    // The frame is scaled to fit; map the click back to page coordinates.
    const rect = image.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * image.naturalWidth
    const y = ((event.clientY - rect.top) / rect.height) * image.naturalHeight
    send({ kind: 'click', x: Math.round(x), y: Math.round(y) })
  }

  useEffect(() => {
    if (!takingOver) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key.length === 1) send({ kind: 'key', text: event.key })
      else if (event.key === 'Enter') send({ kind: 'key', text: '\n' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [takingOver])

  return (
    // The wrapper carries the click handler: `Card` takes no DOM props, and
    // arming the sound needs a real user gesture anywhere in the panel.
    <div onClick={armSound}>
    <Card className="min-w-0 w-full p-0! overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b-[3px] border-ink bg-butter-200 px-4 py-2.5">
        <span className="font-display text-lg font-bold">
          {current ? (STATE_LABEL[current.state] ?? current.state) : 'Connecting…'}
        </span>
        <Chip tone={connected ? 'mint' : 'white'}>{connected ? 'live' : 'offline'}</Chip>
        {!soundArmed && (
          <Chip tone="white">click once to turn on the alert sound</Chip>
        )}
        {deadline && remaining > 0 && (
          <Chip tone="coral">{Math.ceil(remaining / 1000)}s to take over</Chip>
        )}
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onClose}>
          Close
        </Button>
      </div>

      {blocked && (
        <div className="border-b-[3px] border-ink bg-coral/15 px-4 py-3">
          <p className="font-display text-base font-bold">
            Stuck on {BLOCKED_LABEL[current?.reason ?? ''] ?? 'something it could not do'}.
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink-soft">
            The browser is still open. Take over and finish it, and Hunty will carry on from
            where you leave it.
          </p>
          <div className="mt-2.5 flex gap-2">
            {liveUrl ? (
              <Button
                size="sm"
                variant="blue"
                onClick={() => {
                  send({ kind: 'release' })
                }}
              >
                I am done — carry on
              </Button>
            ) : !takingOver ? (
              <Button size="sm" onClick={() => setTakingOver(true)}>
                Take over
              </Button>
            ) : (
              <Button
                size="sm"
                variant="blue"
                onClick={() => {
                  send({ kind: 'release' })
                  setTakingOver(false)
                }}
              >
                I am done — carry on
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,1fr)]">
        <div className="min-w-0 overflow-hidden bg-ink/5 p-3">
          {liveUrl ? (
            <>
              <iframe
                src={liveUrl}
                title="The application form, live"
                allow="clipboard-read; clipboard-write"
                className="block h-[32rem] w-full min-w-0 max-w-full rounded-xl border-[3px] border-ink bg-white"
              />
              <p className="mt-2 text-xs font-semibold text-ink-soft">
                This is the real browser. Click and type in it any time — Hunty carries on from
                wherever you leave it.
              </p>
            </>
          ) : frame ? (
            <img
              ref={imageRef}
              src={`data:image/jpeg;base64,${frame}`}
              alt="The application form, as Hunty sees it"
              onClick={onFrameClick}
              className={`w-full rounded-xl border-[3px] border-ink ${
                takingOver ? 'cursor-crosshair ring-4 ring-sky-pop' : ''
              }`}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm font-semibold text-ink-soft">
              Waiting for the first frame…
            </div>
          )}
          {takingOver && (
            <p className="mt-2 text-xs font-semibold text-ink-soft">
              You are driving. Click the form and type — it goes to the real browser.
            </p>
          )}
        </div>

        <div className="min-w-0 border-t-[3px] border-ink p-3 lg:border-t-0 lg:border-l-[3px]">
          <div className="font-display text-sm font-bold">Fields</div>
          <div className="mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto">
            {fields.length === 0 && (
              <span className="text-sm font-semibold text-ink-soft">Nothing filled yet.</span>
            )}
            {fields.map((field, index) => (
              <div key={`${field.label}-${index}`} className="flex items-center gap-2 text-xs">
                <span>{field.filled ? '✅' : '⬜'}</span>
                <span className="truncate font-semibold">{field.label}</span>
                <span className="ml-auto shrink-0 text-ink-soft">{field.via}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
    </div>
  )
}
