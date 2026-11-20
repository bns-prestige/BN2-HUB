
create table if not exists public.platform_settings(
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text not null default '',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.platform_settings enable row level security;
drop policy if exists platform_settings_admin_select on public.platform_settings;
drop policy if exists platform_settings_admin_insert on public.platform_settings;
drop policy if exists platform_settings_admin_update on public.platform_settings;
drop policy if exists platform_settings_admin_delete on public.platform_settings;
create policy platform_settings_admin_select on public.platform_settings for select to authenticated using ((select private.is_bn2_admin()));
create policy platform_settings_admin_insert on public.platform_settings for insert to authenticated with check ((select private.is_bn2_admin()));
create policy platform_settings_admin_update on public.platform_settings for update to authenticated using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
create policy platform_settings_admin_delete on public.platform_settings for delete to authenticated using ((select private.is_bn2_admin()));
grant select,insert,update,delete on public.platform_settings to authenticated;
insert into public.platform_settings(key,value,description) values
('company_profile','{"display_name":"BN2 Consulting","legal_name":"","vat_number":"","address":"","email":"","phone":"","website":""}'::jsonb,'Identité légale et coordonnées de BN2 Consulting'),
('support','{"support_email":"","default_priority":"normal","sla_hours":{"urgent":4,"high":24,"normal":72,"low":120},"business_hours":"Lundi–Vendredi, 09:00–17:00"}'::jsonb,'Règles de prise en charge et SLA support'),
('billing','{"currency":"EUR","vat_rate":21,"payment_terms_days":30,"invoice_prefix":"BN2"}'::jsonb,'Paramètres de facturation'),
('notifications','{"in_app_enabled":true,"email_enabled":false}'::jsonb,'Canaux de notification'),
('security','{"require_mfa":false,"session_timeout_minutes":480}'::jsonb,'Paramètres de sécurité')
on conflict(key) do nothing;
create or replace function private.touch_platform_settings()
returns trigger language plpgsql set search_path=''
as $$ begin new.updated_at:=now(); return new; end $$;
drop trigger if exists platform_settings_touch on public.platform_settings;
create trigger platform_settings_touch before update on public.platform_settings
for each row execute function private.touch_platform_settings();
