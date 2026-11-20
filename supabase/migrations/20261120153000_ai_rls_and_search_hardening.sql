
-- Tighten customer-side AI write access and add full-text retrieval.
drop policy if exists ai_conversations_update_owner_or_admin on public.ai_conversations;
create policy ai_conversations_admin_update on public.ai_conversations for update to authenticated
  using ((select private.is_bn2_admin())) with check ((select private.is_bn2_admin()));
revoke update on public.ai_conversations from authenticated;
grant update on public.ai_conversations to authenticated;
-- Column-level grants are not available while table-level UPDATE is granted; remove the broad grant.
revoke update on public.ai_conversations from authenticated;
grant update(status,title) on public.ai_conversations to authenticated;

drop policy if exists ai_messages_feedback_owner on public.ai_messages;
create policy ai_messages_feedback_owner on public.ai_messages for update to authenticated
  using (user_id=(select auth.uid()) and role='assistant')
  with check (user_id=(select auth.uid()) and role='assistant');
revoke update on public.ai_messages from authenticated;
grant update(feedback) on public.ai_messages to authenticated;

drop policy if exists ai_messages_insert_user_only on public.ai_messages;
create policy ai_messages_insert_user_only on public.ai_messages for insert to authenticated
  with check (
    role='user' and user_id=(select auth.uid())
    and exists(select 1 from public.ai_conversations c
      where c.id=conversation_id and c.user_id=(select auth.uid())
      and c.organization_id is not distinct from organization_id)
  );

alter table public.ai_knowledge_sources
  add column if not exists search_vector tsvector
  generated always as (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(content,''))) stored;
create index if not exists ai_knowledge_search_idx on public.ai_knowledge_sources using gin(search_vector);
