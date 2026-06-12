/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpdateWorkingDaysPayload } from '@mifos/validation';
import { buildWorkingDaysRecurrence } from '@/lib/fineract/working-days-display';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';

export function buildWorkingDaysPayload(input: UpdateWorkingDaysPayload): Record<string, unknown> {
  return {
    recurrence: buildWorkingDaysRecurrence(input.weekDays),
    repaymentRescheduleType: input.repaymentRescheduleType,
    extendTermForDailyRepayments: input.extendTermForDailyRepayments,
    locale: input.locale ?? FINERACT_LOCALE
  };
}
