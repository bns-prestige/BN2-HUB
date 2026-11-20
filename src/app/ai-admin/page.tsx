"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, BookOpen, Bot, Check, CircleAlert, FileText,  Plus, Save, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import "./ai-admin.css";

type Settings = { enabled:boolean; model_slug:string; system_instructions:string; tone:string; temperature:number; max_output_tokens:number };
type Knowledge = { id:string; organization_id:string|null; title:string; content:string; source_type:string; status:string; tags:string[]; version:number; updated_at:string; published_at:string|null };
type Organization = { id:string; name:string };

const defaults:Settings = {
  enabled:true, model_slug:"vmc/bn2-assistant",
  system_instructions:"Tu es BN2 Assistant, l’assistant informatique de BN2 Consulting. Réponds de façon claire, utile et professionnelle. N’invente jamais les informations propres à BN2 ou à un client. Si une information manque, indique-le et propose de transmettre la question à l’équipe.",
  tone:"Professionnel, clair, humain", temperature:0.3, max_output_tokens:1200,
};

export default function AiAdminPage() {
  const [settings,setSettings]=useState<Settings>(defaults);
  const [knowledge,setKnowledge]=useState<Knowledge[]>([]);
  const [organizations,setOrganizations]=useState<Organization[]>([]);
  const [userId,setUserId]=useState("");
  const [activeTab,setActiveTab]=useState<"instructions"|"knowledge">("instructions");
  const [selectedId,setSelectedId]=useState("");
  const [title,setTitle]=useState("");
  const [content,setContent]=useState("");
  const [sourceType,setSourceType]=useState("faq");
  const [sourceStatus,setSourceStatus]=useState("published");
  const [sourceOrg,setSourceOrg]=useState("");
  const [tags,setTags]=useState("");
  const [saving,setSaving]=useState(false);
  const [loading,setLoading]=useState(true);
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");

  async function load() {
    setLoading(true); setError("");
    const supabase=createClient();
    const {data:{user},error:authError}=await supabase.auth.getUser();
    if(authError||!user){window.location.assign("/login");return;}
    if(!["bn2_owner","bn2_admin"].includes(String(user.app_metadata?.role??""))){window.location.assign("/portal");return;}
    setUserId(user.id);
    const [settingsResult,knowledgeResult,orgResult]=await Promise.all([
      supabase.from("ai_assistant_settings").select("enabled,model_slug,system_instructions,tone,temperature,max_output_tokens").eq("id",true).single(),
      supabase.from("ai_knowledge_sources").select("id,organization_id,title,content,source_type,status,tags,version,updated_at,published_at").order("updated_at",{ascending:false}),
      supabase.from("organizations").select("id,name").order("name"),
    ]);
    const firstError=settingsResult.error??knowledgeResult.error??orgResult.error;
    if(firstError)setError(firstError.message);
    if(settingsResult.data)setSettings(settingsResult.data as Settings);
    setKnowledge((knowledgeResult.data??[]) as Knowledge[]);
    setOrganizations((orgResult.data??[]) as Organization[]);
    setLoading(false);
  }

  useEffect(()=>{void load();},[]);

  async function saveSettings(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setSaving(true);setNotice("");setError("");
    const supabase=createClient();
    const {error:saveError}=await supabase.from("ai_assistant_settings").update({...settings,updated_by:userId,updated_at:new Date().toISOString()}).eq("id",true);
    if(saveError){setError(saveError.message);setSaving(false);return;}
    const {error:archiveError}=await supabase.from("ai_prompt_versions").update({status:"archived"}).eq("status","published");
    if(archiveError){setError(archiveError.message);setSaving(false);return;}
    const {error:versionError}=await supabase.from("ai_prompt_versions").insert({
      model_slug:settings.model_slug,system_instructions:settings.system_instructions,
      changelog:"Publication depuis BN2 HUB AI Studio",status:"published",created_by:userId,published_at:new Date().toISOString(),
    });
    if(versionError){setError(versionError.message);setSaving(false);return;}
    setNotice("Configuration enregistrée et nouvelle version publiée.");
    setSaving(false);
  }

  function editSource(source:Knowledge) {
    setSelectedId(source.id);setTitle(source.title);setContent(source.content);
    setSourceType(source.source_type);setSourceStatus(source.status);
    setSourceOrg(source.organization_id??"");setTags((source.tags??[]).join(", "));
    setActiveTab("knowledge");
  }

  function resetSource() {
    setSelectedId("");setTitle("");setContent("");setSourceType("faq");
    setSourceStatus("published");setSourceOrg("");setTags("");
  }

  async function saveSource(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setSaving(true);setNotice("");setError("");
    const supabase=createClient();
    const payload={
      title:title.trim(),content:content.trim(),source_type:sourceType,status:sourceStatus,
      organization_id:sourceOrg||null,tags:tags.split(",").map(tag=>tag.trim()).filter(Boolean),
      updated_by:userId,updated_at:new Date().toISOString(),
      published_at:sourceStatus==="published"?new Date().toISOString():null,
      version:(knowledge.find(item=>item.id===selectedId)?.version??0)+1,
    };
    const result=selectedId
      ? await supabase.from("ai_knowledge_sources").update(payload).eq("id",selectedId)
      : await supabase.from("ai_knowledge_sources").insert({...payload,created_by:userId});
    if(result.error){setError(result.error.message);setSaving(false);return;}
    setNotice(selectedId?"Source mise à jour.":"Source ajoutée à la base de connaissances.");
    resetSource();await load();setSaving(false);
  }

  async function deleteSource(id:string) {
    if(!window.confirm("Supprimer définitivement cette source de connaissance ?"))return;
    const {error:deleteError}=await createClient().from("ai_knowledge_sources").delete().eq("id",id);
    if(deleteError)setError(deleteError.message);else{setNotice("Source supprimée.");setKnowledge(items=>items.filter(item=>item.id!==id));if(selectedId===id)resetSource();}
  }

  return <main className="bn2-ai-admin">
    <header className="bn2-ai-admin-top"><Link href="/" className="bn2-ai-admin-back"><ArrowLeft size={16}/> Retour à BN2 HUB</Link><div className="bn2-ai-admin-brand"><span><Bot size={19}/></span><div><strong>BN2 AI Studio</strong><small>CONFIGURATION DE L&apos;ASSISTANT</small></div></div><div className="bn2-ai-admin-status"><ShieldCheck size={15}/> Contrôle BN2</div></header>
    <div className="bn2-ai-admin-content">
      <div className="bn2-ai-admin-heading"><div><div className="bn2-ai-admin-eyebrow"><Sparkles size={13}/> INTELLIGENCE ARTIFICIELLE · BN2</div><h1>Gérer votre assistant IA</h1><p>Vous contrôlez ses règles, ses sources de connaissance, son ton et son modèle.</p></div><div className={"bn2-ai-status-pill "+(settings.enabled?"is-on":"is-off")}><span/>{settings.enabled?"Assistant activé":"Assistant désactivé"}</div></div>
      <div className="bn2-ai-tabs"><button className={activeTab==="instructions"?"active":""} onClick={()=>setActiveTab("instructions")}><Bot size={16}/> Instructions & modèle</button><button className={activeTab==="knowledge"?"active":""} onClick={()=>setActiveTab("knowledge")}><BookOpen size={16}/> Base de connaissances <span>{knowledge.length}</span></button></div>
      {error&&<div className="bn2-ai-alert error"><CircleAlert size={16}/>{error}</div>}
      {notice&&<div className="bn2-ai-alert success"><Check size={16}/>{notice}</div>}
      {loading?<div className="bn2-ai-loading">Chargement de la configuration...</div>:activeTab==="instructions"?
        <form className="bn2-ai-settings-grid" onSubmit={saveSettings}>
          <section className="bn2-ai-panel bn2-ai-main-settings">
            <div className="bn2-ai-panel-heading"><div><span className="bn2-ai-panel-icon"><Bot size={17}/></span><div><h2>Comportement de l&apos;assistant</h2><p>Ces instructions sont appliquées à chaque conversation.</p></div></div><label className="bn2-ai-toggle"><input type="checkbox" checked={settings.enabled} onChange={e=>setSettings(v=>({...v,enabled:e.target.checked}))}/><span/>{settings.enabled?"Activé":"Désactivé"}</label></div>
            <label className="bn2-ai-field">Instructions principales<textarea rows={12} value={settings.system_instructions} onChange={e=>setSettings(v=>({...v,system_instructions:e.target.value}))} required minLength={40}/><small>Définissez le rôle, les limites, la manière de répondre et les règles propres à BN2.</small></label>
            <label className="bn2-ai-field">Ton de réponse<input value={settings.tone} onChange={e=>setSettings(v=>({...v,tone:e.target.value}))} maxLength={120}/></label>
            <label className="bn2-ai-field">Modèle IA<input value={settings.model_slug} onChange={e=>setSettings(v=>({...v,model_slug:e.target.value.trim()}))} required pattern="[a-zA-Z0-9._/-]+"/><small>Modèle Vercel AI Gateway. Modèle actuel : vmc/bn2-assistant.</small></label>
            <div className="bn2-ai-inline-fields"><label className="bn2-ai-field">Température <strong>{settings.temperature.toFixed(1)}</strong><input type="range" min="0" max="1" step="0.1" value={settings.temperature} onChange={e=>setSettings(v=>({...v,temperature:Number(e.target.value)}))}/></label><label className="bn2-ai-field">Longueur maximale<select value={settings.max_output_tokens} onChange={e=>setSettings(v=>({...v,max_output_tokens:Number(e.target.value)}))}><option value={600}>600 tokens</option><option value={1200}>1 200 tokens</option><option value={2400}>2 400 tokens</option><option value={4000}>4 000 tokens</option></select></label></div>
            <label className="bn2-ai-check"><input type="checkbox" checked={settings.require_human_approval} onChange={e=>setSettings(v=>({...v,require_human_approval:e.target.checked}))}/> Les actions sensibles doivent être validées par un membre BN2.</label>
            <div className="bn2-ai-form-footer"><span>Les changements sont historisés à chaque publication.</span><button type="submit" disabled={saving}><Save size={15}/>{saving?"Publication...":"Enregistrer et publier"}</button></div>
          </section>
          <aside className="bn2-ai-panel bn2-ai-side-note"><div className="bn2-ai-side-icon"><ShieldCheck size={19}/></div><h3>Vous gardez le contrôle.</h3><p>L&apos;assistant utilise les connaissances générales pour les questions informatiques. Pour les informations spécifiques à BN2 et à chaque entreprise, il s&apos;appuie uniquement sur les sources publiées et les données autorisées.</p><div className="bn2-ai-note-row"><Check size={15}/> Sources de connaissance isolées par client</div><div className="bn2-ai-note-row"><Check size={15}/> Instructions contrôlées par BN2</div><div className="bn2-ai-note-row"><Check size={15}/> Historique des versions de prompt</div><div className="bn2-ai-note-row"><Check size={15}/> Aucune action externe n'est exécutée sans autorisation</div><div className="bn2-ai-disclaimer"><strong>À savoir</strong><span>Ajouter des documents à la base de connaissances améliore les réponses par recherche contextuelle (RAG). Cela n&apos;entraîne pas les poids du modèle.</span></div></aside>
        </form>:
        <div className="bn2-ai-knowledge-grid">
          <section className="bn2-ai-panel bn2-ai-source-list"><div className="bn2-ai-panel-heading"><div><span className="bn2-ai-panel-icon"><BookOpen size={17}/></span><div><h2>Sources de connaissance</h2><p>Procédures, FAQ, offres et informations vérifiées.</p></div></div><button className="bn2-ai-add" onClick={resetSource}><Plus size={15}/> Ajouter</button></div>
            {knowledge.length===0?<div className="bn2-ai-empty"><FileText size={24}/><strong>Aucune source pour le moment</strong><p>Ajoutez vos premières procédures et réponses de référence.</p></div>:knowledge.map(source=><article className={"bn2-ai-source "+(source.id===selectedId?"selected":"")} key={source.id}><button className="bn2-ai-source-main" onClick={()=>editSource(source)}><span className="bn2-ai-source-icon"><FileText size={16}/></span><span><strong>{source.title}</strong><small>{source.source_type.toUpperCase()} · V{source.version} · {source.organization_id?organizations.find(org=>org.id===source.organization_id)?.name??"Client":"GLOBAL BN2"}</small></span><i className={source.status==="published"?"published":"draft"}>{source.status==="published"?"Publié":source.status==="draft"?"Brouillon":"Archivé"}</i></button><button className="bn2-ai-delete" onClick={()=>void deleteSource(source.id)} aria-label={"Supprimer "+source.title}><Trash2 size={14}/></button></article>)}
          </section>
          <form className="bn2-ai-panel bn2-ai-source-editor" onSubmit={saveSource}>
            <div className="bn2-ai-panel-heading"><div><span className="bn2-ai-panel-icon"><FileText size={17}/></span><div><h2>{selectedId?"Modifier la source":"Nouvelle source"}</h2><p>Le contenu publié sera utilisé par l&apos;assistant.</p></div></div></div>
            <label className="bn2-ai-field">Titre<input value={title} onChange={e=>setTitle(e.target.value)} required maxLength={180} placeholder="Ex. : Procédure de réinitialisation du mot de passe"/></label>
            <label className="bn2-ai-field">Contenu de référence<textarea value={content} onChange={e=>setContent(e.target.value)} required minLength={20} rows={12} placeholder="Décrivez la procédure, les conditions, les étapes et les limites..."/></label>
            <div className="bn2-ai-inline-fields"><label className="bn2-ai-field">Type<select value={sourceType} onChange={e=>setSourceType(e.target.value)}><option value="faq">FAQ</option><option value="manual">Note interne</option><option value="procedure">Procédure</option><option value="document">Document</option><option value="url">Source web</option></select></label><label className="bn2-ai-field">Publication<select value={sourceStatus} onChange={e=>setSourceStatus(e.target.value)}><option value="draft">Brouillon</option><option value="published">Publié</option><option value="archived">Archivé</option></select></label></div>
            <label className="bn2-ai-field">Portée<select value={sourceOrg} onChange={e=>setSourceOrg(e.target.value)}><option value="">Connaissance globale BN2</option>{organizations.map(org=><option key={org.id} value={org.id}>{org.name}</option>)}</select><small>Une source globale peut être utilisée dans tous les portails. Une source client est visible uniquement dans le portail de cette entreprise.</small></label>
            <label className="bn2-ai-field">Mots-clés<input value={tags} onChange={e=>setTags(e.target.value)} placeholder="outlook, accès, sécurité"/></label>
            <div className="bn2-ai-form-footer"><button type="button" className="bn2-ai-secondary" onClick={resetSource}>Réinitialiser</button><button type="submit" disabled={saving}><Save size={15}/>{saving?"Enregistrement...":selectedId?"Enregistrer la source":"Ajouter à la base"}</button></div>
          </form>
        </div>
      }
    </div>
  </main>;
}
