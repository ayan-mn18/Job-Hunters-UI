import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AgentChat, type QuickAction } from '../components/playground/AgentChat'
import { BrowserStage } from '../components/playground/BrowserStage'
import { EmailReceipt } from '../components/playground/EmailReceipt'
import { Shortlist } from '../components/playground/Shortlist'
import {
  LIVE_STATUSES,
  SUGGESTED_PROMPTS,
  localMessage,
  type ChatMessage,
  type PlaygroundRun,
  type ShortlistEntry,
} from '../components/playground/script'
import { api, ApiError, BASE_URL, getAccessToken } from '../lib/api'
import { Button, Card, Chip, Input, SectionTitle } from '../components/ui'

/**
 * The playground.
 *
 * One job, from a sentence to a confirmation email, with the browser visible
 * the whole way. It exists because the rest of the product reports a status
 * per row, which says nothing about *why* — and the parts most likely to go
 * wrong, a login wall or a question nobody can answer from a résumé, are
 * exactly the parts a status column hides.
 *
 * The run happens on the server. This page starts it, embeds the browser it
 * opened, and relays what the agent and the model say. Everything arrives over
 * one socket; the initial fetch is what makes reopening a run mid-flight work.
 */

const STAGE_HEIGHT = 'lg:h-[calc(100vh-16rem)] lg:min-h-[32rem]'

interface SocketEvent {
  type: 'ready' | 'state' | 'message' | 'step'
  runId?: string
  status?: string
  detail?: Record<string, unknown> | null
  speaker?: ChatMessage['speaker']
  body?: string
  kind?: ChatMessage['kind']
  index?: number
  tool?: string
  result?: string
  ok?: boolean
  at?: string
}

export function Playground() {
  const [prompt, setPrompt] = useState(SUGGESTED_PROMPTS[0] as string)
  const [run, setRun] = useState<PlaygroundRun | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [starting, setStarting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(true)

  const socketRef = useRef<WebSocket | null>(null)
  const runId = run?.id ?? null
  const status = run?.status ?? null
  const live = status !== null && LIVE_STATUSES.includes(status)

  const push = useCallback((...next: ChatMessage[]) => {
    setMessages((current) => [...current, ...next])
  }, [])

  /** Re-reads the run. Also how a reopened tab catches up on a run in flight. */
  const refresh = useCallback(async (id: string) => {
    const { data } = await api.get<{
      run: PlaygroundRun
      messages: Array<{ id: string; speaker: ChatMessage['speaker']; body: string; kind: ChatMessage['kind'] }>
    }>(`/playground/runs/${id}`)
    setRun(data.run)
    setMessages(
      data.messages.map((message) => ({
        id: message.id,
        speaker: message.speaker,
        text: message.body,
        kind: message.kind,
      })),
    )
  }, [])

  /**
   * Reattach to whatever is already running.
   *
   * A run lives on the server and outlives the tab that started it — closing
   * the page does not stop the browser, and coming back has to show the run
   * rather than an empty stage. This is also what makes a question asked while
   * nobody was looking answerable.
   */
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const { data } = await api.get<PlaygroundRun[]>('/playground/runs')
        const latest = data[0]
        if (cancelled || !latest) return
        if (!LIVE_STATUSES.includes(latest.status) && latest.status !== 'submitted') return
        setRun(latest)
        await refresh(latest.id)
      } catch {
        // An empty playground is the normal case; nothing to report.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  // One socket per run. Events are small and every one matters, so unlike the
  // apply live view there is nothing to throttle here.
  useEffect(() => {
    if (!runId) return
    const token = getAccessToken()
    if (!token) return

    const url = `${BASE_URL.replace(/^http/, 'ws')}/live/playground/${runId}?token=${encodeURIComponent(token)}`
    const socket = new WebSocket(url)
    socketRef.current = socket

    socket.onmessage = (raw) => {
      let event: SocketEvent
      try {
        event = JSON.parse(String(raw.data)) as SocketEvent
      } catch {
        return
      }

      if (event.type === 'message' && event.body) {
        push({
          id: `${event.at ?? Date.now()}-${event.speaker ?? 'x'}-${event.body.slice(0, 12)}`,
          speaker: event.speaker ?? 'system',
          text: event.body,
          kind: event.kind ?? null,
        })
        return
      }

      if (event.type === 'step' && event.tool) {
        push({
          id: `step-${event.index}-${event.tool}`,
          speaker: 'agent',
          text: `${event.tool} — ${event.result ?? ''}`,
          kind: event.ok === false ? 'refused' : null,
        })
        return
      }

      if (event.type === 'state') {
        // The state event carries the change but not the whole run — the
        // shortlist and the filled fields come back on the re-read, which is
        // one request per transition rather than a payload on every event.
        void refresh(runId).catch(() => undefined)
      }
    }

    return () => {
      socketRef.current = null
      socket.close()
    }
  }, [runId, push, refresh])

  const start = useCallback(async () => {
    setStarting(true)
    setMessages([])
    setReceiptOpen(true)
    try {
      const { data } = await api.post<PlaygroundRun>('/playground/runs', { prompt })
      setRun(data)
      await refresh(data.id)
    } catch (error) {
      push(
        localMessage(
          'system',
          error instanceof ApiError ? error.message : 'Could not start a run.',
          'stuck',
        ),
      )
    } finally {
      setStarting(false)
    }
  }, [prompt, refresh, push])

  const act = useCallback(
    async (path: string, body?: unknown) => {
      if (!runId) return
      setBusy(true)
      try {
        await api.post(`/playground/runs/${runId}/${path}`, body)
        await refresh(runId)
      } catch (error) {
        push(
          localMessage(
            'system',
            error instanceof ApiError ? error.message : 'That did not go through.',
            'stuck',
          ),
        )
      } finally {
        setBusy(false)
      }
    },
    [runId, refresh, push],
  )

  const onSend = useCallback(
    (text: string) => {
      if (!runId || !live) return
      // Shown immediately. The server echoes its own copy, which is why the
      // local one is marked and replaced on the next re-read.
      push(localMessage('user', text))
      void act('message', { text })
    },
    [runId, live, push, act],
  )

  const onApply = useCallback(
    (entry: ShortlistEntry) => {
      push(localMessage('user', `Apply to ${entry.title} at ${entry.company}.`))
      void act('apply', { url: entry.url })
    },
    [push, act],
  )

  const actions = useMemo<QuickAction[]>(() => {
    if (!run) return []
    if (run.status === 'blocked') {
      // A sign-in question wants a different button from a missing-field one:
      // there is nothing to leave blank, the browser on the left is the real
      // thing, and the answer is simply that they have finished.
      const signIn = /sign(ed)?[- ]?in|log(ged)? in|account/i.test(run.pendingQuestion ?? '')
      return [
        signIn
          ? {
              label: 'Done — carry on',
              variant: 'blue' as const,
              onClick: () => void act('answer', { text: 'done' }),
            }
          : {
              label: 'Leave it blank and carry on',
              onClick: () => void act('answer', { text: 'Leave it blank.' }),
            },
        { label: 'Stop this run', variant: 'ghost', onClick: () => void act('cancel') },
      ]
    }
    if (LIVE_STATUSES.includes(run.status)) {
      return [{ label: 'Stop this run', variant: 'ghost', onClick: () => void act('cancel') }]
    }
    return []
  }, [run, act])

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  const stage = (
    <div
      className={`grid gap-3 ${
        fullscreen ? 'h-full grid-cols-[2.1fr_1fr]' : `lg:grid-cols-[1.9fr_1fr] ${STAGE_HEIGHT}`
      }`}
    >
      <div className="relative flex min-h-[26rem] flex-col lg:min-h-0">
        <BrowserStage run={run} />

        {run?.status === 'shortlisted' && (
          <Shortlist entries={run.shortlist} busy={busy} onApply={onApply} />
        )}

        {run?.status === 'submitted' && receiptOpen && (
          <EmailReceipt run={run} onDismiss={() => setReceiptOpen(false)} />
        )}
      </div>

      <div className="flex min-h-[24rem] flex-col gap-3 lg:min-h-0">
        <div className="min-h-0 flex-1">
          <AgentChat
            messages={messages}
            actions={actions}
            thinking={live && run?.status !== 'blocked' && run?.status !== 'shortlisted'}
            disabled={!live}
            onSend={onSend}
          />
        </div>
      </div>
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col gap-2 bg-butter-100 p-3">
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-display text-lg font-bold">Playground</span>
          <Chip tone="white">{run?.prompt ?? prompt}</Chip>
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
            disabled={live || starting}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !live && !starting) void start()
            }}
          />
          {live ? (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => void act('cancel')}>
                Stop
              </Button>
              <Button variant="ghost" onClick={() => setFullscreen(true)}>
                ⛶ Full screen
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="blue" onClick={() => void start()} disabled={starting}>
                {starting ? 'Starting…' : 'Run it →'}
              </Button>
              {run && (
                <Button variant="ghost" onClick={() => setFullscreen(true)}>
                  ⛶ Full screen
                </Button>
              )}
            </div>
          )}
        </div>

        {!live && !run && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setPrompt(suggestion)}>
                <Chip tone={suggestion === prompt ? 'blue' : 'white'}>{suggestion}</Chip>
              </button>
            ))}
          </div>
        )}

        {run?.dryRun && (
          <p className="mt-3 text-xs font-semibold text-ink-soft">
            Dry run: the form gets filled and nothing is submitted. Turn off APPLY_DRY_RUN on the
            server to send applications for real.
          </p>
        )}
      </Card>

      {stage}
    </div>
  )
}
