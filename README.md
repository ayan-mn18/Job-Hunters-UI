# Job Hunters — UI

Cartoon-styled frontend for Job Hunters. Two jobs to do:

1. **The Hunt** — an automation that reads your resume, scrapes job portals daily,
   scores each posting against your spec, tailors a resume per JD, and applies.
2. **Referrals** — a daily pile of every LinkedIn DM and email asking you for a
   referral, each one with an auto-drafted recommendation you can copy and send.

This repo is **UI only** right now. All data comes from `src/data/mock.ts` and is
meant to be swapped for calls to [Job-Hunters-api](https://github.com/ayan-mn18/Job-Hunters-api).

## Run it

```bash
npm install
npm run dev
```

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

## Demo auth

There is no server, so `src/auth/` fakes it:

- **Any** email and password logs you in — the form only checks both are non-empty.
- Signing up marks the account as not-onboarded, which sends you to `/welcome`.
  Finishing the wizard flips the flag, so you only see it once.
- The session is a single localStorage key (`jobhunters.demo.user`). Onboarding
  answers are stored on it and prefill the Hunt and My Kit pages.
- **Reset demo data** in the avatar menu clears the key and drops you back on the
  landing page — use it to replay the first-run flow.

Route guards live in `src/auth/guards.tsx`: `RequireAuth` protects `/app/*`,
`RequireOnboarding` protects `/welcome`, and `RedirectIfSignedIn` keeps
signed-in users off the landing and auth pages.

When the API arrives, replace the bodies in `AuthProvider` with real calls —
the surface (`signIn`, `signUp`, `signOut`, `completeOnboarding`) should not
need to change.

## Next

- Replace `src/data/mock.ts` with the API client
- Real auth, plus LinkedIn + Gmail OAuth
- Resume upload + parse preview
- Live run log while a hunt is in progress
