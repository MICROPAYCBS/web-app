# ADR-007: Fineract RBAC (defense in depth)

## Status

Accepted

## Context

Users must only access features assigned in Fineract. The reference web-app applies RBAC mainly via template directives and optional env flag; route guards check authentication only.

## Decision

1. Package `@mifos/auth` centralizes `can()`, `<Can>`, nav/route manifests, and `assertCan()` for Server Actions.
2. **RBAC enabled by default** (`RBAC_ENABLED=false` only for explicit dev bypass).
3. Enforce at **middleware (routes)**, **UI (nav/actions)**, and **server mutations**; Fineract API remains final authority.
4. Semantic keys in `permissions.manifest.json` map to Fineract permission codes.
5. Reuse Fineract permission string vocabulary (`READ_CLIENT`, `ALL_FUNCTIONS`, etc.).

## Consequences

- New routes and actions must register permissions in route/nav manifests and JSON manifest.
- Session storage must be hardened before production (encrypted cookie or server session).
- Unit tests cover `can()` edge cases (`ALL_FUNCTIONS`, `ALL_FUNCTIONS_READ`, OR arrays).
