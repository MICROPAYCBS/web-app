/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import type { LegalTenderMasterRow } from './cashier-legal-tender-sum';
import {
  amountsEqualForCurrency,
  findDuplicateLegalTenderIds,
  hasPositiveLegalTenderQuantity,
  sumLegalTenderLines,
  type LegalTenderLineInput
} from './cashier-legal-tender-sum';

export const legalTenderLineInputSchema = z.object({
  legalTenderId: z.coerce.number().int().positive('Select a denomination'),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative')
});

export type LegalTenderCaptureMode = 'OFF' | 'OPTIONAL' | 'REQUIRED';

export type CashTransactionEntryMode = 'amount' | 'denominations';

function zodCustomError(message: string, path: (string | number)[]) {
  return {
    success: false as const,
    error: new z.ZodError([
      {
        code: 'custom' as const,
        message,
        path
      }
    ])
  };
}

export function validateLegalTenderLinesForAmount(options: {
  lines: LegalTenderLineInput[];
  amount: number;
  activeTenders: LegalTenderMasterRow[];
  decimalPlaces: number;
  required: boolean;
  amountFieldPath?: string;
  linesFieldPath?: string;
}) {
  const {
    lines,
    amount,
    activeTenders,
    decimalPlaces,
    required,
    amountFieldPath = 'transactionAmount',
    linesFieldPath = 'legalTenderLines'
  } = options;

  const positiveLines = lines.filter((line) => line.quantity > 0);

  if (!required && positiveLines.length === 0) {
    return { success: true as const, data: [] as LegalTenderLineInput[] };
  }

  if (!hasPositiveLegalTenderQuantity(positiveLines)) {
    return zodCustomError('Enter at least one note or coin count.', [linesFieldPath]);
  }

  const duplicates = findDuplicateLegalTenderIds(positiveLines);
  if (duplicates.length > 0) {
    return zodCustomError('Each denomination can only appear once.', [linesFieldPath]);
  }

  const tenderById = new Map(activeTenders.map((row) => [row.id, row]));
  for (const line of positiveLines) {
    if (!tenderById.has(line.legalTenderId)) {
      return zodCustomError('Refresh the denomination list and try again.', [linesFieldPath]);
    }
  }

  const computedTotal = sumLegalTenderLines(positiveLines, tenderById);
  if (!amountsEqualForCurrency(computedTotal, amount, decimalPlaces)) {
    return zodCustomError('The denomination total must match the transaction amount.', [amountFieldPath]);
  }

  return { success: true as const, data: positiveLines };
}
