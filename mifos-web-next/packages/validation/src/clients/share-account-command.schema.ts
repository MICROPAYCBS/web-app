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

export const shareAccountApproveCommandSchema = z.object({
  approvedDate: requiredDate,
  note: optionalNote
});

export const shareAccountActivateCommandSchema = z.object({
  activatedDate: requiredDate
});

export const shareAccountRejectCommandSchema = z.object({
  rejectedDate: requiredDate,
  note: optionalNote
});

export const shareAccountUndoApprovalCommandSchema = z.object({
  note: optionalNote
});

export const shareAccountCloseCommandSchema = z.object({
  closedDate: requiredDate,
  note: optionalNote
});

export const shareAccountApplyAdditionalSharesSchema = z.object({
  requestedDate: requiredDate,
  requestedShares: z.coerce.number().int().positive('Requested shares must be greater than zero.'),
  /** When true, fund from linked savings on approval. Default / omitted = cash. */
  useSavings: z.boolean().optional()
});

export const shareAccountRedeemSharesSchema = z.object({
  requestedDate: requiredDate,
  requestedShares: z.coerce.number().int().positive('Shares to redeem must be greater than zero.')
});

export const shareAccountAdditionalSharesDecisionSchema = z.object({
  requestedShares: z
    .array(z.object({ id: z.coerce.number().int().positive() }))
    .min(1, 'Select at least one pending purchase.')
});

export type ShareAccountApproveCommandInput = z.infer<typeof shareAccountApproveCommandSchema>;
export type ShareAccountActivateCommandInput = z.infer<typeof shareAccountActivateCommandSchema>;
export type ShareAccountRejectCommandInput = z.infer<typeof shareAccountRejectCommandSchema>;
export type ShareAccountUndoApprovalCommandInput = z.infer<
  typeof shareAccountUndoApprovalCommandSchema
>;
export type ShareAccountCloseCommandInput = z.infer<typeof shareAccountCloseCommandSchema>;
export type ShareAccountApplyAdditionalSharesInput = z.infer<
  typeof shareAccountApplyAdditionalSharesSchema
>;
export type ShareAccountRedeemSharesInput = z.infer<typeof shareAccountRedeemSharesSchema>;
export type ShareAccountAdditionalSharesDecisionInput = z.infer<
  typeof shareAccountAdditionalSharesDecisionSchema
>;
