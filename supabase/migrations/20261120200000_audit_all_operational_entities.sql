
create or replace function private.audit_business_record()
returns trigger language plpgsql security definer set search_path=''
as $$
declare payload jsonb; actor uuid; org_id uuid; record_id text; label text; event_name text;
begin
  payload:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  actor:=coalesce(
    auth.uid(),
    nullif(payload->>'created_by','')::uuid,
    nullif(payload->>'uploaded_by','')::uuid,
    nullif(payload->>'recorded_by','')::uuid,
    nullif(payload->>'updated_by','')::uuid
  );
  org_id:=nullif(payload->>'organization_id','')::uuid;
  record_id:=coalesce(payload->>'id',payload->>'key','unknown');
  label:=coalesce(payload->>'name',payload->>'title',payload->>'invoice_number',payload->>'asset_tag',payload->>'email',payload->>'key',record_id);
  event_name:=lower(tg_table_name)||'_'||lower(tg_op);
  insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details)
  values(actor,org_id,event_name,tg_table_name,record_id,jsonb_build_object('label',label,'status',payload->>'status'));
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists audit_service_contracts on public.service_contracts;
create trigger audit_service_contracts after insert or update or delete on public.service_contracts for each row execute function private.audit_business_record();
drop trigger if exists audit_assets on public.assets;
create trigger audit_assets after insert or update or delete on public.assets for each row execute function private.audit_business_record();
drop trigger if exists audit_documents on public.documents;
create trigger audit_documents after insert or update or delete on public.documents for each row execute function private.audit_business_record();
drop trigger if exists audit_service_payments on public.service_payments;
create trigger audit_service_payments after insert or update or delete on public.service_payments for each row execute function private.audit_business_record();
drop trigger if exists audit_work_logs on public.work_logs;
create trigger audit_work_logs after insert or update or delete on public.work_logs for each row execute function private.audit_business_record();
drop trigger if exists audit_ai_knowledge_sources on public.ai_knowledge_sources;
create trigger audit_ai_knowledge_sources after insert or update or delete on public.ai_knowledge_sources for each row execute function private.audit_business_record();
drop trigger if exists audit_ai_prompt_versions on public.ai_prompt_versions;
create trigger audit_ai_prompt_versions after insert or update or delete on public.ai_prompt_versions for each row execute function private.audit_business_record();
drop trigger if exists audit_ai_assistant_settings on public.ai_assistant_settings;
create trigger audit_ai_assistant_settings after update on public.ai_assistant_settings for each row execute function private.audit_business_record();
drop trigger if exists audit_automation_rules on public.automation_rules;
create trigger audit_automation_rules after insert or update or delete on public.automation_rules for each row execute function private.audit_business_record();
drop trigger if exists audit_platform_settings on public.platform_settings;
create trigger audit_platform_settings after insert or update or delete on public.platform_settings for each row execute function private.audit_business_record();
