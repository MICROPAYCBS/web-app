/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const bucketTypeField = z.enum(['REGULAR', 'WORKING_CAPITAL']);

const rangesField = z
  .array(z.coerce.number().int().positive())
  .min(1, 'Add at least one delinquency range.');

const workingCapitalFields = {
  frequency: z.coerce
    .number()
    .int('Frequency must be a whole number.')
    .positive('Frequency must be at least 1.'),
  frequencyType: z.union([z.string().trim().min(1), z.coerce.number().int().positive()]),
  minimumPayment: z.coerce
    .number()
    .positive('Minimum payment must be greater than zero.'),
  minimumPaymentType: z.union([z.string().trim().min(1), z.coerce.number().int().positive()])
};

const baseBucketFields = {
  name: z.string().trim().min(1, 'Name is required.'),
  bucketType: bucketTypeField,
  ranges: rangesField
};

export const createDelinquencyBucketSchema = z.discriminatedUnion('bucketType', [
  z.object({
    ...baseBucketFields,
    bucketType: z.literal('REGULAR')
  }),
  z.object({
    ...baseBucketFields,
    bucketType: z.literal('WORKING_CAPITAL'),
    ...workingCapitalFields
  })
]);

export const updateDelinquencyBucketSchema = createDelinquencyBucketSchema;

export type CreateDelinquencyBucketInput = z.infer<typeof createDelinquencyBucketSchema>;
export type UpdateDelinquencyBucketInput = z.infer<typeof updateDelinquencyBucketSchema>;
