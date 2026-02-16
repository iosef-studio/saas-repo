alter table public.orgs
add column if not exists created_by uuid default auth.uid();

update public.orgs as o
set created_by = m.user_id
from public.org_members as m
where m.org_id = o.id
  and m.role = 'owner'
  and o.created_by is null;

alter table public.orgs
alter column created_by set not null;

alter table public.orgs
alter column created_by set default auth.uid();

drop policy if exists "orgs_insert_authenticated" on public.orgs;

create policy "orgs_insert_authenticated"
on public.orgs
for insert
to authenticated
with check (
  auth.uid() is not null
  and created_by = auth.uid()
);

drop policy if exists "org_members_insert_own" on public.org_members;

drop policy if exists "org_members_insert_owner_or_org_creator" on public.org_members;

create policy "org_members_insert_owner_or_org_creator"
on public.org_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    exists (
      select 1
      from public.orgs as o
      where o.id = org_members.org_id
        and o.created_by = auth.uid()
    )
    or exists (
      select 1
      from public.org_members as m
      where m.org_id = org_members.org_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
);
