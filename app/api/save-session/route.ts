import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, messages, score, moduleId } = await req.json();

    const db = supabaseAdmin();

    if (sessionId) {
      // Update session existante
      const { error } = await db
        .from('sessions')
        .update({
          messages,
          score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
      return NextResponse.json({ sessionId });
    } else {
      // Créer nouvelle session
      const { data, error } = await db
        .from('sessions')
        .insert({
          module_id: moduleId,
          messages,
          score,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      return NextResponse.json({ sessionId: data.id });
    }
  } catch (error) {
    console.error('Save session error:', error);
    return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = supabaseAdmin();

    // Récupérer stats globales de progression
    const { data, error } = await db
      .from('sessions')
      .select('module_id, score')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Calculer progression par module
    const progression: Record<string, { correct: number; total: number }> = {};
    for (const session of (data || [])) {
      const mod = session.module_id;
      if (!progression[mod]) progression[mod] = { correct: 0, total: 0 };
      const s = session.score as { correct: number; total: number };
      if (s) {
        progression[mod].correct += s.correct || 0;
        progression[mod].total += s.total || 0;
      }
    }

    return NextResponse.json({ progression });
  } catch (error) {
    console.error('Get progression error:', error);
    return NextResponse.json({ error: 'Erreur lecture' }, { status: 500 });
  }
}
