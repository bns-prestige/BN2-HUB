import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const role = user.app_metadata?.role;
  if (role !== "bn2_owner" && role !== "bn2_admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const [orgs, openTickets, allTickets, interventions, logs, recentTickets, ticketCounts, newTickets, activityLogs] = await Promise.all([
    supabase.from("organizations").select("id,name,slug,status").eq("status", "active").order("name"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).not("status", "in", '("resolved","closed")'),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }),
    supabase.from("interventions").select("id", { count: "exact", head: true }).not("status", "eq", "cancelled"),
    supabase.from("work_logs").select("minutes").gte("created_at", since),
    supabase.from("support_tickets").select("id,ticket_number,title,category,priority,status,created_at,organization_id,organizations(name)").order("created_at", { ascending: false }).limit(6),
    supabase.from("support_tickets").select("organization_id"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("audit_logs").select("id,action,entity_type,entity_id,created_at,details").order("created_at", { ascending: false }).limit(6),
  ]);

  const firstError = [orgs.error, openTickets.error, allTickets.error, interventions.error, logs.error, recentTickets.error, ticketCounts.error, newTickets.error, activityLogs.error].find(Boolean);
  if (firstError) return NextResponse.json({ error: "database_error", message: firstError.message }, { status: 500 });

  const ticketCountByOrg = new Map<string,number>();
  for (const ticket of ticketCounts.data ?? []) ticketCountByOrg.set(ticket.organization_id,(ticketCountByOrg.get(ticket.organization_id)??0)+1);
  const clients = (orgs.data ?? []).map((org) => ({
    id: org.id,
    name: org.name,
    initials: org.name.split(/\s+/).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(),
    plan: org.status === "active" ? "Client actif" : "Configuration",
    tickets: ticketCountByOrg.get(org.id) ?? 0,
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

  const actionLabels:Record<string,string> = {ticket_created:"Nouvelle demande créée",ticket_status_changed:"Statut de demande modifié",organization_created:"Nouvelle entreprise cliente",staff_invited:"Employé invité",staff_updated:"Accès employé modifié",intervention_created:"Intervention planifiée",invoice_created:"Facture créée",initial_owner_activated:"Compte propriétaire activé"};
  const activity = (activityLogs.data ?? []).map((item) => {
    const details = item.details && typeof item.details === "object" ? item.details as Record<string,unknown> : {};
    const description = String(details.title ?? details.name ?? details.email ?? item.entity_id ?? item.entity_type);
    return {id:String(item.id),title:actionLabels[item.action] ?? item.action.replaceAll("_"," "),description,time:new Date(item.created_at).toLocaleString("fr-BE",{dateStyle:"short",timeStyle:"short"}),action:item.action};
  });

  return NextResponse.json({
    stats: {
      clients: orgs.data?.length ?? 0,
      openTickets: openTickets.count ?? 0,
      interventions: interventions.count ?? 0,
      hours: Math.round((logs.data ?? []).reduce((sum, row) => sum + (row.minutes ?? 0), 0) / 60 * 10) / 10,
      totalTickets: allTickets.count ?? 0,
      newTickets: newTickets.count ?? 0,
    },
    clients,
    tickets,
    activity,
  }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
