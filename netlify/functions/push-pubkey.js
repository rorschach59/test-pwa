// Netlify Function: retourne la clé publique VAPID pour l'abonnement Push

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: true, message: 'VAPID_PUBLIC_KEY manquant dans les variables d\'environnement Netlify.' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: JSON.stringify({ publicKey })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: true, message: String(err && err.message || err) }) };
  }
};


