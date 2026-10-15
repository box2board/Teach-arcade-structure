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
