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

export const PREFIX = 'mifos-web-next/';

/** Paths that can break the Vercel / Next.js production build. */
export const BUILD_GATED_PREFIXES = [
  `${PREFIX}apps/`,
  `${PREFIX}packages/`,
  `${PREFIX}scripts/`,
  `${PREFIX}package.json`,
  `${PREFIX}pnpm-lock.yaml`,
  `${PREFIX}pnpm-workspace.yaml`,
  `${PREFIX}tsconfig.json`,
  `${PREFIX}vercel.json`
];

export function gitRoot() {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
}

export function stagedPaths() {
  return execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
}

export function commandForChangedPaths(changedPaths) {
  const touchesMifosWebNext = changedPaths.some((path) => path.startsWith(PREFIX));
  if (!touchesMifosWebNext) {
    return null;
  }

  const needsProductionGate = changedPaths.some((path) =>
    BUILD_GATED_PREFIXES.some((prefix) => path.startsWith(prefix))
  );

  return needsProductionGate ? 'check:ci' : 'check';
}

export function runMifosWebNextHookCheck({ changedPaths, hookLabel }) {
  if (process.env.MIFOS_WEB_NEXT_SKIP_HOOK === '1') {
    console.warn(
      `mifos-web-next: skipping ${hookLabel} checks (MIFOS_WEB_NEXT_SKIP_HOOK=1). Run \`pnpm run check:ci\` before pushing.`
    );
    return;
  }

  const command = commandForChangedPaths(changedPaths);
  if (!command) {
    return;
  }

  const root = gitRoot();
  const cwd = join(root, 'mifos-web-next');

  console.log(
    command === 'check:ci'
      ? `mifos-web-next: running ${hookLabel} checks (typecheck + production build — same gate as Vercel)…`
      : `mifos-web-next: running ${hookLabel} checks (typecheck)…`
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
}
