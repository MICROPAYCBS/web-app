#!/usr/bin/env node
/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';

const PREFIX = 'mifos-web-next/';

/** Paths that can break the Vercel / Next.js production build. */
const BUILD_GATED_PREFIXES = [
  `${PREFIX}apps/`,
  `${PREFIX}packages/`,
  `${PREFIX}scripts/`,
  `${PREFIX}package.json`,
  `${PREFIX}pnpm-lock.yaml`,
  `${PREFIX}pnpm-workspace.yaml`,
  `${PREFIX}tsconfig.json`,
  `${PREFIX}vercel.json`
];

function gitRoot() {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
}

function stagedPaths() {
  return execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
}

if (process.env.MIFOS_WEB_NEXT_SKIP_HOOK === '1') {
  console.warn(
    'mifos-web-next: skipping pre-commit checks (MIFOS_WEB_NEXT_SKIP_HOOK=1). Do not push without running `pnpm run check:ci`.'
  );
  process.exit(0);
}

const staged = stagedPaths();
const touchesMifosWebNext = staged.some((path) => path.startsWith(PREFIX));

if (!touchesMifosWebNext) {
  process.exit(0);
}

const needsProductionGate = staged.some((path) =>
  BUILD_GATED_PREFIXES.some((prefix) => path.startsWith(prefix))
);

const root = gitRoot();
const cwd = join(root, 'mifos-web-next');
const command = needsProductionGate ? 'check:ci' : 'check';

console.log(
  needsProductionGate
    ? 'mifos-web-next: running pre-commit checks (typecheck + production build — same gate as Vercel)…'
    : 'mifos-web-next: running pre-commit checks (typecheck)…'
);

execSync(`pnpm run ${command}`, {
  cwd,
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: '1',
    NODE_OPTIONS: [process.env.NODE_OPTIONS, '--max-old-space-size=8192'].filter(Boolean).join(' ')
  }
});
