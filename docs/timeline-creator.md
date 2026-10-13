# Visual Timeline Creator

Route: `/tools/timeline-creator/`, linked from Teacher Tools and Graphic Organizers. Work remains on PR #183 and its Vercel preview; no merge or production deployment.

## Classroom workspace

A visible creative toolbox offers Images, Video, Memes, Emojis, Text & notes, and Connections. Large event cards support direct title/caption/date editing. Valid edits and media additions save immediately to the browser draft. More options expose precise dates, end dates, colors, image descriptions, cropping, significance and source credits. First-time visitors get a simple starting screen instead of a populated editor. Existing drafts are retained.

Design/layout settings are tucked into a dialog. Horizontal timelines, vertical stories, three themes, even spacing, true time scale, historical eras, zoom, focus mode, undo/redo, duplicate/delete and presentation remain available. Dates determine chronological order. Nearby true-scale cards stack without overlapping.

Teachers can add directions, choose History/Biography/Story/Science starters, save an editable project and distribute a copy. Directions persist through project import and appear in the PDF notes. Starter dates are clearly marked as examples to replace.

## Media

- Images: upload or drop PNG/JPEG/WebP onto an event. Files up to 10 MB are decoded locally and recompressed to at most 1000px. Upload completion is bound to the original event, even if selection changes.
- Video: validated YouTube and Vimeo links; no arbitrary iframe HTML or URLs. Players load only after Play is clicked. YouTube uses `youtube-nocookie.com`. Cards and presentation provide direct links when a video does not allow embedding. Vimeo hash query parameters are retained when supported.
- Memes: uploaded/event picture plus editable top/bottom text with a live preview; text appears on cards, slides and visual exports.
- Emojis: searchable labeled 56-item picker with remove action. Stamps remain independent of images/video. Emoji appearance in PNG/visual PDF depends on the browser's emoji fonts.
- Connections: choose two events and a relationship label. Connections appear as directional labeled chips under the timeline and in the visual export; deleting an event removes its connections, and Undo restores them.

## Exports and storage

Browser-local autosave under `teacharcade_timeline_v1`; portable `.teacharcade-timeline.json` files; direct PNG/PDF downloads without a print dialog. No accounts, backend, cloud synchronization or multiplayer collaboration.

PDFs include a visual overview plus complete event text, teacher directions, sources and clickable video links. Video cards use the attached picture or an illustrated play placeholder in the overview; playback remains digital. Blank PDF is a six-event worksheet retaining the title. All original project files remain compatible; new fields default to empty values during validation.

Limits: 40 events, 8 eras, 40 connections, 19 MB serialized data; 20 MB import-file limit; raster exports bounded to 16 megapixels and 8192px per axis. User text is escaped for SVG and HTML. Images must be embedded raster data URLs. Invalid dates, executable media URLs, remote image URLs, unsupported schemas and invalid connections are rejected. Browser storage errors leave editing usable and direct users to save a project file. Invalid date drafts and unsaved media/directions trigger unload protection.

PDF appendix uses existing bundled jsPDF and DejaVu Sans font (Latin, Greek, Cyrillic/common symbols; other script coverage not guaranteed). Full caption/notes remain available even when compact visual text is abbreviated.

## Verification

`TEACH_ARCADE_JSDOM=/path/to/jsdom/lib/api.js node scripts/test-timeline-creator.mjs`

Set `TIMELINE_QA_DIR` for deterministic SVGs and a long Unicode PDF sample.

Passed: visible toolbox, fresh starting screen, direct editing, immediate save/recovery, media target association, emoji picker, memes, valid click-to-play providers and rejected spoofed/malicious URLs, advanced fields, invalid-date unload protection, teacher directions, connections and deletion/history, templates, portable old/new projects, layouts, 40 crowded cards without overlap, presentation keyboard controls and blocked-storage fallback. Actual PDF notes paginate and retain all 120 long Unicode test sentences, directions and clickable video URLs. Rendered visual exports were inspected. The original production build passed existing bank/crossword checks; this redesign changes only creator files, documentation and its tests.

No browser-control skill is available in this managed environment. Actual image decoding, external video playback, mobile touch behavior and native download dialogs still require user review on the Vercel preview. Upload interaction tests use decoded-image/canvas doubles and do not prove browser image decoding. SVG rendering tests do not prove the HTML editing layout.
