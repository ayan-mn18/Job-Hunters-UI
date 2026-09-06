import { useEffect, useRef, useState } from 'react'
import { Button, Chip, Input } from '../ui'
import { SPEAKER_EMOJI, SPEAKER_LABEL, type ChatMessage } from './script'

/**
 * The conversation, on the right.
 *
 * Three parties talk here and it has to stay obvious which is which: the
 * browser agent reporting what it did, Muse Spark reasoning about what to do
 * next, and the person, who can cut in at any point. When the run gets stuck
 * the question is asked here rather than in a modal — a modal would cover the
 * browser, and seeing the page is the whole reason someone is watching.
 */

const KIND_SKIN: Record<NonNullable<ChatMessage['kind']>, string> = {
  stuck: 'border-coral bg-coral/10',
  draft: 'border-sky-pop bg-sky-soft/40',
  refused: 'border-ink/30 bg-butter-50 border-dashed',
  success: 'border-mint bg-mint/15',
}

export interface QuickAction {
  label: string
  variant?: 'primary' | 'ghost' | 'blue'
  onClick: () => void
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.speaker === 'user'
  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <span className="mb-0.5 flex items-center gap-1 px-1 font-display text-[11px] font-semibold text-ink-soft">
        <span>{SPEAKER_EMOJI[message.speaker]}</span>
        {SPEAKER_LABEL[message.speaker]}
      </span>
      <div
        className={`max-w-[92%] rounded-2xl border-[2.5px] px-3 py-2 text-[13px] leading-snug whitespace-pre-line ${
          message.kind
            ? KIND_SKIN[message.kind]
            : mine
              ? 'border-ink bg-sky-pop text-white'
              : 'border-ink bg-white'
        }`}
      >
        {message.text}
      </div>
    </div>
  )
}

export function AgentChat({
  messages,
  actions,
  thinking,
  onSend,
}: {
  messages: ChatMessage[]
  actions: QuickAction[]
  thinking: boolean
  onSend: (text: string) => void
}) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll the panel, not the element. `scrollIntoView` walks every scrollable
  // ancestor, which here means it drags the whole page down and pushes the
  // browser out of view — the one thing this layout exists to keep on screen.
  useEffect(() => {
    // After paint, and instantly. A smooth scroll gets restarted by the next
    // message before it finishes, so the panel creeps a few pixels and stops —
    // which looks exactly like the log having frozen.
    const frame = requestAnimationFrame(() => {
      const panel = scrollRef.current
      if (panel) panel.scrollTop = panel.scrollHeight
    })
    return () => cancelAnimationFrame(frame)
  }, [messages.length, actions.length, thinking])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')
    onSend(text)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-butter-50">
      <div className="flex shrink-0 items-center gap-2 border-b-[3px] border-ink bg-butter-200 px-3 py-2">
        <span className="font-display text-sm font-bold">Conversation</span>
        <Chip tone="white">agent · model · you</Chip>
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="mt-6 px-2 text-center text-[13px] text-ink-soft">
            Everything the agent and the model say to each other shows up here. You can cut in
            whenever you like.
          </p>
        )}
        {messages.map((message) => (
          <Bubble key={message.id} message={message} />
        ))}

        {thinking && (
          <div className="flex items-center gap-1.5 px-1 text-[12px] text-ink-soft">
            <span className="animate-bounce">•</span>
            <span className="animate-bounce [animation-delay:120ms]">•</span>
            <span className="animate-bounce [animation-delay:240ms]">•</span>
          </div>
        )}

        {actions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant={action.variant ?? 'ghost'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* A real form, so Enter submits the way it does in every other chat box
          — a keydown handler is one focus quirk away from silently doing
          nothing, which is a bad way to lose someone's answer. */}
      <form onSubmit={submit} className="shrink-0 border-t-[3px] border-ink bg-butter-100 p-2.5">
        <div className="flex gap-2">
          <Input
            value={draft}
            placeholder="Tell the model what to do…"
            onChange={(event) => setDraft(event.target.value)}
            // Implicit form submission on Enter is standard, and it did not
            // fire under automation. Asking the form to submit itself costs a
            // line and removes the question.
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }}
          />
          <Button size="sm" variant="blue" type="submit">
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}
