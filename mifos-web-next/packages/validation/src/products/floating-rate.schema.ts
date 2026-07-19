/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const floatingRatePeriodSchema = z.object({
  fromDate: z.string().trim().min(1, 'From date is required.'),
  interestRate: z.coerce
    .number()
    .min(0, 'Interest rate cannot be negative.'),
  isDifferentialToBaseLendingRate: z.boolean().optional().default(false)
});

export const upsertFloatingRateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  isBaseLendingRate: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(false),
  ratePeriods: z.array(floatingRatePeriodSchema).optional()
});

export type FloatingRatePeriodInput = z.infer<typeof floatingRatePeriodSchema>;
export type UpsertFloatingRateInput = z.infer<typeof upsertFloatingRateSchema>;
