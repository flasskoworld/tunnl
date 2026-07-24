# TUNNL — The Tunnel OS

> An operating system for people who build.
> Fifteen questions. Nine modules. One operating memo.

An SE HQ instrument. The engine reads your position across nine modules
(Leverage, Systems, Strategy, Building, Ownership, Network Effects,
Personal Economy, Tunnel Vision, Invisible Forces), classifies you as
Owner / Operator / Builder / Stuck Optimizer, and generates a personalized
operating memo — verdict, field notes, priority moves, hidden risks.

Scores use a directional 0-92 scale derived from the user's answers,
with Strong, Working, Needs Attention, and Start Here bands.

Design language: ultramarine ink (#2742C7) on paper (#FBF9F3), engraved
editorial serif (Instrument Serif), IBM Plex Mono, ASCII as the digitized
craft layer (the veil, the scorecard bars).

## Stack

- Next.js 16 (App Router), plain CSS — no Tailwind, no UI kit
- Postgres-backed accounts, readings, Plan progress, Tools, and Sprint Reports
- Stripe Checkout and passwordless email sign-in

## Run it

```bash
npm install
cp .env.example .env.local   # add database, email, auth, and Stripe settings
npm run dev                  # http://localhost:3000
```

The diagnostic creates a complete reading with the deterministic engine in
`lib/engine.js`. Starter does not send questionnaire data to an external AI.

### Accounts and Starter checkout

Passwordless sign-in uses Postgres, signed session cookies, and Resend. Copy
`.env.example` to `.env.local`, configure `DATABASE_URL`, `AUTH_SECRET`,
`RESEND_API_KEY`, and `APP_URL`, then run `schema.sql` against the database.
Stripe checkout additionally requires `STRIPE_SECRET_KEY` and
`STRIPE_WEBHOOK_SECRET`.

Email sign-in links are single-use, expire after 15 minutes, and are limited to
three requests per account every 15 minutes.

### Completed sprint outcomes

After Day 14, users can optionally submit an outcome for publication. Submissions
are stored privately in the `sprint_outcomes` Postgres table and are never shown
on the landing page until `permission_to_publish` is true and `approved_at` has
been set by an operator.

Review the queue in Railway's Postgres data view, or run:

```sql
SELECT id, attribution, outcome_text, permission_to_publish, approved_at, created_at
FROM sprint_outcomes
ORDER BY created_at DESC;
```

Approve a genuine outcome:

```sql
UPDATE sprint_outcomes
SET approved_at = now(), updated_at = now()
WHERE id = 'OUTCOME_ID' AND permission_to_publish = true;
```

Remove it from the public landing page without deleting the submission:

```sql
UPDATE sprint_outcomes SET approved_at = NULL, updated_at = now()
WHERE id = 'OUTCOME_ID';
```

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

Deploys after the variables in `.env.example` are set and `schema.sql` has been
applied to Postgres.

## Map

```
app/
  page.js              intro — engraving hero + ASCII veil, module index
  diagnostic/page.js   15-question flow + deterministic scoring and reading
  memo/page.js         operating memo — scorecard, notes, priorities, risks
  signin/page.js       passwordless email-link sign-in
  account/page.js      account and Starter entitlement status
  checkout/page.js     Stripe Starter checkout
  protocol/page.js     paid 14-day action plan
  vault/page.js        paid worksheets
  ledger/page.js       print-ready memo export
  api/workspace/route.js account-owned readings and Starter progress
  globals.css          all design tokens + component styles
components/
  EngravingHero.jsx    fig. 01 — the tunnel
  AsciiVeil.jsx        drifting character field (client, reduced-motion aware)
lib/
  engine.js            modules, questions, scoring, classify, fallbacks
  ascii.js             veil generator + block-character score bars
public/
  tunnl-panorama-stairs-blue.png  the landing engraving
```

## Roadmap (the ladder)

- [x] Free → Starter gate: passwordless auth + Stripe on locked priorities
- [x] Print-ready Ledger export
- [ ] Re-diagnostic deltas — "Ownership +18 since March" (Builder tier retention)
- [ ] Team/community analytics (Operator tier)

— SE HQ
