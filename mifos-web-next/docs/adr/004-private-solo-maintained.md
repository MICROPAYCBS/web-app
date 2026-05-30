# ADR-004: Private, solo-maintained (no community stage)

## Status

Accepted

## Context

The Next.js rewrite is a personal/private endeavor, not a Mifos community project.

## Decision

- Repository is **private** (or treated as private if nested temporarily elsewhere).
- **Single maintainer** owns roadmap, reviews, and releases.
- **No community contribution** process at this stage (no openMF CONTRIBUTING workflow, Jira, or Slack gates).
- No obligation to upstream, announce, or seek approval from openMF maintainers.

## Consequences

- Documentation targets the maintainer and tooling (e.g. AI agents), not external contributors.
- Naming may reference Mifos/Fineract as integration targets only; no implied foundation affiliation.
- Opening to the community later requires a deliberate decision (license, repo visibility, governance).
