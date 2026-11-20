"use client";

import Link from "next/link";
import {
  ChevronRight, CircleAlert, Clock3, FileText, Plus, ShieldCheck, Sparkles, Users,
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
      {cells:["BN2-2026-0040","Ajout d'un utilisateur","Cabinet Dewael","Normale","À vérifier"],priority:"Normale",status:"À vérifier"},
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
    intro: "Retrouvez les contrats, rapports d'intervention et documents partagés.",
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
  {icon:ShieldCheck,title:"Sécurité & accès",text:"Rôles, autorisations et politiques d'accès",tag:"Prioritaire"},
  {icon:Users,title:"Gestion des utilisateurs",text:"Comptes administrateurs et membres BN2",tag:"Configuration"},
  {icon:Sparkles,title:"Assistant IA",text:"Modèle, instructions et sources autorisées",tag:"À configurer"},
  {icon:FileText,title:"Modèles de documents",text:"Contrats, rapports et modèles PDF",tag:"Configuration"},
  {icon:ShieldCheck,title:"Hébergement & infrastructure",text:"Domaines, stockage, sauvegardes et disponibilité",tag:"Infrastructure"},
];

export default function AdminSectionView({ active }: { active: string }) {
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
