/**
 * Writes docs/parity/generated.json from @mifos/routes.
 * Run: npm run routes:parity
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildParityMatrix, paritySummary } from '../../packages/routes/src/parity-export';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
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
