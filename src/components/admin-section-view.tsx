"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
type QueueTicket = { recordId:string; organizationId:string; id:string; title:string; client:string; category:string; priority:"Haute"|"Normale"|"Basse"; status:QueueStatus; assignee:string; date:string; description:string };
const queueStatuses: QueueStatus[] = ["Nouvelle","À vérifier","En cours","En attente du client","Résolue","Fermée"];
function SupportQueue() {
 const [tickets,setTickets]=useState<QueueTicket[]>([]);
 const [filter,setFilter]=useState("Toutes");
 const [search,setSearch]=useState("");
 const [selected,setSelected]=useState("");
 const [loading,setLoading]=useState(true);
 const [message,setMessage]=useState("");
 const [messages,setMessages]=useState<string[]>([]);
 const [saving,setSaving]=useState(false);
 const current=tickets.find(ticket=>ticket.recordId===selected);
 const visible=tickets.filter(ticket=>(filter==="Toutes"||ticket.status===filter)&&[ticket.id,ticket.title,ticket.client,ticket.category].join(" ").toLowerCase().includes(search.toLowerCase()));

 useEffect(()=>{
  async function load(){
   const supabase=createClient();
   const {data,error}=await supabase.from("support_tickets").select("id,ticket_number,organization_id,title,description,category,priority,status,created_at,assigned_to,organizations(name)").order("created_at",{ascending:false});
   if(!error){
    const statusMap:Record<string,QueueStatus>={new:"Nouvelle",in_progress:"En cours",waiting_customer:"En attente du client",waiting_bn2:"À vérifier",resolved:"Résolue",closed:"Fermée"};
    const priorityMap:Record<string,QueueTicket["priority"]>={low:"Basse",normal:"Normale",high:"Haute",urgent:"Haute"};
    const rows=(data??[]).map((row:any)=>({recordId:row.id,organizationId:row.organization_id,id:row.ticket_number,title:row.title,client:Array.isArray(row.organizations)?row.organizations[0]?.name??"Client":row.organizations?.name??"Client",category:row.category,priority:priorityMap[row.priority]??"Normale",status:statusMap[row.status]??"Nouvelle",assignee:row.assigned_to??"",date:new Date(row.created_at).toLocaleString("fr-BE",{dateStyle:"short",timeStyle:"short"}),description:row.description}));
    setTickets(rows); if(rows[0]) setSelected(rows[0].recordId);
   }
   setLoading(false);
  }
  void load();
 },[]);

 useEffect(()=>{
  if(!current)return;
  createClient().from("ticket_messages").select("body,created_at,is_internal").eq("ticket_id",current.recordId).order("created_at",{ascending:true}).then(({data})=>setMessages((data??[]).map((item:any)=>item.body)));
 },[selected,current?.recordId]);

 async function updateStatus(status:QueueStatus){
  if(!current)return;setSaving(true);
  const value:Record<QueueStatus,string>={"Nouvelle":"new","À vérifier":"waiting_bn2","En cours":"in_progress","En attente du client":"waiting_customer","Résolue":"resolved","Fermée":"closed"};
  const {error}=await createClient().from("support_tickets").update({status:value[status],resolved_at:status==="Résolue"||status==="Fermée"?new Date().toISOString():null}).eq("id",current.recordId);
  if(!error)setTickets(items=>items.map(item=>item.recordId===current.recordId?{...item,status}:item));
  setSaving(false);
 }
 async function assignToMe(){
  if(!current)return;setSaving(true);
  const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();
  if(user){const {error}=await supabase.from("support_tickets").update({assigned_to:user.id,status:"in_progress"}).eq("id",current.recordId);if(!error)setTickets(items=>items.map(item=>item.recordId===current.recordId?{...item,assignee:user.id,status:"En cours"}:item));}
  setSaving(false);
 }
 async function addNote(){
  if(!current||!message.trim())return;setSaving(true);
  const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();
  if(user){const {error}=await supabase.from("ticket_messages").insert({ticket_id:current.recordId,organization_id:current.organizationId,sender_id:user.id,body:message.trim(),is_internal:true});if(!error){setMessages(items=>[...items,message.trim()]);setMessage("");}}
  setSaving(false);
 }
 return <div className="admin-content support-queue-page">
  <div className="page-heading"><div><div className="page-eyebrow">CENTRE DE SERVICES IT <span>•</span> FILE DE TRAVAIL</div><h1>Demandes support</h1><p>Les demandes réelles enregistrées dans Supabase.</p></div><span className="section-demo-label">DONNÉES EN DIRECT</span></div>
  <div className="queue-kpis"><article><small>À traiter</small><strong>{tickets.filter(t=>t.status==="Nouvelle"||t.status==="À vérifier").length.toString().padStart(2,"0")}</strong><span>Nouvelle ou à vérifier</span></article><article><small>En cours</small><strong>{tickets.filter(t=>t.status==="En cours").length.toString().padStart(2,"0")}</strong><span>Prises en charge</span></article><article><small>En attente client</small><strong>{tickets.filter(t=>t.status==="En attente du client").length.toString().padStart(2,"0")}</strong><span>Informations requises</span></article><article><small>Résolues</small><strong>{tickets.filter(t=>t.status==="Résolue").length.toString().padStart(2,"0")}</strong><span>Demandes terminées</span></article></div>
  <div className="queue-layout">
   <section className="admin-panel queue-list-panel">
    <div className="queue-list-head"><div><h3>File des demandes</h3><p>{visible.length} demande(s) affichée(s)</p></div><div className="queue-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."/></div></div>
    <div className="queue-filters"><button className={filter==="Toutes"?"active":""} onClick={()=>setFilter("Toutes")}>Toutes</button>{queueStatuses.map(status=><button key={status} className={filter===status?"active":""} onClick={()=>setFilter(status)}>{status}</button>)}</div>
    <div className="queue-ticket-list">{visible.map(ticket=><button key={ticket.recordId} className={selected===ticket.recordId?"selected":""} onClick={()=>setSelected(ticket.recordId)}><span className={"queue-priority-dot "+ticket.priority.toLowerCase()}/><span className="queue-ticket-copy"><strong>{ticket.title}</strong><small>{ticket.id} · {ticket.client}</small><span><i className={"queue-status-dot "+(ticket.status==="Résolue"?"done":ticket.status==="En cours"?"working":ticket.status==="Nouvelle"?"new":"")}/>{ticket.status} <b>·</b> {ticket.date}</span></span><ChevronRight size={15}/></button>)}{loading&&<div className="queue-empty">Chargement des demandes...</div>}{!loading&&visible.length===0&&<div className="queue-empty">Aucune demande enregistrée pour le moment.</div>}</div>
   </section>
   {current&&<section className="admin-panel queue-detail-panel">
    <div className="queue-detail-top"><span className="queue-ref">{current.id}</span><span className={"ticket-status queue-status-"+current.status.toLowerCase().replaceAll(" ","-")}>{current.status}</span></div>
    <h2>{current.title}</h2><div className="queue-meta">{current.client}<b>·</b>{current.category}<b>·</b>{current.priority}</div>
    <div className="queue-description"><p>{current.description}</p></div>
    <label className="queue-field-label">Statut<select value={current.status} disabled={saving} onChange={e=>void updateStatus(e.target.value as QueueStatus)}>{queueStatuses.map(status=><option key={status}>{status}</option>)}</select></label>
    <button className="admin-primary-button" disabled={saving} onClick={()=>void assignToMe()}><UserRound size={15}/> M&apos;attribuer cette demande</button>
    <div className="queue-notes"><h3>Notes internes</h3>{messages.map((item,index)=><p key={index}>{item}</p>)}<textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ajouter une note interne..." rows={3}/><button disabled={saving||!message.trim()} onClick={()=>void addNote()}><Send size={14}/> Ajouter la note</button></div>
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
        <div className="portal-config-heading"><div><div className="page-eyebrow">CONFIGURATION DE L&apos;ESPACE</div><h2>{current.name}</h2><p>{current.users} · {current.plan}</p></div><button className={`portal-status-toggle ${active ? "is-active" : ""}`} onClick={() => {setActive(!active);setSaved(false);}}><Power size={15}/>{active ? "Portail actif" : "Portail suspendu"}</button></div>
        <div className="portal-domain-row"><Globe size={17}/><div><small>ADRESSE DU PORTAIL</small><strong>{current.domain}</strong></div><span>SOUS-DOMAINE BN2</span></div>
        <div className="portal-module-heading"><div><h3>Modules et autorisations</h3><p>Activez uniquement les outils inclus pour cette organisation.</p></div><span>{modules.length} / {options.length}</span></div>
        <div className="portal-module-list">{options.map((item) => {const Icon=item.icon;const enabled=modules.includes(item.name);return <button key={item.name} className={`portal-module-row ${enabled ? "enabled" : ""}`} onClick={() => toggleModule(item.name)}><span className="portal-module-icon"><Icon size={17}/></span><span className="portal-module-copy"><strong>{item.name}</strong><small>{item.description}</small></span><span className={`portal-check ${enabled ? "checked" : ""}`}>{enabled && <Check size={13}/>}</span></button>;})}</div>
        <div className="portal-control-footer"><div><strong>Les changements restent locaux dans cet aperçu.</strong><small>La sauvegarde, les rôles et l&apos;application réelle seront reliés à Supabase après validation de la sécurité multi-tenant.</small></div><button className="admin-primary-button" onClick={() => setSaved(true)}><Check size={15}/> {saved ? "Aperçu enregistré" : "Enregistrer l'aperçu"}</button></div>
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
