
create or replace function private.audit_and_notify_ticket()
returns trigger language plpgsql security definer set search_path=''
as $$
declare actor uuid; event_title text; event_body text; event_action text;
begin
  actor := coalesce(auth.uid(),new.created_by);
  if tg_op='INSERT' then
    event_title := 'Nouvelle demande support';
    event_body := new.ticket_number || ' · ' || new.title;
    event_action := 'ticket_created';
    insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details)
    values(actor,new.organization_id,event_action,'support_ticket',new.id::text,jsonb_build_object('title',new.title,'ticket_number',new.ticket_number,'priority',new.priority));
  elsif tg_op='UPDATE' and (old.status is distinct from new.status or old.assigned_to is distinct from new.assigned_to) then
    event_title := 'Mise à jour de votre demande';
    event_body := new.ticket_number || ' · ' || new.status;
    event_action := 'ticket_status_changed';
    insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details)
    values(actor,new.organization_id,event_action,'support_ticket',new.id::text,jsonb_build_object('title',new.title,'old_status',old.status,'status',new.status,'assigned_to',new.assigned_to));
  else
    return new;
  end if;

  insert into public.notifications(user_id,organization_id,title,body,href)
  select distinct recipient.user_id,new.organization_id,event_title,event_body,recipient.href
  from (
    select om.user_id, '/portal'::text as href
      from public.organization_members om
      where om.organization_id=new.organization_id and om.status='active' and om.user_id<>actor
    union
    select sm.user_id, '/staff'::text
      from public.staff_members sm
      where sm.employment_status in ('invited','active')
        and coalesce(sm.permissions->>'tickets.read','false')='true'
        and sm.user_id<>actor
    union
    select au.id,
      case when au.raw_app_meta_data->>'role' in ('bn2_owner','bn2_admin') then '/' else '/staff' end
      from auth.users au
      where au.raw_app_meta_data->>'role' in ('bn2_owner','bn2_admin')
        and au.id<>actor
    union
    select new.assigned_to, '/staff'::text where new.assigned_to is not null and new.assigned_to<>actor
  ) recipient
  where recipient.user_id is not null;
  return new;
end;
$$;
drop trigger if exists support_ticket_audit_notify on public.support_tickets;
create trigger support_ticket_audit_notify after insert or update of status,assigned_to on public.support_tickets
for each row execute function private.audit_and_notify_ticket();

create or replace function private.audit_and_notify_organization()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details)
  values(coalesce(auth.uid(),new.created_by),new.id,'organization_created','organization',new.id::text,jsonb_build_object('name',new.name,'slug',new.slug));
  return new;
end;
$$;
drop trigger if exists organization_audit_after_insert on public.organizations;
create trigger organization_audit_after_insert after insert on public.organizations
for each row execute function private.audit_and_notify_organization();

create or replace function private.audit_and_notify_intervention()
returns trigger language plpgsql security definer set search_path=''
as $$
declare actor uuid; event_title text; event_body text; event_action text;
begin
  actor:=auth.uid();
  if tg_op='INSERT' then
    event_title:='Nouvelle intervention planifiée';
    event_action:='intervention_created';
    event_body:=new.title;
  elsif old.status is distinct from new.status then
    event_title:='Intervention mise à jour';
    event_action:='intervention_status_changed';
    event_body:=new.title || ' · ' || new.status;
  else return new;
  end if;
  insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details)
  values(actor,new.organization_id,event_action,'intervention',new.id::text,jsonb_build_object('title',new.title,'status',new.status,'assigned_to',new.assigned_to));
  insert into public.notifications(user_id,organization_id,title,body,href)
  select distinct recipient.user_id,new.organization_id,event_title,event_body,recipient.href
  from (
    select om.user_id,'/portal'::text as href from public.organization_members om
      where om.organization_id=new.organization_id and om.status='active' and om.user_id<>actor
    union
    select sm.user_id,'/staff'::text from public.staff_members sm
      where sm.employment_status in ('invited','active') and coalesce(sm.permissions->>'interventions.read','false')='true' and sm.user_id<>actor
    union
    select new.assigned_to,'/staff'::text where new.assigned_to is not null and new.assigned_to<>actor
    union
    select au.id,'/'::text from auth.users au where au.raw_app_meta_data->>'role' in ('bn2_owner','bn2_admin') and au.id<>actor
  ) recipient
  where recipient.user_id is not null;
  return new;
end;
$$;
drop trigger if exists intervention_audit_notify on public.interventions;
create trigger intervention_audit_notify after insert or update of status on public.interventions
for each row execute function private.audit_and_notify_intervention();

create or replace function private.audit_and_notify_invoice()
returns trigger language plpgsql security definer set search_path=''
as $$
declare actor uuid;
begin
  if tg_op='INSERT' then
    insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details)
    values(coalesce(auth.uid(),new.created_by),new.organization_id,'invoice_created','service_invoice',new.id::text,jsonb_build_object('invoice_number',new.invoice_number,'status',new.status));
  elsif old.status is distinct from new.status then
    insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details)
    values(auth.uid(),new.organization_id,'invoice_status_changed','service_invoice',new.id::text,jsonb_build_object('invoice_number',new.invoice_number,'status',new.status));
    if new.status='issued' then
      insert into public.notifications(user_id,organization_id,title,body,href)
      select om.user_id,new.organization_id,'Nouvelle facture disponible',new.invoice_number || ' · ' || new.total || ' ' || new.currency,'/portal'
      from public.organization_members om
      where om.organization_id=new.organization_id and om.status='active';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists invoice_audit_notify on public.service_invoices;
create trigger invoice_audit_notify after insert or update of status on public.service_invoices
for each row execute function private.audit_and_notify_invoice();
