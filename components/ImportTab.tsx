'use client';
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { streamChat } from '@/lib/stream';
import type { CustomSeance, CustomFicheSection, CustomMindNode, CustomQuizItem } from '@/types';

const COLORS = ['#0f5298', '#6b2d7e', '#1c3d5a', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0891b2'];
const LS_KEY = 'ntc_myseances';

function loadSeances(): CustomSeance[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveSeances(s: CustomSeance[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

type ViewMode = 'fiche' | 'mind' | 'quiz';

export function ImportTab() {
  const [seances, setSeances] = useState<CustomSeance[]>([]);
  const [selected, setSelected] = useState<CustomSeance | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('fiche');
  const [quizState, setQuizState] = useState<{ pos: number; answered: boolean; answers: Record<number, number> }>({ pos: 0, answered: false, answers: {} });

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setSeances(loadSeances()); }, []);

  async function generate() {
    if (!name.trim()) { setError('Donne un nom au cours.'); return; }
    if (text.trim().length < 100) { setError('Colle un cours plus complet (min. 100 caractères).'); return; }
    setError('');
    setLoading(true);
    try {
      let fullText = '';
      await streamChat(
        {
          messages: [{ role: 'user', content: `Cours : "${name.trim()}"\n---\n${text.substring(0, 6000)}\n---\nGénère les révisions JSON.` }],
          mode: 'import',
        },
        (chunk) => { fullText += chunk; }
      );
      const clean = fullText.replace(/```json|```/g, '').trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON introuvable');
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.fiche || !parsed.mind || !parsed.quiz) throw new Error('Structure incomplète');

      const newSeance: CustomSeance = {
        id: Date.now().toString(),
        name: name.trim(),
        color,
        fiche: parsed.fiche,
        mind: parsed.mind,
        quiz: parsed.quiz,
        createdAt: new Date().toISOString(),
      };
      const updated = [...seances, newSeance];
      setSeances(updated);
      saveSeances(updated);
      setSelected(newSeance);
      setViewMode('fiche');
      setQuizState({ pos: 0, answered: false, answers: {} });
      setName('');
      setText('');
    } catch (e) {
      setError('Erreur de génération. Réessayez.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function deleteSeance(id: string) {
    const updated = seances.filter(s => s.id !== id);
    setSeances(updated);
    saveSeances(updated);
    if (selected?.id === id) setSelected(null);
  }

  if (selected) {
    return (
      <SeanceViewer
        seance={selected}
        viewMode={viewMode}
        setViewMode={setViewMode}
        quizState={quizState}
        setQuizState={setQuizState}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="text-[13px] font-semibold text-navy-700 mb-3">📥 Importer un cours</div>
        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nom du cours (ex : Contrats commerciaux)"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[12.5px] focus:border-navy-500 outline-none"
          />
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-500">Couleur :</span>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'scale-125' : 'border-transparent'}`}
                style={{ background: c, borderColor: color === c ? '#1c3d5a' : 'transparent' }}
              />
            ))}
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Colle ton cours ici (plan, définitions, exemples…)&#10;&#10;Plus c'est détaillé, meilleure sera la fiche générée."
            className="w-full min-h-[120px] px-3 py-2 border border-stone-200 rounded-lg text-[12px] resize-y focus:border-navy-500 outline-none"
          />
          {error && <p className="text-[11.5px] text-red-600">{error}</p>}
          <button
            onClick={generate}
            disabled={loading}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-stone-200 text-white rounded-lg text-[12.5px] font-semibold transition-colors"
          >
            {loading ? '⏳ Génération en cours…' : '✨ Générer fiche + carte + quiz'}
          </button>
        </div>
      </div>

      {seances.length > 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-3">
          <div className="text-[12px] font-semibold text-navy-700 mb-2">Mes cours ({seances.length})</div>
          <div className="flex flex-col gap-1.5">
            {seances.map(s => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border border-stone-100 hover:bg-stone-50">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <button
                  onClick={() => { setSelected(s); setViewMode('fiche'); setQuizState({ pos: 0, answered: false, answers: {} }); }}
                  className="flex-1 text-left text-[12.5px] font-medium text-navy-700 hover:underline"
                >
                  {s.name}
                </button>
                <span className="text-[10px] text-stone-400">{s.fiche.length} sections · {s.quiz.length} questions</span>
                <button
                  onClick={() => deleteSeance(s.id)}
                  className="w-6 h-6 flex items-center justify-center text-[16px] text-stone-300 hover:text-red-500 transition-colors leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center text-[12px] text-stone-400">
          Aucun cours importé pour l&apos;instant.<br />
          Colle n&apos;importe quel cours ci-dessus et l&apos;IA génère tout automatiquement.
        </div>
      )}
    </div>
  );
}

function SeanceViewer({ seance, viewMode, setViewMode, quizState, setQuizState, onBack }: {
  seance: CustomSeance;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  quizState: { pos: number; answered: boolean; answers: Record<number, number> };
  setQuizState: Dispatch<SetStateAction<{ pos: number; answered: boolean; answers: Record<number, number> }>>;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-xl border border-stone-200 p-3 flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="text-[12px] text-stone-400 hover:text-navy-700 transition-colors flex-shrink-0">← Retour</button>
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: seance.color }} />
        <span className="text-[13px] font-semibold text-navy-700 flex-1 min-w-0 truncate">{seance.name}</span>
        <div className="flex gap-1 flex-shrink-0">
          {(['fiche', 'mind', 'quiz'] as ViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className="px-3 py-1 rounded-lg text-[11px] font-medium transition-colors"
              style={viewMode === m ? { background: seance.color, color: '#fff' } : { background: '#f5f5f4', color: '#78716c' }}
            >
              {m === 'fiche' ? '📖 Fiche' : m === 'mind' ? '🧠 Carte' : '❓ Quiz'}
            </button>
          ))}
        </div>
      </div>
      {viewMode === 'fiche' && <FicheView seance={seance} />}
      {viewMode === 'mind' && <MindView seance={seance} />}
      {viewMode === 'quiz' && <QuizView seance={seance} quizState={quizState} setQuizState={setQuizState} />}
    </div>
  );
}

function FicheView({ seance }: { seance: CustomSeance }) {
  return (
    <div className="flex flex-col gap-2">
      {seance.fiche.map((f: CustomFicheSection, i: number) => (
        <div key={i} className="bg-white rounded-xl border border-stone-200 p-3">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2 pb-1.5 border-b border-stone-100">{f.title}</div>
          {f.def && (
            <div className="border-l-2 pl-3 py-1 mb-2 text-[12.5px] leading-relaxed text-stone-700" style={{ borderColor: seance.color }}>
              {f.def}
            </div>
          )}
          {f.body && (
            <div className="prose-chat text-[12.5px] leading-relaxed" dangerouslySetInnerHTML={{ __html: f.body }} />
          )}
        </div>
      ))}
    </div>
  );
}

function MindView({ seance }: { seance: CustomSeance }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  return (
    <div className="flex flex-col gap-2">
      {seance.mind.map((node: CustomMindNode, ni: number) => (
        <div key={ni} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <button
            onClick={() => setOpen(p => ({ ...p, [ni]: !p[ni] }))}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-[13px] font-semibold" style={{ color: seance.color }}>{node.title}</span>
            <span className="text-stone-400 text-[10px]" style={{ transition: 'transform .2s', transform: open[ni] ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
          </button>
          {open[ni] && (
            <div className="px-4 pb-3 flex flex-col gap-1.5">
              {node.children.map((c, ci) => (
                <div key={ci}>
                  <div className="bg-stone-50 rounded-lg px-3 py-2 text-[12.5px]" dangerouslySetInnerHTML={{ __html: c.t }} />
                  {c.subs.map((s, si) => (
                    <div key={si} className="ml-4 pl-3 border-l border-stone-200 py-0.5 text-[11.5px] text-stone-500 mt-0.5">{s}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function QuizView({ seance, quizState, setQuizState }: {
  seance: CustomSeance;
  quizState: { pos: number; answered: boolean; answers: Record<number, number> };
  setQuizState: Dispatch<SetStateAction<{ pos: number; answered: boolean; answers: Record<number, number> }>>;
}) {
  if (quizState.pos >= seance.quiz.length) {
    const correct = Object.entries(quizState.answers).filter(([i, a]) => a === seance.quiz[parseInt(i)].ok).length;
    const emoji = correct >= seance.quiz.length ? '🎉' : correct >= Math.ceil(seance.quiz.length / 2) ? '👍' : '💪';
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
        <div className="text-4xl mb-3">{emoji}</div>
        <div className="text-[22px] font-semibold font-mono mb-1" style={{ color: seance.color }}>{correct}/{seance.quiz.length}</div>
        <div className="text-[12px] text-stone-400 mb-5">bonnes réponses</div>
        <button
          onClick={() => setQuizState({ pos: 0, answered: false, answers: {} })}
          className="px-5 py-2.5 rounded-lg text-[12.5px] font-semibold text-white transition-opacity hover:opacity-80"
          style={{ background: seance.color }}
        >
          🔄 Recommencer
        </button>
      </div>
    );
  }

  const q: CustomQuizItem = seance.quiz[quizState.pos];
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className="text-[10px] text-stone-400 uppercase tracking-wider mb-2">Q{quizState.pos + 1} / {seance.quiz.length}</div>
      <p className="text-[13.5px] font-semibold mb-4 leading-snug">{q.q}</p>
      <div className="flex flex-col gap-2">
        {q.opts.map((opt, oi) => {
          const answered = quizState.answered;
          const chosen = quizState.answers[quizState.pos];
          const isChosen = chosen === oi;
          const isCorrect = oi === q.ok;
          return (
            <button
              key={oi}
              disabled={answered}
              onClick={() => setQuizState(p => ({ ...p, answered: true, answers: { ...p.answers, [p.pos]: oi } }))}
              className={`text-left px-3 py-2.5 rounded-lg border text-[12.5px] transition-all disabled:cursor-default ${
                answered
                  ? isCorrect ? 'bg-green-50 border-green-500 text-green-800'
                  : isChosen ? 'bg-red-50 border-red-500 text-red-800'
                  : 'border-stone-200 text-stone-400'
                  : 'border-stone-200 hover:bg-navy-50 hover:border-navy-500'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {quizState.answered && (
        <>
          <div className={`mt-3 p-2.5 rounded-lg text-[12px] leading-relaxed ${quizState.answers[quizState.pos] === q.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {q.fb}
          </div>
          <button
            onClick={() => setQuizState(p => ({ ...p, pos: p.pos + 1, answered: false }))}
            className="mt-3 w-full py-2.5 rounded-lg text-[12.5px] font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: seance.color }}
          >
            Question suivante →
          </button>
        </>
      )}
    </div>
  );
}
