# Project charter

## Status

**Private project** — not a Mifos community initiative and not open for community contribution at this stage.

## Maintainer

Solo-maintained. All product, technical, and release decisions are made by the maintainer without community review or approval gates.

## Relationship to open source

| Artifact | Role |
|----------|------|
| [openMF/web-app](https://github.com/openMF/web-app) | **Read-only reference** for routes, screens, and behavior — not a fork target |
| [Apache Fineract](https://fineract.apache.org/) | Backend API and **validation source of truth** |
| This repository | Independent codebase; may stay private indefinitely |

There is no plan to merge this work into the community web-app or to coordinate releases with openMF at this time.

## What this means in practice

- No Slack/Jira/PR workflow from the community Angular project applies here.
- No expectation of upstream contributions, parity announcements, or maintainer sign-off from openMF.
- Documentation and ADRs are for **personal** continuity and AI-assisted development, not public governance.
- If the project is ever opened to others, revisit license, contribution guidelines, and naming separately.

## Naming

“Mifos” and “Fineract” refer to the platforms this client integrates with. Use of those names does not imply affiliation with the Mifos Initiative or Apache Fineract projects unless explicitly stated later.
