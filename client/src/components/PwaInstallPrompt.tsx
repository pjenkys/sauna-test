import React, { useState, useEffect } from 'react';
import { Download, X, Share2, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalledSuccess, setIsInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Check if already installed in standalone mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return;
    }

    // 2. Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user previously dismissed in this session
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setTimeout(() => setIsVisible(true), 2500);
      }
    };

    // 4. Custom event to trigger installer from anywhere (e.g. Navbar or Footer)
    const handleTriggerManual = () => {
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalledSuccess(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    });
    window.addEventListener('open-pwa-install', handleTriggerManual);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleTriggerManual);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalledSuccess(true);
      }
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (isStandalone || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-16 sm:bottom-6 z-50 px-4 sm:px-6 pointer-events-none flex justify-center animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="pointer-events-auto w-full max-w-md bg-surface-container-high border border-outline-variant/80 rounded-[28px] p-5 shadow-elevation-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-elevation-1 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-on-surface">Nainstalovat Sauny ČR</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container text-on-primary-container">
                  PWA
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Přidejte si aplikaci na plochu pro bleskový start
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Zavřít"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Value propositions */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-1.5 bg-surface-container/60 p-2 rounded-xl">
            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Plně funkční offline</span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container/60 p-2 rounded-xl">
            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Bleskové spuštění z plochy</span>
          </div>
        </div>

        {/* Action button */}
        {deferredPrompt ? (
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-medium text-xs shadow-elevation-1 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalovat do mobilu</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-highest text-on-surface text-xs font-medium cursor-pointer transition-colors"
            >
              Později
            </button>
          </div>
        ) : isIOS ? (
          <div className="pt-2 border-t border-outline-variant/40 space-y-2 text-xs text-on-surface">
            <p className="font-semibold text-primary flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-primary" />
              <span>Postup instalace na iPhone / iPad (Safari):</span>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-on-surface-variant text-[11px] pl-1 font-medium">
              <li>Klepněte na spodní tlačítko <strong>Sdílet</strong> (čtvereček se šipkou nahoru)</li>
              <li>Sjeďte dolů a vyberte <strong>Přidat na plochu</strong> (Add to Home Screen)</li>
              <li>Potvrďte klepnutím na <strong>Přidat</strong> v pravém horním rohu</li>
            </ol>
            <button
              onClick={handleDismiss}
              className="w-full mt-2 py-2 rounded-full bg-surface-container hover:bg-surface-container-highest text-on-surface text-xs font-medium text-center cursor-pointer"
            >
              Rozumím
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                alert('Pro instalaci otevřete menu vašeho prohlížeče (tři tečky vpravo nahoře) a zvolte "Instalovat aplikaci" nebo "Přidat na plochu".');
                handleDismiss();
              }}
              className="flex-1 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-medium text-xs shadow-elevation-1 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalovat aplikaci</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-highest text-on-surface text-xs font-medium cursor-pointer"
            >
              Zavřít
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
