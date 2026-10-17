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

## Evidence audit and linked claims — October 16, 2026

This pass supersedes the earlier counts and sourcing descriptions above. There are now 500 distinct occupation codes. Each profile has eight clickable claim citations: definition, duties, work conditions, skills/qualities, entry categories, typical education, pay, and outlook. The footer identifies the official occupation/code, BLS row title/code, coverage, data years, dataset download links/checksums, license, and audit method. Work-context survey years are shown individually. Sources describe U.S. occupations.

Corrections include elementary/middle-school codes, narrower specialty titles, and consolidation of School Counselor/Career Coach and duplicate elementary-teacher records. Two distinct education occupations replace the duplicates. Removed IDs redirect in settings and saved journeys; custom restrictions remain restricted.

Seventy-four profiles use a broader BLS group. Explicit crosswalks cover laboratory technicians (29-2012 → 29-2010), substance abuse counselors (21-1011 → 21-1018), and elementary special education teachers (25-2056 → 25-2052). Group education is labeled as such. Financial Analyst and EMT lack detailed task/context/skill records in O*NET 31.0; checked BLS Handbook excerpts supply these sections with broader scope disclosed. Missing wages remain missing.

This is a reproducible official-record comparison, not certification of local licensing, school admission, employer requirements, or every original survey response. Game skill weights, recommendations, income ranges, training costs, and status scores remain classroom assumptions. Research skills now use source importance ratings or BLS qualities rather than game weights.

See `reports/career-quest-evidence-audit.md` and `.json` for the 500-profile evidence index. Each catalog record includes task IDs, survey element IDs/dates, record hashes, BLS values, and claim-to-source mappings. `data/evidence-sources.json` lists official raw download URLs and SHA-256 digests. Download those files and Handbook pages using their recorded filenames, then refresh/check:

```sh
python3 scripts/audit-career-quest.py --source-dir /path/to/official-files --write
python3 scripts/audit-career-quest.py --source-dir /path/to/official-files --check
node scripts/test-career-quest.mjs /tmp/cq-check/node_modules/jsdom/lib/api.js
```

The initial builder refuses to overwrite audited data. The checker compares all 500 regenerated factual sections and evidence with stored records. The browser harness checks eight citations per profile and all 500 profile → training → simulation flows. Visual browser QA remains outstanding.

## Discovery and life-model depth pass — October 16, 2026

This pass preserves the five-stage setup, all 500 audited research profiles, and their citations. It supersedes the ten-question discovery flow and the earlier flat living-cost model for newly started journeys. Existing version-2 working-year saves retain the original scenario bank and settlement rules. An unfinished legacy discovery session starts the expanded questions; answers from the old prompts cannot be mapped reliably.

### Discovery

There are 36 original Teach Arcade activity prompts, six for each RIASEC area: Realistic, Investigative, Artistic, Social, Enterprising, Conventional. Prompts describe concrete work and ask about enjoyment, not self-rated competence. Five responses use 0–4; a separate lack-of-experience option is excluded from averages. Answers are stored by question ID; revisiting replaces the answer. The six area averages are shown to students.

`career-interests.json` contains exact six-value OI profiles for all 500 occupation codes from the O*NET 31.0 `career_interest_types.csv`, with download URL, SHA-256, scale, license, and attribution. Rebuild with `python3 scripts/build-career-quest-interests.py --source /path/to/career_interest_types.csv`. Student and occupation profiles are centered independently; Pearson correlation ranks their patterns. Ties use title order. No correlation is presented as an accuracy percentage or probability of success. Up to eight positively correlated occupations are highlighted. Students see shared interest areas and can explore other allowed careers.

Recommendations require at least 24 numeric answers, at least three per area, an area average of at least 2.5, and a range of at least 0.5. Identical, insufficient, or uniformly low answers show an explicit low-information message and allow browsing within teacher-enabled careers. A teacher's recommendation-only setting applies when meaningful recommendations exist. These thresholds are transparent product choices, not validated cutoffs.

The questionnaire and ranking have not been psychometrically validated. This is not the official O*NET Interest Profiler. No claim of individual fit, aptitude, eligibility, or predictive accuracy is made. The interface links to the official assessment. Occupational ratings are source-backed; using them does not validate our classroom questions or custom matching method.

### Working-year model 3

New journeys have `modelVersion: 3`. Students choose housing, transport, an optional modeled household responsibility, and a 0/4/8% retirement contribution. Working years begin after training. All following dollar amounts/rates are explicit classroom assumptions, not sourced local prices, actual loan offers, tax law, or employer benefit promises.

| Monthly category, average-cost region | Model amount |
|---|---:|
| Shared / solo housing | $850 / $1,500 |
| Shared / solo utilities | $150 / $220 |
| Groceries | $370 |
| Car payment/fuel / transit / carpool | $430 / $130 / $260 |
| Auto insurance, car only | $130 |
| Health-plan premium | $190 |
| Phone/internet | $100 |
| Household/personal | $115 |
| Social/recreation | $150 |
| Optional family / dependent support | $300 / $750 |
| Routine medical spending | $60 |
| Routine repairs/replacements | $100 |

Low/average/high regional multipliers are 0.85/1/1.3. Bills, including recurring adjustments, rise 3.5% annually. Base gross pay rises 2%; decisions can change current-year or recurring gross income. Withholding is an illustrative piecewise approximation: 7.65% of gross plus 4% on the first $15k, 12% on the next $35k, and 22% above $50k. It is not a federal/state tax calculator. Retirement grows only by contributions; no market returns or access to retirement for ordinary spending is assumed. Net worth includes retirement, which is displayed separately from available cash.

Education debt accrues 5% simple annual model interest; the scheduled annual payment is 12 monthly amortizing payments calculated at 5% over 120 months, capped by the outstanding balance. Consumer debt accrues 22% simple annual model interest; scheduled payment is 30% of the interest-adjusted balance, at least $360 annually and capped by the balance. One-time financed scenario expenses enter consumer debt. Extra payments use available cash and pay consumer debt first. Direct new credit and year-end borrowing are capped at a $12k consumer balance, excluding later interest; this is not a real lending eligibility rule. Remaining gaps stay negative as explicitly unpaid cash-flow shortfalls. The model does not claim those bills were paid or forgiven, and does not model bankruptcy, late fees, or creditor enforcement.

Every year settles once. Its ledger reconciles opening cash, decision cash flows, gross pay, withholding, all itemized bills, retirement, scheduled payments, new borrowing, and closing cash. Interest and both debt balances are displayed. Money effects do not scale with difficulty. Stress/skill/status effects remain abstract classroom indicators. Year reviews allow changes to housing, transport, and retirement rate for the next year; a housing change costs $650 and is recorded in the decision trail.

### Scenarios and presentation

There are 36 new scenarios (12 work, 12 money, 12 life). With life events enabled, each year has one of each, totaling 15 decisions. With them disabled there are ten decisions, while normal bills still apply. Randomness selects situations, not hidden dice-roll outcomes after an answer. Scenarios specify prices, lost gross income, recurring bills, time costs, and feedback. Some appear only after earlier years or earlier choices. Deferred transport repairs, job changes, dental arrangements, and phone installments have tracked follow-ups; a two-year installment cannot finish after one year. A fictional workplace's benefit policies are not asserted for every worker in an occupation.

The Fieldbook visual pass uses warm paper, six interest-area colors, illustrated work/money/life chapter banners, multicolor response and budget cards, a high-contrast status panel, and separate cash/debt/retirement summaries. Existing field-specific SVG iconography and factual source panels are retained. Layouts have mobile breakpoints, labeled controls, keyboard focus states, and reduced-motion styles.

### Verification

```sh
node scripts/test-career-quest.mjs /tmp/cq-check/node_modules/jsdom/lib/api.js
node scripts/test-career-quest-depth.mjs /tmp/cq-check/node_modules/jsdom/lib/api.js --report
```

The depth harness checks balanced prompts, complete source vectors, six distinct dominant-interest ranking patterns, insufficient-answer safeguards, answer editing/skipping, displayed recommendations, 56 varied five-year runs, a 500-occupation sweep, ledger reconciliation, recurring obligations, different debt rates, installment timing, and legacy economic rules. Results are in `reports/career-quest-model-checks.json`. This tests model behavior, not assessment validity or a prediction of graduates' finances. The page harness retains complete 10/15-decision journeys and all 500 profile → training → play routes. Browser rendering and native print/download verification remain separate from DOM/model tests.


## Student results repair — October 16, 2026

Mixed answers averaging below 2.5 were incorrectly rejected even when the pattern differed clearly. The absolute enthusiasm cutoff is removed. With sufficient answers, a range of at least 0.25 now supports a relative exploration ranking; this is not confidence in aptitude or success. The result wording explains relative preferences without telling students their answers were insufficient or irresponsible.

Every nonempty teacher-enabled catalog now has a useful shortlist. When answers are flat or incomplete, the explorer supplies varied **exploration starting points**, explicitly distinguished from personalized suggestions. These prioritize different enabled fields and never bypass teacher restrictions. If a shortlist filter would hide other careers matching the current search/field, it broadens that filter with a visible explanation. An actually unmatched search still offers filter-reset controls. Existing saved explorer states are covered.

Regressions reproduce the uploaded screenshot's six averages (2.0, 2.17, 2.0, 2.33, 1.67, 0.67) with the shortlist checkbox already selected. Further cases cover all-dislike, all-neutral, all-like, fully skipped answers, a field outside the shortlist, and a teacher-enabled catalog of only one career.


## Student-language pass — October 17, 2026 UTC

The post-questionnaire copy now leads with the next action. Interest reasons use grammatical activity phrases (for example, “Explore helping people and solving problems”), rather than concatenating category labels. Training uses a stable “Plan your training” heading and a separate Career label, so official plural titles such as Astronomers remain accurate without an awkward “route toward Astronomers” sentence. Path labels use everyday school terms, with student debt and yearly pay before taxes shown directly. No audited career facts, matching calculations, costs, or financial rules changed.

Training explanations, financial rules, monthly bill breakdowns, scenario notes, and full source methods remain available in closed native details sections. A short game-estimate label stays visible. The budget compares monthly amounts left or needed after ordinary costs, with unexpected costs explicitly excluded. Citation links beside factual sections remain visible. Instructions and feedback were shortened; reflection grammar was corrected.

DOM checks cover the exact Astronomers training case, short default training/budget screens, openable explanations, monthly budget labels, grammatical match reasons, and all existing 500 profile/training/play paths.


## Clear entry requirements and borrowing rate — October 17, 2026 UTC

Career profiles now use “Education and training” and a short list: typical education, previous work experience, and any listed training after starting. The list is rendered directly from the profile's evidence-backed BLS row. Broader-group coverage remains visible where applicable; full source wording stays in an expandable section, and the linked citation remains beside the heading. Licensing may add requirements. None in the training column is not presented as proof that the career requires no training or license.

The model-3 borrowing assumption is reduced from 22% to **8% yearly interest**. This is a game setting, not a claim about current loan/credit-card rates. The calculation, rule text, debt summaries, and borrowing feedback use the same constant. Education debt remains at 5%; tax approximations are unchanged. Completed historical ledgers keep their recorded values; future settlements use 8%. New ledgers record their borrowing rate. The financial summary says “Other debt,” shows no rate warning on a zero balance, and uses plain cash/savings labels. Model checks were regenerated at the new rate.
