# Deploying to Vercel

Host **mifos-web-next** on [Vercel](https://vercel.com) for preview URLs on every push and a stable production URL as the app matures.


## Wrong app on your Vercel URL?

If you see **“Mifos® X WebApp”** with **Username / Password** fields and URLs like `/#/login`, that is the **legacy Angular** app from the repo root — **not** `mifos-web-next`.

| Legacy (Angular) | Greenfield (this app) |
|------------------|------------------------|
| `https://yoursite.vercel.app/#/login` | `https://yoursite.vercel.app/login` |
| Username + password on page | Connect → server picker → demo session / future OAuth |
| Title “Mifos® X WebApp” | Title “Mifos Web” |

**Fix:** In Vercel → Project → Settings → General, set **Root Directory** to `mifos-web-next/apps/web`, redeploy. Or create a **new** Vercel project for the Next app so Angular and Next can coexist.

## 1. Connect the repository

1. Open [vercel.com/new](https://vercel.com/new) and import your Git repository (`MICROPAYCBS/web-app` or your fork).
2. Set **Root Directory** (see table below — this fixes “does not have any build scripts”).
3. Framework preset: **Next.js**. Leave the default **Build Command** empty so `vercel.json` is used, or use the override in the table.

### Root Directory (important)

| Your repo layout | Vercel **Root Directory** | Build runs |
|------------------|---------------------------|------------|
| `web-app` repo with `mifos-web-next/` folder (this repo) | **`mifos-web-next`** | `pnpm run build` at monorepo root |
| Standalone clone of only `mifos-web-next` | **`.`** (leave empty) | same |
| Only if the above fails | `apps/web` | `pnpm run build` in `apps/web` (install still runs from monorepo root via `vercel.json`) |

Do **not** use `mifos-web-next/apps/web` when the project is the full `web-app` repository — Vercel often cannot see workspace `build` scripts there. Use **`mifos-web-next`** instead.

Config files:

- `mifos-web-next/vercel.json` — used when Root Directory is `mifos-web-next`
- `mifos-web-next/apps/web/vercel.json` — used when Root Directory is `apps/web`

## 2. Environment variables

Copy from [`apps/web/.env.vercel.example`](../apps/web/.env.vercel.example).

| Variable | Preview | Production | Purpose |
|----------|---------|------------|---------|
| `FINERACT_API_URL` | ✓ | ✓ | Server-only Fineract base URL (BFF) |
| `FINERACT_TENANT_ID` | ✓ | ✓ | Tenant header |
| `FINERACT_SERVERS` | ✓ | optional | JSON array to seed the server catalog |
| `DEMO_SESSION_ENABLED` | ✓ | **off** | Allow “Continue with demo session” on login |
| `RBAC_DEV_SESSION` | ✓ | **off** | JSON session used when demo mode is on |
| `RBAC_ENABLED` | optional | ✓ | Set `false` only while testing |

### Suggested preview values

Use the [Mifos Community Demo](https://demo.mifos.community) Fineract instance:

```env
FINERACT_API_URL=https://demo.mifos.community/fineract-provider/api/v1
FINERACT_TENANT_ID=default
FINERACT_SERVERS=[{"id":"demo","name":"Mifos Community Demo","baseUrl":"https://demo.mifos.community/fineract-provider/api/v1","tenantId":"default"}]
DEMO_SESSION_ENABLED=true
RBAC_DEV_SESSION={"userId":1,"username":"demo","officeId":1,"permissions":["ALL_FUNCTIONS"]}
```

## 3. First visit flow (preview)

1. Open your deployment URL → redirect to **Connect**.
2. Select **Mifos Community Demo** (or add a server) → **Continue to sign in**.
3. Click **Continue with demo session** (only when `DEMO_SESSION_ENABLED=true`).
4. Explore the app: Quick Find (`⌘K`), sidebar groups, Clients / Loans / Savings shortcuts.

Real Fineract login will replace demo session later; keep `DEMO_SESSION_ENABLED` off in production.

## 4. Branches and previews

| Branch | Vercel behavior |
|--------|-----------------|
| `dev` / feature branches | Preview deployment per push |
| Production branch | Production URL (configure in Vercel → Settings → Git) |

Point production at `cursor/mifos-web-next-architecture-55aa` or `dev` until you merge to your mainline.

## 5. CLI (optional)

```bash
cd mifos-web-next/apps/web
pnpm exec vercel link          # once per machine
pnpm exec vercel env pull      # download env to .env.local
pnpm exec vercel --prod        # production deploy
```

## 6. Troubleshooting

| Issue | Fix |
|-------|-----|
| `middleware` deprecation warning | Use `src/proxy.ts` and export `proxy` (see Next.js 16 docs) |
| Build fails “workspace not found” | Root Directory must be `mifos-web-next/apps/web` |
| Stuck on Connect | Set `FINERACT_SERVERS` or add a server manually |
| Stuck on Login | Enable `DEMO_SESSION_ENABLED` + `RBAC_DEV_SESSION` on Preview |
| `/api/clients` errors | Demo API may rate-limit; check Vercel function logs |
| Fineract SSL / timeout | Ensure `FINERACT_API_URL` is reachable from Vercel (public HTTPS) |

## Security

- Never set `NEXT_PUBLIC_FINERACT_*` — credentials stay server-side ([BFF](BFF.md)).
- Do not enable `DEMO_SESSION_ENABLED` on a production deployment with real data.
- Rotate demo credentials when real OAuth/password login ships.
