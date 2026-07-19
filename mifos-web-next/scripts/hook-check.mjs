#!/usr/bin/env node
/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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

const ZERO_SHA = /^0+$/;

export function gitRoot() {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
}

function diffNames(range) {
  return execSync(`git diff --name-only ${range}`, { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
}

export function stagedPaths() {
  return execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
}

function mergeBasePaths(localSha) {
  const bases = ['origin/main', 'origin/master', 'origin/dev', 'main', 'master', 'dev'];
  for (const ref of bases) {
    try {
      execSync(`git rev-parse --verify ${ref}`, { stdio: 'ignore' });
      const base = execSync(`git merge-base ${localSha} ${ref}`, { encoding: 'utf8' }).trim();
      if (base) {
        return diffNames(`${base}..${localSha}`);
      }
    } catch {
      // try next ref
    }
  }

  try {
    return diffNames(`${localSha} --not --remotes`);
  } catch {
    return diffNames(localSha);
  }
}

function pathsInPushRange(localSha, remoteSha) {
  if (ZERO_SHA.test(remoteSha)) {
    return mergeBasePaths(localSha);
  }
  if (localSha === remoteSha) {
    return [];
  }
  return diffNames(`${remoteSha}..${localSha}`);
}

/** Files changed by refs listed on stdin (git pre-push hook protocol). */
export function pushedPaths(stdin = readFileSync(0, 'utf8')) {
  const paths = new Set();
  for (const line of stdin.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const [localRef, localSha, , remoteSha] = trimmed.split(/\s+/);
    if (!localRef || !localSha || !remoteSha) {
      continue;
    }
    if (ZERO_SHA.test(localRef)) {
      continue;
    }
    for (const path of pathsInPushRange(localSha, remoteSha)) {
      paths.add(path);
    }
  }
  return [...paths];
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
      `mifos-web-next: skipping ${hookLabel} checks (MIFOS_WEB_NEXT_SKIP_HOOK=1). Do not push without running \`pnpm run check:ci\`.`
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
