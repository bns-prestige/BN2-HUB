"use client";

import { useCallback,useEffect,useMemo,useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RefreshCw,Search } from "lucide-react";

type AuditRecord={id:number;actor_id:string|null;organization_id:string|null;action:string;entity_type:string;entity_id:string|null;details:unknown;created_at:string;organizations:{name?:string}|{name?:string}[]|null};
type Profile={id:string;full_name:string|null;email:string|null};
function orgName(value:AuditRecord["organizations"]){return Array.isArray(value)?value[0]?.name??"—":value?.name??"—";}
const labels:Record<string,string>={ticket_created:"Demande créée",ticket_status_changed:"Statut de demande modifié",ticket_message_sent:"Message envoyé",organization_created:"Entreprise créée",staff_invited:"Employé invité",staff_updated:"Accès employé modifié",intervention_created:"Intervention planifiée",intervention_status_changed:"Intervention mise à jour",invoice_created:"Facture créée",invoice_status_changed:"Facture mise à jour",initial_owner_activated:"Propriétaire activé",client_invitation_email_sent:"Invitation client envoyée"};

export default function AuditLogViewer(){
 const [rows,setRows]=useState<AuditRecord[]>([]);
 const [profiles,setProfiles]=useState<Record<string,string>>({});
 const [loading,setLoading]=useState(true);
 const [query,setQuery]=useState("");
 const [error,setError]=useState("");
 const [selected,setSelected]=useState<AuditRecord|null>(null);
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  const supabase=createClient();
  const {data,error:loadError}=await supabase.from("audit_logs").select("id,actor_id,organization_id,action,entity_type,entity_id,details,created_at,organizations(name)").order("created_at",{ascending:false}).limit(200);
  if(loadError){setError(loadError.message);setLoading(false);return;}
  const records=(data??[]) as AuditRecord[];setRows(records);
  const ids=[...new Set(records.map(row=>row.actor_id).filter((id):id is string=>Boolean(id)))];
  if(ids.length){const {data:people}=await supabase.from("profiles").select("id,full_name,email").in("id",ids);const names:Record<string,string>={};for(const person of (people??[]) as Profile[])names[person.id]=person.full_name||person.email||"Utilisateur";setProfiles(names);}
  setLoading(false);
 },[]);
 useEffect(()=>{void load();},[load]);
 const filtered=useMemo(()=>{const term=query.trim().toLowerCase();if(!term)return rows;return rows.filter(row=>(labels[row.action]??row.action).toLowerCase().includes(term)||row.entity_type.toLowerCase().includes(term)||orgName(row.organizations).toLowerCase().includes(term)||String(row.details??"").toLowerCase().includes(term)||String(profiles[row.actor_id??""]??"").toLowerCase().includes(term));},[rows,query,profiles]);
 return <div className="admin-content admin-section-content bn2-audit-page">
  <div className="page-heading"><div><div className="page-eyebrow">BN2 HUB <span>•</span> SÉCURITÉ & TRAÇABILITÉ</div><h1>Journal d&apos;audit</h1><p>Historique horodaté des actions importantes effectuées dans la plateforme.</p></div><button className="admin-secondary-button" onClick={()=>void load()}><RefreshCw size={14}/> Actualiser</button></div>
  <div className="bn2-audit-toolbar"><div><Search size={15}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Rechercher une action, un client ou un utilisateur..."/></div><span>{filtered.length} événements</span></div>
  {error&&<p role="alert" className="client-notice">{error}</p>}
  <section className="admin-panel bn2-audit-panel">{loading?<div className="queue-empty">Chargement du journal...</div>:filtered.length===0?<div className="queue-empty">Aucun événement ne correspond à cette recherche.</div>:<div className="table-wrap"><table className="requests-table"><thead><tr><th>DATE</th><th>ACTION</th><th>UTILISATEUR</th><th>ENTREPRISE</th><th>TYPE</th><th>DÉTAILS</th></tr></thead><tbody>{filtered.map(row=><tr key={row.id}><td>{new Date(row.created_at).toLocaleString("fr-BE",{dateStyle:"short",timeStyle:"short"})}</td><td><strong>{labels[row.action]??row.action.replaceAll("_"," ")}</strong></td><td>{profiles[row.actor_id??""]??"Système"}</td><td>{orgName(row.organizations)}</td><td>{row.entity_type}</td><td><button className="bn2-audit-detail-button" onClick={()=>setSelected(row)}>Consulter</button></td></tr>)}</tbody></table></div>}</section>
  {selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="bn2-audit-detail-modal" onClick={event=>event.stopPropagation()}><div><h2>Détails de l&apos;événement</h2><button onClick={()=>setSelected(null)}>×</button></div><p><strong>{labels[selected.action]??selected.action}</strong></p><small>{new Date(selected.created_at).toLocaleString("fr-BE")}</small><pre>{JSON.stringify(selected.details,null,2)}</pre><p className="bn2-audit-meta">ID : {selected.entity_id??"—"} · {selected.entity_type}</p></div></div>}
 </div>;
}
