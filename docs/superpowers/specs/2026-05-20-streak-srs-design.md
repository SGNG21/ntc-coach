# Streak quotidien + Répétition espacée (SRS) — NTC Coach

**Date :** 2026-05-20  
**Statut :** Approuvé

---

## Contexte

NTC Coach manque de mécanismes d'engagement à long terme. Les concurrents (Duolingo, Anki) utilisent deux leviers efficaces : le streak quotidien (habitude) et la répétition espacée (rétention). Ce spec couvre l'ajout de ces deux fonctionnalités.

---

## 1. Données & Architecture

### Nouveau fichier : `lib/engagement.ts`

Toute la logique streak et SRS est isolée dans ce fichier. Aucune logique métier dans les composants.

### Nouvelles clés localStorage

```
ntc_streak  →  { count: number, lastDate: "YYYY-MM-DD", longest: number }
ntc_srs     →  { [moduleId]: { interval: number, dueDate: "YYYY-MM-DD", lastScore: number, reviewCount: number } }
```

### Supabase — `user_profiles`

Deux nouvelles colonnes ajoutées via migration SQL :

```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS streak JSONB;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS srs    JSONB;
```

### Sync (`lib/sync.ts`)

Les clés `ntc_streak` et `ntc_srs` sont ajoutées à `LS_KEYS` dans `lib/sync.ts`. `syncToCloud()` et `syncFromCloud()` les incluent automatiquement — aucune autre modification.

---

## 2. Streak quotidien

### Algorithme (`updateStreak()`)

```
today = date du jour "YYYY-MM-DD"
lastDate = streak.lastDate

si lastDate === today         → rien (déjà compté aujourd'hui)
si lastDate === hier           → count++, lastDate = today
si lastDate < hier (ou null)  → count = 1, lastDate = today

si count > longest → longest = count
sauvegarder ntc_streak
```

### Déclencheurs

| Endroit | Fichier | Condition |
|---|---|---|
| `addScore()` | `MainApp.tsx` | Chaque réponse quiz |
| `sendChat()` | `MainApp.tsx` | Premier message d'une session (chatMessages.length === 0) |

### Affichage — Header

Pill `🔥 {count}j` ajouté dans le header de `MainApp.tsx`, à gauche du pill J-14.

- Streak actif (count ≥ 1) : fond orange, texte blanc
- Streak jamais démarré (count = 0 et lastDate null) : pill absent
- Streak cassé (lastDate < hier) : `🔥 0j` fond gris pierre

Lu depuis localStorage au montage. Mis à jour via `window.addEventListener('storage', ...)`, même pattern que le countdown examen existant.

---

## 3. Répétition espacée (SRS par module)

### Algorithme — intervalles fixes

| Score quiz | Prochain rappel |
|---|---|
| < 50 % | 1 jour |
| 50–74 % | 3 jours |
| 75–89 % | 7 jours |
| ≥ 90 % | 14 jours |

### Fonctions dans `lib/engagement.ts`

```typescript
updateSRS(moduleId: ModuleId, scorePercent: number): void
// Calcule l'intervalle, stocke dueDate = today + interval jours, lastScore, reviewCount++

getDueModules(): ModuleId[]
// Retourne les moduleIds dont dueDate <= aujourd'hui

getSRSData(): SrsData
// Retourne l'objet complet ntc_srs depuis localStorage
```

### Déclencheurs

| Endroit | Fichier | Score passé |
|---|---|---|
| `finishModule(score)` | `ParcourSession.tsx` | `(result.exerciseScore / result.totalQuestions) * 100` — si exercice fait, sinon pas d'appel |
| `finishQuiz()` | `GameParcours.tsx` | `((questions.length - mistakes) / questions.length) * 100` |
| `onComplete(scorePercent)` nouveau callback | `ExerciseRenderer` dans `MainApp.tsx` | Appelé quand toutes les questions QCM sont répondues |

Le callback `onComplete` sur `ExerciseRenderer` : détecté quand `Object.keys(answers).length === questions.length` (toutes les questions ont une réponse dans l'état local du composant).

---

## 4. UI

### 4.1 Header — pill streak (`MainApp.tsx`)

Ajout entre le toggle dark mode et le pill J-14 :

```tsx
{streak.count > 0 && (
  <button onClick={() => setTab('dashboard')} className="...pill orange...">
    🔥 {streak.count}j
  </button>
)}
```

### 4.2 Dashboard — `SrsCard` (`ProgressDashboard.tsx`)

Nouveau composant placé **en premier** dans `ProgressDashboard`, avant `CountdownCard`.

- Titre : `📚 À réviser aujourd'hui`
- Si modules dus : liste avec nom du module, dernier score (%), bouton `Réviser →` (`onNavigate`)
- Si aucun module dû : `✅ Tout est à jour — prochain révision dans N jours` (N = min des dueDate restantes)
- Reçoit `dueModules: ModuleId[]`, `srsData: SrsData`, `onNavigate` en props

### 4.3 Nav tab Parcours — badge (`MainApp.tsx`)

Le label du tab Parcours devient dynamique :

```tsx
{ id: 'parcours', label: dueCount > 0 ? `🗺️ Parcours ${dueCount}` : '🗺️ Parcours' }
```

Badge disparaît quand `dueCount === 0`.

---

## 5. Périmètre

**Dans le scope :**
- Streak + SRS logique + UI tels que décrits ci-dessus
- Sync Supabase via extension de `lib/sync.ts`
- Migration SQL (deux colonnes JSONB)

**Hors scope :**
- Notifications push
- Leaderboard / comparaison entre utilisateurs
- Son / vibration
- Streak freeze (bouclier Duolingo)

---

## 6. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `lib/engagement.ts` | **Nouveau** — logique streak + SRS |
| `lib/sync.ts` | Ajout `ntc_streak` et `ntc_srs` dans `LS_KEYS` |
| `components/MainApp.tsx` | Pill streak header, badge tab Parcours, `updateStreak()` dans `addScore()` et `sendChat()`, `onComplete` sur `ExerciseRenderer` |
| `components/ProgressDashboard.tsx` | Nouveau composant `SrsCard` |
| `components/ParcourSession.tsx` | Appel `updateSRS()` dans `finishModule()` |
| `components/GameParcours.tsx` | Appel `updateSRS()` dans `finishQuiz()` |
| `supabase-schema.sql` | Migration `ALTER TABLE` pour `streak` et `srs` |
