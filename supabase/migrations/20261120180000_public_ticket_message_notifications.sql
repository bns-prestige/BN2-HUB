
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
  if actor_role in ('bn2_owner','bn2_admin','bn2_staff','bn2_agent') then
    for recipient in select om.user_id from public.organization_members om where om.organization_id=new.organization_id and om.status='active' and om.user_id<>new.sender_id loop
      insert into public.notifications(user_id,organization_id,title,body,href)
      values(recipient.user_id,new.organization_id,'Nouvelle réponse BN2',ticket_ref || ' · ' || ticket_title,'/portal');
    end loop;
  else
    for recipient in
      select sm.user_id from public.staff_members sm
      where sm.employment_status in ('invited','active') and coalesce(sm.permissions->>'tickets.read','false')='true' and sm.user_id<>new.sender_id
      union
      select au.id from auth.users au where au.raw_app_meta_data->>'role' in ('bn2_owner','bn2_admin') and au.id<>new.sender_id
    loop
      insert into public.notifications(user_id,organization_id,title,body,href)
      values(recipient.user_id,new.organization_id,'Nouveau message client',ticket_ref || ' · ' || ticket_title,'/staff');
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists ticket_message_notify_after_insert on public.ticket_messages;
create trigger ticket_message_notify_after_insert after insert on public.ticket_messages
for each row execute function private.notify_public_ticket_message();
