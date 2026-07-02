#!/usr/bin/env node
/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { pushedPaths, runMifosWebNextHookCheck } from './hook-check.mjs';

runMifosWebNextHookCheck({
  changedPaths: pushedPaths(),
  hookLabel: 'pre-push'
});
