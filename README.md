# Lahza | لحظة

Short, interactive journeys that help non-Muslim employees in Saudi Arabia understand the Islamic moments they notice at work. Not a chatbot: sacred texts are only ever shown verbatim from reviewed sources.

Entry for the "AI in the Service of Islamic Content" challenge (Track 3: interactive experiences).

## Pre-challenge starting version

This repository was created on Oct 2, 2026. The challenge build days are Oct 4–6. The tag [`pre-challenge-v0`](https://github.com/nasa7540/lahza/tree/pre-challenge-v0) marks the last commit before the challenge; [compare it with `main`](https://github.com/nasa7540/lahza/compare/pre-challenge-v0...main) to see what was built during it.

**In the repository before Oct 4:** the P0 scaffold (welcome screen in three languages, `/api/health`, PWA config, the first migration file, deployment setup), the project spec (`CLAUDE.md`), the visual prototype in `design/`, and a third-party design-review skill for coding agents in `.agents/` (tooling only).

**Prepared outside the repository on Oct 2–3, added as-is under [`docs/pre-challenge/`](docs/pre-challenge) in the first commit of Oct 4:** a hand-written draft of the six journeys, measurement scripts and reports for the AI path (routing, grading, prompt injection), three experimental versions of the journey factory in Python with their prompts and outputs, the topic-guard prompt and rules, the list of occasions, automated test sets (planted errors for the verifier, calendar, guard, Qur'an retrieval) and the plan and decision log.

So the design of the pipeline, its prompts and its test cases were tried before the challenge started. What is built during the challenge is the product itself: all application code beyond the scaffold, including the factory re-implemented in TypeScript.

The full list, including what is deliberately not in the repository (keys, the Qur'an QA 2023 data, a machine-translated sample), the third-party models and data used, and known limits, is in [`docs/DISCLOSURE.md`](docs/DISCLOSURE.md) (Arabic).

## What it does

- **Six short journeys** (Ramadan, prayer times, Friday, Eid, a team dinner abroad, "Inshallah"). Each one: a workplace scene, four common misreadings plus "something else", a reveal with the source shown verbatim, "explain it in your words", and a tip for the workday.
- **Ordered by the calendar.** Journeys tied to an occasion surface when it is near (Umm al-Qura calendar, Riyadh time). Add `?date=2027-02-15` to the home URL to simulate a date.
- **"Noticed something else?"** A free question is routed to a journey, to an honest "we have no verified answer", or to a human specialist. It is never answered by the model.
- **A review panel** (`/review`) where a person approves, rejects or edits every unit of text before anyone sees it, and a **company dashboard** (`/dashboard`) with counts only.
- **`/eval`**: the results of the automatic tests as they came out, including the ones that did not go well.

## How the AI is kept on a leash

1. **No model-written text reaches a reader before a person approves it.** The runtime endpoints (`/api/classify`, `/api/grade`) answer with ids, enums and positions only; the model's reasoning stays in the server log. A check (`npm run check:invariants`) enforces this on every endpoint.
2. **The model never writes a verse or a hadith.** It proposes references; code fetches the text verbatim from the organiser's platforms (quranenc.com, hadeethenc.com, terminologyenc.com) with their approved translations, and stores a hash.
3. **Sources first.** The factory extracts facts from the fetched sources, the writer writes only from those facts, and a verifier from a different model family checks every sentence against a source segment. Unsupported sentences are removed by the verifier's verdict; code checks only flag.
4. **Approval is bound to the text.** Each unit of text is approved against its hash, per language and per role. Editing a sentence returns it to unapproved. Journeys approved by the project team alone carry the badge "approved by the project team, awaiting sharia review"; topics marked sensitive are not shown until a sharia reviewer approves them.
5. **Rulings go to people.** Personal rulings and disputed matters are routed to a specialist form whose summary comes from a fixed template and the user's own words.

## Models and data

| Use | Model or source | Notes |
|---|---|---|
| Factory writer | `anthropic/claude-opus-5.5` | via OpenRouter; recorded in each draft's `generated_by` |
| Factory verifier | `qwen/qwen3.7-plus` | a different family from the writer |
| Runtime classifier and grader | `qwen/qwen3.7-flash`, fallback `qwen/qwen3.7-plus` | hedged request: fallback after 4 s, 12 s cap |
| Embeddings | `baai/bge-m3` (1024 dims) | Qur'an verse index and example questions, in Supabase pgvector |
| Test data generation and judging | `google/gemini-2.5-flash` | outside the product |
| Coding assistant | Claude Code | used throughout; commits are co-authored accordingly |

Model names come from environment variables. Text sources, their licences and how each is used are in [`SOURCES.md`](SOURCES.md).

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in your own keys; never commit them
npm run dev
```

Apply the SQL files in `supabase/migrations/` in order. Then:

```bash
npm run index:quran      # 6236 verses from quranenc.com, with embeddings (resumable)
npm run index:terms      # titles of terminologyenc.com
npm run factory -- --all # writes one draft per topic in content/topics.json
npm run embed:cards      # example questions for the free-question search
```

Open `http://localhost:3000/review` (in `next dev` the passcode falls back to a development value) and approve a draft, or use `npm run approve -- --draft ramadan --lang ar --name "<name>"`. Nothing appears on the home screen until a draft is approved; `next dev` previews unapproved drafts with a red tag.

## Checks

```bash
npm run typecheck && npm run lint && npm run build
npm run check:db && npm run check:index && npm run check:font && npm run check:when
npm run check:factory:all && npm run check:guard
npm run check:approve && npm run check:review && npm run check:referral
npm run check:classify && npm run check:grader
npm run check:stress -- classify && npm run check:stress -- grade
npm run check:invariants
npm run test:e2e
npm run eval             # collects the results for /eval
```

## Known limits

- The translations are taken as published by the organiser's platforms; the team did not review them independently.
- No sharia reviewer has approved the journeys yet: they are shown with the badge, on the project team's approval.
- The topic guard misses sensitive topics when they are described as plain workplace scenes (35 of 100 in the generated set). The factory therefore runs on the six fixed topics only; an open-topic guard is on the roadmap.
- The grader is strict: an explanation worded far from the key point may not be credited.
- The routing questions were seen while designing; unseen questions from real employees are still to be measured.
- Umm al-Qura is a calculated calendar; the actual start of Ramadan and Eid follows moon sighting and can differ by a day.
- The per-IP request limit is in memory, per server instance.

## Stack

Next.js (App Router, TypeScript), Tailwind, next-intl (en / ar / ur), Supabase (Postgres + pgvector), deployed on Vercel with a daily cron on `/api/health`.
