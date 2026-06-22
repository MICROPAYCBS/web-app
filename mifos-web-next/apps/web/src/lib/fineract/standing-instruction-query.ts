/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type StandingInstructionListFilters = {
  transferType?: string;
  fromAccountId?: string;
};

export function countActiveStandingInstructionFilters(
  filters: StandingInstructionListFilters
): number {
  let count = 0;
  if (filters.transferType) {
    count += 1;
  }
  if (filters.fromAccountId?.trim()) {
    count += 1;
  }
  return count;
}
