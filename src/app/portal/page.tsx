"use client";

import "./portal.css";

import { useMemo, useState } from "react";
import {
  ArrowRight, Bell, BookOpen, CheckCircle2, ChevronDown, ChevronRight, Clock3,
  FileText, HelpCircle, Home, LifeBuoy, LogOut, Menu, Monitor, Network,
  Plus, Search, Send, ShieldCheck, Smartphone, Wifi, X,
} from "lucide-react";

type RequestItem = {
  id: string;
  title: string;
  category: string;
  status: "Nouvelle" | "En cours" | "En attente" | "Résolue";
  priority: "Basse" | "Normale" | "Haute";
  date: string;
  detail: string;
};

const initialRequests: RequestItem[] = [
  { id: "BN2-2026-0042", title: "Accès à la boîte mail partagée", category: "Microsoft 365", status: "En cours", priority: "Haute", date: "Aujourd'hui · 09:42", detail: "Impossible d'ouvrir la boîte info@atelier-nova.be depuis Outlook." },
  { id: "BN2-2026-0039", title: "Problème de connexion VPN", category: "Réseau & accès", status: "En attente", priority: "Normale", date: "18 novembre · 14:20", detail: "La connexion VPN se coupe après quelques minutes." },
  { id: "BN2-2026-0034", title: "Installation d'une imprimante", category: "Matériel", status: "Résolue", priority: "Basse", date: "15 novembre · 11:05", detail: "Installation de l'imprimante réseau sur le nouveau poste." },
];

const categories = [
  { label: "Ordinateur & matériel", icon: Monitor, description: "PC, écran, imprimante, périphériques" },
  { label: "Comptes & accès", icon: ShieldCheck, description: "Mot de passe, utilisateur, permissions" },
  { label: "Microsoft 365", icon: FileText, description: "Outlook, Teams, OneDrive, SharePoint" },
  { label: "Réseau & connexion", icon: Wifi, description: "Wi-Fi, VPN, Internet, réseau local" },
  { label: "Téléphonie", icon: Smartphone, description: "Smartphone, téléphone, configuration" },
  { label: "Autre demande", icon: HelpCircle, description: "Question ou demande générale" },
];

const statusClass: Record<RequestItem["status"], string> = {
  Nouvelle: "new", "En cours": "progress", "En attente": "waiting", Résolue: "resolved",
};

export default function ClientPortalPage() {
  const [section, setSection] = useState("Accueil");
  const [requests, setRequests] = useState(initialRequests);
  const [selected, setSelected] = useState(initialRequests[0].id);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Ordinateur & matériel");
  const [priority, setPriority] = useState("Normale");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const filtered = useMemo(() => requests.filter((request) =>
    [request.id, request.title, request.category].join(" ").toLowerCase().includes(search.toLowerCase())
  ), [requests, search]);
  const selectedRequest = requests.find((request) => request.id === selected) ?? requests[0];
  const openCount = requests.filter((request) => request.status !== "Résolue").length;

  function createRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const next: RequestItem = {
      id: `BN2-2026-${String(43 + requests.length - initialRequests.length).padStart(4, "0")}`,
      title: title.trim(),
      category,
      status: "Nouvelle",
      priority: priority as RequestItem["priority"],
      date: "À l'instant",
      detail: description.trim(),
    };
    setRequests((items) => [next, ...items]);
    setSelected(next.id);
    setTitle("");
    setDescription("");
    setSuccess("Votre demande a été ajoutée à cet aperçu. Elle n'a pas encore été envoyée à BN2.");
    setSection("Mes demandes");
  }

  const nav = [
    { label: "Accueil", icon: Home },
    { label: "Mes demandes", icon: LifeBuoy, count: String(openCount) },
    { label: "Nouvelle demande", icon: Plus },
    { label: "Parc informatique", icon: Monitor },
    { label: "Guides & aide", icon: BookOpen },
  ];

  return (
    <main className="client-portal">
      <aside className={`client-sidebar ${mobileMenu ? "is-open" : ""}`}>
        <div className="client-brand"><div className="client-brand-mark">BN2</div><div><strong>BN2 <span>HUB</span></strong><small>CENTRE DE SERVICES IT</small></div><button className="client-mobile-close" onClick={() => setMobileMenu(false)} aria-label="Fermer le menu"><X size={18}/></button></div>
        <div className="client-org-switch"><div className="client-org-avatar">AN</div><div><strong>Atelier Nova</strong><small>Portail entreprise</small></div><ChevronDown size={15}/></div>
        <div className="client-nav-label">ESPACE CLIENT</div>
        <nav className="client-nav" aria-label="Navigation du portail client">
          {nav.map((item) => { const Icon = item.icon; return <button key={item.label} className={section === item.label ? "active" : ""} onClick={() => {setSection(item.label);setMobileMenu(false);setSuccess("");}}><Icon size={17}/><span>{item.label}</span>{item.count && <small>{item.count}</small>}</button>; })}
        </nav>
        <div className="client-sidebar-bottom"><div className="client-help-card"><div className="client-help-icon"><HelpCircle size={17}/></div><strong>Besoin d&apos;aide ?</strong><p>Notre équipe informatique est là pour vous accompagner.</p><button onClick={() => setSection("Nouvelle demande")}>Contacter BN2 <ArrowRight size={14}/></button></div><div className="client-profile"><div className="client-profile-avatar">JD</div><div><strong>Julie Dupont</strong><small>Administratrice</small></div><button aria-label="Options du compte"><LogOut size={15}/></button></div></div>
      </aside>

      <section className="client-main">
        <header className="client-topbar"><div className="client-top-left"><button className="client-mobile-menu" onClick={() => setMobileMenu(true)} aria-label="Ouvrir le menu"><Menu size={20}/></button><div className="client-breadcrumb">Atelier Nova <ChevronRight size={14}/><strong>{section}</strong></div></div><div className="client-top-actions"><span className="client-service-status"><i/> Support BN2 disponible</span><button className="client-bell" aria-label="Notifications"><Bell size={18}/><i/></button><div className="client-top-avatar">JD</div></div></header>
        <div className="client-content">
          {success && <div className="client-notice"><CheckCircle2 size={17}/><span>{success}</span><button onClick={() => setSuccess("")} aria-label="Fermer"><X size={15}/></button></div>}
          {section === "Accueil" && <>
            <div className="client-welcome"><div><div className="client-eyebrow">VOTRE ESPACE INFORMATIQUE</div><h1>Bonjour Julie <span>👋</span></h1><p>Bienvenue dans votre centre de services IT. Comment pouvons-nous vous aider aujourd&apos;hui ?</p></div><button className="client-primary" onClick={() => setSection("Nouvelle demande")}><Plus size={17}/> Faire une demande</button></div>
            <div className="client-hero"><div className="client-hero-copy"><span>BN2 CONSULTING · SUPPORT IT</span><h2>Votre informatique,<br/>en toute tranquillité.</h2><p>Un seul endroit pour signaler un problème, demander de l'aide et suivre les interventions de notre équipe.</p><button onClick={() => setSection("Nouvelle demande")}>Contacter le support <ArrowRight size={15}/></button></div><div className="client-hero-art"><div className="client-art-orbit orbit-a"/><div className="client-art-orbit orbit-b"/><div className="client-art-device"><div className="client-art-device-top"><i/><i/><i/></div><div className="client-art-shield"><ShieldCheck size={38}/></div><div className="client-art-line"/><div className="client-art-line short"/></div></div></div>
            <div className="client-stat-grid"><article><span className="client-stat-icon blue"><LifeBuoy size={17}/></span><small>Demandes ouvertes</small><strong>{openCount.toString().padStart(2,"0")}</strong><em>En cours de traitement</em></article><article><span className="client-stat-icon green"><CheckCircle2 size={17}/></span><small>Demandes résolues</small><strong>{requests.filter((r) => r.status === "Résolue").length.toString().padStart(2,"0")}</strong><em>Historique de vos demandes</em></article><article><span className="client-stat-icon violet"><Clock3 size={17}/></span><small>Support</small><strong>BN2</strong><em>Votre équipe informatique</em></article></div>
            <div className="client-section-heading"><div><h2>Que souhaitez-vous faire ?</h2><p>Choisissez le type de demande qui correspond à votre besoin.</p></div><button onClick={() => setSection("Nouvelle demande")}>Toutes les demandes <ChevronRight size={15}/></button></div>
            <div className="client-category-grid">{categories.map((item) => {const Icon=item.icon;return <button key={item.label} onClick={() => {setCategory(item.label);setSection("Nouvelle demande");}}><span><Icon size={19}/></span><strong>{item.label}</strong><small>{item.description}</small><ChevronRight size={15}/></button>;})}</div>
            <div className="client-section-heading recent-heading"><div><h2>Dernières demandes</h2><p>Gardez un œil sur les échanges en cours avec BN2.</p></div><button onClick={() => setSection("Mes demandes")}>Voir tout <ChevronRight size={15}/></button></div>
            <div className="client-request-list">{requests.slice(0,3).map((request) => <button key={request.id} onClick={() => {setSelected(request.id);setSection("Mes demandes");}}><span className="client-request-icon"><FileText size={17}/></span><span className="client-request-main"><strong>{request.title}</strong><small>{request.id} · {request.category}</small></span><span className={`client-status-pill ${statusClass[request.status]}`}>{request.status}</span><span className="client-request-date">{request.date}</span><ChevronRight size={15}/></button>)}</div>
          </>}

          {section === "Nouvelle demande" && <><div className="client-page-heading"><div className="client-eyebrow">CENTRE DE SERVICES · NOUVEAU TICKET</div><h1>Comment pouvons-nous vous aider ?</h1><p>Décrivez votre besoin. Notre équipe BN2 prendra le relais.</p></div><div className="client-form-layout"><form className="client-request-form" onSubmit={createRequest}><div className="client-form-section"><div><h2>Votre demande</h2><p>Les champs marqués d'un astérisque sont obligatoires.</p></div><label>Type de demande <select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <option key={item.label}>{item.label}</option>)}</select></label><label>Objet de la demande * <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. : Je n'arrive plus à accéder à Outlook" required maxLength={120}/></label><label>Description * <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez le problème, ce que vous essayez de faire et le message d&apos;erreur éventuel..." rows={6} required maxLength={3000}/><small>Évitez de communiquer vos mots de passe ou informations confidentielles.</small></label><label>Priorité <select value={priority} onChange={(e) => setPriority(e.target.value)}><option>Basse</option><option>Normale</option><option>Haute</option></select></label><button className="client-primary client-submit" type="submit"><Send size={16}/> Envoyer la demande</button><small className="client-demo-disclaimer">Aperçu de démonstration : les demandes ne sont pas encore transmises à BN2.</small></div></form><aside className="client-form-aside"><div className="client-aside-icon"><ShieldCheck size={21}/></div><h3>Votre équipe IT BN2</h3><p>Chaque demande est centralisée et suivie par notre équipe afin de vous apporter une réponse claire.</p><ul><li><CheckCircle2 size={15}/> Suivi de votre demande</li><li><CheckCircle2 size={15}/> Échanges avec le technicien</li><li><CheckCircle2 size={15}/> Historique conservé</li></ul><div className="client-aside-note"><Clock3 size={15}/><span>Les délais de prise en charge dépendent de votre contrat et de la priorité du problème.</span></div></aside></div></>}

          {section === "Mes demandes" && <><div className="client-page-heading"><div className="client-eyebrow">SUIVI & HISTORIQUE</div><h1>Mes demandes</h1><p>Retrouvez les demandes adressées à votre équipe informatique BN2.</p></div><div className="client-request-workspace"><div className="client-request-list-panel"><div className="client-list-toolbar"><div className="client-search"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une demande..."/></div><span>{filtered.length} demandes</span></div>{filtered.map((request) => <button key={request.id} className={selected === request.id ? "selected" : ""} onClick={() => setSelected(request.id)}><span className="client-request-icon"><FileText size={17}/></span><span className="client-request-main"><strong>{request.title}</strong><small>{request.id} · {request.category}</small></span><span className={`client-status-pill ${statusClass[request.status]}`}>{request.status}</span><span className="client-request-date">{request.date}</span></button>)}{filtered.length===0 && <div className="client-empty">Aucune demande trouvée.</div>}</div>{selectedRequest && <article className="client-request-detail"><div className="client-detail-top"><span className="client-eyebrow">{selectedRequest.id}</span><span className={`client-status-pill ${statusClass[selectedRequest.status]}`}>{selectedRequest.status}</span></div><h2>{selectedRequest.title}</h2><p className="client-detail-meta">{selectedRequest.category} · {selectedRequest.date}</p><div className="client-detail-block"><small>DESCRIPTION</small><p>{selectedRequest.detail}</p></div><div className="client-timeline"><div className="client-timeline-dot"/><div><strong>Demande enregistrée</strong><small>{selectedRequest.date}</small></div></div><div className="client-detail-footer"><span>Besoin d&apos;ajouter une information ?</span><button onClick={() => setSection("Nouvelle demande")}>Contacter BN2 <ArrowRight size={14}/></button></div></article>}</div></>}

          {section === "Parc informatique" && <><div className="client-page-heading"><div className="client-eyebrow">VOTRE ENVIRONNEMENT</div><h1>Parc informatique</h1><p>Retrouvez les équipements et services suivis par BN2 pour votre organisation.</p></div><div className="client-placeholder-grid"><article><Monitor size={20}/><strong>Ordinateurs & périphériques</strong><p>Inventaire des postes et équipements associés à votre entreprise.</p><span>Module à connecter</span></article><article><Network size={20}/><strong>Réseau & infrastructure</strong><p>Informations de suivi sur vos équipements réseau et services.</p><span>Module à connecter</span></article><article><ShieldCheck size={20}/><strong>Comptes & licences</strong><p>Suivi des accès et licences professionnelles.</p><span>Module à connecter</span></article></div></>}

          {section === "Guides & aide" && <><div className="client-page-heading"><div className="client-eyebrow">CENTRE D'AIDE</div><h1>Guides & assistance</h1><p>Des ressources simples pour vous aider au quotidien.</p></div><div className="client-placeholder-grid"><article><BookOpen size={20}/><strong>Guides Microsoft 365</strong><p>Outlook, Teams, OneDrive et bonnes pratiques.</p><span>Contenu à préparer</span></article><article><ShieldCheck size={20}/><strong>Sécurité informatique</strong><p>Conseils pour protéger vos comptes et vos appareils.</p><span>Contenu à préparer</span></article><article><LifeBuoy size={20}/><strong>Contacter le support</strong><p>Une question qui ne trouve pas sa réponse ?</p><button onClick={() => setSection("Nouvelle demande")}>Créer une demande <ArrowRight size={14}/></button></article></div></>}
          <footer className="client-footer"><span>BN2 HUB <b>•</b> Votre centre de services IT</span><span>UNE SOLUTION BN2 CONSULTING</span></footer>
        </div>
      </section>
    </main>
  );
}
