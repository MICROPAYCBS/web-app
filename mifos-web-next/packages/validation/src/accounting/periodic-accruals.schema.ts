/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const fineractDateContextSchema = z.object({
  dateFormat: z.string().min(1),
  locale: z.string().min(1)
});

export const executePeriodicAccrualsSchema = z
  .object({
    tillDate: z.string().min(1, 'Accrue till date is required.')
  })
  .merge(fineractDateContextSchema);

export type ExecutePeriodicAccrualsInput = z.infer<typeof executePeriodicAccrualsSchema>;

export function validateExecutePeriodicAccruals(input: unknown) {
  return executePeriodicAccrualsSchema.safeParse(input);
}

export function buildExecutePeriodicAccrualsPayload(input: ExecutePeriodicAccrualsInput) {
  return {
    tillDate: input.tillDate,
    dateFormat: input.dateFormat,
    locale: input.locale
  };
}
