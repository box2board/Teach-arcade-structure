# PDF Workspace

Path: `/tools/pdf-workspace/`. Linked from Teacher Tools.

First release supports PDF merging, JPG/PNG to letter-size PDF, page thumbnails, drag reordering plus accessible arrow-button alternatives, rotation, deletion, undo, selected-page extraction, full-packet download, and optional page numbering. PDF bytes and thumbnails remain in browser memory; the tool does not upload files or persist them. Reloading clears the workspace. Protected PDFs are rejected without bypassing encryption.

Limits: 25 MB per source file, 150 pages per workspace, 20 undo snapshots. No existing-text editing, office conversion, OCR, advanced compression, or digital certificate signing. PDF forms, document bookmarks, and cryptographic signatures are not preserved by page copying; use original files when those features matter.

Libraries are locally vendored: pdf-lib 1.17.1 (MIT), PDF.js 3.11.174 (Apache-2.0). PDF.js dynamic evaluation and XFA are explicitly disabled. Licenses are included in vendor/. There are no runtime CDN dependencies for this tool.

Validation: JavaScript syntax and git whitespace checks passed. Executed application handlers and export functions against real PDF documents: reordering/merging, rotation, numbered export, selected-page extraction, PNG conversion, deletion/undo, clear/restore. Reloaded outputs with pdf-lib; independently extracted their text with Poppler to verify page order and numbering. Interactive browser QA was unavailable in this session; upload rendering, drag interaction, and mobile download behavior still need browser review.
