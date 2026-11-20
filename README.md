# BN2 HUB

Plateforme SaaS de BN2 Consulting : un espace d'administration interne et des portails informatiques privés pour les entreprises clientes.

## Architecture cible
- **BN2 HUB Admin** : gestion centralisée des entreprises, utilisateurs, contrats, demandes, interventions, équipements et documents.
- **Portail client** : espace personnalisé par organisation, construit à partir d'un template maître commun.
- **Backend partagé** : le site BN2 Consulting et BN2 HUB utilisent le projet Supabase **BN2 Consulting** (`almzypjgccucdkwnpldy`).
- **Multi-tenant** : isolation stricte des données par organisation avec PostgreSQL Row Level Security (RLS).
- **IA assistée** : l'IA aide à organiser les contenus et proposer des réponses ; les actions sensibles restent soumises à validation humaine.

## Stack
- Next.js App Router, React et TypeScript
- Supabase Auth, PostgreSQL et Storage
- Vercel pour l'hébergement
- CSS global pour le socle visuel initial

## Identité visuelle
- Sora pour les titres et Manrope pour les interfaces.
- Accents bleu et violet, modes clair et sombre à développer.
- Cartes arrondies, bordures fines et espaces généreux.
- Interface responsive et accessible.

## Démarrage local
1. Installer Node.js (version LTS recommandée).
2. Copier `.env.example` vers `.env.local`.
3. Renseigner les variables Supabase dans `.env.local`.
4. Installer les dépendances et démarrer :

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000.

## Variables d'environnement
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Ne jamais committer `.env.local`, une clé `service_role`, un secret Supabase ou un mot de passe de base de données.

## Structure initiale
```text
src/
  app/
    globals.css
    layout.tsx
    page.tsx
.env.example
.gitignore
next.config.ts
package.json
tsconfig.json
```

## État actuel
Le dépôt contient le socle Next.js/TypeScript et une première maquette responsive du portail client. Les données affichées sont fictives : aucune authentification, action métier, API ou connexion Supabase n'est encore activée.

## Règles de sécurité
- Toutes les tables métier exposées doivent appliquer RLS.
- Les accès sont déterminés par les appartenances et rôles stockés côté serveur/base de données.
- Aucune donnée d'une organisation ne doit être accessible à une autre organisation.
- Les opérations sensibles (comptes, onboarding/offboarding, permissions) nécessitent une autorisation explicite et une validation humaine.
- Les secrets restent dans les variables d'environnement privées, jamais dans le code client.