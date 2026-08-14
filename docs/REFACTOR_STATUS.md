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
- `index.html` now loads `assets/core-utils.js` before the Firebase application scripts, preserving the original synchronous script ordering for these utilities.
- The extracted module contains `safeText`, `lsGet`, `lsSet`, service-worker registration, DOM helpers, render cache state, event registry helpers, and related utility functions from those exact source blocks.
- Structural extraction validation passed in GitHub Actions.
- A Chrome headless smoke test passed after the utility extraction.
- The one-time extraction and smoke-test workflows were removed after successful validation.

## Refactor rule
CSS and the first low-risk JavaScript utility module are now externalized on the isolated branch. The branch is still not a candidate for `main` until broader functional review/testing is complete. No merge is performed automatically.

## Next safe phase
1. Continue mapping the remaining JavaScript responsibilities and dependencies from the real `index.html` source.
2. Avoid splitting Firebase/PIN/offline-sync/customer-data logic until each dependency boundary is verified.
3. Identify the next low-risk module boundary.
4. Extract one module at a time and run structural/browser smoke validation after each extraction.
5. Verify the complete branch before considering any merge into `main`.

## Safety
Do not modify Firebase synchronization, localStorage behavior, offline queueing, customer/customer-contact relationships, product/pricing logic, visit/last-activity records, PWA behavior, or authentication logic without source-level verification.
