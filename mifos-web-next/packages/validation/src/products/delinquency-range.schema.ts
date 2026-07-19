/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const positiveDayField = z.coerce
  .number()
  .int('Days must be a whole number.')
  .positive('Days must be at least 1.');

const optionalMaximumAgeDays = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  positiveDayField.optional()
);

const rangeFields = {
  classification: z.string().trim().min(1, 'Classification is required.'),
  minimumAgeDays: positiveDayField,
  maximumAgeDays: optionalMaximumAgeDays
};

export const createDelinquencyRangeSchema = z.object(rangeFields);

export const updateDelinquencyRangeSchema = z.object(rangeFields);

export type CreateDelinquencyRangeInput = z.infer<typeof createDelinquencyRangeSchema>;
export type UpdateDelinquencyRangeInput = z.infer<typeof updateDelinquencyRangeSchema>;
