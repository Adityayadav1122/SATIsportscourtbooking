-- 003: Fix infinite recursion in admin read policies.
-- The old policies self-referenced public.profiles inside profiles RLS,
-- which Postgres rejects ("infinite recursion detected in policy for
-- relation \"profiles\""). Instead, detect the admin via a JWT claim
-- (the coordinator's synthetic email), which never touches the table.

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles
  for select using (
    auth.jwt() ->> 'email' = 'coordinator@faculty.sati.ac.in'
  );

drop policy if exists "admins read all bookings" on public.bookings;
create policy "admins read all bookings" on public.bookings
  for select using (
    auth.jwt() ->> 'email' = 'coordinator@faculty.sati.ac.in'
  );