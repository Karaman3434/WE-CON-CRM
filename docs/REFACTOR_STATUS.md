# WE-CON-CRM Refactor Status

## Current baseline
- `main` is the live working baseline and remains untouched by the refactor.
- Refactor work is isolated on `project-context`.
- `index.html` remains the active application entry point.

## Verified CSS state
- The original inline stylesheet blocks were extracted from `index.html` into `assets/styles.css` on `project-context`.
- `index.html` now references `assets/styles.css` as its external stylesheet.
- The extraction was performed by a GitHub Actions job on the isolated refactor branch and passed its structural validation.
- The one-time extraction workflow was removed after the successful run so it cannot interfere with future development.
- `sw.js` remains unchanged and continues to use the existing cache name `weicon-asist-cache-v1`.
- No CSS transfer was applied to `main`.

## Refactor rule
Externalization is complete on the isolated branch, but the branch must still be browser-tested before it can be considered a candidate for `main`. No merge is performed automatically.

## Next safe phase
1. Verify the CSS-extracted branch against the live application's expected UI/behavior.
2. Map JavaScript responsibilities and dependencies from the real `index.html` source.
3. Identify a low-risk JavaScript module boundary.
4. Extract one module only after its dependencies are verified.
5. Verify the branch before considering any merge into `main`.

## Safety
Do not modify Firebase synchronization, localStorage behavior, offline queueing, customer/customer-contact relationships, product/pricing logic, visit/last-activity records, PWA behavior, or authentication logic without source-level verification.
