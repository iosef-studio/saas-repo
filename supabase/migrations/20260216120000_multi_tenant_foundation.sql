create extension if not exists pgcrypto;

create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Meine Organisation',
  created_at timestamptz not null default now()
);

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')) default 'member',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists org_members_user_id_idx on public.org_members (user_id);
create index if not exists org_members_org_id_idx on public.org_members (org_id);

alter table public.orgs enable row level security;
alter table public.org_members enable row level security;

create policy "orgs_select_if_member"
on public.orgs
for select
using (
  exists (
    select 1
    from public.org_members as m
    where m.org_id = orgs.id
      and m.user_id = auth.uid()
  )
);

create policy "orgs_insert_authenticated"
on public.orgs
for insert
to authenticated
with check (auth.uid() is not null);

create policy "org_members_select_own"
on public.org_members
for select
using (user_id = auth.uid());

create policy "org_members_insert_own"
on public.org_members
for insert
to authenticated
with check (user_id = auth.uid());
