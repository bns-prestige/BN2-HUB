import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const fields: Record<string, string[]> = {
  interventions: ["organization_id","title","description","assigned_to","scheduled_start","scheduled_end","status","location"],
  service_contracts: ["organization_id","name","contract_number","plan_name","starts_on","ends_on","included_hours","hourly_rate","monthly_price","billing_frequency","status","auto_renew","renewal_notice_days","support_sla_hours"],
  assets: ["organization_id","asset_tag","name","category","status","manufacturer","model","serial_number","assigned_to","purchased_on","warranty_until","hostname","operating_system","ip_address","mac_address","purchase_cost","license_expires_on","notes"],
};
async function requireAdmin() {
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return { error: NextResponse.json({ error: "Session expirée. Reconnectez-vous." }, { status: 401 }) };
  if (!["bn2_owner","bn2_admin"].includes(String(user.app_metadata?.role ?? ""))) return { error: NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 }) };
  return { user };
}
function cleanPayload(table: string, body: Record<string, unknown>) {
  const allowed = fields[table];
  if (!allowed) return null;
  const payload: Record<string, unknown> = {};
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(body, key)) {
    const value = body[key];
    payload[key] = typeof value === "string" && value.trim() === "" ? null : value;
  }
  return payload;
}
export async function POST(request: Request) {
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 }); }
  const table = String(body.table ?? "");
  const payload = cleanPayload(table, body.values && typeof body.values === "object" ? body.values as Record<string, unknown> : {});
  if (!payload) return NextResponse.json({ error: "Type d'enregistrement non autorisé." }, { status: 400 });
  if (table === "interventions") payload.created_by = access.user.id;
  const admin = createAdminClient();
  const { data, error } = await admin.from(table as "assets" | "service_contracts" | "interventions").insert(payload as never).select("id").single();
  if (error) return NextResponse.json({ error: "Création impossible : " + error.message }, { status: 400 });
  await admin.from("audit_logs").insert({ actor_id: access.user.id, action: table + "_created", entity_type: table, entity_id: data.id, details: { fields: Object.keys(payload) } });
  return NextResponse.json({ record: data }, { status: 201 });
}
export async function PATCH(request: Request) {
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 }); }
  const table = String(body.table ?? "");
  const id = String(body.id ?? "");
  const payload = cleanPayload(table, body.values && typeof body.values === "object" ? body.values as Record<string, unknown> : {});
  if (!payload || !id) return NextResponse.json({ error: "Type ou identifiant invalide." }, { status: 400 });
  payload.updated_at = new Date().toISOString();
  const admin = createAdminClient();
  const { error } = await admin.from(table as "assets" | "service_contracts" | "interventions").update(payload as never).eq("id", id);
  if (error) return NextResponse.json({ error: "Mise à jour impossible : " + error.message }, { status: 400 });
  await admin.from("audit_logs").insert({ actor_id: access.user.id, action: table + "_updated", entity_type: table, entity_id: id, details: { fields: Object.keys(payload) } });
  return NextResponse.json({ success: true });
}
