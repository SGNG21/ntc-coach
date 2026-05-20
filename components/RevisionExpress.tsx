'use client';
import { useState } from 'react';
import { MODULES } from '@/lib/reac-data';
import type { ModuleId } from '@/types';

interface QcmQuestion {
  q: string;
  options: { A: string; B: string; C: string; D: string };
  answer: string;
  explanation: string;
}

type Phase = 'setup' | 'loading' | 'quiz' | 'done';

const MODULE_IDS = Object.keys(MODULES) as ModuleId[];

export function RevisionExpress() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedModule, setSelectedModule] = useState<ModuleId | 'random'>('random');
  const [questions, setQuestions] = useState<QcmQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [error, setError] = useState('');

  async function start() {
    setPhase('loading');
    setError('');
    const moduleId: ModuleId = selectedModule === 'random'
      ? MODULE_IDS[Math.floor(Math.random() * MODULE_IDS.length)]
      : selectedModule;
    try {
      const res = await fetch('/api/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, mode: 'qcm' }),
      });
      const data = await res.json();
      if (!data.exercise?.questions?.length) throw new Error('no questions');
      setQuestions(data.exercise.questions);
      setCurrent(0);
      setPicked(null);
      setCorrect(0);
      setResults([]);
      setPhase('quiz');
    } catch {
      setError('Erreur de génération. Vérifie ta connexion.');
      setPhase('setup');
    }
  }

  function pick(letter: string) {
    if (picked) return;
    setPicked(letter);
    const isCorrect = letter === questions[current].answer;
    if (isCorrect) setCorrect(c => c + 1);
    setResults(r => [...r, isCorrect]);
  }

  function next() {
    if (current + 1 >= questions.length) {
      setPhase('done');
    } else {
      setCurrent(c => c + 1);
      setPicked(null);
    }
  }

  function reset() {
    setPhase('setup');
    setQuestions([]);
    setCurrent(0);
    setPicked(null);
    setCorrect(0);
    setResults([]);
  }

  if (phase === 'setup' || phase === 'loading') {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-6 max-w-lg mx-auto">
        <div className="text-[14px] font-semibold text-navy-700 mb-1">⚡ Révision Express</div>
        <p className="text-[12px] text-stone-500 mb-4">4 questions CCF · réponse immédiate · sans prise de tête</p>
        <div className="mb-4">
          <label className="text-[11.5px] font-medium text-stone-600 mb-1.5 block">Module</label>
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value as ModuleId | 'random')}
            className="w-full text-[12px] px-2.5 py-2 border border-stone-200 rounded-lg bg-white"
          >
            <option value="random">🎲 Aléatoire</option>
            {MODULE_IDS.map(id => (
              <option key={id} value={id}>{MODULES[id].label}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-[11px] text-red-600 mb-3">{error}</p>}
        <button
          onClick={start}
          disabled={phase === 'loading'}
          className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-stone-200 text-white rounded-lg text-[13px] font-semibold transition-colors"
        >
          {phase === 'loading' ? '⏳ Génération…' : '▶ Lancer'}
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-6 max-w-lg mx-auto text-center">
        <div className="text-[36px] font-bold text-navy-700 mb-1">{pct}%</div>
        <div className="text-[13px] text-stone-500 mb-4">{correct}/{questions.length} bonnes réponses</div>
        <div className="flex gap-1.5 justify-center mb-5">
          {results.map((ok, i) => (
            <span key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
              {ok ? '✓' : '✗'}
            </span>
          ))}
        </div>
        <button onClick={reset} className="px-6 py-2 bg-navy-700 hover:bg-navy-800 text-white rounded-lg text-[12px] font-medium transition-colors">
          Rejouer
        </button>
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;

  return (
    <div className="flex flex-col gap-3 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-stone-500 font-medium">Question {current + 1}/{questions.length}</span>
        <button onClick={reset} className="text-[10px] text-stone-400 hover:text-stone-600">Quitter</button>
      </div>
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <p className="text-[13px] font-semibold text-stone-800 mb-4 leading-snug">{q.q}</p>
        <div className="flex flex-col gap-2">
          {(['A', 'B', 'C', 'D'] as const).map(letter => {
            const isCorrect = letter === q.answer;
            const isPicked = letter === picked;
            let cls = 'border-stone-200 bg-stone-50 hover:border-navy-500 hover:bg-navy-50';
            if (picked) {
              if (isCorrect) cls = 'border-emerald-500 bg-emerald-50';
              else if (isPicked) cls = 'border-red-400 bg-red-50';
              else cls = 'border-stone-200 bg-stone-50 opacity-50';
            }
            return (
              <button
                key={letter}
                onClick={() => pick(letter)}
                disabled={!!picked}
                className={`text-left px-3 py-2.5 rounded-lg border-[1.5px] transition-all text-[12px] ${cls}`}
              >
                <span className="font-semibold mr-2">{letter}.</span>{q.options[letter]}
              </button>
            );
          })}
        </div>
        {picked && (
          <div className={`mt-3 text-[11.5px] rounded-lg px-3 py-2 ${picked === q.answer ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {q.explanation}
          </div>
        )}
      </div>

      {picked && (
        <button
          onClick={next}
          className="py-2 bg-navy-700 hover:bg-navy-800 text-white rounded-lg text-[12px] font-semibold transition-colors"
        >
          {current + 1 >= questions.length ? 'Voir les résultats →' : 'Question suivante →'}
        </button>
      )}
    </div>
  );
}
