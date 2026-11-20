# BN2 HUB database

The production project is **BN2 Consulting** (project ref: almzypjgccucdkwnpldy, region: eu-west-1). Never apply this schema to BNS Prestige projects.

## Applied migration history (20 November 2026)

- 20261120122443_initial_bn2_hub_multi_tenant_platform
- 20261120122501_tighten_bn2_hub_tenant_security
- 20261120122523_fix_bn2_message_insert_policy
- 20261120122611_secure_initial_bn2_owner_bootstrap
- Later hardening migrations: move_owner_bootstrap_behind_insert_trigger, implement_token_checked_owner_claim_trigger, index_ticket_message_tenant_foreign_key.

The exact generated migration versions can be inspected in Supabase migration history. schema.sql is a consolidated production schema snapshot, not a migration to re-run against the live database.

## Tables

Profiles, organizations, organization members, support tickets, ticket messages, interventions, service contracts, work logs, assets, documents, notifications, and audit logs.

All public business tables have RLS enabled. The bn2-private Storage bucket is private and uses organization-folder policies.

## First owner

The first account is promoted through the one-time token checked by the owner_bootstrap_requests insert trigger. The token hash is held in the private schema. Do not commit the token or its hash to Git.
