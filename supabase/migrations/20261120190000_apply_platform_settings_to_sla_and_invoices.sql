
create or replace function private.apply_support_ticket_sla()
returns trigger language plpgsql set search_path=''
as $$
declare sla jsonb; hours integer;
begin
  select value->'sla_hours' into sla from public.platform_settings where key='support';
  hours:=coalesce((sla->>new.priority)::integer,case new.priority when 'urgent' then 4 when 'high' then 24 when 'low' then 120 else 72 end);
  if new.due_at is null then new.due_at:=now()+make_interval(hours=>hours); end if;
  if new.status in ('resolved','closed') then
    new.resolved_at:=coalesce(new.resolved_at,now());
  elsif tg_op='UPDATE' and old.status in ('resolved','closed') then
    new.resolved_at:=null;
  end if;
  new.updated_at:=now();
  return new;
end;
$$;

create or replace function private.assign_service_invoice_number()
returns trigger language plpgsql set search_path=''
as $$
declare prefix text;
begin
  if new.invoice_number is null or btrim(new.invoice_number)='' then
    select coalesce(nullif(value->>'invoice_prefix',''),'BN2') into prefix
      from public.platform_settings where key='billing';
    new.invoice_number:=coalesce(prefix,'BN2') || '-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('public.service_invoice_number_seq')::text,5,'0');
  end if;
  return new;
end;
$$;
