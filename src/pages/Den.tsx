import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { Mascot } from '../components/Mascot'
import { Button, Card, Chip, SectionTitle } from '../components/ui'

const BANNER_KEY = 'jobhunters.demo.firstRunBannerDismissed'

export function Den() {
  const { user } = useAuth()
  const firstName = (user?.name ?? 'Hunter').split(' ')[0]
  const [showBanner, setShowBanner] = useState(
    () => localStorage.getItem(BANNER_KEY) !== '1',
  )

  function dismissBanner() {
    localStorage.setItem(BANNER_KEY, '1')
    setShowBanner(false)
  }

  return (
    <div className="space-y-7">
      {showBanner && (
        <Card className="animate-pop-in flex flex-wrap items-center gap-4 bg-mint/25!">
          <span className="text-3xl">🎉</span>
          <div className="min-w-56 flex-1">
            <h3 className="text-xl">Your den is ready, {firstName}.</h3>
            <p className="text-sm font-semibold text-ink-soft">
              Add your resume and hunt preferences when you are ready.
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={dismissBanner}>
            Got it
          </Button>
        </Card>
      )}

      <Card className="relative overflow-hidden bg-butter-300!">
        <div className="pointer-events-none absolute -top-10 -right-10 h-44 w-44 rounded-full bg-butter-200" />
        <div className="relative flex flex-wrap items-center gap-6">
          <Mascot mood="hunting" size={132} />
          <div className="min-w-56 flex-1">
            <Chip tone="white">welcome back, hunter</Chip>
            <h1 className="mt-2 text-4xl leading-tight">Hey {firstName}.</h1>
            <p className="mt-2 max-w-lg text-[15px] font-semibold text-ink-soft">
              Pick up where you left off.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link to="/app/hunt">
                <Button size="lg" icon={<span>🎯</span>}>
                  Open the hunt
                </Button>
              </Link>
              <Link to="/app/profile">
                <Button size="lg" variant="ghost" icon={<span>🧳</span>}>
                  Update my kit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <section>
        <SectionTitle emoji="🧭" title="Where next?" sub="Choose a workspace" />
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/app/hunt" className="block">
            <Card className="toon-lift h-full">
              <div className="text-3xl">🎯</div>
              <h3 className="mt-3 text-xl">The Hunt</h3>
              <p className="mt-1 text-sm font-semibold text-ink-soft">
                Set roles, locations and sources.
              </p>
            </Card>
          </Link>
          <Link to="/app/jobs" className="block">
            <Card className="toon-lift h-full">
              <div className="text-3xl">📮</div>
              <h3 className="mt-3 text-xl">Applications</h3>
              <p className="mt-1 text-sm font-semibold text-ink-soft">
                Review applications when needed.
              </p>
            </Card>
          </Link>
          <Link to="/app/profile" className="block">
            <Card className="toon-lift h-full">
              <div className="text-3xl">🧳</div>
              <h3 className="mt-3 text-xl">My Kit</h3>
              <p className="mt-1 text-sm font-semibold text-ink-soft">
                Keep resume details ready.
              </p>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  )
}
