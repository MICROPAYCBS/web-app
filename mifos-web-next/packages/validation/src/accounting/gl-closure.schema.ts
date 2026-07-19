/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const fineractDateContextSchema = z.object({
  dateFormat: z.string().min(1),
  locale: z.string().min(1)
});

export const createGlClosureSchema = z
  .object({
    officeId: z.coerce.number().int().positive('Branch is required.'),
    closingDate: z.string().min(1, 'Closing date is required.'),
    comments: z.string().optional()
  })
  .merge(fineractDateContextSchema);

export const updateGlClosureSchema = z.object({
  comments: z.string().optional()
});

export type CreateGlClosureInput = z.infer<typeof createGlClosureSchema>;
export type UpdateGlClosureInput = z.infer<typeof updateGlClosureSchema>;

export function validateCreateGlClosure(input: unknown) {
  return createGlClosureSchema.safeParse(input);
}

export function validateUpdateGlClosure(input: unknown) {
  return updateGlClosureSchema.safeParse(input);
}

export function buildCreateGlClosurePayload(input: CreateGlClosureInput) {
  const payload: {
    officeId: number;
    closingDate: string;
    dateFormat: string;
    locale: string;
    comments?: string;
  } = {
    officeId: input.officeId,
    closingDate: input.closingDate,
    dateFormat: input.dateFormat,
    locale: input.locale
  };
  if (input.comments?.trim()) {
    payload.comments = input.comments.trim();
  }
  return payload;
}

export function buildUpdateGlClosurePayload(input: UpdateGlClosureInput) {
  return {
    comments: input.comments?.trim() ?? ''
  };
}
