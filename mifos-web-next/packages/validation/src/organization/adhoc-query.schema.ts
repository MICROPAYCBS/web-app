/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

/** Legacy web-app uses frequency id 5 for custom day interval. */
export const ADHOC_QUERY_CUSTOM_FREQUENCY_ID = 5;

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: 'Enter a valid email address'
  });

const optionalFrequency = z.preprocess((value) => {
  if (value === '' || value == null) {
    return undefined;
  }
  return value;
}, z.coerce.number().int().positive().optional());

const adhocQueryFields = {
  name: z.string().trim().min(1, 'Name is required').max(200),
  query: z.string().trim().min(1, 'SQL query is required'),
  tableName: z.string().trim().min(1, 'Table name is required'),
  tableFields: z.string().trim().min(1, 'Table fields are required'),
  email: optionalEmail,
  reportRunFrequency: optionalFrequency,
  reportRunEvery: z.coerce.number().int().min(1, 'Must be at least 1 day').optional(),
  isActive: z.boolean().default(false)
};

export const upsertAdhocQuerySchema = z
  .object(adhocQueryFields)
  .superRefine((data, ctx) => {
    if (
      data.reportRunFrequency === ADHOC_QUERY_CUSTOM_FREQUENCY_ID &&
      data.reportRunEvery == null
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Custom frequency days is required',
        path: ['reportRunEvery']
      });
    }
  });

export type UpsertAdhocQueryInput = z.input<typeof upsertAdhocQuerySchema>;
export type UpsertAdhocQueryPayload = z.output<typeof upsertAdhocQuerySchema>;

export function validateUpsertAdhocQuery(input: unknown) {
  return upsertAdhocQuerySchema.safeParse(input);
}
