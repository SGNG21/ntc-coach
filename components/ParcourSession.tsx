'use client';
import { useState, useRef, useEffect } from 'react';
import { MODULES } from '@/lib/reac-data';
import { streamChat } from '@/lib/stream';
import type { ModuleId } from '@/types';

/* ─── Types ───────────────────────────────────────── */
type Phase = 'setup' | 'intro' | 'explaining' | 'exercise' | 'result_module' | 'done';

interface QcmQ {
  q: string;
  options: { A: string; B: string; C: string; D: string };
  answer: string;
  explanation: string;
}

interface ModuleResult {
  moduleId: ModuleId;
  explanationDone: boolean;
  exerciseScore: number | null; // null = skipped
  totalQuestions?: number;
}

/* ─── Module groups ───────────────────────────────── */
const GROUPS = [
  { id: 'ccp1', label: 'CCP 1 — Prospection', emoji: '📞', modules: ['veille', 'pac', 'prospection', 'perf'] as ModuleId[] },
  { id: 'ccp2', label: 'CCP 2 — Négociation', emoji: '🤝', modules: ['image', 'proposition', 'nego', 'bilan', 'relation'] as ModuleId[] },
  { id: 'tr',   label: 'Transversal',          emoji: '⚡', modules: ['transversal', 'digital', 'rse', 'juridique'] as ModuleId[] },
  { id: 'all',  label: 'Parcours complet',      emoji: '🗺️', modules: ['veille','pac','prospection','perf','image','proposition','nego','bilan','relation','transversal','digital','rse','juridique'] as ModuleId[] },
];

/* ─── Helper ──────────────────────────────────────── */
function ProgressBar({ value, max, color = '#1c3d5a' }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  );
}

/* ─── Main component ──────────────────────────────── */
export function ParcourSession({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedGroup, setSelectedGroup] = useState<string>('ccp1');
  const [customIds, setCustomIds] = useState<ModuleId[]>([]);
  const [useCustom, setUseCustom] = useState(false);

  const [modules, setModules] = useState<ModuleId[]>([]);
  const [cursor, setCursor] = useState(0); // current module index
  const [results, setResults] = useState<ModuleResult[]>([]);

  // Explanation
  const [explanation, setExplanation] = useState('');
  const [explLoading, setExplLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState('');

  // Exercise
  const [questions, setQuestions] = useState<QcmQ[]>([]);
  const [exoLoading, setExoLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [exoCorrect, setExoCorrect] = useState(0);

  const explBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { explBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [explanation]);

  const mod = modules[cursor] ? MODULES[modules[cursor]] : null;

  /* ── Start session ── */
  function startSession() {
    const ids = useCustom
      ? customIds
      : GROUPS.find(g => g.id === selectedGroup)?.modules ?? [];
    if (ids.length === 0) return;
    setModules(ids);
    setCursor(0);
    setResults([]);
    setPhase('intro');
  }

  /* ── Load explanation ── */
  async function loadExplanation(question: string) {
    if (!mod) return;
    setExplanation('');
    setExplLoading(true);
    setSelectedQuestion(question);
    setPhase('explaining');
    let text = '';
    try {
      await streamChat(
        {
          messages: [{ role: 'user', content: question }],
          moduleId: modules[cursor],
          mode: 'expliquer',
        },
        chunk => { text += chunk; setExplanation(text); }
      );
    } finally {
      setExplLoading(false);
    }
  }

  /* ── Load exercise ── */
  async function loadExercise() {
    if (!mod) return;
    setExoLoading(true);
    setPhase('exercise');
    setQuestions([]);
    setCurrent(0);
    setPicked(null);
    setExoCorrect(0);
    try {
      const res = await fetch('/api/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: modules[cursor], mode: 'qcm' }),
      });
      if (!res.ok || !res.body) throw new Error('fetch failed');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let raw = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
      }
      const match = raw.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no json');
      const data = JSON.parse(match[0]);
      setQuestions(data.questions ?? []);
    } catch {
      setQuestions([]);
    } finally {
      setExoLoading(false);
    }
  }

  /* ── Pick QCM answer ── */
  function pick(letter: string) {
    if (picked) return;
    setPicked(letter);
    if (letter === questions[current]?.answer) setExoCorrect(c => c + 1);
  }

  function nextQuestion() {
    if (current + 1 < questions.length) {
      setCurrent(c => c + 1);
      setPicked(null);
    } else {
      finishModule(exoCorrect);
    }
  }

  /* ── Finish module ── */
  function finishModule(score?: number) {
    const result: ModuleResult = {
      moduleId: modules[cursor],
      explanationDone: explanation.length > 0,
      exerciseScore: score ?? (questions.length > 0 ? exoCorrect : null),
      totalQuestions: questions.length > 0 ? questions.length : undefined,
    };
    const newResults = [...results, result];
    setResults(newResults);

    if (cursor + 1 < modules.length) {
      setPhase('result_module');
    } else {
      setPhase('done');
    }
  }

  function nextModule() {
    setCursor(c => c + 1);
    setExplanation('');
    setSelectedQuestion('');
    setQuestions([]);
    setCurrent(0);
    setPicked(null);
    setExoCorrect(0);
    setPhase('intro');
  }

  function toggleCustom(id: ModuleId) {
    setCustomIds(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  }

  /* ── Render ── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-6">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-navy-700 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold">🗺️ Mode Parcours</span>
            {phase !== 'setup' && phase !== 'done' && (
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full">
                Module {cursor + 1}/{modules.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none transition-colors">×</button>
        </div>

        {/* Progress */}
        {phase !== 'setup' && phase !== 'done' && (
          <div className="px-5 pt-3 pb-0 flex-shrink-0">
            <ProgressBar value={cursor} max={modules.length} color="#1c3d5a" />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── SETUP ── */}
          {phase === 'setup' && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-[14px] font-semibold text-navy-700 mb-1">Choisir un parcours</div>
                <p className="text-[12px] text-stone-500">Pour chaque module : une explication IA sur un point clé, puis un exercice QCM.</p>
              </div>

              {!useCustom ? (
                <div className="grid grid-cols-2 gap-2">
                  {GROUPS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGroup(g.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedGroup === g.id
                          ? 'border-navy-700 bg-navy-50'
                          : 'border-stone-200 hover:border-navy-500 hover:bg-navy-50'
                      }`}
                    >
                      <div className="text-xl mb-1">{g.emoji}</div>
                      <div className="text-[12px] font-semibold text-stone-700">{g.label}</div>
                      <div className="text-[10.5px] text-stone-400 mt-0.5">{g.modules.length} modules</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {(['veille','pac','prospection','perf','image','proposition','nego','bilan','relation','transversal','digital','rse','juridique'] as ModuleId[]).map(id => (
                    <label key={id} className="flex items-center gap-2.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-stone-50">
                      <input
                        type="checkbox"
                        checked={customIds.includes(id)}
                        onChange={() => toggleCustom(id)}
                        className="w-3.5 h-3.5 accent-navy-700"
                      />
                      <span className="text-[12px] text-stone-700">{MODULES[id].label}</span>
                    </label>
                  ))}
                </div>
              )}

              <button
                onClick={() => setUseCustom(v => !v)}
                className="text-[11px] text-navy-700 hover:underline self-start"
              >
                {useCustom ? '← Choisir un groupe prédéfini' : '+ Sélection personnalisée'}
              </button>

              <button
                onClick={startSession}
                disabled={useCustom && customIds.length === 0}
                className="w-full py-3 bg-navy-700 hover:bg-navy-800 disabled:bg-stone-200 disabled:text-stone-400 text-white rounded-xl text-[13px] font-semibold transition-colors"
              >
                Démarrer le parcours →
              </button>
            </div>
          )}

          {/* ── INTRO MODULE ── */}
          {phase === 'intro' && mod && (
            <div className="flex flex-col gap-4">
              <div className="bg-navy-50 border border-navy-500/20 rounded-xl p-4">
                <div className="text-[11px] text-navy-700 font-semibold mb-1">{mod.ccp}</div>
                <div className="text-[16px] font-bold text-navy-700">{mod.label.replace(/^CP\d+ — /, '')}</div>
                <p className="text-[12px] text-stone-600 mt-1.5 leading-relaxed">{mod.desc}</p>
              </div>

              <div>
                <div className="text-[12px] font-semibold text-stone-600 mb-2">Choisis un point à réviser :</div>
                <div className="flex flex-wrap gap-2">
                  {(mod.qps || []).map(qp => (
                    <button
                      key={qp}
                      onClick={() => loadExplanation(qp)}
                      className="text-[12px] px-3 py-1.5 bg-white border border-stone-200 hover:border-navy-500 hover:bg-navy-50 rounded-lg transition-all text-stone-700"
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={loadExercise}
                  className="flex-1 py-2 border-2 border-navy-700 text-navy-700 hover:bg-navy-50 rounded-xl text-[12.5px] font-semibold transition-colors"
                >
                  ⚡ Aller direct à l&apos;exercice
                </button>
                <button
                  onClick={() => finishModule()}
                  className="px-4 py-2 text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Passer →
                </button>
              </div>
            </div>
          )}

          {/* ── EXPLAINING ── */}
          {phase === 'explaining' && mod && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-navy-100 text-navy-700 px-2 py-0.5 rounded font-medium">{mod.label.replace(/^CP\d+ — /, '')}</span>
                <span className="text-[11px] text-stone-400">{selectedQuestion}</span>
              </div>
              <div className="bg-stone-50 rounded-xl p-4 text-[12.5px] leading-relaxed text-stone-700 min-h-[120px]">
                {explanation || <span className="text-stone-400">Génération en cours…</span>}
                <div ref={explBottomRef} />
              </div>
              {!explLoading && (
                <div className="flex gap-2">
                  <button
                    onClick={loadExercise}
                    className="flex-1 py-2.5 bg-navy-700 hover:bg-navy-800 text-white rounded-xl text-[12.5px] font-semibold transition-colors"
                  >
                    ✏️ Passer à l&apos;exercice →
                  </button>
                  <button
                    onClick={() => setPhase('intro')}
                    className="px-4 py-2 text-[11px] text-stone-400 hover:text-stone-600"
                  >
                    ← Retour
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── EXERCISE ── */}
          {phase === 'exercise' && (
            <div className="flex flex-col gap-3">
              {exoLoading ? (
                <div className="text-center py-12 text-stone-400 text-[12px]">⏳ Génération de l&apos;exercice…</div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[12px] text-stone-400 mb-3">Erreur de génération.</p>
                  <button onClick={() => finishModule()} className="text-[12px] text-navy-700 hover:underline">Module suivant →</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-500">Question {current + 1}/{questions.length}</span>
                    <span className="text-[11px] text-stone-400">{exoCorrect} correcte{exoCorrect > 1 ? 's' : ''}</span>
                  </div>
                  <ProgressBar value={current} max={questions.length} color="#ef4444" />

                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="text-[13px] font-semibold text-stone-800 mb-4 leading-snug">{questions[current].q}</p>
                    <div className="flex flex-col gap-2">
                      {(['A','B','C','D'] as const).map(l => {
                        const isCorrect = l === questions[current].answer;
                        const isPicked = l === picked;
                        let cls = 'border-stone-200 bg-white hover:border-navy-500 hover:bg-navy-50';
                        if (picked) {
                          if (isCorrect) cls = 'border-emerald-500 bg-emerald-50';
                          else if (isPicked) cls = 'border-red-400 bg-red-50';
                          else cls = 'border-stone-200 bg-white opacity-50';
                        }
                        return (
                          <button key={l} onClick={() => pick(l)} disabled={!!picked}
                            className={`text-left px-3 py-2.5 rounded-lg border-[1.5px] transition-all text-[12px] ${cls}`}>
                            <span className="font-semibold mr-2">{l}.</span>{questions[current].options[l]}
                          </button>
                        );
                      })}
                    </div>
                    {picked && (
                      <div className={`mt-3 text-[11.5px] rounded-lg px-3 py-2 ${picked === questions[current].answer ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {questions[current].explanation}
                      </div>
                    )}
                  </div>

                  {picked && (
                    <button onClick={nextQuestion}
                      className="py-2.5 bg-navy-700 hover:bg-navy-800 text-white rounded-xl text-[12.5px] font-semibold transition-colors">
                      {current + 1 >= questions.length ? 'Terminer ce module →' : 'Question suivante →'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── RESULT MODULE ── */}
          {phase === 'result_module' && mod && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="text-4xl">
                {results[results.length - 1]?.exerciseScore !== null &&
                 (results[results.length - 1]?.exerciseScore ?? 0) / questions.length >= 0.75
                  ? '🎉' : '💪'}
              </div>
              <div className="text-[15px] font-bold text-navy-700">{mod.label.replace(/^CP\d+ — /, '')} terminé</div>
              {results[results.length - 1]?.exerciseScore !== null && (
                <div className="text-[13px] text-stone-500">
                  Score exercice : <strong>{results[results.length - 1].exerciseScore}/{results[results.length - 1].totalQuestions ?? questions.length}</strong>
                </div>
              )}
              <div className="text-[12px] text-stone-400">
                Module {cursor + 1}/{modules.length} · encore {modules.length - cursor - 1} à faire
              </div>
              <button
                onClick={nextModule}
                className="mt-2 px-8 py-3 bg-navy-700 hover:bg-navy-800 text-white rounded-xl text-[13px] font-semibold transition-colors"
              >
                Module suivant → {MODULES[modules[cursor + 1]]?.label.replace(/^CP\d+ — /, '')}
              </button>
            </div>
          )}

          {/* ── DONE ── */}
          {phase === 'done' && (
            <div className="flex flex-col gap-4">
              <div className="text-center py-4">
                <div className="text-5xl mb-3">🏆</div>
                <div className="text-[16px] font-bold text-navy-700 mb-1">Parcours terminé !</div>
                <div className="text-[12px] text-stone-500">{modules.length} modules · {results.filter(r => r.explanationDone).length} explications · {results.filter(r => r.exerciseScore !== null).length} exercices</div>
              </div>

              <div className="flex flex-col gap-2">
                {results.map(r => {
                  const m = MODULES[r.moduleId];
                  const pct = r.exerciseScore !== null && (r.totalQuestions ?? 0) > 0
                    ? Math.round((r.exerciseScore / (r.totalQuestions || 4)) * 100) : null;
                  return (
                    <div key={r.moduleId} className="flex items-center gap-3 px-3 py-2.5 bg-stone-50 rounded-lg border border-stone-200">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 bg-emerald-500" />
                      <span className="text-[12px] text-stone-700 flex-1">{m?.label.replace(/^CP\d+ — /, '')}</span>
                      {r.explanationDone && <span className="text-[10px] text-navy-700 bg-navy-50 px-1.5 py-0.5 rounded">📖 Cours</span>}
                      {pct !== null && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${pct >= 75 ? 'bg-emerald-50 text-emerald-700' : pct >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                          {pct}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setPhase('setup')}
                  className="flex-1 py-2.5 border-2 border-navy-700 text-navy-700 hover:bg-navy-50 rounded-xl text-[12.5px] font-semibold">
                  Nouveau parcours
                </button>
                <button onClick={onClose}
                  className="flex-1 py-2.5 bg-navy-700 hover:bg-navy-800 text-white rounded-xl text-[12.5px] font-semibold">
                  Fermer
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
