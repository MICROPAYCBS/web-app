# ADR-001: Greenfield private repository

## Status

Accepted

## Context

The legacy [openMF/web-app](https://github.com/openMF/web-app) is a large Angular codebase maintained by the community. The maintainer wants a modern Next.js client with better UX and Fineract-first validation, **without** community involvement at this stage.

## Decision

Create **mifos-web-next** as an independent, **private**, solo-maintained repository. Use web-app as a **read-only functional reference** only. Do not plan merges or coordination with the community Angular app.

## Consequences

- Parity is tracked privately in `docs/parity/` for personal delivery goals.
- The community web-app continues on its own roadmap unaffected.
- License and contribution model are maintainer-controlled (see ADR-004).
