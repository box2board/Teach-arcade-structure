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

## Object actions menu

Selected canvas items now show a compact ••• trigger anchored to their visible bounds. It opens contextual text editing, properties, duplicate, rename, group/ungroup, layer ordering, lock/unlock, hide, and delete actions. Locked selections disable destructive edits. The menu follows zoom, movement and scrolling, closes on outside click/Escape, and supports keyboard navigation. Chrome verification: select Golden star, open menu, delete (9 → 8 layers), Undo restores it (8 → 9). Existing 12 model/integration checks pass.

## Design tools expansion

Added selection tools dialog accessible from contextual toolbar and object menu: alignment/distribution, 90-degree rotation, straighten, flips for all object types, nudging, quick colors, copy/paste style, shadow and opacity shortcuts. Chrome verified dialog opens and Blue + Rotate +90 changes the selected star fill to #408be7 and rotation from 12 to 102 degrees. Existing model checks pass.

## Resource builders

Vocabulary cards (2–6), vertical timeline (2–6 events), and three-column comparison organizer accept teacher text and generate ordinary editable shapes and labels. New page is the default; current-page insertion is optional. Model checks verified document validation, safe text rendering, and page bounds at min/max entry counts. Interactive browser review remains pending for these new dialogs.

## Creative effects

Image masks: ellipse/circle, rounded rectangle and diamond, nondestructive with matching border geometry. Gradients: two colors and adjustable direction on shapes/text. Text presets: plain, outline, shadow, arcade title. Transparent PNG omits page paint only; opaque design layers remain.

15 model/integration checks pass, including effect save validation, undo/redo, clipped image SVG and transparent export content. Chrome verified Arcade title inserts a gradient and restores with Undo; Transparent PNG produces an 86 KB downloadable Blob. Image-frame upload and downloaded pixel-alpha inspection remain manual QA items.

## Photo workspace

Added a draft-based erase/restore image mask editor: pointer brush, brush size, stroke undo, restore-all, Cancel and Apply. Original raster source stays intact. Applying a mask is one history transaction; ordered luminance strokes support restoring previously erased areas. Masks render in image-source coordinates and follow image flips.

Added independent left/top/right/bottom crop, crop reset, image-adjustment reset, and shadow color/strength/offset/softness. Uploads includes a local generated practice landscape.

17 automated checks pass, including mask rendering, crop viewBox, shadow settings, original-source preservation, save/import validation, undo and redo. Browser testing was blocked this turn by a preview route failure followed by a cloud-browser timeout after one restart. Actual brush gestures and pixel/export appearance still need hands-on review.

## Photo editing precision and browser verification

Added 100–400% zoom with scrollable workspace, circular brush outline, adjustable edge softness, original/edited toggle that pauses painting, and local stroke redo. Brush geometry compensates for image aspect ratio. Pointer renders are limited to one per animation frame.

Chrome verified using practice image: pointer drag creates a stroke, Undo stroke enables Redo, Redo restores it, comparison toggles state, zoom reaches 150%, Apply commits the mask. Saved project reopens with one mask path and its Gaussian blur intact; Transparent PNG generation succeeds (84 KB). Uploading a user file and inspection of downloaded pixel alpha remain separate manual checks. 18 automated checks pass.

## Classroom creation run-through

See RUNTHROUGH.md for the actual two-page creation exercise, resulting usability fixes, 20 passing checks and outstanding browser/PDF verification limits. The optional third argument to build-art-studio-preview.mjs preloads a real exported project for hands-on review.

## Workflow polish after the creation exercise

Added direct Crop, Erase / restore, Flip and proportion-lock controls to the selected-image toolbar. Visual crop supports dragging corners and moving the crop region, numeric edge controls, reset, Cancel and a single undoable Apply; the source image, mask and frame remain intact.

Grouped items can be selected individually from Layers, the group member picker or Alt-click. Text double-click also selects the individual member. Membership stays intact and Select whole group returns to group selection. Image corner resizing now honors Keep proportions; Shift temporarily toggles the constraint.

23 automated checks pass, including crop geometry and legacy fallback, individual group selection/edit/undo, and image drag-resize constraint behavior. Syntax and review-bundle checks pass. These additions have not received a fresh browser interaction test because of the browser policy block recorded above; crop gestures, group picker and PDF download remain hands-on verification items.

## Photo-editing defect corrections

See PHOTO-EDIT-RUNTHROUGH.md for the original findings and implemented corrections. Crop geometry now preserves retained pixel scale/position and supports reset/history; source-space brush proportions follow the uncropped image. Cancelled brush gestures and lost capture retain Redo, and Restore entire image supports local Undo/Redo. Verification: 26 model/integration checks and 19 workflow checks pass; the workflow exercises actual editor callbacks with DOM doubles. Fresh browser interaction and downloaded raster/PDF verification remain pending because of the existing policy block.

## Final-composition preview in brush editor

Final composition switches the workspace to a clean view of the current page, replacing the selected image with its uncommitted mask draft. Crop, flip, frame, rotation, shadow, text and surrounding layers use the production page renderer. Painting and source comparison pause; Undo/Redo refreshes the draft in place. Back to painting restores source coordinates. Switching views cancels an unfinished gesture without committing it. Apply works from either view, and Cancel discards the whole draft session.

Verification: 27 workflow assertions and 26 model/integration assertions pass; review-bundle JavaScript passes syntax validation. New coverage checks page effects and draft masks, blocked painting, local history while previewing, source-coordinate restoration, comparison state, active-gesture cancellation, modal Cancel and single-step document Undo after Apply. These are offline callback/rendering checks, not browser layout or raster verification. The earlier browser policy block remains in effect.

## Rectangle and polygon image selections

Added drag-to-select rectangles, click-to-outline polygons with Finish polygon / Undo point, clear selection, feathering (0–10% of original image width), and explicit Erase / Restore inside or outside actions. Area edits and brush edits share one ordered nondestructive mask and local Undo/Redo, reset, Cancel and Apply. Selection guides are temporary and excluded from export; painting stays freehand unless an explicit area action is chosen. Region coordinates use the original image, so the mask follows crop, flip and final composition. Polygons are limited to 128 points and masks to 200 edits; import validates region types, points, feathering and inversion.

29 model/integration checks and 35 offline workflow checks pass. Coverage includes backward rectangle dragging, cancelled replacement selections, polygon completion and point undo, feathered area actions, restore/outside ordering, composition preview, save/import, single document Undo and Cancel. Four additional Inkscape raster checks inspect alpha pixels: inside erase, outside erase, soft feather boundary and restoration over a previously erased region. This independent renderer verifies mask alpha; it does not verify browser layout, pointer behavior or the app's download path. Browser verification remains blocked by the previously recorded policy rejection.

## Full image before/after comparison

Show original now remains available in Final composition. It substitutes an uncropped, unmasked image at the current canvas scale, removing color adjustments, blur, flips, frame, border, shadow, rotation and opacity changes for comparison. Page text, background and other layers remain visible. Show edited restores the complete mask draft and effects. This reconstructs the embedded source at its current placement; it is not a snapshot of the page before earlier layout edits. Painting remains paused in both composition views. Comparison does not modify the project, draft mask or document history; Undo/Redo can update the draft while the original is visible.

Verification: 30 model/integration checks and 37 offline workflow checks pass, including geometry reconstruction, neutral effects, original-source preservation, other-layer rendering, draft recovery, painting pause, no history entry and compatibility with existing selection/crop/brush behavior. Review-bundle syntax passes. Browser interaction and export download verification remain pending under the existing browser policy block.

## Selection refinement

Closed rectangle and polygon selections now offer Adjust selection: drag the bounding box to move it, or any corner to resize. Left, top, width and height fields provide numeric refinement in original-image percentages. Movement keeps the outline inside the source; resizing scales all polygon points, anchors the opposite corner, and enforces a minimum bounding extent without collapsing a valid region. Applied masks copy the outline, so subsequent selection changes never move an existing mask. Selection adjustments are transient guides rather than document edits; area actions retain normal local Undo/Redo. Pointer cancellation, lost capture and switching to composition restore an interrupted adjustment. Comparison/composition pauses refinement.

33 model/integration checks and 43 offline workflow checks pass, including boundary clamping, polygon vertex scaling, invalid numeric input, draggable handles, rectangle adjustment, cancellation, exact applied coordinates, document Undo and persistence regressions. Preview bundle syntax passes. Actual browser/touch interaction and downloads remain unverified because of the existing browser policy block.

## Focused editor sections and polygon vertices

Image mask controls are grouped into Brush, Selection and Preview sections, with only the active section visible. Undo/Redo, zoom, Apply and Cancel remain shared. Position/size controls are expandable. Section changes preserve draft masks and finished/unfinished selections; switching away cancels an incomplete pointer gesture. Preview opens the final page composition and pauses editing.

Edit points displays a draggable vertex for each closed selection. A point picker and X/Y fields provide numeric editing. Coordinates clamp to the original image, other vertices remain fixed, and a move that collapses the polygon is rejected. Interrupted point drags restore the previous outline. Area actions copy the refined vertices and keep existing mask history behavior.

35 model/integration checks and 52 offline workflow checks pass. New checks cover one visible section, navigation without document edits, vertex handles, numeric refinement, cancelled drags, selection retention through Preview, exact applied masks and document Undo. Review-bundle syntax passes. No new browser interaction or download verification was attempted under the existing browser policy block.

## Copy selection to an independent layer

Selection now offers Copy selection to new layer. It creates an ungrouped image layer immediately above the source and selects it for independent movement. The copy keeps the embedded source, image adjustments, orientation, opacity, shadow and draft mask history, then adds a feathered outside erase for the selected outline. The original layer is unchanged, including any uncommitted mask work. Copy closes the editor and is one document history transaction. Layer and mask count limits are checked before insertion.

The copy intentionally uses full-source image bounds, removing the old crop/frame/border so the complete selected source area is available. It is an editable masked image rather than a flattened or tightly trimmed bitmap. Copying does not automatically hide the source below it. UI copy explains these behaviors. Apply also cancels an unfinished brush/selection gesture before committing.

37 model/integration checks and 59 offline workflow checks pass. New coverage includes independent pixel/mask data, geometry recovery, exact selected coordinates, source preservation, layer ordering, movement, validated reopen, limits, Undo/Redo and unfinished Apply. An independent Inkscape alpha check confirms inside opacity, outside transparency, flipped selection alignment and a soft boundary on a copied layer. Inkscape does not reproduce all browser color-filter effects; this check concerns alpha only. Fresh browser interaction and app downloads remain pending under the existing browser policy block.

## Export controls and real photograph

See EXPORT-AND-PHOTO-QA.md for the Grace Hopper photo study, export settings, artifact inspection and exact limitations. The export dialog adds resolution/custom dimensions, locked proportions, PNG transparency preview and PDF density controls. Verification: 37 model checks, 59 offline editing checks and 15 export/photo checks pass. Independent PNG/JPG/PDF file inspection succeeds; native browser, upload/download and device interaction checks remain pending under the recorded policy block.

## Selection edge refinement and no-change cutout preview

Expand / contract area adjusts a selection's applied boundary by -3% to +3% of source-image width. Negative values contract the selected area; positive values expand it. Region masks apply the corresponding alpha erosion/dilation before feathering, with isotropic geometry in source-image space. Inside/outside erase and restore actions use the same selected-area semantics. The optional expand value persists with the region and is validated on import. Existing masks without it retain their previous rendering.

Preview cutout temporarily substitutes the proposed new layer in the page renderer, including its edge adjustment and feathering, without altering draft masks or document history. Original/edited comparison remains available. Back to editing restores the selection controls; copying commits the same edge settings to a new independent layer. Outline guides themselves remain unchanged, and adjusting the control affects the next area action/copy rather than rewriting past masks.

The real-photo study now uses a 0.4% contraction in addition to the refined polygon and feather. Manual edge placement still matters; this is boundary refinement, not automatic hair extraction or color decontamination. 39 model checks, 64 offline workflow checks and 16 export/photo checks pass. Independent alpha pixels confirm contracted cutouts discard edge pixels and expanded cutouts retain more area. Browser rendering, gestures and downloads remain unverified under the existing policy block.

## Unapplied draft protection

Image mask and crop sessions now register a dirty-state guard. Cancel, the header close button and Escape show Keep editing / Discard draft when mask edits, crop changes or a selection outline would be lost. The prompt hides the editor body without replacing its DOM, preserving event handlers, draft masks, selection geometry, local history and workspace settings. Keep editing restores the workspace; Escape from the prompt also keeps it. Discard closes without altering the document. Clean sessions and masks undone back to their initial state close normally. Apply and successful Copy bypass the warning after committing their document transaction.

Keyboard focus stays on the discard choice while it is shown; hidden editor controls are excluded from the modal focus trap. A beforeunload listener requests the browser's standard navigation warning when an active draft is dirty. Browser support, user-activation requirements and mobile behavior vary; native navigation prompts are not claimed verified. Drafts are not persisted as recoverable sessions. The existing document autosave remains separate.

39 model checks, 78 offline workflow checks and 16 independent-renderer export/photo checks pass. New coverage exercises production close/keep/discard methods, Cancel, close-button routing, Escape, prompt focus wrapping, mask Undo-to-clean, selection-only protection, crop guarding, Apply and Copy. Fresh browser interaction and actual navigation/download checks remain pending under the prior policy block.

## Local mask accuracy and Hopper example correction

Added a 0.1–25% brush diameter range with exact numeric entry and a Detail brush preset (0.3%, hard edge, at least 2× zoom). Fine brush values persist and import validation rejects undersized values. Selection point editing now inserts a midpoint after the selected point or removes a vertex while retaining at least three points and valid area. Optional Smooth boundary renders a closed cubic outline through the vertices; the visible guide and stored region use the same path calculation. Existing polygon masks remain straight unless smoothing is explicitly enabled. Smooth boundaries can overshoot around tight corners; users can add points or leave smoothing off for sharp features.

The Hopper example was retraced from the actual photograph around the hat, hair, neck and shoulders with a denser source-space outline, gentle smoothing, 0.2% feather and 0.2% contraction. Independent rendered inspection now shows the previously prominent neck flag strip removed. Pixel checks at (104,188) and (105,184) in the half-size export changed from opaque orange flag to zero alpha; shoulder halo samples at (260,212) and (270,219) are now transparent. The face sample at (150,140) remains fully opaque. This verifies these specific remnants, not automatic hair extraction or every edge.

42 model/integration checks, 82 offline workflow checks and 17 independent-renderer export/photo checks pass. New coverage includes midpoint insertion/removal, vertex limits, smooth SVG/persistence, fine brush sizing, the hard-edge preset, actual editor callbacks, Undo and specific photo problem pixels. Review-bundle syntax passes. Browser gesture accuracy, native rendering and downloads remain unverified under the existing policy block.

## Tight copied cutouts
Copied selections now use a reversible source crop around the selection, including the smoothed curve control hull, positive expansion and four blur sigmas of feather padding. Bounds are conservative rather than an alpha-pixel scan. Existing mask edits may make the visible content smaller still. Flips swap crop edges; rotation keeps source pixels stationary. Restore full crop recovers original geometry and pixels. The crop workspace now previews image flips.

Independent crop edges allow 0–99.5%, with at least 0.5% retained on each axis. Runtime edits clamp against the opposite edge; imports reject empty/crossing crop windows. Checks: 44 model, 82 offline workflow and 18 export/photo checks. Independent renders compare tight and full-box alpha placement with smoothing, feather, expansion, flips and rotation. Browser/download/touch verification remains pending under the existing policy restriction.

## Touch precision and navigation
The mask editor now has explicit Pan image / Resume editing controls. Dragging pans the scrollable image stage and cannot paint or adjust selections. Fit resets scroll position; selecting another editing section exits Pan mode. A secondary pointer cannot take over an active gesture. Cancellation and lost capture end pan safely and restore unfinished crop/point edits.

Detail view provides a 160px magnifier at 4× the current workspace scale, centered on the active pointer and retained after pointer leave. The dock is laid out when enabled, before a gesture, to avoid moving the workspace during a drag. It shows the edited pixels, selection boundary and brush footprint; Detail brush enables it automatically. Pan/comparison hide it.

Touch selection points and resize corners, plus visual crop corners, resolve the nearest handle within 22 CSS pixels. Dense outlines choose the closest point; numeric point controls remain available. Dialog buttons are at least 44px high on coarse pointers. This is single-pointer navigation; pinch zoom is not implemented.

45 model, 96 offline workflow and 18 independent export checks pass. New tests invoke real callbacks with layout doubles to cover navigation without dirtying drafts, magnifier position/scale and stable docking, near-miss touch grabs, secondary-pointer isolation and interrupted gestures. Actual iPad ergonomics, native browser pointer capture, uploads and downloads remain pending; these checks are not a device/browser validation.

## Upload-to-export verification — November 3, 2026
Completed all available offline checks: 45 model/integration, 96 editor-workflow, 10 upload/import callback and 18 independent export/photo checks (169 total). The new upload/import script invokes production callbacks with canvas and decoder doubles; it does not test native image decoding or file pickers. It uploads a simulated image, copies a selection, resizes it into a poster, serializes and imports the editable project, and checks image source, cutout mask, geometry and text. Existing workflows verify crop, masking, refinement, navigation, Undo/Redo and local save/reopen. Independent SVG rendering and file parsing verify transparent PNG, opaque JPG and multipage PDF dimensions and contents.

Found and fixed: resampling a very thin/tall image could produce a zero-pixel canvas axis and invalid embedded data; both axes now retain at least one pixel. Tall uploads now fit both page dimensions, and displayed proportions follow the resampled pixels. Decoder failure reports an explicit error; unavailable canvas contexts report a clear drawing-surface error. Callback tests cover rejection, temporary URL cleanup and preservation of existing design content.

Still blocked by the prior browser URL-policy restriction: interactive browser run, native raster decoding, actual downloaded files and hands-on iPad gestures. No substitute browser/control method was used. These results do not constitute complete browser/device acceptance. No production deployment or main merge.

## Save reliability and classroom print review — November 3, 2026
175 checks pass: 45 model, 96 workflow, 12 upload/import, 22 export/print. Failure injection found that importing or opening another saved project ignored failure to save the current design. Both operations now stop with instructions to download a project backup; tests confirm the current document remains intact. Existing tests cover successful editable backup import and malformed-backup rejection.

Independently rendered Classroom Poster and Exit Ticket pages were visually inspected. The poster headline wrapped into four lines and overlapped supporting text; reducing the template headline from 66px to 56px restores the intended two lines. The corrected poster was rendered and inspected again. The worksheet shows three clear response areas without overlaps. Geometry checks keep objects at least 40px (about 0.42in) inside the page, and text is at least 15px (11.25pt). Main content is inset farther. PDF parsing confirms two 612×792pt US Letter pages with 1224×1584 raster content at this test's 1.5× setting.

This verifies files and independent render layout, not a physical printer, browser font metrics or device interaction. Real iPad gestures, native picker/decoder, downloads and physical printing remain unverified. The prior URL-policy restriction still blocks hands-on browser testing; no alternative browser path was attempted. No merge or production deployment.

## Multi-tool evidence workshop — November 3, 2026
Created and saved a three-page editable example: photo evidence, evidence table, vocabulary cards. Production controllers exercise sticky notes, individual text edits within groups, style copy/paste, grouped duplication/deletion, Undo/Redo, locks, nudges, layer reordering, table building, repeat-to-grid, alignment/distribution and resource generation. A photo selection uses a reversible mask with smoothing, feather/contraction, resizing and flip; the original remains unchanged. Save/reopen and clean SVG output preserve the result. The scenario uses DOM field doubles, not browser gestures.

Visually inspected independent PNG renders of all three pages: photo/question/note remain separated, table headings and cell rows are readable, and vocabulary definitions fit their cards. Parsed the three-page PDF to confirm Letter dimensions and embedded page images. The saved example is examples/evidence-workshop.artstudio.json. It intentionally uses a simple rectangular photo selection, not a claimed automatic background removal.

Found/fixed: on a very small custom page, a dense table could create negative-width text boxes and invalid project geometry. Table insertion now rejects layouts whose cells cannot hold editable text, with guidance to reduce rows/columns or enlarge the page. Added regression coverage.

190 checks pass: 45 model, 96 photo workflow, 12 upload/import, 23 export/print and 14 multi-tool scenario checks. Browser interaction, actual device ergonomics and native downloads remain unverified under the prior URL-policy restriction. No merge or production deployment.
