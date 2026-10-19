# Project charter

## Status

**Private project** — not a Mifos community initiative and not open for community contribution at this stage.

## Maintainer

Solo-maintained. All product, technical, and release decisions are made by the maintainer without community review or approval gates.

## Relationship to open source

| Artifact | Role |
|----------|------|
| Micropay Fineract | **Backend and validation source of truth** for every new screen |
| [openMF/web-app](https://github.com/openMF/web-app) | **Frozen inventory** (2026-10-19) — archaeology in [`docs/parity/`](parity/), not a living spec |
| This repository | Independent Next.js staff UI; may stay private indefinitely |

There is no plan to merge this work into the community web-app or to coordinate releases with openMF. Do not copy Angular forms or Material patterns when Fineract or Micropay UX already diverges.

## What this means in practice

- No Slack/Jira/PR workflow from the community Angular project applies here.
- No expectation of upstream contributions, parity announcements, or maintainer sign-off from openMF.
- Documentation and ADRs are for **personal** continuity and AI-assisted development, not public governance.
- If the project is ever opened to others, revisit license, contribution guidelines, and naming separately.

## Naming

“Mifos” and “Fineract” refer to the platforms this client integrates with. Use of those names does not imply affiliation with the Mifos Initiative or Apache Fineract projects unless explicitly stated later.

## End-user documentation

Operator and administrator handbooks are maintained in the sibling **Micropay CBS Docs** repo (`documentation` next to `web-app` / `fineract` — Fumadocs + MDX). Do not grow new how-tos under [`docs/user-guide/`](user-guide/README.md); that folder is a retired seed pointer only.

ADRs, BFF, RBAC, and architecture notes in this `docs/` tree remain **developer-facing**. [`docs/parity/`](parity/) is a frozen Angular archaeology folder, not a delivery tracker.

When a UI change alters flows, labels, navigation, or screenshots, open a linked PR in the documentation repo (see that repo’s README → Docs sync).
