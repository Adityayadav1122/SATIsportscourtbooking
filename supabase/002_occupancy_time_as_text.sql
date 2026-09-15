-- 002: Return occupancy slot times as text (HH24:MI) so clients
-- never have to strip ":00" seconds off Postgres `time` values.
drop function if exists public.get_slot_occupancy(date);

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