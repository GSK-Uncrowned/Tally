-- Tally: lets a new user confirm their own display name right after signing up.
-- Run once in the Supabase SQL Editor. (The app first tries a normal update of
-- the user's own profile; this function is the fallback if row-level security blocks that.)

create or replace function public.set_profile_name(new_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in';
  end if;
  if char_length(trim(new_name)) < 2 or char_length(trim(new_name)) > 80 then
    raise exception 'Enter your name (2 to 80 characters)';
  end if;
  update public.profiles
    set name = regexp_replace(trim(new_name), '\s+', ' ', 'g')
    where id = auth.uid();
end;
$$;

revoke all on function public.set_profile_name(text) from public;
grant execute on function public.set_profile_name(text) to authenticated;
