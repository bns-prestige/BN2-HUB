"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AdminSectionView from "@/components/admin-section-view";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Activity, Bell, BriefcaseBusiness, Building2, CalendarDays, ChevronDown, ChevronRight,
  Clock3, ClipboardList, ExternalLink, FileText, HardDrive, LayoutDashboard, LifeBuoy,
  LogOut, Menu, Plus, Receipt, Search, Settings2, ShieldCheck, Users, WandSparkles, X,
} from "lucide-react";

const navigation = [
  { label: "Vue d'ensemble", icon: LayoutDashboard, section: "ESPACE" },
  { label: "Demandes support", icon: LifeBuoy, section: "SERVICE" },
  { label: "Portails clients", icon: Building2 },
  { label: "Interventions", icon: BriefcaseBusiness, section: "OPÉRATIONS" },
  { label: "Calendrier", icon: CalendarDays },
  { label: "Contrats", icon: FileText, section: "GESTION" },
  { label: "Facturation", icon: Receipt },
  { label: "Heures prestées", icon: Clock3 },
  { label: "Parc informatique", icon: HardDrive, section: "RESSOURCES" },
  { label: "Documents", icon: ClipboardList },
  { label: "Équipe BN2", icon: Users, section: "ADMINISTRATION" },
  { label: "Assistant IA", icon: WandSparkles },
  { label: "Journal d'audit", icon: ShieldCheck },
  { label: "Paramètres", icon: Settings2 },
];

type DashboardTicket = { id: string; subject: string; client: string; type: string; priority: string; status: string; time: string };
type DashboardClient = { id: string; name: string; initials: string; plan: string; tickets: number; color: string };
type DashboardStats = { clients: number; openTickets: number; interventions: number; hours: number; totalTickets: number; newTickets: number };
type DashboardActivity = { id:string; title:string; description:string; time:string; action:string };
type DashboardNotification = {id:string;title:string;body:string;href:string|null;read_at:string|null;created_at:string};

export default function AdminHome() {
  const [active, setActive] = useState("Vue d'ensemble");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [tickets, setTickets] = useState<DashboardTicket[]>([]);
  const [clients, setClients] = useState<DashboardClient[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ clients: 0, openTickets: 0, interventions: 0, hours: 0, totalTickets: 0, newTickets: 0 });
  const [activity,setActivity] = useState<DashboardActivity[]>([]);
  const [notifications,setNotifications] = useState<DashboardNotification[]>([]);
  const [unreadNotifications,setUnreadNotifications] = useState(0);
  const [ticketTitle,setTicketTitle] = useState("");
  const [ticketDescription,setTicketDescription] = useState("");
  const [ticketOrganization,setTicketOrganization] = useState("");
  const [ticketCategory,setTicketCategory] = useState("Support informatique");
  const [ticketPriority,setTicketPriority] = useState("normal");
  const [ticketSaving,setTicketSaving] = useState(false);
  const [ticketError,setTicketError] = useState("");
  const [dashboardError,setDashboardError] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [adminName,setAdminName] = useState("Administrateur BN2");
  const [adminEmail,setAdminEmail] = useState("");

  const loadDashboard = useCallback(async () => {
    setDashboardError("");
    const response = await fetch("/api/admin/overview", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message ?? "Impossible de charger les données BN2.");
    setTickets(data.tickets ?? []);
    setClients(data.clients ?? []);
    setStats(data.stats ?? { clients: 0, openTickets: 0, interventions: 0, hours: 0, totalTickets: 0, newTickets: 0 });
    setActivity(data.activity ?? []);
    setNotifications(data.notifications ?? []);
    setUnreadNotifications(data.unreadNotifications ?? 0);
    setTicketOrganization((current) => current || data.clients?.[0]?.id || "");
    setDataLoaded(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadIdentity() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setAdminEmail(user.email ?? "");
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (!cancelled) setAdminName(profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Administrateur BN2");
    }
    void loadIdentity();
    void loadDashboard().catch((error: unknown) => setDashboardError(error instanceof Error ? error.message : "Chargement impossible."));
    return () => { cancelled = true; };
  }, [loadDashboard]);

  async function createTicket(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTicketError("");
    if (!ticketOrganization) { setTicketError("Sélectionnez d'abord une entreprise cliente."); return; }
    setTicketSaving(true);
    try {
      const response = await fetch("/api/admin/tickets", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({organizationId:ticketOrganization,title:ticketTitle,description:ticketDescription,category:ticketCategory,priority:ticketPriority}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Création de la demande impossible.");
      setShowNewTicket(false); setTicketTitle(""); setTicketDescription(""); setTicketPriority("normal");
      await loadDashboard();
    } catch (error) {
      setTicketError(error instanceof Error ? error.message : "Création de la demande impossible.");
    } finally { setTicketSaving(false); }
  }

  async function signOut() {
    await createClient().auth.signOut();
    window.location.assign("/login");
  }

  async function openNotifications() {
    const next = !showNotifications;
    setShowNotifications(next);
    if (!next || unreadNotifications === 0) return;
    const ids = notifications.filter(item => !item.read_at).map(item => item.id);
    if (!ids.length) return;
    const readAt = new Date().toISOString();
    const { error } = await createClient().from("notifications").update({read_at:readAt}).in("id",ids);
    if (!error) {
      setNotifications(items=>items.map(item=>({...item,read_at:item.read_at??readAt})));
      setUnreadNotifications(0);
    }
  }

  const filteredTickets = useMemo(() => tickets.filter((ticket) =>
    [ticket.id, ticket.subject, ticket.client, ticket.type].join(" ").toLowerCase().includes(query.toLowerCase())
  ), [tickets, query]);
  const firstName = adminName.trim().split(/\s+/)[0] || "Bonjour";

  return (
    <main className="admin-shell">
      <aside className={`admin-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-mark">BN2</div>
          <div><div className="admin-brand-name">BN2 <span>HUB</span></div><div className="admin-brand-caption">CONSULTING PLATFORM</div></div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu"><X size={18}/></button>
        </div>
        <div className="workspace-switch"><div className="workspace-symbol"><ShieldCheck size={16}/></div><div className="workspace-copy"><strong>BN2 Consulting</strong><span>Administration</span></div><ChevronDown size={14}/></div>
        <nav className="admin-nav" aria-label="Navigation administrateur">
          {navigation.map((item) => {
            const Icon = item.icon;
            return <div key={item.label}>
              {item.section && <div className="admin-nav-section">{item.section}</div>}
              <button className={`admin-nav-item ${active === item.label ? "selected" : ""}`} aria-current={active === item.label ? "page" : undefined}
                onClick={() => { if (item.label === "Assistant IA") { window.location.href = "/ai-admin"; return; } setActive(item.label); setMobileOpen(false); }}>
                <Icon size={16} strokeWidth={1.8}/><span>{item.label}</span>
              </button>
            </div>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-status"><span className="sidebar-status-dot"/><div><strong>Connexion sécurisée</strong><small>BN2 Consulting</small></div></div>
          <div className="admin-user"><div className="user-avatar">{adminName.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase()}</div><div className="user-info"><strong>{adminName}</strong><span>{adminEmail || "Compte administrateur"}</span></div><button onClick={signOut} aria-label="Se déconnecter" title="Se déconnecter"><LogOut size={15}/></button></div>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu"><Menu size={19}/></button><div className="admin-breadcrumb">BN2 HUB <ChevronRight size={13}/><strong>{active}</strong></div></div>
          <div className="topbar-right">
            <Link className="preview-client-link" href="/portal"><ExternalLink size={14}/> Aperçu portail client</Link>
            {active === "Vue d'ensemble" && <label className="global-search"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une demande..." aria-label="Rechercher une demande"/></label>}
            <div className="notification-wrap">
              <button className="top-icon-button" aria-label="Notifications" title="Notifications" onClick={() => void openNotifications()}><Bell size={17}/>{unreadNotifications>0&&<i/>}</button>
              {showNotifications && <div className="notification-popover"><strong>Notifications {unreadNotifications>0?(`· ${unreadNotifications} non lues`):""}</strong>
                {notifications.length===0?<p>Aucune notification.</p>:notifications.map(item=><button className="bn2-notification-item" key={item.id} onClick={()=>{setShowNotifications(false);if(item.href&&item.href.startsWith("/")&&!item.href.startsWith("//")){window.location.assign(item.href);return;}const title=item.title.toLowerCase();if(title.includes("demande")||title.includes("ticket"))setActive("Demandes support");else if(title.includes("intervention"))setActive("Interventions");else if(title.includes("facture")||title.includes("paiement"))setActive("Facturation");else if(title.includes("client")||title.includes("entreprise"))setActive("Portails clients");}}>
                  <span className={`notification-dot ${item.read_at?"muted":""}`}/><span><b>{item.title}</b><small>{item.body}</small></span>
                </button>)}
              </div>}
            </div>
            <div className="top-user-avatar" title={adminName}>{adminName.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase()}</div>
          </div>
        </header>

        {active === "Vue d'ensemble" ? <div className="admin-content">
          <div className="page-heading">
            <div><div className="page-eyebrow">BN2 CONSULTING <span>·</span> ESPACE ADMINISTRATEUR</div><h1>Bonjour {firstName}.</h1><p>Voici ce qui nécessite votre attention aujourd&apos;hui.</p></div>
            <button className="admin-primary-button" onClick={() => setShowNewTicket(true)}><Plus size={16}/> Nouvelle demande</button>
          </div>
          {dashboardError && <div className="bn2-dashboard-alert" role="alert">{dashboardError}<button onClick={()=>void loadDashboard()}>Réessayer</button></div>}
          <div className="admin-metrics">
            <article className="admin-metric"><div className="metric-label">Clients actifs <span className="metric-symbol purple"><Building2 size={16}/></span></div><div className="metric-number">{stats.clients}</div><div className="metric-trend">Entreprises suivies</div></article>
            <article className="admin-metric"><div className="metric-label">Demandes ouvertes <span className="metric-symbol amber"><LifeBuoy size={16}/></span></div><div className="metric-number">{stats.openTickets}</div><div className="metric-trend">{stats.newTickets} nouvelles à traiter</div></article>
            <article className="admin-metric"><div className="metric-label">Interventions <span className="metric-symbol blue"><Activity size={16}/></span></div><div className="metric-number">{stats.interventions}</div><div className="metric-trend">Non annulées</div></article>
            <article className="admin-metric"><div className="metric-label">Heures prestées <span className="metric-symbol green"><Clock3 size={16}/></span></div><div className="metric-number">{stats.hours}<span className="metric-unit">h</span></div><div className="metric-trend">30 derniers jours</div></article>
          </div>
          <div className="dashboard-grid">
            <section className="admin-panel requests-panel">
              <div className="panel-heading"><div><h3>Demandes récentes</h3><p>{filteredTickets.length} demande(s) dans la liste récente.</p></div><button className="text-action" onClick={() => setActive("Demandes support")}>Ouvrir le support <ChevronRight size={14}/></button></div>
              <div className="table-wrap"><table className="requests-table"><thead><tr><th>DEMANDE</th><th>CLIENT</th><th>PRIORITÉ</th><th>STATUT</th><th>REÇUE</th></tr></thead><tbody>
                {filteredTickets.map(ticket => <tr key={ticket.id}><td><strong>{ticket.subject}</strong><span>{ticket.id} · {ticket.type}</span></td><td>{ticket.client}</td><td><span className={`priority priority-${ticket.priority.toLowerCase()}`}><i/>{ticket.priority}</span></td><td><span className={`ticket-status status-${ticket.status.toLowerCase().replaceAll(" ","-")}`}>{ticket.status}</span></td><td className="received-time">{ticket.time}</td></tr>)}
              </tbody></table>
              {filteredTickets.length===0 && <div className="empty-state">{dataLoaded?"Aucune demande à afficher.":"Chargement des demandes..."}</div>}</div>
            </section>
            <section className="admin-panel clients-panel">
              <div className="panel-heading"><div><h3>Clients actifs</h3><p>Accès rapide aux entreprises suivies.</p></div><button className="round-action" aria-label="Ouvrir les clients" onClick={() => setActive("Portails clients")}><ChevronRight size={15}/></button></div>
              <div className="client-list">{clients.slice(0,6).map(client => <button className="client-row" key={client.id} onClick={() => setActive("Portails clients")}><div className="client-avatar lavender">{client.initials}</div><div className="client-details"><strong>{client.name}</strong><span>{client.plan}</span></div><span className="client-ticket-count">{client.tickets} <small>demandes</small></span></button>)}
                {clients.length===0 && <div className="empty-state">Aucun client actif.</div>}
              </div>
              <button className="clients-link" onClick={() => setActive("Portails clients")}>Tous les clients <ChevronRight size={14}/></button>
            </section>
          </div>
          <section className="admin-panel activity-panel">
            <div className="panel-heading"><div><h3>Activité récente</h3><p>Dernières opérations enregistrées dans BN2 HUB.</p></div></div>
            <div className="activity-feed">{activity.length===0?<div className="empty-state">Aucune activité enregistrée.</div>:activity.map(item=><div className="feed-item" key={item.id}><span className="feed-icon feed-purple"><Activity size={14}/></span><div><strong>{item.title}</strong><p>{item.description}</p><small>{item.time}</small></div></div>)}</div>
          </section>
          <footer className="admin-footer"><span>BN2 HUB <b>·</b> Une solution BN2 Consulting</span><span>{dataLoaded?"DONNÉES SYNCHRONISÉES":"CHARGEMENT"}</span></footer>
        </div> : <AdminSectionView active={active} onNavigate={setActive}/>}
      </section>

      {showNewTicket && <div className="modal-backdrop" onClick={() => setShowNewTicket(false)}><form className="new-request-modal" onSubmit={createTicket} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={() => setShowNewTicket(false)} aria-label="Fermer"><X size={18}/></button>
        <div className="modal-icon"><Plus size={19}/></div><h2>Nouvelle demande</h2><p>Créer une demande de support pour une entreprise cliente.</p>
        <label>Objet de la demande<input required minLength={3} value={ticketTitle} onChange={e=>setTicketTitle(e.target.value)} placeholder="Ex. : Configuration Microsoft 365"/></label>
        <label>Client<select required value={ticketOrganization} onChange={e=>setTicketOrganization(e.target.value)}><option value="">Sélectionner un client</option>{clients.map(client=><option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
        <label>Catégorie<select value={ticketCategory} onChange={e=>setTicketCategory(e.target.value)}><option>Support informatique</option><option>Microsoft 365</option><option>Réseau & Wi-Fi</option><option>Matériel</option><option>Cybersécurité</option><option>Autre demande</option></select></label>
        <label>Priorité<select value={ticketPriority} onChange={e=>setTicketPriority(e.target.value)}><option value="low">Basse</option><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></label>
        <label>Description<textarea required minLength={5} rows={4} value={ticketDescription} onChange={e=>setTicketDescription(e.target.value)} placeholder="Décrivez le problème et les éléments utiles..."/></label>
        {ticketError&&<p role="alert" className="client-notice">{ticketError}</p>}
        <button type="submit" className="admin-primary-button modal-submit" disabled={ticketSaving||!clients.length}>{ticketSaving?"Création...":"Créer la demande"}</button>
      </form></div>}
    </main>
  );
}
