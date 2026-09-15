-- 005: Fix ambiguous column reference in admin_get_bookings.
-- The RETURNS TABLE out-params named "id" and "role" collide with the
-- unqualified "id"/"role" in the admin guard subquery, causing 42702.
-- Qualify them with a table alias.

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