/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Whether a survey is within its valid date range (legacy parity). */
export function isSurveyActive(validFrom: string, validTo: string, today = new Date()): boolean {
  const curdate = today.toISOString().split('T')[0];
  return curdate >= validFrom && curdate <= validTo;
}
