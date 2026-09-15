-- 004: Promote the coordinator to role 'admin'.
-- handle_new_user only infers student/faculty from the email domain, and the
-- protect_profiles trigger makes role immutable afterwards. Special-case the
-- coordinator e-mail at sign-up, then promote the already-existing row.

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

-- Temporarily suspend the immutability trigger so the existing row can be
-- promoted, then restore it.
drop trigger if exists protect_profiles on public.profiles;
update public.profiles set role = 'admin' where email = 'coordinator@faculty.sati.ac.in';
create trigger protect_profiles
  before update on public.profiles
  for each row execute function public.protect_profile_fields();