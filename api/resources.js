// /api/resources.js  (Vercel Serverless Function, Node 18+, ESM)

// Pin Node runtime (works on Vercel)
export const config = { runtime: 'nodejs18.x' };

/** <<< YOUR PUBLIC SHEET ID >>> */
const SHEET_ID = '1dPJAi0dKjP6hWpgpNlA2M-2INar75-LxJ-fKEJjWslc';

/** Fetch a tab (sheet) as CSV from Google Sheets gviz */
async function fetchTabCSV(sheetId, tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Fetch failed ${r.status} ${r.statusText}`);
  return await r.text();
}

/** Minimal CSV parser that respects quotes and commas */
function parseCSV(text) {
  // Remove BOM if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const rows = [];
  let i = 0, cur = '', inQ = false, row = [];
  const pushCell = () => { row.push(cur); cur = ''; };
  const pushRow  = () => { rows.push(row); row = []; };

  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') pushCell();
      else if (ch === '\r') { /* ignore */ }
      else if (ch === '\n') { pushCell(); pushRow(); }
      else cur += ch;
    }
    i++;
  }
  if (cur.length || row.length) { pushCell(); pushRow(); }

  if (!rows.length) return [];
  // Lowercase/trim headers; collapse spaces
  const headers = rows[0].map(h => String(h || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim());

  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const obj = {};
    rows[r].forEach((val, idx) => {
      obj[headers[idx] || `col_${idx}`] = String(val ?? '').trim();
    });
    // skip completely empty lines
    if (Object.values(obj).some(v => v)) out.push(obj);
  }
  return out;
}

/** Get value by trying multiple possible header keys */
function getFirst(row, keys) {
  for (const k of keys) {
    if (row[k] && String(row[k]).trim()) return String(row[k]).trim();
  }
  return '';
}

/** Normalize a row from the CSV to our public API shape */
function normalize(row, topicName) {
  const title = getFirst(row, [
    'title','name','resource title','resource','item','lesson title'
  ]);

  const url   = getFirst(row, [
    'url','link','website','weblink','resource link'
  ]);

  const type  = getFirst(row, [
    'type','resource type','format'
  ]);

  const cat   = getFirst(row, [
    'category','categories','category/type','type/category'
  ]);

  const added = getFirst(row, [
    'date added','date','added'
  ]);

  // Ensure https:// prefix if missing
  const https = url ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : '';

  return {
    subject : 'social-studies',
    topic   : topicName,
    title   : title,
    url     : https,
    type    : type,
    category: cat,
    added   : added
  };
}

export default async function handler(req, res) {
  try {
    // Support ?tab=, ?topic=, or ?sheet=
    const tab =
      (req.query.tab   || req.query.topic || req.query.sheet || '')
        .toString()
        .trim();

    if (!tab) {
      res.status(400).json({ ok: false, error: 'Missing ?tab=' });
      return;
    }

    // 1) Pull CSV for this tab
    const csv  = await fetchTabCSV(SHEET_ID, tab);

    // 2) Parse & normalize
    const rows = parseCSV(csv)
      .map(r => normalize(r, tab))
      .filter(r => r.title && r.url); // keep only valid rows

    // 3) Optional filters
    const q   = (req.query.q || '').toString().trim().toLowerCase();
    const cat = (req.query.category || '').toString().trim().toLowerCase();

    let items = rows;
    if (q) {
      items = items.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.type || '').toLowerCase().includes(q)
      );
    }
    if (cat) {
      items = items.filter(r => (r.category || '').toLowerCase().includes(cat));
    }

    // 4) Send (return both shapes for backward compatibility)
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
    res.status(200).json({
      ok: true,
      count: items.length,
      // NEW shape (current code)
      items,
      // OLD shape (your earlier topic script expected data.data)
      data: items
    });
  } catch (err) {
    console.error('resources API error:', err);
    res.status(500).json({ ok: false, error: 'Failed to load sheet/tab' });
  }
}
