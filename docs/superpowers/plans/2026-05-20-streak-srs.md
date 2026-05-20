# Streak quotidien + SRS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un système de streak quotidien (🔥 pill dans le header) et de répétition espacée par module (SRS) avec affichage dans le Dashboard et badge sur l'onglet Parcours.

**Architecture:** Toute la logique streak + SRS est isolée dans `lib/engagement.ts`. Les composants appellent `updateStreak()` / `updateSRS()` aux bons moments. Les deux fonctions dispatche un `storage` event pour rafraîchir l'UI. La sync Supabase est étendue via `lib/sync.ts`.

**Tech Stack:** TypeScript strict, Next.js 14 App Router, React 18, Tailwind CSS, Supabase (JSONB), localStorage.

> **Note tests :** Ce projet n'a pas de framework de tests. Les étapes "vérification" utilisent `npx tsc --noEmit` + build Next.js + vérification manuelle dans le navigateur.

---

## Fichiers touchés

| Fichier | Action |
|---|---|
| `lib/engagement.ts` | **Créer** — logique streak + SRS complète |
| `lib/sync.ts` | **Modifier** — ajouter `ntc_streak` et `ntc_srs` |
| `supabase-schema.sql` | **Modifier** — migration colonnes streak + srs |
| `components/MainApp.tsx` | **Modifier** — pill header, badge Parcours, updateStreak, onComplete |
| `components/ProgressDashboard.tsx` | **Modifier** — nouveau composant SrsCard |
| `components/ParcourSession.tsx` | **Modifier** — appel updateSRS dans finishModule |
| `components/GameParcours.tsx` | **Modifier** — appel updateSRS dans finishQuiz |

---

## Task 1 : `lib/engagement.ts` — logique streak + SRS

**Files:**
- Create: `lib/engagement.ts`

- [ ] **Step 1.1 : Créer le fichier**

```typescript
// lib/engagement.ts
import type { ModuleId } from '@/types';

const LS_STREAK = 'ntc_streak';
const LS_SRS    = 'ntc_srs';

export interface StreakData {
  count: number;
  lastDate: string; // 'YYYY-MM-DD'
  longest: number;
}

export interface SrsEntry {
  interval: number;    // jours
  dueDate: string;     // 'YYYY-MM-DD'
  lastScore: number;   // 0–100
  reviewCount: number;
}

export type SrsData = Record<string, SrsEntry>;

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function todayStr(): string {
  return toDateStr(new Date());
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function dispatchStorage() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('storage'));
}

// ── Streak ──────────────────────────────────────────────────────────────────

export function loadStreak(): StreakData {
  try {
    return JSON.parse(localStorage.getItem(LS_STREAK) || 'null') ?? { count: 0, lastDate: '', longest: 0 };
  } catch {
    return { count: 0, lastDate: '', longest: 0 };
  }
}

function saveStreak(s: StreakData): void {
  try { localStorage.setItem(LS_STREAK, JSON.stringify(s)); } catch { /* ignore */ }
}

export function updateStreak(): StreakData {
  const s = loadStreak();
  const t = todayStr();
  if (s.lastDate === t) return s; // déjà comptabilisé aujourd'hui
  const newCount = s.lastDate === yesterdayStr() ? s.count + 1 : 1;
  const updated: StreakData = {
    count: newCount,
    lastDate: t,
    longest: Math.max(s.longest, newCount),
  };
  saveStreak(updated);
  dispatchStorage();
  return updated;
}

// ── SRS ─────────────────────────────────────────────────────────────────────

export function loadSRS(): SrsData {
  try {
    return JSON.parse(localStorage.getItem(LS_SRS) || 'null') ?? {};
  } catch {
    return {};
  }
}

function saveSRS(data: SrsData): void {
  try { localStorage.setItem(LS_SRS, JSON.stringify(data)); } catch { /* ignore */ }
}

function scoreToInterval(pct: number): number {
  if (pct < 50) return 1;
  if (pct < 75) return 3;
  if (pct < 90) return 7;
  return 14;
}

export function updateSRS(moduleId: ModuleId | string, scorePercent: number): void {
  const data = loadSRS();
  const prev = data[moduleId];
  const interval = scoreToInterval(scorePercent);
  data[moduleId] = {
    interval,
    dueDate: addDays(todayStr(), interval),
    lastScore: Math.round(scorePercent),
    reviewCount: (prev?.reviewCount ?? 0) + 1,
  };
  saveSRS(data);
  dispatchStorage();
}

export function getDueModules(): string[] {
  const t = todayStr();
  return Object.entries(loadSRS())
    .filter(([, e]) => e.dueDate <= t)
    .map(([id]) => id);
}

export function getDaysUntilNextDue(): number | null {
  const t = todayStr();
  const delays = Object.values(loadSRS())
    .filter(e => e.dueDate > t)
    .map(e => Math.ceil((new Date(e.dueDate).getTime() - new Date(t).getTime()) / 86400000));
  return delays.length === 0 ? null : Math.min(...delays);
}
```

- [ ] **Step 1.2 : Vérifier TypeScript**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs" && npx tsc --noEmit
```
Résultat attendu : aucune erreur.

- [ ] **Step 1.3 : Commit**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs"
git add lib/engagement.ts
git commit -m "feat: lib/engagement — streak quotidien + SRS par module"
```

---

## Task 2 : Étendre `lib/sync.ts`

**Files:**
- Modify: `lib/sync.ts`

- [ ] **Step 2.1 : Ajouter les clés dans LS_KEYS**

Dans `lib/sync.ts`, remplacer le bloc `const LS_KEYS = ...` par :

```typescript
const LS_KEYS = {
  score:        'ntc_score',
  parcours:     'ntc_parcours',
  game_stars:   'ntc_game_stars',
  game_xp:      'ntc_game_xp',
  exam_date:    'ntc_exam_date',
  chat_history: 'ntc_chat_history',
  streak:       'ntc_streak',
  srs:          'ntc_srs',
} as const;
```

- [ ] **Step 2.2 : Étendre `readLS()`**

Remplacer la fonction `readLS()` par :

```typescript
function readLS() {
  const get = (k: string, fallback: unknown) => {
    try { return JSON.parse(localStorage.getItem(k) || 'null') ?? fallback; } catch { return fallback; }
  };
  return {
    score:        get(LS_KEYS.score,        { correct: 0, total: 0, byModule: {} }),
    parcours:     get(LS_KEYS.parcours,     {}),
    game_stars:   get(LS_KEYS.game_stars,   {}),
    game_xp:      parseInt(localStorage.getItem(LS_KEYS.game_xp) || '0', 10),
    exam_date:    localStorage.getItem(LS_KEYS.exam_date) || '',
    chat_history: get(LS_KEYS.chat_history, []),
    streak:       get(LS_KEYS.streak,       { count: 0, lastDate: '', longest: 0 }),
    srs:          get(LS_KEYS.srs,          {}),
  };
}
```

- [ ] **Step 2.3 : Étendre `writeLS()`**

Remplacer la fonction `writeLS()` par :

```typescript
function writeLS(data: Awaited<ReturnType<typeof loadProfile>>) {
  if (!data) return;
  const set = (k: string, v: unknown) => {
    try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch { /* ignore */ }
  };
  set(LS_KEYS.score,        data.score);
  set(LS_KEYS.parcours,     data.parcours);
  set(LS_KEYS.game_stars,   data.game_stars);
  localStorage.setItem(LS_KEYS.game_xp, String(data.game_xp ?? 0));
  if (data.exam_date) localStorage.setItem(LS_KEYS.exam_date, data.exam_date);
  set(LS_KEYS.chat_history, data.chat_history);
  set(LS_KEYS.streak,       data.streak);
  set(LS_KEYS.srs,          data.srs);
}
```

- [ ] **Step 2.4 : Étendre `loadProfile()`**

Remplacer la fonction `loadProfile()` par :

```typescript
export async function loadProfile(): Promise<null | {
  score: unknown; parcours: unknown; game_stars: unknown;
  game_xp: number; exam_date: string; chat_history: unknown;
  streak: unknown; srs: unknown;
}> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('score,parcours,game_stars,game_xp,exam_date,chat_history,streak,srs')
    .single();
  if (error || !data) return null;
  return data as ReturnType<typeof loadProfile> extends Promise<infer T> ? NonNullable<T> : never;
}
```

- [ ] **Step 2.5 : Vérifier TypeScript**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs" && npx tsc --noEmit
```
Résultat attendu : aucune erreur.

- [ ] **Step 2.6 : Commit**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs"
git add lib/sync.ts
git commit -m "feat: sync — ajouter streak et srs dans LS_KEYS et loadProfile"
```

---

## Task 3 : Migration Supabase

**Files:**
- Modify: `supabase-schema.sql`

- [ ] **Step 3.1 : Ajouter la migration dans le fichier**

À la fin de `supabase-schema.sql`, ajouter :

```sql
-- =============================================
-- Migration : streak quotidien + SRS par module
-- =============================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS streak JSONB DEFAULT '{"count":0,"lastDate":"","longest":0}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS srs    JSONB DEFAULT '{}';
```

- [ ] **Step 3.2 : Exécuter la migration dans Supabase**

1. Ouvrir https://supabase.com/dashboard/project/rdgehpcdqsmsawamukbv
2. Aller dans **SQL Editor**
3. Coller et exécuter les deux lignes `ALTER TABLE` ci-dessus
4. Vérifier : aller dans **Table Editor → user_profiles** et confirmer que les colonnes `streak` et `srs` apparaissent.

- [ ] **Step 3.3 : Commit du fichier SQL**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs"
git add supabase-schema.sql
git commit -m "feat: supabase — colonnes streak et srs sur user_profiles"
```

---

## Task 4 : Streak dans `MainApp.tsx` — pill header + déclencheurs

**Files:**
- Modify: `components/MainApp.tsx`

- [ ] **Step 4.1 : Importer `loadStreak` et `updateStreak`**

En haut de `MainApp.tsx`, ajouter à la ligne des imports `lib/` :

```typescript
import { loadStreak, updateStreak } from '@/lib/engagement';
```

- [ ] **Step 4.2 : Ajouter l'état `streakCount`**

Dans le corps de `MainApp`, après la déclaration de `darkMode`, ajouter :

```typescript
const [streakCount, setStreakCount] = useState<number>(() => {
  try { return loadStreak().count; } catch { return 0; }
});
```

- [ ] **Step 4.3 : Écouter les events storage pour rafraîchir le streak**

Dans le `useEffect` existant qui écoute `storage` pour `examDaysLeft` (autour de la ligne 172), ajouter le rafraîchissement du streak dans la même fonction `refresh` :

Remplacer :
```typescript
useEffect(() => {
  function refresh() {
    const saved = localStorage.getItem('ntc_exam_date');
    if (!saved) { setExamDaysLeft(null); return; }
    const exam = new Date(saved);
    exam.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setExamDaysLeft(Math.ceil((exam.getTime() - today.getTime()) / 86400000));
  }
  refresh();
  window.addEventListener('storage', refresh);
  return () => window.removeEventListener('storage', refresh);
}, []);
```

Par :
```typescript
useEffect(() => {
  function refresh() {
    // Exam countdown
    const saved = localStorage.getItem('ntc_exam_date');
    if (!saved) { setExamDaysLeft(null); }
    else {
      const exam = new Date(saved);
      exam.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setExamDaysLeft(Math.ceil((exam.getTime() - today.getTime()) / 86400000));
    }
    // Streak
    try { setStreakCount(loadStreak().count); } catch { /* ignore */ }
  }
  refresh();
  window.addEventListener('storage', refresh);
  return () => window.removeEventListener('storage', refresh);
}, []);
```

- [ ] **Step 4.4 : Appeler `updateStreak` dans `addScore()`**

Dans la fonction `addScore(correct: boolean)`, ajouter en tout début :

```typescript
function addScore(correct: boolean) {
  const updated = updateStreak();
  setStreakCount(updated.count);
  markParcourActivity(moduleId, 'quiz');
  // ... reste du code inchangé
```

- [ ] **Step 4.5 : Appeler `updateStreak` dans `sendChat()`**

Dans `sendChat(text: string)`, après la ligne `const userMsg = ...`, ajouter :

```typescript
async function sendChat(text: string) {
  const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
  if (chatMessages.length === 0) {
    const updated = updateStreak();
    setStreakCount(updated.count);
  }
  // ... reste du code inchangé
```

- [ ] **Step 4.6 : Ajouter le pill streak dans le header**

Dans le JSX du header, juste avant le pill `examDaysLeft` (chercher `{examDaysLeft !== null && (`), ajouter :

```tsx
{streakCount > 0 && (
  <button
    onClick={() => setTab('dashboard')}
    className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-orange-500/90 text-white transition-colors hover:bg-orange-400"
    title={`Streak : ${streakCount} jour${streakCount > 1 ? 's' : ''} de suite`}
  >
    🔥 {streakCount}j
  </button>
)}
```

- [ ] **Step 4.7 : Vérifier TypeScript**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs" && npx tsc --noEmit
```
Résultat attendu : aucune erreur.

- [ ] **Step 4.8 : Commit**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs"
git add components/MainApp.tsx
git commit -m "feat: MainApp — pill streak header + updateStreak dans addScore et sendChat"
```

---

## Task 5 : SRS dans `ExerciseRenderer` + badge Parcours (`MainApp.tsx`)

**Files:**
- Modify: `components/MainApp.tsx`

- [ ] **Step 5.1 : Importer les fonctions SRS**

Ajouter `updateSRS`, `getDueModules`, `loadSRS` à l'import de `lib/engagement` :

```typescript
import { loadStreak, updateStreak, updateSRS, getDueModules, loadSRS } from '@/lib/engagement';
```

- [ ] **Step 5.2 : Ajouter l'état `dueCount`**

Après `streakCount`, ajouter :

```typescript
const [dueCount, setDueCount] = useState<number>(() => {
  try { return getDueModules().length; } catch { return 0; }
});
```

- [ ] **Step 5.3 : Rafraîchir `dueCount` dans le même listener storage**

Dans la fonction `refresh` du `useEffect` storage (modifiée au Task 4.3), ajouter à la fin :

```typescript
try { setDueCount(getDueModules().length); } catch { /* ignore */ }
```

- [ ] **Step 5.4 : Ajouter `onComplete` à `ExerciseRenderer`**

La fonction `ExerciseRenderer` est définie en bas de `MainApp.tsx`. Changer sa signature de :

```typescript
function ExerciseRenderer({ data, moduleId, moduleType, onScore, onSubmitAnswer }: {
  data: Record<string, unknown>;
  moduleId: ModuleId;
  moduleType: 'c1' | 'c2' | 'tr';
  onScore: (correct: boolean) => void;
  onSubmitAnswer: (answer: string, correction: string) => void;
})
```

En :

```typescript
function ExerciseRenderer({ data, moduleId, moduleType, onScore, onSubmitAnswer, onComplete }: {
  data: Record<string, unknown>;
  moduleId: ModuleId;
  moduleType: 'c1' | 'c2' | 'tr';
  onScore: (correct: boolean) => void;
  onSubmitAnswer: (answer: string, correction: string) => void;
  onComplete?: (scorePercent: number) => void;
})
```

- [ ] **Step 5.5 : Détecter la complétion dans le bloc QCM de `ExerciseRenderer`**

Dans le bloc QCM (chercher `if ((data as { questions?: unknown[] }).questions && ...)`), dans le `onClick` de chaque bouton de réponse, remplacer :

```typescript
onClick={() => {
  setAnswers(prev => ({ ...prev, [i]: k }));
  onScore(k === q.answer);
}}
```

Par :

```typescript
onClick={() => {
  const newAnswers = { ...answers, [i]: k };
  setAnswers(newAnswers);
  onScore(k === q.answer);
  if (onComplete && Object.keys(newAnswers).length === questions.length) {
    const correctCount = questions.filter((q, idx) => newAnswers[idx] === q.answer).length;
    onComplete(Math.round((correctCount / questions.length) * 100));
  }
}}
```

- [ ] **Step 5.6 : Passer `onComplete` à `ExerciseRenderer` dans le JSX**

Chercher `<ExerciseRenderer` dans le JSX de MainApp (onglet exercices) et ajouter la prop :

```tsx
<ExerciseRenderer
  data={exoData}
  moduleId={moduleId}
  moduleType={moduleType}
  onScore={addScore}
  onComplete={(scorePercent) => {
    updateSRS(moduleId, scorePercent);
  }}
  onSubmitAnswer={async (answer, correction) => {
  // ... reste inchangé
```

- [ ] **Step 5.7 : Badge dynamique sur l'onglet Parcours**

Dans le JSX de la nav (chercher `{TABS.map(t => (`), remplacer le contenu du bouton par :

```tsx
{TABS.map(t => (
  <button
    key={t.id}
    onClick={() => setTab(t.id)}
    className={`px-2.5 sm:px-4 py-3 text-[11px] sm:text-[12.5px] font-medium whitespace-nowrap border-b-2 transition-colors ${
      tab === t.id
        ? 'text-navy-700 border-red-600'
        : 'text-stone-400 border-transparent hover:text-navy-700'
    }`}
  >
    {t.id === 'parcours' && dueCount > 0
      ? <>{t.label} <span className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-red-500 text-white rounded-full ml-0.5">{dueCount}</span></>
      : t.label
    }
  </button>
))}
```

- [ ] **Step 5.8 : Vérifier TypeScript**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs" && npx tsc --noEmit
```
Résultat attendu : aucune erreur.

- [ ] **Step 5.9 : Commit**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs"
git add components/MainApp.tsx
git commit -m "feat: MainApp — SRS onComplete ExerciseRenderer + badge dueCount sur tab Parcours"
```

---

## Task 6 : SRS dans `ParcourSession.tsx`

**Files:**
- Modify: `components/ParcourSession.tsx`

- [ ] **Step 6.1 : Importer `updateSRS`**

En haut de `ParcourSession.tsx`, ajouter :

```typescript
import { updateSRS } from '@/lib/engagement';
```

- [ ] **Step 6.2 : Appeler `updateSRS` dans `finishModule()`**

Dans la fonction `finishModule(score?: number)`, après la ligne `const newResults = [...results, result];`, ajouter :

```typescript
if (result.exerciseScore !== null && result.totalQuestions) {
  updateSRS(modules[cursor], (result.exerciseScore / result.totalQuestions) * 100);
}
```

- [ ] **Step 6.3 : Vérifier TypeScript**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs" && npx tsc --noEmit
```
Résultat attendu : aucune erreur.

- [ ] **Step 6.4 : Commit**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs"
git add components/ParcourSession.tsx
git commit -m "feat: ParcourSession — updateSRS après finishModule"
```

---

## Task 7 : SRS dans `GameParcours.tsx`

**Files:**
- Modify: `components/GameParcours.tsx`

- [ ] **Step 7.1 : Importer `updateSRS`**

En haut de `GameParcours.tsx`, ajouter :

```typescript
import { updateSRS } from '@/lib/engagement';
```

- [ ] **Step 7.2 : Appeler `updateSRS` dans `finishQuiz()`**

Dans la fonction `finishQuiz()`, après `setScreen('result')`, ajouter AVANT cette ligne :

```typescript
if (questions.length > 0) {
  const scorePercent = ((questions.length - mistakes) / questions.length) * 100;
  updateSRS(moduleId, scorePercent);
}
```

La fonction complète devient :

```typescript
function finishQuiz() {
  stopTimer();
  const earned = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
  setEarnedStars(earned);
  const newStars = { ...stars, [moduleId]: Math.max(stars[moduleId] ?? 0, earned) };
  setStars(newStars);
  saveStars(newStars);
  const newXP = totalXP + sessionXP;
  setTotalXP(newXP);
  saveXP(newXP);
  if (questions.length > 0) {
    const scorePercent = ((questions.length - mistakes) / questions.length) * 100;
    updateSRS(moduleId, scorePercent);
  }
  setScreen('result');
}
```

- [ ] **Step 7.3 : Vérifier TypeScript**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs" && npx tsc --noEmit
```
Résultat attendu : aucune erreur.

- [ ] **Step 7.4 : Commit**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs"
git add components/GameParcours.tsx
git commit -m "feat: GameParcours — updateSRS après finishQuiz"
```

---

## Task 8 : `SrsCard` dans `ProgressDashboard.tsx`

**Files:**
- Modify: `components/ProgressDashboard.tsx`

- [ ] **Step 8.1 : Ajouter les imports**

`MODULES` et `ModuleId` sont déjà importés dans `ProgressDashboard.tsx`. Ajouter uniquement :

```typescript
import { getDueModules, getDaysUntilNextDue, loadSRS } from '@/lib/engagement';
```

- [ ] **Step 8.2 : Ajouter le composant `SrsCard`**

Ajouter ce composant **avant** `export function ProgressDashboard` :

```typescript
function SrsCard({ onNavigate }: { onNavigate: (moduleId: ModuleId, tab: string) => void }) {
  const [due, setDue] = useState<ModuleId[]>([]);
  const [srsData, setSrsData] = useState<ReturnType<typeof loadSRS>>({});
  const [daysNext, setDaysNext] = useState<number | null>(null);

  useEffect(() => {
    function refresh() {
      try {
        setDue(getDueModules() as ModuleId[]);
        setSrsData(loadSRS());
        setDaysNext(getDaysUntilNextDue());
      } catch { /* ignore */ }
    }
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  if (due.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="text-[13px] font-semibold text-navy-700 mb-1">📚 Répétition espacée</div>
        <div className="text-[12px] text-emerald-600 flex items-center gap-1.5">
          <span>✅ Tout est à jour</span>
          {daysNext !== null && (
            <span className="text-stone-400">— prochain rappel dans {daysNext} jour{daysNext > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-semibold text-navy-700">📚 À réviser aujourd&apos;hui</div>
        <span className="text-[11px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{due.length} module{due.length > 1 ? 's' : ''}</span>
      </div>
      <div className="flex flex-col gap-2">
        {due.map(id => {
          const entry = srsData[id];
          const mod = MODULES[id];
          return (
            <div key={id} className="flex items-center justify-between gap-3 py-1.5 border-b border-stone-100 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-stone-700 truncate">
                  {mod?.label.replace(/^CP\d+ — /, '') ?? id}
                </div>
                {entry && (
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    Dernier score : <span className={entry.lastScore >= 75 ? 'text-emerald-600' : entry.lastScore >= 50 ? 'text-amber-600' : 'text-red-500'}>{entry.lastScore}%</span>
                    {' · '}{entry.reviewCount} révision{entry.reviewCount > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <button
                onClick={() => onNavigate(id, 'revision')}
                className="text-[11px] px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-lg font-semibold transition-colors flex-shrink-0"
              >
                Réviser →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 8.3 : Ajouter `onNavigate` aux props de `ProgressDashboard`**

Changer la signature de `ProgressDashboard` :

```typescript
export function ProgressDashboard({
  score,
  onReset,
  onNavigate,
}: {
  score: Score;
  onReset: () => void;
  onNavigate: (moduleId: ModuleId, tab: string) => void;
}) {
```

- [ ] **Step 8.4 : Placer `SrsCard` en premier dans le rendu**

Dans le JSX de `ProgressDashboard`, ajouter `SrsCard` **avant** `CountdownCard` :

```tsx
return (
  <div className="flex flex-col gap-4">
    {/* ── SRS ── */}
    <SrsCard onNavigate={onNavigate} />

    {/* ── Compte à rebours ── */}
    <CountdownCard examDate={examDate} onDateChange={handleDateChange} />

    {/* ... reste inchangé */}
```

- [ ] **Step 8.5 : Mettre à jour l'appel dans `MainApp.tsx`**

Dans `MainApp.tsx`, chercher `<ProgressDashboard` et ajouter `onNavigate` :

```tsx
<ProgressDashboard
  score={score}
  onReset={() => setScore({ correct: 0, total: 0, byModule: {} })}
  onNavigate={navigateToModule}
/>
```

- [ ] **Step 8.6 : Vérifier TypeScript**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs" && npx tsc --noEmit
```
Résultat attendu : aucune erreur.

- [ ] **Step 8.7 : Commit**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs"
git add components/ProgressDashboard.tsx components/MainApp.tsx
git commit -m "feat: ProgressDashboard — SrsCard avec modules à réviser aujourd'hui"
```

---

## Task 9 : Build final + push

- [ ] **Step 9.1 : Build complet**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs" && npm run build
```
Résultat attendu : `✓ Compiled successfully` sans erreurs.

- [ ] **Step 9.2 : Push**

```bash
cd "/Users/g.nozza/Desktop/NTC COACH/ntc-nextjs" && git push
```

- [ ] **Step 9.3 : Vérification manuelle sur ntc-coach.vercel.app**

Après déploiement Vercel (1–2 min) :

1. **Streak** : Répondre à un QCM dans l'onglet Exercices → vérifier que `🔥 1j` apparaît dans le header
2. **Streak** : Recharger la page → le pill est toujours là (persiste en localStorage)
3. **SRS** : Terminer un quiz dans Mode Jeu → aller dans Progression → vérifier `📚 À réviser aujourd'hui` ou `✅ Tout est à jour`
4. **Badge** : Si modules dus, l'onglet Parcours affiche un badge rouge
5. **Sync** : Cliquer ⏏ (logout) puis se reconnecter → streak et SRS toujours présents (sync Supabase)
