# ADR-002: Supported Fineract versions

## Status

Accepted

## Context

Fineract APIs and validation rules vary by release.

## Decision

Document supported Fineract versions in this file as they are verified:

| Fineract version | Status |
|------------------|--------|
| TBD | Not yet pinned |

Pin `reference/fineract` to the tag under test. CI contract tests run against a sandbox instance.

## Consequences

- Zod schemas and manifests are versioned when breaking API changes occur.
