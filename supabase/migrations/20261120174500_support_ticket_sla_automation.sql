create or replace function private.apply_support_ticket_sla()
returns trigger language plpgsql set search_path=''
as $$
begin
  if new.due_at is null then
    new.due_at := now() + case new.priority
      when 'urgent' then interval '4 hours'
      when 'high' then interval '1 day'
      when 'low' then interval '5 days'
      else interval '3 days'
    end;
  end if;
  if new.status in ('resolved','closed') then
    new.resolved_at := coalesce(new.resolved_at,now());
  elsif tg_op='UPDATE' and old.status in ('resolved','closed') then
    new.resolved_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists support_ticket_sla_before_write on public.support_tickets;
create trigger support_ticket_sla_before_write before insert or update on public.support_tickets
for each row execute function private.apply_support_ticket_sla();