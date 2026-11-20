
create or replace function private.is_bn2_staff()
returns boolean
language sql stable security definer set search_path=''
as $$
  select coalesce(
    (auth.jwt()->'app_metadata'->>'role') in ('bn2_owner','bn2_admin')
    or (
      (auth.jwt()->'app_metadata'->>'role') in ('bn2_staff','bn2_agent')
      and exists (
        select 1 from public.staff_members sm
        where sm.user_id=(select auth.uid())
          and sm.employment_status in ('invited','active')
      )
    ),
    false
  );
$$;
create or replace function private.has_staff_permission(permission_key text)
returns boolean
language sql stable security definer set search_path=''
as $$
  select coalesce(
    (auth.jwt()->'app_metadata'->>'role') in ('bn2_owner','bn2_admin')
    or exists (
      select 1 from public.staff_members sm
      where sm.user_id=(select auth.uid())
        and sm.employment_status in ('invited','active')
        and coalesce(sm.permissions->>permission_key,'false')='true'
    ),
    false
  );
$$;
revoke all on function private.is_bn2_staff() from public,anon;
revoke all on function private.has_staff_permission(text) from public,anon;
grant execute on function private.is_bn2_staff() to authenticated;
grant execute on function private.has_staff_permission(text) to authenticated;

drop policy if exists organizations_read_member_or_admin on public.organizations;
create policy organizations_read_member_or_admin on public.organizations for select to authenticated
using ((select private.is_bn2_admin()) or (select private.is_org_member(id)) or (select private.has_staff_permission('clients.read')));

drop policy if exists tickets_read_org_or_admin on public.support_tickets;
create policy tickets_read_org_or_admin on public.support_tickets for select to authenticated
using ((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)) or (select private.has_staff_permission('tickets.read')));
drop policy if exists tickets_update_staff_or_admin on public.support_tickets;
create policy tickets_update_staff_or_admin on public.support_tickets for update to authenticated
using ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('tickets.manage')))
with check ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('tickets.manage')));
drop policy if exists tickets_create_org_member on public.support_tickets;
create policy tickets_create_org_member on public.support_tickets for insert to authenticated
with check (
  created_by=(select auth.uid())
  and ((select private.is_org_member(organization_id)) or (select private.has_staff_permission('tickets.manage')))
);

drop policy if exists messages_read_org_or_admin on public.ticket_messages;
create policy messages_read_org_or_admin on public.ticket_messages for select to authenticated
using (
  (select private.is_bn2_admin())
  or (select private.has_staff_permission('tickets.read'))
  or ((select private.is_org_member(organization_id)) and ((not is_internal) or (select private.is_org_staff(organization_id))))
);
drop policy if exists messages_create_org_member on public.ticket_messages;
create policy messages_create_org_member on public.ticket_messages for insert to authenticated
with check (
  sender_id=(select auth.uid())
  and exists(select 1 from public.support_tickets t where t.id=ticket_id and t.organization_id=organization_id)
  and (
    (select private.is_bn2_admin())
    or ((select private.has_staff_permission('tickets.manage')) and is_internal in (true,false))
    or (is_internal=false and (select private.is_org_member(organization_id)))
  )
);

drop policy if exists interventions_read_org on public.interventions;
create policy interventions_read_org on public.interventions for select to authenticated
using ((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)) or (select private.has_staff_permission('interventions.read')));
drop policy if exists interventions_staff_insert on public.interventions;
create policy interventions_staff_insert on public.interventions for insert to authenticated
with check ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('interventions.manage')));
drop policy if exists interventions_staff_update on public.interventions;
create policy interventions_staff_update on public.interventions for update to authenticated
using ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('interventions.manage')))
with check ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('interventions.manage')));
drop policy if exists interventions_staff_delete on public.interventions;
create policy interventions_staff_delete on public.interventions for delete to authenticated
using ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('interventions.manage')));

drop policy if exists contracts_read_org on public.service_contracts;
create policy contracts_read_org on public.service_contracts for select to authenticated
using ((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)) or (select private.has_staff_permission('contracts.read')));

drop policy if exists assets_read_org on public.assets;
create policy assets_read_org on public.assets for select to authenticated
using ((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)) or (select private.has_staff_permission('assets.read')));
create policy assets_bn2_staff_insert on public.assets for insert to authenticated
with check ((select private.has_staff_permission('assets.manage')));
create policy assets_bn2_staff_update on public.assets for update to authenticated
using ((select private.has_staff_permission('assets.manage')))
with check ((select private.has_staff_permission('assets.manage')));
create policy assets_bn2_staff_delete on public.assets for delete to authenticated
using ((select private.has_staff_permission('assets.manage')));

drop policy if exists documents_read_org on public.documents;
create policy documents_read_org on public.documents for select to authenticated
using ((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)) or (select private.has_staff_permission('documents.read')));
create policy documents_bn2_staff_insert on public.documents for insert to authenticated
with check ((select private.has_staff_permission('documents.manage')));
create policy documents_bn2_staff_update on public.documents for update to authenticated
using ((select private.has_staff_permission('documents.manage')))
with check ((select private.has_staff_permission('documents.manage')));
create policy documents_bn2_staff_delete on public.documents for delete to authenticated
using ((select private.has_staff_permission('documents.manage')));

drop policy if exists work_logs_read_org on public.work_logs;
create policy work_logs_read_org on public.work_logs for select to authenticated
using ((select private.is_bn2_admin()) or (select private.is_org_member(organization_id)) or (select private.has_staff_permission('worklogs.read')));
drop policy if exists work_logs_create_staff on public.work_logs;
create policy work_logs_create_staff on public.work_logs for insert to authenticated
with check (
  logged_by=(select auth.uid())
  and ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('worklogs.create')))
);
