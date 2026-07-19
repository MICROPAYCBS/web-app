/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type CustomerClassRestrictionOption = {
  id: number;
  restrictionCode: string;
  restrictionName: string;
};

export type CustomerClassLegalFormOption = {
  id: number;
  name: string;
};

export type CustomerClass = {
  id: number;
  classCode: string;
  className: string;
  description?: string;
  legalFormId?: number;
  customerType?: string;
  riskLevel?: string;
  kycLevel?: string;
  loanEligible?: boolean;
  restrictionId?: number;
  restrictionCode?: string;
  restrictionName?: string;
  overdraftAllowed?: boolean;
  enhancedDueDiligence?: boolean;
  reclassificationAllowed?: boolean;
  minAge?: number;
  maxAge?: number;
  enforceCustPhoto?: boolean;
  enforceCustSignature?: boolean;
  enforceCustDocument?: boolean;
  autoCreateAccount?: boolean;
  status?: string;
};

export type CustomerClassTemplate = {
  legalFormOptions: CustomerClassLegalFormOption[];
  customerTypeOptions: string[];
  riskLevelOptions: string[];
  kycLevelOptions: string[];
  statusOptions: string[];
  restrictionOptions: CustomerClassRestrictionOption[];
};

export type CustomerClassMutationResponse = {
  resourceId?: number;
};
