let deferredPrompt;
const installBtn = document.getElementById('installBtn');
const statusEl = document.getElementById('status');
const enableBtn = document.getElementById('enableNotificationsBtn');
const testBtn = document.getElementById('testNotificationBtn');
const updateBtn = document.getElementById('updateBtn');
const fetchPandaBtn = document.getElementById('fetchPandaBtn');
const apiResult = document.getElementById('apiResult');
const fetchLolFeedBtn = document.getElementById('fetchLolFeedBtn');
const lolRunning = document.getElementById('lolRunning');
const lolUpcoming = document.getElementById('lolUpcoming');
const lolPast = document.getElementById('lolPast');

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

fetchLolFeedBtn?.addEventListener('click', async () => {
  try {
    const res = await fetch('/.netlify/functions/lol-feed');
    const data = await res.json();
    renderFeed(data);
  } catch (e) {
    console.error('Erreur lol-feed:', e);
  }
});

function renderFeed(data) {
  renderList(lolRunning, data?.running || []);
  renderList(lolUpcoming, data?.upcoming || []);
  renderList(lolPast, data?.past || []);
}

function renderList(container, matches) {
  if (!container) return;
  if (!Array.isArray(matches)) { container.innerHTML = '<div>Aucune donnée</div>'; return; }
  container.innerHTML = matches.map(m => renderCard(m)).join('');
}

function formatDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function renderCard(m) {
  const oppA = m.opponents?.[0] || null;
  const oppB = m.opponents?.[1] || null;
  const scoreA = m.results?.[0]?.score ?? '';
  const scoreB = m.results?.[1]?.score ?? '';
  const live = (m.status || '').toLowerCase() === 'running';
  const primaryStream = Array.isArray(m.streams_list) ? m.streams_list.find(s => s.main) : null;
  const leagueLabel = m.league?.name ? escapeHtml(m.league.name) : '';
  const serieLabel = m.serie?.full_name ? escapeHtml(m.serie.full_name) : '';
  return `
    <div class="card">
      <div class="title">${escapeHtml(m.name || '')}</div>
      <div class="meta">
        ${leagueLabel}${serieLabel ? ' · ' + serieLabel : ''}${m.number_of_games ? ' · BO' + m.number_of_games : ''}
      </div>
      <div class="teams">
        <div class="team">
          <img src="${oppA?.image_url || ''}" alt="" />
          <span>${escapeHtml(oppA?.acronym || oppA?.name || 'TBD')}</span>
        </div>
        <div class="score">${scoreA} : ${scoreB}</div>
        <div class="team" style="justify-content:flex-end;">
          <span>${escapeHtml(oppB?.acronym || oppB?.name || 'TBD')}</span>
          <img src="${oppB?.image_url || ''}" alt="" />
        </div>
      </div>
      <div class="status">${live ? '<span class="badge badge-live">LIVE</span> · ' : ''}${escapeHtml(m.status || '')} · ${formatDate(m.begin_at)}</div>
      ${primaryStream ? `<div class="actions"><a class="watch-link" href="${primaryStream.raw_url || primaryStream.embed_url}" target="_blank" rel="noopener noreferrer">Regarder</a></div>` : ''}
    </div>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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
    if (window.WonderPush && Array.isArray(window.WonderPush)) {
      window.WonderPush.push(["subscribe"]);
      if (enableBtn) enableBtn.disabled = true;
    } else {
      // Fallback: demande de permission native
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const reg = await navigator.serviceWorker?.ready;
        await reg?.showNotification('Notifications activées ✅', { body: 'Vous recevrez une notification à chaque visite.' });
        if (enableBtn) enableBtn.hidden = true;
        if (testBtn) testBtn.hidden = false;
      }
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

fetchPandaBtn?.addEventListener('click', async () => {
  try {
    if (apiResult) apiResult.textContent = 'Chargement...';
    const res = await fetch('/.netlify/functions/pandascore-running');
    const text = await res.text();
    if (apiResult) apiResult.textContent = text;
  } catch (e) {
    if (apiResult) apiResult.textContent = 'Erreur: ' + String(e);
  }
});


