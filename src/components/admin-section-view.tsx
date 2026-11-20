"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import {
  ChevronRight, Copy, Database, FileText, Globe, Plus, Save, Search, Send, ShieldCheck, Sparkles, UserRound, Users,
} from "lucide-react";

type QueueStatus = "Nouvelle" | "À vérifier" | "En cours" | "En attente du client" | "Résolue" | "Fermée";
type QueueTicket = { recordId:string; organizationId:string; id:string; title:string; client:string; category:string; priority:"Haute"|"Normale"|"Basse"; status:QueueStatus; assignee:string; date:string; description:string };
type TicketDbRecord = { id:string; ticket_number:string; organization_id:string; title:string; description:string; category:string; priority:string; status:string; created_at:string; assigned_to:string|null; organizations:{name?:string}|{name?:string}[]|null };
type OrganizationRecord = { id:string; name:string; slug:string; sector:string|null; description:string|null; contact_email:string|null; status:string; created_at:string; enabled_modules:unknown };
type ModuleRecord = {
 id?:string; title?:string; description?:string|null; status?:string; scheduled_start?:string|null; scheduled_end?:string|null;
 location?:string|null; organizations?:{name?:string}|{name?:string}[]|null; organization_id?:string;
 assigned_to?:string|null; name?:string; plan_name?:string|null; contract_number?:string|null;
 starts_on?:string|null; ends_on?:string|null; included_hours?:number|null; hourly_rate?:number|null;
 monthly_price?:number|null; billing_frequency?:string; auto_renew?:boolean; renewal_notice_days?:number;
 support_sla_hours?:number|null; asset_tag?:string|null; category?:string; manufacturer?:string|null; model?:string|null;
 serial_number?:string|null; purchased_on?:string|null; warranty_until?:string|null; hostname?:string|null;
 operating_system?:string|null; ip_address?:string|null; mac_address?:string|null; purchase_cost?:number|null;
 license_expires_on?:string|null; notes?:string|null; storage_path?:string; mime_type?:string|null;
 size_bytes?:number|null; created_at?:string; full_name?:string; email?:string|null; is_active?:boolean;
 contact_email?:string|null; sector?:string|null;
};
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

type CrudField = {
 name:string; label:string; type:"text"|"date"|"datetime-local"|"number"|"textarea"|"select"|"checkbox";
 required?:boolean; defaultValue?:string|number|boolean; options?:Array<{value:string;label:string}>; placeholder?:string;
};
type PublicTable = keyof Database["public"]["Tables"];
function LiveModuleSection({active}:{active:string}) {
 const [rows,setRows]=useState<ModuleRecord[]>([]);
 const [organizations,setOrganizations]=useState<Array<{id:string;name:string}>>([]);
 const [staffOptions,setStaffOptions]=useState<Array<{id:string;name:string}>>([]);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [formOpen,setFormOpen]=useState(false);
 const [editingId,setEditingId]=useState("");
 const [formValues,setFormValues]=useState<Record<string,string|boolean>>({});
 const [documentFile,setDocumentFile]=useState<File|null>(null);

 const config=useMemo<Record<string,{table:PublicTable;select:string;title:string;columns:string[];map:(row:ModuleRecord)=>string[];fields?:CrudField[]}>>(()=>({
  "Interventions":{
   table:"interventions",select:"id,organization_id,title,description,assigned_to,scheduled_start,scheduled_end,status,location,organizations(name)",
   title:"Interventions",columns:["Intervention","Client","Date prévue","Technicien","Lieu","Statut"],
   map:r=>[r.title??"—",moduleOrganizationName(r),r.scheduled_start?new Date(r.scheduled_start).toLocaleString("fr-BE"):"Non planifiée",r.assigned_to??"Non attribué",r.location??"—",r.status??"—"],
   fields:[
    {name:"organization_id",label:"Entreprise cliente",type:"select",required:true},
    {name:"title",label:"Objet de l'intervention",type:"text",required:true},
    {name:"description",label:"Description",type:"textarea"},
    {name:"assigned_to",label:"Technicien responsable",type:"select"},
    {name:"scheduled_start",label:"Début prévu",type:"datetime-local"},
    {name:"scheduled_end",label:"Fin prévue",type:"datetime-local"},
    {name:"location",label:"Lieu",type:"text"},
    {name:"status",label:"Statut",type:"select",defaultValue:"planned",options:[{value:"planned",label:"Planifiée"},{value:"confirmed",label:"Confirmée"},{value:"in_progress",label:"En cours"},{value:"completed",label:"Terminée"},{value:"cancelled",label:"Annulée"}]},
   ],
  },
  "Calendrier":{
   table:"interventions",select:"id,organization_id,title,description,assigned_to,scheduled_start,scheduled_end,status,location,organizations(name)",
   title:"Calendrier des interventions",columns:["Événement","Client","Date prévue","Technicien","Lieu","Statut"],
   map:r=>[r.title??"—",moduleOrganizationName(r),r.scheduled_start?new Date(r.scheduled_start).toLocaleString("fr-BE"):"Non planifiée",staffOptions.find(x=>x.id===r.assigned_to)?.name??"Non attribué",r.location??"—",r.status??"—"],
   fields:[
    {name:"organization_id",label:"Entreprise cliente",type:"select",required:true},
    {name:"title",label:"Objet",type:"text",required:true},
    {name:"description",label:"Description",type:"textarea"},
    {name:"assigned_to",label:"Technicien",type:"select"},
    {name:"scheduled_start",label:"Début",type:"datetime-local"},
    {name:"scheduled_end",label:"Fin",type:"datetime-local"},
    {name:"location",label:"Lieu",type:"text"},
    {name:"status",label:"Statut",type:"select",defaultValue:"planned",options:[{value:"planned",label:"Planifiée"},{value:"confirmed",label:"Confirmée"},{value:"in_progress",label:"En cours"},{value:"completed",label:"Terminée"},{value:"cancelled",label:"Annulée"}]},
   ],
  },
  "Contrats & heures":{
   table:"service_contracts",select:"id,organization_id,name,contract_number,plan_name,status,starts_on,ends_on,included_hours,hourly_rate,monthly_price,billing_frequency,auto_renew,renewal_notice_days,support_sla_hours,organizations(name)",
   title:"Contrats de service",columns:["Contrat","Client","Formule","Heures incluses","Prix mensuel","État"],
   map:r=>[r.contract_number||r.name||"—",moduleOrganizationName(r),r.plan_name??"—",String(r.included_hours??0)+" h",r.monthly_price==null?"—":Number(r.monthly_price).toLocaleString("fr-BE",{style:"currency",currency:"EUR"}),r.status??"—"],
   fields:[
    {name:"organization_id",label:"Entreprise cliente",type:"select",required:true},
    {name:"name",label:"Nom du contrat",type:"text",required:true},
    {name:"contract_number",label:"Référence du contrat",type:"text"},
    {name:"plan_name",label:"Formule",type:"text"},
    {name:"starts_on",label:"Date de début",type:"date"},
    {name:"ends_on",label:"Date de fin",type:"date"},
    {name:"included_hours",label:"Heures incluses",type:"number",defaultValue:0},
    {name:"hourly_rate",label:"Tarif horaire (€)",type:"number"},
    {name:"monthly_price",label:"Prix mensuel (€)",type:"number"},
    {name:"billing_frequency",label:"Fréquence de facturation",type:"select",defaultValue:"monthly",options:[{value:"monthly",label:"Mensuelle"},{value:"quarterly",label:"Trimestrielle"},{value:"yearly",label:"Annuelle"},{value:"one_time",label:"Unique"},{value:"custom",label:"Personnalisée"}]},
    {name:"status",label:"État",type:"select",defaultValue:"active",options:[{value:"draft",label:"Brouillon"},{value:"active",label:"Actif"},{value:"expired",label:"Expiré"},{value:"cancelled",label:"Résilié"}]},
    {name:"auto_renew",label:"Renouvellement automatique",type:"checkbox",defaultValue:false},
    {name:"renewal_notice_days",label:"Préavis de renouvellement (jours)",type:"number",defaultValue:30},
    {name:"support_sla_hours",label:"Délai SLA (heures)",type:"number"},
   ],
  },
  "Parc informatique":{
   table:"assets",select:"id,organization_id,asset_tag,name,category,status,manufacturer,model,serial_number,assigned_to,purchased_on,warranty_until,hostname,operating_system,ip_address,mac_address,purchase_cost,license_expires_on,notes,organizations(name)",
   title:"Équipements",columns:["Référence","Équipement","Client","Catégorie","Attribué à","État"],
   map:r=>[r.asset_tag??"—",r.name??"—",moduleOrganizationName(r),r.category??"—",r.assigned_to??"—",r.status??"—"],
   fields:[
    {name:"organization_id",label:"Entreprise cliente",type:"select",required:true},
    {name:"asset_tag",label:"Référence interne",type:"text"},
    {name:"name",label:"Nom de l'équipement",type:"text",required:true},
    {name:"category",label:"Catégorie",type:"select",defaultValue:"other",options:[{value:"computer",label:"Ordinateur"},{value:"laptop",label:"Portable"},{value:"server",label:"Serveur"},{value:"network",label:"Réseau"},{value:"printer",label:"Imprimante"},{value:"phone",label:"Téléphone"},{value:"other",label:"Autre"}]},
    {name:"manufacturer",label:"Fabricant",type:"text"},
    {name:"model",label:"Modèle",type:"text"},
    {name:"serial_number",label:"Numéro de série",type:"text"},
    {name:"assigned_to",label:"Utilisateur / responsable",type:"select"},
    {name:"status",label:"État",type:"select",defaultValue:"operational",options:[{value:"operational",label:"Opérationnel"},{value:"maintenance",label:"En maintenance"},{value:"retired",label:"Retiré"},{value:"lost",label:"Perdu"}]},
    {name:"purchased_on",label:"Date d'achat",type:"date"},
    {name:"warranty_until",label:"Fin de garantie",type:"date"},
    {name:"hostname",label:"Nom réseau",type:"text"},
    {name:"operating_system",label:"Système d'exploitation",type:"text"},
    {name:"ip_address",label:"Adresse IP",type:"text"},
    {name:"mac_address",label:"Adresse MAC",type:"text"},
    {name:"purchase_cost",label:"Coût d'achat (€)",type:"number"},
    {name:"license_expires_on",label:"Expiration licence",type:"date"},
    {name:"notes",label:"Notes",type:"textarea"},
   ],
  },
  "Documents":{
   table:"documents",select:"id,organization_id,name,storage_path,mime_type,size_bytes,category,created_at,organizations(name)",
   title:"Documents partagés",columns:["Document","Client","Catégorie","Type","Ajouté le"],
   map:r=>[r.name??"—",moduleOrganizationName(r),r.category??"—",r.mime_type??"—",r.created_at?new Date(r.created_at).toLocaleDateString("fr-BE"):"—"],
   fields:[
    {name:"organization_id",label:"Entreprise cliente",type:"select",required:true},
    {name:"category",label:"Catégorie",type:"select",defaultValue:"other",options:[{value:"contract",label:"Contrat"},{value:"invoice",label:"Facture"},{value:"report",label:"Rapport"},{value:"technical",label:"Technique"},{value:"other",label:"Autre"}]},
   ],
  },
  "Clients":{table:"organizations",select:"id,name,contact_email,sector,status,created_at",title:"Organisations clientes",columns:["Entreprise","Contact","Secteur","État"],map:r=>[r.name??"—",r.contact_email??"—",r.sector??"—",r.status??"—"]},
 }),[]);
 const current=config[active];

 const loadRows=useCallback(async()=>{
  if(!current){setRows([]);setLoading(false);return;}
  setLoading(true);setError("");
  const {data,error}=await createClient().from(current.table).select(current.select).order("created_at",{ascending:false}).limit(100);
  if(error)setError(error.message);else setRows((data??[]) as ModuleRecord[]);
  setLoading(false);
 },[current]);
 useEffect(()=>{void loadRows();},[loadRows]);

 useEffect(()=>{
  if(!current?.fields?.some(field=>field.name==="organization_id"))return;
  async function loadOptions(){
   const supabase=createClient();
   const [orgResult,staffResult]=await Promise.all([
    supabase.from("organizations").select("id,name").order("name"),
    supabase.from("staff_members").select("user_id").in("employment_status",["invited","active"]),
   ]);
   setOrganizations(orgResult.data??[]);
   const ids=(staffResult.data??[]).map(item=>item.user_id);
   if(ids.length){
    const {data:profiles}=await supabase.from("profiles").select("id,full_name,email").in("id",ids);
    setStaffOptions((profiles??[]).map(profile=>({id:profile.id,name:profile.full_name||profile.email||"Employé"})));
   }else setStaffOptions([]);
  }
  void loadOptions();
 },[current]);

 function openNew(){
  const values:Record<string,string|boolean>={};
  current?.fields?.forEach(field=>{values[field.name]=field.defaultValue??(field.type==="checkbox"?false:"");});
  if(!values.organization_id&&organizations[0])values.organization_id=organizations[0].id;
  setFormValues(values);setEditingId("");setDocumentFile(null);setError("");setNotice("");setFormOpen(true);
 }
 function openEdit(row:ModuleRecord){
  const values:Record<string,string|boolean>={};
  current?.fields?.forEach(field=>{
   const value=(row as unknown as Record<string,unknown>)[field.name];
   values[field.name]=value==null?(field.type==="checkbox"?false:""):field.type==="datetime-local"&&typeof value==="string"?value.slice(0,16):typeof value==="boolean"?value:String(value);
  });
  setFormValues(values);setEditingId(row.id??"");setDocumentFile(null);setError("");setNotice("");setFormOpen(true);
 }
 function updateField(name:string,value:string|boolean){setFormValues(current=>({...current,[name]:value}));}

 async function saveRecord(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!current)return;
  setSaving(true);setError("");setNotice("");
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setError("Votre session a expiré.");setSaving(false);return;}
  const payload:Record<string,unknown>={};
  current.fields?.forEach(field=>{
   const value=formValues[field.name];
   if(field.type==="checkbox")payload[field.name]=value===true;
   else if(field.type==="number")payload[field.name]=value===""?null:Number(value);
   else payload[field.name]=value===""?null:value;
  });
  if(current.table==="documents"){
   if(!documentFile){setError("Sélectionnez un fichier à déposer.");setSaving(false);return;}
   if(documentFile.size>20*1024*1024){setError("Le fichier dépasse la limite de 20 Mo.");setSaving(false);return;}
   const allowed=["application/pdf","image/png","image/jpeg","text/plain","text/csv","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
   if(!allowed.includes(documentFile.type)){setError("Format non autorisé. Utilisez PDF, PNG, JPEG, TXT, CSV, DOCX ou XLSX.");setSaving(false);return;}
   const organizationId=String(payload.organization_id??"");
   if(!organizationId){setError("Sélectionnez une entreprise cliente.");setSaving(false);return;}
   const safeName=documentFile.name.replace(/[^a-zA-Z0-9._-]/g,"_");
   const path=organizationId+"/"+crypto.randomUUID()+"-"+safeName;
   const {error:uploadError}=await supabase.storage.from("bn2-private").upload(path,documentFile,{upsert:false,contentType:documentFile.type});
   if(uploadError){setError(uploadError.message);setSaving(false);return;}
   const {error:insertError}=await supabase.from("documents").insert({
    organization_id:organizationId,uploaded_by:user.id,name:documentFile.name,storage_path:path,
    mime_type:documentFile.type,size_bytes:documentFile.size,category:String(payload.category??"other"),
   });
   if(insertError){await supabase.storage.from("bn2-private").remove([path]);setError(insertError.message);setSaving(false);return;}
  }else{
   payload.updated_at=new Date().toISOString();
   if(current.table==="interventions"&&!editingId)payload.created_by=user.id;
   const result=editingId
    ? await supabase.from(current.table).update(payload as never).eq("id",editingId)
    : await supabase.from(current.table).insert(payload as never);
   if(result.error){setError(result.error.message);setSaving(false);return;}
  }
  setNotice(editingId?"Enregistrement mis à jour.":"Enregistrement créé.");
  setFormOpen(false);setEditingId("");setDocumentFile(null);
  await loadRows();setSaving(false);
 }

 async function deleteRecord(row:ModuleRecord){
  if(!current||!row.id||!window.confirm("Confirmer la suppression de cet enregistrement ?"))return;
  const supabase=createClient();
  if(current.table==="documents"&&row.storage_path){
   const {error:storageError}=await supabase.storage.from("bn2-private").remove([row.storage_path]);
   if(storageError){setError(storageError.message);return;}
  }
  const {error:deleteError}=await supabase.from(current.table).delete().eq("id",row.id);
  if(deleteError)setError(deleteError.message);else{setNotice("Enregistrement supprimé.");await loadRows();}
 }

 async function downloadDocument(row:ModuleRecord){
  if(!row.storage_path)return;
  const {data,error}=await createClient().storage.from("bn2-private").createSignedUrl(row.storage_path,120);
  if(error){setError(error.message);return;}
  if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");
 }

 if(active==="Paramètres")return <div className="admin-content admin-section-content"><div className="page-heading"><div><div className="page-eyebrow">BN2 HUB ADMIN · CONFIGURATION</div><h1>Paramètres</h1><p>Les contrôles de sécurité et de gestion de la plateforme.</p></div></div><div className="admin-settings-grid">{settings.map(item=>{const Icon=item.icon;return <article className="admin-panel settings-card" key={item.title}><span className="settings-card-icon"><Icon size={19}/></span><span className="settings-card-tag">{item.tag}</span><h3>{item.title}</h3><p>{item.text}</p><button type="button" disabled>Configuration à venir <ChevronRight size={14}/></button></article>;})}</div></div>;
 if(active==="Hébergement")return <div className="admin-content admin-section-content"><div className="page-heading"><div><div className="page-eyebrow">PLATEFORME · INFRASTRUCTURE</div><h1>Hébergement</h1><p>Services techniques utilisés par BN2 HUB.</p></div><span className="section-demo-label">CONFIGURATION ACTUELLE</span></div><section className="admin-panel section-table-panel"><div className="panel-heading"><div><h3>Infrastructure</h3><p>État de configuration, pas une mesure de disponibilité.</p></div></div><div className="section-info-grid"><div className="section-info-card"><Database size={18}/><div><strong>Supabase · région EU West</strong><p>Base PostgreSQL 17, Auth et stockage privé BN2.</p></div></div><div className="section-info-card"><Globe size={18}/><div><strong>Vercel · Next.js</strong><p>Application hébergée sur le projet bn-2-hub.</p></div></div><div className="section-info-card"><ShieldCheck size={18}/><div><strong>Isolation multi-tenant</strong><p>RLS activée sur les tables métier et documents privés.</p></div></div></div></section></div>;
 if(!current)return <div className="admin-content"><div className="page-heading"><h1>{active}</h1><p>Module non configuré.</p></div></div>;

 return <div className="admin-content admin-section-content">
  <div className="page-heading"><div><div className="page-eyebrow">BN2 HUB <span>•</span> ESPACE ADMINISTRATEUR</div><h1>{active}</h1><p>{current.title} enregistrés dans Supabase.</p></div>
   {current.fields&&<button className="admin-primary-button" onClick={openNew}><Plus size={15}/>{current.table==="documents"?"Ajouter un document":"Créer"}</button>}
  </div>
  {notice&&<p className="client-notice">{notice}</p>}
  <div className="section-metrics"><article className="admin-panel section-metric"><span>Enregistrements</span><strong>{rows.length}</strong><small>Résultats accessibles à votre compte</small></article></div>
  <section className="admin-panel section-table-panel"><div className="panel-heading"><div><h3>{current.title}</h3><p>{loading?"Chargement des données...":error?"Erreur de chargement":"Données réelles de votre espace BN2."}</p></div><span className="section-record-count">{rows.length} éléments</span></div>
   {error&&<p role="alert" className="client-notice">{error}</p>}
   {!loading&&!error&&rows.length===0&&<div className="queue-empty">Aucun enregistrement pour le moment.</div>}
   {rows.length>0&&<div className="table-wrap"><table className="requests-table section-data-table"><thead><tr>{current.columns.map(col=><th key={col}>{col.toUpperCase()}</th>)}<th>ACTIONS</th></tr></thead><tbody>{rows.map((row,index)=><tr key={row.id??index}>{current.map(row).map((cell,index)=><td key={index}>{index===0?<strong>{cell}</strong>:cell}</td>)}<td><div className="bn2-crud-actions">{current.table==="documents"&&<button onClick={()=>void downloadDocument(row)}>Télécharger</button>}{current.table!=="documents"&&current.fields&&<button onClick={()=>openEdit(row)}>Modifier</button>}<button className="danger" onClick={()=>void deleteRecord(row)}>Supprimer</button></div></td></tr>)}</tbody></table></div>}
  </section>
  {formOpen&&<div className="modal-backdrop" onClick={()=>setFormOpen(false)}><form className="bn2-crud-modal" onSubmit={saveRecord} onClick={event=>event.stopPropagation()}>
   <div className="bn2-crud-modal-head"><div><h2>{current.table==="documents"?"Déposer un document":editingId?"Modifier l'enregistrement":"Créer un enregistrement"}</h2><p>{current.title}</p></div><button type="button" onClick={()=>setFormOpen(false)}>×</button></div>
   <div className="bn2-crud-fields">{current.fields?.map(field=>{
    const value=formValues[field.name]??(field.type==="checkbox"?false:"");
    const options=field.name==="organization_id"?organizations.map(org=>({value:org.id,label:org.name})):field.name==="assigned_to"?staffOptions.map(staff=>({value:staff.id,label:staff.name})):field.options??[];
    if(field.type==="textarea")return <label className="wide" key={field.name}>{field.label}<textarea required={field.required} value={String(value)} onChange={event=>updateField(field.name,event.target.value)} placeholder={field.placeholder}/></label>;
    if(field.type==="select")return <label key={field.name}>{field.label}<select required={field.required} value={String(value)} onChange={event=>updateField(field.name,event.target.value)}><option value="">Sélectionner...</option>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
    if(field.type==="checkbox")return <label className="checkbox-field" key={field.name}><input type="checkbox" checked={value===true} onChange={event=>updateField(field.name,event.target.checked)}/>{field.label}</label>;
    return <label key={field.name}>{field.label}<input type={field.type} required={field.required} min={field.type==="number"?"0":undefined} step={field.type==="number"?"0.01":undefined} value={String(value)} onChange={event=>updateField(field.name,event.target.value)} placeholder={field.placeholder}/></label>;
   })}</div>
   {current.table==="documents"&&<label className="bn2-crud-file">Fichier à déposer<input type="file" required accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.docx,.xlsx" onChange={event=>setDocumentFile(event.target.files?.[0]??null)}/><small>PDF, PNG, JPEG, TXT, CSV, DOCX ou XLSX · 20 Mo maximum</small></label>}
   <div className="bn2-crud-modal-footer"><button type="button" className="secondary" onClick={()=>setFormOpen(false)}>Annuler</button><button type="submit" disabled={saving}><Save size={14}/>{saving?"Enregistrement...":current.table==="documents"?"Déposer le document":editingId?"Enregistrer":"Créer"}</button></div>
  </form></div>}
 </div>;
}

type StaffRecord = {
 id:string; user_id:string; employee_number:string|null; department:string; job_title:string;
 employment_status:"invited"|"active"|"on_leave"|"suspended"|"terminated";
 permissions:Record<string,boolean>; profile:{full_name:string|null;email:string|null}|null;
};
const staffPermissionOptions=[
 ["tickets.read","Voir les demandes"],["tickets.manage","Gérer les demandes"],
 ["interventions.read","Voir les interventions"],["interventions.manage","Gérer les interventions"],
 ["clients.read","Voir les entreprises"],["contracts.read","Voir les contrats"],
 ["assets.read","Voir le parc informatique"],["assets.manage","Gérer le parc informatique"],
 ["documents.read","Voir les documents"],["documents.manage","Gérer les documents"],
 ["worklogs.read","Voir les temps prestés"],["worklogs.create","Encoder du temps"],
] as const;
const defaultStaffPermissions:Record<string,boolean>={
 "tickets.read":true,"tickets.manage":true,"interventions.read":true,"interventions.manage":true,
 "clients.read":true,"contracts.read":true,"assets.read":true,"assets.manage":false,
 "documents.read":true,"documents.manage":false,"worklogs.read":true,"worklogs.create":true,
};
function StaffManagement(){
 const [staff,setStaff]=useState<StaffRecord[]>([]);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [formOpen,setFormOpen]=useState(false);
 const [search,setSearch]=useState("");
 const [fullName,setFullName]=useState("");
 const [email,setEmail]=useState("");
 const [department,setDepartment]=useState("Support IT");
 const [jobTitle,setJobTitle]=useState("Technicien IT");
 const [employeeNumber,setEmployeeNumber]=useState("");
 const [permissions,setPermissions]=useState<Record<string,boolean>>(defaultStaffPermissions);
 const [inviteLink,setInviteLink]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const load=useCallback(async()=>{
  setLoading(true);
  const response=await fetch("/api/admin/staff",{cache:"no-store"});
  const result=await response.json();
  if(!response.ok)setError(result.error??"Impossible de charger l'équipe.");
  else setStaff(result.staff??[]);
  setLoading(false);
 },[]);
 useEffect(()=>{void load();},[load]);
 async function invite(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setSaving(true);setError("");setNotice("");setInviteLink("");
  const response=await fetch("/api/admin/staff",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fullName,email,department,jobTitle,employeeNumber,permissions})});
  const result=await response.json();
  if(!response.ok)setError(result.error??"Invitation impossible.");
  else{setInviteLink(result.inviteLink??"");setNotice("Fiche employé créée. Transmettez le lien sécurisé à la personne invitée.");setFormOpen(false);setFullName("");setEmail("");setEmployeeNumber("");await load();}
  setSaving(false);
 }
 async function updateStatus(member:StaffRecord,status:StaffRecord["employment_status"]){
  const response=await fetch("/api/admin/staff",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:member.id,status})});
  const result=await response.json();
  if(!response.ok)setError(result.error??"Mise à jour impossible.");
  else{setNotice("Accès employé mis à jour.");await load();}
 }
 const visible=staff.filter(member=>[member.profile?.full_name,member.profile?.email,member.department,member.job_title,member.employee_number].join(" ").toLowerCase().includes(search.toLowerCase()));
 const statusLabel:Record<StaffRecord["employment_status"],string>={invited:"Invité",active:"Actif",on_leave:"En congé",suspended:"Suspendu",terminated:"Terminé"};
 return <div className="admin-content admin-section-content bn2-staff-admin">
  <div className="page-heading"><div><div className="page-eyebrow">BN2 HUB <span>•</span> RESSOURCES HUMAINES</div><h1>Équipe BN2</h1><p>Invitez les collaborateurs, attribuez leurs permissions et gérez leurs accès.</p></div><button className="admin-primary-button" onClick={()=>setFormOpen(true)}><Plus size={15}/> Ajouter un employé</button></div>
  {error&&<div className="bn2-staff-admin-alert error">{error}</div>}
  {notice&&<div className="bn2-staff-admin-alert success">{notice}</div>}
  {inviteLink&&<div className="bn2-staff-invite-link"><div><strong>Lien d&apos;invitation sécurisé</strong><span>Copiez et transmettez ce lien à l&apos;employé. Il devra définir son mot de passe à la première ouverture.</span><input readOnly value={inviteLink}/></div><button onClick={()=>void navigator.clipboard.writeText(inviteLink)}><Copy size={14}/> Copier le lien</button></div>}
  <section className="admin-panel bn2-staff-admin-panel">
   <div className="bn2-staff-admin-toolbar"><div><Users size={17}/><strong>{staff.length} collaborateur{staff.length>1?"s":""}</strong></div><label><Search size={15}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Rechercher un employé..."/></label></div>
   {loading?<div className="bn2-staff-admin-empty">Chargement de l&apos;équipe...</div>:visible.length===0?<div className="bn2-staff-admin-empty">Aucun collaborateur trouvé.</div>:<div className="bn2-staff-admin-list">
    {visible.map(member=><article className="bn2-staff-admin-row" key={member.id}><div className="bn2-staff-admin-avatar">{(member.profile?.full_name??"BN").split(" ").map(part=>part[0]).join("").slice(0,2).toUpperCase()}</div><div className="bn2-staff-admin-person"><strong>{member.profile?.full_name??"Compte employé"}</strong><small>{member.profile?.email??"E-mail indisponible"}</small></div><div className="bn2-staff-admin-role"><strong>{member.job_title}</strong><small>{member.department}{member.employee_number?" · "+member.employee_number:""}</small></div><span className={"bn2-staff-admin-status "+member.employment_status}>{statusLabel[member.employment_status]}</span><div className="bn2-staff-admin-actions">
     {member.employment_status==="invited"&&<button onClick={()=>void updateStatus(member,"active")}>Activer</button>}
     {member.employment_status==="active"&&<button onClick={()=>void updateStatus(member,"suspended")}>Suspendre</button>}
     {member.employment_status==="suspended"&&<button onClick={()=>void updateStatus(member,"active")}>Réactiver</button>}
     {member.employment_status!=="terminated"&&<button className="danger" onClick={()=>void updateStatus(member,"terminated")}>Terminer</button>}
    </div></article>)}
   </div>}
  </section>
  {formOpen&&<div className="modal-backdrop" onClick={()=>setFormOpen(false)}><form className="bn2-staff-admin-modal" onSubmit={invite} onClick={event=>event.stopPropagation()}><div className="bn2-staff-admin-modal-head"><div><h2>Inviter un employé</h2><p>Créez son accès et configurez ses permissions.</p></div><button type="button" onClick={()=>setFormOpen(false)}>×</button></div>
   <div className="bn2-staff-admin-fields"><label>Nom complet<input required minLength={2} value={fullName} onChange={event=>setFullName(event.target.value)} placeholder="Prénom Nom"/></label><label>Adresse e-mail<input type="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="prenom@bn2consulting.be"/></label><label>Département<select value={department} onChange={event=>setDepartment(event.target.value)}><option>Support IT</option><option>Infrastructure & Réseaux</option><option>Cybersécurité</option><option>Cloud & Microsoft 365</option><option>Administration</option></select></label><label>Fonction<input value={jobTitle} onChange={event=>setJobTitle(event.target.value)} required/></label><label>Matricule<input value={employeeNumber} onChange={event=>setEmployeeNumber(event.target.value)} placeholder="BN2-EMP-001"/></label></div>
   <div className="bn2-staff-permissions-title">Permissions de l&apos;employé</div><div className="bn2-staff-permissions">{staffPermissionOptions.map(([key,label])=><label key={key}><input type="checkbox" checked={permissions[key]===true} onChange={event=>setPermissions(value=>({...value,[key]:event.target.checked}))}/>{label}</label>)}</div>
   <div className="bn2-staff-admin-modal-footer"><button type="button" className="secondary" onClick={()=>setFormOpen(false)}>Annuler</button><button type="submit" disabled={saving}><Send size={14}/>{saving?"Création...":"Créer et générer l'invitation"}</button></div>
  </form></div>}
 </div>;
}

export default function AdminSectionView({ active }: { active: string }) {
  if (active === "Demandes support") return <SupportQueue />;
  if (active === "Équipe BN2") return <StaffManagement />;
  if (active === "Portails clients") return <ClientPortalControl />;
  return <LiveModuleSection active={active} />;
}
