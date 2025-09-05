let deferredPrompt;
const installBtn = document.getElementById('installBtn');
const statusEl = document.getElementById('status');
const enableBtn = document.getElementById('enableNotificationsBtn');
const testBtn = document.getElementById('testNotificationBtn');
const updateBtn = document.getElementById('updateBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.hidden = false;
  if (statusEl) statusEl.textContent = 'Installation disponible';
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (statusEl) statusEl.textContent = `Choix: ${outcome}`;
  deferredPrompt = null;
  installBtn.hidden = true;
});

// Demande d'autorisation et notification à chaque visite
document.addEventListener('DOMContentLoaded', () => {
  const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  const isiOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  if (!('Notification' in window)) return;

  // iOS: ne demande que si installé et via geste utilisateur
  if (isiOS && !isStandalone) {
    if (statusEl) statusEl.textContent = 'Installez l\'application pour activer les notifications.';
    return;
  }

  // Afficher le bouton pour déclencher la demande
  if (Notification.permission !== 'granted') {
    if (enableBtn) enableBtn.hidden = false;
  } else {
    // Permission déjà accordée → notifier à chaque visite
    navigator.serviceWorker?.ready.then(reg => {
      reg.showNotification('Bienvenue 👋', { body: 'Visite détectée sur la PWA' }).catch(() => {});
    });
    if (testBtn) testBtn.hidden = false;
  }

  // Détection nouvelle version du SW
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;
      // Ecoute de l'updatefound
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            if (updateBtn) updateBtn.hidden = false;
            if (statusEl) statusEl.textContent = 'Nouvelle version disponible';
          }
        });
      });

      // Vérifier si un SW en attente existe déjà
      if (reg.waiting && navigator.serviceWorker.controller) {
        if (updateBtn) updateBtn.hidden = false;
        if (statusEl) statusEl.textContent = 'Nouvelle version disponible';
      }
    });
  }
});

enableBtn?.addEventListener('click', async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const reg = await navigator.serviceWorker?.ready;
      await reg?.showNotification('Notifications activées ✅', { body: 'Vous recevrez une notification à chaque visite.' });
      if (enableBtn) enableBtn.hidden = true;
      if (testBtn) testBtn.hidden = false;
    }
  } catch (_) {}
});

testBtn?.addEventListener('click', async () => {
  try {
    const reg = await navigator.serviceWorker?.ready;
    await reg?.showNotification('Notification test 🔔', { body: 'Ceci est un test manuel.' });
  } catch (_) {}
});

updateBtn?.addEventListener('click', async () => {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const waiting = reg?.waiting;
    if (waiting) {
      waiting.postMessage({ type: 'SKIP_WAITING' });
      // Quand le nouveau SW prend le contrôle, on recharge
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  } catch (_) {}
});


