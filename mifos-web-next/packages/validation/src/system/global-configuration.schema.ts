/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const updateGlobalConfigurationEnabledSchema = z.object({
  id: z.number().int().positive(),
  enabled: z.boolean()
});

export const updateGlobalConfigurationValuesSchema = z
  .object({
    id: z.number().int().positive(),
    value: z.number().int().optional(),
    stringValue: z.string().trim().optional(),
    dateValue: z.string().trim().optional(),
    dateFormat: z.string().trim().optional(),
    locale: z.string().trim().optional()
  })
  .refine(
    (value) =>
      value.value != null ||
      (value.stringValue != null && value.stringValue.length > 0) ||
      (value.dateValue != null && value.dateValue.length > 0),
    { message: 'Provide a number, text, or date value to update.' }
  );

export type UpdateGlobalConfigurationEnabledInput = z.infer<
  typeof updateGlobalConfigurationEnabledSchema
>;

export type UpdateGlobalConfigurationValuesInput = z.infer<
  typeof updateGlobalConfigurationValuesSchema
>;

export function validateUpdateGlobalConfigurationEnabled(input: unknown) {
  return updateGlobalConfigurationEnabledSchema.safeParse(input);
}

export function validateUpdateGlobalConfigurationValues(input: unknown) {
  return updateGlobalConfigurationValuesSchema.safeParse(input);
}
