import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { Button, Card, Chip, Field, Input } from '../components/ui'
import { useAuth } from '../auth/context'

const perks = [
  '📮 Up to 100 applications a day',
  '✂️ A tailored resume per job description',
  '🤝 Every referral request in one daily pile',
  '📊 See which portal actually replies',
]

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup'
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Email and password, please.')
      return
    }
    if (isSignup && !name.trim()) {
      setError('Tell Hunty your name first.')
      return
    }
    setError('')
    setBusy(true)
    try {
      if (isSignup) {
        await signUp(name.trim(), email.trim(), password)
        navigate('/welcome', { replace: true })
      } else {
        const user = await signIn(email.trim(), password)
        navigate(user.onboarded ? '/app' : '/welcome', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b-[3px] border-ink bg-butter-200">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="toon-sm flex h-11 w-11 items-center justify-center rounded-2xl bg-butter-400 text-2xl">
              🪤
            </div>
            <span className="font-display text-xl leading-none font-bold">Job Hunters</span>
          </Link>
          <Link to={isSignup ? '/login' : '/signup'} className="ml-auto">
            <Button size="sm" variant="ghost">
              {isSignup ? 'Log in instead' : 'Create account'}
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-10 lg:grid-cols-[1fr_1.1fr]">
        {/* pitch side */}
        <div className="order-2 lg:order-1">
          <Card className="bg-butter-300!">
            <div className="flex justify-center">
              <Mascot mood={isSignup ? 'happy' : 'proud'} size={120} />
            </div>
            <h2 className="mt-2 text-center text-2xl">
              {isSignup ? 'Hunty is bored. Give it a job.' : 'Hunty missed you.'}
            </h2>
            <ul className="mt-4 space-y-2">
              {perks.map((p) => (
                <li key={p} className="toon-sm rounded-2xl bg-white px-3.5 py-2 text-sm font-semibold">
                  {p}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* form side */}
        <div className="order-1 lg:order-2">
          <Card className="animate-pop-in">
            <Chip tone="mint">live backend</Chip>
            <h1 className="mt-3 text-4xl leading-tight">
              {isSignup ? 'Make an account' : 'Welcome back'}
            </h1>
            <p className="mt-1.5 text-sm font-semibold text-ink-soft">
              Real accounts now — everything you do is saved to the database.
            </p>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              {isSignup && (
                <Field label="Your name" hint="what Hunty should call you">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ayan Mansoori"
                    autoComplete="name"
                  />
                </Field>
              )}

              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>

              <Field label="Password" hint="at least 8 characters">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                />
              </Field>

              {error && (
                <div className="toon-sm rounded-2xl bg-coral px-3.5 py-2 text-sm font-semibold text-white">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy
                  ? isSignup
                    ? '🪄 building your den…'
                    : '🔑 letting you in…'
                  : isSignup
                    ? '🚀 Create account'
                    : '🔑 Log in'}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-[3px] flex-1 bg-butter-300" />
              <span className="font-display text-xs font-bold text-ink-soft">OR</span>
              <div className="h-[3px] flex-1 bg-butter-300" />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setEmail('demo@jobhunters.test')
                  setPassword('hunty-demo-2026')
                  if (isSignup) setName('Ayan Mansoori')
                }}
                icon={<span>✨</span>}
              >
                Fill demo details
              </Button>
              <Button variant="ghost" disabled icon={<span>💼</span>}>
                LinkedIn — later
              </Button>
            </div>

            <p className="mt-4 text-center text-xs font-semibold text-ink-soft">
              {isSignup ? 'Already have one? ' : 'New here? '}
              <Link
                to={isSignup ? '/login' : '/signup'}
                className="underline decoration-sky-pop decoration-2 underline-offset-2"
              >
                {isSignup ? 'Log in' : 'Create an account'}
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
