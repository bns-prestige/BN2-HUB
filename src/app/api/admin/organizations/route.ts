import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const adminRoles = ["bn2_owner", "bn2_admin"];

async function requireAdmin() {
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return { error: NextResponse.json({ error: "Session expirée. Reconnectez-vous." }, { status: 401 }) };
  if (!adminRoles.includes(String(user.app_metadata?.role ?? ""))) return { error: NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 }) };
  return { user };
}
function makeSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}
const selectFields = "id,name,slug,legal_name,vat_number,address,phone,website,contact_name,billing_email,company_size,sector,description,contact_email,status,created_at,enabled_modules";

export async function GET() {
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  const admin = createAdminClient();
  const { data, error } = await admin.from("organizations").select(selectFields).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Impossible de charger les sociétés : " + error.message }, { status: 500 });
  return NextResponse.json({ organizations: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 }); }
  const name = String(body.name ?? "").trim();
  if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Le nom de la société doit contenir entre 2 et 120 caractères." }, { status: 400 });
  const admin = createAdminClient();
  const base = makeSlug(name) || "societe";
  let slug = base;
  for (let suffix = 2; suffix < 100; suffix++) {
    const { data: exists, error: checkError } = await admin.from("organizations").select("id").eq("slug", slug).maybeSingle();
    if (checkError) return NextResponse.json({ error: "Vérification du nom impossible : " + checkError.message }, { status: 500 });
    if (!exists) break;
    slug = base + "-" + suffix;
  }
  const clean = (key: string) => { const value = String(body[key] ?? "").trim(); return value || null; };
  const payload = {
    name, slug, legal_name: clean("legal_name"), vat_number: clean("vat_number"), address: clean("address"),
    phone: clean("phone"), website: clean("website"), contact_name: clean("contact_name"),
    billing_email: clean("billing_email") ?? clean("contact_email"), company_size: clean("company_size"),
    sector: clean("sector"), description: clean("description"), contact_email: clean("contact_email"),
    status: "onboarding", brand_color: /^#[0-9a-f]{6}$/i.test(String(body.brand_color ?? "")) ? String(body.brand_color) : "#1686d9", enabled_modules: Array.isArray(body.enabled_modules) ? body.enabled_modules.filter((item): item is string => typeof item === "string").slice(0, 20) : ["dashboard", "support", "equipment", "documents", "team"],
  };
  const { data, error } = await admin.from("organizations").insert(payload).select(selectFields).single();
  if (error) return NextResponse.json({ error: "Création de la société impossible : " + error.message }, { status: 400 });
  await admin.from("audit_logs").insert({ actor_id: access.user.id, action: "organization_created", entity_type: "organization", entity_id: data.id, details: { name, slug } });
  return NextResponse.json({ organization: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 }); }
  const id = String(body.id ?? "");
  const status = String(body.status ?? "");
  if (!id || !["onboarding", "active", "suspended", "terminated"].includes(status)) return NextResponse.json({ error: "Société ou statut invalide." }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from("organizations").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: "Mise à jour impossible : " + error.message }, { status: 400 });
  await admin.from("audit_logs").insert({ actor_id: access.user.id, action: "organization_status_updated", entity_type: "organization", entity_id: id, details: { status } });
  return NextResponse.json({ success: true });
}
