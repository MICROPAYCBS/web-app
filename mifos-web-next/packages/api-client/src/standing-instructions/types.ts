/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption, FineractOfficeOption } from '../clients/types';

export interface StandingInstructionClientRef {
  id: number;
  displayName?: string;
}

export interface StandingInstructionAccountRef {
  id: number;
  accountNo?: string;
  productName?: string;
}

export interface StandingInstructionListItem {
  id: number;
  name?: string;
  status?: FineractEnumOption;
  fromClient?: StandingInstructionClientRef;
  toClient?: StandingInstructionClientRef;
  fromAccount?: StandingInstructionAccountRef;
  toAccount?: StandingInstructionAccountRef;
  fromAccountType?: FineractEnumOption;
  toAccountType?: FineractEnumOption;
  instructionType?: FineractEnumOption;
  amount?: number;
  validFrom?: number[] | string;
  validTill?: number[] | string;
}

export interface StandingInstructionsPage {
  pageItems: StandingInstructionListItem[];
  totalFilteredRecords?: number;
}

export interface StandingInstructionTemplate {
  fromClient?: StandingInstructionClientRef;
  transferTypeOptions?: FineractEnumOption[];
  priorityOptions?: FineractEnumOption[];
  statusOptions?: FineractEnumOption[];
  fromAccountTypeOptions?: FineractEnumOption[];
  fromAccountOptions?: StandingInstructionAccountRef[];
  toOfficeOptions?: FineractOfficeOption[];
  toClientOptions?: StandingInstructionClientRef[];
  toAccountTypeOptions?: FineractEnumOption[];
  toAccountOptions?: StandingInstructionAccountRef[];
  instructionTypeOptions?: FineractEnumOption[];
  recurrenceTypeOptions?: FineractEnumOption[];
  recurrenceFrequencyOptions?: FineractEnumOption[];
  dateFormat?: string;
  locale?: string;
}

export interface CreateStandingInstructionResponse {
  resourceId: number;
}
