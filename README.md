# 🔴💙 Meet Me Club

> **Plus qu'une rencontre, un rendez-vous !**

Plateforme de rencontres pour adultes (18+) au Togo. Meet Me Club permet aux membres de se rencontrer, d'échanger via chat sécurisé, et de réserver des rendez-vous dans des lieux partenaires soigneusement sélectionnés à Lomé.

## ✨ Fonctionnalités (Phase 1)

- 🔐 **Authentification OTP** — Connexion par SMS (CinetPay) ou email (Resend) avec code à 6 chiffres
- 🔞 **Vérification 18+** — Contrôle de l'âge à l'inscription (date de naissance validée côté client ET serveur)
- 👤 **Onboarding 8 étapes** — Profil complet : identité, localisation, profession, langues, intérêts, objectifs, photos, disponibilités
- 📸 **Upload photos** — Upload Cloudinary avec modération, max 8 photos, miniatures optimisées
- 🛡️ **Session JWT sécurisée** — Cookie httpOnly signé avec jose, middleware Edge de protection des routes
- 📱 **PWA-ready** — Manifest, meta tags, responsive mobile-first
- 📊 **Score de complétude** — Calcul automatique du % de profil complété

## 🏗️ Stack technique

| Techno | Usage |
|--------|-------|
| **Next.js 16** (App Router) | Framework full-stack |
| **TypeScript** | Typage strict |
| **Tailwind CSS v4** | Styling (+ CSS custom properties) |
| **Prisma** | ORM + schéma BDD |
| **PostgreSQL** | Base de données |
| **Redis** (Upstash) | OTP, rate limiting, cache |
| **Cloudinary** | CDN photos |
| **CinetPay** | SMS OTP (Togo) |
| **Resend** | Email OTP |
| **jose** | JWT sessions |
| **Zod** | Validation de données |

## 🚀 Installation

### Prérequis

- Node.js ≥ 20
- PostgreSQL (local ou Docker)
- Redis (Upstash recommandé)

### Étapes

```bash
# 1. Cloner le projet
git clone <url> meetmeclub
cd meetmeclub

# 2. Installer les dépendances
npm install

# 3. Copier et configurer l'environnement
cp .env.example .env.local
# → Éditez .env.local avec vos valeurs

# 4. Démarrer PostgreSQL (Docker)
docker compose up -d

# 5. Initialiser la base de données
npx prisma db push
npm run db:seed

# 6. Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) 🎉

### Docker Compose (PostgreSQL + Redis)

```bash
docker compose up -d
```

Le fichier `docker-compose.yml` inclut :
- PostgreSQL 16 (port 5432)
- Redis 7 (port 6379)

## 📁 Structure du projet

```
meetmeclub/
├── prisma/
│   ├── schema.prisma        # Schéma BDD complet
│   └── seed.ts              # Données initiales (intérêts, admin)
├── public/
│   ├── manifest.json         # PWA
│   └── logo.png              # Logo (à ajouter)
├── src/
│   ├── app/
│   │   ├── (auth)/           # Pages auth (inscription, connexion)
│   │   ├── (public)/         # Pages publiques (tarifs, légal)
│   │   ├── api/              # Routes API
│   │   │   ├── auth/         # send-otp, verify-otp, logout
│   │   │   ├── profiles/     # CRUD profil + photos
│   │   │   └── interests/    # Liste des centres d'intérêt
│   │   ├── onboarding/       # Wizard 8 étapes
│   │   ├── profil/           # Page profil membre
│   │   ├── globals.css       # Design system (tokens, composants)
│   │   ├── layout.tsx        # Root layout + SEO
│   │   └── page.tsx          # Homepage
│   ├── lib/
│   │   ├── session.ts        # JWT session (jose)
│   │   ├── prisma.ts         # Singleton Prisma
│   │   ├── redis.ts          # Upstash Redis client
│   │   ├── otp.ts            # OTP gen/hash/send
│   │   ├── cloudinary.ts     # Upload & optimisation
│   │   └── validations/      # Schémas Zod
│   └── middleware.ts         # Route protection (Edge)
├── .env.example
├── docker-compose.yml
├── next.config.ts
├── package.json
└── README.md
```

## 🧪 Dev tips

- **Mode DEV** : Les OTP sont affichés dans la console et renvoyés en `devCode` dans la réponse API (pas de SMS/email nécessaire)
- **Prisma Studio** : `npm run db:studio` pour explorer la BDD visuellement
- **Seed** : `npm run db:seed` pour insérer les intérêts et les paramètres par défaut

## 📋 Phases de développement

| Phase | Contenu | Statut |
|-------|---------|--------|
| 1 | Architecture, Auth, Profils | ✅ En cours |
| 2 | Découverte & Matching | 🔜 Prochaine |
| 3 | Espace partenaire | ⏳ |
| 4 | Rendez-vous & Paiements | ⏳ |
| 5 | Administration | ⏳ |
| 6 | Sécurité avancée | ⏳ |
| 7 | Performance & Scaling | ⏳ |

## 📄 Licence

Projet privé — © 2026 Meet Me Club. Tous droits réservés.
