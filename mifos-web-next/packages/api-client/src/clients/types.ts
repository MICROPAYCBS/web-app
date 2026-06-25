/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CustomerClass } from '../organization/customer-class-types';

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

/** Office reference on client when a transfer is proposed or on hold. */
export interface FineractOfficeRef {
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
  columnLength?: number | string;
  columnCode?: string;
  isColumnUnique?: boolean;
  isColumnIndexed?: boolean;
  columnValues?: { id: number; value: string }[];
  validationRegex?: string;
  validationExample?: string;
  validationMessage?: string;
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

export interface FineractIncomeSourceOptions {
  incomeSourceTypeOptions?: FineractEnumOption[];
  sourceOfFundsOptions?: FineractEnumOption[];
  incomeFrequencyOptions?: FineractEnumOption[];
  verificationStatusOptions?: FineractEnumOption[];
}

export interface ClientTitleOption {
  id: number;
  titleCode?: string;
  titleName?: string;
  genderId?: number | null;
  displayOrder?: number;
  status?: string;
}

export interface FineractClientTemplate {
  officeOptions: FineractOfficeOption[];
  staffOptions?: FineractStaffOption[];
  clientLegalFormOptions?: FineractEnumOption[];
  clientTypeOptions?: FineractEnumOption[];
  genderOptions?: FineractEnumOption[];
  titleOptions?: FineractEnumOption[];
  clientTitleOptions?: ClientTitleOption[];
  nationalityOptions?: FineractEnumOption[];
  customerRiskProfileOptions?: FineractEnumOption[];
  customerClassOptions?: CustomerClass[];
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

export interface FineractClientAddress {
  /** {@code m_address.id} — required for Fineract PUT /client/{id}/addresses updates. */
  addressId: number;
  /** {@code m_client_address.id} — the client-to-address link row. */
  clientAddressId?: number;
  addressType: string;
  addressTypeId: number;
  street?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  townVillage?: string;
  city?: string;
  stateProvinceId?: number;
  countryId?: number;
  countyDistrict?: string;
  postalCode?: string;
  isActive?: boolean;
  isPrimary?: boolean;
  relationship?: string;
}

export interface FineractClientAddressTemplate extends FineractAddressTemplateOptions {}

/** Income source returned by GET /clients/{id}/incomesources */
export interface FineractClientIncomeSource {
  id: number;
  clientId?: number;
  incomeSourceTypeId?: number;
  incomeSourceType?: string;
  sourceOfFundsId?: number;
  sourceOfFunds?: string;
  employerBusinessName?: string;
  employerAddress?: string;
  occupation?: string;
  subIndustryId?: number;
  subIndustryName?: string;
  monthlyIncome?: number;
  incomeCurrencyCode?: string;
  incomeFrequencyId?: number;
  incomeFrequency?: string;
  startDate?: number[] | string;
  endDate?: number[] | string;
  isPrimarySource?: boolean;
  verificationStatusId?: number;
  verificationStatus?: string;
  verifiedBy?: number;
  verifiedByUsername?: string;
  verifiedOnUtc?: string;
  supportingDocument?: string;
  remarks?: string;
  status?: string;
}

/** Other bank account on client compliance profile */
export interface FineractClientOtherBankAccount {
  id?: number;
  clientId?: number;
  bankName: string;
  branchName?: string;
  accountNumber: string;
  displayOrder?: number;
}

/** GET /clients/{id}/complianceprofile */
export interface FineractClientComplianceProfile {
  id?: number;
  clientId?: number;
  hasOtherBankAccounts?: boolean;
  isPep?: boolean;
  pepPosition?: string;
  pepRelativeName?: string;
  usCitizenOrResident?: boolean;
  fatcaRegistered?: boolean;
  fatcaRegistrationNo?: string;
  dpfAlternativeBankName?: string;
  dpfAlternativeAccountNumber?: string;
  otherBankAccounts?: FineractClientOtherBankAccount[];
}

/** Family member returned by GET /clients/{id}/familymembers */
export interface FineractClientFamilyMember {
  id: number;
  clientId?: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  qualification?: string;
  mobileNumber?: string;
  emailAddress?: string;
  address?: string;
  age?: number;
  isDependent?: boolean;
  relationshipId?: number;
  relationship?: string;
  genderId?: number;
  gender?: string;
  professionId?: number;
  profession?: string;
  maritalStatusId?: number;
  maritalStatus?: string;
  dateOfBirth?: number[] | string;
}

export interface FineractClientGroupMembership {
  id: number;
  name: string;
  accountNo?: string;
}

export interface FineractClientNonPersonDetails {
  constitution?: FineractEnumOption;
  mainBusinessLine?: FineractEnumOption;
  incorpNumber?: string;
  incorpValidityTillDate?: number[] | string;
  remarks?: string;
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
  fullname?: string;
  officeId?: number;
  officeName?: string;
  staffName?: string;
  mobileNo?: string;
  emailAddress?: string;
  alternativeMobileNo?: string;
  alternativeEmailAddress?: string;
}

export interface FineractClientsPage {
  totalFilteredRecords: number;
  pageItems: FineractClientSummary[];
}

/** GET /clients/{id}?template=true — client record plus dropdown options for edit. */
export type FineractClientEditData = FineractClientDetail & FineractClientTemplate;

export interface FineractClientDetail extends FineractClientSummary {
  middlename?: string;
  fullname?: string;
  mobileNo?: string;
  emailAddress?: string;
  taxIdentificationNumber?: string;
  alternativeMobileNo?: string;
  alternativeEmailAddress?: string;
  subIndustryId?: number;
  customerClassId?: number;
  customerClass?: CustomerClass;
  title?: FineractEnumOption;
  nationality?: FineractEnumOption;
  customerRiskProfile?: FineractEnumOption;
  dateOfBirth?: number[] | string;
  isStaff?: boolean;
  legalForm?: FineractEnumOption;
  timeline?: {
    submittedOnDate?: number[] | string;
    activatedOnDate?: number[] | string;
    closedOnDate?: number[] | string;
  };
  /** Present on some template/detail payloads alongside timeline dates. */
  activationDate?: number[] | string;
  clientType?: FineractEnumOption;
  gender?: FineractEnumOption;
  officeId?: number;
  staffId?: number;
  /** Destination office while transfer is in progress or on hold. */
  transferToOffice?: FineractOfficeRef;
  /** Proposed transfer date from client record (Fineract date array). */
  proposedTransferDate?: number[];
  savingsAccountId?: number;
  savingsProductName?: string;
  imageId?: number;
  imagePresent?: boolean;
  groups?: FineractClientGroupMembership[];
  clientNonPersonDetails?: FineractClientNonPersonDetails;
}

export interface FineractCreateClientResponse {
  officeId: number;
  clientId: number;
  resourceId: number;
  resourceExternalId?: string;
}

export interface FineractEntityDocument {
  id: number;
  name: string;
  fileName?: string;
  description?: string;
  parentEntityType?: string;
  parentEntityId?: number;
}

export interface FineractClientIdentifier {
  id: number;
  clientId: number;
  documentType: { id: number; name: string };
  documentKey: string;
  description?: string;
  status: string;
  documents?: FineractEntityDocument[];
}

export interface FineractClientIdentifierTemplate {
  allowedDocumentTypes: { id: number; name: string }[];
}

export interface FineractClientNote {
  id: number;
  note: string;
  createdByUsername?: string;
  createdOn?: number[] | string;
}

export type {
  FineractClientAccountStatus,
  FineractClientAccounts,
  FineractClientLoanAccount,
  FineractClientSavingsAccount,
  FineractCurrencyOption,
  FineractDatatableRegistration
} from './accounts-types';
