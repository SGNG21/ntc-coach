'use client';
import { memo } from 'react';
import type { Message } from '@/types';

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*?<\/li>(\n|$))+/gs, (match) => `<ul>${match}</ul>`)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

interface Props {
  message: Message;
  isLast?: boolean;
}

export const ChatMessage = memo(function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2.5 max-w-[90%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0 mt-0.5 ${
          isUser ? 'bg-[#c0392b] text-white' : 'bg-navy-700 text-white'
        }`}
      >
        {isUser ? 'MOI' : 'AX'}
      </div>

      {/* Bubble */}
      <div
        className={`px-3 py-2.5 rounded-xl text-[12.5px] leading-relaxed prose-chat ${
          isUser
            ? 'bg-navy-700 text-white rounded-tr-sm'
            : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm shadow-sm'
        }`}
        dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
      />
    </div>
  );
});

export function TypingIndicator() {
  return (
    <div className="flex gap-2.5 self-start">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0 bg-navy-700 text-white">
        AX
      </div>
      <div className="px-3 py-3 bg-white border border-stone-200 rounded-xl rounded-tl-sm shadow-sm">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="typing-dot w-1.5 h-1.5 bg-stone-400 rounded-full block"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
