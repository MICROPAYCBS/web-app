'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { toFineractActionError } from '@mifos/validation';
import type { ClientActionSheetData, ClientActionSheetId } from '@/lib/clients/client-action-types';
import {
  getClientCommandTemplate,
  getClientTransferProposalDate,
  getClientWithTemplate,
  listOfficeOptions
} from '@/lib/fineract/client-action-data';
import { getClient } from '@/lib/fineract/clients';
export type ClientActionSheetDataResult =
  | { ok: true; data: ClientActionSheetData }
  | { ok: false; message: string };

function toSelectOptions(
  items: { id: number; name: string }[]
): { id: number; name: string }[] {
  return items.map((item) => ({ id: item.id, name: item.name }));
}

export async function loadClientActionSheetDataAction(
  clientId: string,
  sheetId: ClientActionSheetId
): Promise<ClientActionSheetDataResult> {
  try {
    switch (sheetId) {
      case 'assign-staff': {
        const template = await getClientWithTemplate(clientId);
        return {
          ok: true,
          data: {
            sheetId,
            staffOptions: toSelectOptions(
              template.staffOptions.map((s) => ({
                id: s.id,
                name: s.displayName?.trim() || `Relationship officer ${s.id}`
              }))
            )
          }
        };
      }
      case 'update-default-savings': {
        const template = await getClientWithTemplate(clientId);
        return {
          ok: true,
          data: {
            sheetId,
            accounts: template.savingAccountOptions,
            currentAccountId: template.savingsAccountId
          }
        };
      }
      case 'close': {
        const template = await getClientCommandTemplate('close');
        return { ok: true, data: { sheetId, reasons: template.narrations } };
      }
      case 'reject': {
        const template = await getClientCommandTemplate('reject');
        return { ok: true, data: { sheetId, reasons: template.narrations } };
      }
      case 'withdraw': {
        const template = await getClientCommandTemplate('withdraw');
        return { ok: true, data: { sheetId, reasons: template.narrations } };
      }
      case 'transfer': {
        const [offices, client] = await Promise.all([
          listOfficeOptions(),
          getClient(clientId)
        ]);
        const destinationOffices = offices
          .filter((office) => office.id !== client.officeId)
          .map((office) => ({
            id: office.id,
            name: office.nameDecorated?.trim() || office.name?.trim() || `Office ${office.id}`
          }));
        return {
          ok: true,
          data: {
            sheetId,
            offices: destinationOffices
          }
        };
      }
      case 'accept-transfer':
      case 'reject-transfer':
      case 'undo-transfer': {
        const date = await getClientTransferProposalDate(clientId);
        const transferDate =
          date !== null
            ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
            : null;
        return { ok: true, data: { sheetId, transferDate } };
      }
      case 'activate': {
        const template = await getClientWithTemplate(clientId);
        return {
          ok: true,
          data: {
            sheetId,
            savingsProductName: template.savingsProductName
          }
        };
      }
      case 'reactivate':
      case 'undo-rejection':
        return { ok: true, data: { sheetId } };
      default: {
        const _exhaustive: never = sheetId;
        return _exhaustive;
      }
    }
  } catch (err) {
    return toFineractActionError(err, 'Could not load form data.');
  }
}
