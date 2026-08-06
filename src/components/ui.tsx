import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

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
}: {
  tone?: ChipTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
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
