create or replace function private.audit_and_notify_organization()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.audit_logs(actor_id,organization_id,action,entity_type,entity_id,details)
  values(auth.uid(),new.id,'organization_created','organization',new.id::text,jsonb_build_object('name',new.name,'slug',new.slug));
  return new;
end;
$$;