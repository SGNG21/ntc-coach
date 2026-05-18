# NTC Coach — Plateforme de révision Titre Pro NTC

Plateforme Next.js 14 pour réviser le Titre Professionnel Négociateur Technico-Commercial (RNCP 39063).  
**REAC 2024 intégral · Chatbot coach Alex · Exercices CCF · Simulation d'épreuves**

---

## Stack technique
- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Anthropic Claude** (claude-sonnet-4) — chatbot + exercices
- **Supabase** — historique conversations + progression

---

## Installation locale

```bash
# 1. Cloner
git clone https://github.com/TON_USERNAME/ntc-coach.git
cd ntc-coach

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.local.example .env.local
# → Éditer .env.local avec vos clés

# 4. Lancer en dev
npm run dev
# → http://localhost:3000
```

---

## Variables d'environnement

Dans `.env.local` :

```
ANTHROPIC_API_KEY=sk-ant-xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyxxxxx
```

---

## Supabase — Setup base de données

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor**
3. Copier-coller le contenu de `supabase-schema.sql` et l'exécuter
4. Récupérer les clés dans **Settings → API**

---

## Déploiement Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Ou lier à un repo GitHub et activer le déploiement auto dans le dashboard Vercel
```

**Variables d'environnement Vercel** : les ajouter dans **Settings → Environment Variables** du projet.

---

## Structure du projet

```
ntc-coach/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              ← API Claude (chat + chatbot)
│   │   ├── generate-exercise/route.ts ← Génération exercices CCF
│   │   └── save-session/route.ts      ← Sauvegarde Supabase
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── MainApp.tsx                    ← Application principale
│   ├── Chatbot.tsx                    ← Chatbot flottant Alex
│   ├── ChatMessage.tsx                ← Composant message
│   └── ChatInput.tsx                  ← Input chat
├── lib/
│   ├── reac-data.ts                   ← Données REAC 2024 complètes
│   ├── prompts.ts                     ← Système de prompts coach
│   └── supabase.ts                    ← Client Supabase
├── types/index.ts                     ← Types TypeScript
├── supabase-schema.sql                ← Schéma base de données
└── .env.local.example                 ← Template variables d'env
```

---

## Fonctionnalités

- 📋 **Programme officiel** — REAC 2024 (TP-00338, millésime 07) — 9 compétences + critères d'évaluation
- 📚 **Révision IA** — 4 modes : cours, quiz, mise en situation, critères CCF
- ✏️ **Exercices CCF** — QCM, rédaction notée, cas d'entreprise, grille auto-évaluation
- 🗂️ **Fiches** — Génération IA + fiches statiques clés
- 🎯 **Préparer CCF** — Simulation prospection téléphonique, négociation, entretien technique jury
- 💬 **Chatbot Alex** — Coach motivant, expert REAC 2024, disponible en permanence
- 💾 **Supabase** — Historique conversations + progression par compétence
