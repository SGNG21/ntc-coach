'use client';
import { useState } from 'react';
import type { Message, ModuleId } from '@/types';
import { MODULES } from '@/lib/reac-data';

const LS_KEY = 'ntc_chat_history';
const MAX_SAVED = 20;

export interface SavedConversation {
  id: string;
  moduleId: ModuleId;
  date: string;
  preview: string;
  messages: { role: string; content: string }[];
}

export function saveConversation(moduleId: ModuleId, messages: Message[]) {
  if (messages.length < 2) return;
  try {
    const existing: SavedConversation[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    const entry: SavedConversation = {
      id: Date.now().toString(),
      moduleId,
      date: new Date().toISOString(),
      preview: messages.find(m => m.role === 'user')?.content.slice(0, 80) ?? '',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    };
    const updated = [entry, ...existing].slice(0, MAX_SAVED);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function loadHistory(): SavedConversation[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}

function deleteConversation(id: string) {
  try {
    const data = loadHistory().filter(c => c.id !== id);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function ChatHistory({ onLoad }: { onLoad: (conv: SavedConversation) => void }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<SavedConversation[]>([]);

  function openModal() {
    setHistory(loadHistory());
    setOpen(true);
  }

  function remove(id: string) {
    deleteConversation(id);
    setHistory(h => h.filter(c => c.id !== id));
  }

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 rounded-lg text-[11.5px] text-stone-600 hover:bg-stone-50 hover:border-navy-500 transition-colors"
      >
        📜 Historique
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
              <div className="text-[13px] font-semibold text-navy-700">📜 Historique des conversations</div>
              <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-600 text-lg leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {history.length === 0 ? (
                <p className="text-[12px] text-stone-400 text-center py-8">Aucune conversation sauvegardée.<br/>Les conversations sont enregistrées automatiquement quand tu changes de module.</p>
              ) : (
                history.map(conv => (
                  <div key={conv.id} className="flex items-start gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200 hover:border-navy-500/40 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10.5px] font-semibold text-navy-700">{MODULES[conv.moduleId]?.label?.replace(/^CP\d+ — /, '') ?? conv.moduleId}</span>
                        <span className="text-[9.5px] text-stone-400">
                          {new Date(conv.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate">{conv.preview}…</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">{conv.messages.length} messages</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { onLoad(conv); setOpen(false); }}
                        className="text-[10px] px-2 py-1 bg-navy-700 text-white rounded transition-colors hover:bg-navy-800"
                      >
                        Charger
                      </button>
                      <button
                        onClick={() => remove(conv.id)}
                        className="text-[10px] px-2 py-1 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
