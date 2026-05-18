'use client';
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'chrome' | 'ios' | 'mac-safari' | null;

export function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Déjà installée en standalone → ne rien afficher
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Déjà refusée récemment (7 jours)
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 86400000) return;

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
    const isMacSafari = /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
    const isChromeLike = /Chrome|CriOS|Edg/.test(ua) && !/Safari/.test(ua.replace(/Chrome[^\s]*/,''));

    if (isIOS) {
      setPlatform('ios');
      setTimeout(() => setVisible(true), 4000);
    } else if (isMacSafari) {
      setPlatform('mac-safari');
      setTimeout(() => setVisible(true), 4000);
    } else {
      // Chrome/Edge — attend l'événement beforeinstallprompt
      const handler = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e as BeforeInstallPromptEvent);
        setPlatform('chrome');
        setVisible(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  function dismiss() {
    localStorage.setItem('pwa-dismissed', Date.now().toString());
    setVisible(false);
  }

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setInstallPrompt(null);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-40 bg-navy-700 text-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Chrome / Edge / Android */}
      {platform === 'chrome' && (
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-2xl flex-shrink-0">📱</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[13px]">Installer l&apos;appli</div>
            <div className="text-[11px] text-white/70 mt-0.5">Accès direct depuis ton bureau ou téléphone</div>
          </div>
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button
              onClick={install}
              className="px-3 py-1.5 bg-white text-navy-700 rounded-lg text-[11.5px] font-bold hover:bg-stone-100 transition-colors"
            >
              Installer
            </button>
            <button onClick={dismiss} className="text-white/50 hover:text-white text-[10.5px] text-center transition-colors">
              Plus tard
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari */}
      {platform === 'ios' && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-[13px]">📱 Installer l&apos;appli</div>
            <button onClick={dismiss} className="text-white/50 hover:text-white text-xl leading-none transition-colors">×</button>
          </div>
          <ol className="space-y-2 text-[12px] text-white/90">
            <li className="flex gap-2 items-start">
              <span className="font-bold text-red-400 flex-shrink-0">1.</span>
              <span>Appuie sur <strong>l&apos;icône Partager</strong> <span className="inline-block">⬆️</span> en bas de Safari</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="font-bold text-red-400 flex-shrink-0">2.</span>
              <span>Défile et appuie sur <strong>« Sur l&apos;écran d&apos;accueil »</strong></span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="font-bold text-red-400 flex-shrink-0">3.</span>
              <span>Appuie sur <strong>Ajouter</strong></span>
            </li>
          </ol>
          <button onClick={dismiss} className="mt-3 w-full py-2 rounded-xl bg-white/15 hover:bg-white/25 text-[12px] font-medium transition-colors">
            Compris ✓
          </button>
        </div>
      )}

      {/* Mac Safari */}
      {platform === 'mac-safari' && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-[13px]">💻 Installer l&apos;appli</div>
            <button onClick={dismiss} className="text-white/50 hover:text-white text-xl leading-none transition-colors">×</button>
          </div>
          <ol className="space-y-2 text-[12px] text-white/90">
            <li className="flex gap-2 items-start">
              <span className="font-bold text-red-400 flex-shrink-0">1.</span>
              <span>Dans Safari, menu <strong>Fichier</strong></span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="font-bold text-red-400 flex-shrink-0">2.</span>
              <span>Clique sur <strong>« Ajouter au Dock… »</strong></span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="font-bold text-red-400 flex-shrink-0">3.</span>
              <span>Ou dans Chrome : icône <strong>⊕</strong> dans la barre d&apos;adresse</span>
            </li>
          </ol>
          <button onClick={dismiss} className="mt-3 w-full py-2 rounded-xl bg-white/15 hover:bg-white/25 text-[12px] font-medium transition-colors">
            Compris ✓
          </button>
        </div>
      )}
    </div>
  );
}
