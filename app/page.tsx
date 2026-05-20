'use client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { MainApp } from '@/components/MainApp';
import { LoginPage } from '@/components/LoginPage';
import { Chatbot } from '@/components/Chatbot';
import { syncFromCloud } from '@/lib/sync';

export default function Home() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // Charger les données cloud dans localStorage au login
        await syncFromCloud();
      }
    });

    return () => subscription.unsubscribe();
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
      <MainApp userId={user.id} userEmail={user.email} />
      <Chatbot />
    </main>
  );
}
