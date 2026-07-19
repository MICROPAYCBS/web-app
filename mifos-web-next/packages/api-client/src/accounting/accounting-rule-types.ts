/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeOption } from '../clients/types';

export interface FineractAccountingRuleGlAccountRef {
  id: number;
  name: string;
  glCode: string;
}

export interface FineractAccountingRuleTagRef {
  tag: {
    id: number;
    name: string;
  };
}

export interface FineractAccountingRuleListItem {
  id: number;
  name: string;
  officeName: string;
  officeId?: number;
  description?: string;
  allowMultipleDebitEntries?: boolean;
  allowMultipleCreditEntries?: boolean;
  debitTags?: FineractAccountingRuleTagRef[];
  creditTags?: FineractAccountingRuleTagRef[];
  debitAccounts?: FineractAccountingRuleGlAccountRef[];
  creditAccounts?: FineractAccountingRuleGlAccountRef[];
}

export type FineractAccountingRuleDetail = FineractAccountingRuleListItem & {
  officeId: number;
};

export interface FineractAccountingRuleTemplateOption {
  id: number;
  name: string;
  glCode?: string;
}

export interface FineractAccountingRuleFormTemplate {
  allowedOffices: FineractOfficeOption[];
  allowedAccounts: FineractAccountingRuleTemplateOption[];
  allowedDebitTagOptions: FineractAccountingRuleTemplateOption[];
  allowedCreditTagOptions: FineractAccountingRuleTemplateOption[];
}

export interface FineractAccountingRuleMutationResponse {
  resourceId: number;
}
