# AdSense Remediation Plan

## Primary goals
- Rebuild sitemap so only canonical, indexable, content-rich URLs are included.
- Reduce thin/indexable surface by excluding redirect wrappers, placeholders, and low-word pages.
- Expand core hub pages (`/subjects/`, `/subjects/math/`, `/subjects/ela/`, `/subjects/science/`, `/subjects/social-studies/`) with substantial teacher-helpful content.
- Reinforce trust pages (`/contact`, `/submit`) with scope boundaries, workflow, response-time expectations, and FAQs.
- Add automated content QA and link integrity checks to prevent regressions.

## Planned implementation
1. Update `scripts/generate-sitemap.mjs` with quality filters (noindex, redirects, placeholders, min words, canonical URLs, lastmod).
2. Create `scripts/adsense-content-gate.mjs` for unique title/H1 checks, metadata checks, thin/placeholder/redirect detection, and sitemap mismatch checks.
3. Create `scripts/check-internal-links.mjs` and integrate in npm scripts.
4. Expand the five required subject hubs with unique long-form instructional guidance and decision aids.
5. Expand trust pages (`contact`, `submit`) with clear scope + FAQs + process transparency.
6. Add CI workflow to run AdSense audits and upload reports on push/PR.
