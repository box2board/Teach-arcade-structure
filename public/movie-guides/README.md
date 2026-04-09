# Movie Guides System (Teach Arcade)

This folder now supports a **3-mode workflow** for each movie guide:

1. **Full guide view**: `/movie-guides/guides/<slug>/`
2. **Printer-friendly view**: `/movie-guides/guides/<slug>/print/`
3. **Interactive view**: `/movie-guides/guides/<slug>/interactive/`

## Files you will use most

- Landing page: `public/movie-guides/index.html`
- Shared Movie Guides styles: `public/movie-guides/movie-guides.css`
- Shared per-guide mode styles: `public/movie-guides/guides/shared-movie-guide.css`
- Example guide (all 3 modes):
  - `public/movie-guides/guides/war-horse/index.html`
  - `public/movie-guides/guides/war-horse/print/index.html`
  - `public/movie-guides/guides/war-horse/interactive/index.html`

## How to add a new movie guide

1. Create a new guide folder at `public/movie-guides/guides/<new-slug>/`
2. Add the three pages:
   - `index.html` (full guide)
   - `print/index.html` (printer-friendly worksheet)
   - `interactive/index.html` (online student worksheet)
3. In each page:
   - Include `movie-guides.css` and `guides/shared-movie-guide.css`
   - Add the version switcher action panel near the top
   - Keep teacher-facing summary and metadata near the top
4. Add the guide card to `public/movie-guides/index.html` with all 3 links.
5. Keep existing site-level SEO conventions:
   - title, description, canonical URL, OG basics

## Notes

- The interactive view is intentionally lightweight and front-end only.
- Print mode is optimized using the `mg-print-quiet` class and print media rules.
- Keep copy teacher-friendly and practical; avoid marketing-heavy language.
