/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { findFineractHttpError } from '@/lib/errors/serialize-error-for-log';

/**
 * Fineract API failures — show copyable Fineract UI, not the crash-style error boundary.
 */
export function isFineractUserError(error: unknown): boolean {
  return findFineractHttpError(error) != null;
}

export function fineractUserErrorMessage(error: unknown): string | undefined {
  const fineract = findFineractHttpError(error);
  return fineract?.message?.trim() || undefined;
}
