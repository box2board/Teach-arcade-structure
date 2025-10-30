// /api/resources.js  (Vercel Serverless Function)
export default async function handler(req, res) {
  try {
    // Build an absolute URL to the public JSON (works in Vercel)
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host  = req.headers.host;
    const dataUrl = `${proto}://${host}/assets/data/resources.json`;

    const r = await fetch(dataUrl, { headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error(`Failed to fetch resources.json: ${r.status} ${r.statusText}`);
    const all = await r.json();

    // Query filters
    const { subject, topic, grade, tag, q } = req.query || {};
    let out = Array.isArray(all) ? all.slice() : [];

    if (subject) out = out.filter(r => (r.subject || '').toLowerCase() === String(subject).toLowerCase());
    if (topic)   out = out.filter(r => (r.topic   || '').toLowerCase() === String(topic).toLowerCase());
    if (grade)   out = out.filter(r => String(r.grade || '').toLowerCase().includes(String(grade).toLowerCase()));
    if (tag)     out = out.filter(r => Array.isArray(r.tags) && r.tags.map(t => String(t).toLowerCase()).includes(String(tag).toLowerCase()));
    if (q) {
      const needle = String(q).toLowerCase();
      out = out.filter(r =>
        String(r.title || '').toLowerCase().includes(needle) ||
        String(r.desc  || '').toLowerCase().includes(needle) ||
        String(r.url   || '').toLowerCase().includes(needle)
      );
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Cache for 5 minutes at the edge; serve stale for a day while revalidating
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
    res.status(200).json({ ok: true, count: out.length, items: out });
  } catch (err) {
    console.error('resources API error:', err);
    res.status(500).json({ ok: false, error: 'Failed to read resources' });
  }
}
