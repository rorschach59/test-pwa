// Netlify Function: envoie un push à un endpoint d'abonnement Web Push
// Variables d'env requises: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:... ou https://...)

const webpush = require('web-push');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
      return { statusCode: 500, body: JSON.stringify({ error: true, message: 'Variables VAPID manquantes.' }) };
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (_) {
      payload = {};
    }

    const { subscription, title, body, data } = payload;
    if (!subscription || !subscription.endpoint) {
      return { statusCode: 400, body: JSON.stringify({ error: true, message: 'subscription invalide' }) };
    }

    const notif = {
      title: title || 'Test Push 🔔',
      body: body || 'Notification de test envoyée par le serveur',
      data: data || { url: '/' },
    };

    await webpush.sendNotification(subscription, JSON.stringify(notif));

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    const status = err && err.statusCode || 500;
    return { statusCode: status, body: JSON.stringify({ error: true, message: String(err && err.message || err) }) };
  }
};


