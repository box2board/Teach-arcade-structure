// /api/resources.js  (Vercel Serverless Function, ESM)

// IMPORTANT: Vercel accepts 'edge' or 'nodejs' (NOT 'nodejs18.x')
export const config = { runtime: 'nodejs' };

/** Default sheet ID (e.g., your original Social Studies master) */
const DEFAULT_SHEET_ID = '1dPJAi0dKjP6hWpgpNlA2M-2INar75-LxJ-fKEJjWslc';

/** Fetch a tab (sheet) as CSV via the gviz endpoint */
async function fetchTabCSV(sheetId, tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    tabName
  )}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) {
    throw new Error(`Google Sheet fetch failed: ${r.status} ${r.statusText}`);
  }
  return await r.text();
}

/** Minimal CSV → rows parser that handles quotes, commas, and newlines */
function parseCSV(text) {
  // Strip BOM if present
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const rows = [];
  let cur = '';
  let inQ = false;
  let row = [];

  const pushCell = () => {
    row.push(cur);
    cur = '';
  };
  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQ = true;
      } else if (ch === ',') {
        pushCell();
      } else if (ch === '\r') {
        // ignore CR
      } else if (ch === '\n') {
        pushCell();
        pushRow();
      } else {
        cur += ch;
      }
    }
  }
  // last cell/row if file didn't end with newline
  if (cur.length > 0 || row.length > 0) {
    pushCell();
    pushRow();
  }

  if (!rows.length) return [];

  const headers = rows[0].map((h) => String(h || '').trim().toLowerCase());
  const out = [];

  for (let r = 1; r < rows.length; r++) {
    // skip completely empty rows
    if (rows[r].every((c) => String(c || '').trim() === '')) continue;

    const obj = {};
    rows[r].forEach((val, idx) => {
      const key = headers[idx] || `col_${idx}`;
      obj[key] = String(val || '').trim();
    });
    out.push(obj);
  }
  return out;
}

/** Normalize one CSV row to API shape */
function normalize(row, topicName, subjectName) {
  // These keys should align with your sheet columns (case-insensitive):
  // Title | URL | Type | Category | Date Added (others are ignored if present)
  const title = row['title'] || row['name'] || '';
  const url = row['url'] || row['link'] || '';
  const type = row['type'] || '';
  const category = row['category'] || row['categories'] || '';
  const added = row['date added'] || row['date'] || '';

  // Ensure URLs are absolute https://
  const safeUrl = url
    ? /^https?:\/\//i.test(url)
      ? url
      : `https://${url}`
    : '';

  return {
    subject: subjectName || 'general',
    topic: topicName, // API returns the tab name as the topic
    title,
    url: safeUrl,
    type,
    category,
    added,
  };
}

/** Main handler */
export default async function handler(req, res) {
  try {
    // REQUIRED: ?tab=Your Tab Name (must match the sheet tab exactly)
    const tab =
      (req.query.tab || req.query.topic || '').toString().trim();
    if (!tab) {
      res
        .status(400)
        .json({ ok: false, error: 'Missing ?tab= (sheet tab name)' });
      return;
    }

    // OPTIONAL: ?sheetId= overrides the default (lets us use different subject sheets)
    const sheetIdParam = (req.query.sheetId || '').toString().trim();
    const sheetId = sheetIdParam || DEFAULT_SHEET_ID;

    // OPTIONAL: ?subject= lets you tag the subject in responses (social-studies, biology, etc.)
    const subject =
      (req.query.subject || '').toString().trim().toLowerCase() ||
      '';

    // 1) Fetch the tab CSV from Google Sheets
    const csv = await fetchTabCSV(sheetId, tab);

    // 2) Parse and normalize to consistent objects
    let items = parseCSV(csv)
      .map((r) => normalize(r, tab, subject))
      .filter((r) => r.title && r.url); // basic sanity

    // 3) Optional filters
    const q = (req.query.q || '').toString().trim().toLowerCase();
    const cat = (req.query.category || '')
      .toString()
      .trim()
      .toLowerCase();

    if (q) {
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.category || '').toLowerCase().includes(q) ||
          (r.type || '').toLowerCase().includes(q)
      );
    }
    if (cat) {
      items = items.filter((r) =>
        (r.category || '').toLowerCase().includes(cat)
      );
    }

    // 4) Cache (edge) — 5 min fresh, serve stale up to 1 day
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      's-maxage=300, stale-while-revalidate=86400'
    );

    res.status(200).json({ ok: true, count: items.length, items });
  } catch (err) {
    console.error('resources API error:', err);
    res
      .status(500)
      .json({ ok: false, error: 'Failed to load sheet/tab' });
  }
}
