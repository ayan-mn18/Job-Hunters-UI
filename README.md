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

| Route        | Page             | What it is                                            |
| ------------ | ---------------- | ----------------------------------------------------- |
| `/`          | Den              | Home dashboard — daily progress, recent applies, feed |
| `/hunt`      | The Hunt         | Automation controls, spec, resume, portal toggles     |
| `/jobs`      | Applications     | Every application sent, with status + match score     |
| `/referrals` | Referrals        | Day-by-day referral requests and generated drafts     |
| `/profile`   | My Kit           | Every detail a job form ever asks for                 |

## Next

- Replace `src/data/mock.ts` with the API client
- Auth (LinkedIn + Gmail OAuth)
- Resume upload + parse preview
- Live run log while a hunt is in progress
