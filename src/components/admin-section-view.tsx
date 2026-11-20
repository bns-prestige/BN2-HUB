"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check, ChevronRight, CircleAlert, Clock3, Cloud, Database, FileText, Globe, LifeBuoy, MessageSquare, Monitor, Plus, Power, Search, Send, ShieldCheck, Sparkles, UserRound, Users,
} from "lucide-react";

type Row = { cells: string[]; status?: string; priority?: string };
type Section = { intro: string; metrics: { label: string; value: string; hint: string }[]; columns: string[]; rows: Row[] };

const sections: Record<string, Section> = {
  "Portails clients": {
    intro: "Pilotez les espaces privés de vos clients : accès, modules, personnalisation et disponibilité.",
    metrics: [{label:"Portails actifs",value:"12",hint:"Espaces clients hébergés par BN2"},{label:"À configurer",value:"02",hint:"En attente de publication"},{label:"Utilisateurs",value:"38",hint:"Comptes clients actifs"}],
    columns:["Organisation","Adresse du portail","Modules","Utilisateurs","État"],
    rows:[
      {cells:["Atelier Nova","atelier-nova.bn2hub.be","6 modules","08","Actif"],status:"Actif"},
      {cells:["Groupe Horizon","groupe-horizon.bn2hub.be","5 modules","14","Actif"],status:"Actif"},
      {cells:["Cabinet Dewael","cabinet-dewael.bn2hub.be","4 modules","06","Actif"],status:"Actif"},
      {cells:["Studio Meridian","À attribuer","À configurer","—","Brouillon"],status:"Brouillon"},
    ],
  },
  Hébergement: {
    intro: "Une infrastructure centralisée, opérée et financée par BN2 Consulting pour tous les portails clients.",
    metrics: [{label:"Environnements",value:"12",hint:"Portails sur la plateforme BN2"},{label:"Disponibilité cible",value:"99,9 %",hint:"Objectif de service, non mesuré ici"},{label:"Facturation",value:"BN2",hint:"Abonnements centralisés"}],
    columns:["Service","Rôle","Gestionnaire","Facturation","État"],
    rows:[
      {cells:["Application BN2 HUB","Portails et administration","BN2 Consulting","Centralisée BN2","À déployer"],status:"À déployer"},
      {cells:["Base de données Supabase","Données isolées par organisation","BN2 Consulting","Centralisée BN2","À configurer"],status:"À configurer"},
      {cells:["Stockage documents","Fichiers et pièces jointes","BN2 Consulting","Centralisée BN2","À configurer"],status:"À configurer"},
      {cells:["DNS & domaines","Sous-domaines clients","BN2 Consulting","Centralisée BN2","À configurer"],status:"À configurer"},
    ],
  },
  "Demandes support": {
    intro: "Centralisez les demandes reçues et suivez leur traitement par l'équipe BN2.",
    metrics: [{label:"À traiter",value:"08",hint:"Demandes nouvelles"},{label:"En cours",value:"12",hint:"Prises en charge"},{label:"En attente",value:"04",hint:"Retour client requis"}],
    columns:["Référence","Demande","Client","Priorité","Statut"],
    rows:[
      {cells:["BN2-2026-0042","Accès à la boîte mail partagée","Atelier Nova","Haute","Nouvelle"],priority:"Haute",status:"Nouvelle"},
      {cells:["BN2-2026-0041","Configuration du nouvel ordinateur","Groupe Horizon","Normale","En cours"],priority:"Normale",status:"En cours"},
      {cells:["BN2-2026-0040","Ajout d&apos;un utilisateur","Cabinet Dewael","Normale","À vérifier"],priority:"Normale",status:"À vérifier"},
      {cells:["BN2-2026-0039","Problème de connexion VPN","Atelier Nova","Basse","Résolue"],priority:"Basse",status:"Résolue"},
    ],
  },
  Clients: {
    intro: "Gérez les entreprises clientes, leurs espaces privés et leurs informations de suivi.",
    metrics: [{label:"Clients actifs",value:"12",hint:"Portails en service"},{label:"En configuration",value:"02",hint:"Espaces à préparer"},{label:"Contrats à renouveler",value:"03",hint:"Dans les 60 jours"}],
    columns:["Entreprise","Contact principal","Formule","Demandes ouvertes","État"],
    rows:[
      {cells:["Atelier Nova","Julie Dupont","Support essentiel","03","Actif"],status:"Actif"},
      {cells:["Groupe Horizon","Marc Leroy","Gestion informatique","02","Actif"],status:"Actif"},
      {cells:["Cabinet Dewael","Sophie Dewael","Support essentiel","01","Actif"],status:"Actif"},
      {cells:["Studio Meridian","Thomas Bernard","À définir","—","À configurer"],status:"À configurer"},
    ],
  },
  Interventions: {
    intro: "Planifiez les interventions, assignez un technicien et conservez un historique clair.",
    metrics: [{label:"Cette semaine",value:"07",hint:"Interventions planifiées"},{label:"À confirmer",value:"02",hint:"En attente du client"},{label:"Terminées",value:"18",hint:"Ce mois-ci"}],
    columns:["Intervention","Client","Technicien","Date prévue","Statut"],
    rows:[
      {cells:["Migration Microsoft 365","Atelier Nova","Nadir","21 nov. · 10:00","Planifiée"],status:"Planifiée"},
      {cells:["Remplacement ordinateur","Groupe Horizon","Yanis","21 nov. · 14:00","Confirmée"],status:"Confirmée"},
      {cells:["Audit réseau","Cabinet Dewael","Nadir","24 nov. · 09:30","À confirmer"],status:"À confirmer"},
    ],
  },
  "Contrats & heures": {
    intro: "Suivez les formules de service, les heures incluses et les renouvellements.",
    metrics: [{label:"Contrats actifs",value:"12",hint:"Clients sous contrat"},{label:"Heures consommées",value:"36 h",hint:"Sur 48 h incluses"},{label:"Renouvellements",value:"03",hint:"À surveiller"}],
    columns:["Client","Formule","Heures incluses","Consommées","Renouvellement"],
    rows:[
      {cells:["Atelier Nova","Support essentiel","8 h / mois","5,5 h","01 déc. 2026"]},
      {cells:["Groupe Horizon","Gestion informatique","16 h / mois","12 h","15 janv. 2027"]},
      {cells:["Cabinet Dewael","Support essentiel","8 h / mois","3 h","01 fév. 2027"]},
    ],
  },
  "Parc informatique": {
    intro: "Inventoriez les équipements, licences et ressources suivis pour chaque client.",
    metrics: [{label:"Équipements",value:"86",hint:"Dans le parc"},{label:"Sous surveillance",value:"04",hint:"À vérifier"},{label:"Licences",value:"124",hint:"Référencées"}],
    columns:["Équipement","Client","Type","Dernier contrôle","État"],
    rows:[
      {cells:["AN-LT-014 · Dell Latitude","Atelier Nova","Ordinateur","18 nov. 2026","Opérationnel"],status:"Opérationnel"},
      {cells:["GH-SRV-002 · Serveur","Groupe Horizon","Serveur","17 nov. 2026","À surveiller"],status:"À surveiller"},
      {cells:["CD-NET-001 · Firewall","Cabinet Dewael","Réseau","15 nov. 2026","Opérationnel"],status:"Opérationnel"},
    ],
  },
  Calendrier: {
    intro: "Visualisez les rendez-vous, interventions et échéances de l'activité BN2.",
    metrics: [{label:"Aujourd'hui",value:"02",hint:"Événements prévus"},{label:"Cette semaine",value:"07",hint:"Rendez-vous"},{label:"À planifier",value:"03",hint:"Demandes en attente"}],
    columns:["Horaire","Événement","Client","Responsable","Type"],
    rows:[
      {cells:["10:00 – 11:00","Migration Microsoft 365","Atelier Nova","Nadir","Intervention"]},
      {cells:["14:00 – 15:00","Remplacement ordinateur","Groupe Horizon","Yanis","Intervention"]},
      {cells:["16:30 – 17:00","Point de suivi mensuel","Cabinet Dewael","Nadir","Rendez-vous"]},
    ],
  },
  "Équipe BN2": {
    intro: "Gérez les membres de l'équipe, leurs responsabilités et leur charge de travail.",
    metrics: [{label:"Membres",value:"04",hint:"Comptes internes"},{label:"Disponibles",value:"03",hint:"Aujourd'hui"},{label:"Interventions assignées",value:"09",hint:"En cours ou prévues"}],
    columns:["Collaborateur","Rôle","Interventions","Dernière activité","Accès"],
    rows:[
      {cells:["Nadir Saâdi","Administrateur","05","Aujourd'hui · 11:42","Propriétaire"],status:"Actif"},
      {cells:["Yanis Martin","Technicien support","03","Aujourd'hui · 10:18","Actif"],status:"Actif"},
      {cells:["Sarah Benali","Support client","01","Hier · 16:05","Actif"],status:"Actif"},
    ],
  },
  Documents: {
    intro: "Retrouvez les contrats, rapports d&apos;intervention et documents partagés.",
    metrics: [{label:"Documents",value:"48",hint:"Bibliothèque BN2"},{label:"À valider",value:"03",hint:"En attente de revue"},{label:"Partagés",value:"16",hint:"Avec les clients"}],
    columns:["Document","Client","Catégorie","Dernière mise à jour","État"],
    rows:[
      {cells:["Contrat de support 2026","Atelier Nova","Contrat","18 nov. 2026","Validé"],status:"Validé"},
      {cells:["Rapport audit réseau","Cabinet Dewael","Rapport","17 nov. 2026","À valider"],status:"À valider"},
      {cells:["Inventaire matériel","Groupe Horizon","Inventaire","14 nov. 2026","Validé"],status:"Validé"},
    ],
  },
};

const settings = [
  {icon:ShieldCheck,title:"Sécurité & accès",text:"Rôles, autorisations et politiques d&apos;accès",tag:"Prioritaire"},
  {icon:Users,title:"Gestion des utilisateurs",text:"Comptes administrateurs et membres BN2",tag:"Configuration"},
  {icon:Sparkles,title:"Assistant IA",text:"Modèle, instructions et sources autorisées",tag:"À configurer"},
  {icon:FileText,title:"Modèles de documents",text:"Contrats, rapports et modèles PDF",tag:"Configuration"},
  {icon:ShieldCheck,title:"Hébergement & infrastructure",text:"Domaines, stockage, sauvegardes et disponibilité",tag:"Infrastructure"},
];

type QueueStatus = "Nouvelle" | "À vérifier" | "En cours" | "En attente du client" | "Résolue" | "Fermée";
type QueueTicket = { id:string; title:string; client:string; category:string; priority:"Haute"|"Normale"|"Basse"; status:QueueStatus; assignee:string; date:string; description:string };
const queueSeed: QueueTicket[] = [
 {id:"BN2-2026-0042",title:"Accès à la boîte mail partagée",client:"Atelier Nova",category:"Microsoft 365",priority:"Haute",status:"Nouvelle",assignee:"Non attribuée",date:"Aujourd'hui · 09:42",description:"L'équipe ne parvient plus à ouvrir la boîte mail partagée info@atelier-nova.be depuis Outlook. Le problème touche deux collaborateurs."},
 {id:"BN2-2026-0041",title:"Configuration du nouvel ordinateur",client:"Groupe Horizon",category:"Matériel",priority:"Normale",status:"En cours",assignee:"Yanis Martin",date:"Hier · 16:18",description:"Préparer le nouvel ordinateur portable et installer les applications nécessaires pour le nouveau collaborateur."},
 {id:"BN2-2026-0040",title:"Ajout d&apos;un utilisateur",client:"Cabinet Dewael",category:"Comptes & accès",priority:"Normale",status:"À vérifier",assignee:"Sarah Benali",date:"Hier · 11:06",description:"Créer un compte professionnel et donner accès aux dossiers partagés du cabinet."},
 {id:"BN2-2026-0039",title:"Problème de connexion VPN",client:"Atelier Nova",category:"Réseau",priority:"Basse",status:"En attente du client",assignee:"Nadir Saâdi",date:"18 nov. · 14:20",description:"La connexion VPN se coupe après quelques minutes. Des informations complémentaires ont été demandées au client."},
 {id:"BN2-2026-0038",title:"Mise à jour des postes",client:"Groupe Horizon",category:"Maintenance",priority:"Basse",status:"Résolue",assignee:"Yanis Martin",date:"17 nov. · 10:15",description:"Installation des mises à jour de sécurité sur les postes utilisateurs."},
];
const queueStatuses: QueueStatus[] = ["Nouvelle","À vérifier","En cours","En attente du client","Résolue","Fermée"];
function SupportQueue() {
 const [tickets,setTickets]=useState(queueSeed);
 const [filter,setFilter]=useState("Toutes");
 const [search,setSearch]=useState("");
 const [selected,setSelected]=useState(queueSeed[0].id);
 const [assignee,setAssignee]=useState("Non attribuée");
 const [note,setNote]=useState("");
 const [notes,setNotes]=useState<string[]>([]);
 const current=tickets.find((ticket)=>ticket.id===selected) ?? tickets[0];
 const visible=tickets.filter((ticket)=>(filter==="Toutes"||ticket.status===filter)&&[ticket.id,ticket.title,ticket.client,ticket.category].join(" ").toLowerCase().includes(search.toLowerCase()));
 const updateStatus=(status:QueueStatus)=>setTickets(items=>items.map(ticket=>ticket.id===selected?{...ticket,status}:ticket));
 const updateAssignee=(value:string)=>{setAssignee(value);setTickets(items=>items.map(ticket=>ticket.id===selected?{...ticket,assignee:value}:ticket));};
 const addNote=()=>{if(!note.trim())return;setNotes(items=>[note.trim(),...items]);setNote("");};
 return <div className="admin-content support-queue-page">
  <div className="page-heading"><div><div className="page-eyebrow">CENTRE DE SERVICES IT <span>•</span> FILE DE TRAVAIL</div><h1>Demandes support</h1><p>Centralisez les demandes de vos clients et pilotez leur résolution par votre équipe.</p></div><span className="section-demo-label">APERÇU INTERACTIF · NON CONNECTÉ</span></div>
  <div className="queue-kpis"><article><small>À traiter</small><strong>{tickets.filter(t=>t.status==="Nouvelle"||t.status==="À vérifier").length.toString().padStart(2,"0")}</strong><span>Nouvelle ou à vérifier</span></article><article><small>En cours</small><strong>{tickets.filter(t=>t.status==="En cours").length.toString().padStart(2,"0")}</strong><span>Prises en charge</span></article><article><small>En attente client</small><strong>{tickets.filter(t=>t.status==="En attente du client").length.toString().padStart(2,"0")}</strong><span>Informations requises</span></article><article><small>Résolues</small><strong>{tickets.filter(t=>t.status==="Résolue").length.toString().padStart(2,"0")}</strong><span>Demandes clôturées</span></article></div>
  <div className="queue-layout">
   <section className="admin-panel queue-list-panel">
    <div className="queue-list-head"><div><h3>File des demandes</h3><p>{visible.length} demande(s) affichée(s)</p></div><div className="queue-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."/></div></div>
    <div className="queue-filters"><button className={filter==="Toutes"?"active":""} onClick={()=>setFilter("Toutes")}>Toutes</button>{queueStatuses.map(status=><button key={status} className={filter===status?"active":""} onClick={()=>setFilter(status)}>{status}</button>)}</div>
    <div className="queue-ticket-list">{visible.map(ticket=><button key={ticket.id} className={selected===ticket.id?"selected":""} onClick={()=>{setSelected(ticket.id);setAssignee(ticket.assignee);}}><span className={`queue-priority-dot ${ticket.priority.toLowerCase()}`}/><span className="queue-ticket-copy"><strong>{ticket.title}</strong><small>{ticket.id} · {ticket.client}</small><span><i className={`queue-status-dot ${ticket.status==="Résolue"?"done":ticket.status==="En cours"?"working":ticket.status==="Nouvelle"?"new":""}`}/>{ticket.status} <b>·</b> {ticket.date}</span></span><ChevronRight size={15}/></button>)}{visible.length===0&&<div className="queue-empty">Aucune demande pour ce filtre.</div>}</div>
   </section>
   {current&&<section className="admin-panel queue-detail-panel">
    <div className="queue-detail-top"><span className="queue-ref">{current.id}</span><span className={`ticket-status queue-status-${current.status.toLowerCase().replaceAll(" ","-")}`}>{current.status}</span></div>
    <h2>{current.title}</h2><div className="queue-meta">{current.client}<b>·</b>{current.category}<b>·</b><span className={`priority priority-${current.priority.toLowerCase()}`}>{current.priority}</span></div>
    <div className="queue-detail-block"><small>DESCRIPTION DU CLIENT</small><p>{current.description}</p></div>
    <div className="queue-field"><label htmlFor="queue-status">Statut de la demande</label><select id="queue-status" value={current.status} onChange={e=>updateStatus(e.target.value as QueueStatus)}>{queueStatuses.map(status=><option key={status}>{status}</option>)}</select></div>
    <div className="queue-field"><label htmlFor="queue-assignee">Technicien responsable</label><select id="queue-assignee" value={assignee} onChange={e=>updateAssignee(e.target.value)}><option>Non attribuée</option><option>Nadir Saâdi</option><option>Yanis Martin</option><option>Sarah Benali</option></select></div>
    <div className="queue-conversation"><div className="queue-conversation-head"><h3><MessageSquare size={15}/> Notes internes</h3><span>{notes.length} note(s)</span></div>{notes.map((item,index)=><div className="queue-note" key={index}><strong>Administrateur BN2</strong><p>{item}</p></div>)}<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Ajouter une note interne..." rows={3}/><button className="admin-primary-button" onClick={addNote} disabled={!note.trim()}><Send size={14}/> Ajouter une note</button></div>
    <div className="queue-detail-foot"><span><UserRound size={14}/> {current.assignee}</span><span><Clock3 size={14}/> {current.date}</span></div>
   </section>}
  </div>
 </div>;
}

function ClientPortalControl() {
  const [client, setClient] = useState("Atelier Nova");
  const [active, setActive] = useState(true);
  const [modules, setModules] = useState(["Support", "Parc informatique", "Documents", "Microsoft 365"]);
  const [saved, setSaved] = useState(false);
  const clients = [
    { name: "Atelier Nova", domain: "atelier-nova.bn2hub.be", users: "8 utilisateurs", plan: "Support essentiel" },
    { name: "Groupe Horizon", domain: "groupe-horizon.bn2hub.be", users: "14 utilisateurs", plan: "Gestion informatique" },
    { name: "Cabinet Dewael", domain: "cabinet-dewael.bn2hub.be", users: "6 utilisateurs", plan: "Support essentiel" },
  ];
  const current = clients.find((item) => item.name === client) ?? clients[0];
  const options = [
    { name: "Support", description: "Tickets et échanges avec BN2", icon: LifeBuoy },
    { name: "Parc informatique", description: "Matériel, appareils et licences", icon: Monitor },
    { name: "Documents", description: "Contrats et fichiers partagés", icon: FileText },
    { name: "Microsoft 365", description: "Comptes et services cloud", icon: Cloud },
    { name: "Utilisateurs", description: "Comptes et permissions client", icon: Users },
  ];
  function toggleModule(name: string) {
    setSaved(false);
    setModules((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name]);
  }
  return <div className="admin-content admin-section-content">
    <div className="page-heading"><div><div className="page-eyebrow">BN2 HUB <span>•</span> GESTION MULTI-CLIENT</div><h1>Centre de contrôle client</h1><p>Configurez les accès et les fonctionnalités de chaque portail depuis BN2 HUB.</p></div><span className="section-demo-label">MODE APERÇU · NON PUBLIÉ</span></div>
    <div className="portal-control-layout">
      <section className="admin-panel portal-client-list"><div className="panel-heading"><div><h3>Organisations</h3><p>Sélectionnez un espace client.</p></div><span className="section-record-count">3 clients</span></div>
        {clients.map((item) => <button key={item.name} className={`portal-client-choice ${client === item.name ? "selected" : ""}`} onClick={() => {setClient(item.name);setSaved(false);}}>
          <span className="portal-client-avatar">{item.name.split(" ").map((word) => word[0]).join("").slice(0,2)}</span><span className="portal-client-copy"><strong>{item.name}</strong><small>{item.plan}</small></span><ChevronRight size={16}/>
        </button>)}
      </section>
      <section className="admin-panel portal-config-panel">
        <div className="portal-config-heading"><div><div className="page-eyebrow">CONFIGURATION DE L'ESPACE</div><h2>{current.name}</h2><p>{current.users} · {current.plan}</p></div><button className={`portal-status-toggle ${active ? "is-active" : ""}`} onClick={() => {setActive(!active);setSaved(false);}}><Power size={15}/>{active ? "Portail actif" : "Portail suspendu"}</button></div>
        <div className="portal-domain-row"><Globe size={17}/><div><small>ADRESSE DU PORTAIL</small><strong>{current.domain}</strong></div><span>SOUS-DOMAINE BN2</span></div>
        <div className="portal-module-heading"><div><h3>Modules et autorisations</h3><p>Activez uniquement les outils inclus pour cette organisation.</p></div><span>{modules.length} / {options.length}</span></div>
        <div className="portal-module-list">{options.map((item) => {const Icon=item.icon;const enabled=modules.includes(item.name);return <button key={item.name} className={`portal-module-row ${enabled ? "enabled" : ""}`} onClick={() => toggleModule(item.name)}><span className="portal-module-icon"><Icon size={17}/></span><span className="portal-module-copy"><strong>{item.name}</strong><small>{item.description}</small></span><span className={`portal-check ${enabled ? "checked" : ""}`}>{enabled && <Check size={13}/>}</span></button>;})}</div>
        <div className="portal-control-footer"><div><strong>Les changements restent locaux dans cet aperçu.</strong><small>La sauvegarde, les rôles et l'application réelle seront reliés à Supabase après validation de la sécurité multi-tenant.</small></div><button className="admin-primary-button" onClick={() => setSaved(true)}><Check size={15}/> {saved ? "Aperçu enregistré" : "Enregistrer l'aperçu"}</button></div>
      </section>
    </div>
    <div className="section-info-grid"><div className="admin-panel section-info-card"><div className="section-info-icon"><ShieldCheck size={17}/></div><div><strong>Isolation par organisation</strong><p>Chaque client aura ses propres données, membres et permissions, protégés par les règles RLS.</p></div></div><div className="admin-panel section-info-card"><div className="section-info-icon"><Database size={17}/></div><div><strong>Infrastructure mutualisée</strong><p>Une seule plateforme BN2 HUB, avec des espaces isolés et des sous-domaines dédiés par client.</p></div></div></div>
  </div>;
}

export default function AdminSectionView({ active }: { active: string }) {
  if (active === "Demandes support") return <SupportQueue />;
  if (active === "Portails clients") return <ClientPortalControl />;
  const data = sections[active];
  if (!data) {
    return <div className="admin-content admin-section-content">
      <div className="page-heading"><div><div className="page-eyebrow">BN2 HUB ADMIN · CONFIGURATION</div><h1>Paramètres</h1><p>Configurez les règles de fonctionnement de votre espace administrateur.</p></div></div>
      <div className="admin-settings-grid">{settings.map((item) => {const Icon=item.icon;return <article className="admin-panel settings-card" key={item.title}><span className="settings-card-icon"><Icon size={19}/></span><span className="settings-card-tag">{item.tag}</span><h3>{item.title}</h3><p>{item.text}</p><button type="button" disabled>Configurer <ChevronRight size={14}/></button></article>;})}</div>
      <div className="admin-panel settings-security-note"><ShieldCheck size={18}/><div><strong>Les réglages sensibles seront protégés par des permissions administrateur.</strong><p>Les modifications d&apos;accès et de sécurité seront journalisées et devront être confirmées.</p></div></div>
    </div>;
  }
  return <div className="admin-content admin-section-content">
    <div className="page-heading"><div><div className="page-eyebrow">BN2 HUB <span>•</span> ESPACE ADMINISTRATEUR</div><h1>{active}</h1><p>{data.intro}</p></div>{active === "Clients" || active === "Portails clients" ? <Link className="admin-primary-button" href="/client-builder"><Plus size={16}/> Créer un espace client</Link> : <div className="section-demo-label">{active === "Hébergement" ? "INFRASTRUCTURE À CONFIGURER" : "DONNÉES DE DÉMONSTRATION"}</div>}</div>
    <div className="section-metrics">{data.metrics.map((metric) => <article className="admin-panel section-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.hint}</small></article>)}</div>
    <section className="admin-panel section-table-panel"><div className="panel-heading"><div><h3>{active === "Clients" ? "Portefeuille clients" : active === "Demandes support" ? "File des demandes" : "Liste et suivi"}</h3><p>Vue de démonstration pour préparer la connexion aux données réelles.</p></div><span className="section-record-count">{data.rows.length} éléments</span></div>
      <div className="table-wrap"><table className="requests-table section-data-table"><thead><tr>{data.columns.map((column) => <th key={column}>{column.toUpperCase()}</th>)}</tr></thead><tbody>{data.rows.map((row,index)=><tr key={index}>{row.cells.map((cell,i)=><td key={i}>{i===0?<strong>{cell}</strong>:cell}{i===0 && active!=="Demandes support" && <span>{active === "Clients" ? "Organisation cliente" : "Référence de suivi"}</span>}</td>)}</tr>)}</tbody></table></div>
    </section>
    <div className="section-info-grid"><div className="admin-panel section-info-card"><div className="section-info-icon"><Clock3 size={17}/></div><div><strong>Historique centralisé</strong><p>Les actions seront historisées par utilisateur et par organisation.</p></div></div><div className="admin-panel section-info-card"><div className="section-info-icon"><CircleAlert size={17}/></div><div><strong>Connexion métier à finaliser</strong><p>Ces exemples seront remplacés par les données Supabase après validation du schéma et des règles RLS.</p></div></div></div>
  </div>;
}
