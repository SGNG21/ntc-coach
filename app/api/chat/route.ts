import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildChatSystem, buildChatbotSystem, buildImportSystem } from '@/lib/prompts';
import type { ModuleId } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, moduleId, mode, extraContext, isChatbot = false, ccfSimMode } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages requis' }), { status: 400 });
    }

    let system: string;
    if (isChatbot) {
      system = buildChatbotSystem();
    } else if (ccfSimMode) {
      const { CCF_SIMULATION_SYSTEMS } = await import('@/lib/reac-data');
      system = CCF_SIMULATION_SYSTEMS[ccfSimMode] || buildChatbotSystem();
    } else if (mode === 'import') {
      system = buildImportSystem();
    } else {
      system = buildChatSystem(moduleId as ModuleId, mode, extraContext);
    }

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }
}
