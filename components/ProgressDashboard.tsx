'use client';
import { MODULES } from '@/lib/reac-data';
import type { Score, ModuleId } from '@/types';

const CCP_GROUPS = [
  { id: 'CCP1', label: 'CCP 1 — Prospection', color: '#0f5298', modules: ['veille', 'pac', 'prospection', 'perf'] as ModuleId[] },
  { id: 'CCP2', label: 'CCP 2 — Négociation', color: '#6b2d7e', modules: ['image', 'proposition', 'nego', 'bilan', 'relation'] as ModuleId[] },
  { id: 'TR', label: 'Transversal', color: '#1c3d5a', modules: ['transversal', 'digital', 'rse', 'juridique'] as ModuleId[] },
];

function pct(c: number, t: number) { return t === 0 ? 0 : Math.round((c / t) * 100); }

function NiveauBadge({ p }: { p: number }) {
  const cfg =
    p >= 80 ? { label: 'Expert', cls: 'text-emerald-700 bg-emerald-50 border-emerald-300' } :
    p >= 60 ? { label: 'Avancé', cls: 'text-blue-700 bg-blue-50 border-blue-300' } :
    p >= 40 ? { label: 'Intermédiaire', cls: 'text-amber-700 bg-amber-50 border-amber-300' } :
              { label: 'Débutant', cls: 'text-stone-600 bg-stone-100 border-stone-300' };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${cfg.cls}`}>{cfg.label}</span>;
}

function BarColor(p: number) {
  if (p >= 75) return '#10b981';
  if (p >= 50) return '#3b82f6';
  if (p >= 30) return '#f59e0b';
  return '#ef4444';
}

export function ProgressDashboard({ score, onReset }: { score: Score; onReset: () => void }) {
  const globalPct = pct(score.correct, score.total);
  const totalModules = Object.keys(MODULES).length;
  const modulesWorked = Object.values(score.byModule).filter(m => m.total > 0).length;

  const weakest = Object.entries(score.byModule)
    .filter(([, v]) => v.total >= 2)
    .sort(([, a], [, b]) => pct(a.correct, a.total) - pct(b.correct, b.total))[0];

  const strongest = Object.entries(score.byModule)
    .filter(([, v]) => v.total >= 2)
    .sort(([, a], [, b]) => pct(b.correct, b.total) - pct(a.correct, a.total))[0];

  return (
    <div className="flex flex-col gap-4">

      {/* ── Score global ── */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-semibold text-navy-700">📊 Progression globale</div>
          {score.total > 0 && (
            <button onClick={onReset} className="text-[10px] text-stone-400 hover:text-red-500 transition-colors">
              ↺ Réinitialiser
            </button>
          )}
        </div>

        {score.total === 0 ? (
          <p className="text-[12px] text-stone-400 text-center py-4">Réponds à des exercices pour voir ta progression ici.</p>
        ) : (
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="text-[42px] font-bold text-navy-700 leading-none">{globalPct}%</div>
              <NiveauBadge p={globalPct} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-stone-500 mb-1.5">
                <span>{score.correct} bonnes / {score.total} réponses</span>
                <span>{modulesWorked}/{totalModules} modules travaillés</span>
              </div>
              <div className="h-3 bg-stone-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${globalPct}%`, background: BarColor(globalPct) }}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {weakest && (
                  <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex-1 min-w-0">
                    📉 Point faible : <strong className="truncate">{MODULES[weakest[0] as ModuleId]?.label?.replace(/^CP\d+ — /, '')}</strong> ({pct(weakest[1].correct, weakest[1].total)}%)
                  </div>
                )}
                {strongest && (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 flex-1 min-w-0">
                    📈 Point fort : <strong className="truncate">{MODULES[strongest[0] as ModuleId]?.label?.replace(/^CP\d+ — /, '')}</strong> ({pct(strongest[1].correct, strongest[1].total)}%)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Par CCP ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CCP_GROUPS.map(g => {
          const worked = g.modules.filter(id => (score.byModule[id]?.total ?? 0) > 0);
          const totalC = worked.reduce((s, id) => s + (score.byModule[id]?.correct ?? 0), 0);
          const totalT = worked.reduce((s, id) => s + (score.byModule[id]?.total ?? 0), 0);
          const p = pct(totalC, totalT);
          return (
            <div key={g.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="px-3 py-2 text-white text-[11px] font-semibold" style={{ background: g.color }}>
                {g.label}
              </div>
              <div className="p-3">
                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className="text-[26px] font-bold text-stone-700">{totalT > 0 ? `${p}%` : '—'}</span>
                  <span className="text-[10px] text-stone-400">{worked.length}/{g.modules.length} modules</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-1">
                  {totalT > 0 && (
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, background: g.color, opacity: 0.85 }} />
                  )}
                </div>
                <div className="text-[10px] text-stone-400">{totalC}/{totalT} correctes</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Détail modules ── */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="text-[13px] font-semibold text-navy-700 mb-3">Détail par module</div>
        <div className="flex flex-col gap-2.5">
          {CCP_GROUPS.map(g =>
            g.modules.map(id => {
              const m = score.byModule[id];
              const p = m?.total > 0 ? pct(m.correct, m.total) : null;
              const shortLabel = MODULES[id]?.label?.replace(/^CP\d+ — /, '') ?? id;
              return (
                <div key={id} className="flex items-center gap-3">
                  <div className="w-[3px] h-9 rounded-full flex-shrink-0" style={{ background: g.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11.5px] text-stone-700 truncate">{shortLabel}</span>
                      <span className="text-[10.5px] text-stone-500 ml-2 flex-shrink-0 font-mono">
                        {m?.total > 0 ? `${m.correct}/${m.total}` : '—'}
                      </span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      {p !== null && (
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${p}%`, background: g.color, opacity: 0.75 }}
                        />
                      )}
                    </div>
                  </div>
                  {p !== null ? (
                    <span className={`text-[10.5px] font-semibold w-9 text-right flex-shrink-0 ${p >= 70 ? 'text-emerald-600' : p >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                      {p}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-300 w-9 text-right flex-shrink-0">0%</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
