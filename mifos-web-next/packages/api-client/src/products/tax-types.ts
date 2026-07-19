/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlAccountRef } from '../accounting/gl-account-types';
import type { FineractEnumOption } from '../clients/types';

export interface TaxComponentGlAccountOptions {
  assetAccountOptions?: FineractGlAccountRef[];
  liabilityAccountOptions?: FineractGlAccountRef[];
  equityAccountOptions?: FineractGlAccountRef[];
  incomeAccountOptions?: FineractGlAccountRef[];
  expenseAccountOptions?: FineractGlAccountRef[];
}

export interface TaxComponentTemplate {
  glAccountTypeOptions: FineractEnumOption[];
  glAccountOptions: TaxComponentGlAccountOptions;
}

export interface TaxComponentListItem {
  id: number;
  name?: string;
  percentage?: number;
  creditAccountType?: FineractEnumOption;
  creditAccount?: FineractGlAccountRef;
  debitAccountType?: FineractEnumOption;
  debitAccount?: FineractGlAccountRef;
  startDate?: number[] | string;
}

export type TaxComponentDetail = TaxComponentListItem;

export interface TaxComponentOption {
  id: number;
  name?: string;
}

export interface TaxGroupAssociation {
  id: number;
  taxComponent: TaxComponentOption & { glCode?: string };
  startDate?: number[] | string;
  endDate?: number[] | string;
}

export interface TaxGroupListItem {
  id: number;
  name?: string;
  taxAssociations?: TaxGroupAssociation[];
}

export interface TaxGroupDetail {
  id: number;
  name?: string;
  taxAssociations: TaxGroupAssociation[];
  taxComponents?: TaxComponentOption[];
}

export interface TaxGroupTemplate {
  taxComponents: TaxComponentOption[];
}

export interface TaxMutationResponse {
  resourceId: number;
}
