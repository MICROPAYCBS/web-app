/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractFinancialActivityRef {
  id: number;
  name: string;
  mappedGLAccountType?: string;
}

export interface FineractFinancialActivityGlAccountRef {
  id: number;
  name: string;
  glCode: string;
}

export interface FineractFinancialActivityMappingListItem {
  id: number;
  financialActivityData: FineractFinancialActivityRef;
  glAccountData: FineractFinancialActivityGlAccountRef;
}

export type FineractFinancialActivityMappingDetail = FineractFinancialActivityMappingListItem;

export interface FineractFinancialActivityGlAccountOptions {
  assetAccountOptions: FineractFinancialActivityGlAccountRef[];
  liabilityAccountOptions: FineractFinancialActivityGlAccountRef[];
  equityAccountOptions: FineractFinancialActivityGlAccountRef[];
}

export interface FineractFinancialActivityMappingFormTemplate {
  financialActivityOptions: FineractFinancialActivityRef[];
  glAccountOptions: FineractFinancialActivityGlAccountOptions;
}

export interface FineractFinancialActivityMappingEditData
  extends FineractFinancialActivityMappingDetail,
    FineractFinancialActivityMappingFormTemplate {}

export interface FineractFinancialActivityMappingMutationResponse {
  resourceId: number;
}
