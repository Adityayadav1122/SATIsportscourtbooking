-- Cancel confirmed bookings left behind by E2E test users to keep
-- the seed state clean (booking wizard slots reopen).
update public.bookings
set status = 'cancelled', cancelled_at = now()
where status = 'confirmed'
  and user_id in (
    select id from public.profiles
    where scholar_or_employee_id like '21e2e%'
       or scholar_or_employee_id like '21c1a%'
       or scholar_or_employee_id like '21c2b%'
  );