# RoamRiot 🌍

**AI-powered travel itinerary planner** — tell it where you're going, who you're travelling with, and your budget. Get a day-by-day plan with a live map, real transport options, and stops you'll actually want.

> Built by Raksha Balasubramanian as a PM portfolio project to demonstrate product thinking, UX decision-making, and full-stack implementation.

---

## What it does

- **Smart itinerary generation** — AI builds your day plan from real travel content
- **Live map view** — every stop plotted, see clusters and routes at a glance
- **Travel variants** — couple, family, solo female, girls gang, boys gang, senior friendly — tone and picks adapt to who's travelling
- **Diet-aware planning** — veg, Jain, vegan preferences filter every food stop
- **Drag & reorder** — plans change; shuffle stops instantly
- **Airport transfer guide** — Day 1 always shows how to get from airport to hotel
- **Save & revisit** — trips saved to your account, accessible anytime
- **Share your plan** — copy a formatted itinerary to send your group

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + custom palette |
| Database | Supabase (Postgres + Auth + RLS) |
| AI | Anthropic Claude (claude-haiku) |
| Fallback generator | YouTube Data API v3 |
| Maps | Leaflet (dynamic import) |
| Drag & drop | @dnd-kit/sortable |
| Hosting | Vercel |

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/Rakshabsr/roamriot.git
cd roamriot
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `YOUTUBE_API_KEY` | console.cloud.google.com → YouTube Data API v3 |

> If `ANTHROPIC_API_KEY` is not set, the app falls back to the YouTube-based generator.

### 3. Set up the database

Run the SQL migrations in Supabase SQL Editor in order:

1. `supabase/schema.sql` — core tables (trips, itinerary_days, activities)
2. `supabase/migrations/002_analytics.sql` — analytics events table

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── dashboard/                # Saved trips
│   ├── trips/
│   │   ├── new/                  # 5-step trip wizard
│   │   ├── preview/              # Session-based itinerary view
│   │   └── [id]/                 # DB-backed saved trip view
│   ├── events/                   # Local events (coming soon)
│   └── api/
│       ├── trips/generate/       # Itinerary generation endpoint
│       ├── trips/[id]/           # Trip CRUD + reorder
│       └── analytics/            # Usage event logging
├── components/
│   ├── trip/
│   │   ├── ActivityList.tsx      # dnd-kit drag & drop
│   │   └── MapView.tsx           # Leaflet map
│   └── ui/
│       ├── Toast.tsx
│       └── SkeletonCard.tsx
└── lib/
    ├── types.ts                  # All shared TypeScript types
    ├── analytics.ts              # Client-side event tracking
    ├── supabase/                 # Server + client Supabase clients
    ├── itinerary/
    │   └── claude-builder.ts     # Claude AI itinerary generator
    └── youtube/                  # YouTube fallback generator
```

---

## Deployment

The app is deployed on Vercel. Every push to `main` triggers a production deploy.

Set the same environment variables in Vercel → Project → Settings → Environment Variables.

---

## PM notes

See [`insight.md`](insight.md) for product decisions, feature rationale, and what I'd build next.
See [`architecture.md`](architecture.md) for technical design decisions.
