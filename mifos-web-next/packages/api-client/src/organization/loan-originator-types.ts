/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface LoanOriginatorCodeValue {
  id: number;
  name: string;
}

export interface LoanOriginatorListItem {
  id: number;
  externalId: string;
  name: string;
  status: string;
  originatorType?: LoanOriginatorCodeValue;
  channelType?: LoanOriginatorCodeValue;
}

export interface LoanOriginatorDetail extends LoanOriginatorListItem {}

export interface LoanOriginatorTemplate {
  externalId?: string;
  statusOptions: string[];
  originatorTypeOptions: LoanOriginatorCodeValue[];
  channelTypeOptions: LoanOriginatorCodeValue[];
}

export interface LoanOriginatorMutationResponse {
  resourceId?: number;
  changes?: Record<string, unknown>;
}
