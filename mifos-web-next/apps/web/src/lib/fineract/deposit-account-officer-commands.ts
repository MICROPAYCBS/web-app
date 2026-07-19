import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDepositAccountKind, FineractSavingsAccountDetail, FineractCommandProcessingResult } from '@mifos/api-client';
import { CLIENT_DEPOSIT_ACCOUNT_CONFIG } from '@/lib/fineract/client-deposit-account-config';
import { createFineractClient } from '@/lib/fineract/create-client';
import { normalizeDepositAccountDetail } from '@/lib/fineract/savings-accounts';

export async function getDepositAccount(
  kind: ClientDepositAccountKind,
  accountId: string | number
): Promise<FineractSavingsAccountDetail | null> {
  const fineract = await createFineractClient();
  const apiPath = CLIENT_DEPOSIT_ACCOUNT_CONFIG[kind].apiPath;
  const raw = await fineract.get<unknown>(`/${apiPath}/${accountId}`, {
    associations: 'all'
  });
  return normalizeDepositAccountDetail(raw);
}

export async function executeDepositAccountFieldOfficerCommand(
  kind: ClientDepositAccountKind,
  accountId: string | number,
  command: 'assignSavingsOfficer' | 'unassignSavingsOfficer',
  body: Record<string, unknown>
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  const apiPath = CLIENT_DEPOSIT_ACCOUNT_CONFIG[kind].apiPath;
  return fineract.post<FineractCommandProcessingResult>(`/${apiPath}/${accountId}`, body, { command });
}
