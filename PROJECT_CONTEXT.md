# WE-CON-CRM — Project Context

## 1. Project identity
- Repository: `Karaman3434/WE-CON-CRM`
- Default branch: `main`
- Application description in GitHub: `WEİCON ASİST`
- The repository is a GitHub Pages web application.
- Current application entry point: `index.html`.

## 2. Verified repository state
- `main` remains the protected working baseline for the live application.
- On `project-context`, `index.html` is still approximately 764 KB (764,258 bytes in the verified branch state).
- Root application files include `index.html`, `manifest.json`, `sw.js`, icon files, `.nojekyll`, and `README.md`.
- `assets/styles.css` exists on `project-context` as a preparation/analysis artifact.
- The external stylesheet has NOT been wired into `index.html` yet.
- The existing inline CSS in `index.html` remains the active CSS source.
- `sw.js` has NOT been changed as part of the current refactor state; it remains the existing cache-first/fetch-fallback implementation with cache name `weicon-asist-cache-v1`.
- Therefore the current `project-context` branch does not intentionally change the runtime behavior of the application compared with `main`.

## 3. Development safety rules
1. Keep the currently working application usable throughout development.
2. Do not make broad changes directly on `main`.
3. Use isolated branches for refactoring.
4. Refactor incrementally, one logical area at a time.
5. Verify each change before moving to the next area.
6. Do not alter Firebase, localStorage, PWA/service-worker behavior, or data structures unless the impact has first been inspected.
7. Do not remove existing functionality merely to simplify code.
8. Never assume a function, data structure, Firebase path, or dependency when it has not been verified from the repository.
9. When a refactor cannot be safely verified, stop that refactor rather than guessing.

## 4. Planned modularization
The long-term goal is to reduce the responsibilities of `index.html` by separating concerns into maintainable files/modules while preserving the current UI and behavior.

Areas to investigate and separate incrementally:
- CSS/styles
- customer management
- customer contacts
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
- shared utilities

A module is not to be extracted until its dependencies and runtime behavior have been inspected.

## 5. Current refactor stage
- Repository structure review: completed.
- Initial architecture/refactor planning: completed.
- Project context document: created and maintained on `project-context`.
- CSS preparation: an external `assets/styles.css` file has been created from the currently observed stylesheet structure, but it is intentionally NOT connected to the application yet.
- JavaScript modularization: not started.
- `main`: untouched by this refactor work.

## 6. Verified JavaScript architecture observations
The source inspection has now confirmed several concrete runtime dependencies in `index.html`:
- External Firebase compat libraries are loaded for Firebase App, Realtime Database, Storage, and Auth.
- `html2canvas` and `xlsx` are also loaded externally.
- A `firebaseConfig` object initializes the `weicon-asist` Firebase project.
- Runtime state includes `db`, `auth`, PIN-lock timing variables, and Firebase readiness state.
- `firebaseBaslat()` is the central Firebase initialization function and dispatches the `firebaseHazir` event after initialization.
- Authentication/PIN setup is coupled to Firebase initialization through `girisSistemiKur()` and PIN synchronization functions.
- `sayaclarFirebasdenSenkronla()` synchronizes counters between Firebase and local storage and explicitly preserves the larger counter value across devices.
- `pinFirebasdenYukle()` synchronizes the shared PIN hash to local storage.
- The source contains a fail-closed authentication startup path: if the authentication system cannot be established within the configured timeout, the application remains locked rather than opening without authentication.
- These initialization and synchronization relationships are high-risk refactor boundaries and must not be split casually.

Detailed Firebase paths and additional exact function names must continue to be added only after direct source verification.

## 7. Critical architecture areas to preserve
Based on the verified project analysis so far, the following areas require special care during modularization:
- Firebase/shared data synchronization.
- localStorage/local state and cache behavior.
- Offline/pending synchronization logic.
- Customer data and customer-contact relationships.
- Customer merge/synchronization behavior across devices.
- Authentication/PIN-related behavior.
- PWA manifest and service worker behavior.
- Product, price and calculation logic.
- Son Hareket/visit records and their relationship to customer data.

## 8. Working method for AI-assisted development
For every development request:
1. Read the current repository state before proposing code changes.
2. Identify the exact files/functions/components involved.
3. Inspect dependencies and side effects.
4. Use authoritative documentation for external technical/product facts instead of assumptions.
5. Make the smallest safe change that satisfies the request.
6. Verify the result where tooling permits.
7. Update this context file when architecture or important behavior changes.
8. Continue autonomously through low-risk steps; only ask Abdullah when a decision is genuinely consequential or ambiguous.

## 9. Current objective
Convert the large monolithic `index.html` into a maintainable modular application without breaking the CRM that Abdullah currently uses for daily work.

The immediate technical task is to complete source-level mapping of JavaScript responsibilities and dependencies before extracting the first JS module. CSS extraction remains a separate controlled step and must not be activated until the complete stylesheet replacement is verified.

## 10. Non-negotiable principle
The live/working CRM is more important than refactoring speed. If a proposed change cannot be verified safely, preserve the existing working code and investigate further rather than guessing.
