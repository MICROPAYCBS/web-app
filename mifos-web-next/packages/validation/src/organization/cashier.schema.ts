/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

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

const cashierCashFields = {
  currencyCode: z.string().trim().min(1, 'Currency is required'),
  txnAmount: z.coerce.number().min(0.01, 'Amount must be greater than zero'),
  txnDate: fineractDate,
  description: z.string().trim().optional().or(z.literal('')),
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

export function validateAssignCashier(input: unknown) {
  return assignCashierSchema.safeParse(input);
}

export function validateUpdateCashier(input: unknown) {
  return updateCashierSchema.safeParse(input);
}

export function validateAllocateCashierCash(input: unknown) {
  return allocateCashierCashSchema.safeParse(input);
}

export function validateSettleCashierCash(input: unknown) {
  return settleCashierCashSchema.safeParse(input);
}
