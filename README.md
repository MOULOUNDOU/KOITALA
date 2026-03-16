# KOITALA – Agence Immobiliere

Application web complete pour une agence immobiliere personnelle.

## Stack technique
- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + design system premium
- **Supabase** (base de données, auth, storage, RLS)
- **Resend** (emails transactionnels)
- **MapTiler** (cartes interactives)
- **React Hook Form** + Zod (validation)
- **Lucide React** (icones)

## Structure du projet

```
src/
  app/
    page.tsx                    # Page d accueil (/)
    layout.tsx                  # Layout racine
    (public)/                   # Groupe de routes publiques
      layout.tsx                # Navbar + Footer
      biens/page.tsx            # Liste des annonces
      biens/[slug]/page.tsx     # Detail d un bien
      contact/page.tsx          # Contact
      a-propos/page.tsx         # A propos
      blog/page.tsx             # Blog
      blog/[slug]/page.tsx      # Article de blog
    auth/
      login/page.tsx
      register/page.tsx
      mot-de-passe-oublie/page.tsx
    dashboard/                  # Espace admin (protege)
      layout.tsx
      page.tsx                  # Tableau de bord
      annonces/page.tsx
      annonces/nouvelle/page.tsx
      annonces/[id]/page.tsx
      demandes/page.tsx
      messages/page.tsx
      utilisateurs/page.tsx
      blog/page.tsx
      parametres/page.tsx
    mon-compte/page.tsx         # Profil utilisateur
    favoris/page.tsx            # Favoris
    api/
      properties/route.ts
      visits/route.ts
      contacts/route.ts
  components/
    ui/                         # Button, Input, Badge, Select, Textarea
    layout/                     # Navbar, Footer, DashboardSidebar
    properties/                 # PropertyCard, SearchBar, PropertyFilters, etc.
    dashboard/                  # StatsCard
  lib/
    supabase/client.ts          # Client browser
    supabase/server.ts          # Client server
    utils.ts
    validations.ts
  middleware.ts                 # Protection des routes
  types/index.ts
supabase/
  schema.sql                    # Schema SQL complet + RLS
```

## Installation

### 1. Cloner / ouvrir le projet

```bash
cd koitala
npm install
```

### 2. Creer le projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et creez un nouveau projet
2. Notez votre **Project URL** et votre **anon public key**
3. Notez aussi votre **service_role key** (Settings > API)

### 3. Configurer les variables d environnement

Creez un fichier `.env.local` a la racine du projet :

```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key_ici
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
NEXT_PUBLIC_SITE_URL=https://koitala.com
RESEND_API_KEY=re_votre_cle_resend
RESEND_FROM_EMAIL="KOITALA <noreply@votredomaine.com>"
RESEND_REPLY_TO_EMAIL=amzakoita@gmail.com
CONTACT_NOTIFICATION_EMAIL=amzakoita@gmail.com
NEXT_PUBLIC_MAPTILER_API_KEY=votre_cle_maptiler
NEXT_PUBLIC_MAPTILER_MAP_STYLE=streets-v4
```

### 4. Executer le schema SQL

1. Allez dans **Supabase > SQL Editor**
2. Copiez-collez le contenu de `supabase/schema.sql`
3. Cliquez **Run**

Cela va creer :
- Toutes les tables (profiles, properties, property_images, property_features, favorites, visit_requests, contacts, blog_posts)
- Les triggers (auto-creation de profil, updated_at)
- Les politiques RLS
- Les buckets de stockage

### Configuration Google OAuth (koitala.com)

Pour que "Continuer avec Google" fonctionne en production, configurez les 2 consoles :

1. **Supabase > Authentication > URL Configuration**
   - `Site URL` : `https://koitala.com`
   - `Additional Redirect URLs` :
     - `https://koitala.com/auth/callback`
     - `https://www.koitala.com/auth/callback` (si vous utilisez `www`)
     - `http://localhost:3000/auth/callback` (dev local)

2. **Supabase > Authentication > Providers > Google**
   - Activez Google
   - Collez le `Client ID` et le `Client Secret` Google OAuth

3. **Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client (Web)**
   - `Authorized JavaScript origins` :
     - `https://koitala.com`
     - `https://www.koitala.com` (si utilise)
     - `http://localhost:3000`
   - `Authorized redirect URIs` :
     - `https://phhlnxrhzynrnwbosmpl.supabase.co/auth/v1/callback`

Important : le redirect URI Google pointe vers **Supabase** (`/auth/v1/callback`), pas directement vers `/auth/callback` de l'app.

### 5. Creer votre compte admin

1. Allez sur votre app : `http://localhost:3000/auth/register`
2. Creez votre compte avec votre email
3. Dans Supabase > SQL Editor, executez :

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'votre@email.com';
```

4. Vous avez maintenant acces au dashboard : `http://localhost:3000/dashboard`

### 6. Lancer le serveur de developpement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## Pages principales

| URL | Description |
|-----|-------------|
| `/` | Page d accueil avec hero, recherche, annonces |
| `/biens` | Liste de toutes les annonces avec filtres |
| `/biens/[slug]` | Detail d un bien |
| `/contact` | Formulaire de contact |
| `/a-propos` | Page a propos |
| `/blog` | Blog immobilier |
| `/auth/login` | Connexion |
| `/auth/register` | Inscription |
| `/dashboard` | Tableau de bord admin |
| `/dashboard/annonces` | Gestion des annonces |
| `/dashboard/annonces/nouvelle` | Creer une annonce |
| `/dashboard/demandes` | Demandes de visite |
| `/dashboard/messages` | Messages recus |
| `/dashboard/utilisateurs` | Gestion des utilisateurs |
| `/dashboard/blog` | Gestion du blog |
| `/dashboard/parametres` | Parametres du compte |
| `/mon-compte` | Profil utilisateur |
| `/favoris` | Annonces sauvegardees |

## Build pour la production

```bash
npm run build
npm start
```

## Notes importantes

- **app/(public)/page.tsx** : Ce fichier contient uniquement `notFound()`. La vraie page d accueil est dans `app/page.tsx` pour eviter un conflit de route Next.js.
- Les images Unsplash sont utilisees comme placeholder. Remplacez-les par vos vraies photos via le formulaire d upload dans le dashboard.
- Les formulaires de contact et de demande de visite peuvent envoyer des emails via **Resend** quand `RESEND_API_KEY` et `RESEND_FROM_EMAIL` sont configures.
- Les cartes publiques utilisent **MapTiler** via `NEXT_PUBLIC_MAPTILER_API_KEY`. Pour `NEXT_PUBLIC_MAPTILER_MAP_STYLE`, utilisez un identifiant comme `streets-v4` plutot qu'une URL complete `style.json`.
- Le blog supporte le HTML basique dans le champ content.

## Personnalisation

- **Couleurs** : Modifiez les variables CSS dans `src/app/globals.css`
- **Informations de contact** : Mettez a jour `src/components/layout/Footer.tsx` et `src/components/layout/Navbar.tsx`
- **Nom de l agence** : Recherchez "KOITALA" dans le projet pour remplacer
- **Devise** : Modifiez `formatPrice()` dans `src/lib/utils.ts`
