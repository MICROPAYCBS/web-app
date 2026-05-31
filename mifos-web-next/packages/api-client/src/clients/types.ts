/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractEnumOption {
  id: number;
  name?: string;
  code?: string;
  value?: string;
  active?: boolean;
  mandatory?: boolean;
}

export interface FineractStaffOption {
  id: number;
  displayName?: string;
  firstname?: string;
  lastname?: string;
}

export interface FineractOfficeOption {
  id: number;
  name: string;
  nameDecorated?: string;
}

export interface FineractSavingProductOption {
  id: number;
  name: string;
}

export interface FineractDatatableColumnHeader {
  columnName: string;
  columnDisplayType: string;
  isColumnNullable?: boolean;
  columnValues?: { id: number; value: string }[];
}

export interface FineractClientDatatableTemplate {
  registeredTableName: string;
  entitySubType?: string;
  columnHeaderData: FineractDatatableColumnHeader[];
}

export interface FineractAddressTemplateOptions {
  addressTypeIdOptions?: FineractEnumOption[];
  stateProvinceIdOptions?: FineractEnumOption[];
  countryIdOptions?: FineractEnumOption[];
}

export interface FineractFamilyMemberOptions {
  relationshipIdOptions?: FineractEnumOption[];
  genderIdOptions?: FineractEnumOption[];
  maritalStatusIdOptions?: FineractEnumOption[];
  professionIdOptions?: FineractEnumOption[];
}

export interface FineractClientTemplate {
  officeOptions: FineractOfficeOption[];
  staffOptions?: FineractStaffOption[];
  clientLegalFormOptions?: FineractEnumOption[];
  clientTypeOptions?: FineractEnumOption[];
  clientClassificationOptions?: FineractEnumOption[];
  genderOptions?: FineractEnumOption[];
  savingProductOptions?: FineractSavingProductOption[];
  clientNonPersonConstitutionOptions?: FineractEnumOption[];
  clientNonPersonMainBusinessLineOptions?: FineractEnumOption[];
  familyMemberOptions?: FineractFamilyMemberOptions;
  address?: FineractAddressTemplateOptions[];
  datatables?: FineractClientDatatableTemplate[];
  isAddressEnabled?: boolean;
  dateFormat?: string;
  locale?: string;
}

export interface FineractAddressFieldConfig {
  field: string;
  isEnabled: boolean;
}

export interface FineractClientSummary {
  id: number;
  accountNo: string;
  externalId?: string;
  status: FineractEnumOption;
  active: boolean;
  displayName?: string;
  firstname?: string;
  lastname?: string;
  officeName?: string;
  staffName?: string;
}

export interface FineractClientsPage {
  totalFilteredRecords: number;
  pageItems: FineractClientSummary[];
}

export interface FineractClientDetail extends FineractClientSummary {
  middlename?: string;
  fullname?: string;
  mobileNo?: string;
  emailAddress?: string;
  dateOfBirth?: number[];
  timeline?: {
    submittedOnDate?: number[];
    activatedOnDate?: number[];
  };
  clientType?: FineractEnumOption;
  clientClassification?: FineractEnumOption;
  gender?: FineractEnumOption;
  officeId?: number;
  staffId?: number;
}

export interface FineractCreateClientResponse {
  officeId: number;
  clientId: number;
  resourceId: number;
  resourceExternalId?: string;
}
