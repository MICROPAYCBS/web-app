/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '../clients/types';

export interface FineractGlAccountRef {
  id: number;
  name: string;
  glCode: string;
  type?: FineractEnumOption;
}

export interface FineractGlAccountListItem {
  id: number;
  name: string;
  glCode: string;
  type: FineractEnumOption;
  usage: FineractEnumOption;
  disabled: boolean;
  manualEntriesAllowed: boolean;
  parentId?: number;
  description?: string;
  tagId?: FineractEnumOption & { name?: string };
}

export interface FineractGlAccountDetail extends FineractGlAccountListItem {
  parent?: FineractGlAccountRef;
}

export interface FineractGlAccountFormTemplate {
  accountTypeOptions: FineractEnumOption[];
  usageOptions: FineractEnumOption[];
  assetHeaderAccountOptions: FineractGlAccountRef[];
  liabilityHeaderAccountOptions: FineractGlAccountRef[];
  equityHeaderAccountOptions: FineractGlAccountRef[];
  incomeHeaderAccountOptions: FineractGlAccountRef[];
  expenseHeaderAccountOptions: FineractGlAccountRef[];
  allowedAssetsTagOptions?: FineractEnumOption[];
  allowedLiabilitiesTagOptions?: FineractEnumOption[];
  allowedEquityTagOptions?: FineractEnumOption[];
  allowedIncomeTagOptions?: FineractEnumOption[];
  allowedExpensesTagOptions?: FineractEnumOption[];
}

export type FineractGlAccountEditData = FineractGlAccountDetail & FineractGlAccountFormTemplate;

export interface FineractGlAccountMutationResponse {
  resourceId: number;
}

export interface FineractGlAccountToggleResponse {
  resourceId: number;
  changes: {
    disabled: boolean;
  };
}
