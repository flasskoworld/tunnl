# TUNNL — The Ladder
### Tier architecture, pricing, and build order · v0.3 draft

**Status:** Draft for review · **Owner:** SE HQ · **Repo home:** `docs/LADDER-SPEC.md`

---

## Problem statement

Builders, creators, and community leaders consume strategy content endlessly but have no instrument that diagnoses *their* position and tells them the next move. TUNNL's free diagnostic solves the diagnosis; without a monetization ladder, it produces insight with no revenue and no reason to return. The cost of shipping without this spec: a viral-capable free tool that leaks 100% of its demand.

## Goals

1. Convert diagnostic demand into revenue with a $49 one-time purchase (Starter) — target: 10 paid Protocols within 30 days of launch (validation gate for everything downstream).
2. Create a recurring free-user habit — target: 30% of free users run a second reading within 45 days.
3. Establish the memo as a shareable artifact — target: measurable referral traffic from shared memo cards.
4. Sequence the build so no tier is constructed before the previous tier has paying evidence.

## Non-goals (v1)

- **No subscription billing.** Builder is "coming soon" — visible, not purchasable. Building recurring infra before one-time purchases are proven is premature.
- **No team/community features.** Sovereign ships only after Builder retention is proven; SE HQ's own Discord will be install #1.
- **No native mobile app.** Web-first; the memo is mobile-responsive.
- **No user accounts in Phase 1a.** Email capture + localStorage carries Free; accounts arrive with Starter payment (Phase 1b) since purchases must persist.
- **No discounting, coupons, or launch-timer mechanics.** Against ladder design principles (below).
- **No refunds.** Final-sale digital product; mitigated by full pre-purchase transparency at checkout.

---

## The Ladder

| Tier | Name | The job it's hired for | Price |
|---|---|---|---|
| Free | **The Reading** | "Tell me where I stand." | $0 |
| Starter | **The Protocol** | "Tell me what to do." | **$49 one-time** |
| Builder | **The Operating System** | "Keep me pointed and honest." | ~$29/mo · *coming soon* |
| Sovereign | **The Board** | "Do this for my people." | ~$149/mo · *future* |

**Core logic:** each tier sells a different job, not more of the same. The ladder mirrors user maturity: diagnosis → prescription → accountability → multiplication. Upgrades deepen the same object (the memo); they never bolt on clutter.

---

## Tier specifications

### Free — The Reading

**Contents**
- Full 15-question diagnostic + loading-screen blocker probe, all 9 modules scored
- Archetype classification + verdict + field notes
- Priority #1 fully open (diagnosis + 3 actions); priorities #2–3 visible but sealed
- **The 30-day re-reading:** diagnostic re-runs unlock every 30 days
- **The archive:** every memo saved as a dated, numbered edition (№ 0001, № 0002…)
- **Topline deltas:** module score changes shown between readings (numbers only — the *why* is paid)
- Shareable memo card (image export of scorecard + verdict, TUNNL-branded)

**The retention loop:** the free product is a mirror the user returns to monthly. Watching a score sit flat across two readings is the upsell — no banner required.

**What Free deliberately withholds:** the plan. Free tells you where you stand and whether you're moving; it never tells you *how* to move beyond priority #1.

**Acceptance criteria**
- [ ] Free user completes diagnostic and receives full scorecard with no crippled UI
- [ ] Re-run is locked with a visible date ("Next reading unlocks Aug 11") — no workaround, no nag
- [ ] Second reading displays per-module deltas (+/-) against the prior edition
- [ ] Memo card exports as an image sized for IG story and feed
- [ ] Priorities #2–3 render sealed with tier label; tapping opens the Starter purchase view

---

### Starter — The Protocol · $49 one-time

**Positioning:** a commissioned report, not a paywall unlock. Starter is a *product*; Builder is a *relationship*. One-time pricing avoids churn theater on a plan people consume once.

**Contents**
- All 3 priorities unlocked: full diagnosis + action sets
- **The 14-Day Protocol:** the plan re-sequenced into a daily calendar of moves (one move per day, checkable), generated from the user's own memo
- **The Vault:** templates mapped module-by-module — positioning one-liner, "enough number" worksheet, kill list, allocation rules, ownership audit
- **The Ledger export:** the complete memo + protocol as a print-styled PDF, numbered and dated
- Protocol regenerates with each new 30-day reading (the purchase covers the account, not one memo)

**Novel mechanic:** the Protocol ships as its own numbered document in the user's archive. Buying it feels like commissioning, not unlocking.

**Acceptance criteria**
- [ ] Purchase (Stripe, single checkout, one price) unlocks priorities #2–3 immediately, in place
- [ ] Protocol renders as a 14-day sequence with per-day check-off, persisted to the account
- [ ] Ledger PDF export matches the ink-on-paper design system
- [ ] A new reading regenerates the Protocol without additional charge
- [ ] Checkout displays exactly what unlocks (preview of sealed content structure) + a final-sale acknowledgment — no refunds, so the buyer sees precisely what they’re buying (chargeback armor)

---

### Builder — The Operating System · ~$29/mo · COMING SOON

Ships only after Starter validation gate (10 paid). Listed in the ladder UI as "coming soon" with a waitlist email capture — the waitlist is itself the demand test.

**Planned contents (spec'd, not built)**
- AI coach with memory of the user's memo + protocol history
- **The Weekly Reading:** one check-in per week — ship / called it / delay of game (Play Clock mechanic: streaks, tier XP)
- Quarterly deep re-diagnostic with full delta analysis (the *why* behind score movement)
- Live 9-module dashboard; field-notes journal the coach reads
- Restraint rule: one weekly touch. No notification spam. Silence is the luxury.

**Retention engine:** accumulated history. After two quarters, churning means deleting your own record.

---

### Sovereign — The Board · ~$149/mo · FUTURE

For community leaders and small teams. Run the diagnostic across a cohort; aggregate heatmap of collective gaps; cohort-level verdict ("your community over-indexes on building, under-owns distribution"); push playbooks to the group; white-label memo artifacts. Chess-native board view — every member a piece, gaps visible by rank.

**Install #1:** SE HQ's own Discord. Customer zero produces the case study before the first sale.

---

## Diagnostic design (locked decisions · audited)

- **15 questions in the flow** (2 context + 13 scored), ~80 seconds tap-only. Friction is felt effort per question, not count.
- **Every module carries ≥2 signals** via dual-weight scoring; Leverage carries four. No module scores off a single crude 3-value read.
- **Destination captured up front** ("Twelve months from now, what must be true?") — the memo aims every priority at the declared win condition. "Haven't defined it" is itself diagnosed.
- **The blocker rides the loading screen** ("what do you believe is holding you back?") — fills the API wait, doesn't count against the 15, and arms the memo's signature move: confronting self-diagnosis with the data ("You said discipline. The board says distribution."). Belief vs. board is the inevitability engine.
- **The closer:** the written-"enough number" question is asked last — the diagnostic ends on its most personal beat, and the next screen is the memo.
- **Pricing: $49 flat** (left-digit effect; no .99 — the design carries the premium signal).

## Upgrade triggers (in-flow, never interruptive)

| From → To | Trigger moment | Mechanic |
|---|---|---|
| Free → Starter | Tapping a sealed priority | Purchase view opens in place |
| Free → Starter | Second reading shows a flat/declining score | One line under the delta: "The number won't move itself. Get the Protocol." |
| Starter → Builder | Day 14 of the Protocol completes | "The Protocol ends. The Operating System doesn't." → waitlist |
| Starter → Builder | Reading #3+ | History depth prompt: coach references what a subscriber would see |
| Builder → Sovereign | User shares/invites, or self-identifies as community leader in context question | Board-view preview seeded with their data |

## Design principles (the Apple translation)

1. **Every tier is complete at its scope.** Free is small, never broken.
2. **Upgrades unlock depth in the same object** — the memo gains layers; nothing bolts on.
3. **The upsell lives at the moment of desire,** inside the flow. No banners, popups, or countdown timers.
4. **Progressive disclosure:** complexity is revealed as the user matures into needing it.
5. **Scarcity with dignity.** One price per tier. No coupons, no fake urgency, no dark patterns.
6. **Silence is the luxury.** Minimum viable touchpoints; one weekly reading at Builder, monthly at Free.

## Build order

**Phase 1a — Free loop (build now)**
Email capture → memo archive with editions → 30-day re-run gate → topline deltas → shareable memo card.
*Exit criteria:* 100 completed readings; ≥25% share or export the memo card.

**Phase 1b — Starter (build immediately after 1a)**
Accounts (payment requires persistence) → Stripe one-time checkout → priorities unlock → 14-Day Protocol generator → Vault → Ledger PDF.
*Exit criteria (the validation gate):* **10 paid Protocols in 30 days.** Below 5 → fix positioning/offer before touching Builder. 10+ → green-light Builder.

**Phase 2 — Builder waitlist + build**
"Coming soon" card with waitlist live at Phase 1b launch (demand signal costs nothing). Build begins only after the gate clears.

**Phase 3 — Sovereign**
After Builder shows 3-month retention. SE HQ Discord as install #1.

## Success metrics

**Leading:** diagnostic completion rate ≥70%; memo-card share rate ≥25%; sealed-priority tap rate (desire signal); Free→Starter conversion ≥3% of completed readings.
**Lagging:** 45-day free return rate ≥30%; Starter refund rate <5%; Builder waitlist ≥100 before build begins.

## Open questions

- **Protocol regeneration limits (product):** unlimited regenerations per reading, or one per 30-day cycle? Recommend one per cycle — scarcity keeps each Protocol weighty.
- **Auth provider (engineering):** Clerk vs. NextAuth for Phase 1b. Non-blocking for 1a.
- **Memo card rendering (engineering):** client-side canvas vs. server-side OG image generation. Server-side scales for sharing.

## Parking lot (good, not now)

Affiliate/referral codes on memo cards · annual Builder pricing · Protocol printed-and-mailed physical edition · TUNNL API for Sovereign installs · localization.

---
*TUNNL — The Tunnel OS · SE HQ*
