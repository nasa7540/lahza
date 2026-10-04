# Lahza | لحظة

Short, interactive journeys that help non-Muslim employees in Saudi Arabia understand the Islamic moments they notice at work. Not a chatbot: sacred texts are only ever shown verbatim from reviewed sources.

Entry for the "AI in the Service of Islamic Content" challenge (Track 3: interactive experiences).

## Pre-challenge starting version

This repository was created on Oct 2, 2026. The challenge build days are Oct 4–6. The tag [`pre-challenge-v0`](https://github.com/nasa7540/lahza/tree/pre-challenge-v0) marks the last commit before the challenge; [compare it with `main`](https://github.com/nasa7540/lahza/compare/pre-challenge-v0...main) to see what was built during it.

**In the repository before Oct 4:** the P0 scaffold (welcome screen in three languages, `/api/health`, PWA config, the first migration file, deployment setup), the project spec (`CLAUDE.md`), the visual prototype in `design/`, and a third-party design-review skill for coding agents in `.agents/` (tooling only).

**Prepared outside the repository on Oct 2–3, added as-is under [`docs/pre-challenge/`](docs/pre-challenge) in the first commit of Oct 4:** a hand-written draft of the six journeys, measurement scripts and reports for the AI path (routing, grading, prompt injection), three experimental versions of the journey factory in Python with their prompts and outputs, the topic-guard prompt and rules, the list of occasions, automated test sets (planted errors for the verifier, calendar, guard, Qur'an retrieval) and the plan and decision log.

So the design of the pipeline, its prompts and its test cases were tried before the challenge started. What is built during the challenge is the product itself: all application code beyond the scaffold, including the factory re-implemented in TypeScript.

The full list, including what is deliberately not in the repository (keys, the Qur'an QA 2023 data, a machine-translated sample), the third-party models and data used, and known limits, is in [`docs/DISCLOSURE.md`](docs/DISCLOSURE.md) (Arabic).

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
