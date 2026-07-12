# TUNNL — The Tunnel OS

> An operating system for people who build.
> Seventeen questions. Nine modules. One operating memo.

An SE HQ instrument. The engine reads your position across nine modules
(Leverage, Systems, Strategy, Building, Ownership, Network Effects,
Personal Economy, Tunnel Vision, Invisible Forces), classifies you as
Owner / Operator / Builder / Stuck Optimizer, and generates a personalized
operating memo — verdict, field notes, priority moves, hidden risks.

Design language: ultramarine ink (#2742C7) on paper (#FBF9F3), engraved
editorial serif (Instrument Serif), IBM Plex Mono, ASCII as the digitized
craft layer (the veil, the scorecard bars).

## Stack

- Next.js 14 (App Router), plain CSS — no Tailwind, no UI kit
- Claude API (server-side route, key never reaches the client)
- localStorage for memo persistence (v1)

## Run it

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Get an API key at https://console.anthropic.com — API docs:
https://docs.claude.com/en/api/overview

Without a key the app still works: the diagnostic falls back to the
baseline diagnosis library in `lib/engine.js`.

## Push to GitHub

```bash
git init
git add -A
git commit -m "TUNNL v0.1 — diagnostic engine, memo, ink-on-paper design"
# create an empty repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/tunnl.git
git branch -M main
git push -u origin main
```

Deploys cleanly to Vercel: import the repo, set `ANTHROPIC_API_KEY`
in project environment variables, ship.

## Map

```
app/
  page.js              intro — engraving hero + ASCII veil, module index
  diagnostic/page.js   17-question flow, scoring, calls /api/memo
  memo/page.js         operating memo — scorecard, notes, priorities, risks
  api/memo/route.js    server-side Claude call (x-api-key from env)
  globals.css          all design tokens + component styles
components/
  EngravingHero.jsx    fig. 01 — the tunnel
  AsciiVeil.jsx        drifting character field (client, reduced-motion aware)
lib/
  engine.js            modules, questions, scoring, classify, fallbacks
  ascii.js             veil generator + block-character score bars
public/
  tunnl-arch-blue.png  the engraving, TUNNL ultramarine duotone
```

## Roadmap (the ladder)

- [ ] Free → Starter gate: auth (Clerk/NextAuth) + Stripe on locked priorities
- [ ] Memo export — printed-ledger PDF/PNG, the shareable artifact
- [ ] Re-diagnostic deltas — "Ownership +18 since March" (Builder tier retention)
- [ ] Team/community analytics (Operator tier)

— SE HQ
