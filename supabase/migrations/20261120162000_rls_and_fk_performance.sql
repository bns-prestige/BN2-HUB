
drop policy if exists ai_knowledge_admin_manage on public.ai_knowledge_sources;
create policy ai_knowledge_admin_insert on public.ai_knowledge_sources for insert to authenticated with check ((select private.is_bn2_admin()));
create policy ai_knowledge_admin_update on public.ai_knowledge_sources for update to authenticated using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
create policy ai_knowledge_admin_delete on public.ai_knowledge_sources for delete to authenticated using ((select private.is_bn2_admin()));

drop policy if exists staff_admin_manage on public.staff_members;
create policy staff_admin_insert on public.staff_members for insert to authenticated with check ((select private.is_bn2_admin()));
create policy staff_admin_update on public.staff_members for update to authenticated using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
create policy staff_admin_delete on public.staff_members for delete to authenticated using ((select private.is_bn2_admin()));

drop policy if exists invoices_admin_manage on public.service_invoices;
create policy invoices_admin_insert on public.service_invoices for insert to authenticated with check ((select private.is_bn2_admin()));
create policy invoices_admin_update on public.service_invoices for update to authenticated using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
create policy invoices_admin_delete on public.service_invoices for delete to authenticated using ((select private.is_bn2_admin()));

drop policy if exists invoice_items_admin_manage on public.service_invoice_items;
create policy invoice_items_admin_insert on public.service_invoice_items for insert to authenticated with check ((select private.is_bn2_admin()));
create policy invoice_items_admin_update on public.service_invoice_items for update to authenticated using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
create policy invoice_items_admin_delete on public.service_invoice_items for delete to authenticated using ((select private.is_bn2_admin()));

drop policy if exists payments_admin_manage on public.service_payments;
create policy payments_admin_insert on public.service_payments for insert to authenticated with check ((select private.is_bn2_admin()));
create policy payments_admin_update on public.service_payments for update to authenticated using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
create policy payments_admin_delete on public.service_payments for delete to authenticated using ((select private.is_bn2_admin()));

drop policy if exists assets_bn2_staff_insert on public.assets;
drop policy if exists assets_bn2_staff_update on public.assets;
drop policy if exists assets_bn2_staff_delete on public.assets;
drop policy if exists assets_staff_insert on public.assets;
drop policy if exists assets_staff_update on public.assets;
drop policy if exists assets_staff_delete on public.assets;
create policy assets_staff_insert on public.assets for insert to authenticated with check ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('assets.manage')));
create policy assets_staff_update on public.assets for update to authenticated using ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('assets.manage'))) with check ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('assets.manage')));
create policy assets_staff_delete on public.assets for delete to authenticated using ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('assets.manage')));

drop policy if exists documents_bn2_staff_insert on public.documents;
drop policy if exists documents_bn2_staff_update on public.documents;
drop policy if exists documents_bn2_staff_delete on public.documents;
drop policy if exists documents_staff_insert on public.documents;
drop policy if exists documents_staff_update on public.documents;
drop policy if exists documents_staff_delete on public.documents;
create policy documents_staff_insert on public.documents for insert to authenticated with check ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('documents.manage')));
create policy documents_staff_update on public.documents for update to authenticated using ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('documents.manage'))) with check ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('documents.manage')));
create policy documents_staff_delete on public.documents for delete to authenticated using ((select private.is_bn2_admin()) or (select private.is_org_staff(organization_id)) or (select private.has_staff_permission('documents.manage')));

create index if not exists ai_assistant_settings_updated_by_idx on public.ai_assistant_settings(updated_by);
create index if not exists ai_conversations_organization_idx on public.ai_conversations(organization_id);
create index if not exists ai_knowledge_created_by_idx on public.ai_knowledge_sources(created_by);
create index if not exists ai_knowledge_updated_by_idx on public.ai_knowledge_sources(updated_by);
create index if not exists ai_messages_organization_idx on public.ai_messages(organization_id);
create index if not exists ai_messages_user_idx on public.ai_messages(user_id);
create index if not exists ai_prompt_versions_created_by_idx on public.ai_prompt_versions(created_by);
create index if not exists automation_rules_created_by_idx on public.automation_rules(created_by);
create index if not exists automation_runs_rule_idx on public.automation_runs(rule_id);
create index if not exists interventions_ticket_idx on public.interventions(ticket_id);
create index if not exists invoices_contract_idx on public.service_invoices(contract_id);
create index if not exists invoices_created_by_idx on public.service_invoices(created_by);
create index if not exists payments_invoice_idx on public.service_payments(invoice_id);
create index if not exists payments_recorded_by_idx on public.service_payments(recorded_by);
create index if not exists staff_members_created_by_idx on public.staff_members(created_by);
create index if not exists staff_members_manager_idx on public.staff_members(manager_id);
