// /api/resources.js  (Vercel Serverless Function, Node 18+, ESM)
export const config = { runtime: 'nodejs18.x' };

/** Your public Google Sheet ID (from your existing pages) */
const SHEET_ID = '1dPJAi0dKjP6hWpgpNlA2M-2INar75-LxJ-fKEJjWslc';

/** Fetch a sheet tab by name as CSV using the gviz endpoint */
async function fetchTabCSV(sheetId, tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Google Sheets fetch failed: ${r.status}`);
  return await r.text();
}

/** Minimal CSV parser that respects quotes */
function parseCSV(text) {
  const rows = [];
  let i = 0, cell = '', row = [], inQ = false;
  const pushCell = () => { row.push(cell); cell = ''; };
  const pushRow  = () => { rows.push(row); row = []; };

  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i+1] === '"') { cell += '"'; i++; } else { inQ = false; }
      } else { cell += ch; }
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') pushCell();
      else if (ch === '\r') { /* ignore */ }
      else if (ch === '\n') { pushCell(); pushRow(); }
      else cell += ch;
    }
    i++;
  }
  if (cell.length || row.length) { pushCell(); pushRow(); }

  if (!rows.length) return [];

  const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const obj = {};
    rows[r].forEach((val, idx) => {
      obj[headers[idx] || `col_${idx}`] = String(val || '').trim();
    });
    out.push(obj);
  }
  return out;
}

/** Normalize one row to our API shape */
function normalize(row, topicName) {
  const title = row['title'] || row['name'] || '';
  const url   = row['url']   || row['link'] || '';
  const type  = row['type']  || '';
  const cat   = row['category'] || row['categories'] || '';
  const https = url ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : '';

  return {
    subject: 'social-studies',
    topic  : topicName,
    title  : title,
    url    : https,
    type   : type,
    category: cat
  };
}

export default async function handler(req, res) {
  try {
    // Required: ?tab= (sheet tab name, e.g., "Civil Rights")
    const tab = (req.query.tab || req.query.topic || '').toString().trim();
    if (!tab) return res.status(400).json({ ok:false, error:'Missing ?tab=' });

    const csv  = await fetchTabCSV(SHEET_ID, tab);
    const rows = parseCSV(csv).map(r => normalize(r, tab)).filter(r => r.title && r.url);

    // Optional text filter ?q=
    const q = (req.query.q || '').toString().trim().toLowerCase();
    const items = q
      ? rows.filter(r =>
          (r.title||'').toLowerCase().includes(q) ||
          (r.category||'').toLowerCase().includes(q) ||
          (r.type||'').toLowerCase().includes(q)
        )
      : rows;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
    res.status(200).json({ ok:true, count:items.length, items });
  } catch (err) {
    console.error('resources API error:', err);
    res.status(500).json({ ok:false, error:'Failed to load sheet/tab' });
  }
}
