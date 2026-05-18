import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ECM_MATIERES } from '@/lib/ecm-data';
import type { EcmId } from '@/lib/ecm-data';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const JSON_SCHEMA = `{
  "fiche": [{ "title": "emoji + titre section", "def": "définition courte ou null", "body": "<ul><li><strong>terme</strong> : explication</li></ul>" }],
  "quiz": [{ "q": "Question ?", "opts": ["A", "B", "C", "D"], "ok": 0, "fb": "✅ Explication de la bonne réponse." }]
}`;

function buildPrompt(action: string, matiere: (typeof ECM_MATIERES)[EcmId], courseText?: string): string {
  const prog = matiere.programme.map(p => `${p.title}: ${p.points.join(' | ')}`).join('\n');

  if (action === 'generate_content') {
    return `Tu es un formateur expert en ${matiere.label} pour des étudiants en Titre Pro NTC (RNCP 39063).

Programme officiel de la matière :
${prog}

Objectifs pédagogiques :
${matiere.objectifs.join('\n')}

Génère une fiche de révision complète (5 à 7 sections) et 8 questions de quiz sur ce programme.

Retourne UNIQUEMENT ce JSON valide, sans aucun texte avant ou après, sans backticks :
${JSON_SCHEMA}

Règles :
- fiche : 5 à 7 sections, couvrir tous les objectifs, body en HTML avec <ul><li><strong>terme</strong> : explication</li></ul>
- quiz : exactement 8 questions variées couvrant tout le programme, ok = index 0-3 de la bonne réponse
- Niveau adapté à une étudiante en formation professionnelle commerciale
- Utiliser des exemples concrets et pratiques terrain`;
  }

  if (action === 'import_course') {
    return `Tu es un formateur expert. Une étudiante te soumet son cours personnel sur ${matiere.label}.

Cours de l'étudiante :
${(courseText || '').substring(0, 6000)}

Génère une fiche de révision synthétique (4 à 6 sections) et 5 questions de quiz BASÉES SUR SON COURS.

Retourne UNIQUEMENT ce JSON valide, sans aucun texte avant ou après, sans backticks :
${JSON_SCHEMA}

Règles :
- Utilise les termes et exemples exacts du cours fourni
- fiche : 4 à 6 sections couvrant les points clés du cours
- quiz : exactement 5 questions tirées directement du cours
- ok = index 0-3 de la bonne réponse dans opts`;
  }

  if (action === 'quiz_only') {
    return `Tu es un formateur expert en ${matiere.label}.

Programme : ${prog}

Génère 5 nouvelles questions de quiz supplémentaires sur des aspects différents du programme.

Retourne UNIQUEMENT ce JSON valide, sans aucun texte avant ou après, sans backticks :
{ "quiz": [{ "q": "Question ?", "opts": ["A", "B", "C", "D"], "ok": 0, "fb": "✅ Explication." }] }

Règles :
- Exactement 5 questions, toutes différentes et variées
- ok = index 0-3 de la bonne réponse
- Feedback détaillé et pédagogique pour chaque question`;
  }

  return '';
}

export async function POST(req: NextRequest) {
  try {
    const { ecmId, action, courseText } = await req.json() as {
      ecmId: EcmId;
      action: 'generate_content' | 'import_course' | 'quiz_only';
      courseText?: string;
    };

    const matiere = ECM_MATIERES[ecmId];
    if (!matiere) {
      return NextResponse.json({ error: 'Matière inconnue' }, { status: 400 });
    }

    const prompt = buildPrompt(action, matiere, courseText);
    if (!prompt) {
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('ECM no JSON in response:', raw.substring(0, 300));
      return NextResponse.json({ error: 'Pas de JSON dans la réponse IA' }, { status: 500 });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ content: parsed });
    } catch (parseErr) {
      console.error('ECM JSON parse error:', parseErr, jsonMatch[0].substring(0, 300));
      return NextResponse.json({ error: 'JSON invalide dans la réponse IA' }, { status: 500 });
    }
  } catch (error) {
    console.error('ECM API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
