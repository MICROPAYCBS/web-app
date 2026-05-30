#!/usr/bin/env node
/**
 * Writes docs/parity/generated.json from @mifos/routes (run after build or via tsx on TS source).
 * Usage: node tooling/routes-inventory/generate-parity.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const require = createRequire(import.meta.url);

// Register tsx for .ts imports in monorepo packages
await import('tsx/esm/api').then(({ register }) => {
  register();
});

const { buildParityMatrix, paritySummary } = await import(
  join(root, 'packages/routes/src/parity-export.ts')
);

const outDir = join(root, 'docs/parity');
mkdirSync(outDir, { recursive: true });

const payload = {
  generatedAt: new Date().toISOString(),
  summary: paritySummary(),
  routes: buildParityMatrix()
};

writeFileSync(join(outDir, 'generated.json'), JSON.stringify(payload, null, 2) + '\n');
console.log(`Wrote ${payload.routes.length} routes to docs/parity/generated.json`);
console.log('Summary:', payload.summary);
