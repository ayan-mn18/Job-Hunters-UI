import { Button, Card, Chip } from '../ui'
import type { ShortlistEntry } from './script'

/**
 * The ranking, over the browser.
 *
 * The scores are Huntly's, not the board's, so they have nowhere to live
 * inside the embedded browser and are laid over it instead. It sits on top of
 * the live session on purpose: the point of the panel is to compare what was
 * chosen against the page it was chosen from.
 *
 * Applying always waits for a click here. A run never sends an application on
 * its own, however confident the score.
 */
export function Shortlist({
  entries,
  busy,
  onApply,
}: {
  entries: ShortlistEntry[]
  busy: boolean
  onApply: (entry: ShortlistEntry) => void
}) {
  if (entries.length === 0) return null
  const [best, ...rest] = entries

  return (
    <div className="absolute inset-x-4 bottom-4 z-10 max-h-[70%] overflow-y-auto">
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-sm font-bold">{best?.title}</span>
          <Chip tone="white">{best?.company}</Chip>
          <Chip tone="mint">best match · {best?.score}</Chip>
          <Button
            size="sm"
            variant="blue"
            className="ml-auto"
            disabled={busy}
            onClick={() => best && onApply(best)}
          >
            {busy ? 'Starting…' : 'Apply →'}
          </Button>
        </div>

        <p className="mt-1 text-xs text-ink-soft">
          {best?.location}
          {best?.experience ? ` · ${best.experience}` : ''}
          {best?.salary ? ` · ${best.salary}` : ''}
        </p>

        {best?.reasons.length ? (
          <ul className="mt-1.5 flex flex-col gap-0.5 text-xs">
            {best.reasons.map((reason) => (
              <li key={reason}>· {reason}</li>
            ))}
          </ul>
        ) : null}

        {rest.length > 0 && (
          <div className="mt-2.5 border-t-[2.5px] border-ink/15 pt-2">
            <p className="mb-1 font-display text-[11px] font-semibold text-ink-soft">
              Also found
            </p>
            <div className="flex flex-col gap-1">
              {rest.map((entry) => (
                <div key={entry.url} className="flex items-center gap-2 text-xs">
                  <span className="truncate font-semibold">{entry.title}</span>
                  <span className="shrink-0 text-ink-soft">{entry.company}</span>
                  <span className="ml-auto shrink-0 text-ink-soft">{entry.score}</span>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => onApply(entry)}>
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
