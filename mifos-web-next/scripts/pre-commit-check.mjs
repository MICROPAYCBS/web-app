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
const root = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const staged = execSync('git diff --cached --name-only --diff-filter=ACM', {
  encoding: 'utf8'
});

const touchesMifosWebNext = staged
  .split(/\r?\n/)
  .some((path) => path.startsWith(PREFIX));

if (!touchesMifosWebNext) {
  process.exit(0);
}

console.log('mifos-web-next: running pre-commit checks (typecheck)…');
execSync('pnpm run check', {
  cwd: join(root, 'mifos-web-next'),
  stdio: 'inherit'
});
