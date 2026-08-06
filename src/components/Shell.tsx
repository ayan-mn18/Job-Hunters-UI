import { NavLink, Outlet } from 'react-router-dom'
import { HUNTER } from '../data/mock'
import { Chip } from './ui'

const nav = [
  { to: '/', emoji: '🏠', label: 'Den', end: true },
  { to: '/hunt', emoji: '🎯', label: 'The Hunt' },
  { to: '/jobs', emoji: '📮', label: 'Applications' },
  { to: '/referrals', emoji: '🤝', label: 'Referrals' },
  { to: '/profile', emoji: '🧳', label: 'My Kit' },
]

function NavItem({ to, emoji, label, end }: (typeof nav)[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'toon-sm toon-lift flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5',
          'font-display text-[15px] font-semibold',
          isActive ? 'bg-butter-400' : 'bg-white',
        ].join(' ')
      }
    >
      <span className="text-lg leading-none">{emoji}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export function Shell() {
  return (
    <div className="min-h-screen">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-butter-200/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="toon-sm flex h-11 w-11 items-center justify-center rounded-2xl bg-butter-400 text-2xl">
            🪤
          </div>
          <div className="mr-auto">
            <div className="font-display text-xl leading-none font-bold">Job Hunters</div>
            <div className="text-xs font-semibold text-ink-soft">
              apply while you sleep
            </div>
          </div>

          <Chip tone="white" className="hidden sm:inline-flex">
            🔥 {HUNTER.streakDays} day streak
          </Chip>
          <Chip tone="ink">
            {HUNTER.appliedToday}/{HUNTER.dailyTarget} today
          </Chip>
          <div className="toon-sm flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg">
            🧑‍🚀
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* side nav — desktop */}
        <nav className="sticky top-24 hidden h-fit w-52 shrink-0 flex-col gap-2.5 md:flex">
          {nav.map((n) => (
            <NavItem key={n.to} {...n} />
          ))}
          <div className="toon rounded-blob mt-3 bg-sky-soft p-4">
            <div className="font-display text-sm font-bold">Robot is awake</div>
            <p className="mt-1 text-xs text-ink-soft">
              Next scrape run at 06:00. Nothing for you to do.
            </p>
          </div>
        </nav>

        <main className="animate-pop-in min-w-0 flex-1 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* bottom nav — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-ink bg-butter-200 px-2 py-2 md:hidden">
        <div className="flex justify-between gap-1.5">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                [
                  'flex flex-1 flex-col items-center gap-0.5 rounded-xl border-[2.5px] border-ink py-1.5',
                  'font-display text-[10px] font-semibold',
                  isActive ? 'bg-butter-400' : 'bg-white',
                ].join(' ')
              }
            >
              <span className="text-base leading-none">{n.emoji}</span>
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
