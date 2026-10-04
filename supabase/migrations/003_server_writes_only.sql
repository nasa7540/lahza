-- Every write now goes through the server with the service key (/api/event, /api/classify, /api/grade and the
-- referral route), so the public key needs no insert rights at all.
drop policy if exists "anyone can insert events" on events;
drop policy if exists "anyone can insert referrals" on referrals;

-- The dashboard reads referrals on the server; nothing subscribes to them from a browser.
do $$
begin
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'referrals') then
    alter publication supabase_realtime drop table referrals;
  end if;
end $$;
