# Cabinet catalog maintenance

The public resource libraries are the source for Cabinet Explore. Teacher bookmarks store permanent IDs, not copied titles, artwork, or launch URLs. The browser and API use the same generated allowlist.

## Register a new public resource

- Arcade Review Games: add its public library card with a unique `data-resource-id`.
- Brain Arcade: add its `game-card` with a unique `data-resource-id`.
- Mini Games: add its `mini-card` with a unique `data-resource-id` such as `mini:new-game`.
- Teacher Tools: add its `card-link` with a unique `data-resource-id`.
- Review Lab: register the game in the shared Review Lab catalog. Set question-bank compatibility deliberately.

Run `node scripts/build-cabinet-catalog.mjs`. It validates permanent IDs, launch pages, local artwork, and duplicate links, then generates the catalogs used by both accounts and the Cabinet.

Keep IDs unchanged when renaming a resource, changing artwork, or moving its page. Update its public card; rebuild. For a genuinely different replacement, use a new ID and deliberately handle old bookmarks. Do not silently point old saves at unrelated content.

## Question sets

Teach Arcade Originals remain in the shared website question banks. A teacher's customized copy is a private, independent Supabase record that can later be published. Official branding comes from the official catalog, never a teacher-entered title or description. A complete set can contain one or more questions; empty or unfinished sets remain private drafts. Fixed-round games may repeat short banks, while variable chest rounds shorten their count.

## Keep the preview current

Before a Cabinet preview update, fetch current `main` and the development branch. Integrate newer website releases in an isolated branch, regenerate catalogs, run the account/catalog/question-set checks and site build, then update only the development preview. Use expected-head guards when advancing remote branches so another session's work cannot be overwritten. Production release remains a separate, explicitly authorized action.

Integration checkpoint, November 6, 2026: current main's RV release and twenty Mini Games are preserved. The Cabinet catalog contains 70 games and 20 tools. Existing bookmark IDs are retained.
