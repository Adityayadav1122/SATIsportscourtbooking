-- ============================================================
-- SATI Sports Hall — schema
-- Run as a single migration.
-- ============================================================

create extension if not exists btree_gist;

-- ------------------------------------------------------------
-- SPORTS (facilities)
-- ------------------------------------------------------------
create table if not exists public.sports (
  id                bigint generated always as identity primary key,
  slug              text not null unique,
  name              text not null,
  icon              text not null,
  description       text not null,
  facilities_count  integer not null default 1,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

alter table public.sports enable row level security;

create policy "sports are publicly read" on public.sports
  for select using (true);

-- ------------------------------------------------------------
-- PROFILES (students, faculty, hall coordinator)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id                       uuid primary key references auth.users(id) on delete cascade,
  full_name                text not null,
  scholar_or_employee_id   text not null,
  email                    text,
  phone                    text,
  department               text,
  year                     text,
  role                     text not null check (role in ('student', 'faculty', 'admin')) default 'student',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint profiles_id_unique unique (role, scholar_or_employee_id)
);

create index if not exists profiles_department_idx on public.profiles (department);

alter table public.profiles enable row level security;

create policy "members read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "admins read all profiles" on public.profiles
  for select using (
    -- JWT-based admin check avoids self-referencing the profiles table
    -- (which would recurse under RLS).
    auth.jwt() ->> 'email' = 'coordinator@faculty.sati.ac.in'
  );

create policy "members insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "members update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-created profile on sign-up (derives fields from the synthetic email).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_id   text;
begin
  v_id := split_part(new.email, '@', 1);
  v_role := case
    when lower(new.email) = 'coordinator@faculty.sati.ac.in' then 'admin'
    when new.email like '%@faculty.sati.ac.in' then 'faculty'
    else 'student'
  end;
  insert into public.profiles (id, full_name, scholar_or_employee_id, email, department, year, phone, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), v_id),
    v_id,
    new.email,
    nullif(new.raw_user_meta_data->>'department', ''),
    nullif(new.raw_user_meta_data->>'year', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    v_role
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Members must never be able to edit role / id / timestamps themselves.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.id                     := old.id;
  new.role                   := old.role;
  new.scholar_or_employee_id := old.scholar_or_employee_id;
  new.created_at             := old.created_at;
  return new;
end;
$$;

drop trigger if exists protect_profiles on public.profiles;
create trigger protect_profiles
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ------------------------------------------------------------
-- BOOKINGS
-- ------------------------------------------------------------
create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  sport_id      bigint not null references public.sports(id),
  booking_date  date not null,
  start_time    time not null,
  end_time      time not null,
  status        text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  created_at    timestamptz not null default now(),
  cancelled_at  timestamptz
);

-- A confirmed booking blocks the facility+date+start-hour for everyone else.
create unique index if not exists bookings_slot_unique
  on public.bookings (sport_id, booking_date, start_time)
  where (status = 'confirmed');

-- A member can never have two confirmed bookings whose times overlap.
alter table public.bookings
  drop constraint if exists bookings_no_overlap_for_user;
alter table public.bookings
  add constraint bookings_no_overlap_for_user
  exclude using gist (
    user_id with =,
    tsrange(booking_date + start_time, booking_date + end_time) with &&
  )
  where (status = 'confirmed');

create index if not exists bookings_user_status_idx on public.bookings (user_id, status);
create index if not exists bookings_date_status_idx on public.bookings (booking_date, status);

alter table public.bookings enable row level security;

-- Members see their own bookings only; admins see everything.
create policy "members read own bookings" on public.bookings
  for select using (auth.uid() = user_id);

create policy "admins read all bookings" on public.bookings
  for select using (
    auth.jwt() ->> 'email' = 'coordinator@faculty.sati.ac.in'
  );

-- No direct INSERT / UPDATE / DELETE policies: all writes go through the
-- security-definer RPCs below so validation cannot be bypassed.

-- ------------------------------------------------------------
-- BOOKING RPCs (transactional, concurrency-safe)
-- ------------------------------------------------------------

create or replace function public.book_slot(
  p_sport_id bigint,
  p_booking_date date,
  p_start_time time
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid := auth.uid();
  v_end_time time;
  v_booking  public.bookings;
  v_now      timestamp := now() at time zone 'Asia/Kolkata';
begin
  if v_user_id is null then
    raise exception 'You must be logged in to book a slot.' using errcode = '28000';
  end if;

  if p_start_time not in ('07:00:00','08:00:00','09:00:00','15:00:00','16:00:00','17:00:00','18:00:00','19:00:00') then
    raise exception 'Please select a valid time slot.' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.sports where id = p_sport_id and active) then
    raise exception 'This facility is not available for booking.' using errcode = 'P0002';
  end if;

  if p_booking_date < v_now::date or p_booking_date > (v_now::date + 1) then
    raise exception 'Bookings are open only for the next 24 hours. Please pick a valid date.'
      using errcode = 'P0003';
  end if;

  v_end_time := p_start_time + interval '1 hour';

  if (p_booking_date + p_start_time)::timestamp <= v_now then
    raise exception 'You cannot book a slot in the past.' using errcode = 'P0004';
  end if;

  if (p_booking_date + p_start_time)::timestamp > v_now + interval '24 hours' then
    raise exception 'This slot is outside the 24-hour booking window. Pick a nearer slot.'
      using errcode = 'P0005';
  end if;

  insert into public.bookings (user_id, sport_id, booking_date, start_time, end_time, status)
  values (v_user_id, p_sport_id, p_booking_date, p_start_time, v_end_time, 'confirmed')
  returning * into v_booking;

  return v_booking;

exception
  when unique_violation then
    raise exception 'This slot has already been booked.' using errcode = '23505';
  when exclusion_violation then
    raise exception 'You already have a booking during this time.' using errcode = '23P01';
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_now     timestamp := now() at time zone 'Asia/Kolkata';
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.' using errcode = '28000';
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id and user_id = auth.uid();

  if v_booking is null then
    raise exception 'Booking not found.' using errcode = 'P0006';
  end if;

  if v_booking.status != 'confirmed' then
    raise exception 'This booking is not active.' using errcode = 'P0007';
  end if;

  if (v_booking.booking_date + v_booking.start_time)::timestamp <= v_now then
    raise exception 'Cannot cancel a booking that has already started.' using errcode = 'P0008';
  end if;

  update public.bookings
  set status = 'cancelled', cancelled_at = now()
  where id = p_booking_id and user_id = auth.uid();
end;
$$;

-- Admin may cancel any confirmed future booking.
create or replace function public.admin_cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  update public.bookings
  set status = 'cancelled', cancelled_at = now()
  where id = p_booking_id and status = 'confirmed';
end;
$$;

-- Mark past confirmed bookings as completed.
create or replace function public.sweep_completed_bookings()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings
  set status = 'completed'
  where status = 'confirmed'
    and (booking_date + start_time)::timestamp <= now() at time zone 'Asia/Kolkata';
end;
$$;

-- Public availability for one date: which facilities are booked when.
-- Reveals only occupancy + whether the slot belongs to the caller.
-- Times are returned as text in HH24:MI so clients never see ":00" seconds.
create or replace function public.get_slot_occupancy(p_date date)
returns table (
  sport_id bigint,
  start_time text,
  end_time text,
  booking_id uuid,
  mine boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select b.sport_id, to_char(b.start_time, 'HH24:MI'), to_char(b.end_time, 'HH24:MI'),
           b.id, (b.user_id = auth.uid())
    from public.bookings b
    where b.booking_date = p_date and b.status = 'confirmed'
    order by b.sport_id, b.start_time;
end;
$$;

-- Admin data: bookings joined with member names.
create or replace function public.admin_get_bookings(
  p_date date default null,
  p_sport_id bigint default null,
  p_role text default null
)
returns table (
  id uuid,
  member_name text,
  member_id text,
  role text,
  sport_id bigint,
  sport_name text,
  booking_date date,
  start_time time,
  end_time time,
  status text,
  created_at timestamptz,
  cancelled_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin') then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  return query
    select b.id, pr.full_name, pr.scholar_or_employee_id, pr.role,
           b.sport_id, s.name, b.booking_date, b.start_time, b.end_time,
           b.status, b.created_at, b.cancelled_at
    from public.bookings b
    join public.profiles pr on pr.id = b.user_id
    join public.sports s on s.id = b.sport_id
    where (p_date is null or b.booking_date = p_date)
      and (p_sport_id is null or b.sport_id = p_sport_id)
      and (p_role is null or pr.role = p_role)
    order by b.booking_date desc, b.start_time desc;
end;
$$;

-- ------------------------------------------------------------
-- Seed facilities (idempotent)
-- ------------------------------------------------------------
insert into public.sports (slug, name, icon, description, facilities_count)
values
  ('badminton', 'Badminton Court',  '🏸', 'Full-size doubles court with proper net and lighting for both singles and doubles play.', 1),
  ('table-tennis', 'Table Tennis Table', '🏓', 'Regulation ITTF-standard table with paddles and quality balls.', 1),
  ('cricket-net', 'Cricket Net',     '🏏', 'Practice net with bowling and batting space plus training stumps.', 1)
on conflict (slug) do nothing;