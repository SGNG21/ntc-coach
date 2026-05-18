import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { MODULES } from '@/lib/reac-data';
import type { ModuleId, ExoMode } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPTS: Record<ExoMode, (mod: string, label: string, criteres: string[]) => string> = {
  qcm: (_, label, criteres) => `Génère un QCM de 4 questions sur "${label}" pour le Titre Pro NTC, calibré sur les critères CCF officiels du REAC 2024 : ${criteres.join(', ')}.
Retourne UNIQUEMENT ce JSON (aucun texte avant ou après) :
{"questions":[{"q":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"A","explanation":"...","critere":"critère REAC visé"}]}`,

  redaction: (_, label, criteres) => `Génère une question ouverte style CCF NTC sur "${label}". Base-toi sur ces critères REAC : ${criteres.join(', ')}.
Retourne UNIQUEMENT ce JSON :
{"type":"redaction","question":"...","contexte":"contexte BtoB réaliste","points_attendus":["...","...","..."],"criteres_reac":["..."],"correction_exemple":"..."}`,

  situation: (_, label, criteres) => `Génère un cas d'entreprise BtoB style CCF NTC sur "${label}". 3 questions liées aux critères REAC : ${criteres.slice(0,3).join(', ')}.
Retourne UNIQUEMENT ce JSON :
{"type":"situation","entreprise":"...","secteur":"...","contexte":"...","questions":[{"q":"...","critere_reac":"...","correction":"..."}]}`,

  grille: (_, label, criteres) => `Génère une grille d'auto-évaluation sur "${label}" avec les critères officiels du REAC 2024. Chaque critère = une question pratique concrète.
Retourne UNIQUEMENT ce JSON :
{"type":"grille","titre":"${label}","criteres":[{"critere_officiel":"...","question_pratique":"...","indicateurs":["...","..."]}]}`,
};

export async function POST(req: NextRequest) {
  try {
    const { moduleId, mode } = await req.json() as { moduleId: ModuleId; mode: ExoMode };

    const mod = MODULES[moduleId];
    if (!mod) {
      return NextResponse.json({ error: 'Module inconnu' }, { status: 400 });
    }

    const promptFn = PROMPTS[mode];
    if (!promptFn) {
      return NextResponse.json({ error: 'Mode inconnu' }, { status: 400 });
    }

    const prompt = promptFn('', mod.label, mod.criteres);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
    const clean = raw.replace(/```json|```/g, '').trim();

    try {
      const parsed = JSON.parse(clean);
      return NextResponse.json({ exercise: parsed });
    } catch {
      return NextResponse.json(
        { error: 'Réponse JSON invalide de l\'IA', raw },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Generate exercise error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
