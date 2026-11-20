# BN2 HUB

BN2 HUB est la plateforme de gestion de **BN2 Consulting** : administration interne, suivi des opérations IT et portails privés pour les entreprises clientes.

## Architecture

- **Administration BN2** : support, entreprises clientes, interventions, calendrier, contrats, facturation, temps presté, équipements, documents, équipe et paramètres.
- **Portail client** : espace privé par organisation pour les demandes, échanges avec BN2, équipements, factures, documents, guides et assistant.
- **Espace équipe** : demandes assignées, interventions et encodage des heures.
- **Backend partagé** : le site BN2 Consulting et BN2 HUB utilisent le projet Supabase **BN2 Consulting** (almzypjgccucdkwnpldy).
- **Isolation multi-tenant** : les accès aux données client reposent sur PostgreSQL RLS et les appartenances d'organisation.
- **IA assistée** : réponses et recherche guidées par les règles BN2 et les sources de connaissance publiées. Les opérations sensibles restent soumises à validation humaine.

## Stack

- Next.js App Router, React et TypeScript
- Supabase Auth, PostgreSQL, RLS et Storage privé
- Vercel pour l'hébergement
- GitHub Actions : ESLint, TypeScript et build de production

## Identité visuelle

Le système visuel reprend l'identité BN2 Consulting : typographies Sora et Manrope, fonds atmosphériques discrets, surfaces translucides, accents bleu/violet, animations légères et prise en charge automatique des thèmes clair/sombre. L'interface privilégie les données utiles et les actions métier, sans graphiques décoratifs ni blocs de remplissage.

## Démarrage local

1. Installer Node.js 22.
2. Copier .env.example vers .env.local.
3. Renseigner les variables Supabase.
4. Installer les dépendances et démarrer :

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000.

## Variables d'environnement

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY (ou la clé publique Supabase équivalente)

Ne jamais committer .env.local, une clé service_role, un secret Supabase ou un mot de passe de base de données.

## Modules

- Administration : vue d'ensemble, support, clients, interventions, contrats, calendrier, facturation, heures prestées, parc informatique, documents, équipe, assistant IA, journal d'audit et paramètres.
- Portail client : accueil, demandes, création de demandes, parc informatique, factures, documents, guides et assistant IA.
- Espace équipe : demandes assignées, interventions assignées et encodage des heures.
- AI Studio : configuration de l'assistant et gestion de la base de connaissances.

Les écrans opérationnels lisent et écrivent les données Supabase selon les permissions du compte. Les éléments de navigation et les boutons doivent correspondre à une action réelle ; les données absentes sont présentées comme des états vides, pas comme des données fictives.

## Sécurité

- Toutes les tables métier exposées doivent appliquer RLS.
- Les rôles et permissions sont vérifiés côté serveur/base de données.
- Les données d'une organisation ne doivent jamais être accessibles à une autre organisation.
- Les documents sont stockés dans le bucket privé bn2-private et servis via des URL signées.
- Les opérations sensibles (comptes, onboarding/offboarding, permissions) nécessitent une autorisation explicite.
- Les secrets restent dans les variables d'environnement privées, jamais dans le code client.
