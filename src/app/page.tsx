const tickets = [
  { id: "BN2-2026-0042", title: "Accès à la boîte mail partagée", category: "Microsoft 365 · Aujourd'hui, 09:42", status: "Nouvelle", tone: "new" },
  { id: "BN2-2026-0041", title: "Configuration du nouvel ordinateur", category: "Matériel · Hier, 16:18", status: "En cours", tone: "progress" },
  { id: "BN2-2026-0039", title: "Problème de connexion VPN", category: "Réseau · 18 nov. 2026", status: "Résolue", tone: "done" },
];
const activities = [
  { icon: "＋", title: "Nouvelle demande reçue", detail: "Accès à la boîte mail partagée", time: "Il y a 18 min" },
  { icon: "✓", title: "Intervention clôturée", detail: "Mise à jour du poste de travail", time: "Hier, 15:32" },
  { icon: "↗", title: "Contrat mis à jour", detail: "Renouvellement enregistré", time: "18 nov. 2026" },
];
export default function Home() {
  return (
    <main className="hub-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">BN2</div><div><div className="brand-name">BN2 HUB</div><div className="brand-sub">L'espace de gestion</div></div></div>
        <div><div className="nav-label">ESPACE DE TRAVAIL</div><nav className="nav-list" aria-label="Navigation principale">
          <a className="nav-item active" href="#overview"><span className="nav-icon">▦</span>Vue d'ensemble</a>
          <a className="nav-item" href="#requests"><span className="nav-icon">◷</span>Demandes support</a>
          <a className="nav-item" href="#interventions"><span className="nav-icon">⌘</span>Interventions</a>
          <a className="nav-item" href="#assets"><span className="nav-icon">▤</span>Parc informatique</a>
          <a className="nav-item" href="#documents"><span className="nav-icon">▧</span>Documents</a>
          <a className="nav-item" href="#contracts"><span className="nav-icon">◫</span>Contrat & heures</a>
        </nav></div>
        <div className="sidebar-bottom">
          <div className="help-card"><strong>Besoin d'assistance ?</strong><p>Notre équipe est là pour vous accompagner dans vos demandes informatiques.</p><a className="help-link" href="mailto:support@bn2consulting.be">Contacter BN2 ↗</a></div>
          <div className="profile-mini"><div className="avatar">AD</div><div><div className="profile-name">Administrateur démo</div><div className="profile-role">Espace client · Démonstration</div></div></div>
        </div>
      </aside>
      <section className="main" id="overview">
        <header className="topbar"><div className="breadcrumb">BN2 HUB <span> / </span> <strong>Vue d'ensemble</strong></div><div className="top-actions"><button className="icon-button" aria-label="Notifications">♧</button><div className="top-avatar">AD</div></div></header>
        <section className="welcome"><div><div className="eyebrow">ESPACE CLIENT · DÉMONSTRATION</div><h1>Bonjour, bienvenue 👋</h1><p className="subtitle">Voici le résumé de l'activité de votre espace informatique.</p></div><button className="primary-button">＋ Créer une demande</button></section>
        <section className="metrics" aria-label="Indicateurs de démonstration">
          <article className="metric"><div className="metric-top"><span>Demandes ouvertes</span><span className="metric-icon">◷</span></div><div className="metric-value">08</div><div className="metric-foot">2 demandes prioritaires</div></article>
          <article className="metric"><div className="metric-top"><span>Interventions ce mois</span><span className="metric-icon">⌘</span></div><div className="metric-value">12</div><div className="metric-foot">Sur site et à distance</div></article>
          <article className="metric"><div className="metric-top"><span>Heures disponibles</span><span className="metric-icon">◴</span></div><div className="metric-value">06h 30</div><div className="metric-foot">Sur votre forfait actuel</div></article>
          <article className="metric"><div className="metric-top"><span>Équipements suivis</span><span className="metric-icon">▣</span></div><div className="metric-value">24</div><div className="metric-foot">Postes et périphériques</div></article>
        </section>
        <section className="content-grid">
          <article className="panel" id="requests"><div className="panel-head"><h2 className="panel-title">Demandes récentes</h2><a className="panel-action" href="#requests">Voir toutes les demandes ↗</a></div><div className="ticket-list">
            {tickets.map((ticket) => <div className="ticket" key={ticket.id}><div><div className="ticket-title">{ticket.title}</div><div className="ticket-meta">{ticket.id} · {ticket.category}</div></div><span className={`status ${ticket.tone}`}>{ticket.status}</span></div>)}
          </div></article>
          <article className="panel"><div className="panel-head"><h2 className="panel-title">Activité récente</h2><a className="panel-action" href="#overview">Historique ↗</a></div><div className="activity">
            {activities.map((item) => <div className="activity-item" key={item.title}><div className="activity-dot">{item.icon}</div><div><div className="activity-copy"><strong>{item.title}</strong><br />{item.detail}</div><div className="activity-time">{item.time}</div></div></div>)}
          </div><div className="notice"><strong>Interface de démonstration</strong><p>Les chiffres, demandes et activités affichés sont fictifs. La connexion à Supabase et les fonctionnalités métier seront ajoutées dans les prochaines étapes.</p></div></article>
        </section>
        <div className="footer-note">BN2 HUB · Une solution BN2 Consulting</div>
      </section>
    </main>
  );
}
