'use client';
import { useState } from 'react';

const TYPES = [
  { id: 'bug', emoji: '🐛', label: 'Bug', desc: 'Ça ne marche pas' },
  { id: 'amelioration', emoji: '💡', label: 'Amélioration', desc: 'Une idée' },
  { id: 'question', emoji: '❓', label: 'Question', desc: 'Besoin d\'aide' },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [desc, setDesc] = useState('');
  const [page, setPage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  function reset() {
    setDesc('');
    setPage('');
    setType('bug');
    setStatus('idle');
    setOpen(false);
  }

  async function submit() {
    if (!desc.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          description: desc.trim(),
          page: page.trim() || 'non précisé',
          url: typeof window !== 'undefined' ? window.location.href : '',
        }),
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(reset, 2500);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 bg-white border border-stone-200 shadow-md rounded-full px-3 py-2 text-[11px] font-medium text-stone-500 hover:bg-stone-50 hover:text-navy-700 transition-colors flex items-center gap-1.5"
        aria-label="Envoyer un feedback"
      >
        💬 Feedback
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={reset} />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-5">

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-semibold text-navy-700">Signaler / Suggérer</h2>
                <button onClick={reset} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-600 text-xl leading-none rounded-lg hover:bg-stone-100">×</button>
              </div>

              {status === 'success' ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✅</div>
                  <div className="text-[13px] font-semibold text-navy-700 mb-1">Message envoyé !</div>
                  <div className="text-[11.5px] text-stone-400">Geoffrey va recevoir une notification.</div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {TYPES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setType(t.id)}
                        className={`border-[1.5px] rounded-xl p-2.5 text-center transition-all ${
                          type === t.id ? 'border-red-500 bg-red-50' : 'border-stone-200 hover:border-navy-400 hover:bg-navy-50'
                        }`}
                      >
                        <div className="text-xl mb-0.5">{t.emoji}</div>
                        <div className="text-[11px] font-semibold text-stone-700">{t.label}</div>
                        <div className="text-[9.5px] text-stone-400 mt-0.5">{t.desc}</div>
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    rows={4}
                    placeholder={
                      type === 'bug'
                        ? 'Décris ce qui ne fonctionne pas (quel bouton, quel onglet, que se passe-t-il ?)…'
                        : type === 'amelioration'
                        ? 'Décris l\'amélioration souhaitée…'
                        : 'Pose ta question…'
                    }
                    className="w-full p-3 border border-stone-200 rounded-xl text-[12.5px] resize-none focus:border-navy-500 outline-none mb-3"
                  />

                  <input
                    value={page}
                    onChange={e => setPage(e.target.value)}
                    placeholder="Onglet concerné : Programme / Révision / Exercices… (optionnel)"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-[12px] focus:border-navy-500 outline-none mb-4"
                  />

                  {status === 'error' && (
                    <p className="text-[11.5px] text-red-600 mb-3">Erreur d&apos;envoi. Réessaie dans un instant.</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={reset}
                      className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[12px] text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={submit}
                      disabled={!desc.trim() || status === 'loading'}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-stone-200 disabled:text-stone-400 text-white rounded-xl text-[12px] font-semibold transition-colors"
                    >
                      {status === 'loading' ? '⏳ Envoi…' : 'Envoyer →'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
