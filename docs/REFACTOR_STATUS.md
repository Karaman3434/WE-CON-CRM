# WE-CON-CRM Refactor Status

## Current baseline
- `main` is the live working baseline and remains untouched by the refactor.
- Refactor work is isolated on `project-context`.
- `index.html` remains the active application entry point.

## Verified CSS state
- The original inline stylesheet blocks were extracted from `index.html` into `assets/styles.css` on `project-context`.
- `index.html` now references `assets/styles.css` as its external stylesheet.
- The extraction passed structural validation in GitHub Actions.
- A Chrome headless smoke test passed after CSS extraction.
- The one-time extraction workflow was removed after the successful run.
- `sw.js` remains unchanged and continues to use the existing cache name `weicon-asist-cache-v1`.
- No CSS transfer was applied to `main`.

## Verified JavaScript state
- Four previously inline, explicitly marked low-risk utility blocks (`R003.1`, `R003.4`, `R003.5`, `R003.6`) were extracted into `assets/core-utils.js`.
- Two small UI helper blocks (`updateHTML` and the upper-panel-height measurement logic) were extracted in place into `assets/ui-helpers.js`.
- The 64-line `YENİ ÜRÜN EKLE` product-entry section was extracted in place into `assets/product-entry.js`.
- `product-entry.js` was source-verified after extraction: it uses the existing global catalog, localStorage key, filtering, Firebase update hook, toast function and tab navigation rather than introducing a new data layer.
- All three JavaScript extraction stages passed structural validation and Chrome headless smoke testing.
- One-time extraction/smoke workflows were removed after successful validation.

## Current architecture map
- Remaining major inline JavaScript: Firebase/authentication (~21.6 KB) and the large business/application block (~465.6 KB).
- The large business/application block contains 466 function declarations and includes backup, customer, product, pricing, synchronization, reporting and UI responsibilities.
- `docs/JS_MAP.md` and `docs/BUSINESS_JS_MAP.md` record the current script/function architecture.
- The Firebase/authentication block remains high risk and inline.

## Refactor rule
The refactor branch is being reduced incrementally while preserving classic-script execution order and existing globals. It is not a candidate for `main` until broader functional review/testing is complete. No merge is performed automatically.

## Next safe phase
1. Continue source-level dependency mapping inside the 465 KB application block.
2. Select the next cohesive low-risk section rather than splitting high-risk data synchronization code.
3. Extract one module at a time in its original execution position.
4. Run structural validation and Chrome smoke testing after every extraction.
5. Keep Firebase/PIN/offline-sync/customer-data boundaries untouched until verified.
6. Verify the complete refactor branch before considering a merge into `main`.

## Safety
Do not modify Firebase synchronization, localStorage behavior, offline queueing, customer/customer-contact relationships, product/pricing logic, visit/last-activity records, PWA behavior, or authentication logic without source-level verification.
