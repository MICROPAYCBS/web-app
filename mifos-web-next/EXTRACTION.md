# Extract this tree to its own git repository

This folder still lives inside the Angular `web-app` git root. After Phase 1 (frozen Angular inventory) is **committed**, extract with history. Do **not** `cp` if you want git history.

## 1. Filter (keep history)

Work on a **fresh clone** of `web-app` so you do not rewrite the Angular archive in place.

```bash
git clone --mirror <web-app-remote-url> web-app-extract.git
cd web-app-extract.git
git filter-repo --subdirectory-filter mifos-web-next
git remote add origin git@github.com:<you>/<private-mifos-web-next>.git
git push -u origin --all
git push origin --tags
```

Point `origin` at a **private** host. No openMF publish.

After filter-repo, this tree is the repo root (`apps/web`, `packages/`, `AGENTS.md`, `.github/workflows/ci.yml`).

## 2. GitHub Actions

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) is the standalone workflow (no `mifos-web-next/**` path filter, no `working-directory`).

On the **parent** Angular repo, delete `.github/workflows/mifos-web-next-ci.yml` and `.github/workflows/mifos-web-next-docs-screenshots.yml` after the extract is the canonical remote.

Docs screenshots (`mifos-web-next-docs-screenshots.yml`) currently boot Fineract via the **parent** `docker-compose.e2e.yml`. Recreate that workflow here only if you still want handbook PNGs from CI.

## 3. Vercel

While nested: Root Directory = `mifos-web-next`.

After extract:

1. Connect Vercel to the **new** private repo (or retarget the existing project’s git remote).
2. Set **Root Directory** to empty / `.` (this monorepo root). Do not keep `mifos-web-next` or `mifos-web-next/apps/web`.
3. Keep env vars from `apps/web/.env.vercel.example`.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 4. Parent Angular repo

Leave `web-app` as an Angular archive. Stop tracking `mifos-web-next/` there (delete the folder on a follow-up commit, or stop developing both in one working tree). Do not delete Angular `src/` unless you no longer want that archive.

## 5. Siblings and Cursor

Keep this layout next to the extracted UI:

```text
micropay/
  mifos-web-next/   # this repo
  documentation/    # operator/admin Fumadocs
  fineract/         # Micropay boot: :custom:micropay:app:boot:devRun
```

Open `mifos-web-next.code-workspace` (or this folder) as the Cursor workspace so parent Angular `AGENTS.md` never loads.
