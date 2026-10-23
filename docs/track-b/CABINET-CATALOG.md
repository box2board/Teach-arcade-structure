# Arcade Cabinet catalog contract

The Cabinet is a teacher's selection of public resources. Each account stores only the resource type and permanent resource ID. The public catalog supplies the current title, description, artwork, and launch URL. Updating that metadata updates Cabinet tiles after deployment without copying or migrating teacher bookmarks.

## One published entry, two surfaces

- Teacher Tools: cards in `public/tools/index.html` feed `public/teacher/tool-catalog.js`.
- Arcade Review Games: cards in `public/arcade-review-games/index.html` feed `public/teacher/arcade-catalog.js`.
- Brain Arcade: cards in `public/brain-arcade/index.html` feed `public/teacher/brain-catalog.js`.
- Review Lab: `GAMES` in `public/review-lab/catalog.js` is already shared by the public library and Cabinet. Topic selection is enabled for games supporting question banks or listing compatible topics; standalone games open directly.

`public/teacher/cabinet-catalog.js` exposes the same game/tool allowlists to the browser and account API. There is no second manually maintained tool list.

## Publishing a new resource

Add the resource to its public catalog once, including its permanent ID, local launch URL, title, description, and optional local artwork. Run `npm run build`. The build regenerates the Cabinet catalogs, and the resource becomes available in Explore when that deployment is published. It does not add anything to teachers' saved shelves automatically.

For Tools and Brain Arcade anchors and Arcade Review Game articles, write `data-resource-id="permanent-id"` on the card. Keep the existing card classes so the build can read the catalog. Review Lab uses the existing `id` field.

IDs must be unique within their resource type and never change when a title, artwork, or URL changes. Existing IDs—including legacy IDs containing an old URL—are opaque keys: preserve their exact value. New ID names should describe the resource rather than its location. Generated files are outputs; edit public catalog entries instead.

The build rejects missing or duplicate IDs, duplicate launch URLs within a resource type, missing titles/descriptions, unsafe/external launch URLs, missing target pages, and missing artwork. The account API accepts only known IDs and resolves ownership from the signed-in teacher.

Only published catalog entries are included. A new unlisted folder, draft, or prototype does not become a public Cabinet choice. Adding a future library section requires connecting that section's catalog once; subsequent entries in it then flow through automatically.

## Existing teachers and content lifecycle

All original tool and game IDs are retained. City Canvas and Block Builder remain valid tool bookmarks; City Canvas is also discoverable as a Brain Arcade game. Type and ID together identify a bookmark, so these placements do not collide.

Do not remove a published ID to rename or move a resource. Change its metadata and keep its ID. Removing/retiring content needs an explicit lifecycle policy and should not silently repurpose an existing ID.

Saving a game/tool is currently bookmarking it. Saving configured game sessions or work created inside a tool is separate functionality and is not claimed by this catalog change.

Teacher-created question sets remain account-backed, private by default, and explicitly publishable. A public set can be played, saved as a reference following its creator's updates, or copied into an independent private set. This change does not change those privacy or ownership rules.

## Verification

`node --test scripts/test-cabinet-catalog.mjs scripts/test-teacher-foundation.mjs scripts/test-teacher-workflow.mjs scripts/test-teacher-sets.mjs scripts/test-teacher-set-editor.mjs scripts/test-multi-answer-gameplay.mjs`

Covers future entry discovery, all source/generated catalog matches, metadata and URL changes with stable IDs, original bookmark compatibility, invalid catalog publication failures, API save/read/remove for every game and tool, and teacher-set workflows. Public libraries remain usable without signing in.
