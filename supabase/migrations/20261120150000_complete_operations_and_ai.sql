
-- BN2 HUB: operational, workforce, billing and AI knowledge foundation
alter table public.organizations
  add column if not exists legal_name text,
  add column if not exists vat_number text,
  add column if not exists website text,
  add column if not exists address_line1 text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists country text default 'Belgique',
  add column if not exists billing_email text,
  add column if not exists billing_address jsonb not null default '{}'::jsonb,
  add column if not exists internal_notes text,
  add column if not exists external_reference text;

alter table public.interventions
  add column if not exists ticket_id uuid references public.support_tickets(id) on delete set null,
  add column if not exists actual_start timestamptz,
  add column if not exists actual_end timestamptz,
  add column if not exists duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  add column if not exists resolution text,
  add column if not exists customer_notes text,
  add column if not exists customer_approved_at timestamptz;

alter table public.service_contracts
  add column if not exists contract_number text,
  add column if not exists currency text not null default 'EUR',
  add column if not exists billing_frequency text not null default 'monthly' check (billing_frequency in ('monthly','quarterly','yearly','one_time','custom')),
  add column if not exists monthly_price numeric(10,2) check (monthly_price is null or monthly_price >= 0),
  add column if not exists auto_renew boolean not null default false,
  add column if not exists renewal_notice_days integer not null default 30 check (renewal_notice_days >= 0),
  add column if not exists support_sla_hours integer check (support_sla_hours is null or support_sla_hours > 0),
  add column if not exists services jsonb not null default '[]'::jsonb;

alter table public.assets
  add column if not exists hostname text,
  add column if not exists operating_system text,
  add column if not exists ip_address inet,
  add column if not exists mac_address macaddr,
  add column if not exists purchase_cost numeric(10,2) check (purchase_cost is null or purchase_cost >= 0),
  add column if not exists license_expires_on date;

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  employee_number text unique,
  department text not null default 'Support IT',
  job_title text not null default 'Technicien IT',
  employment_status text not null default 'invited' check (employment_status in ('invited','active','on_leave','suspended','terminated')),
  manager_id uuid references auth.users(id) on delete set null,
  permissions jsonb not null default '{"tickets.read":true,"tickets.manage":true,"interventions.read":true,"interventions.manage":true}'::jsonb,
  started_on date,
  ended_on date,
  internal_phone text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_assistant_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  model_slug text not null default 'vmc/bn2-assistant',
  system_instructions text not null default 'Tu es BN2 Assistant, l’assistant informatique de BN2 Consulting. Réponds en français, de façon claire, utile et professionnelle. Utilise uniquement les informations fournies par BN2 et le contexte autorisé du client. Si une information manque, pose une question ou indique clairement que tu dois vérifier auprès de BN2. Ne prétends jamais avoir effectué une action qui n’a pas été exécutée.',
  tone text not null default 'professionnel, clair, humain',
  temperature numeric(3,2) not null default 0.3 check (temperature between 0 and 2),
  max_output_tokens integer not null default 1200 check (max_output_tokens between 128 and 8192),
  require_human_approval boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.ai_assistant_settings(id) values(true) on conflict(id) do nothing;

create table if not exists public.ai_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  version integer generated always as identity unique,
  model_slug text not null,
  system_instructions text not null,
  changelog text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  content text not null,
  source_type text not null default 'manual' check (source_type in ('manual','document','url','faq','procedure')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  tags text[] not null default '{}',
  version integer not null default 1 check (version > 0),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nouvelle conversation',
  channel text not null default 'portal' check (channel in ('portal','admin','internal')),
  status text not null default 'open' check (status in ('open','closed','escalated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  model_slug text,
  prompt_version integer,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  feedback text check (feedback is null or feedback in ('helpful','not_helpful')),
  created_at timestamptz not null default now()
);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  trigger_event text not null,
  conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  is_enabled boolean not null default false,
  requires_approval boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references public.automation_rules(id) on delete set null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled','needs_approval')),
  trigger_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.service_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  contract_id uuid references public.service_contracts(id) on delete set null,
  invoice_number text not null unique,
  status text not null default 'draft' check (status in ('draft','issued','partially_paid','paid','overdue','void')),
  currency text not null default 'EUR',
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  tax_total numeric(12,2) not null default 0 check (tax_total >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  notes text,
  pdf_storage_path text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.service_invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  tax_rate numeric(5,2) not null default 21 check (tax_rate between 0 and 100),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.service_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.service_invoices(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'EUR',
  method text not null check (method in ('bank_transfer','card','cash','direct_debit','other')),
  status text not null default 'pending' check (status in ('pending','succeeded','failed','refunded')),
  reference text,
  paid_at timestamptz,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function private.is_bn2_staff()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('bn2_owner','bn2_admin','bn2_staff','bn2_agent'),false); $$;

revoke all on function private.is_bn2_staff() from public,anon;
grant execute on function private.is_bn2_staff() to authenticated;

alter table public.staff_members enable row level security;
alter table public.ai_assistant_settings enable row level security;
alter table public.ai_prompt_versions enable row level security;
alter table public.ai_knowledge_sources enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.automation_rules enable row level security;
alter table public.automation_runs enable row level security;
alter table public.service_invoices enable row level security;
alter table public.service_invoice_items enable row level security;
alter table public.service_payments enable row level security;

create policy staff_read_self_or_admin on public.staff_members for select to authenticated
  using (user_id=(select auth.uid()) or (select private.is_bn2_admin()));
create policy staff_admin_manage on public.staff_members for all to authenticated
  using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));

create policy ai_settings_admin_manage on public.ai_assistant_settings for all to authenticated
  using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
create policy ai_prompts_admin_manage on public.ai_prompt_versions for all to authenticated
  using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
create policy ai_knowledge_read_published on public.ai_knowledge_sources for select to authenticated
  using ((select private.is_bn2_admin()) or (status='published' and (organization_id is null or (select private.is_org_member(organization_id)))));
create policy ai_knowledge_admin_manage on public.ai_knowledge_sources for all to authenticated
  using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));

create policy ai_conversations_read_owner_or_admin on public.ai_conversations for select to authenticated
  using (user_id=(select auth.uid()) or (select private.is_bn2_admin()));
create policy ai_conversations_create_owner on public.ai_conversations for insert to authenticated
  with check (user_id=(select auth.uid()) and ((organization_id is null and (select private.is_bn2_admin())) or (organization_id is not null and (select private.is_org_member(organization_id)))));
create policy ai_conversations_update_owner_or_admin on public.ai_conversations for update to authenticated
  using (user_id=(select auth.uid()) or (select private.is_bn2_admin()))
  with check (user_id=(select auth.uid()) or (select private.is_bn2_admin()));
create policy ai_messages_read_owner_or_admin on public.ai_messages for select to authenticated
  using ((select private.is_bn2_admin()) or exists(select 1 from public.ai_conversations c where c.id=conversation_id and c.user_id=(select auth.uid())));
create policy ai_messages_insert_user_only on public.ai_messages for insert to authenticated
  with check (role='user' and user_id=(select auth.uid()) and exists(select 1 from public.ai_conversations c where c.id=conversation_id and c.user_id=(select auth.uid())));
create policy ai_messages_feedback_owner on public.ai_messages for update to authenticated
  using (user_id=(select auth.uid()) and role='assistant')
  with check (user_id=(select auth.uid()) and role='assistant');

create policy automation_rules_admin_manage on public.automation_rules for all to authenticated
  using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
create policy automation_runs_admin_manage on public.automation_runs for all to authenticated
  using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));

create policy invoices_read_org_or_admin on public.service_invoices for select to authenticated
  using ((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)));
create policy invoices_admin_manage on public.service_invoices for all to authenticated
  using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
create policy invoice_items_read_org_or_admin on public.service_invoice_items for select to authenticated
  using ((select private.is_bn2_admin()) or exists(select 1 from public.service_invoices i where i.id=invoice_id and (select private.is_org_member(i.organization_id))));
create policy invoice_items_admin_manage on public.service_invoice_items for all to authenticated
  using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
create policy payments_read_org_or_admin on public.service_payments for select to authenticated
  using ((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)));
create policy payments_admin_manage on public.service_payments for all to authenticated
  using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));

grant select,insert,update,delete on public.staff_members,public.ai_assistant_settings,public.ai_prompt_versions,public.ai_knowledge_sources,public.ai_conversations,public.ai_messages,public.automation_rules,public.automation_runs,public.service_invoices,public.service_invoice_items,public.service_payments to authenticated;
grant usage,select on all sequences in schema public to authenticated;

do $$
declare t text;
begin
 foreach t in array array['staff_members','ai_assistant_settings','ai_knowledge_sources','ai_conversations','automation_rules','service_invoices'] loop
  execute format('drop trigger if exists set_updated_at on public.%I',t);
  execute format('create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()',t);
 end loop;
end;
$$;

create index if not exists staff_members_status_idx on public.staff_members(employment_status,department);
create index if not exists ai_knowledge_scope_status_idx on public.ai_knowledge_sources(organization_id,status);
create index if not exists ai_conversations_user_updated_idx on public.ai_conversations(user_id,updated_at desc);
create index if not exists ai_messages_conversation_created_idx on public.ai_messages(conversation_id,created_at);
create index if not exists automation_runs_status_created_idx on public.automation_runs(status,created_at desc);
create index if not exists invoices_org_issue_idx on public.service_invoices(organization_id,issue_date desc);
create index if not exists invoice_items_invoice_idx on public.service_invoice_items(invoice_id);
create index if not exists payments_org_date_idx on public.service_payments(organization_id,created_at desc);
