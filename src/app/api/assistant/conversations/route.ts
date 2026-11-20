import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id,title,channel,status,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: "database_error" }, { status: 500 });
  return NextResponse.json({ conversations: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const role = user.app_metadata?.role;
  const isAdmin = role === "bn2_owner" || role === "bn2_admin";
  const isStaff = isAdmin || role === "bn2_staff" || role === "bn2_agent";
  let organizationId: string | null = null;

  if (!isStaff) {
    const { data: membership, error } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (error || !membership) return NextResponse.json({ error: "no_active_organization" }, { status: 403 });
    organizationId = membership.organization_id;
  }

  const channel = isAdmin ? "admin" : isStaff ? "internal" : "portal";
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({ user_id: user.id, organization_id: organizationId, channel })
    .select("id,title,channel,status,updated_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "conversation_create_failed" }, { status: 500 });
  return NextResponse.json({ conversation: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
