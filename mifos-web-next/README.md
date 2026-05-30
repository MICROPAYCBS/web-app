# Mifos Web Next

Greenfield [Apache Fineract](https://fineract.apache.org/) web client built with **Next.js 16.2.6**, **shadcn/ui**, and a **preset-driven** design system. Functional reference: [openMF/web-app](https://github.com/openMF/web-app). Validation source of truth: **Fineract** Java/API rules (not web-app-only checks).

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Theming | `@mifos/themes` presets (`data-preset` + `next-themes`) |
| Forms | React Hook Form + Zod (`@mifos/validation`) |
| API | `@mifos/api-client` |
| Data fetching | TanStack Query + Server Components |

## Repository layout

```
mifos-web-next/
├── apps/web/              # Next.js application
├── packages/
│   ├── api-client/        # Fineract HTTP client
│   ├── domain/            # Money, dates, pure helpers
│   ├── i18n/              # Fineract error code messages
│   ├── themes/            # LAF CSS presets
│   ├── ui/                # Composite components (AppShell, …)
│   └── validation/        # Zod schemas + Fineract manifests
├── docs/                  # Architecture, ADRs, parity matrix
├── tooling/               # Route inventory, Fineract rule extractor
└── reference/             # Pin web-app + fineract clones (gitignored)
```

## Getting started

```bash
cd mifos-web-next
npm install
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Cycle preset** in the header to switch `default` / `ocean` / `finance` LAF presets.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start `apps/web` with Turbopack |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript across workspaces |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [ADR index](docs/adr/README.md)
- [Parity tracking](docs/parity/README.md)

## License

MPL-2.0 — see [LICENSE](LICENSE).
