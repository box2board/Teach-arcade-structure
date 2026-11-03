# Art Studio classroom creation run-through

## Resource created through the editor

Observe • Question • Discover: two Letter pages, a Curiosity Club poster and matching discovery-log exit ticket. The editable JSON in `examples/curiosity-club.artstudio.json` is the actual browser-downloaded project, not a programmatically assembled replacement.

Used the real UI to rename the project, edit template text, change type size and text box dimensions, apply Arcade title gradient/outline/shadow, delete template decoration through Layers and toolbar, insert a practice image, edit geometry, crop each edge, apply rounded frame and shadow, erase and restore with a soft brush, compare original/edited, add a page, apply Exit Ticket template, write three custom prompts, save, and download the editable backup.

The illustration is deliberately the built-in practice landscape; this run did not validate external image upload.

## Findings and resulting changes

1. Edited text kept obsolete layer names. Text edits now refresh the layer name unless explicitly renamed by the user. Shared state/inspector/inline-edit behavior preserves manual names.
2. Numeric image resizing stretched the illustration. Image dimensions now keep proportions by default; Free resize is explicit. Both dimensions can still be changed intentionally when needed.
3. Page navigation retained generic template names, with no rename command. Added Rename page to the page actions menu; it is a normal undoable document edit.
4. A three-line heading could outgrow its original selection box without notice. Added text overflow warning and Fit box to text in Properties.
5. An independent SVG-rendering check dropped the image because the renderer required the older namespaced image reference. Added xlink:href fallback alongside href; the same serialized illustration and mask then render visibly. Its effects are still designed for the browser renderer.

## Verification and limits

20 automated model/integration checks pass, with new coverage for image resizing, undo/redo, automatic names and preservation of custom names. Existing checks cover masks, crop, save validation, history and export content.

The browser successfully created and saved the resource and downloaded the editable JSON. PDF generation reported two pages and 145 KB, but its download timed out. Recovery subsequently encountered a browser URL-policy rejection; no alternate browser-control mechanism was used. Final browser retesting of the new fixes and end-to-end PDF download remain pending.

Layout was inspected separately by rendering the exported project with the editor SVG renderer and Inkscape; both pages were viewed. That renderer does not reproduce all browser CSS shadow/image effects. The editable review preview uses the actual project from the UI.

## Next priorities

Reduce panel switching with a compact contextual image toolbar. Add visual crop handles and group drill-in editing. Complete a repeatable browser download/import regression workflow before release. This work remains isolated; no merge or production deployment.

## Workflow polish after the creation exercise

Added direct Crop, Erase / restore, Flip and proportion-lock controls to the selected-image toolbar. Visual crop supports dragging corners and moving the crop region, numeric edge controls, reset, Cancel and a single undoable Apply; the source image, mask and frame remain intact.

Grouped items can be selected individually from Layers, the group member picker or Alt-click. Text double-click also selects the individual member. Membership stays intact and Select whole group returns to group selection. Image corner resizing now honors Keep proportions; Shift temporarily toggles the constraint.

23 automated checks pass, including crop geometry and legacy fallback, individual group selection/edit/undo, and image drag-resize constraint behavior. Syntax and review-bundle checks pass. These additions have not received a fresh browser interaction test because of the browser policy block recorded above; crop gestures, group picker and PDF download remain hands-on verification items.
