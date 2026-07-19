/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractEnumOption, FineractOfficeOption } from '../clients/types';
import type {
  StandingInstructionAccountRef,
  StandingInstructionClientRef
} from '../standing-instructions/types';

/** GET /accounttransfers/template — beneficiary and source context for a transfer. */
export interface AccountTransferTemplate {
  fromClient?: StandingInstructionClientRef & { officeId?: number };
  fromOffice?: FineractOfficeOption;
  fromAccount?: StandingInstructionAccountRef & {
    availableBalance?: number;
    accountBalance?: number;
    balance?: number;
    summary?: { accountBalance?: number; availableBalance?: number };
  };
  fromAccountType?: FineractEnumOption;
  currency?: FineractCurrencyOption;
  toOfficeOptions?: FineractOfficeOption[];
  toClientOptions?: StandingInstructionClientRef[];
  toAccountTypeOptions?: FineractEnumOption[];
  toAccountOptions?: StandingInstructionAccountRef[];
  transferAmount?: number;
  dateFormat?: string;
  locale?: string;
}

export interface CreateAccountTransferResponse {
  resourceId?: number;
  savingsId?: number;
  transactionId?: number;
}
