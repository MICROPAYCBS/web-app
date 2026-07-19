/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const groupNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .regex(/^[A-Za-z].*/, 'Name cannot begin with a special character or number');

const finDateSchema = z.string().trim().min(1, 'Date is required');

export const createGroupSchema = z
  .object({
    name: groupNameSchema,
    officeId: z.coerce.number().int().positive('Branch is required'),
    submittedOnDate: finDateSchema,
    staffId: z.coerce.number().int().positive().optional(),
    externalId: z.string().trim().optional(),
    active: z.boolean().optional(),
    activationDate: z.string().trim().optional(),
    clientMembers: z.array(z.coerce.number().int().positive()).optional(),
    dateFormat: z.string().trim().min(1),
    locale: z.string().trim().min(1)
  })
  .superRefine((value, ctx) => {
    if (value.active && !value.activationDate?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Activation date is required when active',
        path: ['activationDate']
      });
    }
  });

export const updateGroupSchema = z
  .object({
    name: groupNameSchema,
    staffId: z.coerce.number().int().positive().optional().nullable(),
    externalId: z.string().trim().optional(),
    activationDate: z.string().trim().optional(),
    dateFormat: z.string().trim().min(1),
    locale: z.string().trim().min(1)
  })
  .superRefine((value, ctx) => {
    if (value.activationDate === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Activation date is required',
        path: ['activationDate']
      });
    }
  });

export type CreateGroupInput = z.input<typeof createGroupSchema>;
export type CreateGroupPayload = z.output<typeof createGroupSchema>;
export type UpdateGroupInput = z.input<typeof updateGroupSchema>;
export type UpdateGroupPayload = z.output<typeof updateGroupSchema>;

export function validateCreateGroup(input: unknown) {
  return createGroupSchema.safeParse(input);
}

export function validateUpdateGroup(input: unknown) {
  return updateGroupSchema.safeParse(input);
}
