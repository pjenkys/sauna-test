export function registerServiceWorker() {
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[PWA] Nová verze aplikace je k dispozici.');
                  } else {
                    console.log('[PWA] Aplikace je připravena pro offline použití.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn('[PWA] Chyba při registraci Service Workeru:', error);
        });
    });
  }
}
