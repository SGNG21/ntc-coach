import { supabase } from './supabase';

const LS_KEYS = {
  score:        'ntc_score',
  parcours:     'ntc_parcours',
  game_stars:   'ntc_game_stars',
  game_xp:      'ntc_game_xp',
  exam_date:    'ntc_exam_date',
  chat_history: 'ntc_chat_history',
  streak:       'ntc_streak',
  srs:          'ntc_srs',
} as const;

function readLS() {
  const get = (k: string, fallback: unknown) => {
    try { return JSON.parse(localStorage.getItem(k) || 'null') ?? fallback; } catch { return fallback; }
  };
  return {
    score:        get(LS_KEYS.score,        { correct: 0, total: 0, byModule: {} }),
    parcours:     get(LS_KEYS.parcours,     {}),
    game_stars:   get(LS_KEYS.game_stars,   {}),
    game_xp:      parseInt(localStorage.getItem(LS_KEYS.game_xp) || '0', 10),
    exam_date:    localStorage.getItem(LS_KEYS.exam_date) || '',
    chat_history: get(LS_KEYS.chat_history, []),
    streak:       get(LS_KEYS.streak,       null),
    srs:          get(LS_KEYS.srs,          null),
  };
}

function writeLS(data: Awaited<ReturnType<typeof loadProfile>>) {
  if (!data) return;
  const set = (k: string, v: unknown) => {
    try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch { /* ignore */ }
  };
  set(LS_KEYS.score,        data.score);
  set(LS_KEYS.parcours,     data.parcours);
  set(LS_KEYS.game_stars,   data.game_stars);
  localStorage.setItem(LS_KEYS.game_xp, String(data.game_xp ?? 0));
  if (data.exam_date) localStorage.setItem(LS_KEYS.exam_date, data.exam_date);
  set(LS_KEYS.chat_history, data.chat_history);
  if (data.streak != null) set(LS_KEYS.streak, data.streak);
  if (data.srs    != null) set(LS_KEYS.srs,    data.srs);
}

export async function loadProfile(): Promise<null | {
  score: unknown; parcours: unknown; game_stars: unknown;
  game_xp: number; exam_date: string; chat_history: unknown;
  streak: unknown; srs: unknown;
}> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('score,parcours,game_stars,game_xp,exam_date,chat_history,streak,srs')
    .single();
  if (error || !data) return null;
  return data as ReturnType<typeof loadProfile> extends Promise<infer T> ? NonNullable<T> : never;
}

export async function syncFromCloud(): Promise<boolean> {
  const profile = await loadProfile();
  if (!profile) return false;
  writeLS(profile);
  window.dispatchEvent(new Event('storage'));
  return true;
}

export async function syncToCloud(): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const payload = { ...readLS(), updated_at: new Date().toISOString() };
  await supabase
    .from('user_profiles')
    .upsert({ id: user.id, ...payload }, { onConflict: 'id' });
}
