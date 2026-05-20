'use client';
import { useState, useEffect, useCallback } from 'react';
import { MODULES } from '@/lib/reac-data';
import { loadHistory } from './ChatHistory';
import type { ModuleId, Score } from '@/types';

const LS_KEY = 'ntc_parcours';

type Activity = 'cours' | 'quiz' | 'exercice' | 'fiche';

interface StepData {
  startedAt?: string;
  completedAt?: string;
  activities: Activity[];
}

type Parcours = Record<string, StepData>;

const STEPS: { ccp: string; color: string; modules: ModuleId[] }[] = [
  { ccp: 'CCP 1 — Prospection', color: '#0f5298', modules: ['veille', 'pac', 'prospection', 'perf'] },
  { ccp: 'CCP 2 — Négociation', color: '#6b2d7e', modules: ['image', 'proposition', 'nego', 'bilan', 'relation'] },
  { ccp: 'Transversal',          color: '#1c3d5a', modules: ['transversal', 'digital', 'rse', 'juridique'] },
];

const ACTIVITY_LABELS: Record<Activity, string> = {
  cours: '📖 Cours',
  quiz: '❓ Quiz',
  exercice: '✏️ Exercice',
  fiche: '🗂️ Fiche',
};

function load(): Parcours {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

function save(data: Parcours) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

function mergeFromScore(parcours: Parcours, score: Score): Parcours {
  const merged = { ...parcours };
  for (const [moduleId, s] of Object.entries(score.byModule)) {
    if (s.total > 0) {
      const step = merged[moduleId] ?? { activities: [] };
      if (!step.activities.includes('quiz')) {
        merged[moduleId] = {
          ...step,
          activities: [...step.activities, 'quiz'],
          startedAt: step.startedAt ?? new Date().toISOString(),
        };
      }
    }
  }
  return merged;
}

function mergeFromHistory(parcours: Parcours): Parcours {
  const merged = { ...parcours };
  const history = loadHistory();
  for (const conv of history) {
    const step = merged[conv.moduleId] ?? { activities: [] };
    if (!step.activities.includes('cours')) {
      merged[conv.moduleId] = {
        ...step,
        activities: [...step.activities, 'cours'],
        startedAt: step.startedAt ?? conv.date,
      };
    }
  }
  return merged;
}

function moduleStatus(step?: StepData): 'done' | 'started' | 'todo' {
  if (!step) return 'todo';
  if (step.completedAt) return 'done';
  if (step.activities.length > 0 || step.startedAt) return 'started';
  return 'todo';
}

const STATUS_CFG = {
  done:    { dot: 'bg-emerald-500', label: 'Terminé',    badge: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  started: { dot: 'bg-amber-400',   label: 'En cours',   badge: 'bg-amber-50 text-amber-700 border-amber-300' },
  todo:    { dot: 'bg-stone-300',   label: 'À faire',    badge: 'bg-stone-100 text-stone-500 border-stone-200' },
};

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2)   return 'à l\'instant';
  if (m < 60)  return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'hier';
  if (d < 7)   return `il y a ${d} jours`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function ParcourPage({
  score,
  onNavigate,
}: {
  score: Score;
  onNavigate: (moduleId: ModuleId, tab: string) => void;
}) {
  const [parcours, setParcours] = useState<Parcours>({});
  const [history, setHistory] = useState<ReturnType<typeof loadHistory>>([]);

  useEffect(() => {
    let p = load();
    p = mergeFromScore(p, score);
    p = mergeFromHistory(p);
    save(p);
    setParcours(p);
    setHistory(loadHistory().slice(0, 15));
  }, [score]);

  const update = useCallback((next: Parcours) => {
    save(next);
    setParcours(next);
  }, []);

  function toggleActivity(moduleId: string, activity: Activity) {
    const step = parcours[moduleId] ?? { activities: [] };
    const has = step.activities.includes(activity);
    const activities = has
      ? step.activities.filter(a => a !== activity)
      : [...step.activities, activity];
    update({
      ...parcours,
      [moduleId]: {
        ...step,
        activities,
        startedAt: step.startedAt ?? new Date().toISOString(),
      },
    });
  }

  function toggleDone(moduleId: string) {
    const step = parcours[moduleId] ?? { activities: [] };
    const isDone = !!step.completedAt;
    update({
      ...parcours,
      [moduleId]: {
        ...step,
        completedAt: isDone ? undefined : new Date().toISOString(),
        startedAt: step.startedAt ?? new Date().toISOString(),
        activities: isDone ? step.activities : (['cours', 'quiz', 'exercice', 'fiche'] as Activity[]),
      },
    });
  }

  const allModules = STEPS.flatMap(s => s.modules);
  const doneCount = allModules.filter(id => moduleStatus(parcours[id]) === 'done').length;
  const startedCount = allModules.filter(id => moduleStatus(parcours[id]) === 'started').length;

  return (
    <div className="flex flex-col gap-4">

      {/* ── En-tête parcours ── */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-semibold text-navy-700">🗺️ Mon parcours NTC</div>
          <div className="text-[11px] text-stone-500">{doneCount} terminé · {startedCount} en cours · {allModules.length - doneCount - startedCount} à faire</div>
        </div>
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden flex gap-px">
          <div className="h-full bg-emerald-500 rounded-l-full transition-all duration-500" style={{ width: `${(doneCount / allModules.length) * 100}%` }} />
          <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(startedCount / allModules.length) * 100}%` }} />
        </div>
        <div className="flex gap-4 mt-2 text-[10px] text-stone-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Terminé ({doneCount}/{allModules.length})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />En cours ({startedCount})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-300 inline-block" />À faire ({allModules.length - doneCount - startedCount})</span>
        </div>
      </div>

      {/* ── Modules par CCP ── */}
      {STEPS.map(group => (
        <div key={group.ccp} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-4 py-2.5 text-white text-[12px] font-semibold" style={{ background: group.color }}>
            {group.ccp}
          </div>
          <div className="divide-y divide-stone-100">
            {group.modules.map(moduleId => {
              const mod = MODULES[moduleId];
              const step = parcours[moduleId];
              const status = moduleStatus(step);
              const cfg = STATUS_CFG[status];
              const modScore = score.byModule[moduleId];

              return (
                <div key={moduleId} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  {/* Dot + nom */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium text-stone-700 truncate">{mod.label.replace(/^CP\d+ — /, '')}</div>
                      {modScore?.total > 0 && (
                        <div className="text-[10px] text-stone-400">
                          Quiz : {modScore.correct}/{modScore.total} ({Math.round((modScore.correct / modScore.total) * 100)}%)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Activités */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {(['cours', 'quiz', 'exercice', 'fiche'] as Activity[]).map(act => {
                      const done = step?.activities.includes(act) ?? false;
                      return (
                        <button
                          key={act}
                          onClick={() => toggleActivity(moduleId, act)}
                          title={done ? `Décocher ${act}` : `Marquer ${act} fait`}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                            done
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                              : 'border-stone-200 bg-stone-50 text-stone-400 hover:border-stone-400'
                          }`}
                        >
                          {done ? '✓ ' : ''}{act}
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onNavigate(moduleId, 'revision')}
                      className="text-[10.5px] px-2.5 py-1 bg-navy-700 hover:bg-navy-800 text-white rounded-lg transition-colors"
                    >
                      Réviser →
                    </button>
                    <button
                      onClick={() => toggleDone(moduleId)}
                      className={`text-[10.5px] px-2 py-1 rounded-lg border transition-all ${
                        status === 'done'
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                          : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                      title={status === 'done' ? 'Marquer comme non terminé' : 'Marquer comme terminé'}
                    >
                      {status === 'done' ? '✓' : '○'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Historique d'activité ── */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="text-[13px] font-semibold text-navy-700 mb-3">🕐 Historique d&apos;activité</div>
        {history.length === 0 ? (
          <p className="text-[12px] text-stone-400 text-center py-4">Aucune activité enregistrée. Lance une révision IA pour voir l&apos;historique ici.</p>
        ) : (
          <div className="flex flex-col gap-0">
            {history.map((conv, i) => {
              const mod = MODULES[conv.moduleId];
              return (
                <div key={conv.id} className={`flex items-start gap-3 py-2.5 ${i < history.length - 1 ? 'border-b border-stone-100' : ''}`}>
                  <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-navy-500" />
                    {i < history.length - 1 && <div className="w-px flex-1 bg-stone-200 mt-1 min-h-[16px]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11.5px] font-medium text-stone-700">📚 Révision</span>
                      <span className="text-[11px] text-stone-500 truncate">{mod?.label.replace(/^CP\d+ — /, '') ?? conv.moduleId}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-stone-400">{relativeDate(conv.date)}</span>
                      <span className="text-[10px] text-stone-400">· {conv.messages.length} messages</span>
                      {conv.preview && <span className="text-[10px] text-stone-400 truncate italic">« {conv.preview.slice(0, 40)}… »</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate(conv.moduleId, 'revision')}
                    className="text-[10px] text-navy-700 hover:underline flex-shrink-0"
                  >
                    Voir →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
