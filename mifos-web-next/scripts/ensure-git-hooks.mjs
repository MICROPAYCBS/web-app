#!/usr/bin/env node
/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

let root;
try {
  root = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
} catch {
  process.exit(0);
}

function gitConfig(key) {
  try {
    return execSync(`git config --get ${key}`, {
      encoding: 'utf8',
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return '';
  }
}

/** Husky 9 sets hooksPath to `.husky/_`; older setups use `.husky`. */
function hooksPathLooksLikeHusky(hooksPath) {
  const normalized = hooksPath.replace(/\\/g, '/');
  return (
    normalized === '.husky' ||
    normalized === '.husky/_' ||
    normalized.endsWith('/.husky') ||
    normalized.endsWith('/.husky/_')
  );
}

const hooksPath = gitConfig('core.hooksPath');
if (!hooksPath || !hooksPathLooksLikeHusky(hooksPath)) {
  console.warn(
    `\nmifos-web-next: Git hooks are not active (core.hooksPath=${hooksPath || 'unset'}).\n` +
      'Commits can reach Vercel without local typecheck/build.\n' +
      'From the repository root run: npm install\n'
  );
}

function warnMissingHook(hookName, scriptName) {
  const hookPath = join(root, `.husky/${hookName}`);
  if (!existsSync(hookPath)) {
    console.warn(
      `\nmifos-web-next: Git ${hookName} hook is not installed. Commits may reach Vercel without local checks.\n` +
        'From the repository root run: npm install\n'
    );
    return;
  }

  const hook = readFileSync(hookPath, 'utf8');
  if (!hook.includes(scriptName)) {
    console.warn(
      `\nmifos-web-next: .husky/${hookName} does not run mifos-web-next/scripts/${scriptName}.\n` +
        'Restore the hook or run `pnpm run check:ci` before pushing.\n'
    );
  }
}

warnMissingHook('pre-commit', 'pre-commit-check.mjs');
