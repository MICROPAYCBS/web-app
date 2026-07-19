/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { StandingInstructionListItem } from '@mifos/api-client';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import {
  loanAccountHasSummary,
  loanAccountLinkedAccountId
} from '@/lib/fineract/loan-account-display';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';

/** Fineract portfolio account type ids used in standing instruction forms. */
export const STANDING_INSTRUCTION_LOAN_ACCOUNT_TYPE_ID = 1;
export const STANDING_INSTRUCTION_SAVINGS_ACCOUNT_TYPE_ID = 2;
export const STANDING_INSTRUCTION_DESTINATION_OWN_ACCOUNT = 1;

export function loanAccountStandingInstructionGeneralPath(
  clientId: string,
  accountId: string | number
): string {
  return clientAccountGeneralPath(clientId, 'loan', accountId);
}

export function loanAccountCanManageStandingInstructions(
  account: FineractLoanAccountDetail
): boolean {
  return loanAccountHasSummary(account) && loanAccountLinkedAccountId(account) != null;
}

export function loanAccountHasActiveStandingInstruction(
  items: StandingInstructionListItem[],
  loanAccountId: number
): boolean {
  return items.some(
    (item) =>
      item.status?.value !== 'Deleted' &&
      (item.toAccount?.id === loanAccountId || item.fromAccount?.id === loanAccountId)
  );
}

export function loanAccountStandingInstructionCreateDefaults(
  account: FineractLoanAccountDetail,
  clientId: string,
  fromOfficeId: number
): Record<string, string> | null {
  const linkedAccountId = loanAccountLinkedAccountId(account);
  if (linkedAccountId == null) {
    return null;
  }

  return {
    fromAccountType: String(STANDING_INSTRUCTION_SAVINGS_ACCOUNT_TYPE_ID),
    fromAccountId: String(linkedAccountId),
    destination: String(STANDING_INSTRUCTION_DESTINATION_OWN_ACCOUNT),
    toOfficeId: String(fromOfficeId),
    toClientId: clientId,
    toAccountType: String(STANDING_INSTRUCTION_LOAN_ACCOUNT_TYPE_ID),
    toAccountId: String(account.id)
  };
}
