'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { streamChat } from '@/lib/stream';
import { ChatMessage, TypingIndicator } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { Message } from '@/types';

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `👋 Salut ! Je suis **Alex**, ton coach NTC.\n\nJe connais le **REAC 2024** sur le bout des doigts. Pose-moi n'importe quelle question sur :\n- Les compétences CP1 à CP9\n- Les épreuves CCF et la session finale\n- Les méthodes (CAP, CRAC, CROC, SONCAS...)\n- Le cadre juridique (RGPD, AGEC, loi Naegelen...)\n\nTu peux me demander des explications, des exemples ou de t'évaluer. **Tu vas décrocher ce titre ! 💪**`,
  timestamp: new Date(),
};

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  async function send(text: string) {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const history = [...messages, userMsg]
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));

    const aiId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, userMsg, { id: aiId, role: 'assistant', content: '', timestamp: new Date() }]);
    setLoading(true);

    let fullText = '';
    try {
      await streamChat(
        { messages: history, isChatbot: true },
        (chunk) => {
          fullText += chunk;
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullText } : m));
        }
      );
      if (!open) setUnread(n => n + 1);
    } catch {
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: '❌ Erreur de connexion. Vérifiez le serveur.' } : m));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setUnread(0); }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-navy-700 hover:bg-navy-900 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
          aria-label="Ouvrir le chat coach NTC"
        >
          <MessageCircle size={24} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Fenêtre chat */}
      {open && (
        <div
          className={`fixed z-50 bg-white shadow-2xl border border-stone-200 flex flex-col transition-all bottom-0 right-0 left-0 rounded-t-2xl sm:left-auto sm:bottom-6 sm:right-6 sm:rounded-2xl sm:w-[360px] ${
            minimized ? 'h-14' : 'h-[70vh] sm:h-[520px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-navy-700 rounded-t-2xl text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold font-mono">
                AX
              </div>
              <div>
                <div className="text-sm font-semibold leading-none">Alex — Coach NTC</div>
                <div className="text-[10px] opacity-70 mt-0.5">REAC 2024 · RNCP 39063</div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setMinimized(m => !m)}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Minimize2 size={13} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 bg-stone-50">
                {messages.map(m => (
                  <ChatMessage key={m.id} message={m} />
                ))}
                {loading && messages[messages.length - 1]?.role !== 'assistant' && <TypingIndicator />}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <ChatInput
                onSend={send}
                disabled={loading}
                placeholder="Pose ta question à Alex..."
              />
            </>
          )}
        </div>
      )}
    </>
  );
}
