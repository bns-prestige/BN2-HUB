"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Bot, Building2, Check, CheckCircle2, ChevronDown,
  ChevronRight, CircleHelp, Cloud, FileText, HardDrive, LayoutDashboard,
  LifeBuoy, Monitor, Palette, Settings2, ShieldCheck, Sparkles,
  Users, WandSparkles,
} from "lucide-react";

const moduleOptions = [
  { id: "dashboard", label: "Vue d'ensemble", description: "Indicateurs et activité récente", icon: LayoutDashboard },
  { id: "support", label: "Support & demandes", description: "Tickets, priorités et échanges", icon: LifeBuoy },
  { id: "equipment", label: "Parc informatique", description: "Ordinateurs, licences et matériel", icon: HardDrive },
  { id: "documents", label: "Documents", description: "Contrats, procédures et fichiers", icon: FileText },
  { id: "team", label: "Utilisateurs", description: "Collaborateurs et accès", icon: Users },
  { id: "cloud", label: "Microsoft 365", description: "Comptes, services et licences", icon: Cloud },
];

const palettes = [
  { id: "violet", label: "Violet BN2", color: "#6958df", soft: "#f0efff" },
  { id: "blue", label: "Bleu", color: "#3977d5", soft: "#edf4ff" },
  { id: "teal", label: "Turquoise", color: "#259b91", soft: "#eaf8f6" },
  { id: "slate", label: "Ardoise", color: "#52627d", soft: "#eff2f7" },
];

export default function ClientBuilderPage() {
  const [company, setCompany] = useState("Atelier Nova");
  const [sector, setSector] = useState("Services professionnels");
  const [description, setDescription] = useState("Une entreprise qui souhaite centraliser son support informatique et le suivi de son matériel.");
  const [selectedModules, setSelectedModules] = useState(["dashboard", "support", "equipment", "documents", "team"]);
  const [palette, setPalette] = useState("violet");
  const [prepared, setPrepared] = useState(false);
  const [activePreview, setActivePreview] = useState("dashboard");
  const selectedPalette = palettes.find((item) => item.id === palette) ?? palettes[0];
  const selectedLabels = useMemo(
    () => moduleOptions.filter((item) => selectedModules.includes(item.id)),
    [selectedModules],
  );

  function toggleModule(id: string) {
    setPrepared(false);
    setSelectedModules((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <main className="builder-shell">
      <header className="builder-topbar">
        <Link className="builder-back" href="/"><ArrowLeft size={17}/> Retour à BN2 HUB</Link>
        <div className="builder-brand"><span className="builder-brand-mark">BN2</span><span>HUB <i>STUDIO</i></span></div>
        <div className="builder-top-status"><span/> Environnement administrateur</div>
      </header>

      <div className="builder-content">
        <div className="builder-heading">
          <div>
            <div className="builder-eyebrow"><Sparkles size={13}/> CONFIGURATION ASSISTÉE</div>
            <h1>Créer un portail client</h1>
            <p>Préparez un espace personnalisé à partir du modèle sécurisé BN2 HUB.</p>
          </div>
          <div className="builder-heading-note"><ShieldCheck size={16}/><span>Un modèle commun.<br/><strong>Un espace isolé par client.</strong></span></div>
        </div>

        <div className="builder-steps">
          <div className="builder-step active"><span>1</span><div><strong>Entreprise</strong><small>Identité et contexte</small></div></div>
          <div className="builder-step-line"/>
          <div className="builder-step active"><span>2</span><div><strong>Modules</strong><small>Fonctionnalités</small></div></div>
          <div className="builder-step-line"/>
          <div className={`builder-step ${prepared ? "complete" : ""}`}><span>{prepared ? <Check size={14}/> : "3"}</span><div><strong>Aperçu</strong><small>Vérification</small></div></div>
        </div>

        <div className="builder-layout">
          <section className="builder-config">
            <div className="builder-section-title"><div className="builder-section-icon"><Building2 size={18}/></div><div><h2>Identité de l&apos;entreprise</h2><p>Ces informations servent à personnaliser le portail.</p></div></div>
            <div className="builder-fields">
              <label>Nom de l&apos;entreprise<input value={company} onChange={(event) => {setCompany(event.target.value); setPrepared(false);}} placeholder="Ex. : Atelier Nova"/></label>
              <label>Secteur d&apos;activité<div className="builder-select-wrap"><select value={sector} onChange={(event) => {setSector(event.target.value); setPrepared(false);}}><option>Services professionnels</option><option>Commerce & distribution</option><option>Industrie</option><option>Construction</option><option>Santé</option><option>Association</option><option>Autre</option></select><ChevronDown size={15}/></div></label>
              <label className="builder-full-field">Contexte et besoins<textarea value={description} onChange={(event) => {setDescription(event.target.value); setPrepared(false);}} rows={3} placeholder="Décrivez les besoins de l'entreprise..."/></label>
            </div>

            <div className="builder-divider"/>
            <div className="builder-section-title"><div className="builder-section-icon"><Settings2 size={18}/></div><div><h2>Modules du portail</h2><p>Activez uniquement les espaces utiles à cette entreprise.</p></div><span className="builder-selected-count">{selectedModules.length} sélectionnés</span></div>
            <div className="builder-module-grid">
              {moduleOptions.map((item) => {
                const Icon = item.icon;
                const checked = selectedModules.includes(item.id);
                return <button type="button" key={item.id} className={`builder-module ${checked ? "chosen" : ""}`} onClick={() => toggleModule(item.id)} aria-pressed={checked}>
                  <span className="builder-module-check">{checked && <Check size={12}/>}</span><span className="builder-module-icon"><Icon size={17}/></span><strong>{item.label}</strong><small>{item.description}</small>
                </button>;
              })}
            </div>

            <div className="builder-divider"/>
            <div className="builder-section-title"><div className="builder-section-icon"><Palette size={18}/></div><div><h2>Identité visuelle</h2><p>Choisissez une couleur d'accent pour ce portail.</p></div></div>
            <div className="builder-palette-list">
              {palettes.map((item) => <button type="button" key={item.id} className={`builder-palette ${palette === item.id ? "chosen" : ""}`} onClick={() => {setPalette(item.id); setPrepared(false);}}><span style={{ background: item.color }}/>{item.label}{palette === item.id && <CheckCircle2 size={15}/>}</button>)}
            </div>

            <div className="builder-ai-note"><span className="builder-ai-note-icon"><Bot size={19}/></span><div><strong>Assistant de configuration BN2</strong><p>Le moteur IA proposera les menus, textes et réglages à partir de ces informations. Toute proposition devra être vérifiée avant publication.</p><small><CircleHelp size={12}/> Le moteur IA et la sauvegarde Supabase restent à connecter.</small></div></div>
            <button className="builder-generate" type="button" disabled={!company.trim() || selectedModules.length === 0} onClick={() => {setPrepared(true); setActivePreview("dashboard");}}><WandSparkles size={17}/> Préparer la proposition <ArrowRight size={16}/></button>
          </section>

          <aside className="builder-preview-column">
            <div className="builder-preview-heading"><div><span className="builder-live-dot"/> APERÇU EN DIRECT</div><span>Modèle client</span></div>
            <div className="client-preview" style={{ "--preview-accent": selectedPalette.color, "--preview-soft": selectedPalette.soft } as React.CSSProperties}>
              <div className="preview-top"><div className="preview-logo"><span>{company.trim().slice(0, 2).toUpperCase() || "CL"}</span><strong>{company || "Votre entreprise"}</strong></div><div className="preview-user">JD</div></div>
              <div className="preview-body">
                <div className="preview-sidebar">
                  <div className="preview-sidebar-label">ESPACE CLIENT</div>
                  {selectedLabels.map((item) => {
                    const Icon = item.icon;
                    return <button type="button" key={item.id} className={activePreview === item.id ? "active" : ""} onClick={() => setActivePreview(item.id)}><Icon size={14}/><span>{item.label}</span></button>;
                  })}
                  <div className="preview-sidebar-bottom"><ShieldCheck size={13}/> Portail sécurisé</div>
                </div>
                <div className="preview-main">
                  <div className="preview-welcome"><small>ESPACE ENTREPRISE</small><h3>Bonjour, bienvenue.</h3><p>Retrouvez vos services informatiques au même endroit.</p></div>
                  <div className="preview-stat-row"><div><small>Demandes ouvertes</small><strong>03</strong></div><div><small>Équipements</small><strong>12</strong></div></div>
                  <div className="preview-content-card"><div className="preview-content-head"><strong>{moduleOptions.find((item) => item.id === activePreview)?.label ?? "Vue d'ensemble"}</strong><span>Voir tout <ChevronRight size={11}/></span></div><div className="preview-fake-row"><i/><span/><b/></div><div className="preview-fake-row"><i/><span/><b/></div><div className="preview-fake-row"><i/><span/><b/></div></div>
                  <div className="preview-footer">Propulsé par <strong>BN2 HUB</strong></div>
                </div>
              </div>
            </div>
            <div className="builder-preview-summary">
              <div><span>Entreprise</span><strong>{company || "Non renseignée"}</strong></div>
              <div><span>Secteur</span><strong>{sector}</strong></div>
              <div><span>Modules activés</span><strong>{selectedModules.length} / {moduleOptions.length}</strong></div>
              <div><span>Thème</span><strong>{selectedPalette.label}</strong></div>
            </div>
            {prepared ? <div className="builder-prepared"><CheckCircle2 size={18}/><div><strong>Proposition prête à vérifier</strong><p>L&apos;aperçu a été actualisé. Aucune publication ni création de compte n'a été effectuée.</p></div></div> : <div className="builder-review-note"><Monitor size={17}/><span>La prévisualisation se met à jour pendant la configuration. Préparez une proposition pour passer à la vérification.</span></div>}
          </aside>
        </div>
        <footer className="builder-footer"><span>BN2 HUB STUDIO <b>•</b> BN2 Consulting</span><span>CONFIGURATION NON PUBLIÉE</span></footer>
      </div>
    </main>
  );
}
