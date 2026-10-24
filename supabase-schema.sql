-- Tally organization and role model.
-- Apply this migration in Supabase SQL Editor after the existing tables exist.

create extension if not exists citext;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'sewer')),
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  unique (user_id)
);

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  max_uses integer not null default 25 check (max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists role text check (role in ('owner', 'sewer')),
  add column if not exists active boolean not null default true;

alter table public.entries
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.tally_rates
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.tally_catalog_values
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists entries_organization_date_idx on public.entries(organization_id, date desc);
create index if not exists entries_organization_sewer_idx on public.entries(organization_id, sewer_id);
create index if not exists invites_organization_idx on public.organization_invites(organization_id);
create unique index if not exists tally_rates_organization_key
  on public.tally_rates(organization_id, supplier, item, size);
create unique index if not exists tally_catalog_organization_key
  on public.tally_catalog_values(organization_id, kind, value);

create or replace function public.is_organization_member(target_organization uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization
      and user_id = auth.uid()
      and active
  );
$$;

create or replace function public.is_organization_owner(target_organization uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization
      and user_id = auth.uid()
      and role = 'owner'
      and active
  );
$$;

create or replace function public.create_organization(organization_name text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org public.organizations;
begin
  if auth.uid() is null then raise exception 'You must be signed in'; end if;
  if exists (select 1 from public.organization_members where user_id = auth.uid() and active) then
    raise exception 'You already belong to an organization';
  end if;
  insert into public.organizations (name, created_by)
    values (trim(organization_name), auth.uid())
    returning * into new_org;
  insert into public.organization_members (organization_id, user_id, role)
    values (new_org.id, auth.uid(), 'owner');
  update public.profiles
    set organization_id = new_org.id, role = 'owner', active = true
    where id = auth.uid();
  return new_org;
end;
$$;

create or replace function public.create_organization_invite(target_organization uuid)
returns table (invite_id uuid, invite_token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_token text;
  invite public.organization_invites;
begin
  if not public.is_organization_owner(target_organization) then
    raise exception 'Only the organization owner can create invites';
  end if;
  loop
    raw_token := lpad(floor(random() * 1000000)::bigint::text, 6, '0');
    begin
      insert into public.organization_invites (organization_id, token_hash, created_by)
        values (target_organization, md5(raw_token), auth.uid())
        returning * into invite;
      exit;
    exception when unique_violation then
      -- Retry the rare case where an active code already exists.
    end;
  end loop;
  return query select invite.id, raw_token, invite.expires_at;
end;
$$;

create or replace function public.accept_organization_invite(raw_token text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.organization_invites;
  joined public.organizations;
begin
  if auth.uid() is null then raise exception 'You must be signed in'; end if;
  if exists (select 1 from public.organization_members where user_id = auth.uid() and active) then
    raise exception 'You already belong to an organization';
  end if;
  select i.* into invite
    from public.organization_invites i
    where i.token_hash = md5(regexp_replace(trim(raw_token), '[^0-9]', '', 'g'))
      and i.revoked_at is null
      and i.expires_at > now()
      and i.uses < i.max_uses
    for update;
  if not found then raise exception 'This invite is invalid or expired'; end if;
  insert into public.organization_members (organization_id, user_id, role)
    values (invite.organization_id, auth.uid(), 'sewer');
  update public.organization_invites set uses = uses + 1 where id = invite.id;
  update public.profiles
    set organization_id = invite.organization_id, role = 'sewer', active = true
    where id = auth.uid();
  select * into joined from public.organizations where id = invite.organization_id;
  return joined;
end;
$$;

revoke all on function public.create_organization(text) from public;
grant execute on function public.create_organization(text) to authenticated;
revoke all on function public.create_organization_invite(uuid) from public;
grant execute on function public.create_organization_invite(uuid) to authenticated;
revoke all on function public.accept_organization_invite(text) from public;
grant execute on function public.accept_organization_invite(text) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;
alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.tally_rates enable row level security;
alter table public.tally_catalog_values enable row level security;

drop policy if exists "organization members can view organizations" on public.organizations;
create policy "organization members can view organizations"
  on public.organizations for select
  using (public.is_organization_member(id));

drop policy if exists "authenticated users can create organizations" on public.organizations;
create policy "authenticated users can create organizations"
  on public.organizations for insert
  with check (created_by = auth.uid());

drop policy if exists "owners can update organizations" on public.organizations;
create policy "owners can update organizations"
  on public.organizations for update
  using (public.is_organization_owner(id))
  with check (public.is_organization_owner(id));

drop policy if exists "members can view organization members" on public.organization_members;
create policy "members can view organization members"
  on public.organization_members for select
  using (public.is_organization_member(organization_id));

drop policy if exists "owners can manage organization members" on public.organization_members;
create policy "owners can manage organization members"
  on public.organization_members for all
  using (public.is_organization_owner(organization_id))
  with check (public.is_organization_owner(organization_id));

drop policy if exists "members can view organization invites" on public.organization_invites;
create policy "members can view organization invites"
  on public.organization_invites for select
  using (public.is_organization_owner(organization_id));

drop policy if exists "owners can create organization invites" on public.organization_invites;
create policy "owners can create organization invites"
  on public.organization_invites for insert
  with check (public.is_organization_owner(organization_id) and created_by = auth.uid());

drop policy if exists "owners can revoke organization invites" on public.organization_invites;
create policy "owners can revoke organization invites"
  on public.organization_invites for update
  using (public.is_organization_owner(organization_id))
  with check (public.is_organization_owner(organization_id));

drop policy if exists "members can view profiles in organization" on public.profiles;
create policy "members can view profiles in organization"
  on public.profiles for select
  using (id = auth.uid() or (organization_id is not null and public.is_organization_member(organization_id)));

drop policy if exists "members can view organization entries" on public.entries;
create policy "members can view organization entries"
  on public.entries for select
  using (public.is_organization_member(organization_id) and
    (sewer_id = auth.uid() or exists (
      select 1 from public.organization_members m
      where m.organization_id = entries.organization_id and m.user_id = auth.uid() and m.role = 'owner' and m.active
    )));

drop policy if exists "members can create organization entries" on public.entries;
create policy "members can create organization entries"
  on public.entries for insert
  with check (
    public.is_organization_member(organization_id)
    and created_by = auth.uid()
    and (
      sewer_id = auth.uid()
      or public.is_organization_owner(organization_id)
    )
  );

drop policy if exists "owners can update organization entries" on public.entries;
create policy "owners can update organization entries"
  on public.entries for update
  using (public.is_organization_owner(organization_id))
  with check (public.is_organization_owner(organization_id));

drop policy if exists "owners can delete organization entries" on public.entries;
create policy "owners can delete organization entries"
  on public.entries for delete
  using (public.is_organization_owner(organization_id));

drop policy if exists "members can view organization rates" on public.tally_rates;
create policy "members can view organization rates"
  on public.tally_rates for select
  using (public.is_organization_member(organization_id));

drop policy if exists "owners can manage organization rates" on public.tally_rates;
create policy "owners can manage organization rates"
  on public.tally_rates for all
  using (public.is_organization_owner(organization_id))
  with check (public.is_organization_owner(organization_id));

drop policy if exists "members can view organization catalog" on public.tally_catalog_values;
create policy "members can view organization catalog"
  on public.tally_catalog_values for select
  using (public.is_organization_member(organization_id));

drop policy if exists "owners can manage organization catalog" on public.tally_catalog_values;
create policy "owners can manage organization catalog"
  on public.tally_catalog_values for all
  using (public.is_organization_owner(organization_id))
  with check (public.is_organization_owner(organization_id));
