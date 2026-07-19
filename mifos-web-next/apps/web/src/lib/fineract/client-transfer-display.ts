/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';

type OfficeNameSource = {
  name?: string;
  nameDecorated?: string;
};

export function formatOfficeDisplayName(office: OfficeNameSource | undefined): string | undefined {
  if (!office) {
    return undefined;
  }
  const decorated = office.nameDecorated?.trim();
  if (decorated) {
    return decorated;
  }
  const name = office.name?.trim();
  return name || undefined;
}

/** Resolve destination branch label from Fineract client fields (flat or nested). */
export function destinationOfficeNameFromClient(
  client: Pick<
    FineractClientDetail,
    'transferToOfficeName' | 'transferToOfficeId' | 'transferToOffice'
  >
): string | undefined {
  const flatName = client.transferToOfficeName?.trim();
  if (flatName) {
    return flatName;
  }

  const nestedName = formatOfficeDisplayName(client.transferToOffice);
  if (nestedName) {
    return nestedName;
  }

  return undefined;
}

export function destinationOfficeIdFromClient(
  client: Pick<FineractClientDetail, 'transferToOfficeId' | 'transferToOffice'>
): number | undefined {
  if (typeof client.transferToOfficeId === 'number' && Number.isFinite(client.transferToOfficeId)) {
    return client.transferToOfficeId;
  }
  if (typeof client.transferToOffice?.id === 'number' && Number.isFinite(client.transferToOffice.id)) {
    return client.transferToOffice.id;
  }
  return undefined;
}
