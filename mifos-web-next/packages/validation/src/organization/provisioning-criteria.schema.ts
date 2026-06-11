/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const loanProductRefSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  includeInBorrowerCycle: z.boolean().optional()
});

export const provisioningCriteriaDefinitionSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  categoryName: z.string().trim().min(1),
  minAge: z.coerce.number().min(0, 'Min age must be zero or greater'),
  maxAge: z.coerce.number().min(0, 'Max age must be zero or greater'),
  provisioningPercentage: z.coerce
    .number()
    .min(0, 'Percentage must be zero or greater'),
  liabilityAccount: z.coerce.number().int().positive('Liability account is required'),
  expenseAccount: z.coerce.number().int().positive('Expense account is required')
});

export const upsertProvisioningCriteriaSchema = z.object({
  criteriaName: z.string().trim().min(1, 'Name is required').max(200),
  loanProducts: z.array(loanProductRefSchema).min(1, 'Select at least one loan product'),
  definitions: z
    .array(provisioningCriteriaDefinitionSchema)
    .min(1, 'Provisioning definitions are required'),
  locale: z.string().optional()
});

export type ProvisioningCriteriaDefinitionInput = z.input<
  typeof provisioningCriteriaDefinitionSchema
>;
export type ProvisioningCriteriaDefinitionPayload = z.output<
  typeof provisioningCriteriaDefinitionSchema
>;
export type UpsertProvisioningCriteriaInput = z.input<typeof upsertProvisioningCriteriaSchema>;
export type UpsertProvisioningCriteriaPayload = z.output<typeof upsertProvisioningCriteriaSchema>;

export function validateUpsertProvisioningCriteria(input: unknown) {
  return upsertProvisioningCriteriaSchema.safeParse(input);
}

export function isProvisioningDefinitionComplete(
  definition: Partial<ProvisioningCriteriaDefinitionInput>
): definition is ProvisioningCriteriaDefinitionInput {
  return (
    definition.minAge != null &&
    Number.isFinite(Number(definition.minAge)) &&
    definition.maxAge != null &&
    Number.isFinite(Number(definition.maxAge)) &&
    definition.provisioningPercentage != null &&
    Number.isFinite(Number(definition.provisioningPercentage)) &&
    definition.liabilityAccount != null &&
    Number.isFinite(Number(definition.liabilityAccount)) &&
    definition.expenseAccount != null &&
    Number.isFinite(Number(definition.expenseAccount))
  );
}
