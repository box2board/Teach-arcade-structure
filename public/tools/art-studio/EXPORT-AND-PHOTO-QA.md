# Export controls and real-photo exercise

## Delivered behavior

The Export dialog now offers PNG, JPG or multipage PDF, screen/high/300-ppi/custom pixel sizes, locked proportions and a current-page transparency preview. PNG can omit page paint while retaining visible layers. JPG and PDF include solid page paint. PDF raster density can increase without changing each page's physical print dimensions. The output dialog reports actual image pixel dimensions. Image exports release their canvas after encoding; decoding failures release the canvas and temporary source URL. Size checks reject non-finite/zero dimensions, sides over 8192 pixels and more than 16 million pixels per page before allocation. The dialog checks every PDF page before preparing a file.

PPI is calculated against the editor's 96-pixels-per-inch document size. PNG/JPG browser encoders may still write 96-ppi metadata. Use PDF when physical page dimensions matter. Increasing a low-resolution photograph's pixel count does not create new detail.

## Real photograph and creation task

Input: `examples/assets/grace-hopper.jpg`, copied unchanged from Matplotlib's bundled `mpl-data/sample_data/grace_hopper.jpg` photograph. It is a photograph of Grace Hopper, not the generated practice illustration. The three-page editable example is `examples/grace-hopper-photo-study.artstudio.json`.

The offline exercise uses the production state, selection, mask, SVG and export functions to create a classroom poster, an original-versus-cutout study and an image-only page for transparent export. It draws a 30-point outline, refines eight vertices, feathers the boundary, copies the subject to a new layer, retains the original as a hidden editable layer, adds text, sets image adjustments and validates the saved/reopened project. It does not invoke the real browser upload dialog or simulate a human completing pointer gestures on this photograph; earlier callback tests cover those interactions with DOM doubles.

The original photo stays embedded and unchanged. The subject copy retains its editable mask and its full-source bounding box. The poster asks a classroom discussion question rather than attributing a quotation to Hopper.

## What was verified

Run `node scripts/test-art-studio-export.mjs --write-example` to reproduce the study and independent output checks. The actual export functions run against an explicitly offline canvas adapter: serialized SVG is rendered by Inkscape, and JPG encoding is performed with Pillow. This exercises export sizing, file-format plumbing and PDF serialization, but not the browser's own SVG decoder, canvas renderer, file picker or download link.

- Export dialog defaults, resolution/custom-size callbacks, locked proportions and blocked oversized output.
- PNG transparency preview removes only page paint; JPG restores the solid preview and disables transparency.
- PDF dialog identifies all pages and uses one resolution factor across the document.
- Letter at 300 ppi calculates 2550 × 3300 pixels.
- Real output PNG/JPG dimensions are 300 × 352 for the cutout at half scale.
- PNG contains an opaque subject interior, fully transparent background pixels and partially transparent feather pixels.
- JPG contains three color channels and an opaque white background.
- Strict PDF parsing succeeds: three pages with physical sizes 810 × 810, 900 × 600 and 450 × 528 points. Embedded raster sizes match the chosen half-scale resolution: 540 × 540, 600 × 400 and 300 × 352 pixels.
- Temporary image URLs are released.

Visual inspection of the initial PNG and first PDF page revealed background remnants near the hat and shoulder. Eight outline vertices were then refined with the production point-edit helper, and the exercise was regenerated. The manual polygon still approximates fine hair and cloth edges. Feathering softens a boundary but cannot remove color contamination from background pixels already included inside it; this is a remaining edge-refinement limitation. Inkscape does not reproduce the browser CSS image color filters, so grading accuracy is not established by these renders.

## Verification limits and remaining release checks

37 model/integration checks, 59 offline editing-workflow checks and 15 export/photo checks pass. Review bundle syntax and whitespace checks pass. No merge or production deployment was performed.

The prior browser URL-policy rejection still blocks the real browser exercise. Real upload, cursor/handle alignment, full editing gestures, browser save/reopen, native PNG/JPG/PDF rendering and the final download link remain unverified. Native desktop, iPad and Chromebook checks are also outstanding. The independent output files are evidence for the renderer/serializer path only, and must not be reported as successful browser downloads.

## Subsequent edge-refinement pass

The saved photo study now applies a 0.4% selected-area contraction before feathering. A no-change Preview cutout control lets users inspect the proposed copied layer before committing. Region edge adjustment persists in the editable project. Additional independent raster tests confirm the direction of contraction/expansion using alpha pixels around a known rectangular boundary. Current suites: 39 model checks, 64 offline editing checks, 16 export/photo checks. Fine hair and background color contamination still require accurate tracing/manual cleanup; no claim of automatic subject extraction or fresh browser testing is made.

## Local accuracy correction

The rough polygon has been replaced by a denser, manually retraced outline with gentle cubic smoothing, 0.2% feather and 0.2% contraction. The large neck flag remnant and tested shoulder halo pixels are now transparent in independent renders, while the tested face interior is opaque. The editor now provides sub-percent hard brushes, exact brush diameter, point insertion/removal and optional curved boundaries. These improve local cleanup; they do not automatically identify hair or remove all color contamination. Current checks: 42 model, 82 offline workflow and 17 export/photo checks. Real-browser limitations are unchanged.
