/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const bulkLoanReassignmentSchema = z
  .object({
    officeId: z.coerce.number().int().positive('Branch is required'),
    assignmentDate: z.string().trim().min(1, 'Assignment date is required'),
    fromLoanOfficerId: z.coerce.number().int().positive('From loan officer is required'),
    toLoanOfficerId: z.coerce.number().int().positive('To loan officer is required'),
    loans: z.array(z.coerce.number().int().positive()).min(1, 'Select at least one loan'),
    locale: z.string().optional(),
    dateFormat: z.string().optional()
  })
  .refine((data) => data.fromLoanOfficerId !== data.toLoanOfficerId, {
    message: 'To loan officer must be different from the from loan officer',
    path: ['toLoanOfficerId']
  });

export type BulkLoanReassignmentInput = z.input<typeof bulkLoanReassignmentSchema>;
export type BulkLoanReassignmentPayload = z.output<typeof bulkLoanReassignmentSchema>;

export function validateBulkLoanReassignment(input: unknown) {
  return bulkLoanReassignmentSchema.safeParse(input);
}
