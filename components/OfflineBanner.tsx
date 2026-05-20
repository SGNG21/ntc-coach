'use client';
import { useState, useEffect } from 'react';

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 text-[12px] font-medium px-4 py-2 flex items-center justify-center gap-2 shadow-md">
      <span>📶</span>
      <span>Pas de connexion — certaines fonctionnalités IA sont indisponibles.</span>
    </div>
  );
}
