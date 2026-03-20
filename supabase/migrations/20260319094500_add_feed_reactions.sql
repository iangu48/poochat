create table if not exists public.friend_feed_reactions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.poop_entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (char_length(reaction) between 1 and 32),
  created_at timestamptz not null default now(),
  unique (entry_id, user_id)
);

alter table public.friend_feed_reactions
  drop constraint if exists friend_feed_reactions_reaction_check;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'friend_feed_reactions_reaction_len_chk'
      and conrelid = 'public.friend_feed_reactions'::regclass
  ) then
    alter table public.friend_feed_reactions
      add constraint friend_feed_reactions_reaction_len_chk
      check (char_length(reaction) between 1 and 32);
  end if;
end
$$;

create index if not exists friend_feed_reactions_entry_created_idx
  on public.friend_feed_reactions(entry_id, created_at desc);

alter table public.friend_feed_reactions enable row level security;

drop policy if exists friend_feed_reactions_select_visible on public.friend_feed_reactions;
create policy friend_feed_reactions_select_visible
  on public.friend_feed_reactions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.poop_entries e
      join public.profiles p on p.id = e.user_id
      where e.id = public.friend_feed_reactions.entry_id
        and (
          e.user_id = auth.uid()
          or (
            p.share_feed = true
            and exists (
              select 1
              from public.accepted_friend_edges af
              where af.user_id = auth.uid()
                and af.friend_id = e.user_id
            )
          )
        )
    )
  );

drop policy if exists friend_feed_reactions_insert_visible on public.friend_feed_reactions;
create policy friend_feed_reactions_insert_visible
  on public.friend_feed_reactions
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.poop_entries e
      join public.profiles p on p.id = e.user_id
      where e.id = public.friend_feed_reactions.entry_id
        and (
          e.user_id = auth.uid()
          or (
            p.share_feed = true
            and exists (
              select 1
              from public.accepted_friend_edges af
              where af.user_id = auth.uid()
                and af.friend_id = e.user_id
            )
          )
        )
    )
  );

drop policy if exists friend_feed_reactions_update_own on public.friend_feed_reactions;
create policy friend_feed_reactions_update_own
  on public.friend_feed_reactions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists friend_feed_reactions_delete_own on public.friend_feed_reactions;
create policy friend_feed_reactions_delete_own
  on public.friend_feed_reactions
  for delete
  to authenticated
  using (auth.uid() = user_id);
