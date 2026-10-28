# First review build

Isolated additive route: `/tools/art-studio/`. Nothing merged or deployed to production. Shared navigation and existing tools are unchanged. Initial design is an editable Classroom Poster; Templates also offers a blank canvas.

## Verified

- `node scripts/test-art-studio.mjs`: 12 model/integration checks passed. Covers history transactions, undo/redo and branching, locking, grouping and group duplication, layer ordering, page deletion reconciliation, all 12 templates, all 16 classroom objects, clean export escaping/hidden-layer exclusion, import validation, local persistence/quota errors, movement snapping, rotated resizing, pointer cancellation.
- `npm run build`: passed all repository build stages. Build-generated changes outside this feature were discarded; they are not part of the prototype.
- All source modules and the bundled review JavaScript pass Node syntax checks.
- Chrome UI: inserted and edited text; verified canvas text changed; undo restored prior text and redo restored the edit. Inserted shape, changed rotation, hid/showed and locked/unlocked a layer. Shift-selected layers, grouped, and duplicated a group. Added page, applied Exit Ticket template, saved, listed and reopened the two-page project.
- PNG: actual browser download inspected at 816 × 1056; no editor handles in image.
- PDF: browser generated a two-page, 149 KB PDF Blob. Separate PDF writer check passed parser/render verification: page count, xref, embedded images, 612 × 792 pt Letter proportions. Browser repeated-download automation did not return subsequent download files; do not claim end-to-end PDF download verification.
- Embedded review bundle is generated from the same source, under 100 KB, without imports, external fonts/assets or network calls.

## Remaining hands-on review

- The cloud browser file chooser stalled; image upload, adjustment and portable project import need manual end-to-end review. Their modules are implemented and import validation is tested.
- Freehand strokes, pointer rotation, group resizing and layer drag reorder need hands-on review beyond their model/code checks.
- Responsive breakpoints are implemented for desktop/Chromebook/tablet/mobile. The actual Chrome visual review was desktop; smaller device QA remains.
- Test downloads in the embedded host: sandbox restrictions may differ from a normal browser. The editor offers explicit prepared export links and editable JSON backups.

## Deliberate prototype limits

- Flat groups, no nesting. Eraser removes complete ink strokes. Nondestructive inset crop rather than an arbitrary crop marquee. PDF pages are raster images at page resolution.
- System fonts only. Local browser persistence, no cloud integration or cross-origin save sharing. Keep a portable project file as backup.
- 40 pages, 500 objects per page, 100–4000 px page dimensions. Images downsample to 1600 px maximum; up to 12 MB input. History is capped to control Chromebook memory use.
