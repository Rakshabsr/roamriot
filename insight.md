# RoamRiot — Product Insight Log

A running record of product decisions, user feedback, and what the data tells us.

---

## Why this product exists

Travel planning is fragmented. You jump between Google Maps, travel blogs, YouTube vlogs, WhatsApp groups, and booking sites — then somehow stitch it all into a day plan. RoamRiot collapses that into one flow: tell us where you're going and who you're travelling with, get a day-by-day itinerary that accounts for proximity, transport, food preferences, and group dynamics.

---

## Core product bets

### Bet 1: Travel variant over generic "style"

Old approach: a "travel style" picker (backpacker / comfort / luxury) that only changed budget assumptions.

New approach: **travel variant** — couple, girls gang, boys gang, solo female, solo male, family, senior friendly. The entire itinerary tone, activity selection, and time-of-day scheduling changes based on who's actually travelling. A girls gang trip to Bali looks nothing like a senior couple's trip to Bali.

**Why this matters for PMs**: Persona-driven design. The user isn't just choosing a budget — they're telling us their context, safety considerations, interests, and pace.

### Bet 2: Itinerary as narrative, not a calendar

Old output: a list of places with time slots (8am: X, 10am: Y).

Target output: "Start at Amber Fort — give it 2 hours. Since you're already in the old city, walk 10 minutes west to Hawa Mahal. Grab breakfast at Laxmi Mishthan Bhandar nearby (locals swear by the kachori). Then take an auto to Jantar Mantar (~₹80, 15 min)."

This is harder to generate but 10x more useful. It's what a local friend would tell you.

### Bet 3: Last day awareness

If you book a 7-day trip, Day 7 should wrap up by mid-afternoon and end with:
> "Head to the airport by 4pm — take Metro Line 2 from X station (₹40, 35 min)"

Generic itinerary tools don't know which day is your last. RoamRiot does.

---

## Features cut and why

| Feature | Status | Reason |
|---|---|---|
| Edit activity inline | Removed | Added complexity for edge-case need. Delete + re-add is fast enough for MVP. |
| Day summary card | Removed | Visually cluttered; showed data (total stops, est. spend) that wasn't verified. Noise > signal. |
| Budget tracker | Not built yet | Typed but not UI'd — premature. Validate that users actually track expenses first. |
| Real-time collaboration | Not built | Scope too large for MVP. Share-by-clipboard covers 80% of the group use case. |
| Offline map download | Not built | Requires PWA setup + large scope. Listed as future. |

---

## Analytics: what we're measuring

Every meaningful user action is logged to `analytics_events`:

| Event | What it tells us |
|---|---|
| `trip_generated` | Which destinations are most planned; budget/variant distribution |
| `page_view` | Where users go after generating; drop-off points |
| `itinerary_viewed` | How long users spend on their plan |
| `destination_searched` | Demand signal — what places users want that may not be well-supported |
| `share_clicked` | Viral coefficient proxy — are users sharing? |
| `activity_deleted` | Which stops users reject — quality signal |
| `activity_added` | Users adding their own stops — engagement signal |
| `signup_completed` | Conversion from anonymous to registered |
| Repeat `trip_generated` by same `user_id` | Retention proxy |

### Questions the data should answer (v1)

1. What % of users who generate an itinerary complete all 5 wizard steps vs drop off?
2. Which step has the highest drop-off rate?
3. Which destinations are most searched but produce lowest-quality itineraries?
4. What's the most common travel variant selected?
5. Do users who share their trip return to plan another one?

---

## Known product gaps (next sprint)

1. **Itinerary accuracy** — without Anthropic credits, the YouTube fallback produces generic/fake place names for non-popular destinations. Solution: Claude integration is built, needs credits.
2. **Events page** — shows "coming soon" for non-Seoul destinations until AI integration is live.
3. **Share experience** — currently clipboard-only. Should be a proper share modal (WhatsApp, download, copy link) with a formatted card.
4. **Travel variants** — picker is designed, not yet wired into the wizard form.
5. **Mobile responsiveness** — itinerary split-panel needs responsive layout testing.

---

## What I'd prioritise next

**P0 — fixes that unlock the core value prop:**
- Wire travel variant into wizard + Claude prompt
- Fix share to be a proper share modal

**P1 — quality improvements:**
- Narrative itinerary generation (proximity + transport between stops)
- Last-day airport return logic

**P2 — growth:**
- Analytics dashboard in admin
- Email on trip generation (engagement hook)
- SEO landing pages per destination

**P3 — retention:**
- Trip notifications ("Your Bali trip is 3 days away!")
- Budget tracking
- Collaborative editing
