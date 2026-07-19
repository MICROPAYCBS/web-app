/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '../clients/types';

export interface ProvisioningCriteriaLoanProduct {
  id: number;
  name: string;
  includeInBorrowerCycle?: boolean;
}

export interface ProvisioningCriteriaGlAccount {
  id: number;
  name: string;
  glCode: string;
  type: FineractEnumOption;
}

export interface ProvisioningCriteriaDefinition {
  categoryId: number;
  categoryName: string;
  minAge?: number;
  maxAge?: number;
  provisioningPercentage?: number;
  liabilityAccount?: number;
  expenseAccount?: number;
  liabilityName?: string;
  expenseName?: string;
}

export interface ProvisioningCriteriaListItem {
  criteriaId: number;
  criteriaName: string;
  createdBy?: string;
}

export interface ProvisioningCriteriaDetail {
  criteriaId: number;
  criteriaName: string;
  createdBy?: string;
  loanProducts: ProvisioningCriteriaLoanProduct[];
  definitions: ProvisioningCriteriaDefinition[];
}

export interface ProvisioningCriteriaCreateTemplate {
  loanProducts: ProvisioningCriteriaLoanProduct[];
  definitions: ProvisioningCriteriaDefinition[];
  glAccounts: ProvisioningCriteriaGlAccount[];
}

export interface ProvisioningCriteriaEditTemplate extends ProvisioningCriteriaCreateTemplate {
  criteriaId: number;
  criteriaName: string;
  selectedLoanProducts: ProvisioningCriteriaLoanProduct[];
}

export interface ProvisioningCriteriaMutationResponse {
  resourceId?: number;
}
