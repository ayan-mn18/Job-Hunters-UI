import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------ Button */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'blue' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}

const buttonSkins = {
  primary: 'bg-butter-400 hover:bg-butter-300',
  ghost: 'bg-white hover:bg-butter-100',
  blue: 'bg-sky-pop text-white hover:brightness-110',
  danger: 'bg-coral text-white hover:brightness-105',
}

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm rounded-xl gap-1.5',
  md: 'px-4 py-2.5 text-[15px] rounded-2xl gap-2',
  lg: 'px-7 py-4 text-lg rounded-[1.4rem] gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cx(
        'toon-sm toon-lift inline-flex items-center justify-center font-display font-semibold',
        'disabled:pointer-events-none disabled:opacity-50',
        buttonSkins[variant],
        buttonSizes[size],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------- Card */

export function Card({
  className,
  children,
  tilt = 0,
}: {
  className?: string
  children: ReactNode
  tilt?: number
}) {
  return (
    <div
      style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
      className={cx('toon rounded-blob bg-white p-5', className)}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------- Section head */

export function SectionTitle({
  emoji,
  title,
  sub,
  action,
}: {
  emoji: string
  title: string
  sub?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-2xl">
          <span className="text-[1.6rem]">{emoji}</span>
          {title}
        </h2>
        {sub && <p className="mt-0.5 text-sm text-ink-soft">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

/* --------------------------------------------------------------------- Chip */

const chipSkins = {
  yellow: 'bg-butter-300',
  white: 'bg-white',
  blue: 'bg-sky-soft',
  mint: 'bg-mint text-white',
  coral: 'bg-coral text-white',
  grape: 'bg-grape text-white',
  ink: 'bg-ink text-butter-300',
}

export type ChipTone = keyof typeof chipSkins

export function Chip({
  tone = 'yellow',
  children,
  className,
  title,
}: {
  tone?: ChipTone
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <span
      title={title}
      className={cx(
        'inline-flex items-center gap-1 rounded-full border-[2.5px] border-ink px-2.5 py-0.5',
        'font-display text-xs font-semibold whitespace-nowrap',
        chipSkins[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* --------------------------------------------------------------- Stat tile */

export function Stat({
  label,
  value,
  hint,
  emoji,
  tone = 'bg-white',
}: {
  label: string
  value: string | number
  hint?: string
  emoji: string
  tone?: string
}) {
  return (
    <div className={cx('toon toon-lift rounded-blob p-4', tone)}>
      <div className="flex items-start justify-between">
        <span className="font-display text-sm font-semibold text-ink-soft">{label}</span>
        <span className="text-xl leading-none">{emoji}</span>
      </div>
      <div className="mt-1.5 font-display text-4xl leading-none font-bold tabular-nums">
        {value}
      </div>
      {hint && <div className="mt-1.5 text-xs font-semibold text-ink-soft">{hint}</div>}
    </div>
  )
}

/* ------------------------------------------------------------ Progress bar */

export function Progress({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="toon-sm h-6 overflow-hidden rounded-full bg-butter-100">
      <div
        className="h-full border-r-[3px] border-ink transition-[width] duration-500"
        style={{
          width: `${pct}%`,
          backgroundColor: 'var(--color-butter-400)',
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,.55) 0 10px, transparent 10px 20px)',
          backgroundSize: '40px 40px',
          animation: pct > 0 ? 'dash 1.1s linear infinite' : undefined,
        }}
      />
    </div>
  )
}

/* -------------------------------------------------------------- Form field */

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        'toon-sm w-full rounded-2xl bg-butter-50 px-3.5 py-2.5 font-sans text-[15px]',
        'placeholder:text-ink-soft/60 focus:bg-white focus:outline-none',
        props.className,
      )}
    />
  )
}

/* ----------------------------------------------------------------- Toggle */

export function Toggle({
  on,
  onClick,
  label,
}: {
  on: boolean
  onClick: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      className={cx(
        'toon-sm relative h-8 w-14 shrink-0 rounded-full transition-colors',
        on ? 'bg-mint' : 'bg-white',
      )}
    >
      <span
        className={cx(
          'absolute top-[2px] h-[22px] w-[22px] rounded-full border-[2.5px] border-ink bg-butter-300',
          'transition-[left] duration-200',
          on ? 'left-[30px]' : 'left-[3px]',
        )}
      />
    </button>
  )
}

/* ------------------------------------------------------------------ Dialog */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Modal dialog.
 *
 * The pages each grew their own version of this: a fixed div with a click
 * handler and nothing else. That meant Tab walked out of the dialog into the
 * page behind it, the background scrolled under the overlay, and screen
 * readers were told nothing. Doing it once, properly, is the fix.
 *
 * Layout is header / scrolling body / footer, so a long job description never
 * pushes the title or the apply button out of reach, and there is exactly one
 * scroll container rather than a box inside a box.
 */
export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  eyebrow,
  footer,
  children,
  size = 'lg',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  eyebrow?: string
  footer?: ReactNode
  children: ReactNode
  size?: 'md' | 'lg'
}) {
  const panel = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    restoreFocus.current = document.activeElement as HTMLElement | null

    // Lock the page behind the overlay without letting it jump: replacing the
    // scrollbar's width as padding keeps the layout still.
    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPadding = body.style.paddingRight
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panel.current) return
      const focusable = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null,
      )
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0] as HTMLElement
      const last = focusable[focusable.length - 1] as HTMLElement
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === panel.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    // Focus the panel itself rather than the first control, so a screen reader
    // reads the title before anything else.
    panel.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
      restoreFocus.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  // Rendered into <body>, not in place. `<main>` carries an entry animation,
  // and any transform on an ancestor makes `position: fixed` resolve against
  // that element instead of the viewport — which is why the dialog used to
  // open half off-screen and scroll with the page behind it.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          'toon flex w-full flex-col overflow-hidden bg-white focus:outline-none',
          // Full-height sheet on phones, floating card from `sm` up.
          'h-[92vh] rounded-t-blob sm:h-auto sm:max-h-[88vh] sm:rounded-blob',
          size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl',
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b-[3px] border-ink bg-butter-100 px-5 py-4 sm:px-7">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">{eyebrow}</p>
            )}
            <h2 id={titleId} className="mt-0.5 text-xl leading-tight sm:text-2xl">
              {title}
            </h2>
            {subtitle && <div className="mt-0.5 text-sm font-semibold text-ink-soft">{subtitle}</div>}
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close dialog">
            ✕
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
          {children}
        </div>

        {footer && (
          <footer className="shrink-0 border-t-[3px] border-ink bg-butter-50 px-5 py-3.5 sm:px-7">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* ----------------------------------------------------------------- Metrics */

/** Label-over-value pair, used for the job facts grid. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-bold tracking-wide text-ink-soft uppercase">{label}</div>
      <div className="mt-0.5 text-sm font-semibold break-words">{children}</div>
    </div>
  )
}

/** Horizontal bar for one component of a match score. */
export function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs font-semibold">
        <span>{label}</span>
        <span className="tabular-nums text-ink-soft">
          {value}/{Math.round(max)}
        </span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-full border-[2.5px] border-ink bg-butter-100">
        <div
          className="h-full bg-sky-pop transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ Empty state */

export function Empty({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <div className="animate-bob text-5xl">{emoji}</div>
      <h3 className="text-xl">{title}</h3>
      {sub && <p className="max-w-sm text-sm text-ink-soft">{sub}</p>}
    </div>
  )
}
