// Netlify Function: Proxy PandaScore (LoL matches running)
// Env var: PANDASCORE_TOKEN

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const token = process.env.PANDASCORE_TOKEN;
    if (!token) {
      return { statusCode: 500, body: 'Server misconfigured: missing PANDASCORE_TOKEN' };
    }

    const url = 'https://api.pandascore.co/lol/matches/running';

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    const headers = { 'Content-Type': 'application/json' };

    if (!res.ok) {
      return { statusCode: res.status, headers, body: JSON.stringify({ error: true, status: res.status, body: text }) };
    }

    return { statusCode: 200, headers, body: text };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: true, message: String(err && err.message || err) }) };
  }
};


