# 2026 CRM Redesign — Status

Phase 1 approved by project owner:
- Sales remains a main dashboard function/card.
- Sales contains Customer and Transactions sections.
- Customer contains Customer Card and Authorities.
- Transactions contains Past Transactions, Customer Contact, and Tasks.
- Contact types: Visit, Phone, Mail, WhatsApp; all + selectable filters.
- Contact notes include date/time, authority, note, and next action.
- Tasks are customer-linked with date/time and reminder notification.
- Sales flow remains: customer → one/multiple authorities → Product Find → product selection → existing Calculate flow.
- Legacy data must not be deleted and must be mapped into the new model.

Implementation rule:
- New modules first; legacy source remains intact during migration.
- No destructive migration.
- No legacy records are deleted during UI redesign.
