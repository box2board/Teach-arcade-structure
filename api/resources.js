// /api/resources.js — Vercel Serverless (Node 18+, ESM)
export const config = { runtime: 'nodejs18.x' };

/** Your Sheet ID (same one you put in the page data-* before) */
const SHEET_ID = '1dPJAi0dKjP6hWpgpNlA2M-2INar75-LxJ-fKEJjWslc';

/** Fetch a specific TAB as CSV using the public gviz endpoint */
async function fetchTabCSV(sheetId, tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Fetch failed ${r.status}`);
  return await r.text();
}

/** Minimal CSV parser (handles quotes, commas, newlines) -> [{...}] */
function parseCSV(text) {
  const rows = [];
  let i = 0, cell = '', row = [], inQ = false;

  const pushCell = () => { row.push(cell); cell = ''; };
  const pushRow  = () => { rows.push(row); row = []; };

  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i+1] === '"') { cell += '"'; i++; }
        else inQ = false;
      } else cell += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') pushCell();
      else if (ch === '\n') { pushCell(); pushRow(); }
      else if (ch !== '\r') cell += ch;
    }
    i++;
  }
  if (cell.length || row.length) { pushCell(); pushRow(); }
  if (!rows.length) return [];

  const headers = rows[0].map(h => String(h ?? '').trim().toLowerCase());
  return rows.slice(1).map(r => {
    const o = {};
    r.forEach((v, idx) => { o[headers[idx] || `col_${idx}`] = String(v ?? '').trim(); });
    return o;
  });
}

/** Normalize a row into a consistent shape without filtering anything out */
function normalize(row, tabName) {
  const https = (u) => {
    const s = String(u || '').trim();
    return s ? (/^https?:\/\//i.test(s) ? s : `https://${s}`) : '';
  };

  // Be flexible with headers: Title/Name, URL/Link, Type, Category, Grade, Tags, Description
  const title = row['title'] || row['name'] || '';
  const url   = row['url'] || row['link'] || '';
  const type  = row['type'] || '';
  const cat   = row['category'] || row['categories'] || '';
  const grade = row['grade'] || '';
  const tags  = (row['tags'] || '').split(',').map(t => t.trim()).filter(Boolean);
  const desc  = row['description'] || row['desc'] || '';

  return {
    topic   : tabName,
    title   : title,
    url     : https(url),
    type    : type,
    category: cat,
    grade   : grade,
    tags    : tags,
    desc    : desc
  };
}

export default async function handler(req, res) {
  try {
    // REQUIRED: ?tab=Exact Tab Name (e.g., Civil Rights)
    const tab = String(req.query.tab || '').trim();
    if (!tab) {
      res.status(400).json({ ok:false, error:'Missing ?tab=' });
      return;
    }

    // 1) Fetch that sheet tab
    const csv  = await fetchTabCSV(SHEET_ID, tab);

    // 2) Parse + normalize; keep rows that have at least title + url
    let items = parseCSV(csv).map(r => normalize(r, tab)).filter(r => r.title && r.url);

    // 3) Optional filters (q/category) if you ever need them
    const q   = String(req.query.q || '').trim().toLowerCase();
    const cat = String(req.query.category || '').trim().toLowerCase();
    if (q) {
      items = items.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.category||'').toLowerCase().includes(q) ||
        (r.type||'').toLowerCase().includes(q) ||
        (r.desc||'').toLowerCase().includes(q)
      );
    }
    if (cat) items = items.filter(r => (r.category||'').toLowerCase().includes(cat));

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
    res.status(200).json({ ok:true, count:items.length, items });
  } catch (err) {
    console.error('resources API error:', err);
    res.status(500).json({ ok:false, error:'Failed to load sheet tab' });
  }
}
