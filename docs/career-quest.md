# Career Quest

Career Quest lives in `public/career-arcade/career-quest/`. It remains a static, anonymous classroom simulation with browser-local saves. No account, server-side reporting, or authenticated teacher lock is implemented.

## Journey

Discover (10 interest prompts) → Explore (searchable career cards) → Plan (training and living arrangement) → Live (five working years) → Reflect (decision trail, budgets, written responses, text export).

Each year contains a workplace decision, a money decision, and at most one optional life event. Each response opens an explicit feedback screen before the next decision. At year-end, the budget settles once, and the student reviews decisions before advancing. All five years complete; there is no card limit that cuts the timeline short.

## Model assumptions

- Existing career income ranges are retained as illustrative inputs, not verified wage data. The interface labels this clearly.
- Training costs and salary modifiers are example models. Curated pathway groups replace randomly assigned education options in the UI. These do not certify real-world eligibility or licensing. The five years begin after training.
- Starting cash: $2,000. Starting debt: chosen training model.
- Gross annual income: midpoint of the career's example starting range × training modifier. No promotion or inflation model is implied.
- Taxes: round(gross × 22%). Regular monthly living costs: $1,600/$2,200/$3,000 for low/average/high, minus $350 for shared housing or plus $350 for solo housing. These include everyday essentials.
- Annual interest: round(current debt × 5%), added to debt. Scheduled annual payment: 10% of initial training debt, capped by debt owed and cash available after regular income and expenses.
- Scenario monetary effects are one-time cash/debt changes and do not scale with difficulty. Difficulty scales abstract skill and well-being effects and optional-event probability. Extra debt payment transfers are capped by available cash and debt owed.
- Negative cash is an unresolved funding shortfall, visibly explained, rather than automatic hidden borrowing.
- Interest responses affect recommendations only, not demonstrated work skills. Skill growth in the report measures change from the start of working years.

## Persistence

Version 2 saves snapshot teacher settings at launch, retain the current scenario before displaying it, retain feedback progression and settled ledgers, and save reflection responses. Setup changes affect only the next run. Old saves are left intact; continuing one explains the version difference. Starting over requires confirmation when an unfinished save exists. Malformed JSON is handled safely. Storage failure falls back to in-memory progress and a visible warning. Replay restrictions are a shared-device convenience, not a security control.

## Verification

The regression harness uses jsdom to exercise the actual page and event handlers. Install test tooling outside the checkout, then run:

```sh
npm install --prefix /tmp/cq-check jsdom --no-audit --no-fund
node scripts/test-career-quest.mjs /tmp/cq-check/node_modules/jsdom/lib/api.js
node --check public/career-arcade/career-quest/career-quest.js
git diff --check
```

Covers complete five-year runs with 10 and 15 decisions, resume without scenario replacement, one settlement per year, snapshot settings, transfer limits, fixed monetary amounts, no quiz-to-skill leakage, reflection persistence and escaped markup, replay restrictions, empty filters, legacy/corrupt saves, storage fallback, and 18 scenario schemas.

These checks do not establish visual browser rendering or download/print behavior. Browser layout, responsive sizing, native download, and print QA remain necessary before production release.

## Career explorer expansion — October 15, 2026

The catalog now includes 80 selectable careers across 16 fields. Thirty additions cover public safety/law, trades, repair, manufacturing, agriculture/animals, personal care, and further healthcare/engineering options. Police Officer is a selectable career with aliases including cop, law enforcement, sheriff, and patrol officer.

Each record includes BLS Occupational Outlook Handbook excerpts for a description, duties, work environment, entry requirements, pay context, and outlook, with its source title, URL, and review date. Seventy-seven distinct official pages were retrieved and checked for required summary sections. Some titles map to a broader or related occupation; the detail page identifies the BLS research profile rather than presenting all group figures as exact figures for the selected specialty. BLS government text is attributed in every profile. UI illustrations and field icons are original SVG interface artwork.

Card → full profile → choose career → training gives students information before they commit. National pay context remains separate from illustrative game income; a national median is not an entry-level offer. The new careers' model income ranges use 65–85% of the related profile's median, rounded to thousands, solely as game balancing assumptions. Existing game ranges remain intact. New skill weights and baseline status are gameplay parameters, not empirical aptitude measures.

Search matches titles, fields, and common aliases, handles punctuation/case, and tolerates plural query terms. Field and interest-match filters combine; empty states explain teacher restrictions without bypassing them. The grid initially renders 12 records and loads 12 more per action. Back navigation preserves search and filters. Old unrestricted settings and saved-run settings expand to include new careers/fields; intentionally restricted selections remain restricted.

Additional DOM regressions cover police/alias queries, all 80 complete records, source links and entry requirements, detail resume, preserved search, empty-state recovery, pagination, field filters, old all-careers settings migration, and custom teacher restrictions. Both full five-year runs continue to pass. Visual browser verification is still limited by protected preview access.

## 500-profile library — October 16, 2026 (UTC)

The catalog now has exactly **500 selectable profiles across 21 fields**, retaining all 80 prior IDs and adding 420 distinct O*NET occupation codes. The existing School Counselor and Career Coach profiles share one occupational code, so the full collection represents 499 distinct codes and 500 career profiles; the expansion does not manufacture synonyms to pad the count.

New profiles use actual descriptions, four core task statements, reported job-title aliases, and work-context survey ratings from the **O*NET 31.0 Database**. Work-context means are shown on their actual 1–5 scales with both endpoints and survey date/source retained in the data. Records recommended for suppression are excluded. Blank suppression flags on occupational-expert records are not treated as suppression. No duties, workplace ratings, or wage statistics are fabricated.

Education, related experience, training, 2025 national median wage (where available), and 2025–2035 employment change come from the BLS employment projections table, joined by the base SOC code. When an O*NET specialty is more specific than the BLS occupation, the interface identifies the broader BLS title. Missing wages remain explicitly unavailable; medians are not presented as starting salaries. All game pay ranges, skill weights, initial stress, and work-life scores are separate model assumptions. New game ranges use an illustrative 75% of the BLS median, with a 13% band; when a median is unavailable, an explicitly modeled tier is assigned from preparation level. These values are not real offers or predictions.

Each new profile links to its official O*NET profile and the BLS table. Attribution to USDOL/ETA, O*NET version, the CC BY 4.0 license, and Teach Arcade's modifications appear in the explorer source note and individual profile footers. O*NET content is not an endorsement of the activity.

### Rebuilding and provenance

The standard-library importer is `scripts/build-career-quest-catalog.py`. Supply a directory with these pinned files:

- `occupation_data.csv`, `task_statements.csv`, `job_zones.csv`, `sample_of_reported_titles.csv`, `work_context.csv`, `work_context_categories.csv` from `https://www.onetcenter.org/dl_files/database/db_31_0_csv/`.
- `projections.html` downloaded from `https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm` with the 2025 table. The importer rejects a different vintage.

Run `python3 scripts/build-career-quest-catalog.py --source-dir /absolute/source-directory`. It preserves the initial 80 profiles, balances selection across occupational families, excludes catch-all titles and incomplete records, includes common student interests, and writes the full catalog plus `data/catalog-manifest.json`. The manifest records all 420 added codes, exact input SHA-256 hashes, source URLs, versions, and category totals. Source CSVs total tens of megabytes and are intentionally kept out of the website.

### Usability and regression checks

The explorer renders only 12 cards initially, supports additional batches of 12, and now offers A–Z sorting. Immutable search fields are cached and each candidate is scored once per search. Teacher setup has its own career-name search; filtering the setup list does not uncheck hidden careers. Unrestricted 50- and 80-career settings/saves migrate to all 500; custom restrictions remain intact.

Regression checks exercise **every one of the 500 profile → training → budget → simulation paths**, source/license/context panels, required metadata, 420 distinct added codes, older catalog migrations, alias search, A–Z sorting, teacher filtering, and bounded initial rendering. Existing complete five-year flows and save/report checks continue to pass. The pretty-printed catalog is approximately 2 MB uncompressed and 235 KB under gzip; DOM batching prevents rendering all profiles at once. Layout/browser verification remains separate from these DOM checks.
