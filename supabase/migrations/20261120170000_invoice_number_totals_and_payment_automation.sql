
create sequence if not exists public.service_invoice_number_seq start 1;
create or replace function private.assign_service_invoice_number()
returns trigger language plpgsql set search_path=''
as $$
begin
  if new.invoice_number is null or btrim(new.invoice_number)='' then
    new.invoice_number := 'BN2-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('public.service_invoice_number_seq')::text,5,'0');
  end if;
  return new;
end;
$$;
drop trigger if exists service_invoice_number_before_insert on public.service_invoices;
create trigger service_invoice_number_before_insert before insert on public.service_invoices
for each row execute function private.assign_service_invoice_number();

create or replace function private.calculate_service_invoice_item()
returns trigger language plpgsql set search_path=''
as $$
begin
  new.line_total := round(new.quantity * new.unit_price * (1 + new.tax_rate / 100),2);
  return new;
end;
$$;
drop trigger if exists service_invoice_item_calculate_before on public.service_invoice_items;
create trigger service_invoice_item_calculate_before before insert or update on public.service_invoice_items
for each row execute function private.calculate_service_invoice_item();

create or replace function private.refresh_service_invoice_totals()
returns trigger language plpgsql security definer set search_path=''
as $$
declare target_id uuid; old_subtotal numeric; old_tax numeric;
begin
  if tg_op='DELETE' then target_id:=old.invoice_id; else target_id:=new.invoice_id; end if;
  if tg_op='UPDATE' and old.invoice_id is distinct from new.invoice_id then
    select coalesce(sum(quantity*unit_price),0),coalesce(sum(line_total-quantity*unit_price),0)
      into old_subtotal,old_tax from public.service_invoice_items where invoice_id=old.invoice_id;
    update public.service_invoices set subtotal=old_subtotal,tax_total=old_tax,total=old_subtotal+old_tax,updated_at=now() where id=old.invoice_id;
  end if;
  select coalesce(sum(quantity*unit_price),0),coalesce(sum(line_total-quantity*unit_price),0)
    into old_subtotal,old_tax from public.service_invoice_items where invoice_id=target_id;
  update public.service_invoices set subtotal=old_subtotal,tax_total=old_tax,total=old_subtotal+old_tax,updated_at=now() where id=target_id;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
drop trigger if exists service_invoice_item_totals_after on public.service_invoice_items;
create trigger service_invoice_item_totals_after after insert or update or delete on public.service_invoice_items
for each row execute function private.refresh_service_invoice_totals();

create or replace function private.refresh_service_invoice_payment_status()
returns trigger language plpgsql security definer set search_path=''
as $$
declare target_id uuid; paid_total numeric; invoice_total numeric; current_status text; due date;
begin
  if tg_op='DELETE' then target_id:=old.invoice_id; else target_id:=new.invoice_id; end if;
  select total,status,due_date into invoice_total,current_status,due
    from public.service_invoices where id=target_id;
  select coalesce(sum(amount),0) into paid_total
    from public.service_payments where invoice_id=target_id and status='succeeded';
  if current_status not in ('draft','cancelled') then
    update public.service_invoices
      set status=case when invoice_total>0 and paid_total>=invoice_total then 'paid'
                      when due is not null and due<current_date then 'overdue'
                      else 'issued' end,
          updated_at=now()
      where id=target_id;
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
drop trigger if exists service_payment_status_after on public.service_payments;
create trigger service_payment_status_after after insert or update or delete on public.service_payments
for each row execute function private.refresh_service_invoice_payment_status();

do $$
begin
  if not exists(select 1 from pg_constraint where conname='service_invoice_items_quantity_positive') then
    alter table public.service_invoice_items add constraint service_invoice_items_quantity_positive check(quantity>0);
  end if;
  if not exists(select 1 from pg_constraint where conname='service_invoice_items_unit_price_nonnegative') then
    alter table public.service_invoice_items add constraint service_invoice_items_unit_price_nonnegative check(unit_price>=0);
  end if;
  if not exists(select 1 from pg_constraint where conname='service_invoice_items_tax_rate_range') then
    alter table public.service_invoice_items add constraint service_invoice_items_tax_rate_range check(tax_rate>=0 and tax_rate<=100);
  end if;
  if not exists(select 1 from pg_constraint where conname='service_payments_amount_positive') then
    alter table public.service_payments add constraint service_payments_amount_positive check(amount>0);
  end if;
end $$;
