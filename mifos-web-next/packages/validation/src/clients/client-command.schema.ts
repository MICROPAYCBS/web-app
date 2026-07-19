/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const requiredDate = z.string().trim().min(1, 'Date is required.');
const optionalNote = z.string().trim().max(1000).optional();

export const clientActivateCommandSchema = z.object({
  activationDate: requiredDate
});

export const clientCloseCommandSchema = z.object({
  closureDate: requiredDate,
  closureReasonId: z.coerce.number().int().positive()
});

export const clientWithdrawCommandSchema = z.object({
  withdrawalDate: requiredDate,
  withdrawalReasonId: z.coerce.number().int().positive()
});

export const clientRejectCommandSchema = z.object({
  rejectionDate: requiredDate,
  rejectionReasonId: z.coerce.number().int().positive()
});

export const clientReactivateCommandSchema = z.object({
  reactivationDate: requiredDate
});

export const clientUndoRejectionCommandSchema = z.object({
  reopenedDate: requiredDate
});

export const clientTransferCommandSchema = z.object({
  destinationOfficeId: z.coerce.number().int().positive(),
  transferDate: requiredDate,
  note: optionalNote
});

export const clientTransferNoteCommandSchema = z.object({
  note: optionalNote
});

export const clientAssignStaffCommandSchema = z.object({
  staffId: z.coerce.number().int().positive()
});

export const clientUpdateSavingsCommandSchema = z.object({
  savingsAccountId: z.coerce.number().int().positive()
});

export type ClientActivateCommandInput = z.infer<typeof clientActivateCommandSchema>;
export type ClientCloseCommandInput = z.infer<typeof clientCloseCommandSchema>;
export type ClientWithdrawCommandInput = z.infer<typeof clientWithdrawCommandSchema>;
export type ClientRejectCommandInput = z.infer<typeof clientRejectCommandSchema>;
export type ClientReactivateCommandInput = z.infer<typeof clientReactivateCommandSchema>;
export type ClientUndoRejectionCommandInput = z.infer<typeof clientUndoRejectionCommandSchema>;
export type ClientTransferCommandInput = z.infer<typeof clientTransferCommandSchema>;
export type ClientTransferNoteCommandInput = z.infer<typeof clientTransferNoteCommandSchema>;
export type ClientAssignStaffCommandInput = z.infer<typeof clientAssignStaffCommandSchema>;
export type ClientUpdateSavingsCommandInput = z.infer<typeof clientUpdateSavingsCommandSchema>;
