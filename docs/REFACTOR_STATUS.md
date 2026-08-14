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
- `index.html` now loads `assets/core-utils.js` before the Firebase application scripts, preserving the original synchronous classic-script order for these utilities.
- Two small UI helper blocks (`updateHTML` and the upper-panel-height measurement logic) were extracted in place into `assets/ui-helpers.js`.
- The UI helper extraction preserves the original position in `index.html`, so the classic external script executes at the same point in document parsing as the original inline scripts.
- Structural extraction validation passed in GitHub Actions.
- A Chrome headless smoke test passed after the UI helper extraction.
- The one-time extraction and smoke-test workflows were removed after successful validation.

## Current architecture map
- The remaining major inline JavaScript is the Firebase/authentication block (~21.6 KB) and the large business/application block (~465.6 KB).
- The Firebase/authentication block is high risk and remains inline.
- The large business/application block contains backup, pricing, customer, product, rendering, synchronization, reporting and other application responsibilities and must be decomposed only after dependency mapping.
- `docs/JS_MAP.md` records the current script-block map.

## Refactor rule
CSS plus the first two low-risk JavaScript extractions are now externalized on the isolated branch. The branch is still not a candidate for `main` until broader functional review/testing is complete. No merge is performed automatically.

## Next safe phase
1. Continue source-level mapping inside the large application script.
2. Identify a cohesive, low-risk business module with a clear dependency boundary.
3. Extract one module at a time while preserving script execution order and globals.
4. Run structural validation and a Chrome smoke test after each extraction.
5. Keep Firebase/PIN/offline-sync/customer-data boundaries untouched until verified.
6. Verify the complete branch before considering any merge into `main`.

## Safety
Do not modify Firebase synchronization, localStorage behavior, offline queueing, customer/customer-contact relationships, product/pricing logic, visit/last-activity records, PWA behavior, or authentication logic without source-level verification.
