// /api/resources.js  (Vercel Serverless Function)
// Fetches Google Sheet via GViz JSON, normalizes rows, filters by query (?topic=)
// Node 18+ on Vercel has global fetch.

const SHEET_ID  = "1dPJAi0dKjP6hWpgpNlA2M-2INar75-LxJ-fKEJjWslc"; // <-- your sheet
const TAB_NAME  = "Resources";                                    // <-- your tab name
const GVIZ_URL  = (sheetId, tab) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`;

function stripGvizPreamble(txt) {
  // GViz wraps JSON like: google.visualization.Query.setResponse({...});
  const start = txt.indexOf("{");
  const end   = txt.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("GViz response malformed");
  return txt.slice(start, end + 1);
}

function tableToObjects(gvizJson) {
  const cols = gvizJson.table.cols.map(c => (c.label || c.id || "").toString().trim());
  return (gvizJson.table.rows || []).map(row => {
    const obj = {};
    row.c.forEach((cell, i) => {
      const key = (cols[i] || `col${i}`).toLowerCase();
      const val = cell && cell.v != null ? String(cell.v).trim() : "";
      obj[key] = val;
    });
    return obj;
  });
}

function normalizeItem(row) {
  const lower = k => (row[k] || row[k?.toLowerCase?.()] || "").toString().trim();
  const topic = lower("topic").toLowerCase();
  const tags  = (lower("tags") || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  return {
    subject:  lower("subject") || "social-studies",
    topic,                               // stored lowercased for matching
    title:    lower("title"),
    url:      lower("url"),
    grade:    lower("grade"),
    category: lower("category"),         // e.g., lesson, worksheet, video, etc.
    type:     lower("type"),             // pdf, html, video, …
    tags
  };
}

export default async function handler(req, res) {
  try {
    const url = GVIZ_URL(SHEET_ID, TAB_NAME);
    const txt = await fetch(url, { cache: "no-store" }).then(r => r.text());
    const json = JSON.parse(stripGvizPreamble(txt));
    const rows = tableToObjects(json).map(normalizeItem).filter(x => x.title && x.url);

    // Filters from querystring
    const { topic, subject, grade, category, q } = req.query || {};
    let out = rows;

    if (topic) {
      const t = String(topic).toLowerCase().trim();
      // allow exact or "includes" match to be forgiving
      out = out.filter(r => r.topic === t || r.topic.includes(t));
    }
    if (subject) out = out.filter(r => (r.subject || "").toLowerCase() === String(subject).toLowerCase());
    if (grade)   out = out.filter(r => (r.grade   || "").toLowerCase().includes(String(grade).toLowerCase()));
    if (category)out = out.filter(r => (r.category|| "").toLowerCase().includes(String(category).toLowerCase()));
    if (q) {
      const needle = String(q).toLowerCase();
      out = out.filter(r =>
        (r.title||"").toLowerCase().includes(needle) ||
        (r.category||"").toLowerCase().includes(needle) ||
        (r.tags||[]).join(",").toLowerCase().includes(needle)
      );
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    // Cache at the edge for 5 minutes; serve stale for a day while revalidating
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=86400");
    res.status(200).json({ ok: true, count: out.length, items: out });
  } catch (err) {
    console.error("resources API error:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch Google Sheet" });
  }
}
