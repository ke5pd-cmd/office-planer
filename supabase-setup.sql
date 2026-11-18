-- Spusti celý skript v Supabase: SQL Editor -> New query -> Run.

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists team_members_name_lower_unique
  on public.team_members (lower(trim(name)));

create table if not exists public.office_attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.team_members(id) on delete cascade,
  day date not null,
  status text not null check (status in ('coming', 'away', 'unsure')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint office_attendance_member_day_unique unique (member_id, day)
);

alter table public.team_members enable row level security;
alter table public.office_attendance enable row level security;

-- K údajom sa dostanú iba používatelia, ktorí sa prihlásili cez Supabase Auth.
-- Všetci prihlásení členovia tímu môžu čítať a upravovať spoločný plán.
drop policy if exists "Authenticated users can manage team members" on public.team_members;
create policy "Authenticated users can manage team members"
  on public.team_members for all to authenticated
  using (true) with check (true);

drop policy if exists "Authenticated users can manage office attendance" on public.office_attendance;
create policy "Authenticated users can manage office attendance"
  on public.office_attendance for all to authenticated
  using (true) with check (true);

grant select, insert, update, delete on public.team_members to authenticated;
grant select, insert, update, delete on public.office_attendance to authenticated;
