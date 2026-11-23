create table if not exists public.employee_time_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_target_minutes integer not null default 0 check (weekly_target_minutes >= 0),
  weekly_max_minutes integer not null default 0 check (weekly_max_minutes >= 0),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  constraint employee_time_weekly_limit_check check (weekly_max_minutes = 0 or weekly_max_minutes >= weekly_target_minutes)
);
create table if not exists public.employee_time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_date date not null,
  start_time time not null,
  end_time time not null,
  break_minutes integer not null default 0 check (break_minutes >= 0),
  worked_minutes integer not null check (worked_minutes > 0),
  note text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists employee_time_entries_user_date_idx on public.employee_time_entries(user_id, work_date);
create table if not exists public.employee_overtime_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  minutes integer not null check (minutes > 0),
  approved_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(user_id, week_start)
);
create table if not exists public.employee_recovery_leave (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  leave_date date not null,
  minutes integer not null check (minutes > 0),
  note text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists employee_recovery_leave_user_date_idx on public.employee_recovery_leave(user_id, leave_date);
alter table public.employee_time_settings enable row level security;
alter table public.employee_time_entries enable row level security;
alter table public.employee_overtime_credits enable row level security;
alter table public.employee_recovery_leave enable row level security;
grant select, insert, update, delete on public.employee_time_settings to authenticated;
grant select, insert, update, delete on public.employee_time_entries to authenticated;
grant select, insert, update, delete on public.employee_overtime_credits to authenticated;
grant select, insert, update, delete on public.employee_recovery_leave to authenticated;
drop policy if exists employee_time_settings_admin_all on public.employee_time_settings;
create policy employee_time_settings_admin_all on public.employee_time_settings for all to authenticated using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
drop policy if exists employee_time_entries_admin_all on public.employee_time_entries;
create policy employee_time_entries_admin_all on public.employee_time_entries for all to authenticated using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
drop policy if exists employee_overtime_credits_admin_all on public.employee_overtime_credits;
create policy employee_overtime_credits_admin_all on public.employee_overtime_credits for all to authenticated using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
drop policy if exists employee_recovery_leave_admin_all on public.employee_recovery_leave;
create policy employee_recovery_leave_admin_all on public.employee_recovery_leave for all to authenticated using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));