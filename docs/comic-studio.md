# Comic Studio

First creation-tool prototype at `/tools/comic-studio/`, linked from Teacher Tools. Built as browser-local HTML/CSS/JS; no account, backend, or external artwork dependency.

## Included

- Single panel, three-panel strip, four-panel page, and six-panel page layouts.
- Six panels remain in each project; layout changes do not delete hidden panels. Exports include only visible panels.
- Four original SVG characters, three expressions, two poses, four props, and five backgrounds.
- Speech bubbles, thought bubbles, captions, and editable dialogue.
- Pointer/touch dragging, arrow-key movement, size and numeric position controls, character/prop flipping, layer changes, duplication, and removal.
- Copy a panel to the next panel, with fresh object IDs and undo support.
- Undo/redo, browser autosave, JSON project download/import, and a replaceable example project.
- Full comic preview, PNG download, and direct PDF download without a print dialog. PDF embeds the rendered comic page as an image; selectable-text PDF output is not part of this version.

## Files

`model.js` owns project creation and strict import validation. `art.js` owns original artwork and scene/page SVG generation, with XML escaping of all user text. `studio.js` owns UI, history, editing, persistence, and exports. No third-party character or franchise artwork is used. The existing local jsPDF bundle handles PDF creation.

Project limits: six panels, 40 objects per panel, 240 characters per bubble/caption, 120-character title, 80-character author, 2 MB import limit. Panel edges crop objects, including oversized speech bubbles; the editor and export apply the same cropping. The interface explicitly explains this behavior. Browser drafts do not sync between devices; project files do.

## Validation

`TEACH_ARCADE_JSDOM=/path/to/jsdom/lib/api.js node scripts/test-comic-studio.mjs` exercises assets, expressions/poses, dialogue escaping, sizing, duplication/removal, undo/redo, panel copying, layout preservation, import rejection, pointer/keyboard movement, PNG/PDF download requests, and blocked-storage fallback.

A complete four-panel sample was rendered from the actual SVG artwork and visually inspected. DOM tests mock browser canvas/download mechanics, so they do not prove native Safari/iPad downloads or pointer behavior. Browser visual QA is outstanding in this environment. Preview only; merge is a separate user action.

Graphic Organizer Studio remains independent. Comic Studio precedes Map Maker, Museum Maker, and Choose Your Path Studio in the agreed creation-tool sequence.
