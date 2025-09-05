// Netlify Function: Agrégateur LoL (running/upcoming/past) + enrichissement équipes
// Variables d'env requises:
// - PANDASCORE_TOKEN: token d'API PandaScore
// - USE_MOCKS=true (optionnel) pour utiliser les payloads locaux sous ./payloads

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://api.pandascore.co';

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const useMocks = String(process.env.USE_MOCKS || '').toLowerCase() === 'true';
    const token = process.env.PANDASCORE_TOKEN;

    const perPage = Number(new URLSearchParams(event.queryStringParameters || {}).get('per_page') || 25);

    const getJSON = async (url) => {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status} for ${url}: ${t}`);
      }
      return res.json();
    };

    const readMock = async (filename) => {
      const p = path.join(process.cwd(), 'payloads', filename);
      if (!fs.existsSync(p)) return null;
      const txt = await fs.promises.readFile(p, 'utf8');
      try {
        const json = JSON.parse(txt);
        // Les fichiers fournis peuvent contenir un objet unique; on homogénéise en tableau
        return Array.isArray(json) ? json : [json];
      } catch {
        return null;
      }
    };

    const fetchMatches = async () => {
      if (useMocks) {
        const running = (await readMock('lol-matches-running')) || [];
        const upcoming = []; // pas de mock fourni
        const past = (await readMock('lol-matches')) || [];
        return { running, upcoming, past };
      }
      if (!token) throw new Error('Missing PANDASCORE_TOKEN');
      const [running, upcoming, past] = await Promise.all([
        getJSON(`${API_BASE}/lol/matches/running?per_page=${perPage}`),
        getJSON(`${API_BASE}/lol/matches/upcoming?per_page=${perPage}`),
        getJSON(`${API_BASE}/lol/matches/past?per_page=${perPage}`),
      ]);
      return { running, upcoming, past };
    };

    const fetchTeam = async (teamId) => {
      if (!teamId) return null;
      if (useMocks) {
        const mock = await readMock(`teams-${teamId}`);
        return mock && mock[0] ? mock[0] : null;
      }
      const url = `${API_BASE}/teams/${teamId}`;
      return getJSON(url);
    };

    const enrichMatches = async (matches) => {
      if (!matches || matches.length === 0) return [];
      // Collecte des IDs
      const teamIds = new Set();
      for (const m of matches) {
        if (m?.opponents) {
          for (const o of m.opponents) {
            const id = o?.opponent?.id;
            if (id) teamIds.add(id);
          }
        }
        if (m?.winner_id) teamIds.add(m.winner_id);
      }
      // Récupération des équipes en parallèle
      const idList = Array.from(teamIds);
      const teams = await Promise.all(idList.map((id) => fetchTeam(id).then(t => ({ id, team: t })).catch(() => ({ id, team: null }))));
      const byId = new Map(teams.map(({ id, team }) => [id, team]));

      // Enrichissement
      return matches.map((m) => {
        const opponents = Array.isArray(m?.opponents) ? m.opponents.map((o) => {
          const team = o?.opponent?.id ? byId.get(o.opponent.id) : null;
          return {
            id: o?.opponent?.id || null,
            name: team?.name || o?.opponent?.name || null,
            acronym: team?.acronym || null,
            image_url: team?.image_url || null,
          };
        }) : [];

        const winner = m?.winner_id ? byId.get(m.winner_id) : null;

        return {
          id: m.id,
          name: m.name,
          status: m.status,
          begin_at: m.begin_at || m.scheduled_at || null,
          number_of_games: m.number_of_games || null,
          tournament: m.tournament ? { id: m.tournament.id, name: m.tournament.name, slug: m.tournament.slug } : null,
          serie: m.serie ? { id: m.serie.id, name: m.serie.name, full_name: m.serie.full_name } : null,
          league: m.league ? { id: m.league.id, name: m.league.name, slug: m.league.slug } : null,
          opponents,
          winner: winner ? { id: m.winner_id, name: winner.name, acronym: winner.acronym, image_url: winner.image_url } : null,
          results: m.results || null,
          streams_list: m.streams_list || null,
        };
      });
    };

    const { running, upcoming, past } = await fetchMatches();
    const [runningE, upcomingE, pastE] = await Promise.all([
      enrichMatches(running),
      enrichMatches(upcoming),
      enrichMatches(past),
    ]);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ running: runningE, upcoming: upcomingE, past: pastE }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: true, message: String(err && err.message || err) }) };
  }
};


