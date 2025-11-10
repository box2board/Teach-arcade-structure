// /api/resources.js  (Vercel Serverless Function, Node 18+, ESM)
export const config = { runtime: 'nodejs18.x' };

/** <<< SET THIS TO YOUR SHEET ID >>> 
 * Example seen in your pages: 1dPJAi0dKjP6hWpgpNlA2M-2INar75-LxJ-fKEJjWslc
 */
const SHEET_ID = '1dPJAi0dKjP6hWpgpNlA2M-2INar75-LxJ-fKEJjWslc';

/** Fetch a tab (sheet) as CSV using the gviz endpoint */
async function fetchTabCSV(sheetId, tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Fetch failed ${r.status}`);
  return await r.text();
}

/** Robust CSV → rows (array of objects), using header row */
function parseCSV(text) {
  // Minimal CSV parser handling quotes and commas
  const rows = [];
  let i = 0, cur = '', inQ = false, row = [];
  const pushCell = () => { row.push(cur); cur = ''; };
  const pushRow  = () => { rows.push(row); row = []; };

  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } // escaped quote
        else inQ = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') pushCell();
      else if (ch === '\r') { /* skip */ }
      else if (ch === '\n') { pushCell(); pushRow(); }
      else cur += ch;
    }
    i++;
  }
  // last cell/row
  if (cur.length || row.length) { pushCell(); pushRow(); }

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

/** Normalize one CSV row to our API shape */
function normalize(row, topicName) {
  // Expecting columns like: Title | Type | Category | URL | Date Added
  const title = row['title'] || row['name'] || '';
  const url   = row['url']   || row['link'] || '';
  const type  = row['type']  || '';
  const cat   = row['category'] || row['categories'] || '';
  const added = row['date added'] || row['date'] || '';

  const https = url ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : '';

  return {
    subject: 'social-studies',
    topic  : topicName,           // tab name == topic
    title  : title,
    url    : https,
    type   : type,
    category: cat,
    added  : added
  };
}

export default async function handler(req, res) {
  try {
    // Required: tab (the sheet tab name). Optional: q, category
    const tab = (req.query.tab || req.query.topic || '').toString().trim();
    if (!tab) {
      res.status(400).json({ ok:false, error:'Missing ?tab=' });
      return;
    }

    // 1) Pull CSV for this tab from Google Sheets
    const csv = await fetchTabCSV(SHEET_ID, tab);

    // 2) Parse + normalize
    const rows = parseCSV(csv)
      .map(r => normalize(r, tab))
      .filter(r => r.title && r.url); // drop blanks

    // 3) Optional filters
    const q  = (req.query.q || '').toString().trim().toLowerCase();
    const cat = (req.query.category || '').toString().trim().toLowerCase();

    let items = rows;
    if (q) {
      items = items.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.category||'').toLowerCase().includes(q) ||
        (r.type||'').toLowerCase().includes(q)
      );
    }
    if (cat) {
      items = items.filter(r => (r.category||'').toLowerCase().includes(cat));
    }

    // 4) Cache at edge (5 min), allow stale for a day
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
    res.status(200).json({ ok:true, count:items.length, items });
  } catch (err) {
    console.error('resources API error:', err);
    res.status(500).json({ ok:false, error:'Failed to load sheet/tab' });
  }
}
