# Revolutionary Spy Escape - review build

Isolated branch: `feature/revolutionary-spy-print-play`. Do not merge or release without approval.

## Offline run

Print teacher pages 1-6 and 17-18 once; student pages 7-16 per team. Cut only 11 cards per team (pages 11 and 13). Bundle dossiers as [9], [10+11], [12+13], [14+15]. Give pages 7-8 at launch; keep page 16 until completion. Four teacher checks plus one final check per team replace purchased locks.

For 28 students / 7 teams: 78 sheets, 77 cut rectangles, 28 bundles. Optional 28 envelopes; clips/folded sheets suffice. Estimate 20-30 minutes first assembly and 40-50 minutes activity; neither is classroom-validated.

## Solutions

1. Shift cipher: NO TAX WITHOUT A VOICE; check VOICE; release BE -> slots 3-4.
2. Stamp Act, Boston Massacre, Boston Tea Party, Lexington and Concord, Declaration adopted: 41736; LI -> slots 1-2.
3. P/L/P/L/N/N -> 285149; RT -> slots 5-6.
4. Boston/Lexington/Concord/Philadelphia -> 6248; Y -> slot 7.
5. Numbered slots spell LIBERTY. Require four verified entries and a discussion of unequal liberty.

## Reusable foundations

- Shared product/category stylesheet and product-page section pattern.
- PDF layout helpers: page frame, dossier labels, cards, panels, real embedded text, low-ink palette.
- Reusable teacher-verification protocol with log initials and numbered letter payloads.
- Three-level teacher hint bank and explicit teacher/student print ranges.
- Source generator plus manifest recording print ranges, dossier bundles, codes and unlock slots. These files are developer-only; do not publish the answer manifest in public assets.
- Same game's metadata is in the existing games manifest for ongoing search builds. No parallel search system.

## Verification

- Historical claims checked against LOC, NPS and National Archives sources listed in PDF page 6. Documents and map clearly labeled fictional/schematic.
- Complete simulated walkthrough from student materials, checked against teacher key.
- Generated 18-page Letter PDF rendered and all pages visually reviewed; fonts embedded and decoder strip monospaced.
- Automated extraction checks codes from the student PDF, verifies the sole matching viewpoint-column sequence, final slots, page counts, copy counts and text bounds.
- Existing search regression suite passes.
- Review limitations: no classroom test; teacher queue/workload and reading pace need observation. Browser QA unavailable in this executor (no browser binary); responsive CSS and links are checked, but real Safari/Chromebook/iPad checks remain before release.

## Regeneration

From repository root: `python3 scripts/print-play/build-revolutionary-spy.py` then `python3 scripts/print-play/check-revolutionary-spy.py`.
Dependencies: Python reportlab, pdfplumber and system DejaVu fonts (`fonts-dejavu-core`). Preview WebP images are rasterizations of PDF pages 7 and 14; refresh these with Poppler after printable edits. The PDF is committed so the normal static website build requires no Python.
