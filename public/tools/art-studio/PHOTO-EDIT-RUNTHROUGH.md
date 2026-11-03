# Photo-editing workflow simulation

Task: turn an existing bitmap landscape into an “Explore Outdoors” travel cover. Reframe the picture, erase a distracting edge, restore an over-erased area, grade its color, flip it, apply a rounded frame and shadow, add grouped typography, save and reopen, and prepare a clean export.

This is an offline interaction simulation, not a browser playtest. It invokes the production crop and image-editor callbacks through DOM and layout doubles. The input is the editor's built-in 600 × 400 practice illustration, not a photographic portrait. No outside image upload, detailed subject cutout, live pointer capture, visual layout assessment, PNG/JPG/PDF rasterization or download was verified. The real browser remains blocked by the earlier URL-policy rejection. No alternative browser surface was used.

## Original procedure and observations

| Step | Procedure | Observation / evidence |
| --- | --- | --- |
| Set up | New 1200 × 800 project; insert practice bitmap; resize to 1080 wide | Proportion lock produces 720 high; original embedded source stays intact. |
| Trial crop | Drag upper-left corner, then Cancel | Document remains identical to before opening the dialog. |
| Commit crop | Drag to 10% left and 5% top; Apply; document Undo and Redo | Correct edge values return; applying crop is one history entry. |
| Grade | Set brightness 107%, contrast 114%, saturation 85%, temperature 10 | Values survive reopening and appear in export SVG filters. Perceived color quality is unverified. |
| Erase | Open brush workspace; set size 12%, softness 65%; drag a stroke | Draft stroke does not alter the document until Apply. |
| Correct | Undo stroke, Redo; switch to Restore; paint a smaller correction | Applied mask retains erase then restore order and softness. |
| Inspect | Zoom to 150%; show original; attempt to paint; return to edited | Zoom label changes and comparison blocks additional paint. Browser sharpness, cursor alignment and scroll feel remain unverified. |
| Commit mask | Apply; document Undo and Redo | Whole mask edit reverses in a single history step. |
| Abandon edits | Reopen, paint another stroke, Cancel | Previously applied mask remains unchanged. |
| Interrupt | Reopen, Undo a stroke, begin another gesture, pointer-cancel | Reproduced bug: the new gesture removes the redo stack even though the gesture is cancelled. |
| Reset probe | Reopen; Restore entire image | Reproduced limitation: no local Undo remains to recover those strokes. Cancel recovers the pre-session document but also discards all other draft work. |
| Finish | Flip image; rounded frame and shadow; headline and subtitle | Serialized renderer includes those operations; no claim of visual approval. |
| Edit typography | Group headline and subtitle; select subtitle individually; change text | Group membership is preserved; whole-group selection works afterward. |
| Organize | Move bitmap to back | Typography remains above bitmap in layer order. |
| Save / reopen | Mock localStorage save; serialize editable JSON; validate and reopen | Image source, crop, mask, adjustments, text and group relationships persist. Import intentionally regenerates page IDs and normalizes absent group IDs to null. No real browser persistence or downloaded-file import was tested. |
| Export preparation | Generate clean normal and transparent SVG source | Crop, mask, filters, frame and text present; editor handles absent. PNG, JPG, transparent pixel alpha, PDF and downloads remain untested. |

## Original findings, ordered by priority

1. **Uneven cropping distorts the image.** The crop changes the source viewBox but retains the old object dimensions, with `preserveAspectRatio="none"`. In this exercise, a 600 × 400 source loses 10% of its width and 5% of its height: retained content is 540 × 380 (1.421:1), displayed in a 1080 × 720 frame (1.5:1). That introduces about 5.6% horizontal distortion relative to vertical. This is a renderer/geometry finding, not a visual observation. Recommended: distinguish “crop image” (resize the frame to the retained aspect) from “fill frame” (preserve pixel proportions while reframing).
2. **Interrupted brush gestures destroy redo.** Pointerdown clears redo; pointercancel removes the draft stroke but does not restore redo. Recommended: invalidate redo only when a gesture commits, or snapshot it for cancellation.
3. **Restore entire image cannot be undone inside the brush session.** It empties both stroke arrays. Recommended: local history for reset, so users can compare the full reset and recover without abandoning the session.
4. **Crop range restricts composition.** Each edge stops at 45%, so users cannot keep only a far-left or far-right subject. Resolved in the tight-cutout update: opposing edges now retain a minimum 0.5% window and allow far-edge subjects.
5. **Brush work is disconnected from the final composition.** The workspace intentionally removes crop, flip and frame while painting. That makes it harder to judge which edge needs cleanup after reframing. Recommend a switch between original-image editing and an accurate final-composition preview, with clear orientation.
6. **Precision cutout tools are missing.** The available method is manual erase/restore. There is no selection boundary, lasso, polygon selection, color selection, edge refinement or clone/heal tool. This exercise tests edge cleanup; it does not establish suitability for hair, fur or complex subject isolation. Start with a polygon selection and feathering before advanced automatic tools.
7. **No overall before/after view.** Brush comparison is useful but excludes the complete composition and other stages. Recommend project-level before/after or a reference snapshot, then evaluate image grading and crop together.
8. **A masked image does not guarantee a transparent page.** Transparent export omits page paint, but visible shapes and text remain. Export labeling should continue to make the scope clear. Downloaded alpha needs a real raster check.

## Result and next pass

`examples/explore-outdoors.artstudio.json` is the actual output of the offline workflow script, explicitly labeled as a simulation. Run `node scripts/simulate-art-studio-photo-edit.mjs` to repeat the exercise; add `--write-example` to regenerate the sample. Sixteen assertions cover successful procedures and two reproduced defects; passing those defect assertions confirms the bugs exist, not that they are resolved. Existing 23 model/integration checks also pass.

The original simulation identified crop distortion, interrupted-gesture redo, and reset history as the first fixes. Those are now implemented below. Next, conduct a real browser pass with an uploaded photograph: crop, detailed cutout, original/final comparison, save/reopen, and PNG/JPG/PDF downloads with pixel inspection. No merge or production deployment was performed.

## Implemented corrections

Crop edits now change the image box dimensions in proportion to retained source content. The retained pixels keep their displayed scale and canvas position, including rotated images. Both visual and numeric crop controls share this behavior; Reset crop restores the full image geometry, and Undo/Redo restores the previous crop. The source bitmap is preserved. Existing projects keep their current crop framing on load; this does not retroactively repair an image that was already stretched.

Brush geometry and the brush workspace now recover the uncropped displayed dimensions, keeping circular brushes aligned after an uneven crop. Local brush history includes Restore entire image as an ordinary undoable edit. Starting a stroke keeps redo intact until pointerup commits the stroke; pointercancel and lost pointer capture discard the incomplete stroke while preserving redo. Controls are labeled Undo edit / Redo edit because history also includes reset.

The updated simulation passes 19 checks. It now verifies the correct outcomes for cancellation, lost capture, reset Undo/Redo, exact mask recovery, crop dimensions and retained-pixel position. The model/integration suite passes 26 checks, including crop reset, rotation, idempotence and source-space mask geometry. The saved simulation example has been regenerated using the corrected crop behavior. Browser interaction, raster exports and downloads remain pending under the same browser policy block. Selection tools and overall before/after remain future work. Final-composition preview is implemented below.

## Final-composition preview

The brush editor now offers Final composition / Back to painting. The preview renders the whole page with the draft mask and the selected image's crop, flip, frame, rotation and shadow, alongside text and other layers. Painting pauses in this view. Local Undo/Redo can be inspected before applying; switching views alone does not alter the project. Returning to painting restores the original source orientation and coordinates. This resolves the preview gap in original finding 5; it does not add painting directly in transformed page coordinates or an overall before/after comparison. Updated coverage: 27 offline workflow checks and 26 model/integration checks pass. Browser layout and download verification remain outstanding.

## Precise area editing

Original finding 6 is partially addressed: rectangle and polygon outlines now support feathered erase/restore operations inside or outside the boundary. These are manual source-space selections; automatic subject detection, complex edge refinement, clone/heal and overall before/after are still future work. Selections are transient editing guides, while applied area masks persist alongside brush strokes. Rectangle/polygon edits share history and the final-composition preview. Verification: 29 model checks, 35 offline workflow checks and four independent alpha raster checks pass; browser interaction and downloads remain pending.

## Full before/after comparison

Original finding 7 is now addressed for the selected image. In Final composition, Show original / Show edited compares the embedded source against all current image edits while retaining the rest of the page. Original geometry is reconstructed at the current image scale rather than reverting the entire page's layout history. No edit is applied by comparison. Selection refinement and real-photo browser/download verification remain next priorities. Coverage: 30 model checks and 37 offline workflow checks pass; fresh browser verification is still outstanding.

## Refine a selection before applying it

Rectangle and polygon selections can now move and resize through Adjust selection, with numeric source-percentage bounds as an alternative to dragging. Prior mask operations remain fixed when the selection outline changes. Refinements themselves are temporary; erase/restore actions commit their current geometry to draft mask history. Coverage: 33 model checks and 43 offline workflow checks pass. The next validation priority remains a real-photo browser exercise and end-to-end export/download inspection once browser access is available.

## Controls and individual outline points

The crowded mask dialog is now organized into Brush, Selection and Preview. Shared history/zoom/commit actions remain available in every section. Closed selection vertices can be moved individually by dragging or through a point picker and X/Y coordinates. Current verification is 35 model checks and 52 offline workflow checks. Copying a selection to a new layer, export size controls, and real-photo browser/download testing remain future work.

## Isolate a selection as a reusable layer

Copy selection to new layer now keeps the source layer unchanged and creates a separately movable masked image carrying the current draft. It retains original embedded pixels and editable masking. Its bounding box covers the full source; crop/frame are removed, so this is not a tightly trimmed raster cutout. Layer insertion is undoable in one step. Verification: 37 model checks, 59 offline workflow checks and an independent alpha/flip/feather raster check pass. Export dimensions/resolution controls and a real-photo browser/download exercise remain next priorities.

## Protect unfinished work

Unapplied mask/crop changes and selection outlines now trigger an explicit discard choice when the editor is closed. Keeping the draft preserves the existing editor DOM and local history. Successful Apply/Copy closes directly; unchanged sessions close normally. Browser navigation requests a native warning for dirty drafts, with real device verification still outstanding. No draft-recovery storage has been added. Current checks: 39 model, 78 offline workflow and 16 independent export/photo checks pass.
