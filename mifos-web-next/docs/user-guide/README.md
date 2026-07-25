# User guide (moved)

**End-user and administrator handbooks are no longer maintained here.**

Canonical publishable docs live in the sibling repo:

| Location | Role |
|----------|------|
| [`D:\projects\micropay\documentation`](../../../../documentation) (clone as `micropay/documentation`) | **Micropay CBS Docs** — Fumadocs site for end users, administrators, and developers |
| This folder | Retired pointer only — do not add new task pages |

Start at the docs site’s **Administrators** and **End users** tabs (see that repo’s `content/docs/`).

## Developer docs in this repo

ADRs, parity matrices, BFF, RBAC, and architecture notes remain under [`docs/`](../) in **mifos-web-next**. Those are for engineers, not operators.

## Reading the handbook

Use the Fumadocs site in the documentation repo:

```bash
cd ../documentation   # or your clone path
pnpm install
pnpm run dev          # http://localhost:3000
# or
pnpm run build
```
