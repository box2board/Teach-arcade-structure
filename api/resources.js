// Retired endpoint kept temporarily for cached legacy pages.
// The former Google Sheets resource directory is no longer used or exposed.
export const config = { runtime: "nodejs" };

export default function handler(_req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ ok: true, count: 0, items: [] });
}