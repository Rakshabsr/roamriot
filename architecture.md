# RoamRiot — Architecture

## Overview

RoamRiot is a Next.js 14 app using the App Router. It follows a server-component-first pattern with client components only where interactivity is required.

---

## Data flow

```
User fills wizard (client)
  → POST /api/trips/generate (server)
      → claude-builder.ts (Claude AI)
        or youtube fallback if no API key
  → Saves trip to Supabase (server)
  → Stores itinerary in sessionStorage (client)
  → Redirects to /trips/[id] (DB-backed) or /trips/preview (session-only)
```

---

## Key architectural decisions

### Server vs client split at /trips/[id]

`page.tsx` is a server component — it fetches the trip from Supabase, verifies ownership, and redirects unauthenticated users. It passes the trip data as a prop to `TripView.tsx` (client component) which handles all interactivity.

This avoids exposing the Supabase service key on the client while keeping the interactive timeline fully client-side.

### Optimistic UI

All mutations (delete, reorder, add) update local state immediately and persist to Supabase in the background (fire-and-forget). Toast feedback confirms or surfaces errors. This keeps the UI feeling fast without blocking on network calls.

### Drag & drop

Uses `@dnd-kit/sortable` rather than the native HTML5 drag API. Key reasons:
- Works on touch/mobile
- `activationConstraint: { distance: 8 }` prevents accidental drags on tap
- Fixed activities (flights, hotel check-in) are excluded from the sortable context

### itinerary generation strategy

1. If `ANTHROPIC_API_KEY` is set → use `claude-builder.ts` (Claude claude-haiku)
2. If not set → fall back to YouTube Data API v3 + rule-based builder

The Claude prompt requests real place names, proximity-clustered stops, and transport between each stop. The YouTube fallback is generic but functional for demo purposes.

### Analytics

All events are logged server-side via `/api/analytics` POST. The client-side `track()` function in `lib/analytics.ts` is fire-and-forget — analytics never block the user flow or surface errors.

The `analytics_events` table captures:
- `event_type` — what happened
- `user_id` — nullable (anonymous sessions tracked via `session_id`)
- `properties` — JSON blob with event-specific data (destination, budget, etc.)
- `country` / `city` — from Vercel edge headers (approximate geo)

---

## Database schema

```
auth.users (Supabase managed)
  └── trips (user_id FK)
        └── itinerary_days (trip_id FK)
              └── activities (day_id FK)

analytics_events (user_id nullable FK → auth.users)
```

RLS policies ensure users can only read/write their own trips. Analytics insert is open (no user required) but select is restricted to own records.

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (safe for client) |
| `ANTHROPIC_API_KEY` | No | Claude AI for itinerary generation |
| `YOUTUBE_API_KEY` | No | YouTube fallback generator |

---

## Rendering strategy

| Route | Type | Why |
|---|---|---|
| `/` | Client component | Interactive search bar |
| `/dashboard` | Server component | Auth check + DB fetch |
| `/trips/new` | Client component | Multi-step form state |
| `/trips/preview` | Client component | sessionStorage read |
| `/trips/[id]` | Server shell + Client view | Auth + ownership check server-side; timeline interactive |
| `/events` | Client component | sessionStorage + fetch |

---

## What I'd improve with more time

1. **Real-time collaboration** — Supabase Realtime subscriptions so trip edits sync across devices
2. **Offline support** — Cache itinerary in IndexedDB for offline access
3. **Budget tracking** — Expense logging per activity
4. **Native share** — Web Share API for mobile-native share sheets
5. **Travel variant improvements** — More granular prompt tuning per variant
