/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const upsertCollateralProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  quality: z.string().trim().min(1, 'Type/quality is required.'),
  unitType: z.string().trim().min(1, 'Unit type is required.'),
  basePrice: z.coerce.number().positive('Base price must be greater than zero.'),
  pctToBase: z.coerce.number().nonnegative('Percentage to base cannot be negative.'),
  currency: z.string().trim().min(1, 'Select a currency.')
});

export type UpsertCollateralProductInput = z.infer<typeof upsertCollateralProductSchema>;
