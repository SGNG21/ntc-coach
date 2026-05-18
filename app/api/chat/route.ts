import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildChatSystem, buildChatbotSystem, buildImportSystem } from '@/lib/prompts';
import type { ModuleId } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      moduleId,
      mode,
      extraContext,
      isChatbot = false,
      ccfSimMode,
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages requis' }, { status: 400 });
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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const text = response.content[0]?.type === 'text'
      ? response.content[0].text
      : '';

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur. Vérifiez votre clé API Anthropic.' },
      { status: 500 }
    );
  }
}
