/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const ENTITY_DATATABLE_CHECK_ENTITIES = [
  'm_client',
  'm_loan',
  'm_group',
  'm_savings_account'
] as const;

export type EntityDatatableCheckEntity = (typeof ENTITY_DATATABLE_CHECK_ENTITIES)[number];

export const createEntityDatatableCheckSchema = z
  .object({
    entity: z.enum(ENTITY_DATATABLE_CHECK_ENTITIES),
    status: z.coerce.number().int(),
    datatableName: z.string().trim().min(1, 'Data table is required'),
    productId: z.coerce.number().int().positive().optional()
  })
  .superRefine((value, ctx) => {
    const needsProduct = value.entity === 'm_loan' || value.entity === 'm_savings_account';
    if (needsProduct && value.productId == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Product is required for loan and savings account checks',
        path: ['productId']
      });
    }
    if (!needsProduct && value.productId != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Product is only used for loan and savings account checks',
        path: ['productId']
      });
    }
  });

export type CreateEntityDatatableCheckInput = z.infer<typeof createEntityDatatableCheckSchema>;

export function validateCreateEntityDatatableCheck(input: unknown) {
  return createEntityDatatableCheckSchema.safeParse(input);
}
