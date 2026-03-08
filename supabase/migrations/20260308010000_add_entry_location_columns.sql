-- Add location support to poop entries for Home map pins.
alter table public.poop_entries
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_source text check (location_source in ('gps', 'manual'));

-- Keep location coords paired: both null or both present.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'poop_entries_lat_long_pair_chk'
      and conrelid = 'public.poop_entries'::regclass
  ) then
    alter table public.poop_entries
      add constraint poop_entries_lat_long_pair_chk
      check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null));
  end if;
end
$$;

create index if not exists poop_entries_location_idx
  on public.poop_entries(latitude, longitude)
  where latitude is not null and longitude is not null;
