# End-to-end tests (Playwright)

Runs the Next.js app against a live Fineract instance. Default target: **https://localhost:8443**.

## Prerequisites

1. Fineract fork with the approval workflow module running on port **8443** (tenant `default`, user `mifos` / `password`).
2. Chromium for Playwright (first run only):

```bash
cd apps/web
pnpm exec playwright install chromium
```

## Run

From `apps/web`:

```bash
pnpm run test:e2e
```

Playwright starts the web app on **http://localhost:3000** (reuses an existing UI server when one is already listening). The handbook docs site uses **3010** separately. The server catalog is seeded with the local Fineract URL via `FINERACT_SERVERS`.

### Environment overrides

| Variable | Default |
|----------|---------|
| `FINERACT_API_URL` | `https://localhost:8443/fineract-provider/api/v1` |
| `FINERACT_TENANT_ID` | `default` |
| `E2E_BASE_URL` | `http://localhost:3000` (use `localhost`, not `127.0.0.1`, so the Next client hydrates; see `allowedDevOrigins`) |
| `E2E_USERNAME` | `mifos` |
| `E2E_PASSWORD` | `password` |
| `E2E_SKIP_WEB_SERVER` | unset — set to `1` if you already run `pnpm dev` and want Playwright to skip starting it |
| `E2E_REUSE_DEV_SERVER` | unset — set to `1` to reuse an already-running dev server (ensure it has `FINERACT_SERVERS` or rely on the E2E catalog cookie seed) |

Example against an already-running dev server:

```bash
E2E_SKIP_WEB_SERVER=1 pnpm run test:e2e
```

## Docs screenshots

Handbook captures for [Micropay CBS Docs](../../../../../documentation) (sibling repo). Specs live under `e2e/docs/*.screenshots.spec.ts` and use a lightweight sign-in (`docs-auth.setup.ts`) that does **not** require the approval-workflow module.

From `apps/web` (Fineract on **8443**):

```bash
pnpm run test:e2e:docs
```

| Variable | Default |
|----------|---------|
| `DOCS_PUBLIC_IMG` | Sibling `documentation/public/img` (from `apps/web`: `../../../../documentation/public/img`) |

Specs:

| Feature | Output under `public/img/` |
|---------|----------------------------|
| Organization → Offices | `administrators/organization/offices-list.png`, `create-office-form.png` |
| Products → Loan products | `administrators/products/loan-products-list.png` |

CI: GitHub Actions workflow **`mifos-web-next-docs-screenshots`** (`workflow_dispatch`) boots Fineract via root `docker-compose.e2e.yml`, sets `DOCS_PUBLIC_IMG` to `mifos-web-next/.docs-screenshots/img`, and uploads that folder as the `docs-screenshots` artifact. Copy into the docs repo’s `public/img/`. Not part of `check:ci`.

### Windows (reuse an existing dev server)

```powershell
$env:E2E_SKIP_WEB_SERVER="1"
$env:E2E_REUSE_DEV_SERVER="1"
pnpm run test:e2e:docs
```

## Approval workflow suite

`e2e/approval-workflows.spec.ts` covers:

- List page access
- API-created default + large (≥5M UGX) workflows, activated via Fineract API with UI verification
- Fineract rejects cyclic draft activation
- Disabled-engine banner when the global toggle is off
- Create form smoke test + API-created draft visible in list and detail

Test workflows are prefixed with `E2E `. Draft copies are deleted during setup/teardown; active copies are deactivated (inactive rows remain in Fineract).

### Windows (reuse an existing dev server)

```powershell
$env:E2E_SKIP_WEB_SERVER="1"
$env:E2E_REUSE_DEV_SERVER="1"
pnpm run test:e2e
```

## Reports

```bash
pnpm run test:e2e:report
```
