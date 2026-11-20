import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const allowedOrigin = (origin: string) => origin === "https://bn-2-hub.vercel.app" || /^https:\/\/bn-2-hub(?:-[a-z0-9-]+)?-bns-prestiges-projects\.vercel\.app$/.test(origin);
const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": allowedOrigin(origin) ? origin : "https://bn-2-hub-bns-prestiges-projects.vercel.app",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

function response(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin") ?? "";
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, origin, 405);
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return response({ error: "Authentication required" }, origin, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return response({ error: "Server configuration incomplete" }, origin, 500);

  const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return response({ error: "Invalid session" }, origin, 401);
  if (!["bn2_owner", "bn2_admin"].includes(user.app_metadata?.role)) return response({ error: "Administrator access required" }, origin, 403);

  let body: { email?: string; fullName?: string; organizationId?: string; memberRole?: string };
  try { body = await request.json(); } catch { return response({ error: "Invalid JSON body" }, origin, 400); }
  const email = body.email?.trim().toLowerCase();
  const fullName = body.fullName?.trim() ?? "";
  const organizationId = body.organizationId;
  const memberRole = body.memberRole ?? "member";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !organizationId) return response({ error: "A valid email and organization are required" }, origin, 400);
  if (!["member", "admin", "agent"].includes(memberRole)) return response({ error: "Invalid organization role" }, origin, 400);

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: organization } = await admin.from("organizations").select("id,name").eq("id", organizationId).maybeSingle();
  if (!organization) return response({ error: "Organization not found" }, origin, 404);
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) return response({ error: "Unable to look up account" }, origin, 500);
  let target = listed.users.find((item) => item.email?.toLowerCase() === email);
  let actionLink: string | null = null;

  if (target && ["bn2_owner","bn2_admin","bn2_staff","bn2_agent"].includes(String(target.app_metadata?.role ?? ""))) return response({ error: "This account is already part of the BN2 team." }, origin, 409);

  if (!target) {
    const { data: invite, error: inviteError } = await admin.auth.admin.generateLink({
      type: "invite", email,
      options: { data: { full_name: fullName }, redirectTo: (Deno.env.get("SITE_URL") ?? "https://bn-2-hub.vercel.app") + "/auth/callback?next=/portal" },
    });
    if (inviteError || !invite.user) return response({ error: inviteError?.message ?? "Invitation failed" }, origin, 400);
    target = invite.user;
    actionLink = invite.properties?.action_link ?? null;
  }

  const { error: memberError } = await admin.from("organization_members").upsert({
    organization_id: organizationId, user_id: target.id, role: memberRole, status: "active",
  }, { onConflict: "organization_id,user_id" });
  if (memberError) return response({ error: memberError.message }, origin, 400);

  await admin.from("audit_logs").insert({
    actor_id: user.id, organization_id: organizationId, action: "member_invited_or_assigned",
    entity_type: "organization_member", entity_id: target.id,
    details: { email, role: memberRole, organization: organization.name },
  });
  return response({ success: true, existingAccount: !actionLink, email, organization: organization.name, actionLink }, origin);
});
