/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAddressFieldConfig, FineractClientTemplate, FineractEntityDatatableCheck, FineractIncomeSourceOptions } from '@mifos/api-client';
import type { ClientAddressEntry, ClientIdentifierIdentityTypeOption, ClientIdentifierInput, ComplianceProfileInput, FamilyMemberInput, IncomeSourceInput } from '@mifos/validation';

export type DatatableFormValues = Record<string, Record<string, unknown>>;
export type MultiRowDatatableDraft = Record<string, Record<string, unknown>[]>;

/** Wizard general step — superset of person and entity fields before Zod discriminated parse. */
export interface ClientGeneralFormState {
  officeId?: number;
  staffId?: number;
  legalFormId?: number;
  externalId?: string;
  firstname?: string;
  middlename?: string;
  lastname?: string;
  fullname?: string;
  clientNonPersonDetails?: {
    constitutionId?: number;
    incorpValidityTillDate?: string;
    incorpNumber?: string;
    mainBusinessLineId?: number;
    remarks?: string;
  };
  genderId?: number;
  isStaff?: boolean;
  mobileNo?: string;
  emailAddress?: string;
  taxIdentificationNumber?: string;
  alternativeMobileNo?: string;
  alternativeEmailAddress?: string;
  subIndustryId?: number;
  customerClassId?: number;
  titleId?: number;
  nationalityCountryId?: number;
  maritalStatusId?: number;
  customerRiskProfileId?: number;
  dateOfBirth?: string;
  clientTypeId?: number;
  submittedOnDate?: string;
  savingsProductId?: number;
  dateFormat?: string;
  locale?: string;
}

export interface CreateClientDraft {
  general: ClientGeneralFormState;
  clientIdentifiers: ClientIdentifierInput[];
  familyMembers: FamilyMemberInput[];
  incomeSources: IncomeSourceInput[];
  complianceProfile: ComplianceProfileInput;
  addresses: ClientAddressEntry[];
  datatables: DatatableFormValues;
  multiRowDatatables: MultiRowDatatableDraft;
}

export interface CreateClientWizardProps {
  initialTemplate: FineractClientTemplate;
  /** Branch for the new customer — always the signed-in user's office. */
  defaultOfficeId?: number;
  addressFieldConfig: FineractAddressFieldConfig[];
  entityDatatableChecks?: FineractEntityDatatableCheck[];
  incomeSourceOptions?: FineractIncomeSourceOptions;
  identifierDocumentTypes?: { id: number; name: string }[];
  identifierIdentityTypeOptions?: ClientIdentifierIdentityTypeOption[];
}
