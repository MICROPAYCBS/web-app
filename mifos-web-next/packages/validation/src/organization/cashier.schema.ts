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

  sumLegalTenderLines

} from './cashier-legal-tender-sum';



const fineractDate = z.string().trim().min(1, 'Date is required');



const assignCashierFields = {

  staffId: z.coerce.number().int().positive('Staff member is required'),

  startDate: fineractDate,

  endDate: fineractDate,

  isFullDay: z.boolean(),

  dateFormat: z.string().optional(),

  locale: z.string().optional()

};



const updateCashierFields = {

  staffId: z.coerce.number().int().positive('Staff member is required'),

  startDate: fineractDate,

  endDate: fineractDate,

  isFullDay: z.boolean(),

  dateFormat: z.string().optional(),

  locale: z.string().optional()

};



const cashierLegalTenderLineSchema = z.object({

  legalTenderId: z.coerce.number().int().positive('Select a denomination'),

  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative')

});



const cashierCashFields = {

  currencyCode: z.string().trim().min(1, 'Currency is required'),

  txnAmount: z.coerce.number().positive('Amount must be greater than zero'),

  txnDate: fineractDate,

  txnNote: z.string().trim().max(200).optional(),

  legalTenderLines: z

    .array(cashierLegalTenderLineSchema)

    .min(1, 'Enter at least one note or coin count.'),

  dateFormat: z.string().optional(),

  locale: z.string().optional()

};



export const assignCashierSchema = z.object(assignCashierFields);

export const updateCashierSchema = z.object(updateCashierFields);

export const allocateCashierCashSchema = z.object(cashierCashFields);

export const settleCashierCashSchema = z.object(cashierCashFields);



export type AssignCashierInput = z.input<typeof assignCashierSchema>;

export type AssignCashierPayload = z.output<typeof assignCashierSchema>;

export type UpdateCashierInput = z.input<typeof updateCashierSchema>;

export type UpdateCashierPayload = z.output<typeof updateCashierSchema>;

export type AllocateCashierCashInput = z.input<typeof allocateCashierCashSchema>;

export type AllocateCashierCashPayload = z.output<typeof allocateCashierCashSchema>;

export type SettleCashierCashInput = z.input<typeof settleCashierCashSchema>;

export type SettleCashierCashPayload = z.output<typeof settleCashierCashSchema>;



function validateCashierCashWithTenders(

  schema: z.ZodType<AllocateCashierCashPayload>,

  input: unknown,

  activeTenders: LegalTenderMasterRow[],

  decimalPlaces: number

) {

  const parsed = schema.safeParse(input);

  if (!parsed.success) {

    return parsed;

  }



  const positiveLines = parsed.data.legalTenderLines.filter((line) => line.quantity > 0);

  if (!hasPositiveLegalTenderQuantity(positiveLines)) {

    return {

      success: false as const,

      error: new z.ZodError([

        {

          code: 'custom',

          message: 'Enter at least one note or coin count.',

          path: ['legalTenderLines']

        }

      ])

    };

  }



  const duplicates = findDuplicateLegalTenderIds(positiveLines);

  if (duplicates.length > 0) {

    return {

      success: false as const,

      error: new z.ZodError([

        {

          code: 'custom',

          message: 'Each denomination can only appear once.',

          path: ['legalTenderLines']

        }

      ])

    };

  }



  const tenderById = new Map(activeTenders.map((row) => [row.id, row]));

  for (const line of positiveLines) {

    const tender = tenderById.get(line.legalTenderId);

    if (!tender) {

      return {

        success: false as const,

        error: new z.ZodError([

          {

            code: 'custom',

            message: 'Refresh the denomination list and try again.',

            path: ['legalTenderLines']

          }

        ])

      };

    }

  }



  const computedTotal = sumLegalTenderLines(positiveLines, tenderById);

  if (!amountsEqualForCurrency(computedTotal, parsed.data.txnAmount, decimalPlaces)) {

    return {

      success: false as const,

      error: new z.ZodError([

        {

          code: 'custom',

          message: 'The denomination total must match the transaction amount.',

          path: ['txnAmount']

        }

      ])

    };

  }



  return {

    success: true as const,

    data: {

      ...parsed.data,

      legalTenderLines: positiveLines

    }

  };

}



export function validateAssignCashier(input: unknown) {

  return assignCashierSchema.safeParse(input);

}



export function validateUpdateCashier(input: unknown) {

  return updateCashierSchema.safeParse(input);

}



export function validateAllocateCashierCash(

  input: unknown,

  activeTenders: LegalTenderMasterRow[],

  decimalPlaces: number

) {

  return validateCashierCashWithTenders(

    allocateCashierCashSchema,

    input,

    activeTenders,

    decimalPlaces

  );

}



export function validateSettleCashierCash(

  input: unknown,

  activeTenders: LegalTenderMasterRow[],

  decimalPlaces: number

) {

  return validateCashierCashWithTenders(settleCashierCashSchema, input, activeTenders, decimalPlaces);

}


