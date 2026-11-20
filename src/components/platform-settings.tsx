"use client";

import { useCallback,useEffect,useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Building2,CheckCircle2,Clock3,Mail,Save,ShieldCheck,Wallet } from "lucide-react";

type SettingsValue=Record<string,unknown>;
type SettingsMap=Record<string,SettingsValue>;
type SystemStatus={emailConfigured:boolean;sender:string|null};

export default function PlatformSettings(){
 const [settings,setSettings]=useState<SettingsMap>({});
 const [system,setSystem]=useState<SystemStatus>({emailConfigured:false,sender:null});
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");

 const load=useCallback(async()=>{
  setLoading(true);setError("");
  const supabase=createClient();
  const [settingsResult,statusResponse]=await Promise.all([
   supabase.from("platform_settings").select("key,value").order("key"),
   fetch("/api/admin/system-status",{cache:"no-store"}),
  ]);
  if(settingsResult.error)setError(settingsResult.error.message);
  else{
   const next:SettingsMap={};
   for(const row of settingsResult.data??[])next[row.key]=(row.value&&typeof row.value==="object"&&!Array.isArray(row.value)?row.value:{}) as SettingsValue;
   setSettings(next);
  }
  if(statusResponse.ok)setSystem(await statusResponse.json());
  setLoading(false);
 },[]);
 useEffect(()=>{void load();},[load]);

 function value(group:string,key:string,fallback:string|number|boolean=""){
  return settings[group]?.[key]??fallback;
 }
 function setValue(group:string,key:string,next:unknown){
  setSettings(current=>({...current,[group]:{...(current[group]??{}),[key]:next}}));
 }
 function setSla(key:string,next:number){
  const current=(settings.support?.sla_hours??{}) as Record<string,number>;
  setValue("support","sla_hours",{...current,[key]:next});
 }
 async function save(){
  setSaving(true);setError("");setNotice("");
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const rows=Object.entries(settings).map(([key,val])=>({key,value:val,updated_by:user?.id??null}));
  const {error:saveError}=await supabase.from("platform_settings").upsert(rows,{onConflict:"key"});
  if(saveError)setError(saveError.message);else setNotice("Paramètres enregistrés.");
  setSaving(false);
 }

 if(loading)return <div className="admin-content"><div className="admin-panel bn2-settings-loading">Chargement des paramètres...</div></div>;
 return <div className="admin-content admin-section-content bn2-platform-settings">
  <div className="page-heading"><div><div className="page-eyebrow">BN2 HUB <span>•</span> CONFIGURATION</div><h1>Paramètres de la plateforme</h1><p>Centralisez l&apos;identité de l&apos;entreprise, les règles de support et la facturation.</p></div><button className="admin-primary-button" onClick={()=>void save()} disabled={saving}><Save size={15}/>{saving?"Enregistrement...":"Enregistrer"}</button></div>
  {error&&<div className="bn2-settings-alert error">{error}</div>}{notice&&<div className="bn2-settings-alert success"><CheckCircle2 size={14}/>{notice}</div>}
  <div className="bn2-settings-grid">
   <section className="admin-panel bn2-settings-card"><div className="bn2-settings-title"><Building2 size={18}/><div><h2>Identité de l&apos;entreprise</h2><p>Informations utilisées sur les documents et communications BN2.</p></div></div>
    <div className="bn2-settings-fields"><label>Nom commercial<input value={String(value("company_profile","display_name","BN2 Consulting"))} onChange={e=>setValue("company_profile","display_name",e.target.value)}/></label><label>Raison sociale<input value={String(value("company_profile","legal_name"))} onChange={e=>setValue("company_profile","legal_name",e.target.value)}/></label><label>Numéro de TVA<input value={String(value("company_profile","vat_number"))} onChange={e=>setValue("company_profile","vat_number",e.target.value)} placeholder="BE 0XXX.XXX.XXX"/></label><label>E-mail de contact<input type="email" value={String(value("company_profile","email"))} onChange={e=>setValue("company_profile","email",e.target.value)}/></label><label>Téléphone<input value={String(value("company_profile","phone"))} onChange={e=>setValue("company_profile","phone",e.target.value)}/></label><label>Site web<input value={String(value("company_profile","website"))} onChange={e=>setValue("company_profile","website",e.target.value)}/></label><label className="wide">Adresse complète<textarea rows={2} value={String(value("company_profile","address"))} onChange={e=>setValue("company_profile","address",e.target.value)}/></label></div>
   </section>
   <section className="admin-panel bn2-settings-card"><div className="bn2-settings-title"><Clock3 size={18}/><div><h2>Support & SLA</h2><p>Délais de première prise en charge selon la priorité.</p></div></div>
    <label className="bn2-settings-single">Adresse support<input type="email" value={String(value("support","support_email"))} onChange={e=>setValue("support","support_email",e.target.value)} placeholder="support@votre-domaine.be"/></label>
    <label className="bn2-settings-single">Heures d&apos;ouverture<input value={String(value("support","business_hours","Lundi–Vendredi, 09:00–17:00"))} onChange={e=>setValue("support","business_hours",e.target.value)}/></label>
    <div className="bn2-settings-sla"><strong>Objectifs de prise en charge (heures)</strong>{(["urgent","high","normal","low"] as const).map((key)=><label key={key}><span>{key==="urgent"?"Urgente":key==="high"?"Haute":key==="normal"?"Normale":"Basse"}</span><input type="number" min="1" max="720" value={String(((value("support","sla_hours",{}) as Record<string,number>)[key])??(key==="urgent"?4:key==="high"?24:key==="normal"?72:120))} onChange={e=>setSla(key,Number(e.target.value))}/></label>)}</div>
   </section>
   <section className="admin-panel bn2-settings-card"><div className="bn2-settings-title"><Wallet size={18}/><div><h2>Facturation</h2><p>Valeurs par défaut appliquées aux nouvelles factures.</p></div></div>
    <div className="bn2-settings-fields"><label>Devise<select value={String(value("billing","currency","EUR"))} onChange={e=>setValue("billing","currency",e.target.value)}><option value="EUR">Euro (€)</option><option value="USD">Dollar ($)</option><option value="GBP">Livre (£)</option></select></label><label>TVA par défaut (%)<input type="number" min="0" max="100" step="0.1" value={String(value("billing","vat_rate",21))} onChange={e=>setValue("billing","vat_rate",Number(e.target.value))}/></label><label>Délai de paiement (jours)<input type="number" min="0" max="365" value={String(value("billing","payment_terms_days",30))} onChange={e=>setValue("billing","payment_terms_days",Number(e.target.value))}/></label><label>Préfixe des factures<input value={String(value("billing","invoice_prefix","BN2"))} onChange={e=>setValue("billing","invoice_prefix",e.target.value.toUpperCase())}/></label></div>
   </section>
   <section className="admin-panel bn2-settings-card"><div className="bn2-settings-title"><Mail size={18}/><div><h2>Notifications</h2><p>Choisissez les canaux utilisés par BN2 HUB.</p></div></div>
    <label className="bn2-settings-toggle"><span><strong>Notifications dans BN2 HUB</strong><small>Alertes visibles dans les espaces client et équipe.</small></span><input type="checkbox" checked={value("notifications","in_app_enabled",true)===true} onChange={e=>setValue("notifications","in_app_enabled",e.target.checked)}/></label>
    <label className={"bn2-settings-toggle "+(!system.emailConfigured?"disabled":"")}><span><strong>E-mails automatiques</strong><small>{system.emailConfigured?"Expéditeur configuré : "+(system.sender??"Resend"):"Installez Resend et configurez une adresse d'expédition vérifiée pour activer les e-mails."}</small></span><input type="checkbox" checked={value("notifications","email_enabled",false)===true} disabled={!system.emailConfigured} onChange={e=>setValue("notifications","email_enabled",e.target.checked)}/></label>
    {!system.emailConfigured&&<a className="bn2-settings-link" href="https://vercel.com/marketplace/resend" target="_blank" rel="noreferrer">Configurer Resend sur Vercel <Mail size={13}/></a>}
   </section>
   <section className="admin-panel bn2-settings-card"><div className="bn2-settings-title"><ShieldCheck size={18}/><div><h2>Sécurité</h2><p>Réglages de sécurité de l&apos;espace BN2.</p></div></div>
    <div className="bn2-settings-readonly"><strong>Authentification</strong><span>Supabase Auth · sessions sécurisées · rôles et permissions</span></div>
    <div className="bn2-settings-readonly"><strong>Isolation des données</strong><span>Row Level Security activée sur les tables métier.</span></div>
    <div className="bn2-settings-readonly"><strong>Authentification multifacteur</strong><span>À activer après configuration des facteurs MFA et de la procédure de récupération.</span></div>
   </section>
  </div>
 </div>;
}
