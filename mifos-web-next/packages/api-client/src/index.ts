/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export { FineractClient, FineractHttpError } from './fineract-client';
export type { FineractApiError, FineractClientConfig } from './types';

export type {
  FineractAddressFieldConfig,
  FineractAddressTemplateOptions,
  FineractClientAddress,
  FineractClientAddressTemplate,
  FineractClientDatatableTemplate,
  FineractClientDetail,
  FineractClientEditData,
  FineractClientFamilyMember,
  FineractClientGroupMembership,
  FineractClientIdentifier,
  FineractClientIdentifierTemplate,
  FineractClientNonPersonDetails,
  FineractClientNote,
  FineractClientSummary,
  FineractClientTemplate,
  FineractClientsPage,
  FineractCreateClientResponse,
  FineractDatatableColumnHeader,
  FineractEntityDocument,
  FineractEnumOption,
  FineractFamilyMemberOptions,
  FineractOfficeOption,
  FineractOfficeRef,
  FineractSavingProductOption,
  FineractStaffOption
} from './clients/types';

export type {
  FineractClientAccountStatus,
  FineractClientAccounts,
  FineractClientLoanAccount,
  FineractClientSavingsAccount,
  FineractClientShareAccount,
  FineractCurrencyOption,
  FineractDatatableDefinition,
  FineractDatatableRegistration
} from './clients/accounts-types';

export type {
  FineractSavingsOnHoldTransaction,
  FineractSavingsOnHoldTransactionsPage
} from './clients/transfer-types';

export type {
  ClientCollateralListItem,
  ClientCollateralTemplate,
  CollateralProductDetail,
  CollateralProductListItem,
  CollateralProductMutationResponse,
  CollateralProductOption,
  CollateralProductTemplate,
  CreateClientCollateralResponse
} from './clients/collateral-types';

export type {
  ClientDepositAccountFieldOfficerOption,
  ClientDepositAccountKind,
  ClientDepositAccountProductOption,
  ClientDepositAccountTemplate,
  ClientLoanAccountProductOption,
  ClientLoanAccountTemplate,
  CreateClientDepositAccountResponse,
  CreateClientLoanAccountResponse
} from './clients/deposit-account-types';

export type {
  FineractCreateEntityDatatableCheckPayload,
  FineractCreateResourceResponse,
  FineractEntityDatatableCheck,
  FineractEntityDatatableCheckDatatableOption,
  FineractEntityDatatableCheckProductOption,
  FineractEntityDatatableChecksPage,
  FineractEntityDatatableCheckStatus,
  FineractEntityDatatableCheckStatusOption,
  FineractEntityDatatableCheckTemplate
} from './clients/entity-datatable-check-types';

export type { FineractSearchEntityStatus, FineractSearchResult } from './clients/search-types';

export type {
  CreateStandingInstructionResponse,
  StandingInstructionAccountRef,
  StandingInstructionClientRef,
  StandingInstructionListItem,
  StandingInstructionTemplate,
  StandingInstructionsPage
} from './standing-instructions/types';

export type {
  ChargeIncomeAccountMapping,
  LoanProductCharge,
  LoanProductDetail,
  LoanProductKind,
  LoanProductListItem,
  LoanProductSectionId,
  PaymentChannelFundSourceMapping,
  ProductGlAccountRef
} from './products/loan-product-types';

export type {
  FineractCodeNameOption,
  LoanProductAccountingMappingOptions,
  LoanProductGlAccountOption,
  LoanProductMutationResponse,
  LoanProductTemplate
} from './products/loan-product-template-types';

export type {
  SavingsProductDetail,
  SavingsProductListItem,
  SavingsProductSectionId
} from './products/savings-product-types';

export type {
  SavingsProductMutationResponse,
  SavingsProductTemplate
} from './products/savings-product-template-types';

export type {
  ShareProductDetail,
  ShareProductListItem,
  ShareProductMarketPricePeriod,
  ShareProductMutationResponse,
  ShareProductSectionId
} from './products/share-product-types';

export type { ShareProductTemplate } from './products/share-product-template-types';

export type {
  DepositProductDetail,
  DepositProductInterestChart,
  DepositProductInterestChartIncentive,
  DepositProductInterestChartSlab,
  DepositProductKind,
  DepositProductListItem,
  DepositProductMutationResponse,
  DepositProductSectionId
} from './products/deposit-product-types';

export type {
  DepositProductChartTemplate,
  DepositProductTemplate
} from './products/deposit-product-template-types';

export type {
  ChargeDetail,
  ChargeIncomeAccountOptions,
  ChargeListItem,
  ChargeMutationResponse,
  ChargeTemplate
} from './products/charge-types';

export type {
  FineractCode,
  FineractCodeValue,
  FineractCreateCodeResponse,
  FineractCreateCodeValueResponse
} from './system/code-types';

export type {
  FineractExternalEventConfigurationItem,
  FineractExternalEventConfigurationResponse
} from './system/external-event-types';

export type {
  FineractExternalServiceName,
  FineractExternalServiceProperty,
  UpdateNotificationExternalServicePayload,
  UpdateS3ExternalServicePayload,
  UpdateSmsExternalServicePayload,
  UpdateSmtpExternalServicePayload
} from './system/external-service-types';

export type {
  FineractGlobalConfiguration,
  FineractGlobalConfigurationListResponse,
  FineractGlobalConfigurationUpdateChanges,
  FineractGlobalConfigurationUpdateResponse
} from './system/global-configuration-types';

export type {
  FineractHookConfigField,
  FineractHookDetail,
  FineractHookEvent,
  FineractHookGrouping,
  FineractHookGroupingEntity,
  FineractHookListItem,
  FineractHookMutationResponse,
  FineractHookTemplate,
  FineractHookTemplateName,
  FineractHookTemplateOption
} from './system/hook-types';

export type {
  FineractRoleListItem,
  FineractRoleMutationResponse,
  FineractRolePermissionUsage,
  FineractRolePermissionsDetail
} from './system/role-types';

export type {
  FineractSurveyDetail,
  FineractSurveyListItem,
  FineractSurveyMutationResponse,
  FineractSurveyQuestionData,
  FineractSurveyResponseData
} from './system/survey-types';

export type {
  FineractAccountNumberPreferenceDetail,
  FineractAccountNumberPreferenceListItem,
  FineractAccountNumberPreferenceMutationResponse,
  FineractAccountNumberPreferenceOption,
  FineractAccountNumberPreferenceTemplate
} from './system/account-number-preference-types';

export type {
  EntityMappingFilterOptions,
  EntityMappingOption,
  FineractEntityMappingDetail,
  FineractEntityMappingRow,
  FineractEntityMappingType
} from './system/entity-mapping-types';

export type {
  FineractStaff,
  FineractStaffEditTemplate,
  FineractStaffListItem
} from './staff/types';
