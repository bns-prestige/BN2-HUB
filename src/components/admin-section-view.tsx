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
 const [clients,setClients]=useState<any[]>([]);
 const [loading,setLoading]=useState(true);
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [sector,setSector]=useState("Services professionnels");
 const [description,setDescription]=useState("");
 const [error,setError]=useState("");
 const [saving,setSaving]=useState(false);
 const [selectedOrganizationId,setSelectedOrganizationId]=useState("");
 const [memberEmail,setMemberEmail]=useState("");
 const [memberName,setMemberName]=useState("");
 const [memberRole,setMemberRole]=useState("member");
 const [inviting,setInviting]=useState(false);
 const [inviteMessage,setInviteMessage]=useState("");
 const [inviteError,setInviteError]=useState("");
 const [invitationUrl,setInvitationUrl]=useState("");

 async function load(){
  setLoading(true);
  const {data,error}=await createClient().from("organizations").select("id,name,slug,sector,description,contact_email,status,created_at,enabled_modules").order("created_at",{ascending:false});
  if(error)setError(error.message);else{setClients(data??[]);if(!selectedOrganizationId&&data?.[0])setSelectedOrganizationId(data[0].id);}
  setLoading(false);
 }
 useEffect(()=>{void load();},[]);

 async function createOrganization(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");setSaving(true);
  const slug=name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const {data,error}=await createClient().from("organizations").insert({name:name.trim(),slug,sector,description:description.trim()||null,contact_email:email.trim()||null,status:"onboarding"}).select("id").single();
  if(error)setError(error.message);else{setName("");setEmail("");setDescription("");setSelectedOrganizationId(data.id);await load();}
  setSaving(false);
 }
 async function updateStatus(id:string,status:string){
  const {error}=await createClient().from("organizations").update({status}).eq("id",id);
  if(error)setError(error.message);else setClients(items=>items.map(item=>item.id===id?{...item,status}:item));
 }
 async function inviteMember(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setInviteError("");setInviteMessage("");setInvitationUrl("");setInviting(true);
  try{
   const supabase=createClient();
   const {data:{session}}=await supabase.auth.getSession();
   if(!session)throw new Error("Session expirée. Reconnectez-vous.");
   const apiKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
   if(!apiKey)throw new Error("Clé publique Supabase manquante.");
   const response=await fetch("https://almzypjgccucdkwnpldy.supabase.co/functions/v1/bn2-invite-member",{
    method:"POST",
    headers:{Authorization:"Bearer "+session.access_token,apikey:apiKey,"Content-Type":"application/json"},
    body:JSON.stringify({email:memberEmail,fullName:memberName,organizationId:selectedOrganizationId,memberRole}),
   });
   const result=await response.json();
   if(!response.ok)throw new Error(result.error??"Invitation impossible.");
   setInvitationUrl(result.actionLink??"");
   setInviteMessage(result.existingAccount?"Compte existant ajouté à l'organisation.":"Lien d'invitation généré. Copiez-le et envoyez-le au client.");
   setMemberEmail("");setMemberName("");
  }catch(cause){setInviteError(cause instanceof Error?cause.message:"Invitation impossible.");}
  finally{setInviting(false);}
 }
 const selectedOrganization=clients.find(item=>item.id===selectedOrganizationId);
 return <div className="admin-content admin-section-content">
  <div className="page-heading"><div><div className="page-eyebrow">BN2 HUB <span>•</span> GESTION MULTI-CLIENT</div><h1>Portails clients</h1><p>Créez des organisations et donnez accès aux collaborateurs de vos clients.</p></div><span className="section-demo-label">SUPABASE EN DIRECT</span></div>
  <div className="portal-control-layout">
   <section className="admin-panel portal-config-panel">
    <div className="portal-config-heading"><div><div className="page-eyebrow">NOUVELLE ORGANISATION</div><h2>Créer un espace client</h2><p>L'organisation sera enregistrée dans la base BN2.</p></div></div>
    <form className="builder-fields" onSubmit={createOrganization}>
     <label>Nom de l'entreprise<input value={name} onChange={e=>setName(e.target.value)} required maxLength={120} placeholder="Ex. : Atelier Nova"/></label>
     <label>E-mail de contact<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="contact@entreprise.be"/></label>
     <label>Secteur d'activité<select value={sector} onChange={e=>setSector(e.target.value)}><option>Services professionnels</option><option>Commerce & distribution</option><option>Industrie</option><option>Construction</option><option>Santé</option><option>Association</option><option>Autre</option></select></label>
     <label className="builder-full-field">Description<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} placeholder="Contexte et besoins de l'entreprise"/></label>
     {error&&<p role="alert" className="client-notice">{error}</p>}
     <button className="admin-primary-button" type="submit" disabled={saving||!name.trim()}><Plus size={16}/>{saving?"Création...":"Créer l'organisation"}</button>
    </form>
   </section>
   <section className="admin-panel portal-client-list">
    <div className="panel-heading"><div><h3>Organisations enregistrées</h3><p>{clients.length} organisation(s) dans Supabase.</p></div><span className="section-record-count">{clients.length}</span></div>
    {loading&&<p>Chargement...</p>}
    {!loading&&clients.length===0&&<p>Aucune organisation enregistrée pour le moment.</p>}
    {clients.map(item=><article className={"portal-client-choice "+(selectedOrganizationId===item.id?"selected":"")} key={item.id}>
      <span className="portal-client-avatar">{item.name.split(/\s+/).map((part:string)=>part[0]).join("").slice(0,2).toUpperCase()}</span>
      <button type="button" className="portal-client-copy" onClick={()=>setSelectedOrganizationId(item.id)}><strong>{item.name}</strong><small>{item.contact_email||item.slug}</small></button>
      <select aria-label={"Statut de "+item.name} value={item.status} onChange={e=>void updateStatus(item.id,e.target.value)}><option value="onboarding">À configurer</option><option value="active">Actif</option><option value="suspended">Suspendu</option><option value="archived">Archivé</option></select>
    </article>)}
   </section>
  </div>
  <section className="admin-panel portal-config-panel" style={{marginTop:20}}>
   <div className="portal-config-heading"><div><div className="page-eyebrow">ACCÈS UTILISATEUR</div><h2>{selectedOrganization? "Inviter un collaborateur · "+selectedOrganization.name : "Sélectionnez une organisation"}</h2><p>Un lien d'invitation sécurisé sera généré pour le compte client.</p></div></div>
   <form className="builder-fields" onSubmit={inviteMember}>
    <label>Nom complet<input value={memberName} onChange={e=>setMemberName(e.target.value)} required placeholder="Nom du collaborateur"/></label>
    <label>Adresse e-mail<input type="email" value={memberEmail} onChange={e=>setMemberEmail(e.target.value)} required placeholder="collaborateur@entreprise.be"/></label>
    <label>Rôle dans le portail<select value={memberRole} onChange={e=>setMemberRole(e.target.value)}><option value="member">Collaborateur</option><option value="agent">Référent IT</option><option value="admin">Administrateur client</option></select></label>
    {inviteError&&<p role="alert" className="client-notice">{inviteError}</p>}
    {inviteMessage&&<p className="client-notice">{inviteMessage}</p>}
    {invitationUrl&&<div className="builder-fields"><label>Lien d'invitation<input readOnly value={invitationUrl}/></label><button type="button" className="admin-primary-button" onClick={()=>void navigator.clipboard.writeText(invitationUrl)}>Copier le lien d'invitation</button></div>}
    <button className="admin-primary-button" type="submit" disabled={inviting||!selectedOrganizationId||!memberEmail.trim()}><Users size={16}/>{inviting?"Préparation...":"Créer l'accès et générer le lien"}</button>
   </form>
  </section>
 </div>;
}

function LiveModuleSection({active}:{active:string}) {
 const [rows,setRows]=useState<any[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const config:Record<string,{table:string;select:string;title:string;columns:string[];map:(row:any)=>string[]}> = {
  "Interventions":{table:"interventions",select:"id,title,status,scheduled_start,location,organizations(name)",title:"Interventions",columns:["Intervention","Client","Date prévue","Lieu","Statut"],map:r=>[r.title,r.organizations?.name??"Client",r.scheduled_start?new Date(r.scheduled_start).toLocaleString("fr-BE"):"Non planifiée",r.location??"—",r.status]},
  "Calendrier":{table:"interventions",select:"id,title,status,scheduled_start,location,organizations(name)",title:"Calendrier des interventions",columns:["Événement","Client","Date prévue","Lieu","Statut"],map:r=>[r.title,r.organizations?.name??"Client",r.scheduled_start?new Date(r.scheduled_start).toLocaleString("fr-BE"):"Non planifiée",r.location??"—",r.status]},
  "Contrats & heures":{table:"service_contracts",select:"id,name,plan_name,status,starts_on,ends_on,included_hours,organizations(name)",title:"Contrats de service",columns:["Contrat","Client","Formule","Heures incluses","État"],map:r=>[r.name,r.organizations?.name??"Client",r.plan_name??"—",String(r.included_hours??0)+" h",r.status]},
  "Parc informatique":{table:"assets",select:"id,asset_tag,name,category,status,manufacturer,model,organizations(name)",title:"Équipements",columns:["Référence","Équipement","Client","Catégorie","État"],map:r=>[r.asset_tag??"—",r.name,r.organizations?.name??"Client",r.category,r.status]},
  "Documents":{table:"documents",select:"id,name,category,mime_type,created_at,organizations(name)",title:"Documents partagés",columns:["Document","Client","Catégorie","Type","Ajouté le"],map:r=>[r.name,r.organizations?.name??"Client",r.category,r.mime_type??"—",new Date(r.created_at).toLocaleDateString("fr-BE")]},
  "Équipe BN2":{table:"profiles",select:"id,full_name,email,is_active,created_at",title:"Comptes utilisateurs",columns:["Utilisateur","E-mail","Accès","Créé le"],map:r=>[r.full_name||"Utilisateur",r.email??"—",r.is_active?"Actif":"Désactivé",new Date(r.created_at).toLocaleDateString("fr-BE")]},
  "Clients":{table:"organizations",select:"id,name,contact_email,sector,status,created_at",title:"Organisations clientes",columns:["Entreprise","Contact","Secteur","État"],map:r=>[r.name,r.contact_email??"—",r.sector??"—",r.status]},
 };
 const current=config[active];
 useEffect(()=>{
  if(!current){setRows([]);setLoading(false);return;}
  setLoading(true);setError("");
  createClient().from(current.table).select(current.select).order("created_at",{ascending:false}).limit(100)
   .then(({data,error})=>{if(error)setError(error.message);else setRows(data??[]);setLoading(false);});
 },[active]);
 if(active==="Paramètres")return <div className="admin-content admin-section-content"><div className="page-heading"><div><div className="page-eyebrow">BN2 HUB ADMIN · CONFIGURATION</div><h1>Paramètres</h1><p>Les contrôles de sécurité et de gestion de la plateforme.</p></div></div><div className="admin-settings-grid">{settings.map(item=>{const Icon=item.icon;return <article className="admin-panel settings-card" key={item.title}><span className="settings-card-icon"><Icon size={19}/></span><span className="settings-card-tag">{item.tag}</span><h3>{item.title}</h3><p>{item.text}</p><button type="button" disabled>Configuration à venir <ChevronRight size={14}/></button></article>;})}</div></div>;
 if(active==="Hébergement")return <div className="admin-content admin-section-content"><div className="page-heading"><div><div className="page-eyebrow">PLATEFORME · INFRASTRUCTURE</div><h1>Hébergement</h1><p>Services techniques utilisés par BN2 HUB.</p></div><span className="section-demo-label">CONFIGURATION ACTUELLE</span></div><section className="admin-panel section-table-panel"><div className="panel-heading"><div><h3>Infrastructure</h3><p>État de configuration, pas une mesure de disponibilité.</p></div></div><div className="section-info-grid"><div className="section-info-card"><Database size={18}/><div><strong>Supabase · région EU West</strong><p>Base PostgreSQL 17, Auth et stockage privé BN2.</p></div></div><div className="section-info-card"><Globe size={18}/><div><strong>Vercel · Next.js</strong><p>Application hébergée sur le projet bn-2-hub.</p></div></div><div className="section-info-card"><ShieldCheck size={18}/><div><strong>Isolation multi-tenant</strong><p>RLS activée sur les tables métier et documents privés.</p></div></div></div></section></div>;
 if(!current)return <div className="admin-content"><div className="page-heading"><h1>{active}</h1><p>Module non configuré.</p></div></div>;
 const values=rows.map(current.map);
 return <div className="admin-content admin-section-content">
  <div className="page-heading"><div><div className="page-eyebrow">BN2 HUB <span>•</span> ESPACE ADMINISTRATEUR</div><h1>{active}</h1><p>{current.title} enregistrés dans Supabase.</p></div><span className="section-demo-label">DONNÉES EN DIRECT</span></div>
  <div className="section-metrics"><article className="admin-panel section-metric"><span>Enregistrements</span><strong>{rows.length}</strong><small>Résultats accessibles à votre compte</small></article></div>
  <section className="admin-panel section-table-panel"><div className="panel-heading"><div><h3>{current.title}</h3><p>{loading?"Chargement des données...":error?"Erreur de chargement":"Données réelles de votre espace BN2."}</p></div><span className="section-record-count">{rows.length} éléments</span></div>
   {error&&<p role="alert" className="client-notice">{error}</p>}
   {!loading&&!error&&rows.length===0&&<div className="queue-empty">Aucun enregistrement pour le moment.</div>}
   {rows.length>0&&<div className="table-wrap"><table className="requests-table section-data-table"><thead><tr>{current.columns.map(col=><th key={col}>{col.toUpperCase()}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={row.id??index}>{current.map(row).map((cell,index)=><td key={index}>{index===0?<strong>{cell}</strong>:cell}</td>)}</tr>)}</tbody></table></div>}
  </section>
 </div>;
}

export default function AdminSectionView({ active }: { active: string }) {
  if (active === "Demandes support") return <SupportQueue />;
  if (active === "Portails clients") return <ClientPortalControl />;
  return <LiveModuleSection active={active} />;
}
