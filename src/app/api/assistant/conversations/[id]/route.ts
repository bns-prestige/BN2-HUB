import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const { data: conversation, error: conversationError } = await supabase
    .from("ai_conversations")
    .select("id,title,channel,status,updated_at")
    .eq("id", id)
    .single();

  if (conversationError || !conversation) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { data: messages, error } = await supabase
    .from("ai_messages")
    .select("id,role,content,created_at,feedback")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(80);

  if (error) return NextResponse.json({ error: "database_error" }, { status: 500 });
  return NextResponse.json({ conversation, messages: messages ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}
