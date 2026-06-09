/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractAccountNumberPreferenceOption {
  id: number;
  value: string;
  code?: string;
}

export interface FineractAccountNumberPreferenceListItem {
  id: number;
  accountType: FineractAccountNumberPreferenceOption;
  prefixType?: FineractAccountNumberPreferenceOption;
}

export interface FineractAccountNumberPreferenceDetail extends FineractAccountNumberPreferenceListItem {}

export interface FineractAccountNumberPreferenceTemplate {
  accountTypeOptions: FineractAccountNumberPreferenceOption[];
  prefixTypeOptions: Record<string, FineractAccountNumberPreferenceOption[]>;
}

export interface FineractAccountNumberPreferenceMutationResponse {
  resourceId?: number;
}
