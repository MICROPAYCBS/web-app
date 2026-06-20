'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { ServerActionResult } from '@/actions/servers';

/** After {@link selectServerAction}, refresh or send the user to sign in again. */
export function finishServerSelection(
  result: ServerActionResult,
  router: AppRouterInstance,
  onSuccess?: () => void
): boolean {
  if (!result.ok) {
    return false;
  }
  if (result.signedOut) {
    window.location.assign('/login');
    return true;
  }
  router.refresh();
  onSuccess?.();
  return true;
}
