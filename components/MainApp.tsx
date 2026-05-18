'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { MODULES } from '@/lib/reac-data';
import { ChatMessage, TypingIndicator } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ImportTab } from './ImportTab';
import type { Message, ModuleId, ChatMode, ExoMode, CCFMode, Score, ModuleConfig } from '@/types';

// ─── Tabs ───────────────────────────────────────
const TABS = [
  { id: 'programme', label: '📋 Programme' },
  { id: 'revision', label: '📚 Révision IA' },
  { id: 'exercices', label: '✏️ Exercices CCF' },
  { id: 'fiches', label: '🗂️ Fiches' },
  { id: 'ccf', label: '🎯 Préparer CCF' },
  { id: 'import', label: '📥 Mes cours' },
];

// ─── Modules sidebar ───────────────────────────
const SIDEBAR: { section: string; items: { id: ModuleId; emoji: string; label: string; sub: string; type: 'c1' | 'c2' | 'tr' }[] }[] = [
  {
    section: 'CCP 1 — Prospection',
    items: [
      { id: 'veille', emoji: '🔍', label: 'CP1 — Veille commerciale', sub: 'Marché, IA, PESTEL', type: 'c1' },
      { id: 'pac', emoji: '📅', label: 'CP2 — Plan d\'actions comm.', sub: 'PAC, KPIs, personas', type: 'c1' },
      { id: 'prospection', emoji: '📞', label: 'CP3 — Prospecter un secteur', sub: 'CROC, inbound, RGPD', type: 'c1' },
      { id: 'perf', emoji: '📊', label: 'CP4 — Analyser performances', sub: 'KPIs, écarts, corrections', type: 'c1' },
    ],
  },
  {
    section: 'CCP 2 — Négociation',
    items: [
      { id: 'image', emoji: '🏢', label: 'CP5 — Image entreprise', sub: 'Branding, e-réputation', type: 'c2' },
      { id: 'proposition', emoji: '📄', label: 'CP6 — Proposition tech-com', sub: 'CAP, SONCAS, RSE', type: 'c2' },
      { id: 'nego', emoji: '🤝', label: 'CP7 — Négocier la solution', sub: 'CRAC, closing, entretien', type: 'c2' },
      { id: 'bilan', emoji: '📈', label: 'CP8 — Bilan & rendre compte', sub: 'Reporting, CRM, tendances', type: 'c2' },
      { id: 'relation', emoji: '❤️', label: 'CP9 — Gestion relation client', sub: 'CRM, NPS, fidélisation', type: 'c2' },
    ],
  },
  {
    section: 'Transversal',
    items: [
      { id: 'transversal', emoji: '⚡', label: 'Compétences transversales', sub: 'Communiquer, négocier', type: 'tr' },
      { id: 'digital', emoji: '💻', label: 'Outils digitaux & IA', sub: 'CRM, social selling', type: 'tr' },
      { id: 'rse', emoji: '🌱', label: 'RSE & transition écologique', sub: 'AGEC, ESS, empreinte', type: 'tr' },
      { id: 'juridique', emoji: '⚖️', label: 'Cadre juridique', sub: 'RGPD, CGV, Naegelen', type: 'tr' },
    ],
  },
];

const TYPE_STYLES = {
  c1: { active: 'bg-ccp1-50 text-ccp1-900 border-ccp1-600/25', dot: 'bg-ccp1-600' },
  c2: { active: 'bg-ccp2-50 text-ccp2-900 border-ccp2-600/25', dot: 'bg-ccp2-600' },
  tr: { active: 'bg-navy-50 text-navy-700 border-navy-500/20', dot: 'bg-navy-500' },
};

export function MainApp() {
  const [tab, setTab] = useState('programme');
  const [moduleId, setModuleId] = useState<ModuleId>('veille');
  const [moduleType, setModuleType] = useState<'c1' | 'c2' | 'tr'>('c1');
  const [chatMode, setChatMode] = useState<ChatMode>('expliquer');
  const [exoMode, setExoMode] = useState<ExoMode>('qcm');
  const [ccfMode, setCcfMode] = useState<CCFMode>('prosp_tel');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [ccfMessages, setCcfMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [ccfLoading, setCcfLoading] = useState(false);
  const [exoData, setExoData] = useState<Record<string, unknown> | null>(null);
  const [exoLoading, setExoLoading] = useState(false);
  const [exoCount, setExoCount] = useState(0);
  const [corrMessages, setCorrMessages] = useState<Message[]>([]);
  const [corrLoading, setCorrLoading] = useState(false);
  const [ficheContent, setFicheContent] = useState('');
  const [ficheLoading, setFicheLoading] = useState(false);
  const [ficheModule, setFicheModule] = useState<ModuleId>('veille');
  const [score, setScore] = useState<Score>({ correct: 0, total: 0, byModule: {} });
  const [sessionId, setSessionId] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const ccfBottomRef = useRef<HTMLDivElement>(null);
  const corrBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    ccfBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ccfMessages, ccfLoading]);

  useEffect(() => {
    corrBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [corrMessages, corrLoading]);

  // Sauvegarder session en Supabase
  const saveSession = useCallback(async (msgs: Message[], sc: Score) => {
    try {
      const res = await fetch('/api/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messages: msgs, score: sc, moduleId }),
      });
      const data = await res.json();
      if (data.sessionId && !sessionId) setSessionId(data.sessionId);
    } catch { /* fail silently */ }
  }, [sessionId, moduleId]);

  async function sendChat(text: string) {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    const newMsgs = [...chatMessages, userMsg];
    setChatMessages(newMsgs);
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          moduleId, mode: chatMode,
        }),
      });
      const data = await res.json();
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.text || '...', timestamp: new Date() };
      const finalMsgs = [...newMsgs, aiMsg];
      setChatMessages(finalMsgs);
      await saveSession(finalMsgs, score);
    } catch {
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: '❌ Erreur de connexion.', timestamp: new Date() }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function sendCCF(text: string) {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    const newMsgs = [...ccfMessages, userMsg];
    setCcfMessages(newMsgs);
    setCcfLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          ccfSimMode: ccfMode,
        }),
      });
      const data = await res.json();
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.text || '...', timestamp: new Date() };
      setCcfMessages([...newMsgs, aiMsg]);
    } catch {
      setCcfMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: '❌ Erreur de connexion.', timestamp: new Date() }]);
    } finally {
      setCcfLoading(false);
    }
  }

  async function sendCorr(text: string) {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    const newMsgs = [...corrMessages, userMsg];
    setCorrMessages(newMsgs);
    setCorrLoading(true);

    const mod = MODULES[moduleId];
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          moduleId,
          mode: 'expliquer',
        }),
      });
      const data = await res.json();
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.text || '...', timestamp: new Date() };
      setCorrMessages([...newMsgs, aiMsg]);
    } catch {
      setCorrMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: '❌ Erreur.', timestamp: new Date() }]);
    } finally {
      setCorrLoading(false);
    }
  }

  async function generateExo() {
    setExoLoading(true);
    setExoData(null);
    setCorrMessages([]);
    try {
      const res = await fetch('/api/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, mode: exoMode }),
      });
      const data = await res.json();
      setExoData(data.exercise);
      setExoCount(n => n + 1);
    } catch {
      setExoData({ error: 'Erreur de génération. Réessayez.' });
    } finally {
      setExoLoading(false);
    }
  }

  async function generateFiche() {
    setFicheLoading(true);
    setFicheContent('');
    const mod = MODULES[ficheModule];
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Génère une fiche de révision COMPLÈTE pour le Titre Pro NTC (REAC 2024) sur : "${mod.label}".
Structure :
1. Définition officielle REAC
2. Critères d'évaluation officiels (liste exacte)
3. Savoirs associés clés
4. Méthodes et outils pratiques terrain
5. Erreurs fréquentes en CCF à éviter
6. Exemple concret BtoB
7. Mots-clés vocabulaire REAC à maîtriser
Format markdown avec **gras** pour les termes clés. Niveau 1ère année NTC.`,
          }],
          moduleId: ficheModule,
          mode: 'expliquer',
        }),
      });
      const data = await res.json();
      setFicheContent(data.text || '');
    } catch {
      setFicheContent('❌ Erreur de génération.');
    } finally {
      setFicheLoading(false);
    }
  }

  function addScore(correct: boolean) {
    setScore(prev => {
      const newScore = {
        ...prev,
        correct: prev.correct + (correct ? 1 : 0),
        total: prev.total + 1,
        byModule: {
          ...prev.byModule,
          [moduleId]: {
            correct: (prev.byModule[moduleId]?.correct || 0) + (correct ? 1 : 0),
            total: (prev.byModule[moduleId]?.total || 0) + 1,
          },
        },
      };
      return newScore;
    });
  }

  const mod = MODULES[moduleId];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-navy-700 text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0 shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="text-[9px] font-bold bg-red-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Titre Pro</span>
          <h1 className="text-[14px] font-semibold">NTC Coach — 1ère année</h1>
          <span className="text-[9px] bg-white/15 px-1.5 py-0.5 rounded">REAC 2024 · RNCP 39063</span>
        </div>
        <div className="text-[11px] bg-white/12 px-2.5 py-1 rounded-full font-mono">
          Score : {score.correct}/{score.total}
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="bg-white border-b border-stone-200 flex px-4 overflow-x-auto flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-[12.5px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? 'text-navy-700 border-red-600'
                : 'text-stone-400 border-transparent hover:text-navy-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 bg-white border-r border-stone-200 overflow-y-auto p-2">
          {SIDEBAR.map(section => (
            <div key={section.section} className="mb-3">
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wider text-stone-400 px-1 py-1 mb-1">
                <span>{section.section}</span>
                <div className="flex-1 h-px bg-stone-200" />
              </div>
              {section.items.map(item => {
                const isActive = moduleId === item.id;
                const styles = TYPE_STYLES[item.type];
                return (
                  <button
                    key={item.id}
                    onClick={() => { setModuleId(item.id); setModuleType(item.type); }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg border text-[11.5px] flex items-start gap-2 transition-all mb-0.5 ${
                      isActive
                        ? `${styles.active} border font-medium`
                        : 'border-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <span className="text-sm flex-shrink-0 mt-0.5">{item.emoji}</span>
                    <div>
                      <div className="leading-tight">{item.label}</div>
                      <div className={`text-[10px] mt-0.5 ${isActive ? 'opacity-60' : 'text-stone-400'}`}>{item.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4">

          {/* ── PROGRAMME ── */}
          {tab === 'programme' && (
            <ProgrammeTab mod={mod} moduleId={moduleId} moduleType={moduleType} />
          )}

          {/* ── RÉVISION ── */}
          {tab === 'revision' && (
            <div className="flex flex-col gap-3 h-full">
              {/* Mode selector */}
              <div className="bg-white rounded-xl border border-stone-200 p-3 flex-shrink-0">
                <div className="text-[13px] font-semibold text-navy-700 mb-2">🎯 Mode de révision — {mod.label}</div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {(['expliquer', 'quiz', 'scenario', 'criteres'] as ChatMode[]).map(m => (
                    <ModeCard
                      key={m}
                      active={chatMode === m}
                      onClick={() => setChatMode(m)}
                      modes={{ expliquer: { icon: '📖', label: 'Cours complet', desc: 'Explication REAC' }, quiz: { icon: '❓', label: 'Quiz', desc: 'Questions sans réponses' }, scenario: { icon: '🎭', label: 'Mise en situation', desc: 'Cas BtoB réaliste' }, criteres: { icon: '🎯', label: 'Critères CCF', desc: 'Ce que le jury évalue' } }}
                      id={m}
                    />
                  ))}
                </div>
                {/* Quick prompts */}
                <div className="flex flex-wrap gap-1.5">
                  {(mod.qps || []).map(qp => (
                    <button
                      key={qp}
                      onClick={() => sendChat(qp)}
                      className="text-[11px] px-2.5 py-1 bg-navy-50 text-navy-700 border border-navy-500/18 rounded-full hover:bg-navy-700 hover:text-white transition-colors"
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 bg-stone-50">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-stone-400 text-[12px] py-8">
                      👆 Choisis un mode et pose ta question, ou clique sur un raccourci
                    </div>
                  )}
                  {chatMessages.map(m => <ChatMessage key={m.id} message={m} />)}
                  {chatLoading && <TypingIndicator />}
                  <div ref={chatBottomRef} />
                </div>
                <ChatInput onSend={sendChat} disabled={chatLoading} />
              </div>
            </div>
          )}

          {/* ── EXERCICES ── */}
          {tab === 'exercices' && (
            <div className="flex flex-col gap-3">
              <div className="bg-white rounded-xl border border-stone-200 p-3">
                <div className="text-[13px] font-semibold text-navy-700 mb-2">✏️ Exercices CCF — {mod.label}</div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {(['qcm', 'redaction', 'situation', 'grille'] as ExoMode[]).map(m => (
                    <ModeCard
                      key={m}
                      active={exoMode === m}
                      onClick={() => setExoMode(m)}
                      modes={{ qcm: { icon: '☑️', label: 'QCM CCF', desc: 'Correction immédiate' }, redaction: { icon: '📝', label: 'Question ouverte', desc: 'Réponse notée /20' }, situation: { icon: '🏭', label: 'Cas d\'entreprise', desc: 'Contexte BtoB' }, grille: { icon: '📋', label: 'Grille critères', desc: 'Auto-évaluation REAC' } }}
                      id={m}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={generateExo}
                    disabled={exoLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-stone-200 text-white rounded-lg text-[12.5px] font-medium transition-colors"
                  >
                    {exoLoading ? '⏳ Génération...' : '🎲 Générer un exercice'}
                  </button>
                  <span className="text-[11.5px] text-stone-400">{exoCount} exercice(s) cette session</span>
                </div>
              </div>

              {exoData && (
                <ExerciseRenderer
                  data={exoData}
                  moduleId={moduleId}
                  moduleType={moduleType}
                  onScore={addScore}
                  onSubmitAnswer={async (answer: string, correction: string) => {
                    const prompt = `Correcteur NTC. Compétence : ${mod.label}. Critères REAC : ${mod.criteres.join(' | ')}. Correction référence : ${correction}. Réponse : ${answer}. Donne une correction bienveillante : note /20, points réussis (citer critères REAC), lacunes, conseils.`;
                    setCorrMessages([]);
                    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: answer, timestamp: new Date() };
                    setCorrMessages([userMsg]);
                    setCorrLoading(true);
                    try {
                      const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], moduleId, mode: 'expliquer' }),
                      });
                      const data = await res.json();
                      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.text || '...', timestamp: new Date() };
                      setCorrMessages([userMsg, aiMsg]);
                    } catch {
                      setCorrMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: '❌ Erreur.', timestamp: new Date() }]);
                    } finally {
                      setCorrLoading(false);
                    }
                  }}
                />
              )}

              {(corrMessages.length > 0 || corrLoading) && (
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <div className="text-[12px] font-semibold text-navy-700 px-3 pt-3 pb-1">💬 Correction & discussion</div>
                  <div className="p-3 bg-stone-50 flex flex-col gap-2.5 max-h-64 overflow-y-auto">
                    {corrMessages.map(m => <ChatMessage key={m.id} message={m} />)}
                    {corrLoading && <TypingIndicator />}
                    <div ref={corrBottomRef} />
                  </div>
                  <ChatInput onSend={sendCorr} disabled={corrLoading} placeholder="Demander une explication, aller plus loin..." />
                </div>
              )}
            </div>
          )}

          {/* ── FICHES ── */}
          {tab === 'fiches' && (
            <div className="flex flex-col gap-3">
              <div className="bg-white rounded-xl border border-stone-200 p-3">
                <div className="text-[13px] font-semibold text-navy-700 mb-2">🗂️ Générer une fiche IA</div>
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={ficheModule}
                    onChange={e => setFicheModule(e.target.value as ModuleId)}
                    className="text-[12px] px-2.5 py-1.5 border border-stone-200 rounded-lg bg-white"
                  >
                    {Object.entries(MODULES).map(([id, m]) => (
                      <option key={id} value={id}>{m.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={generateFiche}
                    disabled={ficheLoading}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-stone-200 text-white rounded-lg text-[12px] font-medium transition-colors"
                  >
                    {ficheLoading ? '⏳ Génération...' : '✨ Générer'}
                  </button>
                </div>
              </div>

              {ficheContent && (
                <div className="bg-white rounded-xl border border-stone-200 p-4 prose-chat text-[12.5px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(ficheContent) }}
                />
              )}

              <StaticFiches />
            </div>
          )}

          {/* ── CCF ── */}
          {tab === 'ccf' && (
            <div className="flex flex-col gap-3">
              <CCFInfoPanel />
              <div className="bg-white rounded-xl border border-stone-200 p-3">
                <div className="text-[13px] font-semibold text-navy-700 mb-2">🤖 Simulation d&apos;épreuve</div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(['prosp_tel', 'nego_face', 'entretien_tech'] as CCFMode[]).map(m => (
                    <ModeCard
                      key={m}
                      active={ccfMode === m}
                      onClick={() => { setCcfMode(m); setCcfMessages([]); }}
                      modes={{ prosp_tel: { icon: '📞', label: 'Prospection téléphonique', desc: 'Simulation 15 min' }, nego_face: { icon: '🤝', label: 'Négociation face-à-face', desc: 'Simulation 60 min' }, entretien_tech: { icon: '🎯', label: 'Entretien technique jury', desc: 'Questions REAC' } }}
                      id={m}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden" style={{ minHeight: '400px' }}>
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 bg-stone-50">
                  {ccfMessages.length === 0 && (
                    <div className="bg-navy-50 border border-navy-500/20 rounded-lg p-3 text-[12px] text-navy-700">
                      💡 Dis-moi sur quel <strong>secteur et produit</strong> tu veux travailler pour lancer la simulation. Ex : &quot;Je suis commercial en logiciels SaaS RH, mon prospect est un DRH de PME&quot;
                    </div>
                  )}
                  {ccfMessages.map(m => <ChatMessage key={m.id} message={m} />)}
                  {ccfLoading && <TypingIndicator />}
                  <div ref={ccfBottomRef} />
                </div>
                <ChatInput
                  onSend={sendCCF}
                  disabled={ccfLoading}
                  placeholder={ccfMode === 'prosp_tel' ? 'Lance la simulation téléphonique...' : ccfMode === 'nego_face' ? 'Lance l\'entretien de vente...' : 'Réponds aux questions du jury...'}
                />
              </div>
            </div>
          )}

          {/* ── MES COURS ── */}
          {tab === 'import' && <ImportTab />}

        </main>
      </div>
    </div>
  );
}

// ─── Sous-composants ────────────────────────────

function ModeCard({ active, onClick, modes, id }: {
  active: boolean;
  onClick: () => void;
  modes: Record<string, { icon: string; label: string; desc: string }>;
  id: string;
}) {
  const m = modes[id];
  if (!m) return null;
  return (
    <button
      onClick={onClick}
      className={`border-[1.5px] rounded-lg p-2.5 text-center transition-all ${
        active
          ? 'border-red-500 bg-red-50'
          : 'border-stone-200 bg-white hover:border-navy-500 hover:bg-navy-50'
      }`}
    >
      <div className="text-lg mb-1">{m.icon}</div>
      <div className="text-[11px] font-semibold leading-tight">{m.label}</div>
      <div className="text-[9.5px] text-stone-400 mt-0.5">{m.desc}</div>
    </button>
  );
}

function ProgrammeTab({ mod, moduleId, moduleType }: { mod: ModuleConfig; moduleId: ModuleId; moduleType: 'c1' | 'c2' | 'tr' }) {
  const ccpColor = moduleType === 'c1' ? 'bg-ccp1-600' : moduleType === 'c2' ? 'bg-ccp2-600' : 'bg-navy-700';
  const ccpLight = moduleType === 'c1' ? 'bg-ccp1-50 border-ccp1-600/20' : moduleType === 'c2' ? 'bg-ccp2-50 border-ccp2-600/20' : 'bg-navy-50 border-navy-500/20';

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-5 gap-2">
        {[
          { v: '9', l: 'Compétences pro' },
          { v: '5', l: 'Compétences transversales' },
          { v: '350h', l: 'Entreprise min.' },
          { v: '8h30', l: 'Épreuve finale' },
          { v: '2029', l: 'Validité RNCP' },
        ].map(k => (
          <div key={k.l} className="bg-white border border-stone-200 rounded-xl p-2.5 text-center">
            <div className="text-xl font-semibold font-mono text-navy-700">{k.v}</div>
            <div className="text-[10px] text-stone-400 mt-0.5">{k.l}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className={`${ccpColor} text-white px-4 py-2.5 text-[13px] font-semibold flex items-center justify-between`}>
          <span>{mod.label}</span>
          <span className="text-[10px] opacity-75">{mod.ccp}</span>
        </div>
        <div className="p-3">
          <p className="text-[12.5px] text-stone-600 mb-3">{mod.desc}</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">Critères d&apos;évaluation REAC 2024</div>
              <div className="flex flex-col gap-1.5">
                {mod.criteres.map((c, i) => (
                  <div key={i} className={`flex gap-2 text-[12px] p-2 rounded-lg border ${ccpLight}`}>
                    <span className="font-mono text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">Savoirs associés</div>
              <div className="flex flex-col gap-1">
                {mod.savoirs.map((s, i) => (
                  <div key={i} className="flex gap-2 text-[12px] py-1.5 px-2 rounded-lg hover:bg-stone-50">
                    <span className="text-stone-400 flex-shrink-0">→</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              {mod.qps.length > 0 && (
                <>
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mt-3 mb-2">Points clés à maîtriser</div>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.qps.map(q => (
                      <span key={q} className="text-[11px] px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">{q}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[12px] text-amber-800">
        ⚠️ <strong>CCF 1ère année :</strong> Les CCF évaluent les compétences progressivement. Vérifie avec ton organisme quelles compétences sont évaluées à ton prochain CCF. En général le focus en 1ère année est sur CCP1 (CP1 à CP4).
      </div>
    </div>
  );
}

function CCFInfoPanel() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="bg-ccp1-600 text-white px-3 py-2 text-[12px] font-semibold">📝 Titre complet — 8h30 min</div>
        <div className="p-3 space-y-1.5">
          {[
            ['MSP écrite (étude de cas)', '4h00'],
            ['Préparation MSP orale', '30 min'],
            ['MSP orale (prospection 15\' + négociation 60\')', '1h15'],
            ['Préparation entretien technique', '20 min'],
            ['Entretien technique', '50 min'],
            ['Questionnement à partir de productions', '1h00'],
            ['Entretien final', '10 min'],
          ].map(([l, v]) => (
            <div key={l} className="flex items-center justify-between text-[11.5px] bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <span className="text-amber-800">{l}</span>
              <span className="font-mono font-semibold text-amber-900">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="bg-navy-700 text-white px-3 py-2 text-[12px] font-semibold">📄 Document à préparer en amont</div>
        <div className="p-3 space-y-1.5 text-[12px] text-stone-700">
          <div className="font-semibold text-navy-700">32 à 38 pages (hors garde, sommaire, annexes)</div>
          {[
            ['Partie 1 (10-12 pages)', 'Veille commerciale'],
            ['Partie 2 (12-14 pages)', 'Plan d\'actions commerciales'],
            ['Partie 3 (10-12 pages)', 'Gestion relation client'],
          ].map(([p, t]) => (
            <div key={p} className="flex gap-2 text-[11.5px]">
              <span className="font-semibold text-navy-700 flex-shrink-0">{p}</span>
              <span className="text-stone-500">— {t}</span>
            </div>
          ))}
          <div className="text-[11px] text-stone-500 pt-1">+ Diaporama 28-32 slides · Police Arial 11 · Interligne 1,15</div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-800 mt-2">
            ⚠️ Période entreprise minimum : <strong>350h</strong> pour le titre complet / <strong>175h</strong> pour un CCP seul.
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseRenderer({ data, moduleId, moduleType, onScore, onSubmitAnswer }: {
  data: Record<string, unknown>;
  moduleId: ModuleId;
  moduleType: 'c1' | 'c2' | 'tr';
  onScore: (correct: boolean) => void;
  onSubmitAnswer: (answer: string, correction: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [redacText, setRedacText] = useState('');

  const tagColor = moduleType === 'c1' ? 'bg-ccp1-50 text-ccp1-900' : moduleType === 'c2' ? 'bg-ccp2-50 text-ccp2-900' : 'bg-navy-50 text-navy-700';

  if ((data as { error?: string }).error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[12px] text-amber-800">
        ❌ {(data as { error: string }).error}
      </div>
    );
  }

  // QCM
  if ((data as { questions?: unknown[] }).questions && !(data as { type?: string }).type) {
    const questions = (data as { questions: Array<{ q: string; options: Record<string, string>; answer: string; explanation: string; critere?: string }> }).questions;
    return (
      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <div key={i} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="bg-navy-50 px-3 py-2 text-[12px] font-semibold text-navy-700 flex items-center justify-between">
              <span>Question {i + 1} / {questions.length}</span>
              {q.critere && <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-medium ${tagColor}`}>{q.critere}</span>}
            </div>
            <div className="p-3">
              <p className="text-[13px] font-medium mb-3">{q.q}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(q.options).map(([k, v]) => {
                  const chosen = answers[i];
                  const isChosen = chosen === k;
                  const isCorrect = k === q.answer;
                  const showResult = !!chosen;
                  return (
                    <button
                      key={k}
                      disabled={!!chosen}
                      onClick={() => {
                        setAnswers(prev => ({ ...prev, [i]: k }));
                        onScore(k === q.answer);
                      }}
                      className={`text-left px-2.5 py-2 rounded-lg border text-[12px] transition-all disabled:cursor-default ${
                        showResult
                          ? isCorrect
                            ? 'bg-green-50 border-green-500 text-green-800'
                            : isChosen
                              ? 'bg-red-50 border-red-500 text-red-800'
                              : 'border-stone-200 text-stone-400'
                          : 'border-stone-200 bg-white hover:bg-navy-50 hover:border-navy-500'
                      }`}
                    >
                      <strong className="mr-1">{k}.</strong>{v}
                    </button>
                  );
                })}
              </div>
              {answers[i] && (
                <div className={`mt-2.5 p-2.5 rounded-lg text-[12px] ${answers[i] === q.answer ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {answers[i] === q.answer ? '✅ Correct !' : `❌ Incorrect. Bonne réponse : ${q.answer}.`}
                  <br /><em className="text-stone-600">{q.explanation}</em>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Rédaction
  if ((data as { type?: string }).type === 'redaction') {
    const d = data as { question: string; contexte?: string; points_attendus: string[]; correction_exemple: string };
    return (
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="bg-navy-50 px-3 py-2 text-[12px] font-semibold text-navy-700">Question ouverte CCF</div>
        <div className="p-3">
          {d.contexte && (
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 mb-2.5 text-[12px] text-stone-600">
              📌 {d.contexte}
            </div>
          )}
          <p className="text-[13px] font-medium mb-2">{d.question}</p>
          <p className="text-[11px] text-stone-400 mb-2">Points attendus : {d.points_attendus.join(' · ')}</p>
          <textarea
            value={redacText}
            onChange={e => setRedacText(e.target.value)}
            className="w-full min-h-[100px] p-2.5 border border-stone-200 rounded-lg text-[12.5px] resize-y focus:border-navy-500 outline-none"
            placeholder="Votre réponse..."
          />
          <button
            onClick={() => onSubmitAnswer(redacText, d.correction_exemple)}
            disabled={!redacText.trim()}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-stone-200 text-white rounded-lg text-[12px] font-medium transition-colors"
          >
            Soumettre pour correction ↗
          </button>
        </div>
      </div>
    );
  }

  // Situation
  if ((data as { type?: string }).type === 'situation') {
    const d = data as { entreprise: string; secteur: string; contexte: string; questions: Array<{ q: string; critere_reac?: string; correction: string }> };
    const [sits, setSits] = useState<Record<number, string>>({});
    return (
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="bg-navy-50 px-3 py-2 text-[12px] font-semibold text-navy-700">
          📌 Cas d&apos;entreprise — {d.entreprise} ({d.secteur})
        </div>
        <div className="p-3">
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 mb-3 text-[12.5px] leading-relaxed text-stone-700">{d.contexte}</div>
          {d.questions.map((q, i) => (
            <div key={i} className="mb-3">
              <p className="font-semibold text-[12.5px] mb-1">Q{i + 1}. {q.q}</p>
              {q.critere_reac && <p className="text-[10.5px] text-stone-400 mb-1">Critère REAC : {q.critere_reac}</p>}
              <textarea
                value={sits[i] || ''}
                onChange={e => setSits(prev => ({ ...prev, [i]: e.target.value }))}
                className="w-full min-h-[70px] p-2 border border-stone-200 rounded-lg text-[12px] resize-y focus:border-navy-500 outline-none"
                placeholder="Votre réponse..."
              />
            </div>
          ))}
          <button
            onClick={() => {
              const allAnswers = d.questions.map((q, i) => `Q${i + 1}: ${sits[i] || ''}`).join('\n');
              const corrections = d.questions.map((q, i) => `Q${i + 1} - Correction: ${q.correction}`).join('\n');
              onSubmitAnswer(allAnswers, corrections);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[12px] font-medium transition-colors"
          >
            Corriger mes réponses ↗
          </button>
        </div>
      </div>
    );
  }

  // Grille
  if ((data as { type?: string }).type === 'grille') {
    const d = data as { titre: string; criteres: Array<{ critere_officiel: string; question_pratique: string; indicateurs: string[] }> };
    const [evals, setEvals] = useState<Record<number, string>>({});
    return (
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="bg-navy-50 px-3 py-2 text-[12px] font-semibold text-navy-700">
          📋 Grille d&apos;auto-évaluation — {d.titre}
        </div>
        <div className="p-3 flex flex-col gap-2.5">
          {d.criteres.map((c, i) => (
            <div key={i} className="bg-stone-50 border border-stone-200 rounded-lg p-2.5">
              <p className="font-semibold text-[12px] text-navy-700 mb-1">📌 {c.critere_officiel}</p>
              <p className="text-[12px] mb-1.5">❓ {c.question_pratique}</p>
              <p className="text-[11px] text-stone-400 mb-2">Indicateurs : {c.indicateurs.join(' · ')}</p>
              <div className="flex gap-2">
                {[
                  { val: 'ok', label: '✅ Maîtrisé', cls: 'border-green-500 text-green-700 hover:bg-green-50' },
                  { val: 'progress', label: '📈 En cours', cls: 'border-amber-500 text-amber-700 hover:bg-amber-50' },
                  { val: 'ko', label: '❌ À retravailler', cls: 'border-red-500 text-red-700 hover:bg-red-50' },
                ].map(btn => (
                  <button
                    key={btn.val}
                    onClick={() => setEvals(prev => ({ ...prev, [i]: btn.val }))}
                    className={`text-[11px] px-2.5 py-1 border rounded-lg transition-all ${btn.cls} ${evals[i] === btn.val ? 'opacity-100 font-semibold' : 'opacity-50'}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const ok = Object.values(evals).filter(v => v === 'ok').length;
              const prog = Object.values(evals).filter(v => v === 'progress').length;
              const ko = Object.values(evals).filter(v => v === 'ko').length;
              onSubmitAnswer(
                `Auto-évaluation ${d.titre} : ${ok} maîtrisés, ${prog} en cours, ${ko} à retravailler.`,
                `Analyse les résultats et donne des conseils ciblés pour progresser sur les critères non maîtrisés.`
              );
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[12px] font-medium transition-colors"
          >
            Analyser mes résultats ↗
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function StaticFiches() {
  const fiches = [
    { t: 'Veille commerciale', ccp: 'CCP 1', col: '#0f5298', items: ['<strong>Sources :</strong> Google Alerts, LinkedIn, Feedly, newsletters concurrents', '<strong>Outils IA :</strong> analyser secteur, actualiser personas en continu', '<strong>PESTEL :</strong> Politique, Économique, Social, Technologique, Écologique, Légal', '<strong>Critères REAC :</strong> outils appropriés · données actualisées · stratégie ajustée'] },
    { t: 'Méthodes de vente', ccp: 'CCP 2', col: '#6b2d7e', items: ['<strong>CAP :</strong> Caractéristique → Avantage → Preuve', '<strong>SONCAS :</strong> Sécurité, Orgueil, Nouveauté, Confort, Argent, Sympathie', '<strong>CRAC :</strong> Creuser → Reformuler → Argumenter → Contrôler', '<strong>CROC :</strong> Contact → Raison → Objectif → Conclusion (phoning)'] },
    { t: 'CRM & KPIs', ccp: 'CCP 1 & 2', col: '#1c3d5a', items: ['<strong>KPIs :</strong> taux de conversion, CA pipeline, leads générés, LTV', '<strong>CRM :</strong> Salesforce, HubSpot, Pipedrive — centraliser, segmenter, automatiser', '<strong>NPS :</strong> Net Promoter Score — fidélisation et satisfaction', '<strong>Omnicanalité :</strong> cohérence expérience tous points de contact'] },
    { t: 'Juridique & RGPD', ccp: 'Transversal', col: '#7a4f0e', items: ['<strong>RGPD :</strong> consentement, droit à l\'oubli, portabilité, CNIL', '<strong>Loi Naegelen (2020-901) :</strong> authentification numéros téléphone', '<strong>CGV :</strong> éléments obligatoires, opposabilité, délais de rétractation', '<strong>Loi AGEC (2020) :</strong> économie circulaire, indice de réparabilité'] },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {fiches.map(f => (
        <div key={f.t} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-3 py-2 text-white text-[11.5px] font-semibold flex items-center gap-2" style={{ background: f.col }}>
            <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded uppercase tracking-wider">{f.ccp}</span>
            {f.t}
          </div>
          <div className="p-3">
            <ul className="space-y-1.5 text-[12px] text-stone-700">
              {f.items.map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^#### (.+)$/gm, '<h4 style="font-size:12.5px;font-weight:600;margin:10px 0 4px;color:#1c3d5a">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:13.5px;font-weight:600;margin:12px 0 6px;color:#1c3d5a">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:14px;font-weight:600;margin:14px 0 7px;color:#1c3d5a">$1</h2>')
    .replace(/^- (.+)$/gm, '<li style="margin-bottom:3px">$1</li>')
    .replace(/(<li[^>]*>.*?<\/li>\n?)+/gs, (m) => `<ul style="padding-left:1.1em;margin:6px 0">${m}</ul>`)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
