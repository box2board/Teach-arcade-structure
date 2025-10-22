// /api/resources.js - Vercel Edge Function to cache Google Sheets GViz
export const config = { runtime: 'edge' };

const ALLOWED_SHEETS = new Set([
  // whitelist public sheet IDs you actually use
  '1dPJAi0dKjP6hWpgpNlA2M-2INar75-LxJ-fKEJjWslc'
]);

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const sheet = url.searchParams.get('sheet') || '';
    const tab   = url.searchParams.get('tab')   || '';

    if (!ALLOWED_SHEETS.has(sheet) || !tab) {
      return json({ error: 'invalid-params' }, 400);
    }

    const gviz = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheet)}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`;

    // Fetch with small upstream timeout
    const res = await fetch(gviz, { cache: 'no-store', headers: { 'User-Agent': 'TeachArcadeBot/1.0' } });
    const text = await res.text();

    // Extract JSON from GViz wrapper
    const start = text.indexOf('{');
    const end   = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Unexpected GViz format');
    const json = JSON.parse(text.slice(start, end + 1));
    const rows = Array.isArray(json?.table?.rows) ? json.table.rows : [];

    // Normalize into a small, stable shape
    const data = rows
      .map(r => r?.c || [])
      .map(c => ({
        title:    toStr(c[0]?.v),
        type:     toStr(c[1]?.v),
        category: toStr(c[2]?.v),
        url:      toUrl(c[3]?.v)
      }))
      .filter(r => r.title && r.title.toLowerCase() !== 'title' && r.url);

    // Cache at edge for 5 minutes, allow browsers to re-use for 60s
    return json({ ok: true, data }, 200, {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600, max-age=60'
    });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500, {
      'Cache-Control': 'no-store'
    });
  }
}

function toStr(v) { return v == null ? '' : String(v); }
function toUrl(v) {
  const s = toStr(v).trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : 'https://' + s;
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      ...headers
    }
  });
}
