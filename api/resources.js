// /api/resources.js
// Vercel Node Serverless Function (CommonJS) – works in plain static sites

module.exports = async (req, res) => {
  try {
    const { sheet, tab } = req.query || {};

    if (!sheet || !tab) {
      res.status(400).json({ ok: false, error: "Missing 'sheet' or 'tab' query parameter" });
      return;
    }

    const url =
      `https://docs.google.com/spreadsheets/d/${sheet}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`;

    const r = await fetch(url, { cache: "no-store" });
    const text = await r.text();

    // Extract JSON from Google GViz wrapper
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Invalid GViz response format");
    const json = JSON.parse(text.slice(start, end + 1));

    const rows = (json.table && Array.isArray(json.table.rows) ? json.table.rows : [])
      .map(row => {
        const c = row.c || [];
        return {
          title:    (c[0]?.v ?? "").toString(),
          type:     (c[1]?.v ?? "").toString(),
          category: (c[2]?.v ?? "").toString(),
          url:      (c[3]?.v ?? "").toString(),
        };
      })
      .filter(r => r.title && r.url && r.title.toLowerCase() !== "title");

    // Cache at the edge/CDN for a few minutes (optional)
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    res.status(200).json({ ok: true, data: rows });
  } catch (err) {
    // You can see this in Vercel → Deployments → Functions logs
    console.error("API error:", err);
    res.status(500).json({ ok: false, error: err.message || "Unknown error" });
  }
};
