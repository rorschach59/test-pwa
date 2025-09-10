// Netlify Scheduled Function: envoie un push à tous les abonnements stockés
// Cron défini dans netlify.toml (*/5 * * * *)

let getStore;
const webpush = require('web-push');

exports.handler = async () => {
  try {
    if (!getStore) {
      ({ getStore } = await import('@netlify/blobs'));
    }
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
      return { statusCode: 500, body: 'Variables VAPID manquantes' };
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const store = getStore('push-subs');
    const toDelete = [];
    const { blobs } = await store.list({ prefix: 'subs/' });
    const now = new Date().toLocaleTimeString();

    const results = [];
    for (const b of blobs) {
      try {
        const rec = await store.getJSON(b.key);
        if (!rec || !rec.subscription) { toDelete.push(b.key); continue; }
        const payload = {
          title: 'Ping 5 min 🔔',
          body: `Test périodique (${now})`,
          data: { url: '/' },
        };
        await webpush.sendNotification(rec.subscription, JSON.stringify(payload));
        results.push({ key: b.key, ok: true });
      } catch (err) {
        const status = err && err.statusCode;
        if (status === 404 || status === 410) {
          toDelete.push(b.key);
        }
        results.push({ key: b.key, ok: false, error: String(err && err.message || err) });
      }
    }

    for (const key of toDelete) {
      try { await store.delete(key); } catch (_) {}
    }

    return { statusCode: 200, body: JSON.stringify({ sent: results.length, deleted: toDelete.length }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: true, message: String(err && err.message || err) }) };
  }
};


