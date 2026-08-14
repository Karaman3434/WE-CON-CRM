# WE-CON-CRM — Project Context

## 1. Project identity
- Repository: `Karaman3434/WE-CON-CRM`
- Default branch: `main`
- Application description in GitHub: `WEİCON ASİST`
- The repository is a GitHub Pages web application.
- Current root application entry point: `index.html`

## 2. Current verified state
- `index.html` is currently approximately 764 KB (764,258 bytes in the verified repository state).
- The current application is largely concentrated in `index.html`.
- Existing root files include `index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, `.nojekyll`, and `README.md`.
- `assets/styles.css` now exists on the `project-context` branch.
- `main` has NOT been changed by the refactor work.
- `sw.js` on `project-context` is now versioned as `weicon-asist-cache-v2` and provides a temporary delivery bridge that serves `assets/styles.css` while stripping the duplicated inline `<style>` blocks from the delivered HTML.

## 3. Development safety rules
1. The currently working application must remain usable during development.
2. Do not make broad changes to `main` without review.
3. Prefer isolated branches for refactoring work.
4. Refactor incrementally: one logical area at a time.
5. After each refactor, verify that existing behavior is preserved before moving to the next area.
6. Do not change Firebase, localStorage, PWA/service-worker behavior, or data structures unless the task explicitly requires it and the impact has been analyzed first.
7. Do not remove existing functionality merely to simplify code.
8. When uncertain, inspect the current repository/code before making assumptions.

## 4. Planned modularization
The long-term goal is to reduce the responsibilities of `index.html` by separating concerns into maintainable files/modules while preserving the current UI and behavior.

Planned areas to investigate and separate incrementally:
- CSS/styles
- customer management
- products/catalog
- price list/pricing logic
- visits/agenda
- Son Hareket (Last Activity)
- Firebase integration/data access
- reports
- vehicle KM tracking
- backup/archive
- PIN/authentication-related UI/logic
- settings
- other shared utilities discovered during code analysis

No module should be separated until its dependencies and runtime behavior have been inspected.

## 5. Current refactor stage
- Repository analysis: completed.
- Architecture/refactor planning: completed at planning level.
- CSS extraction: Phase 1 completed on `project-context`.
- `assets/styles.css`: created from the verified core stylesheet in `index.html`.
- PWA delivery bridge: added to `sw.js` so the running delivered page can use the external stylesheet without requiring a large direct rewrite of the 764 KB `index.html` in this stage.
- `main`: untouched.

## 6. Critical architecture findings
- Firebase is the shared data backbone and must remain intact during modularization.
- localStorage is used as a local cache/state layer.
- There are both general pending-sync and operation-level offline queues.
- Customer records use safe merge logic intended to reduce multi-device overwrite risk.
- Firebase realtime listeners synchronize customers, archive, vehicle KM, exchange rate and other shared state.
- Authentication includes Firebase email/password plus a hashed PIN short-lock mechanism.
- The PWA service worker is part of the application's runtime behavior and must be treated as a controlled dependency during refactoring.
- Customer contact/person management is already a distinct logical subsystem and is a strong candidate for a later JS module extraction.

## 7. Working principle for future AI-assisted development
When a development request is received:
1. Read the current repository state.
2. Identify the exact files/functions/components involved.
3. Check dependencies and possible side effects.
4. For technical/product facts, prefer authoritative documentation over assumptions.
5. Make the smallest safe change that satisfies the request.
6. Test or verify the result where possible.
7. Keep the project context/documentation current when architecture or important behavior changes.
8. Prefer continuing autonomously through low-risk implementation steps rather than repeatedly asking the user to confirm obvious next actions.

## 8. Important note
This document is intentionally conservative. It records only facts verified from the repository or decisions explicitly made during the project. Detailed module/function maps should be added after the relevant sections of `index.html` are systematically inspected; do not invent function names, data structures, or Firebase schema details.
