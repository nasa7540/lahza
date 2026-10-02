# Lahza | لحظة

Short, interactive journeys that help non-Muslim employees in Saudi Arabia understand the Islamic moments they notice at work. Not a chatbot: sacred texts are only ever shown verbatim from reviewed sources.

Entry for the "AI in the Service of Islamic Content" challenge (Track 3: interactive experiences).

## Status

P0 (setup) — welcome screen in English, Arabic and Urdu, PWA shell, database migration, health endpoint.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in your own keys; never commit them
npm run dev
```

Open http://localhost:3000 (try `/en?c=naqlah`, `/ar`, `/ur`).

## Database

Apply `supabase/migrations/001_init.sql` to a Supabase project (SQL editor or `supabase db push`).

## Stack

Next.js (App Router, TypeScript), Tailwind, next-intl (en / ar / ur), Supabase (Postgres + pgvector), deployed on Vercel with a daily cron on `/api/health`.
