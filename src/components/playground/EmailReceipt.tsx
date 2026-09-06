import { Button, Chip } from '../ui'
import { BEST, type FormField } from './script'

/**
 * The receipt.
 *
 * The last thing that happens in a run is the only thing anyone reads later,
 * and "applied ✅" in a table is not evidence — it does not say what went in,
 * what was deliberately left out, or where to look if a founder replies. So the
 * confirmation email is shown as an email: from, subject, and the same body
 * that lands in the connected inbox.
 *
 * Sits over the browser rather than beside it because by this point the browser
 * has nothing left to show, and this is the answer to the question the whole
 * run was asking.
 */
/** Field labels read the way a person would say them, not the way a form does. */
function shortLabel(field: FormField): string {
  return field.label
    .replace(/\s*\*$/, '')
    .replace(/^Why do you want to work at .+$/, 'your message to the founders')
    .replace(/^Expected annual compensation.*$/, 'expected compensation')
    .replace(/^Will you now or in the future require visa sponsorship.*$/, 'visa sponsorship')
    .toLowerCase()
}

export function EmailReceipt({
  fields,
  onDismiss,
}: {
  fields: FormField[]
  onDismiss: () => void
}) {
  // The receipt is only worth anything if it is accurate. Reading it off the
  // form means it cannot claim something went in that did not — which the
  // first version did, the moment anyone chose to leave a field blank.
  const sent = fields.filter((field) => field.state === 'filled').map(shortLabel)
  const blank = fields
    .filter((field) => field.state === 'refused' || field.state === 'blocked')
    .map(shortLabel)
  const refusedByPolicy = fields.some(
    (field) => field.id === 'visa' && field.state !== 'filled',
  )

  return (
    <div className="absolute inset-x-4 bottom-4 z-10 animate-bob">
      <div className="overflow-hidden rounded-2xl border-[3px] border-ink bg-white shadow-[6px_6px_0_var(--color-ink)]">
        <div className="flex items-center gap-2 border-b-[3px] border-ink bg-mint/25 px-3.5 py-2">
          <span className="text-lg">📧</span>
          <span className="font-display text-sm font-bold">Gmail · Inbox</span>
          <Chip tone="mint">delivered</Chip>
          <span className="ml-auto text-[11px] font-semibold text-ink-soft">just now</span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="ml-1 font-display text-sm font-bold text-ink-soft hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
            <span className="font-display font-bold">Hunty</span>
            <span className="text-ink-soft">&lt;hunty@huntly.app&gt;</span>
            <span className="text-ink-soft">→ ada@example.com</span>
          </div>

          <p className="mt-1.5 font-display text-[15px] font-bold">
            ✅ Applied: {BEST.title} at {BEST.company}
          </p>

          <div className="mt-2 flex flex-col gap-1.5 text-[13px] leading-snug">
            <p>
              Your application went in. {BEST.company} ({BEST.batch}) · {BEST.location} · applied
              just now.
            </p>
            <p className="text-ink-soft">
              <span className="font-semibold text-ink">Sent:</span> {sent.join(', ')}.
            </p>
            {blank.length > 0 && (
              <p className="text-ink-soft">
                <span className="font-semibold text-ink">Left blank:</span> {blank.join(', ')}.
                {/* The policy line belongs to the questions the policy covers.
                    Attaching it to a field the user simply chose to skip reads
                    as Huntly refusing something it did not. */}
                {refusedByPolicy && ' Visa, demographic and disability questions are never answered for you.'}
              </p>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button size="sm" variant="ghost">
              View the posting
            </Button>
            <Button size="sm" variant="ghost">
              Open in Gmail
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
