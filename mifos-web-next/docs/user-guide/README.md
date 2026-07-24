# User guide

End-user handbook for people who **use** the application — not developer architecture docs.

| Volume | Audience | Status |
|--------|----------|--------|
| [1 — Administrator](admin/README.md) | Superusers / IT / ops who set up the institution | In progress |
| [2 — Day-to-day users](daily/README.md) | Tellers, loan officers, accountants, checkers | Stub (after Volume 1) |

Developer docs (ADRs, parity, BFF, RBAC) stay under [`docs/`](../) and are separate from this guide.

## How to use this guide

1. **Administrators** follow Volume 1 **in order** (Phase 0 → 8). Each phase ends when the institution is ready for the next setup step.
2. Skip tasks marked **Configure later** until after go-live if you only need a minimal institution.
3. Each task page follows the same template: goal, prerequisites, flow diagram, steps with screenshots, success checks, and troubleshooting.

## Screenshots

Place captures under [`assets/`](assets/). Prefer the light theme, use a sandbox tenant, and redact real customer data. Naming: `01-offices-list.png`, `02-create-office-sheet.png`, and so on.

## Writing conventions

- Prefer domain language users know (“Customers”, “Servers”, “Sign in”).
- Do not mention backend product or API names in user-facing copy unless unavoidable.
- New task pages should start from [`_templates/task-page.md`](_templates/task-page.md).
