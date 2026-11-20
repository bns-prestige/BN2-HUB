drop policy if exists ai_conversations_create_owner on public.ai_conversations;
create policy ai_conversations_create_owner on public.ai_conversations for insert to authenticated
with check (
 user_id=(select auth.uid()) and (
  (organization_id is null and (select private.is_bn2_staff()))
  or (organization_id is not null and (select private.is_org_member(organization_id)))
 )
);