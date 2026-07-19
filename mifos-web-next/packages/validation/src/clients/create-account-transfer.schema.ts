/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const requiredDate = z.string().trim().min(1, 'Date is required.');
const positiveId = z.coerce.number().int().positive();

export const createAccountTransferSchema = z.object({
  toOfficeId: positiveId,
  toClientId: positiveId,
  toAccountType: positiveId,
  toAccountId: positiveId,
  transferDate: requiredDate,
  transferAmount: z.coerce.number().positive('Amount must be greater than zero.'),
  transferDescription: z
    .string()
    .trim()
    .min(1, 'Description is required.')
    .max(500, 'Description is too long.')
});

export type CreateAccountTransferInput = z.infer<typeof createAccountTransferSchema>;
