-- BN2 HUB production schema snapshot
-- Project: BN2 Consulting / almzypjgccucdkwnpldy
-- Snapshot reflects migrations applied on 2026-11-20. Do not run on another project without review.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create sequence if not exists public.support_ticket_number_seq;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sector text,
  description text,
  contact_email text,
  contact_phone text,
  status text not null default 'onboarding' check (status in ('active','onboarding','suspended','archived')),
  brand_color text not null default '#1686d9',
  enabled_modules jsonb not null default '["dashboard","support","equipment","documents","team"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','agent','member')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  created_at timestamptz not null default now(),
  unique (organization_id,user_id)
);
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default ('BN2-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.support_ticket_number_seq')::text,6,'0')),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null,
  category text not null default 'Autre demande',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'new' check (status in ('new','in_progress','waiting_customer','waiting_bn2','resolved','closed')),
  due_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,organization_id)
);
create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  constraint ticket_messages_ticket_org_fkey foreign key (ticket_id,organization_id)
    references public.support_tickets(id,organization_id) on delete cascade
);
create table if not exists public.interventions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references auth.users(id) on delete set null,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  status text not null default 'planned' check (status in ('planned','confirmed','in_progress','completed','cancelled')),
  location text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.service_contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  plan_name text,
  starts_on date,
  ends_on date,
  included_hours numeric(8,2) not null default 0 check (included_hours >= 0),
  hourly_rate numeric(10,2) check (hourly_rate is null or hourly_rate >= 0),
  status text not null default 'active' check (status in ('draft','active','paused','expired','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contract_id uuid references public.service_contracts(id) on delete set null,
  ticket_id uuid references public.support_tickets(id) on delete set null,
  logged_by uuid not null references auth.users(id),
  description text not null,
  minutes integer not null check (minutes > 0),
  billable boolean not null default true,
  worked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_tag text,
  name text not null,
  category text not null default 'other',
  manufacturer text,
  model text,
  serial_number text,
  assigned_to uuid references auth.users(id) on delete set null,
  purchased_on date,
  warranty_until date,
  status text not null default 'operational' check (status in ('operational','attention','repair','retired')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,asset_tag)
);
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  category text not null default 'other',
  created_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists private.bootstrap_claims (
  id boolean primary key default true check (id),
  token_sha256 text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.owner_bootstrap_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  bootstrap_token text not null
);

create or replace function private.is_bn2_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('bn2_owner','bn2_admin'),false); $$;
create or replace function private.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.organization_members m where m.organization_id=target_org and m.user_id=(select auth.uid()) and m.status='active'); $$;
create or replace function private.is_org_staff(target_org uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.organization_members m where m.organization_id=target_org and m.user_id=(select auth.uid()) and m.status='active' and m.role in ('owner','admin','agent')); $$;
create or replace function private.can_access_org_path(object_name text, staff_only boolean default false)
returns boolean language plpgsql stable security definer set search_path = ''
as $$
declare folder text; org_id uuid;
begin
 folder := (storage.foldername(object_name))[1];
 if folder is null or folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
 org_id := folder::uuid;
 if private.is_bn2_admin() then return true; end if;
 if staff_only then return private.is_org_staff(org_id); end if;
 return private.is_org_member(org_id);
end;
$$;
create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at := now(); return new; end; $$;
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 insert into public.profiles(id,email,full_name) values(new.id,new.email,coalesce(new.raw_user_meta_data ->> 'full_name',''))
 on conflict(id) do update set email=excluded.email;
 return new;
end;
$$;
create or replace function private.handle_initial_owner_claim()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare caller uuid := auth.uid(); expected_hash text;
begin
 if caller is null then raise exception 'Authentication required' using errcode='28000'; end if;
 select token_sha256 into expected_hash from private.bootstrap_claims where id=true and used_at is null for update;
 if expected_hash is null or encode(extensions.digest(new.bootstrap_token,'sha256'),'hex') <> expected_hash then
  raise exception 'Invalid or already used setup token' using errcode='42501';
 end if;
 if (select count(*) from auth.users) <> 1 or not exists(select 1 from auth.users where id=caller) then
  raise exception 'Initial owner setup is only available for the first account' using errcode='42501';
 end if;
 update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||jsonb_build_object('role','bn2_owner') where id=caller;
 update private.bootstrap_claims set used_at=now() where id=true;
 return null;
end;
$$;

revoke all on function private.is_bn2_admin() from public,anon;
revoke all on function private.is_org_member(uuid) from public,anon;
revoke all on function private.is_org_staff(uuid) from public,anon;
revoke all on function private.can_access_org_path(text,boolean) from public,anon;
revoke all on function private.handle_initial_owner_claim() from public,anon,authenticated;
grant execute on function private.is_bn2_admin() to authenticated;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.is_org_staff(uuid) to authenticated;
grant execute on function private.can_access_org_path(text,boolean) to authenticated;

drop trigger if exists on_auth_user_created_bn2 on auth.users;
create trigger on_auth_user_created_bn2 after insert on auth.users for each row execute function private.handle_new_user();
drop trigger if exists before_initial_bn2_owner_claim on public.owner_bootstrap_requests;
create trigger before_initial_bn2_owner_claim before insert on public.owner_bootstrap_requests for each row execute function private.handle_initial_owner_claim();

do $$
declare t text;
begin
 foreach t in array array['profiles','organizations','support_tickets','interventions','service_contracts','assets'] loop
  execute format('drop trigger if exists set_updated_at on public.%I',t);
  execute format('create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()',t);
 end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.interventions enable row level security;
alter table public.service_contracts enable row level security;
alter table public.work_logs enable row level security;
alter table public.assets enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.owner_bootstrap_requests enable row level security;

create policy profiles_read_self_or_admin on public.profiles for select to authenticated using(id=(select auth.uid()) or (select private.is_bn2_admin()));
create policy profiles_update_self_or_admin on public.profiles for update to authenticated using(id=(select auth.uid()) or (select private.is_bn2_admin())) with check(id=(select auth.uid()) or (select private.is_bn2_admin()));
create policy organizations_read_member_or_admin on public.organizations for select to authenticated using((select private.is_bn2_admin()) or (select private.is_org_member(id)));
create policy organizations_admin_insert on public.organizations for insert to authenticated with check((select private.is_bn2_admin()));
create policy organizations_admin_update on public.organizations for update to authenticated using((select private.is_bn2_admin())) with check((select private.is_bn2_admin()));
create policy organizations_admin_delete on public.organizations for delete to authenticated using((select private.is_bn2_admin()));
create policy members_read_self_or_admin on public.organization_members for select to authenticated using(user_id=(select auth.uid()) or (select private.is_bn2_admin()));
create policy members_admin_insert on public.organization_members for insert to authenticated with check((select private.is_bn2_admin()));
create policy members_admin_update on public.organization_members for update to authenticated using((select private.is_bn2_admin())) with check((select private.is_bn2_admin()));
create policy members_admin_delete on public.organization_members for delete to authenticated using((select private.is_bn2_admin()));
create policy tickets_read_org_or_admin on public.support_tickets for select to authenticated using((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)));
create policy tickets_create_org_member on public.support_tickets for insert to authenticated with check(created_by=(select auth.uid()) and (select private.is_org_member(organization_id)));
create policy tickets_update_staff_or_admin on public.support_tickets for update to authenticated using((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id))) with check((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)));
create policy tickets_delete_admin on public.support_tickets for delete to authenticated using((select private.is_bn2_admin()));
create policy messages_read_org_or_admin on public.ticket_messages for select to authenticated using((select private.is_bn2_admin()) or ((select private.is_org_member(organization_id)) and (not is_internal or (select private.is_org_staff(organization_id)))));
create policy messages_create_org_member on public.ticket_messages for insert to authenticated with check(sender_id=(select auth.uid()) and ((select private.is_bn2_admin()) or (is_internal=false and (select private.is_org_member(organization_id)) and exists(select 1 from public.support_tickets t where t.id=ticket_messages.ticket_id and t.organization_id=ticket_messages.organization_id))));
create policy messages_admin_update on public.ticket_messages for update to authenticated using((select private.is_bn2_admin())) with check((select private.is_bn2_admin()));
create policy messages_admin_delete on public.ticket_messages for delete to authenticated using((select private.is_bn2_admin()));
create policy interventions_read_org on public.interventions for select to authenticated using((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)));
create policy interventions_staff_insert on public.interventions for insert to authenticated with check((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)));
create policy interventions_staff_update on public.interventions for update to authenticated using((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id))) with check((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)));
create policy interventions_staff_delete on public.interventions for delete to authenticated using((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)));
create policy contracts_read_org on public.service_contracts for select to authenticated using((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)));
create policy contracts_admin_insert on public.service_contracts for insert to authenticated with check((select private.is_bn2_admin()));
create policy contracts_admin_update on public.service_contracts for update to authenticated using((select private.is_bn2_admin())) with check((select private.is_bn2_admin()));
create policy contracts_admin_delete on public.service_contracts for delete to authenticated using((select private.is_bn2_admin()));
create policy work_logs_read_org on public.work_logs for select to authenticated using((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)));
create policy work_logs_create_staff on public.work_logs for insert to authenticated with check(logged_by=(select auth.uid()) and ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id))));
create policy work_logs_admin_manage on public.work_logs for update to authenticated using((select private.is_bn2_admin())) with check((select private.is_bn2_admin()));
create policy work_logs_admin_delete on public.work_logs for delete to authenticated using((select private.is_bn2_admin()));
create policy assets_read_org on public.assets for select to authenticated using((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)));
create policy assets_staff_insert on public.assets for insert to authenticated with check((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)));
create policy assets_staff_update on public.assets for update to authenticated using((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id))) with check((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)));
create policy assets_staff_delete on public.assets for delete to authenticated using((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)));
create policy documents_read_org on public.documents for select to authenticated using((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)));
create policy documents_staff_insert on public.documents for insert to authenticated with check((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)));
create policy documents_staff_update on public.documents for update to authenticated using((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id))) with check((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)));
create policy documents_staff_delete on public.documents for delete to authenticated using((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)));
create policy notifications_read_recipient on public.notifications for select to authenticated using(user_id=(select auth.uid()) or (select private.is_bn2_admin()));
create policy notifications_update_recipient on public.notifications for update to authenticated using(user_id=(select auth.uid()) or (select private.is_bn2_admin())) with check(user_id=(select auth.uid()) or (select private.is_bn2_admin()));
create policy notifications_admin_insert on public.notifications for insert to authenticated with check((select private.is_bn2_admin()));
create policy audit_logs_admin_read on public.audit_logs for select to authenticated using((select private.is_bn2_admin()));
create policy owner_bootstrap_authenticated_insert on public.owner_bootstrap_requests for insert to authenticated with check((select auth.uid()) is not null);

revoke update on public.profiles from authenticated;
grant update(full_name,phone,avatar_url) on public.profiles to authenticated;
grant select,insert,update,delete on public.organizations,public.organization_members,public.support_tickets,public.ticket_messages,public.interventions,public.service_contracts,public.work_logs,public.assets,public.documents to authenticated;
grant select on public.profiles to authenticated;
grant update(full_name,phone,avatar_url) on public.profiles to authenticated;
grant select,insert,update on public.notifications to authenticated;
grant select on public.audit_logs to authenticated;
grant insert on public.owner_bootstrap_requests to authenticated;
grant usage,select on sequence public.support_ticket_number_seq to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('bn2-private','bn2-private',false,20971520,array['application/pdf','image/jpeg','image/png','image/webp','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy bn2_private_select on storage.objects for select to authenticated using(bucket_id='bn2-private' and (select private.can_access_org_path(name,false)));
create policy bn2_private_insert on storage.objects for insert to authenticated with check(bucket_id='bn2-private' and (select private.can_access_org_path(name,true)));
create policy bn2_private_update on storage.objects for update to authenticated using(bucket_id='bn2-private' and (select private.can_access_org_path(name,true))) with check(bucket_id='bn2-private' and (select private.can_access_org_path(name,true)));
create policy bn2_private_delete on storage.objects for delete to authenticated using(bucket_id='bn2-private' and (select private.can_access_org_path(name,true)));

create index if not exists organization_members_user_idx on public.organization_members(user_id,status);
create index if not exists tickets_org_created_idx on public.support_tickets(organization_id,created_at desc);
create index if not exists tickets_status_idx on public.support_tickets(status,priority);
create index if not exists ticket_messages_ticket_idx on public.ticket_messages(ticket_id,created_at);
create index if not exists ticket_messages_ticket_org_idx on public.ticket_messages(ticket_id,organization_id);
create index if not exists interventions_org_schedule_idx on public.interventions(organization_id,scheduled_start);
create index if not exists work_logs_org_date_idx on public.work_logs(organization_id,worked_at desc);
create index if not exists assets_org_status_idx on public.assets(organization_id,status);
create index if not exists documents_org_date_idx on public.documents(organization_id,created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications(user_id,created_at desc) where read_at is null;
create index if not exists organization_members_user_fk_idx on public.organization_members(user_id);
create index if not exists tickets_created_by_idx on public.support_tickets(created_by);
create index if not exists tickets_assigned_to_idx on public.support_tickets(assigned_to);
create index if not exists messages_org_idx on public.ticket_messages(organization_id);
create index if not exists messages_sender_idx on public.ticket_messages(sender_id);
create index if not exists interventions_assigned_to_idx on public.interventions(assigned_to);
create index if not exists interventions_created_by_idx on public.interventions(created_by);
create index if not exists contracts_org_idx on public.service_contracts(organization_id);
create index if not exists work_logs_contract_idx on public.work_logs(contract_id);
create index if not exists work_logs_ticket_idx on public.work_logs(ticket_id);
create index if not exists work_logs_user_idx on public.work_logs(logged_by);
create index if not exists assets_assigned_to_idx on public.assets(assigned_to);
create index if not exists documents_uploaded_by_idx on public.documents(uploaded_by);
create index if not exists notifications_org_idx on public.notifications(organization_id);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id);
create index if not exists audit_logs_org_idx on public.audit_logs(organization_id);
