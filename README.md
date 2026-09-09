# Lions Club IHEC Carthage — Plateforme d'Archives

Application web complète, dynamique et sécurisée de gestion des archives du Lions Club IHEC Carthage. Basée sur Next.js 14 (App Router), TypeScript, Prisma/PostgreSQL et NextAuth.js.

> 🔒 Le design (couleurs navy/or, typographie Playfair Display + DM Sans) est **identique** au prototype HTML fourni (`lions_club_archive.html`).

---

## ✨ Fonctionnalités

- **🔐 Authentification réelle** (email + mot de passe haché bcrypt) avec NextAuth v5
- **🎛️ Contrôle d'accès par rôles (RBAC)** :
  - **Admin / Secrétaire général** : accès complet (CRUD, upload, gestion accès)
  - **Membre** : lecture seule, bannière visible, API endpoints sécurisés côté serveur
- **📊 Tableau de bord dynamique** : statistiques calculées depuis la BDD, documents récents, sections d'archives
- **📋 6 modules métier** tous connectés à la base :
  1. Procès-verbaux (PV) — upload + métadonnées
  2. Actions & Événements — projets, statut, responsable
  3. Documents officiels — upload réel avec validation (50 Mo max)
  4. Base des membres — annuaire filtrable + fiches détaillées
  5. Partenaires & Sponsors — CRUD + conventions
  6. Paramètres — gestion accès, mandats, audit logs
- **☁️ Stockage fichiers** via **Supabase Storage** (S3-compatible, API via `@supabase/supabase-js`)
- **🔔 Notifications temps réel** (base + badge dynamique, marque comme lu)
- **🔍 Recherche globale** (documents, membres, événements)
- **🧾 Journal d'audit (AuditLog)** : traçabilité upload / suppression / changement de rôle
- **📱 Responsive** mobile/tablette respecté
- **🌱 Données de démonstration** via script de seed

---

## 🛠️ Stack technique

| Couche | Technologie | Justification |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + React 18 + TypeScript | SSR/SSG, performance, typage strict |
| **Styles** | CSS global + classes du prototype + Tailwind config | Migration fidèle du design existant |
| **Backend API** | Route Handlers Next.js (`app/api/...`) | Mono-repo, déploiement simple sur Vercel |
| **Base de données** | PostgreSQL via **Prisma ORM** | Migrations typées, schéma explicite |
| **Auth** | **NextAuth.js v5** + bcrypt | Sessions JWT sécurisées, adapters Prisma |
| **Fichiers** | **Supabase Storage** (ou S3) | Offre gratuite (1 GB), managed, simple |
| **Validation** | Zod (toutes entrées API) | Rejets explicites côté serveur |
| **Déploiement cible** | Vercel + Supabase (DB + Storage) | Zero-config, hébergement gratuit pour association |

---

## 🚀 Installation locale

### 1. Prérequis
- Node.js **≥ 18**
- PostgreSQL **≥ 14** (ou un compte [Supabase](https://supabase.com/))
- npm ou pnpm

### 2. Installation des dépendances

```bash
cd lions-club-archive
npm install
```

### 3. Variables d'environnement

Copiez `.env.example` vers `.env.local` et renseignez les valeurs :

```bash
cp .env.example .env.local
```

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:mdp@host:5432/lions` |
| `NEXTAUTH_SECRET` | Clé secrète NextAuth (générez une avec `openssl rand -hex 32`) | `8f3c...a91b` |
| `NEXTAUTH_URL` | URL de base de l'app | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon Supabase | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (upload sécurisé) | `eyJhbG...` |
| `SUPABASE_BUCKET_NAME` | Nom du bucket Storage (à créer dans Supabase) | `lions-club-archives` |

### 4. Création du schéma de base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Appliquer la migration initiale
npm run prisma:migrate -- --name init
```

> Sur Supabase : créez d'abord le projet, puis exécutez ces commandes en pointant `DATABASE_URL` sur le projet Supabase.

### 5. (Optionnel mais recommandé) Créer le bucket Supabase Storage

1. Dashboard Supabase → **Storage** → **New bucket**
2. Nom : `lions-club-archives` (doit correspondre à `SUPABASE_BUCKET_NAME`)
3. **Important** : configurer les **Policies** pour permettre la lecture des fichiers uploadés (par défaut bucket privé).

### 6. Insérer les données de démo

```bash
npm run prisma:seed
```

Identifiants de test après seed :
| Rôle | Email | Mot de passe |
|---|---|---|
| 🔑 **Admin** | `secretaire@lions-ihec.tn` | `admin123` |
| 👤 **Membre** | `membre@lions-ihec.tn` | `membre123` |

### 7. Lancer l'application en développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

---

## 📁 Structure du projet

```
lions-club-archive/
├── prisma/
│   ├── schema.prisma          # Schéma BDD + relations + enums
│   ├── migrations/            # Historique migrations Prisma
│   └── seed.ts                # Données de démonstration (exécutable)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout + SessionProvider + fonts
│   │   ├── page.tsx                # Redirect / → /login ou /dashboard
│   │   ├── globals.css             # TOUT le CSS du prototype migré (tokens + classes)
│   │   │
│   │   ├── login/                  # Page connexion NextAuth credentials
│   │   ├── forgot-password/        # Réinitialisation MDP
│   │   │
│   │   ├── (dashboard)/            # Route group PROTÉGÉE par middleware
│   │   │   ├── layout.tsx          # ← AppShell (Topbar + Sidebar + ReadonlyBanner)
│   │   │   ├── dashboard/
│   │   │   ├── pv/
│   │   │   ├── evenements/
│   │   │   ├── documents/
│   │   │   ├── membres/[id]/
│   │   │   ├── partenaires/
│   │   │   └── parametres/         # ← Accès admin SEUL (middleware 403)
│   │   │
│   │   └── api/                    # Tous les endpoints CRUD
│   │       ├── auth/[...nextauth]/ # NextAuth
│   │       ├── documents/          # GET/POST + upload multipart + DELETE
│   │       ├── pv/                 # CRUD PV
│   │       ├── evenements/         # CRUD événements
│   │       ├── membres/            # CRUD membres
│   │       ├── partenaires/        # CRUD partenaires
│   │       ├── utilisateurs/       # Gestion accès (admin only)
│   │       ├── dashboard/counts    # Stats sidebar + cards
│   │       ├── dashboard/recent    # Documents récents
│   │       ├── notifications/      # Liste + marquer lu
│   │       ├── search/             # Recherche globale
│   │       ├── audit/              # Journal d'activité (admin)
│   │       └── mandats/            # Gestion mandats
│   │
│   ├── components/
│   │   ├── layout/                 # AppShell, Topbar, Sidebar, ReadonlyBanner, SearchBar
│   │   ├── ui/                     # StatCard, FolderCard, MemberCard, Modal, UploadZone, Badge...
│   │   └── forms/                  # DocumentUploadModal (réutilisable)
│   │
│   ├── lib/
│   │   ├── prisma.ts               # Singleton PrismaClient
│   │   ├── auth.ts                 # NextAuth config + helpers requireAdmin()
│   │   ├── storage.ts              # Client Supabase Storage + validation fichiers
│   │   ├── validators.ts           # Zod schemas (toutes entrées API)
│   │   ├── notifications.ts        # createNotification + notifyAdmins + audit logs
│   │   └── utils.ts                # formatDate, formatFileSize, SECTION_LABELS, getInitials...
│   │
│   ├── hooks/
│   │   ├── useUser.ts              # useSession() + helper isAdmin
│   │   ├── useNotifications.ts     # Fetch périodique (30 s) + markAsRead
│   │   └── useDebounce.ts          # Pour la recherche globale
│   │
│   ├── types/index.ts              # Ré-exporst Prisma enums + SessionUser
│   └── middleware.ts               # PROTECTION routes avant exécution
│
├── package.json
├── tailwind.config.ts              # Tokens design importés du prototype
├── next.config.js
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🔐 Sécurité

| Risque | Mesure |
|---|---|
| **Accès non authentifié** | `middleware.ts` Next.js protège TOUTES les routes `/dashboard`, `/api/documents/*`, etc. |
| **Élévation de privilèges** | Chaque endpoint `POST/PATCH/DELETE` appelle `requireAdmin()` côté serveur (pas juste `display:none`). |
| **Injection SQL** | Prisma ORM (requêtes paramétrées systématiques). |
| **XSS** | React échappe par défaut + validation Zod de toutes les entrées. |
| **Mots de passe** | Hachage **bcrypt (cost=12)** — jamais stocké en clair. |
| **Upload malveillant** | Vérification **type MIME réel** + extension + taille (≤ 50 Mo) + nom de fichier assaini. |
| **CSRF** | NextAuth v5 gère le CSRF token sur les auth ; middleware Next.js vérifie les en-têtes. |

---

## 🚢 Déploiement en production

### Option recommandée : **Vercel + Supabase** (gratuit pour petite association)

1. **Créer un projet Supabase**
   - PostgreSQL, Storage, Auth managés
   - Créer le bucket `lions-club-archives` dans **Storage**
   - Récupérer `URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`

2. **Déployer sur Vercel**
   - Fork / Push du projet sur GitHub
   - Vercel → **Import Project** → lier le repo
   - Coller **toutes les variables d'environnement** (section `.env.example`) dans Vercel Project Settings → Environment Variables
   - Déclencher le build

3. **Migrer la base en production** :
   ```bash
   # En local, pointer DATABASE_URL vers la BDD de prod
   npx prisma migrate deploy
   npm run prisma:seed   # Optionnel : données de démo
   ```

4. **Première connexion** :
   - Utiliser les identifiants seed OU créer un 1er admin manuellement :
     ```bash
     # Depuis prisma studio ou un script
     npx prisma studio
     ```

---

## 🧪 Scripts utiles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm start` | Lancer l'app en mode production |
| `npm run lint` | Linting ESLint |
| `npm run typecheck` | Vérification TypeScript stricte |
| `npm run prisma:generate` | Régénérer le client Prisma |
| `npm run prisma:migrate -- --name X` | Créer + appliquer une migration |
| `npm run prisma:seed` | Insérer les données de démo |
| `npm run prisma:studio` | GUI pour explorer la BDD |

---

## 📋 Points restant à améliorer / décisions à valider

Voici les axes d'amélioration qui n'ont PAS été implémentés dans cette V1, à confirmer avec vous :

1. **🔑 Gestion fine des permissions membres**
   - Pour l'instant, un membre a accès en **lecture à TOUT** (PV, docs, membres, partenaires). Souhaitez-vous des permissions par section (ex: trésorier ne voit que PV + financier) ?

2. **🔍 Recherche full-text avancée**
   - Actuellement : simple `ILIKE` SQL via Prisma. Pour plus de performance/pertinence (des milliers de docs), implémenter :
     - colonnes `tsvector` PostgreSQL + index GIN
     - ou [Algolia](https://www.algolia.com/) / [Typesense](https://typesense.org/) pour la recherche typée

3. **🔔 Envoi d'emails**
   - **Mot de passe oublié** : actuellement log console seulement. À brancher sur [Resend](https://resend.com/) / NodeMailer SMTP
   - Notifications push par email (optionnel : préférences utilisateur)

4. **📑 Versioning des documents**
   - Pour l'instant : supprimer = remplacer. Ajouter un historique des versions d'un document ?

5. **📧 Import CSV massif des membres**
   - Pour peupler rapidement l'annuaire sans formulaire.

6. **🗂️ Filtre mandat réellement branché**
   - Pour l'instant les boutons "2025-2026" sont visibles. Il faut lier l'état côté client (ex: React Context) pour réellement filtrer PV/membres/événements par `mandatId`.

7. **🖼️ Avatar membres**
   - Upload réel d'une photo de profil via le même composant `UploadZone` / storage.

8. **📊 Signature PV**
   - Workflow de validation : PV en BROUILLON → signé par président → VALIDE.

9. **📱 Version mobile du menu**
   - Ajouter un bouton hamburger + sidebar mobile (actuellement `display:none` sur mobile).

---

## 🎨 Identité visuelle respectée

- **Palette** : `--navy: #0A2E52`, `--gold: #C9A227` + 3 variantes chacun (exactement comme prototype)
- **Typographies** :
  - Titres → **Playfair Display** (Google Fonts chargé dans `src/app/layout.tsx`)
  - Corps → **DM Sans**
- **Composants** : Toutes les classes CSS du prototype (`stat-card`, `folder-card`, `badge mrb-admin`, `readonly-banner`, modale d'upload, panneau de notifications...) sont **conservées à l'identique** dans `globals.css`.

---

## ❓ Support & bugs

Signalez tout problème en créant une issue.

> *Fait avec ❤️ pour le Lions Club IHEC Carthage — We Serve.*
