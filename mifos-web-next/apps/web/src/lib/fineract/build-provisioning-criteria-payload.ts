/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertProvisioningCriteriaPayload } from '@mifos/validation';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';

export function buildProvisioningCriteriaPayload(
  input: UpsertProvisioningCriteriaPayload
): Record<string, unknown> {
  return {
    criteriaName: input.criteriaName,
    loanProducts: input.loanProducts.map((product) => ({
      id: product.id,
      name: product.name,
      includeInBorrowerCycle: product.includeInBorrowerCycle ?? false
    })),
    definitions: input.definitions.map((definition) => ({
      categoryId: definition.categoryId,
      categoryName: definition.categoryName,
      minAge: definition.minAge,
      maxAge: definition.maxAge,
      provisioningPercentage: definition.provisioningPercentage,
      liabilityAccount: definition.liabilityAccount,
      expenseAccount: definition.expenseAccount
    })),
    locale: input.locale ?? FINERACT_LOCALE
  };
}
