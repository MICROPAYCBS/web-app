/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type AccountNumberSequenceScope = 'GLOBAL' | 'OFFICE' | 'OFFICE_PRODUCT';

export type CheckDigitAlgorithm = 'NONE' | 'LUHN' | 'MOD10' | 'MOD11';

export interface FineractAccountNumberPreferenceOption {
  id: number;
  value: string;
  code?: string;
}

export interface FineractAccountNumberPreferenceListItem {
  id: number;
  accountType: FineractAccountNumberPreferenceOption;
  prefixType?: FineractAccountNumberPreferenceOption | null;
  prefixCharacter?: string | null;
  formatPattern?: string | null;
  sequenceScope?: FineractAccountNumberPreferenceOption | null;
  checkDigitAlgorithm?: FineractAccountNumberPreferenceOption | null;
  structuredEnabled?: boolean | null;
}

export interface FineractAccountNumberPreferenceDetail extends FineractAccountNumberPreferenceListItem {}

export interface FineractAccountNumberPreferenceTemplate {
  accountTypeOptions: FineractAccountNumberPreferenceOption[];
  prefixTypeOptions: Record<string, FineractAccountNumberPreferenceOption[]>;
  sequenceScopeOptions?: FineractAccountNumberPreferenceOption[];
  checkDigitAlgorithmOptions?: FineractAccountNumberPreferenceOption[];
  segmentTokenOptions?: string[];
}

export interface FineractAccountNumberFormatPreview {
  accountNumber: string;
  formatPattern: string;
  accountType: number;
}

export interface FineractAccountNumberPreferenceMutationResponse {
  resourceId?: number;
}

/** @deprecated Use FineractAccountNumberPreferenceOption */
export type EnumOption = FineractAccountNumberPreferenceOption;

/** @deprecated Use FineractAccountNumberPreferenceListItem */
export type AccountNumberFormat = FineractAccountNumberPreferenceListItem;

/** @deprecated Use FineractAccountNumberPreferenceTemplate */
export type AccountNumberFormatTemplate = FineractAccountNumberPreferenceTemplate;

/** @deprecated Use FineractAccountNumberFormatPreview */
export type AccountNumberFormatPreview = FineractAccountNumberFormatPreview;
