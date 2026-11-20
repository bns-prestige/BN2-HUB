"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronRight, Database, FileText, Globe, Plus, Search, Send, ShieldCheck, Sparkles, UserRound, Users,
} from "lucide-react";

type QueueStatus = "Nouvelle" | "À vérifier" | "En cours" | "En attente du client" | "Résolue" | "Fermée";
type QueueTicket = { recordId:string; organizationId:string; id:string; title:string; client:string; category:string; priority:"Haute"|"Normale"|"Basse"; status:QueueStatus; assignee:string; date:string; description:string };
type TicketDbRecord = { id:string; ticket_number:string; organization_id:string; title:string; description:string; category:string; priority:string; status:string; created_at:string; assigned_to:string|null; organizations:{name?:string}|{name?:string}[]|null };
type OrganizationRecord = { id:string; name:string; slug:string; sector:string|null; description:string|null; contact_email:string|null; status:string; created_at:string; enabled_modules:unknown };
type ModuleRecord = { id?:string; title?:string; status?:string; scheduled_start?:string|null; location?:string|null; organizations?:{name?:string}|{name?:string}[]|null; name?:string; plan_name?:string|null; included_hours?:number|null; asset_tag?:string|null; category?:string; mime_type?:string|null; created_at?:string; full_name?:string; email?:string|null; is_active?:boolean; contact_email?:string|null; sector?:string|null };
function moduleOrganizationName(row:ModuleRecord){return Array.isArray(row.organizations)?row.organizations[0]?.name??"Client":row.organizations?.name??"Client";}
const queueStatuses: QueueStatus[] = ["Nouvelle","À vérifier","En cours","En attente du client","Résolue","Fermée"];

const settings = [
  {icon:ShieldCheck,title:"Sécurité & accès",text:"Rôles, autorisations et politiques d&apos;accès",tag:"Prioritaire"},
  {icon:Users,title:"Gestion des utilisateurs",text:"Comptes administrateurs et membres BN2",tag:"Configuration"},
  {icon:Sparkles,title:"Assistant IA",text:"Modèle, instructions et sources autorisées",tag:"À configurer"},
  {icon:FileText,title:"Modèles de documents",text:"Contrats, rapports et modèles PDF",tag:"Configuration"},
  {icon:ShieldCheck,title:"Hébergement & infrastructure",text:"Domaines, stockage, sauvegardes et disponibilité",tag:"Infrastructure"},
];

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
    const rows=((data??[]) as TicketDbRecord[]).map((row)=>({recordId:row.id,organizationId:row.organization_id,id:row.ticket_number,title:row.title,client:Array.isArray(row.organizations)?row.organizations[0]?.name??"Client":row.organizations?.name??"Client",category:row.category,priority:priorityMap[row.priority]??"Normale",status:statusMap[row.status]??"Nouvelle",assignee:row.assigned_to??"",date:new Date(row.created_at).toLocaleString("fr-BE",{dateStyle:"short",timeStyle:"short"}),description:row.description}));
    setTickets(rows); if(rows[0]) setSelected(rows[0].recordId);
   }
   setLoading(false);
  }
  void load();
 },[]);

 useEffect(()=>{
  if(!selected)return;
  createClient().from("ticket_messages").select("body,created_at,is_internal").eq("ticket_id",selected).order("created_at",{ascending:true}).then(({data})=>setMessages(((data??[]) as {body:string}[]).map((item)=>item.body)));
 },[selected]);

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
 const [clients,setClients]=useState<OrganizationRecord[]>([]);
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

 const load=useCallback(async()=>{
  setLoading(true);
  const {data,error}=await createClient().from("organizations").select("id,name,slug,sector,description,contact_email,status,created_at,enabled_modules").order("created_at",{ascending:false});
  if(error)setError(error.message);else{setClients(data??[]);setSelectedOrganizationId(current=>current||data?.[0]?.id||"");}
  setLoading(false);
 },[]);
 useEffect(()=>{void load();},[load]);

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
   setInviteMessage(result.existingAccount?"Compte existant ajouté à l'organisation.":"Lien d&apos;invitation généré. Copiez-le et envoyez-le au client.");
   setMemberEmail("");setMemberName("");
  }catch(cause){setInviteError(cause instanceof Error?cause.message:"Invitation impossible.");}
  finally{setInviting(false);}
 }
 const selectedOrganization=clients.find(item=>item.id===selectedOrganizationId);
 return <div className="admin-content admin-section-content">
  <div className="page-heading"><div><div className="page-eyebrow">BN2 HUB <span>•</span> GESTION MULTI-CLIENT</div><h1>Portails clients</h1><p>Créez des organisations et donnez accès aux collaborateurs de vos clients.</p></div><span className="section-demo-label">SUPABASE EN DIRECT</span></div>
  <div className="portal-control-layout">
   <section className="admin-panel portal-config-panel">
    <div className="portal-config-heading"><div><div className="page-eyebrow">NOUVELLE ORGANISATION</div><h2>Créer un espace client</h2><p>L&apos;organisation sera enregistrée dans la base BN2.</p></div></div>
    <form className="builder-fields" onSubmit={createOrganization}>
     <label>Nom de l&apos;entreprise<input value={name} onChange={e=>setName(e.target.value)} required maxLength={120} placeholder="Ex. : Atelier Nova"/></label>
     <label>E-mail de contact<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="contact@entreprise.be"/></label>
     <label>Secteur d&apos;activité<select value={sector} onChange={e=>setSector(e.target.value)}><option>Services professionnels</option><option>Commerce & distribution</option><option>Industrie</option><option>Construction</option><option>Santé</option><option>Association</option><option>Autre</option></select></label>
     <label className="builder-full-field">Description<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} placeholder="Contexte et besoins de l&apos;entreprise"/></label>
     {error&&<p role="alert" className="client-notice">{error}</p>}
     <button className="admin-primary-button" type="submit" disabled={saving||!name.trim()}><Plus size={16}/>{saving?"Création...":"Créer l&apos;organisation"}</button>
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
   <div className="portal-config-heading"><div><div className="page-eyebrow">ACCÈS UTILISATEUR</div><h2>{selectedOrganization? "Inviter un collaborateur · "+selectedOrganization.name : "Sélectionnez une organisation"}</h2><p>Un lien d&apos;invitation sécurisé sera généré pour le compte client.</p></div></div>
   <form className="builder-fields" onSubmit={inviteMember}>
    <label>Nom complet<input value={memberName} onChange={e=>setMemberName(e.target.value)} required placeholder="Nom du collaborateur"/></label>
    <label>Adresse e-mail<input type="email" value={memberEmail} onChange={e=>setMemberEmail(e.target.value)} required placeholder="collaborateur@entreprise.be"/></label>
    <label>Rôle dans le portail<select value={memberRole} onChange={e=>setMemberRole(e.target.value)}><option value="member">Collaborateur</option><option value="agent">Référent IT</option><option value="admin">Administrateur client</option></select></label>
    {inviteError&&<p role="alert" className="client-notice">{inviteError}</p>}
    {inviteMessage&&<p className="client-notice">{inviteMessage}</p>}
    {invitationUrl&&<div className="builder-fields"><label>Lien d&apos;invitation<input readOnly value={invitationUrl}/></label><button type="button" className="admin-primary-button" onClick={()=>void navigator.clipboard.writeText(invitationUrl)}>Copier le lien d&apos;invitation</button></div>}
    <button className="admin-primary-button" type="submit" disabled={inviting||!selectedOrganizationId||!memberEmail.trim()}><Users size={16}/>{inviting?"Préparation...":"Créer l&apos;accès et générer le lien"}</button>
   </form>
  </section>
 </div>;
}

function LiveModuleSection({active}:{active:string}) {
 const [rows,setRows]=useState<ModuleRecord[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const config=useMemo<Record<string,{table:string;select:string;title:string;columns:string[];map:(row:ModuleRecord)=>string[]}>>(()=>({
  "Interventions":{table:"interventions",select:"id,title,status,scheduled_start,location,organizations(name)",title:"Interventions",columns:["Intervention","Client","Date prévue","Lieu","Statut"],map:r=>[r.title??"—",moduleOrganizationName(r),r.scheduled_start?new Date(r.scheduled_start).toLocaleString("fr-BE"):"Non planifiée",r.location??"—",r.status??"—"]},
  "Calendrier":{table:"interventions",select:"id,title,status,scheduled_start,location,organizations(name)",title:"Calendrier des interventions",columns:["Événement","Client","Date prévue","Lieu","Statut"],map:r=>[r.title??"—",moduleOrganizationName(r),r.scheduled_start?new Date(r.scheduled_start).toLocaleString("fr-BE"):"Non planifiée",r.location??"—",r.status??"—"]},
  "Contrats & heures":{table:"service_contracts",select:"id,name,plan_name,status,starts_on,ends_on,included_hours,organizations(name)",title:"Contrats de service",columns:["Contrat","Client","Formule","Heures incluses","État"],map:r=>[r.name??"—",moduleOrganizationName(r),r.plan_name??"—",String(r.included_hours??0)+" h",r.status??"—"]},
  "Parc informatique":{table:"assets",select:"id,asset_tag,name,category,status,manufacturer,model,organizations(name)",title:"Équipements",columns:["Référence","Équipement","Client","Catégorie","État"],map:r=>[r.asset_tag??"—",r.name??"—",moduleOrganizationName(r),r.category??"—",r.status??"—"]},
  "Documents":{table:"documents",select:"id,name,category,mime_type,created_at,organizations(name)",title:"Documents partagés",columns:["Document","Client","Catégorie","Type","Ajouté le"],map:r=>[r.name??"—",moduleOrganizationName(r),r.category??"—",r.mime_type??"—",r.created_at?new Date(r.created_at).toLocaleDateString("fr-BE"):"—"]},
  "Équipe BN2":{table:"profiles",select:"id,full_name,email,is_active,created_at",title:"Comptes utilisateurs",columns:["Utilisateur","E-mail","Accès","Créé le"],map:r=>[r.full_name||"Utilisateur",r.email??"—",r.is_active?"Actif":"Désactivé",r.created_at?new Date(r.created_at).toLocaleDateString("fr-BE"):"—"]},
  "Clients":{table:"organizations",select:"id,name,contact_email,sector,status,created_at",title:"Organisations clientes",columns:["Entreprise","Contact","Secteur","État"],map:r=>[r.name??"—",r.contact_email??"—",r.sector??"—",r.status??"—"]},
 }),[]);
 const current=config[active];
 useEffect(()=>{
  if(!current){setRows([]);setLoading(false);return;}
  setLoading(true);setError("");
  createClient().from(current.table).select(current.select).order("created_at",{ascending:false}).limit(100)
   .then(({data,error})=>{if(error)setError(error.message);else setRows((data??[]) as ModuleRecord[]);setLoading(false);});
 },[current]);
 if(active==="Paramètres")return <div className="admin-content admin-section-content"><div className="page-heading"><div><div className="page-eyebrow">BN2 HUB ADMIN · CONFIGURATION</div><h1>Paramètres</h1><p>Les contrôles de sécurité et de gestion de la plateforme.</p></div></div><div className="admin-settings-grid">{settings.map(item=>{const Icon=item.icon;return <article className="admin-panel settings-card" key={item.title}><span className="settings-card-icon"><Icon size={19}/></span><span className="settings-card-tag">{item.tag}</span><h3>{item.title}</h3><p>{item.text}</p><button type="button" disabled>Configuration à venir <ChevronRight size={14}/></button></article>;})}</div></div>;
 if(active==="Hébergement")return <div className="admin-content admin-section-content"><div className="page-heading"><div><div className="page-eyebrow">PLATEFORME · INFRASTRUCTURE</div><h1>Hébergement</h1><p>Services techniques utilisés par BN2 HUB.</p></div><span className="section-demo-label">CONFIGURATION ACTUELLE</span></div><section className="admin-panel section-table-panel"><div className="panel-heading"><div><h3>Infrastructure</h3><p>État de configuration, pas une mesure de disponibilité.</p></div></div><div className="section-info-grid"><div className="section-info-card"><Database size={18}/><div><strong>Supabase · région EU West</strong><p>Base PostgreSQL 17, Auth et stockage privé BN2.</p></div></div><div className="section-info-card"><Globe size={18}/><div><strong>Vercel · Next.js</strong><p>Application hébergée sur le projet bn-2-hub.</p></div></div><div className="section-info-card"><ShieldCheck size={18}/><div><strong>Isolation multi-tenant</strong><p>RLS activée sur les tables métier et documents privés.</p></div></div></div></section></div>;
 if(!current)return <div className="admin-content"><div className="page-heading"><h1>{active}</h1><p>Module non configuré.</p></div></div>;
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
