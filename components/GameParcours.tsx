'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MODULES } from '@/lib/reac-data';
import type { ModuleId } from '@/types';

/* ─── Constants ───────────────────────────────── */
const ALL_MODULES: ModuleId[] = [
  'veille','pac','prospection','perf',
  'image','proposition','nego','bilan','relation',
  'transversal','digital','rse','juridique',
];

const CCP_COLOR: Record<string, string> = {
  CCP1: '#0f5298', CCP2: '#6b2d7e', Transversal: '#1c3d5a',
};

const LS_STARS = 'ntc_game_stars';
const LS_XP    = 'ntc_game_xp';

/* ─── Types ───────────────────────────────────── */
type Screen = 'map' | 'theory' | 'quiz' | 'result' | 'gameover';

interface QcmQ {
  q: string;
  options: { A: string; B: string; C: string; D: string };
  answer: string;
  explanation: string;
}

function loadStars(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(LS_STARS) || '{}'); } catch { return {}; }
}
function saveStars(s: Record<string, number>) {
  try { localStorage.setItem(LS_STARS, JSON.stringify(s)); } catch { /* */ }
}
function loadXP(): number {
  try { return parseInt(localStorage.getItem(LS_XP) || '0', 10); } catch { return 0; }
}
function saveXP(xp: number) {
  try { localStorage.setItem(LS_XP, xp.toString()); } catch { /* */ }
}

/* ─── Sub-components ──────────────────────────── */
function Heart({ filled }: { filled: boolean }) {
  return <span className={`text-xl transition-all ${filled ? 'opacity-100' : 'opacity-20 grayscale'}`}>❤️</span>;
}

function StarDisplay({ count, delay = 0 }: { count: number; delay?: number }) {
  return (
    <div className="flex gap-1 justify-center">
      {[1,2,3].map(i => (
        <span
          key={i}
          className="text-2xl"
          style={{
            animation: i <= count ? `star-pop 0.5s ${delay + i * 0.15}s cubic-bezier(0.175,0.885,0.32,1.275) both` : 'none',
            opacity: i <= count ? 1 : 0.2,
            filter: i <= count ? 'none' : 'grayscale(1)',
          }}
        >⭐</span>
      ))}
    </div>
  );
}

function XpBadge({ amount }: { amount: number }) {
  return (
    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[13px] font-bold text-amber-500 animate-xp-float pointer-events-none">
      +{amount} XP
    </span>
  );
}

/* ─── Timer arc ───────────────────────────────── */
function TimerArc({ seconds, total }: { seconds: number; total: number }) {
  const pct = seconds / total;
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = pct > 0.5 ? '#10b981' : pct > 0.25 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="48" height="48" className="rotate-[-90deg]">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s' }} />
      <text x="24" y="24" textAnchor="middle" dominantBaseline="central"
        className="rotate-90" style={{ transform: 'rotate(90deg)', transformOrigin: '24px 24px', fontSize: '13px', fontWeight: 700, fill: color }}>
        {seconds}
      </text>
    </svg>
  );
}

/* ─── Main component (rendu comme une page, pas une modale) ── */
export function GameParcours({ onBack }: { onBack: () => void }) {
  const [screen, setScreen] = useState<Screen>('map');
  const [stars, setStars] = useState<Record<string, number>>(loadStars);
  const [totalXP, setTotalXP] = useState<number>(loadXP);

  // Current module session
  const [moduleId, setModuleId] = useState<ModuleId>('veille');
  const [theoryStep, setTheoryStep] = useState(0);

  // Quiz state
  const [questions, setQuestions] = useState<QcmQ[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [picked, setPicked] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [showXp, setShowXp] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [timer, setTimer] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Result
  const [earnedStars, setEarnedStars] = useState(0);

  const mod = MODULES[moduleId];
  const totalLevel = Math.floor(totalXP / 100) + 1;
  const xpInLevel = totalXP % 100;

  /* ── Timer ── */
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { stopTimer(); return 0; }
        return t - 1;
      });
    }, 1000);
  }, [stopTimer]);

  useEffect(() => {
    if (timer === 0 && screen === 'quiz' && !picked) handlePick('__timeout__');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  /* ── Start module ── */
  function startModule(id: ModuleId) {
    setModuleId(id);
    setTheoryStep(0);
    setScreen('theory');
  }

  /* ── Load quiz ── */
  async function loadQuiz() {
    setLoading(true);
    setQuestions([]);
    setQIdx(0);
    setPicked(null);
    setCombo(0);
    setSessionXP(0);
    setMistakes(0);
    setLives(3);
    setScreen('quiz');
    try {
      const res = await fetch('/api/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, mode: 'qcm' }),
      });
      if (!res.ok || !res.body) throw new Error('fetch');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let raw = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += dec.decode(value, { stream: true });
      }
      const m = raw.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/);
      const data = m ? JSON.parse(m[0]) : { questions: [] };
      setQuestions(data.questions ?? []);
      startTimer();
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  /* ── Answer ── */
  function handlePick(letter: string) {
    if (picked || loading) return;
    stopTimer();
    setPicked(letter);

    const q = questions[qIdx];
    const correct = letter === q?.answer;

    if (correct) {
      const newCombo = combo + 1;
      const multiplier = newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1;
      const gained = 10 * multiplier;
      setCombo(newCombo);
      setSessionXP(x => x + gained);
      setXpAmount(gained);
      setShowXp(true);
      setTimeout(() => setShowXp(false), 900);
    } else {
      setCombo(0);
      setMistakes(m => m + 1);
      if (letter !== '__timeout__') {
        setLives(l => l - 1);
        setShakeTrigger(n => n + 1);
      }
    }
  }

  /* ── Next question ── */
  function nextQuestion() {
    if (lives <= 0) {
      finishQuiz();
      return;
    }
    if (qIdx + 1 >= questions.length) {
      finishQuiz();
    } else {
      setQIdx(i => i + 1);
      setPicked(null);
      startTimer();
    }
  }

  /* ── Finish ── */
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
    setScreen('result');
  }

  /* ── Render MAP ── */
  if (screen === 'map') {
    const nextModule = ALL_MODULES.find(id => !stars[id]) ?? ALL_MODULES[0];
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-navy-700 to-navy-900 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-white/60 text-[9px] uppercase tracking-wider">Niveau</span>
              <span className="text-white font-bold text-[15px] leading-none">{totalLevel}</span>
            </div>
            <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${xpInLevel}%` }} />
            </div>
            <span className="text-white/70 text-[11px]">{xpInLevel}/100 XP</span>
          </div>
          <button onClick={onBack} className="text-white/60 hover:text-white text-[13px] bg-white/10 px-3 py-1 rounded-full">← Retour</button>
        </div>

        {/* Title */}
        <div className="text-center pb-3 flex-shrink-0">
          <div className="text-white text-[18px] font-bold">🗺️ Parcours NTC</div>
          <div className="text-white/60 text-[11px]">
            {Object.keys(stars).length}/{ALL_MODULES.length} modules complétés
          </div>
        </div>

        {/* Continue button */}
        <div className="px-4 pb-3 flex-shrink-0">
          <button
            onClick={() => startModule(nextModule)}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl font-bold text-[13px] shadow-lg shadow-amber-900/30 transition-colors"
          >
            {stars[nextModule] ? '🔄 Rejouer' : '▶ Continuer'} — {MODULES[nextModule]?.label.replace(/^CP\d+ — /, '')}
          </button>
        </div>

        {/* Module grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {[
            { label: 'CCP 1 — Prospection', ids: ['veille','pac','prospection','perf'] as ModuleId[] },
            { label: 'CCP 2 — Négociation', ids: ['image','proposition','nego','bilan','relation'] as ModuleId[] },
            { label: 'Transversal',          ids: ['transversal','digital','rse','juridique'] as ModuleId[] },
          ].map(group => (
            <div key={group.label} className="mb-5">
              <div className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">{group.label}</div>
              <div className="grid grid-cols-2 gap-2.5">
                {group.ids.map((id, i) => {
                  const m = MODULES[id];
                  const s = stars[id] ?? 0;
                  const isNext = id === nextModule;
                  return (
                    <button
                      key={id}
                      onClick={() => startModule(id)}
                      className={`relative p-3 rounded-xl text-left transition-all border-2 ${
                        isNext
                          ? 'border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-900/20'
                          : s > 0
                          ? 'border-white/20 bg-white/10'
                          : 'border-white/10 bg-white/5'
                      }`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <span className="text-2xl leading-none">{m.ccp === 'CCP1' ? '📞' : m.ccp === 'CCP2' ? '🤝' : '⚡'}</span>
                        {isNext && <span className="text-[9px] bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded font-bold">NEXT</span>}
                      </div>
                      <div className="text-white text-[11px] font-semibold leading-tight mb-1.5">
                        {m.label.replace(/^CP\d+ — /, '')}
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3].map(n => (
                          <span key={n} className="text-[11px]" style={{ opacity: n <= s ? 1 : 0.2 }}>⭐</span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Render THEORY ── */
  if (screen === 'theory') {
    const savoirs = mod.savoirs ?? [];
    const points = savoirs.slice(0, 5);
    const isLast = theoryStep >= points.length - 1;
    const text = points[theoryStep] ?? '';
    // strip HTML tags for clean display
    const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    return (
      <div className="flex flex-col h-full" style={{ background: CCP_COLOR[mod.ccp] ?? '#1c3d5a' }}>
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
          <button onClick={() => setScreen('map')} className="text-white/60 hover:text-white text-[13px]">← Carte</button>
          <div className="text-white/60 text-[11px]">{theoryStep + 1} / {points.length}</div>
          <button onClick={loadQuiz} className="text-white/80 hover:text-white text-[11px] bg-white/10 px-3 py-1 rounded-full">Passer le cours →</button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5">
          <div className="text-center">
            <div className="text-4xl mb-2">📖</div>
            <div className="text-white/60 text-[11px] uppercase tracking-widest mb-1">{mod.label.replace(/^CP\d+ — /, '')}</div>
            <div className="text-white font-bold text-[17px]">Point clé {theoryStep + 1}</div>
          </div>

          <div
            key={theoryStep}
            className="bg-white/15 backdrop-blur rounded-2xl p-6 w-full max-w-lg animate-pop-in"
          >
            <p className="text-white text-[15px] leading-relaxed">{clean}</p>
          </div>

          <div className="flex gap-1.5">
            {points.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === theoryStep ? 'w-8 bg-white' : i < theoryStep ? 'w-2 bg-white/60' : 'w-2 bg-white/25'}`} />
            ))}
          </div>
        </div>

        <div className="px-5 pb-8 flex-shrink-0">
          <button
            onClick={() => isLast ? loadQuiz() : setTheoryStep(s => s + 1)}
            className="w-full py-4 bg-white rounded-2xl font-bold text-[15px] shadow-xl transition-all active:scale-95"
            style={{ color: CCP_COLOR[mod.ccp] ?? '#1c3d5a' }}
          >
            {isLast ? '✏️ Commencer le quiz !' : 'Suivant →'}
          </button>
        </div>
      </div>
    );
  }

  /* ── Render QUIZ ── */
  if (screen === 'quiz') {
    const q = questions[qIdx];
    const answeredCorrectly = picked === q?.answer;

    return (
      <div className="flex flex-col h-full bg-stone-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-200 flex-shrink-0">
          <button onClick={() => setScreen('map')} className="text-stone-400 hover:text-stone-600 text-lg">×</button>
          <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${questions.length ? ((qIdx) / questions.length) * 100 : 0}%`, background: CCP_COLOR[mod.ccp] }}
            />
          </div>
          <div className="flex gap-1">
            <Heart filled={lives >= 1} />
            <Heart filled={lives >= 2} />
            <Heart filled={lives >= 3} />
          </div>
        </div>

        {/* XP + Combo bar */}
        <div className="flex items-center justify-between px-5 py-2 bg-white border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-600">⚡ {sessionXP} XP</span>
            {combo >= 2 && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold animate-pop-in">
                🔥 ×{combo >= 5 ? 3 : 2} combo
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i < qIdx ? 'bg-emerald-500' : i === qIdx ? 'bg-navy-700' : 'bg-stone-200'}`} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5">
          {loading || !q ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-stone-400">
                <div className="text-4xl mb-3 animate-bounce">⚡</div>
                <div className="text-[12px]">Chargement des questions…</div>
              </div>
            </div>
          ) : (
            <>
              {/* Timer + question */}
              <div className="flex items-start gap-3">
                {!picked && <TimerArc seconds={timer} total={30} />}
                <p className={`text-[15px] font-bold text-stone-800 leading-snug flex-1 ${shakeTrigger ? 'animate-shake' : ''}`}
                  key={`${qIdx}-${shakeTrigger}`}>
                  {q.q}
                </p>
              </div>

              {/* Answers */}
              <div className="flex flex-col gap-2.5 relative">
                {showXp && <XpBadge amount={xpAmount} />}
                {(['A','B','C','D'] as const).map(l => {
                  const isCorrect = l === q.answer;
                  const isPicked = l === picked;
                  let cls = 'border-stone-200 bg-white active:scale-[0.98]';
                  if (picked) {
                    if (isCorrect) cls = 'border-emerald-500 bg-emerald-50 scale-[1.02]';
                    else if (isPicked) cls = 'border-red-400 bg-red-50';
                    else cls = 'border-stone-100 bg-stone-50 opacity-50';
                  }
                  return (
                    <button
                      key={l}
                      onClick={() => handlePick(l)}
                      disabled={!!picked}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-[13px] font-medium ${cls}`}
                    >
                      <span className="font-bold mr-2.5 text-stone-400">{l}.</span>
                      {q.options[l]}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {picked && (
                <div className={`rounded-xl px-4 py-3 text-[12.5px] border animate-pop-in ${
                  answeredCorrectly
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                  <div className="font-bold mb-1">{answeredCorrectly ? '✅ Bonne réponse !' : `❌ La bonne réponse était ${q.answer}.`}</div>
                  {q.explanation}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {picked && (
          <div className="px-5 pb-6 flex-shrink-0 bg-white border-t border-stone-100 pt-3">
            <button
              onClick={nextQuestion}
              className={`w-full py-4 rounded-2xl font-bold text-[14px] transition-all active:scale-95 shadow-lg ${
                answeredCorrectly
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
              }`}
            >
              {qIdx + 1 >= questions.length ? 'Voir les résultats →' : 'Continuer →'}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Render RESULT ── */
  if (screen === 'result') {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gradient-to-b from-navy-700 to-navy-900 px-6">
        <div className="text-center flex flex-col items-center gap-6 max-w-sm w-full">
          <div className="text-[40px] animate-pop-in">
            {earnedStars === 3 ? '🎉' : earnedStars === 2 ? '💪' : '📚'}
          </div>
          <div className="text-white font-bold text-[22px]">
            {earnedStars === 3 ? 'Parfait !' : earnedStars === 2 ? 'Bien joué !' : 'Continue !'}
          </div>

          <StarDisplay count={earnedStars} delay={0.2} />

          <div className="bg-white/10 rounded-2xl p-4 w-full flex flex-col gap-3">
            <div className="flex justify-between text-[13px]">
              <span className="text-white/70">XP gagné</span>
              <span className="text-amber-400 font-bold">+{sessionXP} XP</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-white/70">Erreurs</span>
              <span className="text-white font-bold">{mistakes}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-white/70">Vies restantes</span>
              <span className="text-white font-bold">{'❤️'.repeat(Math.max(0, lives))}</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between text-[13px]">
              <span className="text-white/70">Total XP</span>
              <span className="text-white font-bold">{totalXP} XP · Niv.{totalLevel}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full">
            <button
              onClick={loadQuiz}
              className="w-full py-3.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-semibold text-[13px] transition-colors"
            >
              🔄 Rejouer ce module
            </button>
            <button
              onClick={() => setScreen('map')}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl font-bold text-[14px] transition-colors shadow-lg"
            >
              Carte des modules →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
