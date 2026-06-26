/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const requiredDate = z.string().trim().min(1, 'Date is required.');

export const loanAccountAssignOfficerSchema = z.object({
  toLoanOfficerId: z.coerce.number().int().positive('Select a loan officer.'),
  assignmentDate: requiredDate
});

export const loanAccountUnassignOfficerSchema = z.object({
  unassignedDate: requiredDate
});

export type LoanAccountAssignOfficerInput = z.infer<typeof loanAccountAssignOfficerSchema>;
export type LoanAccountUnassignOfficerInput = z.infer<typeof loanAccountUnassignOfficerSchema>;
