/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '../clients/types';

export interface WorkingDaysConfiguration {
  recurrence: string;
  repaymentRescheduleType: FineractEnumOption;
  repaymentRescheduleOptions: FineractEnumOption[];
  extendTermForDailyRepayments: boolean;
}

export interface WorkingDaysMutationResponse {
  resourceId?: number;
  changes?: Record<string, unknown>;
}
