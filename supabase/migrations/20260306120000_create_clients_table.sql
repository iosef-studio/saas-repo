-- Clients table for CRM-Light
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  status      text not null default 'new'
              check (status in ('new', 'active', 'completed', 'archived')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Indexes for common query patterns
create index if not exists clients_org_id_idx on public.clients (org_id);
create index if not exists clients_org_id_status_idx on public.clients (org_id, status);

-- Enable RLS
alter table public.clients enable row level security;

-- SELECT: user can read clients belonging to their org
create policy "clients_select_org_member"
on public.clients
for select
to authenticated
using (
  exists (
    select 1
    from public.org_members m
    where m.org_id = clients.org_id
      and m.user_id = auth.uid()
  )
);

-- INSERT: user can create clients for their org
create policy "clients_insert_org_member"
on public.clients
for insert
to authenticated
with check (
  exists (
    select 1
    from public.org_members m
    where m.org_id = clients.org_id
      and m.user_id = auth.uid()
  )
);

-- UPDATE: user can update clients belonging to their org
create policy "clients_update_org_member"
on public.clients
for update
to authenticated
using (
  exists (
    select 1
    from public.org_members m
    where m.org_id = clients.org_id
      and m.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.org_members m
    where m.org_id = clients.org_id
      and m.user_id = auth.uid()
  )
);

-- DELETE: policy exists for completeness (app uses status='archived' as soft delete)
create policy "clients_delete_org_member"
on public.clients
for delete
to authenticated
using (
  exists (
    select 1
    from public.org_members m
    where m.org_id = clients.org_id
      and m.user_id = auth.uid()
  )
);

-- Generic trigger function for auto-updating updated_at (reusable for future tables)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_set_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();
