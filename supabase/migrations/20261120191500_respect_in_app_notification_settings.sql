
create or replace function private.in_app_notifications_enabled()
returns boolean language sql stable security definer set search_path=''
as $$
  select coalesce((select (value->>'in_app_enabled')::boolean from public.platform_settings where key='notifications'),true);
$$;

create or replace function private.audit_and_notify_ticket()
returns trigger language plpgsql security definer set search_path=''
as $$
declare actor uuid; event_title text; event_body text; event_action text;
begin
 actor:=coalesce(auth.uid(),new.created_by);
 if tg_op='INSERT' then
  event_title:='Nouvelle demande support';event_body:=new.ticket_number || ' · ' || new.title;event_action:='ticket_created';
  insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details) values(actor,new.organization_id,event_action,'support_ticket',new.id::text,jsonb_build_object('title',new.title,'ticket_number',new.ticket_number,'priority',new.priority));
 elsif tg_op='UPDATE' and (old.status is distinct from new.status or old.assigned_to is distinct from new.assigned_to) then
  event_title:='Mise à jour de votre demande';event_body:=new.ticket_number || ' · ' || new.status;event_action:='ticket_status_changed';
  insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details) values(actor,new.organization_id,event_action,'support_ticket',new.id::text,jsonb_build_object('title',new.title,'old_status',old.status,'status',new.status,'assigned_to',new.assigned_to));
 else return new;
 end if;
 if not private.in_app_notifications_enabled() then return new; end if;
 insert into public.notifications(user_id,organization_id,title,body,href)
 select distinct recipient.user_id,new.organization_id,event_title,event_body,recipient.href
 from (
  select om.user_id,'/portal'::text as href from public.organization_members om where om.organization_id=new.organization_id and om.status='active' and om.user_id<>actor
  union
  select sm.user_id,'/staff'::text from public.staff_members sm where sm.employment_status in ('invited','active') and coalesce(sm.permissions->>'tickets.read','false')='true' and sm.user_id<>actor
  union
  select au.id,case when au.raw_app_meta_data->>'role' in ('bn2_owner','bn2_admin') then '/' else '/staff' end from auth.users au where au.raw_app_meta_data->>'role' in ('bn2_owner','bn2_admin') and au.id<>actor
  union
  select new.assigned_to,'/staff'::text where new.assigned_to is not null and new.assigned_to<>actor
 ) recipient where recipient.user_id is not null;
 return new;
end;
$$;

create or replace function private.audit_and_notify_intervention()
returns trigger language plpgsql security definer set search_path=''
as $$
declare actor uuid; event_title text; event_body text; event_action text;
begin
 actor:=auth.uid();
 if tg_op='INSERT' then event_title:='Nouvelle intervention planifiée';event_action:='intervention_created';event_body:=new.title;
 elsif old.status is distinct from new.status then event_title:='Intervention mise à jour';event_action:='intervention_status_changed';event_body:=new.title || ' · ' || new.status;
 else return new; end if;
 insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details) values(actor,new.organization_id,event_action,'intervention',new.id::text,jsonb_build_object('title',new.title,'status',new.status,'assigned_to',new.assigned_to));
 if not private.in_app_notifications_enabled() then return new; end if;
 insert into public.notifications(user_id,organization_id,title,body,href)
 select distinct recipient.user_id,new.organization_id,event_title,event_body,recipient.href
 from (
  select om.user_id,'/portal'::text as href from public.organization_members om where om.organization_id=new.organization_id and om.status='active' and om.user_id<>actor
  union
  select sm.user_id,'/staff'::text from public.staff_members sm where sm.employment_status in ('invited','active') and coalesce(sm.permissions->>'interventions.read','false')='true' and sm.user_id<>actor
  union
  select new.assigned_to,'/staff'::text where new.assigned_to is not null and new.assigned_to<>actor
  union
  select au.id,'/'::text from auth.users au where au.raw_app_meta_data->>'role' in ('bn2_owner','bn2_admin') and au.id<>actor
 ) recipient where recipient.user_id is not null;
 return new;
end;
$$;

create or replace function private.audit_and_notify_invoice()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if tg_op='INSERT' then
  insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details)
  values(coalesce(auth.uid(),new.created_by),new.organization_id,'invoice_created','service_invoice',new.id::text,jsonb_build_object('invoice_number',new.invoice_number,'status',new.status));
 elsif old.status is distinct from new.status then
  insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details)
  values(auth.uid(),new.organization_id,'invoice_status_changed','service_invoice',new.id::text,jsonb_build_object('invoice_number',new.invoice_number,'status',new.status));
  if new.status='issued' and private.in_app_notifications_enabled() then
   insert into public.notifications(user_id,organization_id,title,body,href)
   select om.user_id,new.organization_id,'Nouvelle facture disponible',new.invoice_number || ' · ' || new.total || ' ' || new.currency,'/portal'
   from public.organization_members om where om.organization_id=new.organization_id and om.status='active';
  end if;
 end if;
 return new;
end;
$$;

create or replace function private.notify_public_ticket_message()
returns trigger language plpgsql security definer set search_path=''
as $$
declare actor_role text; ticket_ref text; ticket_title text; recipient record;
begin
 if new.is_internal then return new; end if;
 select raw_app_meta_data->>'role' into actor_role from auth.users where id=new.sender_id;
 select ticket_number,title into ticket_ref,ticket_title from public.support_tickets where id=new.ticket_id;
 insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details)
 values(new.sender_id,new.organization_id,'ticket_message_sent','ticket_message',new.id::text,jsonb_build_object('ticket_number',ticket_ref,'title',ticket_title));
 if not private.in_app_notifications_enabled() then return new; end if;
 if actor_role in ('bn2_owner','bn2_admin','bn2_staff','bn2_agent') then
  for recipient in select om.user_id from public.organization_members om where om.organization_id=new.organization_id and om.status='active' and om.user_id<>new.sender_id loop
   insert into public.notifications(user_id,organization_id,title,body,href) values(recipient.user_id,new.organization_id,'Nouvelle réponse BN2',ticket_ref || ' · ' || ticket_title,'/portal');
  end loop;
 else
  for recipient in
   select sm.user_id from public.staff_members sm where sm.employment_status in ('invited','active') and coalesce(sm.permissions->>'tickets.read','false')='true' and sm.user_id<>new.sender_id
   union
   select au.id from auth.users au where au.raw_app_meta_data->>'role' in ('bn2_owner','bn2_admin') and au.id<>new.sender_id
  loop
   insert into public.notifications(user_id,organization_id,title,body,href) values(recipient.user_id,new.organization_id,'Nouveau message client',ticket_ref || ' · ' || ticket_title,'/staff');
  end loop;
 end if;
 return new;
end;
$$;
