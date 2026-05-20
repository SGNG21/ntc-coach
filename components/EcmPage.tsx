'use client';
import { useState, useEffect, useRef } from 'react';
import { ECM_MATIERES, ECM_LIST } from '@/lib/ecm-data';
import type { EcmId } from '@/lib/ecm-data';
import { streamChat } from '@/lib/stream';
import { ChatMessage, TypingIndicator } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { Message } from '@/types';

// ─── Types locaux ───────────────────────────────
interface FicheSection { title: string; def?: string | null; body?: string; }
interface QuizItem { q: string; opts: string[]; ok: number; fb: string; }
interface EcmContent { fiche: FicheSection[]; quiz: QuizItem[]; }
interface SavedEdition { id: string; name: string; date: string; content: EcmContent; }

type SubTab = 'programme' | 'fiche' | 'quiz' | 'cours' | 'alex';
const LS_KEY = 'ntc_ecm_content';
const LS_EDITIONS = 'ntc_ecm_editions';

// ─── Persistance localStorage ───────────────────
function loadAll(): Record<string, EcmContent> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function saveAll(data: Record<string, EcmContent>) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}
function loadEditions(): Record<string, SavedEdition[]> {
  try { return JSON.parse(localStorage.getItem(LS_EDITIONS) || '{}'); } catch { return {}; }
}
function persistEditions(data: Record<string, SavedEdition[]>) {
  localStorage.setItem(LS_EDITIONS, JSON.stringify(data));
}

// ─── Composant principal ────────────────────────
export function EcmPage() {
  const [activeId, setActiveId] = useState<EcmId>('rh');
  const [subTab, setSubTab] = useState<SubTab>('programme');
  const [allContent, setAllContent] = useState<Record<string, EcmContent>>({});
  const [loading, setLoading] = useState(false);
  const [courseText, setCourseText] = useState('');
  const [courseLoading, setCourseLoading] = useState(false);
  const [quizPos, setQuizPos] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [genError, setGenError] = useState('');
  const [savedEditions, setSavedEditions] = useState<Record<string, SavedEdition[]>>({});
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [showEditions, setShowEditions] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const matiere = ECM_MATIERES[activeId];
  const content = allContent[activeId];
  const color = matiere.color;
  const editions = savedEditions[activeId] || [];

  useEffect(() => { setAllContent(loadAll()); setSavedEditions(loadEditions()); }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  function switchMatiere(id: EcmId) {
    setActiveId(id);
    setSubTab('programme');
    setQuizPos(0);
    setQuizAnswers({});
    setQuizAnswered(false);
    setGenError('');
    setShowSaveInput(false);
    setShowEditions(false);
  }

  function saveEdition() {
    if (!content) return;
    const name = saveNameInput.trim() || `${matiere.label} — ${new Date().toLocaleDateString('fr-FR')}`;
    const edition: SavedEdition = {
      id: Date.now().toString(),
      name,
      date: new Date().toISOString(),
      content: { fiche: content.fiche, quiz: content.quiz },
    };
    const updated = { ...savedEditions, [activeId]: [edition, ...(savedEditions[activeId] || [])] };
    setSavedEditions(updated);
    persistEditions(updated);
    setShowSaveInput(false);
    setSaveNameInput('');
  }

  function loadEdition(edition: SavedEdition) {
    const updated = { ...allContent, [activeId]: edition.content };
    setAllContent(updated);
    saveAll(updated);
    setQuizPos(0);
    setQuizAnswers({});
    setQuizAnswered(false);
    setShowEditions(false);
    setSubTab('fiche');
  }

  function deleteEdition(id: string) {
    const updated = { ...savedEditions, [activeId]: (savedEditions[activeId] || []).filter(e => e.id !== id) };
    setSavedEditions(updated);
    persistEditions(updated);
  }

  function exportPDF(src: EcmContent, label: string, emoji: string) {
    const win = window.open('', '_blank');
    if (!win) return;
    const ficheHtml = (src.fiche || []).map(f => `
      <div class="section">
        <div class="section-title">${f.title}</div>
        ${f.def && f.def !== 'null' ? `<div class="def">${f.def}</div>` : ''}
        ${f.body ? `<div class="body">${f.body}</div>` : ''}
      </div>`).join('');
    const quizHtml = (src.quiz || []).map((q, i) => `
      <div class="question">
        <div class="q-num">Q${i + 1}. ${q.q}</div>
        <div class="opts">${q.opts.map((opt, oi) => `
          <div class="opt${oi === q.ok ? ' correct' : ''}">${String.fromCharCode(65 + oi)}. ${opt}${oi === q.ok ? ' ✓' : ''}</div>`).join('')}
        </div>
        <div class="feedback">${q.fb}</div>
      </div>`).join('');
    const col = color;
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    win.document.write(`<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8"><title>Fiche ECM — ${label}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:24px 20px;color:#222;font-size:13px}
  h1{color:${col};font-size:20px;border-bottom:3px solid ${col};padding-bottom:8px;margin-bottom:4px}
  .meta{font-size:10px;color:#999;margin-bottom:20px}
  .section{margin-bottom:16px;page-break-inside:avoid}
  .section-title{font-size:13px;font-weight:bold;background:${col};color:white;padding:7px 12px;border-radius:6px;margin-bottom:6px}
  .def{border-left:3px solid ${col};padding:6px 10px;color:#555;font-style:italic;margin:4px 0 8px;font-size:12px}
  .body ul{margin:4px 0;padding-left:18px}.body li{margin-bottom:3px;font-size:12px;line-height:1.5}
  .body strong{color:#222}
  .quiz-title{color:${col};font-size:16px;font-weight:bold;margin-top:28px;padding-top:12px;border-top:2px solid ${col};margin-bottom:12px}
  .question{margin-bottom:14px;padding:10px 12px;border:1px solid #e5e7eb;border-radius:6px;page-break-inside:avoid}
  .q-num{font-weight:bold;margin-bottom:6px}
  .opt{font-size:12px;padding:2px 0;color:#555}
  .opt.correct{color:#059669;font-weight:bold}
  .feedback{margin-top:6px;font-size:11px;color:#555;background:#f0fdf4;padding:5px 8px;border-radius:4px}
  @media print{body{padding:12px}}
</style></head><body>
<h1>${emoji} ${label} — Fiche de révision ECM</h1>
<div class="meta">NTC Coach · REAC 2024 · RNCP 39063 · Généré le ${dateStr}</div>
<div id="fiche">${ficheHtml}</div>
<div class="quiz-title">❓ Quiz — ${src.quiz?.length || 0} questions</div>
<div id="quiz">${quizHtml}</div>
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  }

  async function generate(action: 'generate_content' | 'import_course' | 'quiz_only', text?: string) {
    const isQuizOnly = action === 'quiz_only';
    setGenError('');
    action === 'import_course' ? setCourseLoading(true) : setLoading(true);

    try {
      const res = await fetch('/api/ecm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ecmId: activeId, action, courseText: text }),
      });

      if (!res.ok || !res.body) throw new Error(`Erreur serveur (${res.status})`);

      // Accumule le stream puis parse le JSON
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      const clean = fullText.replace(/```json|```/g, '').trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Réponse IA invalide — réessaie');
      const parsed = JSON.parse(jsonMatch[0]);

      const updated = { ...allContent };
      if (isQuizOnly && updated[activeId]) {
        updated[activeId] = {
          ...updated[activeId],
          quiz: [...(updated[activeId].quiz || []), ...(parsed.quiz || [])],
        };
      } else {
        updated[activeId] = {
          fiche: parsed.fiche || [],
          quiz: parsed.quiz || [],
        };
      }
      setAllContent(updated);
      saveAll(updated);
      setQuizPos(0);
      setQuizAnswers({});
      setQuizAnswered(false);
      if (action !== 'quiz_only') setSubTab('fiche');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      setGenError(msg);
      console.error('ECM generate error:', e);
    } finally {
      setLoading(false);
      setCourseLoading(false);
    }
  }

  async function sendChat(text: string) {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    const newMsgs = [...chatMessages, userMsg];
    const aiId = (Date.now() + 1).toString();
    setChatMessages([...newMsgs, { id: aiId, role: 'assistant', content: '', timestamp: new Date() }]);
    setChatLoading(true);
    const prog = matiere.programme.map(p => `${p.title}: ${p.points.join(', ')}`).join('\n');
    const extraContext = `Matière ECM : ${matiere.label}\nProgramme :\n${prog}${courseText ? `\n\nCours importé par l'étudiante :\n${courseText.substring(0, 2000)}` : ''}`;
    let fullText = '';
    try {
      await streamChat(
        {
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          moduleId: 'transversal',
          mode: 'expliquer',
          extraContext,
        },
        (chunk) => {
          fullText += chunk;
          setChatMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullText } : m));
        }
      );
    } catch {
      setChatMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: '❌ Erreur de connexion.' } : m));
    } finally {
      setChatLoading(false);
    }
  }

  const SUB_TABS: { id: SubTab; label: string }[] = [
    { id: 'programme', label: '📋 Programme' },
    { id: 'fiche', label: '📖 Fiche' },
    { id: 'quiz', label: `❓ Quiz${content?.quiz?.length ? ` (${content.quiz.length})` : ''}` },
    { id: 'cours', label: '📥 Mon cours' },
    { id: 'alex', label: '🤖 Alex' },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar matières ── */}
      <aside className="w-44 flex-shrink-0 bg-white border-r border-stone-200 overflow-y-auto py-2 px-1.5">
        <div className="text-[9px] font-bold uppercase tracking-wider text-stone-400 px-1.5 py-1 mb-1">
          Matières ECM
        </div>
        {ECM_LIST.map(m => (
          <button
            key={m.id}
            onClick={() => switchMatiere(m.id)}
            className={`w-full text-left px-2 py-2 rounded-lg mb-0.5 flex items-center gap-2 transition-all text-[11.5px] font-medium ${
              activeId === m.id ? 'text-white shadow-sm' : 'text-stone-600 hover:bg-stone-50'
            }`}
            style={activeId === m.id ? { background: m.color } : {}}
          >
            <span className="text-base flex-shrink-0">{m.emoji}</span>
            <span className="leading-tight">{m.label}</span>
          </button>
        ))}
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header matière */}
        <div className="flex-shrink-0 px-4 py-3 text-white flex items-center gap-3" style={{ background: color }}>
          <span className="text-2xl">{matiere.emoji}</span>
          <div>
            <div className="text-[14px] font-bold leading-tight">{matiere.label}</div>
            <div className="text-[11px] opacity-75 mt-0.5">{matiere.description.substring(0, 80)}…</div>
          </div>
          {content && (
            <div className="ml-auto flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1 text-[10px] font-medium">
              ✅ {content.fiche?.length ?? 0} sections · {content.quiz?.length ?? 0} questions
            </div>
          )}
        </div>

        {/* Erreur génération */}
        {genError && (
          <div className="flex-shrink-0 mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700 flex items-center justify-between gap-2">
            <span>❌ {genError}</span>
            <button onClick={() => setGenError('')} className="text-red-400 hover:text-red-700 text-lg leading-none">×</button>
          </div>
        )}

        {/* Sous-navigation */}
        <nav className="flex-shrink-0 bg-white border-b border-stone-200 flex overflow-x-auto">
          {SUB_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`px-3 py-2.5 text-[11.5px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                subTab === t.id ? 'border-b-2 text-white' : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
              style={subTab === t.id ? { borderBottomColor: color, color } : {}}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* ── PROGRAMME ── */}
          {subTab === 'programme' && (
            <div className="flex flex-col gap-4 max-w-3xl">
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: color + '40' }}>
                <div className="px-4 py-2.5 text-white text-[12px] font-semibold" style={{ background: color }}>
                  🎯 Objectifs pédagogiques
                </div>
                <div className="p-4 bg-white">
                  <ul className="space-y-1.5">
                    {matiere.objectifs.map((o, i) => (
                      <li key={i} className="flex gap-2 text-[12.5px] text-stone-700">
                        <span className="font-bold flex-shrink-0" style={{ color }}>{i + 1}.</span>
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {matiere.programme.map((section, si) => (
                <div key={si} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <div className="px-4 py-2 text-[12px] font-semibold text-white" style={{ background: color + 'cc' }}>
                    {section.title}
                  </div>
                  <ul className="p-4 space-y-1.5">
                    {section.points.map((p, pi) => (
                      <li key={pi} className="flex gap-2 text-[12.5px] text-stone-700">
                        <span className="text-stone-300 flex-shrink-0 mt-0.5">→</span>
                        <span dangerouslySetInnerHTML={{ __html: p }} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="bg-white rounded-xl border border-stone-200 p-3">
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">Mots-clés à maîtriser</div>
                <div className="flex flex-wrap gap-1.5">
                  {matiere.motsCles.map(m => (
                    <span key={m} className="text-[11px] px-2.5 py-1 rounded-full text-white font-medium" style={{ background: color + 'cc' }}>{m}</span>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 p-3">
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">Liens avec les compétences NTC</div>
                <div className="flex flex-wrap gap-1.5">
                  {matiere.liensNTC.map(l => (
                    <span key={l} className="text-[11px] px-2.5 py-1 rounded-full bg-navy-50 text-navy-700 border border-navy-500/20">{l}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => generate('generate_content')}
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{ background: color }}
              >
                {loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg>}
                {loading ? 'Génération en cours…' : '✨ Générer fiche + quiz IA'}
              </button>
            </div>
          )}

          {/* ── FICHE ── */}
          {subTab === 'fiche' && (
            <div className="flex flex-col gap-3 max-w-3xl">
              {!content?.fiche?.length ? (
                <EmptyState color={color} onGenerate={() => generate('generate_content')} loading={loading} label="fiche de révision" />
              ) : (
                <>
                  {/* Barre d'actions */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      onClick={() => { setShowSaveInput(v => !v); setShowEditions(false); setSaveNameInput(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all"
                      style={{ borderColor: color + '60', color }}
                    >
                      💾 Sauvegarder
                    </button>
                    <button
                      onClick={() => exportPDF(content, matiere.label, matiere.emoji)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all"
                      style={{ borderColor: color + '60', color }}
                    >
                      📄 Exporter PDF
                    </button>
                    <button
                      onClick={() => { setShowEditions(v => !v); setShowSaveInput(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all"
                      style={editions.length > 0 ? { borderColor: color, color, background: color + '12' } : { borderColor: '#d1d5db', color: '#6b7280' }}
                    >
                      📚 Mes éditions{editions.length > 0 ? ` (${editions.length})` : ''}
                    </button>
                    <button
                      onClick={() => generate('generate_content')}
                      disabled={loading}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white transition-opacity disabled:opacity-60"
                      style={{ background: color + 'aa' }}
                    >
                      {loading && <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg>}
                      🔄 Régénérer
                    </button>
                  </div>

                  {/* Formulaire de sauvegarde */}
                  {showSaveInput && (
                    <div className="bg-white rounded-xl border p-3 flex gap-2 items-center" style={{ borderColor: color + '40' }}>
                      <input
                        autoFocus
                        value={saveNameInput}
                        onChange={e => setSaveNameInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdition()}
                        placeholder={`Nom de l'édition (ex: Version cours importé)`}
                        className="flex-1 text-[12px] px-2.5 py-1.5 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                      />
                      <button
                        onClick={saveEdition}
                        className="px-3 py-1.5 rounded-lg text-white text-[12px] font-medium flex-shrink-0"
                        style={{ background: color }}
                      >
                        Sauvegarder
                      </button>
                      <button onClick={() => setShowSaveInput(false)} className="text-stone-400 hover:text-stone-600 text-lg leading-none">×</button>
                    </div>
                  )}

                  {/* Panneau des éditions sauvegardées */}
                  {showEditions && (
                    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                      <div className="px-3 py-2.5 bg-stone-50 border-b border-stone-200 text-[12px] font-semibold text-stone-600">
                        📚 Éditions sauvegardées — {matiere.label}
                      </div>
                      {editions.length === 0 ? (
                        <div className="px-3 py-4 text-[12px] text-stone-400 text-center">
                          Aucune édition sauvegardée pour cette matière.
                        </div>
                      ) : (
                        <div className="divide-y divide-stone-100">
                          {editions.map(ed => (
                            <div key={ed.id} className="flex items-center gap-2 px-3 py-2.5">
                              <div className="flex-1 min-w-0">
                                <div className="text-[12.5px] font-medium text-stone-800 truncate">{ed.name}</div>
                                <div className="text-[10.5px] text-stone-400">
                                  {new Date(ed.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })} · {ed.content.fiche?.length ?? 0} sections · {ed.content.quiz?.length ?? 0} questions
                                </div>
                              </div>
                              <button
                                onClick={() => loadEdition(ed)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-white flex-shrink-0"
                                style={{ background: color }}
                                title="Charger cette édition"
                              >
                                Charger
                              </button>
                              <button
                                onClick={() => exportPDF(ed.content, matiere.label, matiere.emoji)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-medium border flex-shrink-0"
                                style={{ borderColor: color + '60', color }}
                                title="Exporter en PDF"
                              >
                                PDF
                              </button>
                              <button
                                onClick={() => deleteEdition(ed.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 text-base"
                                title="Supprimer"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sections de la fiche */}
                  {content.fiche.map((f, i) => (
                    <div key={i} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                      <div className="px-3 py-2 text-white text-[11.5px] font-bold" style={{ background: color + 'dd' }}>
                        {f.title}
                      </div>
                      <div className="p-3">
                        {f.def && f.def !== 'null' && (
                          <div className="border-l-2 pl-3 py-1 mb-2 text-[12.5px] leading-relaxed text-stone-700 italic" style={{ borderColor: color }}>
                            {f.def}
                          </div>
                        )}
                        {f.body && (
                          <div
                            className="text-[12.5px] leading-relaxed text-stone-800"
                            style={{ '--ex-box-bg': color + '15', '--ex-box-border': color } as React.CSSProperties}
                            dangerouslySetInnerHTML={{ __html: f.body }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── QUIZ ── */}
          {subTab === 'quiz' && (
            <div className="max-w-xl">
              {!content?.quiz?.length ? (
                <EmptyState color={color} onGenerate={() => generate('generate_content')} loading={loading} label="quiz" />
              ) : quizPos >= content.quiz.length ? (
                <QuizEnd
                  answers={quizAnswers}
                  quiz={content.quiz}
                  color={color}
                  onRestart={() => { setQuizPos(0); setQuizAnswers({}); setQuizAnswered(false); }}
                  onMore={() => generate('quiz_only')}
                  loading={loading}
                />
              ) : (
                <QuizQuestion
                  q={content.quiz[quizPos]}
                  pos={quizPos}
                  total={content.quiz.length}
                  answered={quizAnswered}
                  chosenIdx={quizAnswers[quizPos]}
                  color={color}
                  onAnswer={(idx) => {
                    setQuizAnswers(prev => ({ ...prev, [quizPos]: idx }));
                    setQuizAnswered(true);
                  }}
                  onNext={() => { setQuizPos(p => p + 1); setQuizAnswered(false); }}
                />
              )}
            </div>
          )}

          {/* ── MON COURS ── */}
          {subTab === 'cours' && (
            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="text-[13px] font-semibold mb-1" style={{ color }}>📥 Importer mon cours</div>
                <p className="text-[11.5px] text-stone-400 mb-3">
                  Colle ici ton cours, tes notes, ou un résumé sur <strong>{matiere.label}</strong>. L&apos;IA va générer une fiche et un quiz personnalisés basés sur ton contenu.
                </p>
                <textarea
                  value={courseText}
                  onChange={e => setCourseText(e.target.value)}
                  rows={10}
                  placeholder={`Colle ton cours sur ${matiere.label} ici…\n\nExemples : plan de cours, définitions, exemples, notes de cours…`}
                  className="w-full p-3 border border-stone-200 rounded-xl text-[12.5px] resize-y focus:outline-none"
                  style={{ borderColor: courseText ? color + '80' : undefined }}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => generate('import_course', courseText)}
                    disabled={courseText.trim().length < 50 || courseLoading}
                    className="flex-1 py-2.5 rounded-xl text-white font-semibold text-[12.5px] flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                    style={{ background: color }}
                  >
                    {courseLoading && <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg>}
                    {courseLoading ? 'Génération…' : '✨ Générer depuis mon cours'}
                  </button>
                  {courseText && (
                    <button
                      onClick={() => setCourseText('')}
                      className="px-3 py-2.5 rounded-xl border border-stone-200 text-stone-400 hover:text-red-500 text-[12px] transition-colors"
                      title="Effacer le cours"
                    >
                      🗑
                    </button>
                  )}
                </div>
                {courseText.trim().length > 0 && courseText.trim().length < 50 && (
                  <p className="text-[11px] text-amber-600 mt-1.5">Minimum 50 caractères pour générer.</p>
                )}
              </div>

              {content?.fiche?.length ? (
                <div className="bg-white rounded-xl border border-stone-200 p-3 text-[12px] text-stone-600">
                  ✅ Fiche et quiz générés ({content.fiche.length} sections, {content.quiz.length} questions).{' '}
                  <button onClick={() => setSubTab('fiche')} className="underline font-medium" style={{ color }}>Voir la fiche →</button>
                </div>
              ) : null}
            </div>
          )}

          {/* ── ALEX ── */}
          {subTab === 'alex' && (
            <div className="flex flex-col gap-3 h-full" style={{ minHeight: '400px' }}>
              <div className="bg-white rounded-xl border border-stone-200 p-3 flex-shrink-0">
                <div className="text-[12px] font-semibold mb-2" style={{ color }}>
                  🤖 Alex — Expert {matiere.label}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matiere.motsCles.slice(0, 8).map(k => (
                    <button
                      key={k}
                      onClick={() => sendChat(`Explique-moi ${k} en lien avec ${matiere.label}`)}
                      className="text-[11px] px-2.5 py-1 rounded-full text-white font-medium transition-opacity hover:opacity-80"
                      style={{ background: color + 'cc' }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 bg-stone-50">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-stone-400 text-[12px] py-8">
                      👆 Clique sur un mot-clé ou pose ta question sur <strong>{matiere.label}</strong>
                    </div>
                  )}
                  {chatMessages.map(m => <ChatMessage key={m.id} message={m} />)}
                  {chatLoading && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && <TypingIndicator />}
                  <div ref={chatBottomRef} />
                </div>
                <ChatInput
                  onSend={sendChat}
                  disabled={chatLoading}
                  placeholder={`Pose ta question sur ${matiere.label}…`}
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Sous-composants ────────────────────────────

function EmptyState({ color, onGenerate, loading, label }: { color: string; onGenerate: () => void; loading: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="text-5xl opacity-30">📭</div>
      <div className="text-[13px] text-stone-400 text-center">
        Aucune {label} générée pour l&apos;instant.<br />
        <span className="text-[12px]">Clique sur le bouton pour que l&apos;IA génère ton contenu !</span>
      </div>
      <button
        onClick={onGenerate}
        disabled={loading}
        className="px-5 py-2.5 rounded-xl text-white font-semibold text-[12.5px] flex items-center gap-2 transition-opacity disabled:opacity-60"
        style={{ background: color }}
      >
        {loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg>}
        {loading ? 'Génération en cours…' : '✨ Générer maintenant'}
      </button>
    </div>
  );
}

function QuizQuestion({ q, pos, total, answered, chosenIdx, color, onAnswer, onNext }: {
  q: QuizItem; pos: number; total: number; answered: boolean; chosenIdx?: number;
  color: string; onAnswer: (idx: number) => void; onNext: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-4 py-2.5 text-white text-[12px] font-semibold flex items-center justify-between" style={{ background: color }}>
        <span>Question {pos + 1} / {total}</span>
        <span className="opacity-75">
          {Math.round(((pos) / total) * 100)}% complété
        </span>
      </div>
      <div className="p-4">
        <p className="text-[14px] font-semibold mb-4 leading-snug text-stone-800">{q.q}</p>
        <div className="flex flex-col gap-2">
          {q.opts.map((opt, oi) => {
            const isChosen = chosenIdx === oi;
            const isCorrect = oi === q.ok;
            return (
              <button
                key={oi}
                disabled={answered}
                onClick={() => onAnswer(oi)}
                className={`text-left px-3.5 py-2.5 rounded-xl border text-[12.5px] transition-all disabled:cursor-default ${
                  answered
                    ? isCorrect
                      ? 'bg-green-50 border-green-500 text-green-800 font-medium'
                      : isChosen
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : 'border-stone-200 text-stone-400'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-opacity-80 hover:bg-opacity-10'
                }`}
                style={answered && isCorrect ? {} : (!answered ? { borderColor: color + '40' } : {})}
              >
                <strong className="mr-2 opacity-50">{String.fromCharCode(65 + oi)}.</strong>{opt}
              </button>
            );
          })}
        </div>
        {answered && (
          <>
            <div className={`mt-3 p-3 rounded-xl text-[12.5px] leading-relaxed ${chosenIdx === q.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {q.fb}
            </div>
            <button
              onClick={onNext}
              className="mt-3 w-full py-2.5 rounded-xl text-white font-semibold text-[12.5px] transition-opacity hover:opacity-80"
              style={{ background: color }}
            >
              {pos + 1 >= total ? '🏁 Voir mon score' : 'Question suivante →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function QuizEnd({ answers, quiz, color, onRestart, onMore, loading }: {
  answers: Record<number, number>; quiz: QuizItem[]; color: string;
  onRestart: () => void; onMore: () => void; loading: boolean;
}) {
  const correct = Object.entries(answers).filter(([i, a]) => a === quiz[parseInt(i)].ok).length;
  const pct = Math.round((correct / quiz.length) * 100);
  const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '🎉' : '💪';

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
      <div className="text-5xl mb-3">{emoji}</div>
      <div className="text-[28px] font-bold font-mono mb-1" style={{ color }}>{correct}/{quiz.length}</div>
      <div className="text-[13px] text-stone-500 mb-1">{pct}% de bonnes réponses</div>
      <div className="text-[12px] text-stone-400 mb-6">
        {pct >= 80 ? 'Excellent ! Tu maîtrises bien cette matière.' : pct >= 60 ? 'Bon travail ! Encore un peu de révision.' : 'Continue les révisions, tu vas y arriver !'}
      </div>
      <div className="flex gap-2 flex-col sm:flex-row">
        <button
          onClick={onRestart}
          className="flex-1 py-2.5 rounded-xl border-2 font-semibold text-[12.5px] transition-all hover:text-white"
          style={{ borderColor: color, color }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = color; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = color; }}
        >
          🔄 Recommencer
        </button>
        <button
          onClick={onMore}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-white font-semibold text-[12.5px] flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
          style={{ background: color }}
        >
          {loading && <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg>}
          {loading ? 'Chargement…' : '➕ Plus de questions'}
        </button>
      </div>
    </div>
  );
}
