# Job Hunters — UI

Cartoon-styled frontend for Job Hunters. Two jobs to do:

1. **The Hunt** — an automation that reads your resume, scrapes job portals daily,
   scores each posting against your spec, tailors a resume per JD, and applies.
2. **Referrals** — a daily pile of every LinkedIn DM and email asking you for a
   referral, each one with an auto-drafted recommendation you can copy and send.

The UI talks to [Job-Hunters-api](https://github.com/ayan-mn18/Job-Hunters-api) for
everything — auth, dashboard, hunt spec, applications, referrals, kit. All calls go
through one client in `src/lib/api.ts`.

## Run it

```bash
npm install
npm run dev   # serves on http://localhost:6000
```

`.env` holds one variable: `VITE_API_URL=http://localhost:6060`, where the API
listens. Start the API first (its README covers that), then this dev server.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (theme tokens in `src/index.css`)
- React Router

## Design language

Sticker-book / neo-cartoon: 3px black outlines, hard offset shadows with no blur,
fat rounded corners, springy hover. Palette is yellow-first, white second, and
blue used sparingly as the single accent that draws the eye.

Fonts: Fredoka (display) + Nunito (body).

Reusable pieces live in `src/components/ui.tsx` — `Button`, `Card`, `Chip`,
`Stat`, `Progress`, `Field`, `Input`, `Toggle`, `Empty`. The `.toon` /
`.toon-sm` / `.toon-lift` classes in `src/index.css` carry the whole look.

Hunty, the mascot, is inline SVG in `src/components/Mascot.tsx` with four moods:
`happy`, `hunting`, `sleepy`, `proud`.

## Routes

| Route            | Page         | What it is                                            |
| ---------------- | ------------ | ----------------------------------------------------- |
| `/`              | Landing      | Marketing page — hero, features, how it works         |
| `/login`         | Auth         | Log in                                                |
| `/signup`        | Auth         | Create account                                        |
| `/welcome`       | Onboarding   | Six-step first-run setup, only shown once             |
| `/app`           | Den          | Home dashboard — daily progress, recent applies, feed |
| `/app/hunt`      | The Hunt     | Automation controls, spec, resume, portal toggles     |
| `/app/jobs`      | Applications | Every application sent, with status + match score     |
| `/app/referrals` | Referrals    | Day-by-day referral requests and generated drafts     |
| `/app/profile`   | My Kit       | Every detail a job form ever asks for                 |

## Auth

Real accounts, backed by the API:

- `POST /auth/signup` and `/auth/login` return an access token (15 min) plus a
  refresh token (30 days); both live in localStorage.
- On boot the `AuthProvider` validates the stored token with `GET /me`. Any 401,
  anywhere, triggers one silent `POST /auth/refresh` and the request is retried;
  if the refresh token is dead too, the session is dropped and the guards route
  to `/login`.
- Signing up marks the account as not-onboarded, which sends you to `/welcome`.
  Finishing the wizard posts `POST /me/onboarding` and flips the flag.
- A seeded demo account exists for poking around: `demo@jobhunters.test` /
  `hunty-demo-2026` (see the API's seed script).

Route guards live in `src/auth/guards.tsx`: `RequireAuth` protects `/app/*`,
`RequireOnboarding` protects `/welcome`, and `RedirectIfSignedIn` keeps
signed-in users off the landing and auth pages.

## Next

- LinkedIn + Gmail OAuth
- Live run log while a hunt is in progress (the hunt worker is stubbed API-side)
- Resume parse preview once the real parser lands
