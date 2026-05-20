'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { MODULES } from '@/lib/reac-data';
import { streamChat } from '@/lib/stream';
import { supabase } from '@/lib/supabase';
import { syncToCloud } from '@/lib/sync';
import { ChatMessage, TypingIndicator } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ImportTab } from './ImportTab';
import { EcmPage } from './EcmPage';
import { ProgressDashboard } from './ProgressDashboard';
import { RevisionExpress } from './RevisionExpress';
import { ChatHistory, saveConversation } from './ChatHistory';
import { ParcourPage } from './ParcourPage';
import { ParcourSession } from './ParcourSession';
import { GameParcours } from './GameParcours';
import { loadStreak, updateStreak } from '@/lib/engagement';
import type { Message, ModuleId, ChatMode, ExoMode, CCFMode, Score, ModuleConfig } from '@/types';
import type { SavedConversation } from './ChatHistory';

const CCF_DURATIONS: Record<string, number> = {
  prosp_tel: 15 * 60,
  nego_face: 60 * 60,
  entretien_tech: 50 * 60,
};

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

// ─── Tabs ───────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: '📊 Progression' },
  { id: 'parcours', label: '🗺️ Parcours' },
  { id: 'game', label: '🎮 Jeu' },
  { id: 'programme', label: '📋 Programme' },
  { id: 'revision', label: '📚 Révision IA' },
  { id: 'express', label: '⚡ Express' },
  { id: 'exercices', label: '✏️ Exercices CCF' },
  { id: 'fiches', label: '🗂️ Fiches' },
  { id: 'ccf', label: '🎯 Préparer CCF' },
  { id: 'import', label: '📥 Mes cours' },
  { id: 'ecm', label: '🎓 ECM' },
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

export function MainApp({ userId, userEmail, displayName }: { userId?: string; userEmail?: string; displayName?: string }) {
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
  const [score, setScore] = useState<Score>(() => {
    try {
      const saved = localStorage.getItem('ntc_score');
      if (saved) return JSON.parse(saved) as Score;
    } catch { /* ignore */ }
    return { correct: 0, total: 0, byModule: {} };
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ccfTimeLeft, setCcfTimeLeft] = useState<number | null>(null);
  const [examDaysLeft, setExamDaysLeft] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('ntc_dark') === '1'; } catch { return false; }
  });
  const [sessionOpen, setSessionOpen] = useState(false);
  const [streakCount, setStreakCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return loadStreak().count;
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const ccfIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ccfBottomRef = useRef<HTMLDivElement>(null);
  const corrBottomRef = useRef<HTMLDivElement>(null);
  const exoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab !== 'revision') return;
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading, tab]);

  useEffect(() => {
    if (tab !== 'exercices') return;
    if (exoData) exoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [exoData, tab]);

  useEffect(() => {
    if (tab !== 'ccf') return;
    ccfBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ccfMessages, ccfLoading, tab]);

  useEffect(() => {
    if (tab !== 'exercices') return;
    corrBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [corrMessages, corrLoading, tab]);

  useEffect(() => {
    try { localStorage.setItem('ntc_score', JSON.stringify(score)); } catch { /* ignore */ }
  }, [score]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) { root.classList.add('dark'); localStorage.setItem('ntc_dark', '1'); }
    else { root.classList.remove('dark'); localStorage.setItem('ntc_dark', '0'); }
  }, [darkMode]);

  const chatMessagesRef = useRef<Message[]>([]);
  useEffect(() => { chatMessagesRef.current = chatMessages; }, [chatMessages]);

  const prevModuleId = useRef<ModuleId>(moduleId);
  useEffect(() => {
    if (prevModuleId.current !== moduleId) {
      const msgs = chatMessagesRef.current.filter(m => m.content);
      if (msgs.length >= 2) saveConversation(prevModuleId.current, msgs);
      prevModuleId.current = moduleId;
      setChatMessages([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  function markParcourActivity(mid: ModuleId, activity: 'cours' | 'quiz' | 'exercice' | 'fiche') {
    try {
      const key = 'ntc_parcours';
      const p = JSON.parse(localStorage.getItem(key) || '{}');
      const step = p[mid] ?? { activities: [] };
      if (!step.activities.includes(activity)) {
        p[mid] = { ...step, activities: [...step.activities, activity], startedAt: step.startedAt ?? new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(p));
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    function refresh() {
      const saved = localStorage.getItem('ntc_exam_date');
      if (!saved) { setExamDaysLeft(null); return; }
      const exam = new Date(saved);
      exam.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setExamDaysLeft(Math.ceil((exam.getTime() - today.getTime()) / 86400000));
      setStreakCount(loadStreak().count);
    }
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  useEffect(() => {
    return () => { if (ccfIntervalRef.current) clearInterval(ccfIntervalRef.current); };
  }, []);

  // ── Sync cloud : à la fermeture + quand le score change ──
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!userId) return;
    const onUnload = () => syncToCloud();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => syncToCloud(), 5_000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, userId]);

  function startCcfTimer() {
    if (ccfIntervalRef.current) clearInterval(ccfIntervalRef.current);
    const duration = CCF_DURATIONS[ccfMode];
    setCcfTimeLeft(duration);
    ccfIntervalRef.current = setInterval(() => {
      setCcfTimeLeft(t => {
        if (t === null || t <= 1) {
          clearInterval(ccfIntervalRef.current!);
          ccfIntervalRef.current = null;
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function resetCcfTimer() {
    if (ccfIntervalRef.current) clearInterval(ccfIntervalRef.current);
    ccfIntervalRef.current = null;
    setCcfTimeLeft(null);
  }

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

  function navigateToModule(moduleId: ModuleId, tab: string) {
    setModuleId(moduleId);
    setTab(tab);
  }

  function loadConversation(conv: SavedConversation) {
    setModuleId(conv.moduleId);
    setTab('revision');
    setChatMessages(conv.messages.map((m, i) => ({
      id: i.toString(),
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(),
    })));
  }

  async function sendChat(text: string) {
    if (chatMessages.length === 0) updateStreak();
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    const newMsgs = [...chatMessages, userMsg];
    const aiId = (Date.now() + 1).toString();
    setChatMessages([...newMsgs, { id: aiId, role: 'assistant', content: '', timestamp: new Date() }]);
    setChatLoading(true);
    if (chatMessages.length === 0) markParcourActivity(moduleId, 'cours');

    let fullText = '';
    try {
      await streamChat(
        { messages: newMsgs.map(m => ({ role: m.role, content: m.content })), moduleId, mode: chatMode },
        (chunk) => {
          fullText += chunk;
          setChatMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullText } : m));
        }
      );
      const finalMsgs = [...newMsgs, { id: aiId, role: 'assistant' as const, content: fullText, timestamp: new Date() }];
      await saveSession(finalMsgs, score);
    } catch {
      setChatMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: '❌ Erreur de connexion.' } : m));
    } finally {
      setChatLoading(false);
    }
  }

  async function sendCCF(text: string) {
    const isFirst = ccfMessages.length === 0;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    const newMsgs = [...ccfMessages, userMsg];
    const aiId = (Date.now() + 1).toString();
    setCcfMessages([...newMsgs, { id: aiId, role: 'assistant', content: '', timestamp: new Date() }]);
    setCcfLoading(true);
    if (isFirst) startCcfTimer();

    let fullText = '';
    try {
      await streamChat(
        { messages: newMsgs.map(m => ({ role: m.role, content: m.content })), ccfSimMode: ccfMode },
        (chunk) => {
          fullText += chunk;
          setCcfMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullText } : m));
        }
      );
    } catch {
      setCcfMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: '❌ Erreur de connexion.' } : m));
    } finally {
      setCcfLoading(false);
    }
  }

  async function sendCorr(text: string) {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    const newMsgs = [...corrMessages, userMsg];
    const aiId = (Date.now() + 1).toString();
    setCorrMessages([...newMsgs, { id: aiId, role: 'assistant', content: '', timestamp: new Date() }]);
    setCorrLoading(true);

    let fullText = '';
    try {
      await streamChat(
        { messages: newMsgs.map(m => ({ role: m.role, content: m.content })), moduleId, mode: 'expliquer' },
        (chunk) => {
          fullText += chunk;
          setCorrMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullText } : m));
        }
      );
    } catch {
      setCorrMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: '❌ Erreur.' } : m));
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
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let raw = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
      }
      const clean = raw.replace(/```json|```/g, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no json');
      setExoData(JSON.parse(match[0]));
      setExoCount(n => n + 1);
      markParcourActivity(moduleId, 'exercice');
    } catch {
      setExoData({ error: 'Erreur de génération. Réessayez.' });
    } finally {
      setExoLoading(false);
    }
  }

  function exportFicheIA() {
    const mod = MODULES[ficheModule];
    const html = parseMarkdown(ficheContent);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8">
<title>Fiche NTC — ${mod.label}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, system-ui, sans-serif; font-size: 13px; color: #1a1a1a; padding: 24px 32px; max-width: 820px; margin: 0 auto; }
  header { background: #1c3d5a; color: white; padding: 14px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
  header h1 { font-size: 15px; font-weight: 700; }
  header .badge { font-size: 9px; background: rgba(255,255,255,.2); padding: 3px 8px; border-radius: 4px; letter-spacing: .08em; text-transform: uppercase; }
  .content { line-height: 1.65; }
  .content h2 { font-size: 14px; font-weight: 700; color: #1c3d5a; margin: 16px 0 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .content h3 { font-size: 13.5px; font-weight: 600; color: #1c3d5a; margin: 12px 0 4px; }
  .content h4 { font-size: 12.5px; font-weight: 600; color: #374151; margin: 10px 0 3px; }
  .content ul { padding-left: 1.2em; margin: 6px 0; }
  .content li { margin-bottom: 4px; }
  .content strong { font-weight: 600; }
  footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: right; }
  @media print { body { padding: 0; } @page { margin: 1.5cm 1.8cm; size: A4; } }
</style>
</head><body>
<header>
  <h1>📋 ${mod.label}</h1>
  <span class="badge">Titre Pro NTC · REAC 2024</span>
</header>
<div class="content">${html}</div>
<footer>NTC Coach — RNCP 39063 · Généré le ${new Date().toLocaleDateString('fr-FR')}</footer>
<script>window.onload = () => { window.print(); }</script>
</body></html>`);
    win.document.close();
  }

  async function generateFiche() {
    setFicheLoading(true);
    setFicheContent('');
    const mod = MODULES[ficheModule];
    let fullText = '';
    try {
      await streamChat(
        {
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
        },
        (chunk) => {
          fullText += chunk;
          setFicheContent(fullText);
        }
      );
      markParcourActivity(ficheModule, 'fiche');
    } catch {
      setFicheContent('❌ Erreur de génération.');
    } finally {
      setFicheLoading(false);
    }
  }

  function addScore(correct: boolean) {
    updateStreak();
    markParcourActivity(moduleId, 'quiz');
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
    <>
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-navy-700 text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <button
            className="md:hidden p-1 text-white/80 hover:text-white mr-1 flex-shrink-0"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Menu modules"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span className="text-[9px] font-bold bg-red-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Titre Pro</span>
          <h1 className="text-[13px] font-semibold">NTC Coach</h1>
          <span className="hidden sm:inline text-[9px] bg-white/15 px-1.5 py-0.5 rounded">REAC 2024 · RNCP 39063</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(d => !d)}
            title={darkMode ? 'Mode clair' : 'Mode sombre'}
            className="text-white/70 hover:text-white transition-colors text-[15px] leading-none"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          {streakCount > 0 && (
            <button
              onClick={() => setTab('dashboard')}
              className="flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full hover:bg-orange-600 transition-colors"
            >
              🔥 {streakCount}j
            </button>
          )}
          {examDaysLeft !== null && (
            <button
              onClick={() => setTab('dashboard')}
              className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-colors ${
                examDaysLeft <= 0 ? 'bg-red-600 text-white' :
                examDaysLeft <= 7 ? 'bg-red-500/90 text-white' :
                examDaysLeft <= 30 ? 'bg-amber-400 text-amber-900' :
                'bg-emerald-500/80 text-white'
              }`}
              title="Compte à rebours examen"
            >
              {examDaysLeft <= 0 ? '🎯 Exam !' : `J-${examDaysLeft}`}
            </button>
          )}
          <button
            onClick={() => setTab('dashboard')}
            className="text-[11px] bg-white/12 hover:bg-white/20 px-2.5 py-1 rounded-full font-mono transition-colors"
            title="Voir ma progression"
          >
            Score : {score.correct}/{score.total}
          </button>
          {userEmail && (
            <div className="flex items-center gap-1.5 pl-1 border-l border-white/20 ml-1">
              <span className="hidden sm:inline text-[10px] text-white/70 font-medium max-w-[80px] truncate">
                {displayName || userEmail.split('@')[0]}
              </span>
              <button
                onClick={async () => { await syncToCloud(); await supabase?.auth.signOut(); }}
                title="Se déconnecter"
                className="text-white/50 hover:text-white text-[11px] transition-colors"
              >
                ⏏
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="bg-white border-b border-stone-200 flex px-2 sm:px-4 overflow-x-auto flex-shrink-0">
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
            {t.label}
          </button>
        ))}
      </nav>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — cachée sur l'onglet ECM */}
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 md:w-52 md:static md:flex-shrink-0 bg-white border-r border-stone-200 overflow-y-auto p-2 transition-transform duration-300 ${tab === 'ecm' ? 'hidden' : ''} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
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
                    onClick={() => { setModuleId(item.id); setModuleType(item.type); setSidebarOpen(false); }}
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
        <main className={tab === 'ecm' || tab === 'game' ? 'flex-1 overflow-hidden flex flex-col' : tab === 'revision' ? 'flex-1 overflow-hidden flex flex-col p-4' : 'flex-1 overflow-y-auto p-4'}>

          {/* ── DASHBOARD ── */}
          {tab === 'dashboard' && (
            <ProgressDashboard
              score={score}
              onReset={() => setScore({ correct: 0, total: 0, byModule: {} })}
            />
          )}

          {/* ── PARCOURS ── */}
          {tab === 'parcours' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTab('game')}
                  className="py-4 bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-white rounded-xl text-[13px] font-bold shadow-md transition-all active:scale-95 flex flex-col items-center gap-1"
                >
                  <span className="text-2xl">🎮</span>
                  <span>Mode Jeu</span>
                  <span className="text-[10px] font-normal opacity-80">XP · Vies · Étoiles</span>
                </button>
                <button
                  onClick={() => setSessionOpen(true)}
                  className="py-4 bg-navy-700 hover:bg-navy-800 text-white rounded-xl text-[13px] font-bold shadow-md transition-all active:scale-95 flex flex-col items-center gap-1"
                >
                  <span className="text-2xl">🗺️</span>
                  <span>Session guidée</span>
                  <span className="text-[10px] font-normal opacity-80">Cours + exercice</span>
                </button>
              </div>
              <ParcourPage score={score} onNavigate={navigateToModule} />
            </div>
          )}

          {/* ── PROGRAMME ── */}
          {tab === 'programme' && (
            <ProgrammeTab mod={mod} moduleId={moduleId} moduleType={moduleType} />
          )}

          {/* ── RÉVISION ── */}
          {tab === 'revision' && (
            <div className="flex flex-col gap-2 h-full min-h-0">
              {/* Mode selector compact */}
              <div className="bg-white rounded-xl border border-stone-200 px-3 py-2.5 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[12px] font-semibold text-navy-700 flex-shrink-0">🎯 {mod.label.replace(/^CP\d+ — /, '')}</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {([
                      { id: 'expliquer', icon: '📖', label: 'Cours' },
                      { id: 'quiz',      icon: '❓', label: 'Quiz' },
                      { id: 'scenario',  icon: '🎭', label: 'Scénario' },
                      { id: 'criteres',  icon: '🎯', label: 'CCF' },
                    ] as { id: ChatMode; icon: string; label: string }[]).map(m => (
                      <button
                        key={m.id}
                        onClick={() => setChatMode(m.id)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all ${
                          chatMode === m.id
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'border-stone-200 text-stone-500 hover:border-navy-500 hover:text-navy-700'
                        }`}
                      >
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="ml-auto"><ChatHistory onLoad={loadConversation} /></div>
                </div>
                {/* Quick prompts */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {(mod.qps || []).map(qp => (
                    <button
                      key={qp}
                      onClick={() => sendChat(qp)}
                      className="text-[10.5px] px-2.5 py-1 bg-navy-50 text-navy-700 border border-navy-500/18 rounded-full hover:bg-navy-700 hover:text-white transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat — prend toute la hauteur restante */}
              <div className="flex-1 flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-stone-50">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-stone-400 text-[12px] py-12">
                      👆 Choisis un mode et pose ta question, ou clique sur un raccourci
                    </div>
                  )}
                  {chatMessages.map(m => <ChatMessage key={m.id} message={m} />)}
                  {chatLoading && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && <TypingIndicator />}
                  <div ref={chatBottomRef} />
                </div>
                <ChatInput onSend={sendChat} disabled={chatLoading} />
              </div>
            </div>
          )}

          {/* ── EXPRESS ── */}
          {tab === 'express' && <RevisionExpress />}

          {/* ── EXERCICES ── */}
          {tab === 'exercices' && (
            <div className="flex flex-col gap-3">
              <div className="bg-white rounded-xl border border-stone-200 p-3">
                <div className="text-[13px] font-semibold text-navy-700 mb-2">✏️ Exercices CCF — {mod.label}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
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
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={generateExo}
                    disabled={exoLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-[12.5px] font-medium transition-all flex items-center gap-2"
                  >
                    {exoLoading && (
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                      </svg>
                    )}
                    {exoLoading ? 'Génération en cours…' : '🎲 Générer un exercice'}
                  </button>
                  <span className="text-[11.5px] text-stone-400">{exoCount} exercice(s) cette session</span>
                </div>
              </div>

              {exoData && (
                <div ref={exoRef}>
                <ExerciseRenderer
                  data={exoData}
                  moduleId={moduleId}
                  moduleType={moduleType}
                  onScore={addScore}
                  onSubmitAnswer={async (answer: string, correction: string) => {
                    const prompt = `Correcteur NTC. Compétence : ${mod.label}. Critères REAC : ${mod.criteres.join(' | ')}. Correction référence : ${correction}. Réponse : ${answer}. Donne une correction bienveillante : note /20, points réussis (citer critères REAC), lacunes, conseils.`;
                    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: answer, timestamp: new Date() };
                    const aiId = (Date.now() + 1).toString();
                    setCorrMessages([userMsg, { id: aiId, role: 'assistant', content: '', timestamp: new Date() }]);
                    setCorrLoading(true);
                    let fullText = '';
                    try {
                      await streamChat(
                        { messages: [{ role: 'user', content: prompt }], moduleId, mode: 'expliquer' },
                        (chunk) => {
                          fullText += chunk;
                          setCorrMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullText } : m));
                        }
                      );
                    } catch {
                      setCorrMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: '❌ Erreur.' } : m));
                    } finally {
                      setCorrLoading(false);
                    }
                  }}
                />
                </div>
              )}

              {(corrMessages.length > 0 || corrLoading) && (
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <div className="text-[12px] font-semibold text-navy-700 px-3 pt-3 pb-1">💬 Correction & discussion</div>
                  <div className="p-3 bg-stone-50 flex flex-col gap-2.5 max-h-64 overflow-y-auto">
                    {corrMessages.map(m => <ChatMessage key={m.id} message={m} />)}
                    {corrLoading && corrMessages[corrMessages.length - 1]?.role !== 'assistant' && <TypingIndicator />}
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
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100 bg-stone-50">
                    <span className="text-[11.5px] font-medium text-stone-500">{MODULES[ficheModule]?.label}</span>
                    <button
                      onClick={exportFicheIA}
                      className="flex items-center gap-1.5 px-3 py-1 bg-navy-700 hover:bg-navy-800 text-white rounded-lg text-[11px] font-medium transition-colors"
                    >
                      📄 Exporter PDF
                    </button>
                  </div>
                  <div className="p-4 prose-chat text-[12.5px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(ficheContent) }}
                  />
                </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                  {(['prosp_tel', 'nego_face', 'entretien_tech'] as CCFMode[]).map(m => (
                    <ModeCard
                      key={m}
                      active={ccfMode === m}
                      onClick={() => { setCcfMode(m); setCcfMessages([]); resetCcfTimer(); }}
                      modes={{ prosp_tel: { icon: '📞', label: 'Prospection téléphonique', desc: 'Simulation 15 min' }, nego_face: { icon: '🤝', label: 'Négociation face-à-face', desc: 'Simulation 60 min' }, entretien_tech: { icon: '🎯', label: 'Entretien technique jury', desc: 'Questions REAC' } }}
                      id={m}
                    />
                  ))}
                </div>
              </div>

              {ccfTimeLeft !== null && (
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[13px] font-semibold ${
                  ccfTimeLeft === 0
                    ? 'bg-red-100 border-red-400 text-red-700'
                    : ccfTimeLeft <= 60
                    ? 'bg-amber-100 border-amber-400 text-amber-700'
                    : ccfTimeLeft <= (CCF_DURATIONS[ccfMode] * 0.2)
                    ? 'bg-orange-100 border-orange-400 text-orange-700'
                    : 'bg-emerald-50 border-emerald-400 text-emerald-700'
                }`}>
                  <span>⏱ Temps restant</span>
                  <span className="font-mono text-[15px]">
                    {ccfTimeLeft === 0 ? '⏰ Temps écoulé !' : formatTime(ccfTimeLeft)}
                  </span>
                </div>
              )}

              <div className="flex-1 flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden" style={{ minHeight: '400px' }}>
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 bg-stone-50">
                  {ccfMessages.length === 0 && (
                    <div className="bg-navy-50 border border-navy-500/20 rounded-lg p-3 text-[12px] text-navy-700">
                      💡 Dis-moi sur quel <strong>secteur et produit</strong> tu veux travailler pour lancer la simulation. Ex : &quot;Je suis commercial en logiciels SaaS RH, mon prospect est un DRH de PME&quot;
                    </div>
                  )}
                  {ccfMessages.map(m => <ChatMessage key={m.id} message={m} />)}
                  {ccfLoading && ccfMessages[ccfMessages.length - 1]?.role !== 'assistant' && <TypingIndicator />}
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

          {/* ── JEU ── */}
          {tab === 'game' && (
            <div className="flex-1 overflow-hidden" style={{ height: '100%' }}>
              <GameParcours onBack={() => setTab('parcours')} />
            </div>
          )}

          {/* ── ECM ── */}
          {tab === 'ecm' && (
            <div className="flex-1 overflow-hidden" style={{ height: '100%' }}>
              <EcmPage />
            </div>
          )}

        </main>
      </div>
    </div>
    {sessionOpen && <ParcourSession onClose={() => setSessionOpen(false)} />}
    </>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
  const [redacText, setRedacText] = useState('');
  const [sits, setSits] = useState<Record<number, string>>({});
  const [evals, setEvals] = useState<Record<number, string>>({});

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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

const STATIC_FICHES = [
  { t: 'Veille commerciale', ccp: 'CCP 1', col: '#0f5298', items: ['<strong>Sources :</strong> Google Alerts, LinkedIn, Feedly, newsletters concurrents', '<strong>Outils IA :</strong> analyser secteur, actualiser personas en continu', '<strong>PESTEL :</strong> Politique, Économique, Social, Technologique, Écologique, Légal', '<strong>Critères REAC :</strong> outils appropriés · données actualisées · stratégie ajustée'] },
  { t: 'Méthodes de vente', ccp: 'CCP 2', col: '#6b2d7e', items: ['<strong>CAP :</strong> Caractéristique → Avantage → Preuve', '<strong>SONCAS :</strong> Sécurité, Orgueil, Nouveauté, Confort, Argent, Sympathie', '<strong>CRAC :</strong> Creuser → Reformuler → Argumenter → Contrôler', '<strong>CROC :</strong> Contact → Raison → Objectif → Conclusion (phoning)'] },
  { t: 'CRM & KPIs', ccp: 'CCP 1 & 2', col: '#1c3d5a', items: ['<strong>KPIs :</strong> taux de conversion, CA pipeline, leads générés, LTV', '<strong>CRM :</strong> Salesforce, HubSpot, Pipedrive — centraliser, segmenter, automatiser', '<strong>NPS :</strong> Net Promoter Score — fidélisation et satisfaction', '<strong>Omnicanalité :</strong> cohérence expérience tous points de contact'] },
  { t: 'Juridique & RGPD', ccp: 'Transversal', col: '#7a4f0e', items: ['<strong>RGPD :</strong> consentement, droit à l\'oubli, portabilité, CNIL', '<strong>Loi Naegelen (2020-901) :</strong> authentification numéros téléphone', '<strong>CGV :</strong> éléments obligatoires, opposabilité, délais de rétractation', '<strong>Loi AGEC (2020) :</strong> économie circulaire, indice de réparabilité'] },
];

function exportStaticFiche(f: typeof STATIC_FICHES[0]) {
  const win = window.open('', '_blank');
  if (!win) return;
  const items = f.items.map(i => `<li>${i}</li>`).join('');
  win.document.write(`<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8">
<title>Fiche NTC — ${f.t}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, system-ui, sans-serif; font-size: 13px; color: #1a1a1a; padding: 24px 32px; max-width: 820px; margin: 0 auto; }
  header { color: white; padding: 14px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; background: ${f.col}; }
  header h1 { font-size: 15px; font-weight: 700; }
  header .badge { font-size: 9px; background: rgba(255,255,255,.2); padding: 3px 8px; border-radius: 4px; letter-spacing: .08em; text-transform: uppercase; }
  ul { padding-left: 1.2em; margin: 8px 0; }
  li { margin-bottom: 8px; line-height: 1.5; }
  strong { font-weight: 600; }
  footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: right; }
  @media print { body { padding: 0; } @page { margin: 1.5cm 1.8cm; size: A4; } }
</style>
</head><body>
<header>
  <h1>📋 ${f.t}</h1>
  <span class="badge">${f.ccp} · REAC 2024</span>
</header>
<ul>${items}</ul>
<footer>NTC Coach — RNCP 39063 · Titre Pro NTC</footer>
<script>window.onload = () => { window.print(); }</script>
</body></html>`);
  win.document.close();
}

function StaticFiches() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {STATIC_FICHES.map(f => (
        <div key={f.t} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-3 py-2 text-white text-[11.5px] font-semibold flex items-center justify-between" style={{ background: f.col }}>
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded uppercase tracking-wider">{f.ccp}</span>
              {f.t}
            </div>
            <button
              onClick={() => exportStaticFiche(f)}
              title="Exporter en PDF"
              className="text-[10px] bg-white/20 hover:bg-white/35 px-2 py-0.5 rounded transition-colors"
            >
              📄 PDF
            </button>
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
    .replace(/(<li[^>]*>[^\n]*<\/li>\n?)+/g, (m) => `<ul style="padding-left:1.1em;margin:6px 0">${m}</ul>`)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
