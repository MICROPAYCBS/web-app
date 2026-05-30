# ADR-005: UI composites in feature code

## Status

Accepted

## Context

shadcn primitives are flexible but inconsistent if used directly across hundreds of Fineract screens.

## Decision

- Install primitives with shadcn CLI under `apps/web/src/components/ui/`.
- Build **composites** under `apps/web/src/components/composites/` (and `@mifos/ui` for layout-only pieces).
- Feature routes **must not** import `@/components/ui/*` except when authoring a new composite.

Standard composites include `SelectField` (combobox), `DateField`, `MoneyField`, and `FormSheet`.

## Consequences

- New screens default to composites catalog in `docs/COMPONENTS.md`.
- PRs/reviews check for raw Select/datepicker usage in domain folders.
