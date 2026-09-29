/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { ClientLoanCollateralOption, FineractCommandProcessingResult } from '@mifos/api-client';
import type { LoanCollateralItemInput } from '@mifos/validation';
import { listClientPledgeCollaterals } from '@/lib/fineract/client-collaterals';
import {
  getClientLoanAccountEditContext,
  updateClientLoanAccountRecord
} from '@/lib/fineract/client-loan-accounts';
import { loanAccountDraftFromEditTemplate } from '@/lib/fineract/client-loan-account-edit-draft';
import type { LoanCollateralRecord } from '@/lib/fineract/loan-account-types';
import { createFineractClient } from '@/lib/fineract/create-client';

export type { LoanCollateralRecord };

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeCollateral(raw: unknown): LoanCollateralRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const type = row.type && typeof row.type === 'object' ? (row.type as Record<string, unknown>) : undefined;
  const currency =
    row.currency && typeof row.currency === 'object'
      ? (row.currency as Record<string, unknown>)
      : undefined;
  return {
    id,
    typeName: typeof type?.name === 'string' ? type.name : undefined,
    description: typeof row.description === 'string' ? row.description : undefined,
    value: toNumber(row.value),
    currencyCode: typeof currency?.code === 'string' ? currency.code : undefined
  };
}

export async function getLoanCollaterals(
  accountId: string | number
): Promise<LoanCollateralRecord[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(`/loans/${accountId}/collaterals`);
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .map((item) => normalizeCollateral(item))
    .filter((item): item is LoanCollateralRecord => item != null);
}

export async function listLoanPledgeOptions(
  clientId: string | number
): Promise<ClientLoanCollateralOption[]> {
  return listClientPledgeCollaterals(clientId);
}

/** Pledge customer collateral onto a pending loan application. */
export async function pledgeClientCollateralOnLoan(
  clientId: string | number,
  accountId: string | number,
  input: LoanCollateralItemInput
): Promise<FineractCommandProcessingResult> {
  const { template, raw } = await getClientLoanAccountEditContext(accountId);
  const draft = loanAccountDraftFromEditTemplate(raw, template);
  const existing = draft.collateral ?? [];
  if (existing.some((row) => row.collateralTypeId === input.collateralTypeId)) {
    throw new Error('This collateral is already pledged on the loan.');
  }
  const held = template.loanCollateralOptions?.find(
    (option) => option.collateralId === input.collateralTypeId
  );
  if (held?.quantity != null && input.value > held.quantity) {
    throw new Error(`Quantity cannot be more than ${held.quantity}.`);
  }
  return updateClientLoanAccountRecord(accountId, clientId, {
    ...draft,
    collateral: [
      ...existing,
      {
        collateralTypeId: input.collateralTypeId,
        value: input.value,
        description: ''
      }
    ]
  });
}
