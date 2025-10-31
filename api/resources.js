// /api/resources.js  (Vercel Serverless Function, ESM)
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export default async function handler(req, res) {
  try {
    // Path to the JSON packaged with this function (see vercel.json includeFiles)
    const dataFile = path.join(__dirname, '..', 'public', 'assets', 'data', 'resources.json');

    const raw = await fs.readFile(dataFile, 'utf8');
    const all = JSON.parse(raw);

    // Optional filters from querystring (for your existing topic pages)
    const { subject, topic, grade, tag, q } = req.query || {};

    let out = all;
    if (subject) out = out.filter(r => (r.subject || '').toLowerCase() === String(subject).toLowerCase());
    if (topic)   out = out.filter(r => (r.topic   || '').toLowerCase() === String(topic).toLowerCase());
    if (grade)   out = out.filter(r => String(r.grade || '').toLowerCase().includes(String(grade).toLowerCase()));
    if (tag)     out = out.filter(r => Array.isArray(r.tags) && r.tags.map(t=>String(t).toLowerCase()).includes(String(tag).toLowerCase()));
    if (q) {
      const needle = String(q).toLowerCase();
      out = out.filter(r =>
        (r.title||'').toLowerCase().includes(needle) ||
        (r.desc ||'').toLowerCase().includes(needle)  ||
        (r.url  ||'').toLowerCase().includes(needle)
      );
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
    res.status(200).json({ ok: true, count: out.length, items: out });
  } catch (err) {
    console.error('resources API error:', err);
    res.status(500).json({ ok: false, error: 'Failed to read resources' });
  }
}
