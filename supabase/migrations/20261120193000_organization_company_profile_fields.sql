
alter table public.organizations
  add column if not exists legal_name text,
  add column if not exists vat_number text,
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists contact_name text,
  add column if not exists billing_email text,
  add column if not exists billing_address text,
  add column if not exists country text not null default 'Belgique',
  add column if not exists company_size text;
create unique index if not exists organizations_vat_number_unique_idx
  on public.organizations(vat_number) where vat_number is not null and btrim(vat_number)<>'';
