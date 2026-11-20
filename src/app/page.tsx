"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSectionView from "@/components/admin-section-view";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, BriefcaseBusiness, Building2,
  CalendarDays, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Clock3,
  ExternalLink, FileText, HardDrive, LayoutDashboard, LifeBuoy, Menu, Plus, Search, Settings2,
  ShieldCheck, Users, X, WandSparkles,
} from "lucide-react";

const navigation = [
  { label: "Vue d'ensemble", icon: LayoutDashboard, section: "PRINCIPAL" },
  { label: "Demandes support", icon: LifeBuoy, count: "" },
  { label: "Générateur IA", icon: WandSparkles, section: "OUTILS" },
  { label: "Clients", icon: Building2 },
  { label: "Portails clients", icon: ShieldCheck },
  { label: "Interventions", icon: BriefcaseBusiness },
  { label: "Contrats & heures", icon: FileText },
  { label: "Parc informatique", icon: HardDrive, section: "GESTION" },
  { label: "Calendrier", icon: CalendarDays },
  { label: "Équipe BN2", icon: Users },
  { label: "Documents", icon: FileText },
  { label: "Hébergement", icon: HardDrive, section: "PLATEFORME" },
  { label: "Paramètres", icon: Settings2, section: "CONFIGURATION" },
];

type DashboardTicket = { id: string; subject: string; client: string; type: string; priority: string; status: string; time: string };
type DashboardClient = { id: string; name: string; initials: string; plan: string; tickets: number; color: string };
type DashboardStats = { clients: number; openTickets: number; interventions: number; hours: number; totalTickets: number };

export default function AdminHome() {
  const [active, setActive] = useState("Vue d'ensemble");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [tickets, setTickets] = useState<DashboardTicket[]>([]);
  const [clients, setClients] = useState<DashboardClient[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ clients: 0, openTickets: 0, interventions: 0, hours: 0, totalTickets: 0 });
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => { fetch("/api/admin/overview", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error("Chargement impossible"); return response.json(); }).then((data) => { setTickets(data.tickets ?? []); setClients(data.clients ?? []); setStats(data.stats ?? { clients: 0, openTickets: 0, interventions: 0, hours: 0, totalTickets: 0 }); setDataLoaded(true); }).catch(() => setDataLoaded(false)); }, []);
  async function signOut() { await createClient().auth.signOut(); window.location.assign("/login"); }
  const filteredTickets = useMemo(() => tickets.filter((ticket) =>
    [ticket.id, ticket.subject, ticket.client, ticket.type].join(" ").toLowerCase().includes(query.toLowerCase())
  ), [tickets, query]);

  return (
    <main className="admin-shell">
      <aside className={`admin-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-mark">BN2</div>
          <div><div className="admin-brand-name">BN2 <span>HUB</span></div><div className="admin-brand-caption">CONSULTING PLATFORM</div></div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu"><X size={18}/></button>
        </div>
        <div className="workspace-switch"><div className="workspace-symbol"><ShieldCheck size={17}/></div><div className="workspace-copy"><strong>BN2 Consulting</strong><span>Espace administrateur</span></div><ChevronDown size={15}/></div>
        <nav className="admin-nav" aria-label="Navigation administrateur">
          {navigation.map((item) => {
            const Icon = item.icon;
            return <div key={item.label}>
              {item.section && <div className="admin-nav-section">{item.section}</div>}
              <button className={`admin-nav-item ${active === item.label ? "selected" : ""}`} onClick={() => {if (item.label === "Générateur IA") { window.location.href = "/ai-admin"; return; } setActive(item.label); setMobileOpen(false);}}>
                <Icon size={17} strokeWidth={1.8}/><span>{item.label}</span>{item.count && <span className="nav-count">{item.count}</span>}
              </button>
            </div>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><div className="help-icon"><CircleHelp size={17}/></div><strong>Besoin d&apos;un coup de main ?</strong><p>Retrouvez les informations utiles pour gérer votre plateforme.</p><button onClick={() => setActive("Centre d'aide")}>Centre d&apos;aide <ChevronRight size={14}/></button></div>
          <div className="admin-user"><div className="user-avatar">NS</div><div className="user-info"><strong>Administrateur BN2</strong><span>Accès propriétaire</span></div><button onClick={signOut} aria-label="Se déconnecter"><ChevronDown size={15}/></button></div>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu"><Menu size={20}/></button><div className="admin-breadcrumb">BN2 HUB <ChevronRight size={14}/><strong>{active}</strong></div></div>
          <div className="topbar-right"><Link className="preview-client-link" href="/portal"><ExternalLink size={14}/> Aperçu portail client</Link>
            <div className="global-search"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une demande..." aria-label="Rechercher une demande"/><kbd>⌘ K</kbd></div>
            <div className="notification-wrap"><button className="top-icon-button" aria-label="Notifications" onClick={() => setShowNotifications(!showNotifications)}><Bell size={18}/><i/></button>{showNotifications && <div className="notification-popover"><strong>Notifications</strong><p><span className="notification-dot"/> 2 nouvelles demandes attendent une vérification.</p><p><span className="notification-dot muted"/> Votre aperçu BN2 HUB est prêt.</p></div>}</div>
            <div className="top-user-avatar">NS</div>
          </div>
        </header>

        {active === "Vue d'ensemble" ? <div className="admin-content">
          <div className="page-heading"><div><div className="page-eyebrow">BN2 HUB <span>•</span> ESPACE ADMINISTRATEUR</div><h1>Vue d&apos;ensemble</h1><p>Gardez une vue claire sur l&apos;activité de BN2 Consulting.</p></div><button className="admin-primary-button" onClick={() => setShowNewTicket(true)}><Plus size={17}/> Nouvelle demande</button></div>
          <div className="overview-banner"><div className="banner-orb orb-one"/><div className="banner-orb orb-two"/><div className="banner-copy"><div className="banner-tag"><span/> VOTRE ESPACE DE PILOTAGE</div><h2>Bonjour, bienvenue dans BN2 HUB.</h2><p>Votre activité informatique, vos clients et vos interventions réunis au même endroit.</p></div><div className="banner-art"><div className="banner-art-card"><div className="art-card-top"><span/><span/><span/></div><div className="art-lines"><i/><i/><i/></div><div className="art-check"><CheckCircle2 size={20}/></div></div></div></div>
          <div className="section-heading"><div><h2>Votre activité</h2><p>Les indicateurs clés de votre espace de gestion.</p></div><button className="period-select">30 derniers jours <ChevronDown size={14}/></button></div>
          <div className="admin-metrics">
            <article className="admin-metric"><div className="metric-label">Clients actifs <span className="metric-symbol purple"><Building2 size={17}/></span></div><div className="metric-number">{stats.clients}</div><div className="metric-trend"><span className="trend-up"><ArrowUpRight size={14}/> +2</span> ce mois-ci</div><div className="metric-spark spark-purple"><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
            <article className="admin-metric"><div className="metric-label">Demandes ouvertes <span className="metric-symbol amber"><LifeBuoy size={17}/></span></div><div className="metric-number">{stats.openTickets}</div><div className="metric-trend"><span className="trend-down"><ArrowDownRight size={14}/> -12%</span> vs mois dernier</div><div className="metric-spark spark-amber"><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
            <article className="admin-metric"><div className="metric-label">Interventions <span className="metric-symbol blue"><Activity size={17}/></span></div><div className="metric-number">{stats.interventions}</div><div className="metric-trend"><span className="trend-up"><ArrowUpRight size={14}/> +8%</span> vs mois dernier</div><div className="metric-spark spark-blue"><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
            <article className="admin-metric"><div className="metric-label">Heures prestées <span className="metric-symbol green"><Clock3 size={17}/></span></div><div className="metric-number">{stats.hours}<span className="metric-unit">h</span></div><div className="metric-trend"><span className="trend-neutral">heures enregistrées</span> dans les interventions</div><div className="hours-progress"><span/></div></article>
          </div>
          <div className="dashboard-grid">
            <section className="admin-panel requests-panel"><div className="panel-heading"><div><h3>Demandes récentes</h3><p>Suivez les dernières demandes de vos clients.</p></div><button className="text-action" onClick={() => setActive("Demandes support")}>Toutes les demandes <ChevronRight size={14}/></button></div>
              <div className="table-wrap"><table className="requests-table"><thead><tr><th>DEMANDE</th><th>CLIENT</th><th>PRIORITÉ</th><th>STATUT</th><th>REÇUE</th></tr></thead><tbody>{filteredTickets.map((ticket) => <tr key={ticket.id}><td><strong>{ticket.subject}</strong><span>{ticket.id} · {ticket.type}</span></td><td>{ticket.client}</td><td><span className={`priority priority-${ticket.priority.toLowerCase()}`}><i/>{ticket.priority}</span></td><td><span className={`ticket-status status-${ticket.status.toLowerCase().replaceAll(" ", "-")}`}>{ticket.status}</span></td><td className="received-time">{ticket.time}</td></tr>)}</tbody></table>{filteredTickets.length === 0 && <div className="empty-state">Aucune demande ne correspond à votre recherche.</div>}</div>
            </section>
            <section className="admin-panel clients-panel"><div className="panel-heading"><div><h3>Vos clients</h3><p>Vue rapide de votre portefeuille.</p></div><button className="round-action" aria-label="Voir les clients" onClick={() => setActive("Clients")}><ChevronRight size={16}/></button></div><div className="client-list">{clients.map((client) => <button className="client-row" key={client.name} onClick={() => setActive("Clients")}><div className={`client-avatar ${client.color}`}>{client.initials}</div><div className="client-details"><strong>{client.name}</strong><span>{client.plan}</span></div><span className="client-ticket-count">{client.tickets} <small>tickets</small></span></button>)}</div><button className="clients-link" onClick={() => setActive("Clients")}>Gérer les clients <ChevronRight size={14}/></button></section>
          </div>
          <div className="bottom-grid"><section className="admin-panel quick-panel"><div className="panel-heading"><div><h3>Accès rapides</h3><p>Les actions les plus utilisées.</p></div></div><div className="quick-actions"><button onClick={() => setActive("Clients")}><span className="quick-icon quick-purple"><Plus size={18}/></span><span><strong>Ajouter un client</strong><small>Créer un nouvel espace client</small></span><ChevronRight size={15}/></button><button onClick={() => setActive("Calendrier")}><span className="quick-icon quick-blue"><CalendarDays size={18}/></span><span><strong>Planifier une intervention</strong><small>Organiser le travail de l&apos;équipe</small></span><ChevronRight size={15}/></button><button onClick={() => setActive("Contrats & heures")}><span className="quick-icon quick-green"><FileText size={18}/></span><span><strong>Consulter les contrats</strong><small>Suivre les forfaits et les heures</small></span><ChevronRight size={15}/></button></div></section><section className="admin-panel activity-panel"><div className="panel-heading"><div><h3>Activité récente</h3><p>Les derniers événements de la plateforme.</p></div><button className="round-action" aria-label="Voir l'activité"><ChevronRight size={16}/></button></div><div className="activity-feed"><div className="feed-item"><span className="feed-icon feed-purple"><Plus size={14}/></span><div><strong>Nouvelle demande reçue</strong><p>Atelier Nova · Accès boîte mail</p><small>Il y a 18 minutes</small></div></div><div className="feed-item"><span className="feed-icon feed-green"><CheckCircle2 size={14}/></span><div><strong>Intervention clôturée</strong><p>Groupe Horizon · Mise à jour poste</p><small>Hier à 15:32</small></div></div></div></section></div>
          <footer className="admin-footer"><span>BN2 HUB <b>•</b> Une solution BN2 Consulting</span><span>APERÇU ADMINISTRATEUR · {dataLoaded ? "DONNÉES SUPABASE EN DIRECT" : "CHARGEMENT DES DONNÉES"}</span></footer>
        </div> : <AdminSectionView active={active}/>}
      </section>
      {showNewTicket && <div className="modal-backdrop" onClick={() => setShowNewTicket(false)}><div className="new-request-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowNewTicket(false)} aria-label="Fermer"><X size={18}/></button><div className="modal-icon"><Plus size={20}/></div><h2>Nouvelle demande</h2><p>La création des demandes est gérée depuis le module de support.</p><label>Objet de la demande<input placeholder="Ex. : Configuration Microsoft 365" disabled/></label><label>Client<select disabled><option>Sélectionner un client</option></select></label><button className="admin-primary-button modal-submit" onClick={() => setShowNewTicket(false)}>Compris</button></div></div>}
    </main>
  );
}
