// /api/resources.js  (Vercel Serverless Function, ESM)
export default async function handler(req, res) {
  try {
    // Build absolute URL to your public JSON so the function can fetch it.
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol =
      (req.headers['x-forwarded-proto'] || '').split(',')[0]?.trim() || 'https';
    const base = `${protocol}://${host}`;
    const dataUrl = `${base}/assets/data/resources.json`;

    const r = await fetch(dataUrl, { cache: 'no-store' });
    if (!r.ok) throw new Error(`Failed to fetch resources.json (${r.status})`);
    const all = await r.json();

    // Query params (accept both `topic` and legacy `tab`)
    const {
      subject,
      topic: topicParam,
      tab: tabParam,
      grade,
      tag,
      q
    } = req.query || {};

    const topicNeedle = String(topicParam || tabParam || '').trim().toLowerCase();
    const subjectNeedle = String(subject || '').trim().toLowerCase();
    const gradeNeedle = String(grade || '').trim().toLowerCase();
    const tagNeedle = String(tag || '').trim().toLowerCase();
    const qNeedle = String(q || '').trim().toLowerCase();

    let out = Array.isArray(all) ? all.slice() : [];

    // Filters (all case-insensitive). Topic uses "contains" to be forgiving.
    if (subjectNeedle) {
      out = out.filter(r =>
        String(r.subject || '').toLowerCase() === subjectNeedle
      );
    }

    if (topicNeedle) {
      out = out.filter(r =>
        String(r.topic || '').toLowerCase().includes(topicNeedle)
      );
    }

    if (gradeNeedle) {
      out = out.filter(r =>
        String(r.grade || '').toLowerCase().includes(gradeNeedle)
      );
    }

    if (tagNeedle) {
      out = out.filter(r =>
        Array.isArray(r.tags) &&
        r.tags.map(t => String(t).toLowerCase()).includes(tagNeedle)
      );
    }

    if (qNeedle) {
      out = out.filter(r => {
        const title = String(r.title || '').toLowerCase();
        const desc  = String(r.desc  || '').toLowerCase();
        const url   = String(r.url   || '').toLowerCase();
        return title.includes(qNeedle) || desc.includes(qNeedle) || url.includes(qNeedle);
      });
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
    res.status(200).json({ ok: true, count: out.length, items: out });
  } catch (err) {
    console.error('resources API error:', err);
    res.status(500).json({ ok: false, error: 'Failed to read resources' });
  }
}
