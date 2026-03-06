-- Fix: The org_members INSERT policy checks orgs.created_by via a subquery,
-- but the orgs SELECT policy requires existing membership — creating a
-- chicken-and-egg deadlock during bootstrap.
--
-- Solution: Allow org creators to SELECT their own org.
-- This is safe because created_by is set to auth.uid() on insert (enforced
-- by RLS) and cannot be changed. A user can only see orgs they created.
create policy "orgs_select_if_creator"
on public.orgs
for select
to authenticated
using (created_by = auth.uid());
