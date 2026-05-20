'use client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { MainApp } from '@/components/MainApp';
import { LoginPage } from '@/components/LoginPage';
import { Chatbot } from '@/components/Chatbot';
import { syncFromCloud } from '@/lib/sync';

export default function Home() {
  const [user, setUser]           = useState<User | null>(null);
  const [displayName, setDisplay] = useState('');
  const [loading, setLoading]     = useState(true);

  async function loadDisplayName(u: User) {
    const name = u.user_metadata?.display_name as string | undefined;
    if (name) { setDisplay(name); return; }
    if (!supabase) return;
    const { data } = await supabase.from('user_profiles').select('display_name').single();
    if (data?.display_name) setDisplay(data.display_name as string);
    else setDisplay(u.email?.split('@')[0] ?? '');
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) { await syncFromCloud(); await loadDisplayName(u); }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) { await syncFromCloud(); await loadDisplayName(u); }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">📚</div>
          <div className="text-white text-[14px] font-semibold">Chargement…</div>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <main>
      <MainApp userId={user.id} userEmail={user.email} displayName={displayName} />
      <Chatbot />
    </main>
  );
}
