create or replace function private.can_access_org_path(object_name text, staff_only boolean default false)
returns boolean
language plpgsql stable security definer set search_path=''
as $$
declare folder text; org_id uuid;
begin
  folder := (storage.foldername(object_name))[1];
  if folder is null or folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  org_id := folder::uuid;
  if private.is_bn2_admin() then return true; end if;
  if staff_only then return private.is_org_staff(org_id) or private.has_staff_permission('documents.manage'); end if;
  return private.is_org_member(org_id) or private.has_staff_permission('documents.read');
end;
$$;
revoke all on function private.can_access_org_path(text,boolean) from public,anon;
grant execute on function private.can_access_org_path(text,boolean) to authenticated;