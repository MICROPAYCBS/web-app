# ADR-001: Greenfield repository

## Status

Accepted

## Context

The legacy Mifos X Web App is a large Angular codebase. We need a modern stack with better UX and stricter validation without blocking ongoing Angular maintenance.

## Decision

Create **mifos-web-next** as a separate greenfield repository. Use [openMF/web-app](https://github.com/openMF/web-app) as a **functional reference** only.

## Consequences

- No big-bang cutover; parity is tracked per domain.
- Two codebases may coexist until feature-complete.
