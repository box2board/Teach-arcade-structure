# Teach Arcade UX + SEO Audit — 2026-09-04

## Scope and method

The audit covered all 473 HTML files under `public/`, the shared navigation and stylesheet, content indexes, build scripts, robots directives, and the generated sitemap. Automated checks examined internal `href` targets, indexable-page titles, descriptions, canonicals, H1 counts, duplicate metadata, and JSON-LD syntax. Representative game, tool, organizer, simulation, subject, topic, and hub pages were also reviewed for resource prominence and mobile behavior.

## Prioritized audit summary

| Priority | Issue | Affected files | Why it matters | Proposed action / result |
| --- | --- | --- | --- | --- |
| **CRITICAL** | Sitemap removed `.html` from non-index routes even though the deployed files and canonicals use `.html`. | `scripts/generate-sitemap.mjs`, `public/sitemap.xml` | Search engines were given URLs inconsistent with the site's canonical URL scheme. | Preserve `.html` for file routes and regenerate the sitemap. **Fixed.** |
| **CRITICAL** | Ten indexable pages declared canonicals for a different URL or `/index.html` variant. | Arcade game, subject hub, topic, print-and-play, buzzer, and text-randomizer pages listed in the implementation section below. | Conflicting canonical signals can consolidate the wrong URL and weaken discovery. | Make each canonical match its actual public route. **Fixed.** |
| **HIGH** | Bell Ringers and Exit Tickets used the same title and description. | `public/teacher-tools/bell-ringers/index.html`, `public/teacher-tools/exit-tickets/index.html` | The pages compete with indistinguishable search snippets despite different classroom intent. | Give Exit Tickets unique metadata. **Fixed.** |
| **HIGH** | Several indexable app shells had no H1. | `public/escape/index.html`, `public/brain-arcade/block-logic/index.html`, `public/brain-arcade/emoji-case-files/index.html` | Direct arrivals lacked a programmatic page heading while visual gameplay remained intentionally compact. | Add visually hidden, descriptive H1s using one reusable utility. **Fixed.** |
| **HIGH** | Legacy redirect and debug routes were indexable. | `public/brain-arcade/crossword.html`, `public/tools/noise-meter.html`, `public/arcade-review-games/social-studies/wwi-trench-run/debug.html` | Thin redirects/debug output could appear in search and compete with useful destination pages. | Add `noindex` while retaining redirect link following. **Fixed.** |
| **HIGH** | Career Arcade placed three explanatory paragraphs before its only live simulation. | `public/career-arcade/index.html` | Teachers arriving from search had to pass supporting copy before reaching Career Quest. | Keep one concise orientation sentence, then show the game grid; preserve useful explanation below it. **Fixed.** |
| **HIGH** | SEO and link reports were snapshots and no repeatable validation guarded future changes. | `scripts/`, `package.json` | Canonical, duplicate metadata, broken-link, H1, and JSON-LD regressions could return unnoticed. | Add `npm run audit` as a repository-wide gate. **Fixed.** |
| **MEDIUM** | Social metadata is absent on a small group of indexable pages, including the top-level subject hubs and Career Arcade pages. | `public/subjects/{ela,math,science,social-studies}/index.html`, `public/career-arcade/**`, selected guide/tool pages | Shared previews are less consistent, but titles, descriptions, and canonicals are present. | Add page-specific Open Graph/Twitter data as each section is next maintained. **Not changed:** a safe sitewide metadata templating system does not yet exist. |
| **MEDIUM** | Navigation markup is injected client-side on many pages while other pages retain custom headers. | `public/assets/scripts/nav.js`, standalone game pages | Crawlers and no-JavaScript users receive less consistent navigation; a bulk conversion risks game shells. | Introduce a build-time include/template in a separate architecture task. **Not changed** to avoid a risky sitewide rewrite. |
| **MEDIUM** | Hundreds of subject leaf pages are intentionally `noindex`, and many are thin or act as placeholders. | `public/subjects/**` | Indexing all of them now would create low-value, overlapping landing pages. | Keep `noindex`; review content and intent by subject cluster before selectively publishing. **Not changed.** |
| **LOW** | Older pages mix `.html` links with directory-style links and some breadcrumbs use explicit `index.html`. | Multiple legacy HTML pages | It is visually harmless but makes authoring conventions harder to maintain. | Standardize opportunistically while retaining working URLs and redirects. **Not changed** because mass URL edits provide little immediate teacher benefit. |

## Safe fixes implemented

- Corrected canonical URLs in:
  - `public/arcade-review-games/ela/undertext-rifts-mood-tone.html`
  - `public/arcade-review-games/science/moon-mission-run.html`
  - `public/arcade-review-games/social-studies/wwi-trench-run/index.html`
  - `public/print-play-games/index.html`
  - `public/subjects/science/biology/cells-structure-function.html`
  - `public/subjects/science/biology/index.html`
  - `public/subjects/social-studies/us-history/index.html`
  - `public/subjects/social-studies/world-history/index.html`
  - `public/tools/buzzer.html`
  - `public/tools/text-randomizer.html`
- Corrected sitemap URL generation and made `noindex` detection tolerate either metadata attribute order.
- Added a repository-wide audit command that fails on broken internal links, missing/duplicate core metadata, route/canonical conflicts, incorrect H1 counts, or malformed JSON-LD.
- Added unique Exit Tickets search metadata.
- Removed redirect/debug routes from indexing and added accessible headings to three app-first experiences.
- Moved Career Arcade's supporting explanation below the simulation choices without deleting useful content.

## Architecture and internal-link observations

- The repository has strong top-level hubs for subjects, arcade games, Brain Arcade, Career Arcade, teacher tools, graphic organizers, simulations, and movie guides.
- Topic pages use breadcrumbs and the shared content mapping system to surface interactive experiences, which is a maintainable foundation for contextual links.
- Legacy aliases and parallel locations (`teacher-tools` versus `tools`, `.html` versus directory indexes, and multiple WWI game versions) should be consolidated only after traffic and inbound-link data identifies the preferred URL.
- The automated audit found no unresolved static internal-link targets after the fixes. Dynamic links assembled from runtime data are outside static validation and should continue to be tested in browser smoke tests.

## Five next priorities

1. Review the noindexed subject leaves cluster by cluster; merge competing intent and publish only pages with real resource value.
2. Add build-time shared head/navigation templates so social metadata, breadcrumbs, and navigation do not depend on repetitive hand edits.
3. Connect each arcade game to its most relevant subject/topic hub and add concise related-game links based on `data/contentMappings.js`.
4. Resolve legacy aliases and duplicate WWI implementations using analytics, then add explicit permanent redirects at the hosting layer.
5. Add browser-level mobile and keyboard smoke tests for the highest-use games and classroom tools.
