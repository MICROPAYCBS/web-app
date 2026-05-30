# ADR-003: Validation manifest required for write UIs

## Status

Accepted

## Context

The Angular web-app often validates lightly and relies on Fineract API errors. We want better UX and fewer round-trips.

## Decision

Every **write** UI (create/update/command) must include:

1. A JSON manifest in `packages/validation/manifests/` with `fineractSources`.
2. A Zod schema in `packages/validation/src/`.
3. Server-side validation in Server Actions using the same schema.

## Consequences

- PRs without manifests are incomplete for write flows.
- Manifests are reviewed against Fineract Java, not only web-app behavior.
