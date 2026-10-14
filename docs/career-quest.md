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
