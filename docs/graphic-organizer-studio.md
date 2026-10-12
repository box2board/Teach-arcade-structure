# Graphic Organizer Studio

All 12 existing organizer URLs mount the shared engine in `public/tools/graphic-organizers/shared/`. The collection page remains the entry point. Existing metadata, canonical URLs, classroom explanations, navigation, and legacy localStorage entries are retained.

## Shared engine

- `model.js`: template catalog, clean project factory, strict JSON validation, and legacy migration.
- `studio.js`: DOM editor, autosave, text editing, add/remove/reorder sections, color/text size, undo/redo, project download/import, vocabulary archive, and printing.
- `studio.css`: editor, responsive template layouts, and print-only text rendering. Printable values are separate text nodes so long notes are not clipped by input controls.

No accounts or backend are required. A draft is saved per template in localStorage; this does not sync across devices and can be cleared by the browser. Downloaded `.teacharcade.json` projects are portable and reopen with Open project. Print / PDF uses the browser's print dialog and any available Save as PDF destination.

The 12 older `teacharcade_*_v1` keys are read when a Studio draft does not exist. Their originals are never modified. Vocabulary saved words are preserved alongside the current entry. The new project format is version 1 and identifies itself as `teach-arcade-organizer`; import validates the schema before replacing editor state and renders user text as text, never HTML. Limit: 100 sections and 100 archived words per project, 20,000 characters per text field, 3 MB per imported file.

## Validation

Run `TEACH_ARCADE_JSDOM=/path/to/jsdom/lib/api.js node scripts/test-graphic-organizer-studio.mjs` (or install jsdom and omit the environment override). The suite exercises all 12 templates, editing, portable round trips, save/restore, adding and reordering sections, undo/redo, legacy recovery, safe imports, malformed input, printing invocation, and storage failure fallback.

Browser visual QA and actual print pagination still require review. DOM tests do not prove Safari/iPad layout or browser download behavior. Preview branch only; merge is a separate action.

## Creation-tool sequence

1. Graphic Organizer Studio — this branch.
2. Comic Studio.
3. Map Maker.
4. Museum Maker.
5. Choose Your Path Studio.

Reusable save/import/export patterns can inform later tools, but each tool will have its own project type and content model.

## Optimization pass

Core KWL, Venn, Frayer, character, plot, and vocabulary sections retain their positions; branch templates retain their first main box. Added sections and table/sequence entries remain editable and rearrangeable. This prevents vocabulary archive fields from being remapped by accidental section movement.

Venn uses overlapping outlines on wide screens and a diagram above stacked comparison fields on smaller screens. Comparison tables use aligned paired cells, KWL offers more writing space, and core sections omit unnecessary controls. Focus mode hides surrounding page content; Escape exits it. Ctrl/Cmd+S downloads a project. Ctrl/Cmd+Z works for editor actions outside text fields; text fields retain browser editing shortcuts. Undo becomes available immediately while typing.

Print blank hides answer text only in the print layout, preserving project data. Printed headings and topic remain. A normal print clears blank mode, and afterprint clears it after a blank print. Tests cover semantic controls, immediate undo, focus/Escape, and blank-print data preservation. Browser visual QA remains outstanding.
