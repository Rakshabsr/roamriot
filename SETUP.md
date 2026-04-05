# RoamRiot — Setup Guide

## Prerequisites
- Node.js 18+ and npm
- A free [Supabase](https://supabase.com) account
- (Optional) A free [Google Cloud](https://console.cloud.google.com) account for YouTube API

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. Once created, go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
4. Under **Authentication → Providers**, make sure **Email** is enabled

---

## 3. Get YouTube API key (optional but recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **YouTube Data API v3**
4. Go to **Credentials → Create Credentials → API Key**
5. Copy the key → `YOUTUBE_API_KEY`

> Without this key, the app uses built-in mock data. Everything works — you just won't get live vlog results.

---

## 4. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
YOUTUBE_API_KEY=your-youtube-api-key-here
```

---

## 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## App flow

```
/ (landing)
  → /trips/new    (3-step wizard: destination → dates → preferences)
  → /trips/preview (itinerary with vlog sources)
  → /login        (sign in)
  → /signup       (create account)
  → /dashboard    (saved trips — requires auth)
```

---

## Adding Instagram & TikTok (future)

- **Instagram**: Requires a Meta Business account and approved app review. Use the [Instagram Graph API](https://developers.facebook.com/docs/instagram-api) to search hashtags (e.g. `#JaipurTravel`).
- **TikTok**: Apply for [TikTok for Developers](https://developers.tiktok.com) access. The Content Posting API can surface videos; parsing captions extracts places similarly to YouTube.
- The extraction logic in `src/lib/youtube/search.ts` (`extractPlacesFromVideo`) is designed to be reused for any platform's video/post data.

---

## Project structure

```
src/
  app/
    page.tsx              — Landing page
    trips/new/page.tsx    — Trip creation wizard
    trips/preview/page.tsx — Itinerary view
    login/page.tsx
    signup/page.tsx
    dashboard/page.tsx
    api/
      trips/generate/     — Itinerary generation endpoint
      youtube/search/     — YouTube search endpoint
  lib/
    types.ts              — Shared TypeScript types
    utils.ts              — Helpers
    supabase/             — Supabase clients
    youtube/search.ts     — YouTube API + place extraction
    itinerary/builder.ts  — Schedule assembly logic
supabase/
  schema.sql              — Database schema + RLS policies
```
