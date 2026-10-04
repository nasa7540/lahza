-- Journey factory drafts, reviewer decisions, and the Qur'an verse index used by the factory's research step.

create table journey_drafts (
  id uuid primary key default gen_random_uuid(),
  journey_id text not null,                     -- e.g. 'ramadan'
  topic text not null,
  status text not null check (status in ('draft','incomplete','failed')),
  needs_sharii boolean not null default false,  -- shown only after a real sharia reviewer approves
  draft jsonb not null,                         -- lib/content/types.ts draftSchema
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index journey_drafts_journey_idx on journey_drafts (journey_id, created_at desc);

create table review_decisions (
  id bigserial primary key,
  draft_id uuid not null references journey_drafts(id) on delete cascade,
  lang text not null check (lang in ('ar','en','ur')),
  unit_id text not null,                        -- one reviewable piece of text, e.g. 'scene', 'reveal:a:0'
  role text not null check (role in ('team','sharia')),
  action text not null check (action in ('approve','reject','edit','comment')),
  reviewer text not null,
  text_hash text not null,                      -- sha256 of the text the decision was made on
  note text,
  created_at timestamptz not null default now()
);
create index review_decisions_draft_idx on review_decisions (draft_id, lang, unit_id, created_at desc);

create table quran_verses (
  sura int not null,
  aya int not null,
  text_uthmani text not null,                   -- verbatim from quranenc.com, shown to users
  text_norm text not null,                      -- normalised spelling, for search only
  en text not null,                             -- Rowwad translation, verbatim
  ur text not null,                             -- Junagarhi translation, verbatim
  translation_versions jsonb not null,
  embedding vector(1024),
  primary key (sura, aya)
);
create index quran_verses_embedding_idx on quran_verses using hnsw (embedding vector_cosine_ops);

create or replace function match_verses(q vector(1024), k int)
returns table(sura int, aya int, text_uthmani text, en text, similarity float)
language sql stable as $$
  select sura, aya, text_uthmani, en, 1 - (embedding <=> q) as similarity
  from quran_verses where embedding is not null order by embedding <=> q limit k;
$$;

-- "Something else" answers and unanswered questions: anonymous text, clustered in code.
alter table events add column text text;
alter table events add column embedding vector(1024);

-- No public access: drafts, decisions and the verse index are read and written by the server only.
alter table journey_drafts enable row level security;
alter table review_decisions enable row level security;
alter table quran_verses enable row level security;
