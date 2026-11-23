import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
async function requireAdmin() {
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return { error: NextResponse.json({ error: "Session expirée. Reconnectez-vous." }, { status: 401 }) };
  if (!["bn2_owner", "bn2_admin"].includes(String(user.app_metadata?.role ?? ""))) return { error: NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 }) };
  return { user };
}
export async function POST(request: Request) {
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 }); }
  const email = String(body.email ?? "").trim().toLowerCase();
  const fullName = String(body.fullName ?? "").trim();
  const organizationId = String(body.organizationId ?? "");
  const role = String(body.memberRole ?? "member");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !organizationId || fullName.length < 2) return NextResponse.json({ error: "Nom, e-mail et société sont obligatoires." }, { status: 400 });
  if (!["member", "admin", "agent"].includes(role)) return NextResponse.json({ error: "Rôle client invalide." }, { status: 400 });
  const admin = createAdminClient();
  const { data: organization, error: orgError } = await admin.from("organizations").select("id,name").eq("id", organizationId).maybeSingle();
  if (orgError || !organization) return NextResponse.json({ error: "Société introuvable. Actualisez la liste des sociétés." }, { status: 404 });
  const { data: users, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) return NextResponse.json({ error: "Recherche du compte utilisateur impossible : " + listError.message }, { status: 500 });
  let target = users.users.find(item => item.email?.toLowerCase() === email);
  if (target && ["bn2_owner", "bn2_admin", "bn2_staff", "bn2_agent"].includes(String(target.app_metadata?.role ?? ""))) return NextResponse.json({ error: "Cette adresse appartient déjà à l'équipe BN2." }, { status: 409 });
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bn-2-hub.vercel.app").replace(/\/$/, "");
  const redirectTo = siteUrl + "/auth/callback?next=" + encodeURIComponent("/portal");
  let actionLink: string | null = null;
  let existingAccount = false;
  if (!target) {
    const { data, error } = await admin.auth.admin.generateLink({ type: "invite", email, options: { data: { full_name: fullName }, redirectTo } });
    if (error || !data.user) return NextResponse.json({ error: "Création du compte impossible : " + (error?.message ?? "Utilisateur non créé.") }, { status: 400 });
    target = data.user;
    actionLink = data.properties?.action_link ?? null;
  } else {
    existingAccount = true;
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo } });
    if (error) return NextResponse.json({ error: "Lien de connexion impossible : " + error.message }, { status: 400 });
    actionLink = data.properties?.action_link ?? null;
    const { error: metadataError } = await admin.auth.admin.updateUserById(target.id, { user_metadata: { ...(target.user_metadata ?? {}), full_name: fullName } });
    if (metadataError) return NextResponse.json({ error: "Mise à jour du profil impossible : " + metadataError.message }, { status: 400 });
  }
  const { error: memberError } = await admin.from("organization_members").upsert({ organization_id: organizationId, user_id: target.id, role, status: "active" }, { onConflict: "organization_id,user_id" });
  if (memberError) return NextResponse.json({ error: "Le compte a été créé, mais son rattachement à la société a échoué : " + memberError.message }, { status: 400 });
  await admin.from("audit_logs").insert({ actor_id: access.user.id, organization_id: organizationId, action: "organization_member_added", entity_type: "organization_member", entity_id: target.id, details: { email, role, organization: organization.name } });
  return NextResponse.json({ success: true, existingAccount, email, organization: organization.name, actionLink }, { status: 201 });
}
