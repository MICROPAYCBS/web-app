# UI component standards

Private project design system. Feature screens use **composites** — not raw shadcn primitives — except when building a new composite.

## Layers

| Layer | Location | Use |
|-------|----------|-----|
| Primitives | `apps/web/src/components/ui/` | shadcn CLI only |
| Composites | `apps/web/src/components/composites/` | All feature UIs |
| Shared layout | `@mifos/ui` | Framework-agnostic shells (`AppShell`, …) |

## Form presentation matrix

Choose **one** pattern per flow:

| Pattern | Field count | Content | Footer |
|---------|-------------|---------|--------|
| **FormSheet** (default for simple forms) | **1–7** | Real inputs required (not confirm-only) | Cancel + Submit, sticky |
| **Alert dialog** | 0–2 | Confirm / delete / irreversible | Cancel + Confirm |
| **Full page** | **8+** or wizard | Create client, loan product, etc. | Page header actions or stepper |
| **Form dialog** | 3–5, modal context | Rare; blocking modal OK | Same as sheet |

### FormSheet rules

Use a **right-side shadcn Sheet** when:

- The user stays on the current list/detail context.
- There are **at most 7 logical fields** (see counting below).
- The flow needs **input**, not only “Are you sure?”.

Do **not** use FormSheet for:

- Confirm-only actions → `AlertDialog`.
- Large or multi-step flows → full page + `StepperForm`.
- More than 7 logical fields → full page (or split into steps).

**Field counting (logical fields):**

| Counts as 1 | Counts separately |
|-------------|-------------------|
| One combobox (`SelectField`) | Each text input |
| One `DateField` | Each checkbox/switch that is independent |
| One `MoneyField` | Repeatable blocks (each row counts) |

A checkbox group for one decision = 1 field. A dynamic list of charges = N fields → use a full page.

**Footer (required):**

- **Cancel** — `variant="outline"`, closes sheet; optionally warn if dirty (later).
- **Submit** — `variant="default"`, primary action; `loading` while submitting; disabled when form invalid.

**Layout:**

```text
┌ Sheet ─────────────────────┐
│ Title                        │
│ Description (optional)       │
├──────────────────────────────┤
│ ▲ scrollable body            │
│   <FormField>…</FormField>   │
├──────────────────────────────┤
│ [ Cancel ]  [ Submit ]       │  ← sticky footer
└──────────────────────────────┘
```

Implementation: `FormSheet` in `apps/web/src/components/composites/form-sheet.tsx`.

## Field composites (planned / in progress)

| Composite | shadcn basis | Notes |
|-----------|--------------|-------|
| `SelectField` | Command + Popover | Default for lookups; autocomplete |
| `DateField` | Calendar + Popover | Fineract date format via `@mifos/domain` |
| `DateTimeField` | Calendar + time | When API needs datetime |
| `MoneyField` | Input | `decimal.js`; never float |
| `TextField` | Input + Label | Via `FormField` wrapper |
| `FormField` | — | Label, error, `aria-*` for RHF |

Use plain shadcn `Select` only for static enums with **≤4** options (e.g. Yes/No).

## Anti-patterns

- Raw `<select>` or shadcn `Select` for offices, clients, products, GL accounts.
- Simple 4-field create forms on a new route when a sheet is enough.
- Submit in the sheet header (actions belong in the footer).
- More than 7 fields crammed into a sheet — use a page.

## Reference

- [ADR-005](adr/005-ui-composites.md) — composites-only in features
- [ADR-006](adr/006-form-sheet-pattern.md) — FormSheet decision

## Layout blocks (shadcn)

Installed via `npx shadcn add dashboard-01 login-04` and adapted to Mifos rules (no OAuth, BFF-only auth, nav from `@mifos/routes`).

| Block | Mifos implementation | Notes |
|-------|----------------------|-------|
| **login-04** | `app/(auth)/login/page.tsx` + `components/auth/login-form.tsx` | Split card, `Field`/`Card`; Fineract username/password + remember-me; server banner + Manage servers sheet; demo block only when `DEMO_SESSION_ENABLED`. |
| **dashboard-01** | `components/platform/platform-shell.tsx` | `SidebarProvider` + `SidebarInset`; `mifos-app-sidebar`, `mifos-site-header`, `mifos-nav-user`; Quick Find + theme toggle in header. |

**Do not** re-add stock shadcn scaffold routes (`app/login`, `app/dashboard`) or OAuth/sign-up from the block templates.

Primitives added for these blocks live under `components/ui/` (sidebar, field, card, etc.). Feature screens still use **composites** for domain UI; the platform shell is the exception for global chrome.
