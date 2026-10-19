# ADR-001: Greenfield private repository

## Status

Accepted

## Context

The legacy [openMF/web-app](https://github.com/openMF/web-app) is a large Angular codebase maintained by the community. The maintainer wants a modern Next.js client with better UX and Fineract-first validation, **without** community involvement at this stage.

## Decision

Create **mifos-web-next** as an independent, **private**, solo-maintained repository. Do not plan merges or coordination with the community Angular app.

**Amended 2026-10-19:** openMF/web-app is a **frozen inventory**, not a living functional reference. New screens are specified from Micropay Fineract (Zod manifests + operator docs). Leftover Angular items are keep/drop in [`docs/parity/FROZEN.md`](../parity/FROZEN.md). Extract this tree to its own git remote when ready ([`EXTRACTION.md`](../../EXTRACTION.md)).

## Consequences

- `docs/parity/` is archaeology plus the frozen keep/drop list — not a delivery tracker.
- The community web-app continues on its own roadmap unaffected.
- License and contribution model are maintainer-controlled (see ADR-004).
