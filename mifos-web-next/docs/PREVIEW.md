# Viewing the UI as you build

## Best option: Vercel (recommended)

Every push to your connected branch deploys a **Preview URL** you can open in a browser.

1. Import the repo at [vercel.com/new](https://vercel.com/new)
2. **Root Directory:** `mifos-web-next/apps/web`
3. Add env vars from `apps/web/.env.vercel.example` (Preview environment)
4. Open the deployment link Vercel comments on each commit/PR

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full flow (Connect → demo session → platform shell).

## Local dev

```bash
cd mifos-web-next
npm install
cp apps/web/.env.example apps/web/.env.local
# Optional: copy demo vars from apps/web/.env.vercel.example
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What the Cloud Agent can do

| Capability | Yes / No |
|------------|----------|
| Run `npm run build` / `npm run dev` in the workspace | Yes |
| Fix UI bugs and push so **your** Vercel preview updates | Yes |
| Show a live browser inside this chat | No |
| Attach screenshots automatically each turn | Only if we add Playwright artifacts (optional) |

**Practical workflow:** you watch **Vercel Preview** (or local dev); the agent implements, builds, and pushes. You share the preview URL or a screenshot when something looks wrong.

## Optional later

- **Storybook** — isolated composites (`FormSheet`, fields) without full app auth
- **Playwright** — CI screenshots on PRs
- **Production URL** — stable branch deploy when auth is production-ready
