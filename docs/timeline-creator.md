# Visual Timeline Creator

Route: `/tools/timeline-creator/`. Linked from Teacher Tools and Graphic Organizers. Independent of the existing timeline worksheet and all gameplay/question-bank content.

## Experience

- SVG picture cards on a large scrollable canvas; horizontal timeline and vertical story layouts.
- Even spacing (explicitly not to scale) or true chronological scale. Nearby cards stack to avoid overlap. Moving cards between sides never changes their dates.
- BCE/CE years 1–9999, optional months/days, year-based end dates, and eras. Internal date arithmetic uses proleptic Gregorian dates and has no displayed year zero.
- Original vector symbols, uploaded PNG/JPEG/WebP images, fill/fit picture crop, colors, themes, captions, significance and source credits.
- Event creation, editing with Apply changes, duplicate/delete, undo/redo, keyboard-accessible cards, focus mode and keyboard-controlled presentation.
- Browser-local draft, portable `.teacharcade-timeline.json` save/import, direct PNG and PDF downloads. No print dialog, backend, accounts, or collaboration.
- PDF includes a visual overview and complete text appendix, so compact cards never lose captions or notes in the printout. Blank PDF is a six-event worksheet retaining the project title.

## Data and limits

`model.js` validates and normalizes every state mutation/import. User text is escaped in SVG and rendered as text in HTML. Only embedded raster data URLs are accepted; remote images, SVG uploads, executable markup, duplicate IDs and unsupported schemas are rejected. Uploads are recompressed to at most 1000px; project limit 40 events, 8 eras, 19 MB serialized data, with import file limit 20 MB. PNG exports are bounded to 16 megapixels and 8192px per axis. Long card text is abbreviated visually; full text remains in the event editor, project, presentation and PDF appendix.

Drafts are stored under `teacharcade_timeline_v1`. Browser storage errors leave the editor usable and direct users to download a project file. Storage is device/browser-specific. Event-panel changes require Apply changes before they become part of the saved project.

PDFs reuse the local jsPDF bundle and DejaVu Sans font already used by Graphic Organizer Studio. The bundled font covers Latin, Greek, Cyrillic and common symbols; CJK and other scripts are not guaranteed in the PDF appendix. PNGs use browser font rendering. SVG exports specify their font so downloaded imagery does not fall back to a serif font.

## Verification

Run `TEACH_ARCADE_JSDOM=/path/to/jsdom/lib/api.js node scripts/test-timeline-creator.mjs`; set `TIMELINE_QA_DIR` to output deterministic sample SVGs and the long-notes PDF.

Verified: date and range validity, BCE/CE ordering, safe literal text, 40 crowded cards without overlap, creation/edit/delete/duplicate, undo/redo, themes/layout state, save/restore, eras, presentation and keyboard controls, malformed imports, blocked storage fallback, actual PDF pagination and extraction of all 120 long Unicode test sentences. Rendered the horizontal, vertical and true-scale SVGs and inspected the images. The standard production build passed, including the existing question-bank and crossword checks. Build-generated unrelated catalog/sitemap churn was discarded; only the new sitemap entry is included.

No browser-control skill was available in this managed environment. Live browser interaction, touch dragging, image decoding/cropping and native Safari/iPad download behavior remain to be checked in the Vercel preview. This is an isolated feature branch; no merge or production deployment.
