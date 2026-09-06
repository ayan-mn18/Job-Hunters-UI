import { Chip } from '../ui'
import { STATUS_LABEL, type PlaygroundRun, type RunStatus } from './script'

/**
 * The browser.
 *
 * This is the hosted session's own live URL in an iframe — a real Chromium
 * running somewhere else, with the user's logins in it. Watching and taking
 * over are therefore the same act: click in it. There is no frame stream to
 * scale and no coordinates to map, which is most of what the older apply live
 * view had to get right.
 *
 * Before a session exists there is nothing to embed, so the panel says what it
 * is waiting for rather than showing an empty frame.
 */

function Waiting({ status, error }: { status: RunStatus | null; error: string | null }) {
  const copy: Partial<Record<RunStatus, { emoji: string; title: string; sub: string }>> = {
    queued: {
      emoji: '⏳',
      title: 'Waiting its turn',
      sub: 'Every browser is busy. This starts as soon as one frees up.',
    },
    launching: {
      emoji: '🖥️',
      title: 'Starting a browser',
      sub: 'A stealth Chromium, somewhere else, with your logins in it.',
    },
    failed: {
      emoji: '💥',
      title: 'That did not work',
      sub: error ?? 'Something went wrong. The conversation on the right has the details.',
    },
    cancelled: { emoji: '🛑', title: 'Stopped', sub: 'Nothing was sent.' },
  }
  const shown = (status ? copy[status] : undefined) ?? {
    emoji: '🎮',
    title: 'Nothing running yet',
    sub: 'Ask for something above and a browser opens right here.',
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <div className="animate-bob text-5xl">{shown.emoji}</div>
      <p className="font-display text-lg font-bold">{shown.title}</p>
      <p className="max-w-sm text-sm text-ink-soft">{shown.sub}</p>
    </div>
  )
}

export function BrowserStage({ run }: { run: PlaygroundRun | null }) {
  const liveUrl = run?.liveUrl ?? null

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b-[3px] border-ink bg-butter-200 px-3 py-2">
        <span className="flex gap-1.5">
          <span className="size-3 rounded-full border-2 border-ink bg-coral" />
          <span className="size-3 rounded-full border-2 border-ink bg-butter-400" />
          <span className="size-3 rounded-full border-2 border-ink bg-mint" />
        </span>
        <div className="ml-1 flex-1 truncate rounded-lg border-[2.5px] border-ink bg-white px-2.5 py-1 font-mono text-xs">
          {run?.chosen?.url ?? (liveUrl ? 'live browser session' : 'about:blank')}
        </div>
        {run && (
          <Chip tone={run.status === 'blocked' ? 'coral' : 'mint'}>{STATUS_LABEL[run.status]}</Chip>
        )}
      </div>

      <div className="relative flex-1 overflow-hidden bg-white">
        {liveUrl ? (
          <iframe
            src={liveUrl}
            title="The browser Huntly is driving"
            allow="clipboard-read; clipboard-write"
            className="h-full w-full border-0"
          />
        ) : (
          // No run at all is a different thing from a run that is queued, and
          // telling somebody every browser is busy when they have not asked for
          // anything is a bad first impression.
          <Waiting status={run?.status ?? null} error={run?.error ?? null} />
        )}
      </div>
    </div>
  )
}
