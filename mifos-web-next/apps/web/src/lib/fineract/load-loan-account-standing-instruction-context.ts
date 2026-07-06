import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import type { LoanAccountStandingInstructionContext } from '@/components/clients/loan-account/loan-account-standing-instruction-context';
import { clientDisplayName } from '@/lib/fineract/clients-display';
import { getClient } from '@/lib/fineract/clients';
import { clientStatusKind, isClientUnderTransfer } from '@/lib/fineract/client-status';
import {
  loanAccountCanManageStandingInstructions,
  loanAccountStandingInstructionCreateDefaults
} from '@/lib/fineract/loan-account-standing-instructions';
import { loanAccountHasSummary, loanAccountLinkedAccountId } from '@/lib/fineract/loan-account-display';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import { resolveClientOfficeId } from '@/lib/fineract/resolve-client-office-id';
import {
  getStandingInstructionTemplate,
  listLoanAccountStandingInstructions
} from '@/lib/fineract/standing-instructions';
import type { getServerSession } from '@/lib/session/server';

export async function loadLoanAccountStandingInstructionContext(
  session: Awaited<ReturnType<typeof getServerSession>>,
  clientId: string,
  account: FineractLoanAccountDetail
): Promise<LoanAccountStandingInstructionContext | null> {
  if (!can(session, 'READ_STANDINGINSTRUCTION') || !loanAccountHasSummary(account)) {
    return null;
  }

  const client = await getClient(clientId);
  const clientName = clientDisplayName(client);
  const fromOfficeId = await resolveClientOfficeId(clientId, client);
  const linkedSavingsAccountId = loanAccountLinkedAccountId(account);

  const items = await listLoanAccountStandingInstructions({
    clientId,
    clientName,
    loanAccountId: account.id,
    linkedSavingsAccountId
  });

  const permissions = {
    read: true,
    create: can(session, 'CREATE_STANDINGINSTRUCTION'),
    delete: can(session, 'DELETE_STANDINGINSTRUCTION')
  };

  const canCreate =
    permissions.create &&
    !isClientUnderTransfer(clientStatusKind(client)) &&
    loanAccountCanManageStandingInstructions(account);

  const createFormDefaults = canCreate
    ? loanAccountStandingInstructionCreateDefaults(account, clientId, fromOfficeId)
    : null;

  let createTemplate = null;
  if (canCreate && createFormDefaults) {
    createTemplate = await getStandingInstructionTemplate({
      fromClientId: clientId,
      fromOfficeId,
      fromAccountType: '2',
      cascade: createFormDefaults
    });
  }

  return {
    clientName,
    fromOfficeId,
    items,
    createTemplate,
    permissions,
    canCreate,
    createFormDefaults
  };
}
