create extension if not exists vector;

create table sources (
  id text primary key,                 -- e.g. 'quran-2-183'
  kind text not null check (kind in ('quran','hadith','tafsir','faq','term')),
  text_ar text not null,               -- verbatim
  translations jsonb not null default '{}',  -- {"en":{"text":"..","translator":"King Fahd Complex"},"ur":{...}}
  reference text not null,             -- 'Al-Baqarah 2:183' / 'Sahih al-Bukhari 1899'
  grade text,                          -- hadith grade as stated by the source
  source_url text not null,
  verified boolean not null default false,
  verified_by text,
  verified_at timestamptz,
  content_hash text not null
);

create table journeys (
  id text primary key,                 -- 'ramadan','prayer','friday','eid','team-dinner','inshallah'
  level text not null check (level in ('A','B','C','D')),
  sort int not null,
  unlock_rule jsonb,                   -- e.g. {"type":"date","before_days":3,"event":"ramadan_start"}
  content jsonb not null               -- per-locale: title, scene, options[], reveals{}, tip, etc.
);

create table cards (
  id text primary key,
  journey_id text references journeys(id),
  source_ids text[] not null,
  explanation jsonb not null,          -- {"en":"..","ar":"..","ur":".."}
  generated_by text,                   -- 'allam' | 'qwen' | 'human'
  reviewed boolean not null default false,
  reviewed_by text,
  key_points jsonb not null,           -- [{"id":"kp1","en":"..","ar":"..","ur":".."}]
  misconceptions jsonb not null,       -- [{"id":"m-diet","en":"..",...}]
  question_variants jsonb not null     -- {"en":[5],"ar":[5],"ur":[5]}
);

create table card_embeddings (
  id bigserial primary key,
  card_id text references cards(id),
  journey_id text,
  lang text,
  text text,
  embedding vector(1024)
);
create index on card_embeddings using hnsw (embedding vector_cosine_ops);

create table glossary (
  term_ar text primary key,
  en text not null,
  note text not null,
  source text not null default 'Al-Jamhara dictionary'
);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  company text,
  lang text,
  topic text,
  summary text not null,               -- user-edited
  status text not null default 'new' check (status in ('new','accepted','closed'))
);

create table events (                  -- anonymous, no user id
  id bigserial primary key,
  created_at timestamptz default now(),
  company text,
  lang text,
  journey_id text,
  type text,                           -- 'start','choice','grade','complete','classify'
  choice text,                         -- misconception id picked
  score int,                           -- 1..5
  level text
);

create or replace function match_cards(q vector(1024), k int)
returns table(card_id text, journey_id text, similarity float)
language sql stable as $$
  select card_id, journey_id, 1 - (embedding <=> q) as similarity
  from card_embeddings order by embedding <=> q limit k;
$$;

-- RLS: anyone may insert events and referrals; all reads go through the server (service role bypasses RLS).
alter table sources enable row level security;
alter table journeys enable row level security;
alter table cards enable row level security;
alter table card_embeddings enable row level security;
alter table glossary enable row level security;
alter table referrals enable row level security;
alter table events enable row level security;

create policy "anyone can insert events" on events
  for insert to anon, authenticated with check (true);
create policy "anyone can insert referrals" on referrals
  for insert to anon, authenticated with check (status = 'new');

alter publication supabase_realtime add table referrals;
