// Netlify Function: enregistre un abonnement Push dans Netlify Blobs
// Requiert: @netlify/blobs (configurée dans package.json)

const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

function subscriptionId(sub) {
  const endpoint = sub && sub.endpoint ? String(sub.endpoint) : Math.random().toString(36).slice(2);
  return crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 32);
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) { body = {}; }
    const sub = body.subscription || body;
    if (!sub || !sub.endpoint) {
      return { statusCode: 400, body: JSON.stringify({ error: true, message: 'subscription manquant' }) };
    }

    const id = subscriptionId(sub);
    const store = getStore('push-subs');
    const key = `subs/${id}.json`;
    await store.setJSON(key, { id, subscription: sub, createdAt: new Date().toISOString() });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: true, message: String(err && err.message || err) }) };
  }
};


