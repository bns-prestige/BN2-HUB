"use client";

import { FormEvent,useEffect,useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Bot,BriefcaseBusiness,CalendarClock,CheckCircle2,LogOut,Plus,RefreshCw,ShieldCheck,Ticket,Timer } from "lucide-react";
import "./staff.css";

type OrgJoin={name?:string}|{name?:string}[]|null;
type TicketRow={id:string;ticket_number:string;title:string;status:string;priority:string;created_at:string;organization_id:string;organizations:OrgJoin};
type InterventionRow={id:string;title:string;status:string;scheduled_start:string|null;location:string|null;organization_id:string;organizations:OrgJoin};
type Overview={staff:{id:string;department:string;job_title:string;employment_status:string;permissions:Record<string,boolean>};profile:{full_name:string|null;email:string|null}|null;tickets:TicketRow[];interventions:InterventionRow[]};
function orgName(value:OrgJoin){return Array.isArray(value)?value[0]?.name??"Client":value?.name??"Client";}

export default function StaffHome(){
 const [data,setData]=useState<Overview|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [selectedTicket,setSelectedTicket]=useState("");
 const [minutes,setMinutes]=useState("30");
 const [description,setDescription]=useState("");
 const [billable,setBillable]=useState(true);
 const [saving,setSaving]=useState(false);

 async function load(){
  setLoading(true);setError("");
  const response=await fetch("/api/staff/overview",{cache:"no-store"});
  const result=await response.json();
  if(!response.ok){setError(result.error==="staff_access_inactive"?"Votre compte employé n'est pas encore activé. Contactez votre administrateur BN2.":"Impossible de charger votre espace de travail.");setLoading(false);return;}
  setData(result);
  if(!selectedTicket&&result.tickets?.[0])setSelectedTicket(result.tickets[0].id);
  setLoading(false);
 }
 useEffect(()=>{void load();},[]);

 async function updateTicket(id:string,status:string){
  const {error:updateError}=await createClient().from("support_tickets").update({status}).eq("id",id);
  if(updateError)setError(updateError.message);else{setNotice("Demande mise à jour.");await load();}
 }
 async function updateIntervention(id:string,status:string){
  const {error:updateError}=await createClient().from("interventions").update({status}).eq("id",id);
  if(updateError)setError(updateError.message);else{setNotice("Intervention mise à jour.");await load();}
 }
 async function logTime(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");setNotice("");
  const ticket=data?.tickets.find(item=>item.id===selectedTicket);
  if(!ticket||!description.trim()||Number(minutes)<=0){setError("Sélectionnez une demande et indiquez le temps presté.");return;}
  setSaving(true);
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const {error:insertError}=await supabase.from("work_logs").insert({organization_id:ticket.organization_id,ticket_id:ticket.id,logged_by:user?.id??"",minutes:Number(minutes),description:description.trim(),billable});
  if(insertError)setError(insertError.message);else{setNotice("Temps de travail enregistré.");setDescription("");}
  setSaving(false);
 }
 async function signOut(){await createClient().auth.signOut();window.location.assign("/login");}
 const name=data?.profile?.full_name||"Équipe BN2";
 return <main className="bn2-staff-shell">
  <header className="bn2-staff-top"><div className="bn2-staff-brand"><span>BN2</span><div><strong>BN2 HUB</strong><small>ESPACE ÉQUIPE</small></div></div><div className="bn2-staff-top-actions"><Link href="/portal/assistant"><Bot size={15}/> Assistant IA</Link><button onClick={signOut}><LogOut size={15}/> Déconnexion</button></div></header>
  <div className="bn2-staff-content">
   <div className="bn2-staff-welcome"><div><div className="bn2-staff-eyebrow">ESPACE DE TRAVAIL · BN2 CONSULTING</div><h1>Bonjour {name.split(" ")[0]}.</h1><p>Voici vos demandes et interventions assignées.</p></div><button className="bn2-staff-refresh" onClick={()=>void load()}><RefreshCw size={15}/> Actualiser</button></div>
   {error&&<div className="bn2-staff-alert">{error}</div>}{notice&&<div className="bn2-staff-notice"><CheckCircle2 size={15}/>{notice}</div>}
   {loading?<div className="bn2-staff-loading">Chargement de votre espace...</div>:data&&<>
    <div className="bn2-staff-stats"><article><span><Ticket size={17}/></span><div><strong>{data.tickets.length}</strong><small>Demandes assignées</small></div></article><article><span><BriefcaseBusiness size={17}/></span><div><strong>{data.interventions.length}</strong><small>Interventions planifiées</small></div></article><article><span><ShieldCheck size={17}/></span><div><strong>{data.staff.department}</strong><small>{data.staff.job_title}</small></div></article></div>
    <div className="bn2-staff-grid">
     <section className="bn2-staff-panel"><div className="bn2-staff-panel-heading"><div><Ticket size={17}/><div><h2>Mes demandes support</h2><p>Tickets qui vous sont attribués.</p></div></div></div>
      {data.tickets.length===0?<div className="bn2-staff-empty">Aucune demande ne vous est attribuée.</div>:data.tickets.map(ticket=><article className="bn2-staff-row" key={ticket.id}><div className="bn2-staff-row-main"><small>{ticket.ticket_number} · {orgName(ticket.organizations)}</small><strong>{ticket.title}</strong><span>{ticket.priority} · {new Date(ticket.created_at).toLocaleDateString("fr-BE")}</span></div><select value={ticket.status} onChange={event=>void updateTicket(ticket.id,event.target.value)}><option value="new">Nouvelle</option><option value="waiting_bn2">À vérifier</option><option value="in_progress">En cours</option><option value="waiting_customer">En attente client</option><option value="resolved">Résolue</option><option value="closed">Fermée</option></select></article>)}
     </section>
     <section className="bn2-staff-panel"><div className="bn2-staff-panel-heading"><div><CalendarClock size={17}/><div><h2>Mes interventions</h2><p>Interventions qui vous sont attribuées.</p></div></div></div>
      {data.interventions.length===0?<div className="bn2-staff-empty">Aucune intervention ne vous est attribuée.</div>:data.interventions.map(item=><article className="bn2-staff-row" key={item.id}><div className="bn2-staff-row-main"><small>{orgName(item.organizations)} · {item.scheduled_start?new Date(item.scheduled_start).toLocaleString("fr-BE"):"À planifier"}</small><strong>{item.title}</strong><span>{item.location||"Lieu à confirmer"}</span></div><select value={item.status} onChange={event=>void updateIntervention(item.id,event.target.value)}><option value="planned">Planifiée</option><option value="confirmed">Confirmée</option><option value="in_progress">En cours</option><option value="completed">Terminée</option><option value="cancelled">Annulée</option></select></article>)}
     </section>
    </div>
    {data.staff.permissions["worklogs.create"]&&<section className="bn2-staff-panel bn2-staff-log"><div className="bn2-staff-panel-heading"><div><Timer size={17}/><div><h2>Enregistrer du temps</h2><p>Ajoutez votre temps presté sur une demande.</p></div></div></div>
     <form onSubmit={logTime}><label>Demande<select value={selectedTicket} onChange={event=>setSelectedTicket(event.target.value)} required><option value="">Sélectionner une demande</option>{data.tickets.map(ticket=><option key={ticket.id} value={ticket.id}>{ticket.ticket_number} · {ticket.title}</option>)}</select></label><label>Durée (minutes)<input type="number" min="1" max="1440" value={minutes} onChange={event=>setMinutes(event.target.value)} required/></label><label className="wide">Compte rendu<textarea value={description} onChange={event=>setDescription(event.target.value)} required minLength={5} placeholder="Travail réalisé, diagnostic, résultat..."/></label><label className="bn2-staff-billable"><input type="checkbox" checked={billable} onChange={event=>setBillable(event.target.checked)}/> Temps facturable</label><button type="submit" disabled={saving||!selectedTicket}><Plus size={15}/>{saving?"Enregistrement...":"Enregistrer le temps"}</button></form>
    </section>}
   </>}
   <footer className="bn2-staff-footer"><ShieldCheck size={14}/> Accès interne protégé · {data?.staff.employment_status==="active"?"Compte actif":"Compte invité"}</footer>
  </div>
 </main>;
}
