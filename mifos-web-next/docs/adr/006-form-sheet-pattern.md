# ADR-006: Simple forms use FormSheet (side panel)

## Status

Accepted

## Context

Fineract has many short create/edit flows (add note, assign staff, single-action commands). Full pages feel heavy; tiny dialogs feel cramped for real input.

## Decision

Simple forms that:

1. Require **user input** (not confirm-only), and  
2. Have **at most 7 logical fields**  

are implemented as a **right-side shadcn Sheet** via the shared `FormSheet` composite.

- **Cancel** and **Submit** live in a **sticky footer**.
- Body scrolls independently; header shows title + optional description.
- Forms use React Hook Form + Zod; submit runs Server Action or mutation after validation.

Larger flows use a **full page** (8+ fields or steppers). Confirm-only flows use **AlertDialog**.

## Consequences

- Consistent UX for “quick edits” from list/detail context.
- Field-count guard is a review criterion (do not stretch sheets to 10+ fields).
- Mobile: sheet width `sm:max-w-md` or `lg` for 5–7 fields; test narrow viewports.
