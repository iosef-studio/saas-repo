-- Contracts table for Vertragsmanagement
create table if not exists public.contracts (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  client_id     uuid not null references public.clients(id) on delete cascade,
  title         text not null,
  value         numeric(12,2),
  service_date  date,
  status        text not null default 'draft'
                check (status in ('draft', 'sent', 'signed', 'completed', 'cancelled')),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Indexes for common query patterns
create index if not exists contracts_org_id_idx on public.contracts (org_id);
create index if not exists contracts_org_id_status_idx on public.contracts (org_id, status);
create index if not exists contracts_client_id_idx on public.contracts (client_id);

-- Enable RLS
alter table public.contracts enable row level security;

-- SELECT: user can read contracts belonging to their org
create policy "contracts_select_org_member"
on public.contracts
for select
to authenticated
using (
  exists (
    select 1
    from public.org_members m
    where m.org_id = contracts.org_id
      and m.user_id = auth.uid()
  )
);

-- INSERT: user can create contracts for their org
create policy "contracts_insert_org_member"
on public.contracts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.org_members m
    where m.org_id = contracts.org_id
      and m.user_id = auth.uid()
  )
);

-- UPDATE: user can update contracts belonging to their org
create policy "contracts_update_org_member"
on public.contracts
for update
to authenticated
using (
  exists (
    select 1
    from public.org_members m
    where m.org_id = contracts.org_id
      and m.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.org_members m
    where m.org_id = contracts.org_id
      and m.user_id = auth.uid()
  )
);

-- DELETE: policy exists for completeness (app uses status='cancelled' as soft delete)
create policy "contracts_delete_org_member"
on public.contracts
for delete
to authenticated
using (
  exists (
    select 1
    from public.org_members m
    where m.org_id = contracts.org_id
      and m.user_id = auth.uid()
  )
);

-- Reuse the existing set_updated_at() trigger function from clients migration
create trigger contracts_set_updated_at
  before update on public.contracts
  for each row
  execute function public.set_updated_at();
