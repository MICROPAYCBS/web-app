import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ClientDepositAccountKind,
  ClientDepositAccountTemplate,
  CreateClientDepositAccountResponse,
  DepositProductKind
} from '@mifos/api-client';
import type {
  CreateClientFixedDepositAccountInput,
  CreateClientRecurringDepositAccountInput,
  CreateClientSavingsAccountInput
} from '@mifos/validation';
import { CLIENT_DEPOSIT_ACCOUNT_CONFIG } from '@/lib/fineract/client-deposit-account-config';
import { normalizeClientDepositAccountTemplate } from '@/lib/fineract/client-deposit-account-normalize';
import { createFineractClient } from '@/lib/fineract/create-client';
import {
  buildFixedDepositAccountPayload,
  buildRecurringDepositAccountPayload,
  buildSavingsAccountPayload
} from '@/lib/fineract/client-deposit-account-payload';
import { getDepositProduct } from '@/lib/fineract/deposit-products';
import { getSavingsProduct } from '@/lib/fineract/savings-products';

function depositProductKindForAccount(
  kind: ClientDepositAccountKind
): DepositProductKind | null {
  if (kind === 'fixedDeposit') {
    return 'fixed';
  }
  if (kind === 'recurringDeposit') {
    return 'recurring';
  }
  return null;
}

async function loadProductAvailabilityDates(
  kind: ClientDepositAccountKind,
  productId: string | number
): Promise<Pick<ClientDepositAccountTemplate, 'startDate' | 'closeDate'>> {
  try {
    if (kind === 'savings') {
      const product = await getSavingsProduct(productId);
      return { startDate: product.startDate, closeDate: product.closeDate };
    }
    const depositKind = depositProductKindForAccount(kind);
    if (!depositKind) {
      return {};
    }
    const product = await getDepositProduct(depositKind, productId);
    return { startDate: product.startDate, closeDate: product.closeDate };
  } catch {
    return {};
  }
}

export async function getClientDepositAccountTemplate(
  kind: ClientDepositAccountKind,
  clientId: string | number,
  productId?: string | number
): Promise<ClientDepositAccountTemplate> {
  const fineract = await createFineractClient();
  const { apiPath } = CLIENT_DEPOSIT_ACCOUNT_CONFIG[kind];
  const params: Record<string, string> = { clientId: String(clientId) };
  if (productId != null && String(productId).trim() !== '') {
    params.productId = String(productId);
  }
  const raw = await fineract.get<unknown>(`${apiPath}/template`, params);
  const template = normalizeClientDepositAccountTemplate(raw);
  if (productId == null || String(productId).trim() === '') {
    return template;
  }
  if (template.startDate || template.closeDate) {
    return template;
  }
  const availability = await loadProductAvailabilityDates(kind, productId);
  return { ...template, ...availability };
}

export async function createClientSavingsAccountRecord(
  clientId: string | number,
  input: CreateClientSavingsAccountInput
): Promise<CreateClientDepositAccountResponse> {
  const fineract = await createFineractClient();
  const payload = buildSavingsAccountPayload(clientId, input);
  return fineract.post<CreateClientDepositAccountResponse>(
    CLIENT_DEPOSIT_ACCOUNT_CONFIG.savings.apiPath,
    payload
  );
}

export async function createClientFixedDepositAccountRecord(
  clientId: string | number,
  input: CreateClientFixedDepositAccountInput
): Promise<CreateClientDepositAccountResponse> {
  const fineract = await createFineractClient();
  const payload = buildFixedDepositAccountPayload(clientId, input);
  return fineract.post<CreateClientDepositAccountResponse>(
    CLIENT_DEPOSIT_ACCOUNT_CONFIG.fixedDeposit.apiPath,
    payload
  );
}

export async function createClientRecurringDepositAccountRecord(
  clientId: string | number,
  input: CreateClientRecurringDepositAccountInput
): Promise<CreateClientDepositAccountResponse> {
  const fineract = await createFineractClient();
  const payload = buildRecurringDepositAccountPayload(clientId, input);
  return fineract.post<CreateClientDepositAccountResponse>(
    CLIENT_DEPOSIT_ACCOUNT_CONFIG.recurringDeposit.apiPath,
    payload
  );
}

export async function createClientDepositAccountRecord(
  kind: ClientDepositAccountKind,
  clientId: string | number,
  input:
    | CreateClientSavingsAccountInput
    | CreateClientFixedDepositAccountInput
    | CreateClientRecurringDepositAccountInput
): Promise<CreateClientDepositAccountResponse> {
  switch (kind) {
    case 'savings':
      return createClientSavingsAccountRecord(clientId, input as CreateClientSavingsAccountInput);
    case 'fixedDeposit':
      return createClientFixedDepositAccountRecord(
        clientId,
        input as CreateClientFixedDepositAccountInput
      );
    case 'recurringDeposit':
      return createClientRecurringDepositAccountRecord(
        clientId,
        input as CreateClientRecurringDepositAccountInput
      );
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
