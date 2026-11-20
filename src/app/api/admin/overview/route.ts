import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const role = user.app_metadata?.role;
  if (role !== "bn2_owner" && role !== "bn2_admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const [orgs, openTickets, allTickets, interventions, logs, recentTickets] = await Promise.all([
    supabase.from("organizations").select("id,name,slug,status").eq("status", "active").order("name"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).not("status", "in", '("resolved","closed")'),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }),
    supabase.from("interventions").select("id", { count: "exact", head: true }).not("status", "eq", "cancelled"),
    supabase.from("work_logs").select("minutes"),
    supabase.from("support_tickets").select("id,ticket_number,title,category,priority,status,created_at,organization_id,organizations(name)").order("created_at", { ascending: false }).limit(6),
  ]);

  const firstError = [orgs.error, openTickets.error, allTickets.error, interventions.error, logs.error, recentTickets.error].find(Boolean);
  if (firstError) return NextResponse.json({ error: "database_error", message: firstError.message }, { status: 500 });

  const clients = (orgs.data ?? []).map((org) => ({
    id: org.id,
    name: org.name,
    initials: org.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    plan: org.status === "active" ? "Client actif" : "Configuration",
    tickets: 0,
    color: "lavender",
  }));
  const tickets = (recentTickets.data ?? []).map((ticket) => ({
    id: ticket.ticket_number,
    subject: ticket.title,
    client: Array.isArray(ticket.organizations) ? ticket.organizations[0]?.name ?? "Client" : (ticket.organizations as { name?: string } | null)?.name ?? "Client",
    type: ticket.category,
    priority: ({ low: "Basse", normal: "Normale", high: "Haute", urgent: "Urgente" } as Record<string, string>)[ticket.priority] ?? ticket.priority,
    status: ({ new: "Nouvelle", in_progress: "En cours", waiting_customer: "En attente client", waiting_bn2: "En attente BN2", resolved: "Résolue", closed: "Clôturée" } as Record<string, string>)[ticket.status] ?? ticket.status,
    time: new Date(ticket.created_at).toLocaleString("fr-BE", { dateStyle: "short", timeStyle: "short" }),
  }));

  return NextResponse.json({
    stats: {
      clients: orgs.data?.length ?? 0,
      openTickets: openTickets.count ?? 0,
      interventions: interventions.count ?? 0,
      hours: Math.round((logs.data ?? []).reduce((sum, row) => sum + (row.minutes ?? 0), 0) / 60 * 10) / 10,
      totalTickets: allTickets.count ?? 0,
    },
    clients,
    tickets,
  }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
