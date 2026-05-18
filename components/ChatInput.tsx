'use client';
import { useRef, useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: Props) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const txt = value.trim();
    if (!txt || disabled) return;
    onSend(txt);
    setValue('');
    if (ref.current) {
      ref.current.style.height = 'auto';
    }
  }

  return (
    <div className="flex gap-2 p-2 bg-white border-t border-stone-200 rounded-b-xl">
      <textarea
        ref={ref}
        value={value}
        onChange={e => {
          setValue(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
        }}
        onKeyDown={handleKey}
        disabled={disabled}
        placeholder={placeholder || 'Pose ta question ou réponds ici... (Entrée pour envoyer)'}
        rows={1}
        className="flex-1 resize-none border border-stone-200 rounded-lg px-3 py-2 text-[12.5px] font-sans outline-none bg-stone-50 text-stone-900 max-h-24 transition-colors focus:border-navy-500 focus:bg-white disabled:opacity-50"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="px-3 py-2 bg-navy-700 hover:bg-navy-900 disabled:bg-stone-200 disabled:text-stone-400 text-white rounded-lg transition-colors flex items-center gap-1.5 text-[12px] font-medium flex-shrink-0"
      >
        <Send size={13} />
        Envoyer
      </button>
    </div>
  );
}
