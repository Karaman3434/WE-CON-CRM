# WE-CON-CRM Refactor — Next Safe Boundary

This file records the current refactor guardrail for the `project-context` branch.

## Do not refactor as generic modules yet
- Firebase initialization and synchronization
- Offline queue / retry logic
- Archive safe-write and merge logic
- Customer save/merge paths
- Authentication / PIN logic

These areas require dependency tracing and end-to-end validation before extraction.

## Safe extraction order
1. Pure UI helpers with no persistence side effects
2. Calendar / display-only helpers
3. Excel/report formatting helpers
4. Then reassess persistence-connected modules

## Rule
Every extraction must:
- preserve existing global function names/API;
- add exactly one external script reference where appropriate;
- remove the extracted inline block;
- validate required symbols and boundaries;
- pass GitHub Actions validation before the next extraction.

`main` must remain untouched until the refactor branch has passed the final regression review.