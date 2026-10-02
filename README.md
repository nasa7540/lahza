# Lahza | لحظة

Short, interactive journeys that help non-Muslim employees in Saudi Arabia understand the Islamic moments they notice at work. Not a chatbot: sacred texts are only ever shown verbatim from reviewed sources.

Entry for the "AI in the Service of Islamic Content" challenge (Track 3: interactive experiences).

## Pre-challenge starting version

This repository was created on Oct 2, 2026. Work before Oct 4 (disclosed per the challenge FAQ):

- P0 scaffold: welcome screen in three languages (including a text-size and layout polish pass), `/api/health`, PWA config, the database migration file, and deployment setup.
- Project spec (`CLAUDE.md`) and the visual prototype in `design/`.
- A third-party design-review skill for coding agents in `.agents/` (tooling only, not part of the app).

Spec, design and content were prepared during workshop days (Oct 2–3). Everything else is built during the challenge, Oct 4–6.

The starting version is tagged [`pre-challenge-v0`](https://github.com/nasa7540/lahza/tree/pre-challenge-v0). To see exactly what was built during the challenge, [compare it with `main`](https://github.com/nasa7540/lahza/compare/pre-challenge-v0...main).

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
