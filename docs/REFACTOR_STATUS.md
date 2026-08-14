# WE-CON-CRM Refactor Status

## Current baseline
- `main` is the live working baseline and remains untouched by the refactor.
- Refactor work is isolated on `project-context`.
- `index.html` remains the active application entry point.

## Verified CSS state
- `index.html` still contains its inline `<style>` blocks.
- `assets/styles.css` exists on `project-context` as a compatibility/preparation stylesheet.
- `index.html` has not yet been switched to the external stylesheet.
- `sw.js` remains unchanged and continues to use the existing cache name `weicon-asist-cache-v1`.

## Refactor rule
The external stylesheet must not be activated until the complete CSS transfer has been verified against the real source. No runtime behavior is to be changed merely to make the refactor appear complete.

## Next safe phase
1. Map JavaScript responsibilities and dependencies from the real `index.html` source.
2. Identify a low-risk module boundary.
3. Extract one module only after its dependencies are verified.
4. Verify the branch before considering any merge into `main`.

## Safety
Do not modify Firebase synchronization, localStorage behavior, offline queueing, customer/customer-contact relationships, product/pricing logic, visit/last-activity records, PWA behavior, or authentication logic without source-level verification.
