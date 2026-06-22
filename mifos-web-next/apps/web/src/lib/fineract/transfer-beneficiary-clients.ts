import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { getClient } from '@/lib/fineract/clients';
import { searchClientsByDisplayName } from '@/lib/fineract/clients-list';
import type {
  TransferBeneficiaryClientResolved,
  TransferBeneficiaryClientSummary
} from '@/lib/fineract/transfer-beneficiary-clients.types';

export type {
  TransferBeneficiaryClientResolved,
  TransferBeneficiaryClientSummary
} from '@/lib/fineract/transfer-beneficiary-clients.types';

function clientDisplayName(client: {
  displayName?: string;
  firstname?: string;
  lastname?: string;
  id: number;
}): string {
  const name = client.displayName?.trim();
  if (name) {
    return name;
  }
  const parts = [client.firstname, client.lastname].filter(Boolean);
  if (parts.length) {
    return parts.join(' ');
  }
  return `Customer #${client.id}`;
}

/** Search active customers for internal transfer beneficiary selection. */
export async function searchTransferBeneficiaryClients(
  query: string
): Promise<TransferBeneficiaryClientSummary[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const page = await searchClientsByDisplayName({
    query: trimmed,
    limit: 20,
    offset: 0,
    includeClosed: false
  });

  return page.pageItems.map((client) => ({
    id: client.id,
    displayName: clientDisplayName(client),
    accountNo: client.accountNo,
    officeName: client.officeName
  }));
}

/** Load branch id/name for the selected beneficiary customer. */
export async function resolveTransferBeneficiaryClient(
  clientId: string | number
): Promise<TransferBeneficiaryClientResolved> {
  const client = await getClient(clientId);
  const officeId = client.officeId;
  if (officeId === undefined || !Number.isFinite(officeId) || officeId <= 0) {
    throw new Error('Could not determine the branch for this customer.');
  }

  return {
    id: client.id,
    displayName: clientDisplayName(client),
    accountNo: client.accountNo,
    officeName: client.officeName,
    officeId
  };
}
