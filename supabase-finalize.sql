-- Tally: finalized weeks, saved payslips, and entry locking.
-- Run this once in the Supabase SQL Editor AFTER supabase-schema.sql.

create table if not exists public.salary_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  week_start date not null,
  finalized_by uuid references auth.users(id) on delete set null,
  finalized_at timestamptz not null default now(),
  unique (organization_id, week_start)
);

create table if not exists public.salary_statements (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.salary_periods(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sewer_id uuid references auth.users(id) on delete set null,
  sewer_name text not null,
  pieces integer not null default 0,
  total numeric not null default 0,
  lines jsonb not null default '[]'::jsonb
);

create index if not exists salary_statements_period_idx on public.salary_statements(period_id);
create index if not exists salary_statements_sewer_idx on public.salary_statements(organization_id, sewer_id);

alter table public.salary_periods enable row level security;
alter table public.salary_statements enable row level security;

-- Everyone in the organization can see which weeks are finalized.
drop policy if exists "members can view salary periods" on public.salary_periods;
create policy "members can view salary periods"
  on public.salary_periods for select
  using (public.is_organization_member(organization_id));

-- Owners see every payslip. Sewers see only their own (pay only, never prices).
drop policy if exists "owners and sewers can view statements" on public.salary_statements;
create policy "owners and sewers can view statements"
  on public.salary_statements for select
  using (
    public.is_organization_owner(organization_id)
    or (sewer_id = auth.uid() and public.is_organization_member(organization_id))
  );

-- Writes go only through the two functions below (no insert/update/delete policies).

create or replace function public.finalize_week(target_organization uuid, target_week date, statements jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  s jsonb;
begin
  if not public.is_organization_owner(target_organization) then
    raise exception 'Only the organization owner can finalize a week';
  end if;
  if extract(isodow from target_week) <> 1 then
    raise exception 'A week must start on a Monday';
  end if;
  begin
    insert into public.salary_periods (organization_id, week_start, finalized_by)
      values (target_organization, target_week, auth.uid())
      returning id into new_id;
  exception when unique_violation then
    raise exception 'This week is already finalized';
  end;
  for s in select value from jsonb_array_elements(coalesce(statements, '[]'::jsonb)) loop
    insert into public.salary_statements (period_id, organization_id, sewer_id, sewer_name, pieces, total, lines)
    values (
      new_id,
      target_organization,
      nullif(s->>'sewer_id', '')::uuid,
      coalesce(s->>'sewer_name', 'Unknown sewer'),
      coalesce((s->>'pieces')::integer, 0),
      coalesce((s->>'total')::numeric, 0),
      coalesce(s->'lines', '[]'::jsonb)
    );
  end loop;
  return new_id;
end;
$$;

create or replace function public.reopen_week(target_organization uuid, target_week date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_organization_owner(target_organization) then
    raise exception 'Only the organization owner can reopen a week';
  end if;
  delete from public.salary_periods
    where organization_id = target_organization and week_start = target_week;
end;
$$;

revoke all on function public.finalize_week(uuid, date, jsonb) from public;
grant execute on function public.finalize_week(uuid, date, jsonb) to authenticated;
revoke all on function public.reopen_week(uuid, date) from public;
grant execute on function public.reopen_week(uuid, date) to authenticated;

-- Lock: nobody can add, change, or delete entries in a finalized week.
create or replace function public.block_finalized_entries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return case when tg_op = 'DELETE' then old else new end; -- cascades (e.g. deleting an organization)
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    if exists (
      select 1 from public.salary_periods p
      where p.organization_id = old.organization_id
        and p.week_start = date_trunc('week', old.date::date)::date
    ) then
      raise exception 'This week is finalized. Ask the owner to reopen it first.';
    end if;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    if exists (
      select 1 from public.salary_periods p
      where p.organization_id = new.organization_id
        and p.week_start = date_trunc('week', new.date::date)::date
    ) then
      raise exception 'This week is finalized. Ask the owner to reopen it first.';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists entries_block_finalized on public.entries;
create trigger entries_block_finalized
  before insert or update or delete on public.entries
  for each row execute function public.block_finalized_entries();

-- Optional: live updates of finalized weeks across open devices.
do $$
begin
  alter publication supabase_realtime add table public.salary_periods;
exception when duplicate_object then null;
          when undefined_object then null;
end $$;
