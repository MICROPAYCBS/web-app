/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { parseAmount } from '@mifos/domain';
import Decimal from 'decimal.js';
import { z } from 'zod';

const fineractDateContextSchema = z.object({
  dateFormat: z.string().min(1),
  locale: z.string().min(1)
});

const openingBalanceLineSchema = z
  .object({
    glAccountId: z.coerce.number().int().positive(),
    debit: z.string().optional(),
    credit: z.string().optional()
  })
  .superRefine((line, ctx) => {
    const debit = parseLineAmount(line.debit);
    const credit = parseLineAmount(line.credit);

    if (debit && credit && debit.gt(0) && credit.gt(0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter either a debit or a credit amount, not both.',
        path: ['debit']
      });
    }
  });

export const defineOpeningBalanceSchema = z
  .object({
    officeId: z.coerce.number().int().positive('Office is required.'),
    currencyCode: z.string().min(1, 'Currency is required.'),
    transactionDate: z.string().min(1, 'Opening balances date is required.'),
    glAccountEntries: z.array(openingBalanceLineSchema)
  })
  .merge(fineractDateContextSchema)
  .superRefine((input, ctx) => {
    let debitsTotal = new Decimal(0);
    let creditsTotal = new Decimal(0);

    for (const [index, line] of input.glAccountEntries.entries()) {
      const debit = parseLineAmount(line.debit);
      const credit = parseLineAmount(line.credit);

      if (debit) {
        debitsTotal = debitsTotal.plus(debit);
      }
      if (credit) {
        creditsTotal = creditsTotal.plus(credit);
      }

      if (debit && credit && debit.gt(0) && credit.gt(0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter either a debit or a credit amount, not both.',
          path: ['glAccountEntries', index, 'debit']
        });
      }
    }

    if (debitsTotal.lte(0) || creditsTotal.lte(0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter at least one debit and one credit amount.',
        path: ['glAccountEntries']
      });
      return;
    }

    if (!debitsTotal.equals(creditsTotal)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total debits must equal total credits.',
        path: ['glAccountEntries']
      });
    }
  });

export type DefineOpeningBalanceInput = z.infer<typeof defineOpeningBalanceSchema>;
export type OpeningBalanceLineInput = z.infer<typeof openingBalanceLineSchema>;

export function validateDefineOpeningBalance(input: unknown) {
  return defineOpeningBalanceSchema.safeParse(input);
}

function parseLineAmount(value: string | undefined): Decimal | null {
  if (!value?.trim()) {
    return null;
  }
  return parseAmount(value);
}

function amountForPayload(value: string | undefined): number | null {
  const decimal = parseLineAmount(value);
  if (!decimal || decimal.lte(0)) {
    return null;
  }
  return decimal.toNumber();
}

export function buildDefineOpeningBalancePayload(input: DefineOpeningBalanceInput) {
  const debits: Array<{ glAccountId: number; amount: number }> = [];
  const credits: Array<{ glAccountId: number; amount: number }> = [];

  for (const line of input.glAccountEntries) {
    const debitAmount = amountForPayload(line.debit);
    const creditAmount = amountForPayload(line.credit);

    if (debitAmount != null) {
      debits.push({ glAccountId: line.glAccountId, amount: debitAmount });
    }
    if (creditAmount != null) {
      credits.push({ glAccountId: line.glAccountId, amount: creditAmount });
    }
  }

  return {
    officeId: input.officeId,
    currencyCode: input.currencyCode,
    transactionDate: input.transactionDate,
    dateFormat: input.dateFormat,
    locale: input.locale,
    debits,
    credits
  };
}
