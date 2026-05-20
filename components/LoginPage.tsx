'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'register' | 'reset';

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setMsg({ type: 'err', text: 'Supabase non configuré.' }); return; }
    setLoading(true);
    setMsg(null);

    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/?reset=1`,
      });
      setLoading(false);
      setMsg(error
        ? { type: 'err', text: error.message }
        : { type: 'ok', text: 'Email de réinitialisation envoyé !' }
      );
      return;
    }

    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) { setMsg({ type: 'err', text: error.message }); return; }
      setMsg({ type: 'ok', text: 'Compte créé ! Vérifie ton email pour confirmer.' });
      return;
    }

    // login
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMsg({ type: 'err', text: 'Email ou mot de passe incorrect.' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-[9px] font-bold bg-red-600 px-2 py-0.5 rounded uppercase tracking-wider text-white">Titre Pro</span>
            <span className="text-white text-[22px] font-bold">NTC Coach</span>
          </div>
          <p className="text-white/50 text-[12px]">REAC 2024 · RNCP 39063</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-stone-100">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setMsg(null); }}
                className={`flex-1 py-3 text-[12.5px] font-semibold transition-colors ${
                  mode === m ? 'text-navy-700 border-b-2 border-red-600' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {m === 'login' ? 'Se connecter' : 'Créer un compte'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="p-6 flex flex-col gap-4">
            {mode === 'register' && (
              <div>
                <label className="text-[11px] font-medium text-stone-500 mb-1 block">Prénom</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex : Lennie"
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-[13px] focus:border-navy-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-stone-500 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="ton@email.com"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-[13px] focus:border-navy-500 focus:outline-none"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="text-[11px] font-medium text-stone-500 mb-1 block">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="6 caractères minimum"
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-[13px] focus:border-navy-500 focus:outline-none"
                />
              </div>
            )}

            {msg && (
              <div className={`text-[12px] px-3 py-2 rounded-lg ${
                msg.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-stone-200 text-white rounded-xl font-semibold text-[13px] transition-colors"
            >
              {loading ? '⏳ Chargement…' : mode === 'login' ? 'Se connecter' : mode === 'register' ? 'Créer mon compte' : 'Envoyer le lien'}
            </button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => { setMode('reset'); setMsg(null); }}
                className="text-[11px] text-stone-400 hover:text-stone-600 text-center"
              >
                Mot de passe oublié ?
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-white/30 text-[10px] mt-6">
          Tes données sont sauvegardées en sécurité et synchronisées entre tes appareils.
        </p>
      </div>
    </div>
  );
}
