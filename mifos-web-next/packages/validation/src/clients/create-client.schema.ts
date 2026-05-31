/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

/**
 * Client creation — Zod schema aligned with Fineract (not web-app-only rules).
 * @fineract CreateClientCommand, Client
 */
export const createClientSchema = z
  .object({
    officeId: z.coerce.number().int().positive(),
    firstname: z.string().trim().min(1).max(50),
    lastname: z.string().trim().min(1).max(50),
    middlename: z.string().trim().max(50).optional(),
    externalId: z.string().trim().max(100).optional(),
    active: z.boolean().default(false),
    activationDate: z.string().optional(),
    dateFormat: z.string().optional(),
    locale: z.string().optional(),
    submittedOnDate: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.active && !data.activationDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Activation date is required when client is active',
        path: ['activationDate']
      });
    }
  });

export type CreateClientInput = z.input<typeof createClientSchema>;

export type CreateClientPayload = z.output<typeof createClientSchema>;
