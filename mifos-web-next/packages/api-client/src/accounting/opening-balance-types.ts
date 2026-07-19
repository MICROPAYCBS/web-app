/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractOpeningBalanceGlAccount {
  glAccountId: number;
  glAccountCode: string;
  glAccountName: string;
  glAccountType: { value: string };
}

export interface FineractOpeningBalanceContraAccount {
  id?: number;
  glCode?: string;
  name?: string;
  nameDecorated?: string;
}

export interface FineractOpeningBalanceTemplate {
  contraAccount?: FineractOpeningBalanceContraAccount;
  glAccounts: FineractOpeningBalanceGlAccount[];
}

export interface FineractDefineOpeningBalanceMutationResponse {
  transactionId?: string;
  resourceId?: number;
}
